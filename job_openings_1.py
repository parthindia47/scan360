# naukri_company_jobs.py
import time
import json
import math
from typing import List, Dict, Any, Optional
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from playwright.sync_api import sync_playwright
from urllib.parse import urlencode

'''

https://www.naukri.com/jobapi/v3/search?noOfResults=20&urlType=search_by_company_id&searchType=groupsearch&companyName=1point1&companyId=1366438&pageNo=1&seoKey=1point1-jobs-careers-1366438&src=directSearch&latLong=12.958184_77.6421466


'''


BASE_URL = "https://www.naukri.com/jobapi/v3/search"

# Minimal headers that typically work for this endpoint.
# Do NOT include your personal cookies here.
DEFAULT_HEADERS = {
    "accept": "application/json",
    "content-type": "application/json",
    "appid": "109",
    "clientid": "d3skt0p",
    "systemid": "Naukri",
    # A referer that matches the company's SEO page helps reduce 403s.
    # We'll generate it from the company name + id below.
    # "referer": f"https://www.naukri.com/<seoKey>",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/119.0.0.0 Safari/537.36",
}


def _make_session() -> requests.Session:
    """Session with retries & backoff for 429/5xx."""
    s = requests.Session()
    retries = Retry(
        total=5,
        backoff_factor=0.6,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
        raise_on_status=False,
    )
    s.mount("https://", HTTPAdapter(max_retries=retries))
    return s
  
def print_job_summary(data: dict):
    """Print total number of jobs and functional area summary."""
    try:
        no_of_jobs = data.get("noOfJobs", 0)
        print(f"\nTotal Jobs: {no_of_jobs}\n")

        functional_areas = data.get("clusters", {}).get("functionalAreaGid", [])
        if not functional_areas:
            print("No functional area data found.")
            return

        print("Functional Areas:")
        for fa in functional_areas:
            label = fa.get("label", "")
            count = fa.get("count", 0)
            print(f"  - {label}: {count}")

    except Exception as e:
        print(f"[WARN] Failed to print summary: {e}")


def fetch_naukri_company_jobs(
    company_name: str,
    company_id: int,
    pages: int = 1,                # not used for navigation now; just for compatibility
    results_per_page: int = 20,    # not required; the site decides what it loads
    lat: Optional[float] = None,   # unused in this capture approach
    lon: Optional[float] = None,   # unused
    sleep_between: float = 0.8,    # unused
    headless: bool = False,        # keep visible so you can interact
) -> List[Dict[str, Any]]:

    seo_key = f"{company_name}-jobs-careers-{company_id}"
    start_url = f"https://www.naukri.com/{seo_key}"
    all_jobs: List[Dict[str, Any]] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless)
        context = browser.new_context()
        page = context.new_page()

        # Warm-up to set cookies/consent
        page.goto("https://www.naukri.com/", wait_until="domcontentloaded")
        page.wait_for_timeout(600)

        # Go to the company SEO page (the one you normally open)
        page.goto(start_url, wait_until="domcontentloaded")

        print("\n✅ Browser is open on the company page.")
        print("👉 Scroll the page, click 'Next' pagination or filters to load jobs.")
        print("   Each time the site calls /jobapi/v3/search we will capture it.")
        print("   When you're done paginating, press Enter here to finish.\n")

        # Listen and accumulate real page XHR responses to /jobapi/v3/search
        def on_response(resp):
            try:
                url = resp.url
                if "/jobapi/v3/search" in url:
                    if resp.status == 200:
                        body = resp.json()
                        print_job_summary(body)
                        jobs = body.get("jobDetails") or body.get("jobs") or body.get("data") or []
                        # Sometimes jobs are under data.jobDetails
                        if not jobs and isinstance(body.get("data"), dict):
                            maybe = body["data"].get("jobDetails") or body["data"].get("jobs")
                            if maybe:
                                jobs = maybe
                        if isinstance(jobs, list):
                            all_jobs.extend(jobs)
                            print(f"… captured {len(jobs)} jobs from {url.split('?')[0]}")
                        else:
                            print("… received non-list jobs payload; skipping")
                    else:
                        # If the site ever challenges mid-run, it would show here
                        print(f"… got status {resp.status} for {url}")
            except Exception as e:
                print(f"[on_response] parse error: {e}")

        page.on("response", on_response)

        # Give you control to interact; press Enter to stop capture
        try:
            input()
        except EOFError:
            pass

        # Optional: store cookies/state so next run starts trusted
        context.storage_state(path=f"naukri_{company_id}_state.json")
        browser.close()

    # Deduplicate by jobId if present
    seen = set()
    unique_jobs = []
    for j in all_jobs:
        jid = j.get("jobId") or j.get("jobIdEncrypted") or j.get("jobIdNumeric") or json.dumps(j, sort_keys=True)
        if jid in seen:
            continue
        seen.add(jid)
        unique_jobs.append(j)

    return unique_jobs

def pick_fields(j: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract a clean subset of fields that are frequently present.
    Adjust as needed after you inspect a sample response.
    """
    return {
        "title": j.get("title") or j.get("jobTitle"),
        "companyName": j.get("companyName"),
        "companyId": j.get("companyId"),
        "location": j.get("placeholders", [{}])[0].get("label") if isinstance(j.get("placeholders"), list) else j.get("location"),
        "experience": j.get("placeholders", [{}])[1].get("label") if isinstance(j.get("placeholders"), list) and len(j.get("placeholders")) > 1 else None,
        "salary": j.get("placeholders", [{}])[2].get("label") if isinstance(j.get("placeholders"), list) and len(j.get("placeholders")) > 2 else None,
        "tags": j.get("tags"),
        "postedBy": j.get("recruiterName") or j.get("ownerName"),
        "jdURL": j.get("jdURL") or j.get("jdUrl") or j.get("url"),
        "created": j.get("createdDate") or j.get("createdAt") or j.get("pubDate"),
        "source": j.get("source"),
        "jobId": j.get("jobId") or j.get("jobIdEncrypted") or j.get("jobIdNumeric"),
    }

if __name__ == "__main__":
    company = "1point1"
    company_id = 1366438

    jobs = fetch_naukri_company_jobs(
        company_name=company,
        company_id=company_id,
        headless=False,
    )

    cleaned = [pick_fields(j) for j in jobs]
    print(f"\nFetched {len(jobs)} jobs (unique).")

    with open(f"{company_id}_raw.json", "w", encoding="utf-8") as f:
        json.dump(jobs, f, ensure_ascii=False, indent=2)
    with open(f"{company_id}_clean.json", "w", encoding="utf-8") as f:
        json.dump(cleaned, f, ensure_ascii=False, indent=2)

    for row in cleaned[:5]:
        print(row)

