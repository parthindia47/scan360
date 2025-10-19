# naukri_company_jobs.py
import time
import json
import math
from typing import List, Dict, Any, Optional

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


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


def fetch_naukri_company_jobs(
    company_name: str,
    company_id: int,
    pages: int = 1,
    results_per_page: int = 20,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    sleep_between: float = 0.8,
) -> List[Dict[str, Any]]:
    """
    Fetch job listings from Naukri's job search API for a specific company.

    Args:
        company_name: For SEO key & query (e.g., "1point1")
        company_id: Company ID from Naukri (e.g., 1366438)
        pages: How many pages to fetch
        results_per_page: noOfResults param (default 20)
        lat, lon: Optional lat/long to include (matches your captured call)
        sleep_between: polite delay between pages

    Returns:
        A list of job dicts (raw JSON items from the API).
    """
    session = _make_session()

    # Build an SEO-ish key similar to what you captured:
    seo_key = f"{company_name}-jobs-careers-{company_id}"

    headers = DEFAULT_HEADERS.copy()
    headers["referer"] = f"https://www.naukri.com/{seo_key}"

    all_jobs: List[Dict[str, Any]] = []

    for page_no in range(1, pages + 1):
        params = {
            "noOfResults": results_per_page,
            "urlType": "search_by_company_id",
            "searchType": "groupsearch",
            "companyName": company_name,
            "companyId": str(company_id),
            "pageNo": str(page_no),
            "seoKey": seo_key,
            "src": "directSearch",
        }

        # Optional lat/long (as per your capture)
        if lat is not None and lon is not None:
            params["latLong"] = f"{lat}_{lon}"

        resp = session.get(BASE_URL, headers=headers, params=params, timeout=20)
        if resp.status_code == 403:
            raise RuntimeError(
                "Got 403 (Forbidden). Naukri may be blocking the request. "
                "Try running from a browser-like environment, keep headers minimal, "
                "add a short delay, or fetch fewer pages."
            )
        if resp.status_code != 200:
            raise RuntimeError(f"HTTP {resp.status_code}: {resp.text[:400]}")

        data = resp.json()

        # Naukri responses commonly have a 'jobDetails' list (name can vary).
        # We'll try a few likely keys and then fall back to flatten everything we find.
        jobs_list = (
            data.get("jobDetails")
            or data.get("jobs")
            or data.get("data")
            or []
        )

        # Some responses put the results under data["jobDetails"]
        if not jobs_list and isinstance(data.get("data"), dict):
            maybe = data["data"].get("jobDetails") or data["data"].get("jobs")
            if maybe:
                jobs_list = maybe

        # If everything fails, just store the raw page for inspection
        if not isinstance(jobs_list, list):
            jobs_list = []

        all_jobs.extend(jobs_list)

        # Polite delay
        if page_no < pages:
            time.sleep(sleep_between)

    return all_jobs


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
    # Example: your captured request was for:
    # companyName=1point1, companyId=1366438
    company = "1point1"
    company_id = 1366438

    # How many pages to pull (20 results/page)
    pages_to_fetch = 2

    jobs = fetch_naukri_company_jobs(
        company_name=company,
        company_id=company_id,
        pages=pages_to_fetch,
        results_per_page=20,
        # lat=12.958184, lon=77.6421466,  # optionally include
    )

    # Keep both: a compact TSV and the full JSON for debugging.
    cleaned = [pick_fields(j) for j in jobs]

    print(f"Fetched {len(jobs)} jobs.")
    # Save raw
    with open(f"{company_id}_raw.json", "w", encoding="utf-8") as f:
        json.dump(jobs, f, ensure_ascii=False, indent=2)

    # Save cleaned
    with open(f"{company_id}_clean.json", "w", encoding="utf-8") as f:
        json.dump(cleaned, f, ensure_ascii=False, indent=2)

    # Pretty print a few
    for row in cleaned[:5]:
        print(row)
