import feedparser
import requests
from urllib.parse import quote_plus
from urllib.parse import urlparse, unquote
from bs4 import BeautifulSoup
import time
from datetime import datetime, timedelta, timezone
import pandas as pd
import re
import os
import hashlib
import html
import unicodedata
import math
from curl_cffi import requests as cffireq


'''
1. Moneycontrol
2. Economic Times - Markets
3. Business Standard
4. LiveMint
5. Reuters India
6. [NSE/BSE websites (announcements/news)]
7. [Google News RSS for specific companies]

Use APIs (If available) Some options:

1. GNews API
2. NewsData.io
3. Bing News Search API
4. Google Custom Search API (for paid quota)

Event calendar:
https://zerodha.com/markets/calendar/
https://web.sensibull.com/stock-market-calendar/economic-calendar

pulse:
https://pulse.zerodha.com/

https://www.newscatcherapi.com/blog/google-news-rss-search-parameters-the-missing-documentaiton

currently implemented scrappers:
1. Sensibull
2. Cogencis
3. Google

'''

headers = {"User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36'}

# ==========================================================================
# ============================  Fetch Function =============================
'''
returns the response of given url
should pass base/first urls which "do not need cookies" to access.
'''
def fetchUrl(url, headers=None, payload=None):
    print("Fetching Base URL : ",url)
    try:
        # Send a GET request to the URL to download the JSON content
        response = requests.get(url,headers=headers)
        
        # Check if the request was successful (status code 200)
        if response.status_code == 200:
          return response
        else:
            print("Failed to fetch. Status code: ", response.status_code)
    except Exception as e:
        print("An error occurred: ", e)
        
def fetchPostJson(url, cookies=None, payload=None):
    print("Fetching JSON Object : ", url)
    try:
        # Send a GET request to the URL to download the JSON content
        #print("Cookies Type:", type(cookies))
        # for i, cookie in enumerate(cookies):
        #     print(f"Cookie {i}: type={type(cookie)}, value={cookie}")

        if cookies:
          headers["Cookie"] = '; '.join([f"{k}={v}" for k, v in cookies.items()])
        response = requests.post(url, headers=headers, json=payload)
        
        # Check if the request was successful (status code 200)
        if response.status_code == 200:
            # Parse the JSON content
            jsonData = response.json()
            return jsonData
        else:
            print("Failed to download JSON. Status code: ", response.status_code)
    except Exception as e:
        print("An error occurred: ", e)

def fetchGetJson(url, headers=None, cookies=None, payload=None):
    print("Fetching JSON Object : " + url)
    try:
        # Send a GET request to the URL to download the JSON content
        #print("Cookies Type:", type(cookies))
        # for i, cookie in enumerate(cookies):
        #     print(f"Cookie {i}: type={type(cookie)}, value={cookie}")
        if cookies:
          headers["Cookie"] = '; '.join([f"{k}={v}" for k, v in cookies.items()])
        response = requests.get(url, headers=headers)
        
        # Check if the request was successful (status code 200)
        if response.status_code == 200:
            # Parse the JSON content
            jsonData = response.json()
            return jsonData
        else:
            print("Failed to download JSON. Status code: ", response.status_code)
    except Exception as e:
        print("An error occurred: ", e)


# ==========================================================================
# ============================  sensiBull Events ===========================
def sensiBullDataScrapper(urlType,fromDate=None,toDate=None):
  baseUrls = {
      "economicCalender":"https://web.sensibull.com/stock-market-calendar/economic-calendar" ,
      "resultCalender":"https://web.sensibull.com/stock-market-calendar/stock-results-calendar",
  }
  
  jsonUrls = {
      "economicCalender":"https://oxide.sensibull.com/v1/compute/market_global_events",
      "resultCalender":"https://oxide.sensibull.com/v1/compute/market_stock_events",
  }
  payload = {}

  if fromDate and toDate:
      # Convert datetime to string in YYYY-MM-DD format
      from_date_str = fromDate.strftime('%Y-%m-%d')
      to_date_str = toDate.strftime('%Y-%m-%d')
    
      payload = {
          "countries": [],
          "impacts": [],
          "from_date": from_date_str,
          "to_date": to_date_str
      }
  
  # First, get response from the main URL to fetch cookies
  response = fetchUrl(url=baseUrls[urlType])
  print(response)
  jsonObj = fetchPostJson(jsonUrls[urlType], response.cookies, payload)
  # print(jsonObj)
  return jsonObj


# ==========================================================================
# ============================  cogencis ===================================
'''
Latest News:
https://data.cogencis.com/api/v1/web/news/stories?pageNo=1&pageSize=16

Global News:
https://data.cogencis.com/api/v1/web/news/stories?subSections=global-news&isWebNews=true&forWebSite=true&pageNo=1&pageSize=16

Market News:
https://data.cogencis.com/api/v1/web/news/stories?subSections=market-news&isWebNews=true&forWebSite=true&pageNo=1&pageSize=16

Top News:
https://data.cogencis.com/api/v1/web/news/stories?subSections=top-news&isWebNews=true&forWebSite=true&pageNo=1&pageSize=16

corporate News:
https://data.cogencis.com/api/v1/web/news/stories?subSections=corporate-news&isWebNews=true&forWebSite=true&pageNo=1&pageSize=16

earning New:
https://data.cogencis.com/api/v1/web/news/stories?subSections=earnings-news&isWebNews=true&forWebSite=true&pageNo=1&pageSize=16

Individual Stock News:
https://data.cogencis.com/api/v1/web/news/stories?sWebNews=true&forWebSite=true&pageNo=1&pageSize=20&isins=ine002a01018

IPO News:
https://data.cogencis.com/api/v1/web/news/stories?subSections=ipo-news&isWebNews=true&forWebSite=true&pageNo=1&pageSize=16

Trending News:
https://data.cogencis.com/api/v1/web/news/stories?subSections=trending-news&isWebNews=true&forWebSite=true&pageNo=1&pageSize=16

Other:
https://data.cogencis.com/api/v1/web/news/stories?subSections=others&isWebNews=true&forWebSite=true&pageNo=1&pageSize=16

Industry News:
https://data.cogencis.com/api/v1/web/news/stories?subSections=industry-news&isWebNews=true&forWebSite=true&pageNo=1&pageSize=16

Mutual fund News:
https://data.cogencis.com/api/v1/web/news/stories?subSections=mutual-fund-news&isWebNews=true&forWebSite=true&pageNo=1&pageSize=16

Municipal Bonds:
https://data.cogencis.com/api/v1/web/news/stories?subSections=municipal-bonds&isWebNews=true&forWebSite=true&pageNo=1&pageSize=16

'''
def getCogencisToken():
  with open("stock_info\\token\\congnis_token.txt", "r") as file:
      content = file.read()
  
  #print(content)
  return content

def getCogencisJsonUrl(urlType,isins=None, pageNo=1, pageSize=20):
  subSectionsList = {
    "global-news":"global-news",
    "market-new":"market-new",
    "top-news":"top-news",
    "corporate-news":"corporate-news",
    "earnings-news":"earnings-news",
    "ipo-news":"ipo-news",
    "trending-news":"trending-news",
    "others":"others",
    "industry-news":"industry-news",
    "mutual-fund-news":"mutual-fund-news",
    "municipal-bonds":"municipal-bonds",
    "individual-stock":None,
    "latest-news":None
  }
  
  isWebNews=True
  forWebsite=True
  
  baseUrl = "https://data.cogencis.com/api/v1/web/news/stories?"
  subSection = subSectionsList[urlType]
  
  if subSection:
    baseUrl += f"subSections={subSection}"
    
  if isWebNews:
    baseUrl += f"&isWebNew=true"
    
  if forWebsite:
    baseUrl += f"&forWebSite=true"
    
  if pageNo:
    baseUrl += f"&pageNo={pageNo}"

  if pageSize:
    baseUrl += f"&pageSize={pageSize}"
    
  if isins:
    baseUrl += f"&isins={isins}"
    
  return baseUrl
  
def cogencisDataScrapper(urlType,isins=None, pageNo=1, pageSize=20):
  baseUrl = "https://iinvest.cogencis.com/"
  
  headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "Origin": "https://iinvest.cogencis.com",
      "Referer": "https://iinvest.cogencis.com/"
  }

  # First, get response from the main URL to fetch cookies
  response = fetchUrl(url=baseUrl, headers=headers)
  # print(response)
  # print(response.cookies)
  authToken = getCogencisToken()
  headers["Authorization"] = authToken
  jsonUrl = getCogencisJsonUrl(urlType,isins=isins, pageNo=pageNo, pageSize=pageSize)
  jsonObj = fetchGetJson(url=jsonUrl, headers=headers, cookies=response.cookies)
  return jsonObj
  
def testCogencisScrapper():

  #individual stock
  #news_data = cogencisDataScrapper("individual-stock", isins="INE002A01018")

  #latest news
  #news_data = cogencisDataScrapper("latest-news")

  #ipo news
  #news_data = cogencisDataScrapper("ipo-news")

  #global news
  news_data = cogencisDataScrapper("global-news")


  stories = news_data.get("response", {}).get("data", [])
  for story in stories:
      headline = story.get("headline", "N/A")
      time = story.get("sourceDateTime", "N/A")
      source = story.get("sourceName", "N/A")
      link = story.get("sourceLink", "N/A")
      print(f"{time} |  {headline} | {link} ({source})\n")
      
# ==========================================================================
# ============================  Google RSS =================================
def fetch_google_rss_news(query, language="en", country="IN"):
    ceid = f"{country}:{language}"
    rss_url = f"https://news.google.com/rss/search?q={query.replace(' ', '+')}&hl={language}-{country}&gl={country}&ceid={ceid}"
    feed = feedparser.parse(rss_url)

    if not feed.entries:
        return pd.DataFrame(), []

    sorted_entries = sorted(
        feed.entries,
        key=lambda entry: datetime.strptime(entry.published, "%a, %d %b %Y %H:%M:%S %Z")
    )

    data = []
    for entry in sorted_entries:
        data.append({
            "title": entry.title,
            "link": entry.link,
            "published": entry.published,
            "source": entry.source.href if hasattr(entry, 'source') else None
        })

    df = pd.DataFrame(data)
    return df, data  # You can choose to use the DataFrame or the JSON-like list
      
def get_redirected_url(initial_url, headless=True):
    download_dir = r"C:\temp"
    chrome_options = Options()
    if headless:
      chrome_options.add_argument("--headless=new")  # Chrome 109+ requires `new`
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    chrome_options.add_experimental_option("prefs", {
        "download.default_directory": download_dir,
        "download.prompt_for_download": False,
        "download.directory_upgrade": True,
        "safebrowsing.enabled": True
    })

    # Start the browser
    driver = webdriver.Chrome(options=chrome_options)

    try:
        driver.get(initial_url)
        time.sleep(5)  # wait for redirection to complete
        final_url = driver.current_url
        print("final_url : " + final_url)
    finally:
        
        driver.quit()

    return final_url
      
def google_search(query: str, num_results: int = 5):
    urls = list(search(query, num=num_results))

    df = pd.DataFrame(urls, columns=["URL"])
    json_result = df.to_dict(orient="records")  # JSON-compatible list of dicts

    return df, json_result

def _normalize_title(text: str) -> str:
    if not isinstance(text, str):
        return ""
    s = html.unescape(text)

    # Replace smart quotes/apostrophes with plain ones
    s = (s.replace("’", "'").replace("‘", "'")    # curly apostrophes
           .replace("“", '"').replace("”", '"'))  # curly double quotes

    # Remove trademark-like symbols and zero-width marks
    s = (s.replace("\u200B", "")  # zero-width space
           .replace("\uFEFF", "")) # zero-width no-break space

    # Unicode normalize + strip diacritics (é -> e)
    s = unicodedata.normalize("NFKD", s)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")

    # Collapse whitespace
    s = re.sub(r"\s+", " ", s).strip()

    return s


def _find_col(df: pd.DataFrame, target: str) -> str:
    """Find column by case-insensitive exact match."""
    target = target.lower()
    for c in df.columns:
        if c.lower() == target:
            return c
    raise KeyError(f"Column '{target}' not found in: {list(df.columns)}")


def _hash_title(title: str) -> str:
    norm = _normalize_title(title)
    return hashlib.sha256(norm.encode("utf-8")).hexdigest() if norm else None


def _safe_symbol_basename(symbol: str) -> str:
    base = (symbol or "").strip()
    if base.endswith(".NS"):
        base = base[:-3]
    # sanitize a bit for filesystem
    return base.replace("/", "_").replace("\\", "_").strip() or "UNKNOWN"

def is_missing(val):
    if val is None:
        return True
    if isinstance(val, float) and math.isnan(val):
        return True
    if str(val).strip() == "":
        return True
    return False

def update_stock_news_feeds(
    info_csv_path: str = "stock_info/yFinStockInfo_NSE.csv",
    out_dir: str = "stock_news_feed",
    language: str = "en",
    country: str = "IN",
    partial = False,
    limit_per_symbol = None,  # optional: cap items per symbol from RSS
):
    """
    Reads the stock info file, fetches Google RSS per longName (if tjiIndustry not N/NEW),
    and writes/updates per-symbol CSVs in out_dir with duplicate prevention via title_hash.
    Returns list of symbols where longName was empty.
    """
    os.makedirs(out_dir, exist_ok=True)
    info_df = pd.read_csv(info_csv_path)

    # Resolve columns case-insensitively
    col_symbol = _find_col(info_df, "symbol")
    col_long   = _find_col(info_df, "longname")
    col_ind    = _find_col(info_df, "tjiindustry")
    col_quote  = _find_col(info_df, "quoteType")

    missing_longname_symbols = []

    # Normalize industry filter values
    def _is_blocked_industry(val) -> bool:
        if pd.isna(val):
            return False
        s = str(val).strip().upper()
        return s in {"N", "NEW"}

    def _try_parse(dt):
        try:
            return datetime.strptime(dt, "%a, %d %b %Y %H:%M:%S %Z")
        except Exception:
            return None

    for _, row in info_df.iterrows():
        symbol = str(row[col_symbol]).strip() if not pd.isna(row[col_symbol]) else ""
        tji_ind = row[col_ind] if col_ind in row else None
        long_name_val = row[col_long] if col_long in row else None
        quote_type = row[col_quote] if col_quote in row else None
        
        #print(quote_type)

        # Skip blocked industries
        if _is_blocked_industry(tji_ind):
            continue
          
        # Handle empty/NaN longName
        if is_missing(long_name_val):
            missing_longname_symbols.append(symbol)
            print(f"[INFO] Missing longName for symbol: {symbol}")
            continue

        long_name = str(long_name_val).strip()
        if not long_name:
            missing_longname_symbols.append(symbol)
            print(f"[INFO] Missing longName for symbol: {symbol}")
            continue
        
        # Output file per symbol (without .NS)
        base = _safe_symbol_basename(symbol)
        out_path = os.path.join(out_dir, f"{base}.csv")
        
        if partial and os.path.exists(out_path):
          continue

        # Fetch news
        try:
            rss_df, _ = fetch_google_rss_news(long_name, language=language, country=country)
            time.sleep(5)  # be polite
        except Exception as e:
            print(f"[WARN] RSS fetch failed for {symbol} ({long_name}): {e}")
            continue

        if rss_df.empty:
            print(f"[INFO] No RSS entries for {symbol} ({long_name}).")
            continue

        # Ensure expected columns exist
        for col in ["title", "link", "published", "source"]:
            if col not in rss_df.columns:
                rss_df[col] = None

        # Optionally limit entries per symbol (after we have all cols)
        if isinstance(limit_per_symbol, int) and limit_per_symbol > 0:
            rss_df = rss_df.tail(limit_per_symbol)

        # Add hash + metadata
        rss_df = rss_df.copy()
        rss_df["title"] = rss_df["title"].apply(_normalize_title)
        rss_df["title_hash"] = rss_df["title"].apply(_hash_title)
        rss_df["symbol"] = symbol
        rss_df["longName"] = long_name
        rss_df["fetched_at"] = datetime.now().isoformat(timespec="seconds")

        if os.path.exists(out_path):
            # Merge path: read existing and dedupe after concat
            try:
                existing = pd.read_csv(out_path)
            except Exception as e:
                print(f"[WARN] Failed reading existing CSV for {symbol} at {out_path}: {e}")
                existing = pd.DataFrame()

            # Ensure existing has title_hash (compute if missing)
            if not existing.empty:
                if "title_hash" not in existing.columns and "title" in existing.columns:
                    existing = existing.copy()
                    existing["title_hash"] = existing["title"].apply(_hash_title)
                elif "title_hash" not in existing.columns:
                    existing["title_hash"] = None

            combined = pd.concat([existing, rss_df], ignore_index=True)

            # Drop duplicates by title_hash
            if "title_hash" in combined.columns:
                combined = combined.drop_duplicates(subset=["title_hash"], keep="first")
            else:
                # Fallback only if title_hash truly missing (shouldn't happen)
                dedup_keys = [c for c in ["title", "link"] if c in combined.columns]
                if dedup_keys:
                    combined = combined.drop_duplicates(subset=dedup_keys, keep="first")

            # Sort by published (when parseable) then fetched_at
            if "published" in combined.columns:
                combined["_order"] = combined["published"].apply(_try_parse)
                combined = combined.sort_values(by=["_order", "fetched_at"] if "fetched_at" in combined.columns else ["_order"],
                                                ascending=[True, True] if "fetched_at" in combined.columns else [True])
                combined = combined.drop(columns=["_order"])

            combined.to_csv(out_path, index=False, encoding="utf-8-sig")
            print(f"[OK] Updated: {out_path} (rows={len(combined)})")

        else:
            # FIRST WRITE path: dedupe within rss_df itself before saving
            # (This fixes your issue #1)
            deduped = rss_df.drop_duplicates(subset=["title_hash"], keep="first").copy()
            deduped["_order"] = deduped["published"].apply(_try_parse)

            deduped = deduped.sort_values(by=["_order", "fetched_at"], ascending=[True, True]).drop(columns=["_order"])
            deduped.to_csv(out_path, index=False, encoding="utf-8-sig")
            print(f"[OK] Created: {out_path} (rows={len(deduped)})")
    
    print(missing_longname_symbols)       
    

# ==========================================================================
# ============================  Grow IPOs =================================

def getGrowJsonUrl(urlType):
  sectionsList = {
    "openIpo":"open",
    "upcomingIpo":"upcoming",
    "closedIpo":"closed",
  }
  
  baseUrl = "https://groww.in/v1/api/primaries/v1/ipo/"
  section = sectionsList[urlType]
  
  if section:
    baseUrl += f"{section}"
    
  return baseUrl
  
  
'''
https://groww.in/v1/api/primaries/v1/ipo/open
https://groww.in/v1/api/primaries/v1/ipo/upcoming
https://groww.in/v1/api/primaries/v1/ipo/closed

'''
def growIpoDataScrapper(urlType):
  baseUrl = "https://groww.in/ipo"
  
  headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "Origin": "https://groww.in/ipo",
      "Referer": "https://groww.in/ipo"
  }

  # First, get response from the main URL to fetch cookies
  response = fetchUrl(url=baseUrl, headers=headers)
  # print(response)
  # print(response.cookies)
  # authToken = getCogencisToken()
  #headers["Authorization"] = authToken
  #jsonUrl = getCogencisJsonUrl(urlType,isins=isins, pageNo=pageNo, pageSize=pageSize)
  jsonUrl = getGrowJsonUrl(urlType)
  jsonObj = fetchGetJson(url=jsonUrl, headers=headers, cookies=response.cookies)
  return jsonObj

def testGrowScrapper():
  resp = growIpoDataScrapper("openIpo")
  print(resp)

  resp = growIpoDataScrapper("upcomingIpo")
  print(resp)
  
  resp = growIpoDataScrapper("closedIpo")
  print(resp)
  

#google_rss_feed_example()
# get_redirected_url("https://news.google.com/rss/articles/CBMi2wFBVV95cUxPR0tSSHdwcTRzMUpiTUV0aFFIcE5hYU5xSlh6c3YzUUdOZHBSUktiWU4xeGtSNzFScE5ndGVRRHMybHJOMkJDUkpJWElYVC12MTZ6alJaMzFFS3ZOTXpLTnJ1QTRfdEhUbjJRWnFrT1E5SkFLTzJMYXNyQjBodFJuYW9vNERkM3lMWUhzR2hZWGQ5R3E5V1pCZjBvemFRbElqUzhfMFRPSjJGNU93M2tSQnNBbWJvelJNbWNOTzFUM21yUVFRQ2dXd3JTNW55cTdvcmh0T1NaVjVBc2c?oc=5", True)

# ==========================================================================
# ============================  SCRIPT RUN =================================

# fromDate = datetime(2025, 5, 28)
# toDate = datetime(2025, 6, 2)
# resp = sensiBullDataScrapper(urlType="economicCalender")
# print(resp["payload"]["data"])

# Example usage:
# df, json_data = fetch_google_rss_news("Premier Energies Limited")
# print(json_data)

# url = "https://news.google.com/rss/articles/CBMizgFBVV95cUxNNndidkN3MEdXSUhwUXRTclJQRjlQZ1EwdmFFc3laWWhzRVhyT3pHWHFlczFtQTU3d1pRb1Y3UExpdnlXd1FuNVFfai1FSDNXVHJObE5sYS1tT1AyQVd4elphNGRpM1pDMnkyWHA3elV0ZXhSZUJRTUtXU3NONm5vVTdVTEJ4YUUycFNHalJBSEx4U0Rra29KWEJYb2Q0M28weVhzb1ZRcTRiZlhYcVhOQ29aTHFCa0lvc1lqNWUzNE5aeGpONnBCRkRXeS14d9IB0wFBVV95cUxQVERNbGMyTzJYeFNfTnk5bV9nQTJnT05kbjN4TXdLNkg1T2JERDBhU0lUSlN4NlY4TUdMV0FjeEFuZ0oyb0hUTG02ZnA3U2FpQmxhYzNUX2ppdEJKTVZraHNXNzhTNmpSNzdLNE9BNkYzaEo0ejVPczRsTUV1a3FsZVpSREZtd2I1WnZza2NQX0dsUS13OU56bXdscFI5UmQxVkVXbTdTaTNYeVUxQnpBYWhJN19iOXJneGRaUFNhWTAwUzctcGw2YXl0djh4Qmd0MFF3?oc=5"
# resp = get_redirected_url(url)
# print(resp)

# df, json_obj = google_search('site:business-standard.com "Welspun"', num_results=5)
# print(df)

# https://gist.github.com/stungeye/fe88fc810651174d0d180a95d79a8d97

stock_news = {
  "Zee Business":{
    "rss_home": "https://www.zeebiz.com/rss",
    "feeds": { 
      "companies": "https://www.zeebiz.com/companies.xml",
    }
  },
  "Business Standard":{
    "rss_home": "https://www.business-standard.com/rss-feeds/listing",
    "feeds": { 
      "markets": "https://www.business-standard.com/rss/markets-106.rss",
      "markets-news" : "https://www.business-standard.com/rss/markets/stock-market-news-10618.rss"
    }
  },
  "Economic Times":{
    "rss_home": "https://economictimes.indiatimes.com/rss.cms",
    "feeds": { 
      "economy": "https://economictimes.indiatimes.com/rssfeeds/1373380682.cms",
      "markets": "https://economictimes.indiatimes.com/prime/money-and-markets/rssfeeds/62511286.cms",
      "stocks": "https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms"
    }
  },
  "The Hindu Business Line":{
    "rss_home": "https://www.thehindubusinessline.com/rssfeeds/",
    "feeds": { 
      "economy": "https://www.thehindubusinessline.com/economy/feeder/default.rss",
      "markets": "https://www.thehindubusinessline.com/markets/feeder/default.rss",
      "stocks": "https://www.thehindubusinessline.com/markets/stock-markets/feeder/default.rss"
    }
  },
  "LiveMint":{
    "rss_home": "https://www.livemint.com/rss",
    "feeds": {
      "markets":"https://www.livemint.com/rss/markets",
      "companies": "https://www.livemint.com/rss/companies",
      "money": "https://www.livemint.com/rss/money"
    }
  },
  "CNBC TV18":{
    "rss_home": "https://www.cnbctv18.com/rss/",
    "feeds": {
      "economy": "https://www.cnbctv18.com/commonfeeds/v1/cne/rss/economy.xml",
      "markets": "https://www.cnbctv18.com/commonfeeds/v1/cne/rss/market.xml"
    }
  },
  "TOI":{
    "rss_home": "https://timesofindia.indiatimes.com/rss.cms",
    "feeds": {
      "markets": "https://timesofindia.indiatimes.com/rssfeeds/1898055.cms"
    }
  },
  "Equity Pandit":{
    "rss_home": "https://www.equitypandit.com/category/latest-news/feed/",
    "feeds": {
      "feed": "https://www.equitypandit.com/category/latest-news/feed/"
    }
  },
  "Alpha Ideas":{
    "rss_home": "https://alphaideas.in/feed/",
    "feeds": {
      "feed": "https://alphaideas.in/feed/"
    }
  },
  "Mind2markets":{
    "rss_home": "https://mind2markets.com/feed/",
    "feeds": {
      "feed": "https://mind2markets.com/feed/"
    }
  },
  "Trade Brains":{
    "rss_home": "https://tradebrains.in/feed/",
    "feeds": {
      "feed": "https://tradebrains.in/feed/"
    }
  },
  "Good Returns":{
    "rss_home": "https://www.goodreturns.in/rss/",
    "feeds": {
      "feed": "https://www.goodreturns.in/rss/feeds/goodreturns-fb.xml",
      "news": "https://www.goodreturns.in/rss/feeds/news-fb.xml",
      "business": "https://www.goodreturns.in/rss/feeds/business-news-fb.xml",
      "commentary": "https://www.goodreturns.in/rss/feeds/comentary-news-fb.xml"
    }
  },
  "ET Now":{
    "rss_home": "https://www.etnownews.com/info/rssfeed",
    "feeds": {
      "feed": "https://www.etnownews.com/feeds/gns-etn-latest.xml",
      "markets": "https://www.etnownews.com/feeds/gns-etn-markets.xml",
      "economy": "https://www.etnownews.com/feeds/gns-etn-economy.xml",
      "companies": "https://www.etnownews.com/feeds/gns-etn-companies.xml"
    }
  },
}

india_news = {
    "The Hindu":{
      "rss_home": "https://www.thehindu.com/rssfeeds/",
      "feeds":{ 
         "india": "https://www.thehindu.com/news/national/feeder/default.rss",
        }
    },
    "Times of India":{
      "rss_home": "https://timesofindia.indiatimes.com/rss.cms",
      "feeds": { 
        "feed": "https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms",
        "india": "https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms" 
      }
    },
    "Hindustan Times":{
      "rss_home": "https://www.hindustantimes.com/rss-feeds",
      "feeds": {
        "india": "https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml",
      }
    },
    "Indian Express":{
      "rss_home": "https://indianexpress.com/rss/",
      "feeds": { 
        "feed": "https://indianexpress.com/feed/",
        "india": "https://indianexpress.com/section/india/feed/"
      }
    },
    "NDTV":{
      "rss_home": "https://www.ndtv.com/rss",
      "feeds": { 
         "feed": "https://feeds.feedburner.com/ndtvnews-top-stories"
      }
    },
    "News18":{
      "rss_home": "https://www.news18.com/rss/",
      "feeds":{ 
        "india": "https://www.news18.com/rss/india.xml",
      }
    },
    "India Today":{
      "rss_home": "https://www.indiatoday.in/rss",
      "feeds":{ 
        "india": "https://www.indiatoday.in/rss/1206514",
      }
    },
    "Economic Times":{
      "rss_home": "https://economictimes.indiatimes.com/rss.cms",
      "feeds": { 
        "feed": "https://economictimes.indiatimes.com/rssfeedstopstories.cms",
      }
    },
}

global_news = {
    "BBC":{
      "rss_home": "https://www.bbc.co.uk/news/10628494",
      "feeds": { 
        "world" : "http://feeds.bbci.co.uk/news/world/rss.xml",
        "asia" : "https://feeds.bbci.co.uk/news/world/asia/rss.xml",
        "business" : "https://feeds.bbci.co.uk/news/business/rss.xml",
      },
    },
    "CNBC":{
      "rss_home": "https://www.cnbc.com/rss-feeds/",
      "feeds": { 
        "world" : "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100727362",
        "usa" : "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=15837362",
        "asia" : "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=19832390",
        "europe" : "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=19794221",
        "business" : "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147",
        "economy" : "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=20910258"
      },
    },
    "nytimes":{
      "rss_home": "https://www.nytimes.com/rss",
      "feeds": { 
        "world" : "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
        "asia" : "https://rss.nytimes.com/services/xml/rss/nyt/AsiaPacific.xml",
        "middle-east" : "https://rss.nytimes.com/services/xml/rss/nyt/MiddleEast.xml",
        "business" : "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml",
        "economy" : "https://rss.nytimes.com/services/xml/rss/nyt/Economy.xml"
      },
    },
}

news_dicts = {
  "stock_news":stock_news,
  "india_news":india_news,
  "global_news":global_news,
}

news_csv = {
  "stock_news":"stock_news/stock_news.csv",
  "india_news":"stock_news/india_news.csv",
  "global_news":"stock_news/global_news.csv",
}

def clean_html(raw_html: str) -> str:
    """Remove HTML tags and return plain text."""
    if not raw_html:
        return ""
    return BeautifulSoup(raw_html, "html.parser").get_text(separator=" ", strip=True)

def fetch_rss_to_json_df(base_url, fromDate=None, toDate=None):

    rss_content = None
    # Parse feed
    resp = requests.get(base_url, headers=headers, timeout=10)
    print(resp)
    if resp.status_code != 200:
        resp = cffireq.get(
          base_url,
          headers=headers,
          impersonate="chrome",   # or "chrome110", "chrome120"
          timeout=10,
        )
      
    feed = feedparser.parse(resp.content)

    # Extract and clean data
    data = []
    for entry in feed.entries:
        published_dt = datetime(*entry.published_parsed[:6])  # Convert struct_time to datetime

        # Apply date filter if specified
        if fromDate and published_dt < fromDate:
            continue
        if toDate and published_dt > toDate:
            continue
          
        summary_raw = getattr(entry, "summary", None) or getattr(entry, "description", None) or ""
        summary_text = clean_html(summary_raw)

        data.append({
            "title": getattr(entry, "title", None) or "",
            "link": getattr(entry, "link", None) or "",
            "published": getattr(entry, "published", None) or "",
            "published_parsed": published_dt.isoformat(),
            "summary": summary_text,
        })

    df = pd.DataFrame(data)
    return df, data

def fetch_rss_feeds(
    news_dict,
    local_url: str,
    source: str,
    feed_key: str,
    days: int,
):
  
  # 1) Load existing CSV (or start empty)
  if os.path.exists(local_url):
      try:
          existing_df = pd.read_csv(local_url)
      except Exception:
          # Fallback in case of partial/corrupt file
          existing_df = pd.DataFrame()
  else:
      existing_df = pd.DataFrame()
  
   # 2) Compute date window
  from_date = datetime.now() - timedelta(days=days) 
  to_date = datetime.now()

  # 3) Fetch new data
  url = news_dict[source]["feeds"][feed_key]
  print("fetching ", url)
  new_df, json_obj = fetch_rss_to_json_df(url, fromDate=from_date, toDate=to_date)

  if not new_df.empty:
    # 4) Add metadata columns
    new_df["source"] = source
    new_df["feed_key"] = feed_key
    print(new_df)

    # 5) Append + de-duplicate
    combined = pd.concat([existing_df, new_df], ignore_index=True, sort=False)
    combined.drop_duplicates(subset="link", keep="last", inplace=True)
    combined.to_csv(local_url, index=False, encoding='utf-8')

def fetch_all_rss_feeds(news_type):
    news_dict = news_dicts[news_type]
    local_url = news_csv[news_type]
    days = 2
    for source, info in news_dict.items():
        feeds = info.get("feeds", {})
        for feed_key in feeds.keys():
            try:
                print(f"\n Processing {source} - {feed_key}")
                fetch_rss_feeds(news_dict, local_url=local_url, source=source, feed_key=feed_key, days=days)
                time.sleep(4)
            except Exception as e:
                print(f"X Failed {source} - {feed_key}: {e}")

#================================================================================
fetch_all_rss_feeds(news_type = "stock_news")
fetch_all_rss_feeds(news_type = "india_news")
fetch_all_rss_feeds(news_type = "global_news")

update_stock_news_feeds()

# df,data = fetch_google_rss_news("Reliance Industries Limited")
# print(data)



