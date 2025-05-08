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

def summarize_text(text, sentence_count=3):
    parser = PlaintextParser.from_string(text, Tokenizer("english"))
    summarizer = LsaSummarizer()
    summary = summarizer(parser.document, sentence_count)
    return ' '.join(str(sentence) for sentence in summary)

# Google News RSS query
query = "Tata Motors stock"
rss_url = f"https://news.google.com/rss/search?q={query.replace(' ', '+')}"

feed = feedparser.parse(rss_url)

for entry in feed.entries[:3]:  # Limit to 3 for demo
    print("🔹 Title:", entry.title)
    print("🔗 Google Link:", entry.link)

    try:
        # Try to load the article using newspaper3k
        article = Article(entry.link)
        article.download()
        article.parse()
        print("📰 Source:", article.source_url)
        print("📄 Extracted Text (start):", article.text[:300], "...")
        
        # Summarize the content
        summary = summarize_text(article.text)
        print("🧠 Summary:", summary)

    except Exception as e:
        print("❌ Failed to download or summarize article:", e)

    print("=" * 100)

