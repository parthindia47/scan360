import feedparser
import requests
from urllib.parse import quote_plus
from urllib.parse import urlparse, unquote
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from newspaper import Article
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lsa import LsaSummarizer  # You can use others too
from googlesearch import search
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import time
from datetime import datetime, timedelta
import pandas as pd
import re

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
news_rss = {
    "The Hindu":{
      "rss_home": "https://www.thehindu.com/rssfeeds/",
      "feeds":{ 
         "india": "https://www.thehindu.com/news/national/feeder/default.rss",
         "world": "https://www.thehindu.com/news/international/feeder/default.rss" 
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
        "world": "https://www.hindustantimes.com/feeds/rss/world-news/rssfeed.xml"
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
      "feeds":
        { "feed": "https://feeds.feedburner.com/ndtvnews-top-stories" }
    },
    "Zee News":{
      "rss_home": "https://zeenews.india.com/rss",
      "feeds": { 
        "india": "https://zeenews.india.com/rss/india-news.xml",
        "world": "https://zeenews.india.com/rss/world-news.xml" 
      }
    },
    "News18":{
      "rss_home": "https://www.news18.com/rss/",
      "feeds":{ 
        "india": "https://www.news18.com/rss/india.xml",
        "world": "https://www.news18.com/rss/world.xml" 
      }
    },
    "Business Standard":{
      "rss_home": "https://www.business-standard.com/rss-feeds/listing",
      "feeds": { 
        "markets": "https://www.business-standard.com/rss/markets-106.rss"
      }
    },
    "India Today":{
      "rss_home": "https://www.indiatoday.in/rss",
      "feeds":{ 
        "india": "https://www.indiatoday.in/rss/1206514",
        "world": "https://www.indiatoday.in/rss/1206577" 
      }
    },
    "Google News":{
      "rss_home": "https://www.indiatoday.in/rss",
      "feeds": { 
        "india": "https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en",
        "world": "https://news.google.com/rss/?hl=en&gl=US&ceid=US:en" 
      }
    },
    "BBC":{
      "rss_home": "https://www.bbc.co.uk/news/10628494",
      "feeds": { 
        "world": "http://feeds.bbci.co.uk/news/world/rss.xml"
      },
    },
}


headers = {"User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36'}

# ==========================================================================
# ============================  Fetch Function =============================
'''
returns the response of given url
should pass base/first urls which "do not need cookies" to access.
'''
def fetchUrl(url, headers=None, payload=None):
    print("Fetching Base URL : " + url)
    try:
        # Send a GET request to the URL to download the JSON content
        response = requests.get(url,headers=headers)
        
        # Check if the request was successful (status code 200)
        if response.status_code == 200:
          return response
        else:
            print("Failed to fetch. Status code:", response.status_code)
    except Exception as e:
        print("An error occurred:", e)
        
def fetchPostJson(url, cookies=None, payload=None):
    print("Fetching JSON Object : " + url)
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
            print("Failed to download JSON. Status code:", response.status_code)
    except Exception as e:
        print("An error occurred:", e)

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
            print("Failed to download JSON. Status code:", response.status_code)
    except Exception as e:
        print("An error occurred:", e)


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
      print(f"📅 {time} | 🗞 {headline} | 🔗 {link} ({source})\n")
      
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

def fetch_rss_to_json_df(base_url, fromDate=None, toDate=None):
    # Parse feed
    resp = requests.get(base_url, headers=headers, timeout=10)
    print(resp)
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

        data.append({
            "title": entry.title,
            "link": entry.link,
            "published": entry.published,
            "published_parsed": published_dt.isoformat(),
            "summary": entry.summary,
            "source": entry.get("source", {}).get("title", "Unknown")
        })

    df = pd.DataFrame(data)
    return df, data

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

stock_news = {
  "Economic Times":{
    "rss_home": "https://economictimes.indiatimes.com/rss.cms",
    "feeds": { 
      "feed": "https://economictimes.indiatimes.com/rssfeedstopstories.cms",
      "economy": "https://economictimes.indiatimes.com/rssfeeds/1373380682.cms",
      "markets": "https://economictimes.indiatimes.com/prime/money-and-markets/rssfeeds/62511286.cms",
      "stocks": "https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms"
    }
  },
  "Hindu Business Line":{
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
  "Trade Brains":{
    "rss_home": "https://tradebrains.in/blog/feed/",
    "feeds": {
      "markets": "https://tradebrains.in/blog/feed/"
    }
  },
  "Alpha Ideas":{
    "rss_home": "https://alphaideas.in/feed/",
    "feeds": {
      "markets": "https://alphaideas.in/feed/"
    }
  },
  "Equity Pandit":{
    "rss_home": "https://www.equitypandit.com/category/latest-news/feed/",
    "feeds": {
      "markets": "https://www.equitypandit.com/category/latest-news/feed/"
    }
  },
  "Mind2markets":{
    "rss_home": "https://mind2markets.com/feed/",
    "feeds": {
      "markets": "https://mind2markets.com/feed/"
    }
  },
  "StockManiacs":{
    "rss_home": "https://www.stockmaniacs.net/blog/feed/",
    "feeds": {
      "markets": "https://www.stockmaniacs.net/blog/feed/"
    }
  },
  "Trade Brains":{
    "rss_home": "https://tradebrains.in/feed/",
    "feeds": {
      "markets": "https://tradebrains.in/feed/"
    }
  },
  "TOI":{
    "rss_home": "https://timesofindia.indiatimes.com/rss.cms",
    "feeds": {
      "markets": "https://timesofindia.indiatimes.com/rssfeeds/1898055.cms"
    }
  },
}

def fetch_rss_feeds():
  from_date = datetime.now() - timedelta(days=7)
  to_date = datetime.now()

  url = stock_news["CNBC TV18"]["feeds"]["markets"]
  print("fetching ",url)

  df, json_obj = fetch_rss_to_json_df(url, fromDate=from_date, toDate=to_date)
  print(df)

  local_url="stock_news/all_stock_news.csv"
  df.drop_duplicates(subset="link", keep="last", inplace=True)
  df.to_csv(local_url, index=False, encoding='utf-8')
  
fetch_rss_feeds()



