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
from datetime import datetime

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

'''

def google_rss_feed_example():
  # Google News RSS query
  query = "Dredging Corporation"
  rss_url = f"https://news.google.com/rss/search?q={query.replace(' ', '+')}"

  feed = feedparser.parse(rss_url)
  
  # Sort entries by 'published' date ascending
  sorted_entries = sorted(
      feed.entries,
      key=lambda entry: datetime.strptime(entry.published, "%a, %d %b %Y %H:%M:%S %Z")
  )

  for entry in feed.entries:  # Limit to 3 for demo
      print("🔹 Title:", entry.title)
      print("🔗 Google Link:", entry.link)
      print("🔗 Published:", entry.published)
      print("🔗 Source:", entry.source.href)

      print("=" * 100)
      
def get_redirected_url(initial_url, headless=True):
    download_dir = r"C:\work"
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
      
def google_search_example():
  query = 'site:business-standard.com "Welspun"'
  results = list(search(query, num=5))

  for url in results:
      print(url)
      
def buissnes_standard():
  url = "https://www.business-standard.com/search?type=news&q=welspun"
  response = requests.get(url)
  soup = BeautifulSoup(response.text, "html.parser")

  # Example: Extract search result titles and links
  for link in soup.select("div.search-result a"):
      title = link.get_text(strip=True)
      href = link["href"]
      print(title, "=>", "https://www.business-standard.com" + href)

#google_rss_feed_example()
# get_redirected_url("https://news.google.com/rss/articles/CBMi2wFBVV95cUxPR0tSSHdwcTRzMUpiTUV0aFFIcE5hYU5xSlh6c3YzUUdOZHBSUktiWU4xeGtSNzFScE5ndGVRRHMybHJOMkJDUkpJWElYVC12MTZ6alJaMzFFS3ZOTXpLTnJ1QTRfdEhUbjJRWnFrT1E5SkFLTzJMYXNyQjBodFJuYW9vNERkM3lMWUhzR2hZWGQ5R3E5V1pCZjBvemFRbElqUzhfMFRPSjJGNU93M2tSQnNBbWJvelJNbWNOTzFUM21yUVFRQ2dXd3JTNW55cTdvcmh0T1NaVjVBc2c?oc=5", True)


google_rss_feed_example()