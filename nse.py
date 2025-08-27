# -*- coding: utf-8 -*-

r"""
=> listing
https://www.nseindia.com/market-data/all-upcoming-issues-ipo

==> annual report
https://www.nseindia.com/companies-listing/corporate-filings-annual-reports

credit ratings seems to be having indirect links

list of all stocks
https://www.nseindia.com/market-data/securities-available-for-trading

https://www.nseindia.com/products-services/equity-market-trading
https://www.nseindia.com/market-data/securities-available-for-trading

-- list of all companies with symbol and ISBN.
-- Face value ?
-- total floating ?

OCR:
https://github.com/UB-Mannheim/tesseract/wiki

Popular:
https://github.com/oschwartz10612/poppler-windows/releases/

Path Variable:
C:\Program Files\Tesseract-OCR
C:\poppler-24.08.0
C:\poppler-24.08.0\Library\bin

NSE websites:
https://www.nseindia.com/
https://www.niftyindices.com/
https://iinvest.cogencis.com/
https://charting.nseindia.com/
https://unofficed.com/nse-python/documentation/nsepy
https://github.com/meticulousCraftman/TickerStore
https://www.nseindia.com/all-reports


IPO:
https://zerodha.com/ipo/
https://www.nseindia.com/companies-listing/corporate-filings-offer-documents
https://upstox.com/news/market-news/
https://www.nseindia.com/market-data/all-upcoming-issues-ipo
https://www.nseindia.com/market-data/new-stock-exchange-listings-recent
https://www.nseindia.com/market-data/live-market-indices


Events:
https://www.nseindia.com/companies-listing/corporate-filings-event-calendar
https://www.nseindia.com/companies-listing/corporate-filings-board-meetings
https://serpapi.com/google-finance-api
https://www.nseindia.com/companies-listing/corporate-integrated-filing

knowledge:
https://unofficed.com/courses/mastering-algotrading-beginners-guide-nsepython/lessons/how-to-find-the-beta-of-indian-stocks-using-python/

commodity_expiry = ["30-MAY-2025","30-JUN-2025","31-JUL-2025","29-AUG-2025","30-SEP-2025","31-OCT-2025"]

yahoo finance docs
https://ranaroussi.github.io/yfinance/

"""
import os
import requests
import json
import time
from datetime import datetime, timezone, timedelta, date
import yfinance as yf
import pytz  # Import pytz module for timezone support
import pandas as pd
from io import StringIO
import math
import csv
import hashlib
import logging
import zipfile
import re
import PyPDF2
import pytesseract
import shutil
import sys
import traceback
from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse, quote
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from bs4 import BeautifulSoup

# =======================================================================
# ========================== Classes ==================================
@dataclass
class CsvFile:
    remote_url: str
    local_url: str

csv_list = {
    "NSE": CsvFile(
        remote_url="https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv",
        local_url="stock_info/input/EQUITY_L.csv"
    ),
    "BSE": CsvFile(
        remote_url="",
        local_url="stock_info/input/equity_bse.csv"
    ),
    "CURRENCY": CsvFile(
        remote_url="",
        local_url="stock_info/input/currency_pair.csv"
    ),
    "COMMODITY_ETF": CsvFile(
        remote_url="",
        local_url="stock_info/input/commodity_etf.csv"
    ),
    "GLOBAL_INDEX": CsvFile(
        remote_url="",
        local_url="stock_info/input/global_index.csv"
    ),
    "COMMODITY_NSE": CsvFile(
        remote_url="",
        local_url="stock_info/input/commodity_nse.csv"
    ),
    "CRYPTO": CsvFile(
        remote_url="",
        local_url="stock_info/input/crypto_pair.csv"
    ),
    "NSE_HOLIDAYS":  CsvFile(
        remote_url="",
        local_url= "stock_info/csv/trading_holidays.csv"
    )
}

def getOutputCsvFile(urlType):
    csv_output_files = {
        "announcement":"stock_fillings/announcements_nse.csv" ,
        #events
        "events":"stock_fillings/events_nse.csv",
        "upcomingIssues":"stock_fillings/upcomingIssues_nse.csv",
        "forthcomingListing":"stock_fillings/forthcomingListing_nse.csv",
        "forthcomingOfs":"stock_fillings/forthcomingOfs_nse.csv",
        "upcomingTender":"stock_fillings/upcomingTender_nse.csv",
        "upcomingRights":"stock_fillings/upcomingRights_nse.csv",
        "liveTender":"stock_fillings/liveTender_nse.csv",
        "liveRights":"stock_fillings/liveRights_nse.csv",
        
        #fund raise
        "rightsFilings":"stock_fillings/rightsFilings_nse.csv",
        "qipFilings":"stock_fillings/qipFilings_nse.csv",
        "prefIssue":"stock_fillings/prefIssue_nse.csv",
        "schemeOfArrangement":"stock_fillings/schemeOfArrangement_nse.csv",

        #results
        "integratedResults":"stock_fillings/integratedResults_nse.csv",
        "bulkDeals":"stock_fillings/bulkDeals_nse.csv",
        "blockDeals":"stock_fillings/blockDeals_nse.csv",
        "shortDeals":"stock_fillings/shortDeals_nse.csv",
        "sastDeals":"stock_fillings/sastDeals_nse.csv",
        "insiderDeals":"stock_fillings/insiderDeals_nse.csv",
    }
    return csv_output_files[urlType]

# =======================================================================
# ========================== Constants ==================================

nseSegments = {"equities":"equities",
              "debt":"debt",
              "sme":"sme",
              "sse":"sse",
              "mf":"mf",
              "municipalBond":"municipalBond",
              "invitsreits":"invitsreits",
              "qip":"qip",
              "inPrinciple":"FIPREFIP",
              "inListing":"FIPREFLS",
              "commodityspotrates":"commodityspotrates"}

headers = {"User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36'}

ist = pytz.timezone("Asia/Kolkata")
scrappingStartingDate = datetime(1994, 1, 1)
current_datetime = datetime.now()
current_date = current_datetime.date()
formatted_datetime = current_datetime.strftime("%Y-%m-%d_%H-%M-%S")

'''
removed words
"Approval",
"dividend",
'''
announcementKeywords = [
"Acquisition",
"Acquire",
"Amalgamation",
"Arrangement",
"Merger",
"Demerge",
"De merge",
"Demerger",
"disinvestment",
"Amalgamation",
"Re-structuring",
"Restructuring",
"Offer For Sale",
"Bonus",
"split",
"Buy back",
"Buyback",
"Rights issue",
"Right issue",
"Public offer",
"public offering",
"fund raise",
"fund raising",
"raise fund",
"New Project",
"new contract",
"new order",
"order received",
"Awarding of order",
"Bagging",
"beg",
"begs",
"winning",
"Expansion",
"Investment",
"settlement",
"Raising of funds",
"Rating",
"clarification",
"Partnership",      #newly_added
"Joint venture",
"Collaboration",
"Capital expenditure",
"capacity addition",
"Strategic alliance",
"Revenue growth",
"Profit increase",
"Earnings beat",
"Record earnings",
"Cost reduction",
"Debt reduction",
"Product launch",
"New technology",
"Innovation",
"License",
"Patent granted",
"FDA approval",
"Contract extension",
"Market expansion",
"Upgraded",
"downgraded",
"Buy recommendation",
"Positive outlook",
"Guidance raised",
"Milestone achieved",
"Supply agreement",
"Exclusive agreement",
"Patent filing",       #added_2
"Product approval",
"Regulatory approval",
"Secondary offering",
"Share repurchase",
"Equity infusion",
"Capital raise",
"Increase in volume",
"Spurt in Volume",
"Movement in price",
"name change"
]

avoid_tickers = [
  "RNAVAL",
  "CANFINHOME",
]

avoid_subject = [
"Loss of Share Certificates",
"Share Certificate",
"Issue of Duplicate Share Certificate",
"ESOP",
"Trading Window",
"Copy of Newspaper Publication"
]

accepted_extensions = ['pdf']
market_cap_limit_cr = 1500


# =======================================================================
# ========================== logging ====================================

# Suppress PyPDF2 logs
logging.getLogger("PyPDF2").setLevel(logging.WARNING)

def setup_logger(printing=False):
    # Create a logger
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.DEBUG)

    # Create formatter
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s', datefmt='%Y-%m-%d %H:%M:%S')

    if printing:
      # Create console handler and set level to debug
      console_handler = logging.StreamHandler()
      console_handler.setLevel(logging.DEBUG)
      console_handler.setFormatter(formatter)
      logger.addHandler(console_handler)

    # Create file handler and set level to debug
    file_handler = logging.FileHandler(f"logs//log_file_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.log")
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    return logger

logger1 = setup_logger(printing=True)
# ========================================================================
# ========================== Helper Function =============================
def normalize_to_date(data_or_datetime):
  if isinstance(data_or_datetime, datetime):
      return data_or_datetime.date()
  else:
      return data_or_datetime  # already a date

def rupees_to_crores(rupees):
    crores = rupees / 10000000
    return crores


'''
this function accept pandas data frame row
'''
def compute_hash(row):
  row_str = ''.join([str(val) for val in row])
  return hashlib.md5(row_str.encode()).hexdigest()

def getAbsoluteFilePath(file_name):
  current_dir = os.path.dirname(__file__)

  # Concatenate the parent directory path with the file name
  file_path = os.path.join(current_dir, file_name)

  return file_path

'''
Adds only "business day"
'''
def add_business_days(start_date, num_days):
  # Adjust start_date to skip weekends
  current_date = start_date
  if current_date.weekday() == 5:  # Saturday
      current_date += datetime.timedelta(days=2)  # Adjust to Monday
  elif current_date.weekday() == 6:  # Sunday
      current_date += datetime.timedelta(days=1)  # Adjust to Monday
  while num_days > 0:
      current_date += datetime.timedelta(days=1)
      if current_date.weekday() < 5:  # Weekday (Monday to Friday)
          num_days -= 1
  return current_date

def calculatePercentage(open,close):
    per = (close - open)*100/open
    per = round(per,2)
    return per

def get_value_by_key(input_array, search_key, search_value, return_key):
    for item in input_array:
        if item.get(search_key) == search_value:
            return item.get(return_key)
    return None  # If no match is found
# ==========================================================================
# ========================== NSE Helper Function ===========================

def getAllBseSymbol(local=False):
    local_url = csv_list["BSE"].local_url
    
    if local:
        # Get the absolute path of the local CSV file
        abs_path = os.path.abspath(local_url)
        logger1.info("Fetching locally " + abs_path)
        
        # Read the CSV data into a DataFrame
        df = pd.read_csv(abs_path)
        
        # Convert the DataFrame to a dictionary
        json_data = df.to_dict(orient='records')
        
        return json_data


def detect_symbol_changes(old_df, new_df):
    # Strip column names and ISIN values (defensive cleaning)
    old_df.columns = old_df.columns.str.strip()
    new_df.columns = new_df.columns.str.strip()
    old_df['ISIN NUMBER'] = old_df['ISIN NUMBER'].str.strip()
    new_df['ISIN NUMBER'] = new_df['ISIN NUMBER'].str.strip()
    old_df['SYMBOL'] = old_df['SYMBOL'].str.strip()
    new_df['SYMBOL'] = new_df['SYMBOL'].str.strip()

    # Merge on cleaned ISIN
    merged = pd.merge(old_df, new_df, on="ISIN NUMBER", suffixes=("_old", "_new"))
    changed = merged[merged["SYMBOL_old"] != merged["SYMBOL_new"]].copy()

    if not changed.empty:
        # Add a column with the current date
        changed["ChangeDate"] = datetime.today().strftime("%Y-%m-%d")

        output_path = "stock_info/input/name_changes.csv"

        # Append mode; include header only if file doesn't exist
        file_exists = os.path.exists(output_path)
        changed.to_csv(output_path, mode='a', header=not file_exists, index=False)

        logger1.info(f"Appended {len(changed)} symbol change(s) to: {output_path}")
    else:
        logger1.info("* No symbol changes detected.")
  
'''
EQ (Equity): EQ represents the Equity segment
BE (Group B): BE stands for "Trade-to-Trade" segment or the "Limited Physical Market" segment. 
BZ (Group Z): BZ represents the Trade-to-Trade segment for securities that 
              have not been traded at all during the last 365 days

return list of object
'''
def getAllNseSymbols(local=False):
    remote_url = csv_list["NSE"].remote_url
    local_url = csv_list["NSE"].local_url
    json_data = []
    
    if local:
        # Get the absolute path of the local CSV file
        abs_path = os.path.abspath(local_url)
        logger1.info("Fetching locally " + abs_path)
        
        # Read the CSV data into a DataFrame
        if os.path.exists(abs_path):
          df = pd.read_csv(abs_path)

          # Convert the DataFrame to a dictionary
          json_data = df.to_dict(orient='records')
        
        return json_data
    else:
        logger1.info("Fetching remotely " + remote_url)
        response = requests.get(remote_url,headers=headers)
        
        # Read the local CSV data into a DataFrame
        new_df = pd.read_csv(StringIO(response.text))
        
        # Detect name change
        abs_path = os.path.abspath(local_url)
        if os.path.exists(abs_path):
          old_df = pd.read_csv(abs_path)
          detect_symbol_changes(old_df, new_df)

        # Save the new CSV data to the local file path
        with open(local_url, 'w', encoding='utf-8') as f:
            f.write(response.text)
        
        # Convert the DataFrame to a dictionary
        json_data = new_df.to_dict(orient='records')
        
        logger1.info("Saved " + local_url)
        
        return json_data

def getJsonFromCsvForSymbols(symbolType,local=True):
    
    if local:
        if csv_list[symbolType].local_url == "":
          logger1.info("No local URL for type " + symbolType)
          return

        # Get the absolute path of the local CSV file
        abs_path = os.path.abspath(csv_list[symbolType].local_url)
        logger1.info("Fetching locally " + abs_path)
        
        # Read the CSV data into a DataFrame
        df = pd.read_csv(abs_path)
        
        # Convert the DataFrame to a dictionary
        json_data = df.to_dict(orient='records')
        
        return json_data
    else:
        if csv_list[symbolType].remote_url == "":
          logger1.info("No Remote URL for type " + symbolType)
          return

        logger1.info("Fetching remotely " + csv_list[symbolType].remote_url)
        response = requests.get(csv_list[symbolType].remote_url,headers=headers)
        
        # Save the CSV data to the local file path
        with open(csv_list[symbolType].local_url, 'w', encoding='utf-8') as f:
            f.write(response.text)
        
        # Read the local CSV data into a DataFrame
        df = pd.read_csv(StringIO(response.text))
        
        # Convert the DataFrame to a dictionary
        json_data = df.to_dict(orient='records')
        
        return json_data


'''
MarketCap, PE, PB, Book Value, Debt, RoE, RoCE, Face Value, Div Yield [ check ]:

==> Main URL
https://www.nseindia.com/get-quotes/equity?symbol=RELIANCE

==> APIs
total market cap, trade volume etc
https://www.nseindia.com/api/quote-equity?symbol=RELIANCE&section=trade_info

prices, symbol pe, issued size, face value, close price
https://www.nseindia.com/api/quote-equity?symbol=RELIANCE

announcement, corporate actions, shareholding pattern, financial results, board meetings etc.
https://www.nseindia.com/api/top-corp-info?symbol=RELIANCE&market=equities

meta-data
https://www.nseindia.com/api/equity-meta-info?symbol=RELIANCE

'''
def nsefetch(payload):
    try:
        output = requests.get(payload,headers=headers).json()
    except ValueError:
        s =requests.Session()
        output = s.get("http://nseindia.com",headers=headers)
        output = s.get(payload,headers=headers).json()
    return output
      
def nsesymbolpurify(symbol):
    symbol = symbol.replace('&','%26') #URL Parse for Stocks Like M&M Finance
    return symbol
  
def nse_quote(symbol):
    #https://forum.unofficed.com/t/nsetools-get-quote-is-not-fetching-delivery-data-and-delivery-can-you-include-this-as-part-of-feature-request/1115/4
    symbol = nsesymbolpurify(symbol)
    payload = nsefetch('https://www.nseindia.com/api/quote-equity?symbol='+symbol)
    return payload

# ==========================================================================
# ========================== NSE URL Function ==============================

'''
# announcements 
index = [Equity,SME,debt,MF,REIT]
filter = [company,Subject,time,FnO]

"https://www.nseindia.com/api/corporate-announcements?index=equities&from_date=10-04-2024&to_date=11-04-2024"
"https://www.nseindia.com/api/corporate-announcements?index=equities&from_date=9-04-2024&to_date=11-04-2024&fo_sec=true"
"https://www.nseindia.com/api/corporate-announcements?index=equities&symbol=SUBEX&issuer=Subex%20Limited"
"https://www.nseindia.com/api/corporate-announcements?index=equities&subject=Amalgamation%20%2F%20Merger"

# arrangements
index = [Equity/debt]
filter = [company,time]

https://www.nseindia.com/api/corporates/offerdocs/arrangementscheme?index=equities&from_date=14-03-2024&to_date=14-04-2024
https://www.nseindia.com/api/corporates/offerdocs/arrangementscheme?index=equities&issuer=3i%20Infotech%20Limited&type=3i%20Infotech%20Limited


# board Meetings
index = [Equity, SME]
filter = [company, purpose, time]

https://www.nseindia.com/api/corporate-board-meetings?index=equities&symbol=SUBEX&issuer=Subex%20Limited
https://www.nseindia.com/api/corporate-board-meetings?index=equities&from_date=14-04-2024&to_date=29-04-2024


# corporate Actions
index = [Equity, SME, Debt, MF]
filter = [company, purpose, time]

https://www.nseindia.com/api/corporates-corporateActions?index=equities&from_date=14-04-2024&to_date=14-07-2024&fo_sec=true
https://www.nseindia.com/api/corporates-corporateActions?index=equities&from_date=undefined&to_date=undefined&symbol=SUBEX&issuer=Subex%20Limited
https://www.nseindia.com/api/corporates-corporateActions?index=equities&from_date=undefined&to_date=undefined&symbol=SUBEX&subject=BONUS&issuer=Subex%20Limited


# financial Results
index = [Equity, SME, Debt, MF]

https://www.nseindia.com/api/corporates-financial-results?index=equities&from_date=14-01-2024&to_date=14-04-2024&fo_sec=true&period=Half-Yearly
https://www.nseindia.com/api/corporates-financial-results?index=equities&fo_sec=true&symbol=SUBEX&issuer=Subex%20Limited&period=Half-Yearly

# offerDocs
index = [Equity, SME, Debt]

https://www.nseindia.com/api/corporates/offerdocs/equity/companylist
https://www.nseindia.com/api/corporates/offerdocs?index=equities&company=Adani%20Wilmar%20Limited
https://www.nseindia.com/api/corporates/offerdocs?index=equities&isin=IDERR

# events
https://www.nseindia.com/api/event-calendar?index=equities&symbol=AARON&issuer=Aaron%20Industries%20Limited&subject=Other%20business%20matters

# integrated results
https://www.nseindia.com/api/integrated-filing-results?index=equities&symbol=BATAINDIA&issuer=Bata%20India%20Limited&period_ended=all&type=Integrated%20Filing-%20Financials

# scheme of arrangement
https://www.nseindia.com/api/corporates/offerdocs/arrangementscheme?index=equities&issuer=New%20Delhi%20Television%20Limited&type=New%20Delhi%20Television%20Limited

# credit Rating
https://www.nseindia.com/api/corporate-credit-rating?index=&from_date=30-11-2024&to_date=30-05-2025&issuer=State%20Bank%20Of%20India

# shareholding pattern
https://www.nseindia.com/api/corporate-share-holdings-master?index=equities&symbol=RELIANCE&issuer=Reliance%20Industries%20Limited

# annual Reports
https://www.nseindia.com/api/annual-reports?index=equities&symbol=RELIANCE

# rights issue
https://www.nseindia.com/api/corporates/offerdocs/rights?index=equities&from_date=02-03-2025&to_date=30-05-2025

Always Replace special characters example
space - %20
backslash - %2F

https://www.nseindia.com/api/integrated-filing-results?index=equities&symbol=RELIANCE&issuer=Reliance%20Industries%20Limited&period_ended=all&type=all 

https://www.nseindia.com/api/corporate-further-issues-pref?index=FIPREFLS
https://www.nseindia.com/api/corporate-further-issues-pref?index=FIPREFIP

https://www.nseindia.com/api/corporates/offerdocs/arrangementscheme?index=equities&from_date=12-01-2025&to_date=12-07-2025

https://www.nseindia.com/api/integrated-filing-results?index=equities&from_date=12-04-2025&to_date=12-07-2025&period_ended=all&type=Integrated%20Filing-%20Financials&page=1&size=20

spaces and & need to be converted
https://www.nseindia.com/api/corporates-financial-results?index=equities&symbol=M%26M&issuer=Mahindra%20%26%20Mahindra%20Limited&period=Quarterly

https://www.nseindia.com/api/corporates-financial-results?index=equities&symbol=BAJAJ-AUTO&issuer=Bajaj%20Auto%20Limited&period=Quarterly

https://www.nseindia.com/api/all-upcoming-issues?category=forthcoming

Example of Usage:
logger1.info(getAnnouncementUrlQuery("equities"))  # JSON response for equities
logger1.info(getAnnouncementUrlQuery("equities", fromDate="10-04-2024", toDate="11-04-2024"))  # Time-wise search
logger1.info(getAnnouncementUrlQuery("equities", fromDate="9-04-2024", toDate="11-04-2024", isOnlyFnO=True))  # FnO search
logger1.info(getAnnouncementUrlQuery("equities", symbol="SUBEX", issuer="Subex Limited"))  # Company-wise search
logger1.info(getAnnouncementUrlQuery("equities", subject="Amalgamation / Merger"))  # Subject-wise search
'''
def getJsonUrlQuery(urlType,
                index=None,
                fromDate = None, 
                toDate = None, 
                symbol = None, 
                instrumentType = None,
                issuer = None,
                subject = None,
                period = None,
                isOnlyFnO = False):
    baseUrls = {
        "announcement":"https://www.nseindia.com/api/corporate-announcements?index=" ,
        "boardMeetings": "https://www.nseindia.com/api/corporate-board-meetings?index=",
        "corporateActions": "https://www.nseindia.com/api/corporates-corporateActions?index=",
        "financialResults":"https://www.nseindia.com/api/corporates-financial-results?index=",
        "offerDocs":"https://www.nseindia.com/api/corporates/offerdocs?index=",
        "events":"https://www.nseindia.com/api/event-calendar?index=",
        "integratedResults":"https://www.nseindia.com/api/integrated-filing-results?index=",
        "resultsComparison":"https://www.nseindia.com/api/results-comparision?index=",
        "schemeOfArrangement":"https://www.nseindia.com/api/corporates/offerdocs/arrangementscheme?index=",
        "creditRating":"https://www.nseindia.com/api/corporate-credit-rating?index=",
        "shareholdingPattern": "https://www.nseindia.com/api/corporate-share-holdings-master?index=",
        "annualReports":"https://www.nseindia.com/api/annual-reports?index=",
        "rightsFilings": "https://www.nseindia.com/api/corporates/offerdocs/rights?index=",
        "qipFilings": "https://www.nseindia.com/api/corporates/offerdocs/rights?index=",
        "prefIssue":"https://www.nseindia.com/api/corporate-further-issues-pref?index=",
        "commoditySpotAll":"https://www.nseindia.com/api/refrates?index=",
        "commodityIndividual":"https://www.nseindia.com/api/historical/com/derivatives?",
        "sastDeals":"https://www.nseindia.com/api/corporate-sast-reg29?index=",
        "insiderDeals":"https://www.nseindia.com/api/corporates-pit?index=",
    }
    
    short_date_style = ["commodityIndividual"]
    pages_url = ["integratedResults"]
    
    baseUrl = baseUrls[urlType]
    
    if index:
        baseUrl += nseSegments[index]

    # Handling time-wise search
    if fromDate and toDate:
        fromDate_str = fromDate.strftime("%d-%m-%Y")  # Convert Python date to string in "dd-mm-yyyy" format
        toDate_str = toDate.strftime("%d-%m-%Y")      # Convert Python date to string in "dd-mm-yyyy" format
        if urlType in short_date_style:
          baseUrl += f"&from={fromDate_str}&to={toDate_str}"
        else:
          baseUrl += f"&from_date={fromDate_str}&to_date={toDate_str}"
    
    if instrumentType:
        baseUrl += f"&instrumentType={instrumentType}"
        
    # Handling company-wise search
    if symbol:
        symbol = symbol.replace(' ', '%20').replace('/', '%2F').replace('&', '%26')
        baseUrl += f"&symbol={symbol}"
        
    if issuer:
        baseUrl += f"&issuer={issuer}"
        
    # Handling subject-wise search
    if subject:
        # Replace special characters
        subject = subject.replace(' ', '%20').replace('/', '%2F').replace('&', '%26')
        baseUrl += f"&subject={subject}"
        
    if urlType in pages_url:
      baseUrl += f"&page=0&size=800"
    
    # Handling FnO search
    if isOnlyFnO:
        baseUrl += "&fo_sec=true"

    if period:
       baseUrl += f"&period={period}"
             
    return baseUrl
  
def getSymbolJsonUrlQuery(urlType,
                symbol=None):
    baseUrls = {
        "stockQuote":"https://www.nseindia.com/api/quote-equity?symbol=",
        "stockInfo":"https://www.nseindia.com/api/top-corp-info?symbol=",
    }

    baseUrl = baseUrls[urlType] + symbol
    
    return baseUrl

def getTopicJsonQuery(urlType):
    baseUrls = {
        "ipoCurrentIssues":"https://www.nseindia.com/api/ipo-current-issue",
        "publicPastIssues":"https://www.nseindia.com/api/public-past-issues",
        "upcomingIssues":"https://www.nseindia.com/api/all-upcoming-issues?category=ipo",
        "tradingHoliday":"https://www.nseindia.com/api/holiday-master?type=trading",
        "forthcomingListing": "https://www.nseindia.com/api/new-listing-today?index=ForthListing",
        "forthcomingOfs":"https://www.nseindia.com/api/all-upcoming-issues?category=forthcoming",
        "upcomingTender":"https://www.nseindia.com/api/all-upcoming-issues?category=tender",
        "upcomingRights":"https://www.nseindia.com/api/all-upcoming-issues?category=forthcomingIssues",
        "liveTender":"https://www.nseindia.com/api/liveTenderActive-issues",
        "liveRights":"https://www.nseindia.com/api/liveWatchRights-issues?index=activeIssues",
        
        "bulkDeals":"https://www.nseindia.com/api/snapshot-capital-market-largedeal",
        "blockDeals":"https://www.nseindia.com/api/snapshot-capital-market-largedeal",
        "shortDeals":"https://www.nseindia.com/api/snapshot-capital-market-largedeal",
    }

    baseUrl = baseUrls[urlType]
    
    return baseUrl

def getSchemaUrl(urlType,index):
    schemaBaseUrl = "https://www.nseindia.com/json/CorporateFiling/"

    announcementSchema = {
        "equities":"CF-annc-equity.json",
        "debt":"CF-annc-debt.json",
        "sme":"CF-annc-sme.json",
        "sse":"CF-annc-sse.json",
        "mf":"CF-annc-mf.json"
    }

    boardMeetingSchema = {
        "equities":"CF-boardmeeting-equity.json",
        "sme":"CF-boardmeeting-sme.json"
    }

    corporateActionSchema = {
        "equities":"CF-corpactions-equity.json",
        "debt":"CF-corpactions-debt.json",
        "mf":"CF-corpactions-mf.json",
        "sme":"CF-corpactions-sme.json"
    }

    financialResultsSchema = {
        "equities":"CF-financial-equity.json",
        "debt":"CF-financial-debt.json",
        "sme":"CF-financial-sme.json"
    }

    offerDocumentSchema = {
        "equities":"CF-equity-offer-document.json",
        "debt":"CF-debt-offer-document.json",
        "sme":"CF-sme-offer-document.json"
    }
    
    eventSchema = {
      "equities":"CF-event-calendar.json",
      "sme":"CF-event-calendar-sme.json"
    }

    schemaObjs = {
        "announcement":announcementSchema,
        "boardMeetings":boardMeetingSchema,
        "corporateActions":corporateActionSchema,
        "financialResults":financialResultsSchema,
        "offerDocs":offerDocumentSchema,
        "events":eventSchema
    }

    schemaBaseUrl = schemaBaseUrl + schemaObjs[urlType][index]
    return schemaBaseUrl

def getBaseUrl(urlType,symbol=None):
    baseUrls = {
        "announcement":"https://www.nseindia.com/companies-listing/corporate-filings-announcements" ,
        "boardMeetings": "https://www.nseindia.com/companies-listing/corporate-filings-board-meetings",
        "corporateActions": "https://www.nseindia.com/companies-listing/corporate-filings-actions",
        "financialResults":"https://www.nseindia.com/companies-listing/corporate-filings-financial-results",
        "offerDocs":"https://www.nseindia.com/companies-listing/corporate-filings-offer-documents",
        "events":"https://www.nseindia.com/companies-listing/corporate-filings-event-calendar",
        "stockQuote": "https://www.nseindia.com/get-quotes/equity?symbol=",
        "stockInfo":"https://www.nseindia.com/get-quotes/equity?symbol=",
        "ipoCurrentIssues":"https://www.nseindia.com/market-data/all-upcoming-issues-ipo",
        "publicPastIssues":"https://www.nseindia.com/market-data/all-upcoming-issues-ipo",
        "upcomingIssues":"https://www.nseindia.com/market-data/all-upcoming-issues-ipo",
        "forthcomingOfs":"https://www.nseindia.com/market-data/all-upcoming-issues-ofs",
        "integratedResults":"https://www.nseindia.com/companies-listing/corporate-integrated-filing",
        "resultsComparison": "https://www.nseindia.com/companies-listing/corporate-filings-financial-results-comparision",
        "schemeOfArrangement":"https://www.nseindia.com/companies-listing/corporate-filings-scheme-document",
        "creditRating":"https://www.nseindia.com/companies-listing/debt-centralised-database/crd",
        "shareholdingPattern":"https://www.nseindia.com/companies-listing/corporate-filings-shareholding-pattern",
        "annualReports":"https://www.nseindia.com/companies-listing/corporate-filings-annual-reports",
        "rightsFilings":"https://www.nseindia.com/companies-listing/corporate-filings-rights",
        "qipFilings":"https://www.nseindia.com/companies-listing/corporate-filings-rights",
        "prefIssue":"https://www.nseindia.com/companies-listing/corporate-filings-PREF",
        "commoditySpotAll":"https://www.nseindia.com/commodity-getquote",
        "commodityIndividual":"https://www.nseindia.com/commodity-getquote",
        "tradingHoliday":"https://www.nseindia.com/resources/exchange-communication-holidays",
        "forthcomingListing":"https://www.nseindia.com/market-data/new-stock-exchange-listings-forthcoming",
        "bulkDeals":"https://www.nseindia.com/market-data/large-deals",
        "blockDeals":"https://www.nseindia.com/market-data/large-deals",
        "shortDeals":"https://www.nseindia.com/market-data/large-deals",
        "sastDeals":"https://www.nseindia.com/companies-listing/corporate-filings-regulation-29",
        "insiderDeals":"https://www.nseindia.com/companies-listing/corporate-filings-insider-trading",
        "upcomingTender":"https://www.nseindia.com/market-data/all-upcoming-issues-ofs-tender-offer",
        "upcomingRights":"https://www.nseindia.com/market-data/all-upcoming-issues-ofs-rights",
        "liveTender":"https://www.nseindia.com/market-data/all-upcoming-issues-ofs-tender-offer",
        "liveRights":"https://www.nseindia.com/market-data/all-upcoming-issues-ofs-rights"
    }
    
    symbolBaseUrl = ["stockQuote", "stockInfo"]

    baseUrl = baseUrls[urlType]
    
    if urlType in symbolBaseUrl:
      if symbol:
        symbol = symbol.replace(' ', '%20').replace('/', '%2F').replace('&', '%26')
        baseUrl = baseUrl + symbol
        
    return baseUrl
    
def getSubjectUrl(urlType,index):
    subjectUrls = {
        "announcement":"https://www.nseindia.com/api/corporate-announcements-subject?index=" ,
        "boardMeetings": "https://www.nseindia.com/api/corporate-board-meetings-subject?index=",
        "corporateActions": "https://www.nseindia.com/api/corporates-corporateActions-subject?index=",
        "offerDocs":"",
        "events":"https://www.nseindia.com/api/eventCalender-equities"
    }
    return  subjectUrls[urlType] + nseSegments[index]

'''
List of all companies in Announcements
"https://www.nseindia.com/api/corporates-corporateActions-debtcompany"

No Cookie Needed
'''
def getCompaniesListUrl(urlType,index):
    companiesListUrl = {
        "announcement":"" ,
        "boardMeetings": "",
        "corporateActions": "https://www.nseindia.com/api/corporates-corporateActions-debtcompany",
        "financialResults":"",
        "offerDocs":"https://www.nseindia.com/api/corporates/offerdocs/equity/companylist",
        "events":""
    }
    return companiesListUrl[urlType]

# ==========================================================================
# ============================ URL fetch Function ==========================

'''
Fetch any Json from URL
'''
def fetchGetJson(url,cookies=None):
    logger1.info("Fetching JSON Object : " + url)
    try:
        # Send a GET request to the URL to download the JSON content
        #logger1.info("Cookies Type:", type(cookies))
        # for i, cookie in enumerate(cookies):
        #     logger1.info(f"Cookie {i}: type={type(cookie)}, value={cookie}")

        if cookies:
          headers["Cookie"] = '; '.join([f"{k}={v}" for k, v in cookies.items()])
        response = requests.get(url,headers=headers)
        
        # Check if the request was successful (status code 200)
        if response.status_code == 200:
            # Parse the JSON content
            jsonData = response.json()
            return jsonData
        else:
            logger1.info(f"Failed to download JSON. Status code: {response.status_code}")
    except Exception as e:
        logger1.info(f"An error occurred: {e}")

'''
returns the response of given url
should pass base/first urls which "do not need cookies" to access.
'''
def fetchUrl(url):
    logger1.info("Fetching Base URL : " + url)
    try:
        # Send a GET request to the URL to download the JSON content
        response = requests.get(url,headers=headers)
        
        # Check if the request was successful (status code 200)
        if response.status_code == 200:
          return response
        else:
            logger1.info(f"Failed to fetch. Status code: {response.status_code}")
    except Exception as e:
        logger1.info(f"An error occurred: {e}")

# ==========================================================================
# ============================  File Download ==============================
def ocr_pdf_to_text(pdf_path, output_folder='downloads'):
    """Convert scanned PDF pages to text using OCR."""
    # Convert PDF to a list of images
    images = convert_from_path(pdf_path)
    
    # Ensure the output folder exists
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
    
    # Initialize an empty string to hold the extracted text
    extracted_text = ""
    
    # Loop through the images (one for each page)
    for i, image in enumerate(images):
        # Save each page as an image file
        image_path = os.path.join(output_folder, f'page_{i + 1}.png')
        image.save(image_path, 'PNG')
        
        # Use Tesseract to extract text from the image
        text = pytesseract.image_to_string(image)
        extracted_text += f"\n\n--- Page {i + 1} ---\n{text}"
    
    return extracted_text

def extract_text_from_pdf(pdf_path):
    """Extract text from the PDF file."""
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ""
        for page in range(len(reader.pages)):
            text += reader.pages[page].extract_text() + "\n"
    return text

'''
# Example usage
pdf_file_path = 'downloads/rsu.pdf'
keywords = ['Bank', 'Million', 'clients', 'intimation', 'interest', 'plan', 'valid']
search_keywords_in_pdf(pdf_file_path, keywords)

return:
{
'Amalgamation': 
[(126, 'equity\xa0shares,\xa0merger/\xa0amalgamation \xa0or\xa0sale'), 
(126, 'equity\xa0shares,\xa0merger/\xa0amalgamation \xa0or\xa0sale')], 
'Merger': 
[(126, 'equity\xa0shares,\xa0merger/\xa0amalgamation \xa0or\xa0sale')], 
'Bonus': 
[(125, 'issue,\xa0bonus\xa0issue,\xa0split\xa0or\xa0consolidation \xa0of')], 
'split': 
[(125, 'issue,\xa0bonus\xa0issue,\xa0split\xa0or\xa0consolidation \xa0of')]
}
'''
def search_keywords_in_pdf(pdf_file_path, keywords, jpg_pdf = True):
  text = None

  try:
    text = extract_text_from_pdf(pdf_file_path)
  except Exception as e:
    logger1.info("Exception while opening pdf !!")
    logger1.info(e)

  # if text is None then return
  if not text:
    return

  #logger1.info("Length of text " + str(len(text)))

  #if length of text is less, it is possible that it is image.
  #we will extract text from image using ocr
  if len(text) < 50 and jpg_pdf :
      logger1.info("converting image to text ...")
      text = ocr_pdf_to_text(pdf_file_path)

  #this will return line number and line containing keywords
  results = searchInText(text, keywords)

  return results

def print_keyword_search_results(results):
  # Print the results
  for keyword, occurrences in results.items():
      logger1.info(f"Keyword: {keyword}")
      for line_number, line in occurrences:
          logger1.info(f"Line {line_number}: {line}")
      logger1.info("\n")

'''
# Path to the zip file
zip_file_path = 'path/to/your/file.zip'

# Directory to extract the files
extract_to = 'path/to/extract/'
'''
def extractZipFile(zip_file_path, extract_to):
    # Ensure the extraction directory exists
    os.makedirs(extract_to, exist_ok=True)

    # Extract all the contents
    with zipfile.ZipFile(zip_file_path, 'r') as zip_ref:
        zip_ref.extractall(extract_to)

'''
downloadFileFromUrl("https://nsearchives.nseindia.com/corporate/Announcement_01012018094304_154.zip",
                    outputDir="downloads")

common extensions on nse site = {'xml', 'zip', 'pdf', 'xlsx', 'PDF', 'jpg'}
'''
def downloadFileFromUrl(url, outputDir="."):
    try:
        # Check if the output directory exists
        if not os.path.exists(outputDir):
            raise FileNotFoundError(f"The directory '{outputDir}' does not exist.")
        
        if not url or len(url) < 10:
            logger1.info("URL is None")
            return
        
        # Get the file name from the URL
        fileName = url.split("/")[-1]
        fileExtension = fileName.split(".")[-1]

        # if it is not accepted extension then don't download
        if fileExtension.lower() not in accepted_extensions:
          return
        
        # Determine the output path
        fileOutputPath = os.path.join(outputDir, fileName)

        #logger1.info("Downloading " + url + " Saving to " + fileOutputPath)
        
        # Send a GET request to the URL
        response = requests.get(url,headers=headers)
        response.raise_for_status()  # Raise an exception for 4xx or 5xx status codes
        
        # Save the content of the response to a file
        with open(fileOutputPath, 'wb') as file:
            file.write(response.content)

        # this is zip file
        if fileExtension == "zip":
            logger1.info("This is zip file, extracting")
            extractZipFile(fileOutputPath, outputDir)
        
        logger1.info(f"File downloaded successfully as '{fileOutputPath}'")
    except (requests.exceptions.RequestException, FileNotFoundError) as e:
        logger1.info(f"An error occurred: {e}")

def ifStockFilterPass(ticker):
    result = False
    # get stock info
    stockInfoList = readYFinStockInfo()
    stockInfoDict = objList_to_dict(stockInfoList, "symbol")

    # provide INPUT for symbol
    stockInfoObj = stockInfoDict.get(getYFinTickerName(ticker))

    if stockInfoObj:
      if rupees_to_crores(stockInfoObj['marketCap']) > market_cap_limit_cr:
        result = True
    else:
        logger1.info("** NO YAHOO FIN OBJ **")

    return result

def downloadFilesFromCsvList(csv_filename, downloadDir=".", delay=5):
    attachmentKey = "attchmntFile"

    # Read the CSV data into a DataFrame
    df = pd.read_csv(csv_filename)

    # Parse the 'an_dt' column as datetime
    df['an_dt'] = pd.to_datetime(df['an_dt'])
    total_rows = len(df)

    # Iterate over the DataFrame rows
    for index, row in df.iterrows():
        # Check if the attachment key exists and is not NaN
        if not ifStockFilterPass(row['symbol']):
          continue

        logger1.info("Downloading " + str(index) + " of " + str(total_rows) + " ...")
        if pd.notna(row[attachmentKey]) and len(row[attachmentKey]) > 10:
            logger1.info(row[attachmentKey])  # Access row by column name
            downloadFileFromUrl(row[attachmentKey],downloadDir)
            time.sleep(delay)  # Pause execution for 2 seconds

# ==========================================================================
# ==============================  Fetch JSON ===============================

def get_df_from_json_list(jsonList):
  if isinstance(jsonList, list):
      if not jsonList:  # Check if list is empty
          return pd.DataFrame()
      return pd.DataFrame(jsonList)

'''
This is master function to fetch any type of fillings from NSE.
step indicate how many days step it should fetch the data.

Example:
fetchNseJsonObj(urlType="announcement", index="equities", fromDate=start_date, toDate=end_date)
'''
def fetchNseJsonObj(urlType, 
                    index=None, 
                    symbol=None, 
                    instrumentType=None, 
                    fromDate=None, 
                    toDate=None, 
                    step=7, 
                    delaySec=5, 
                    listExtractKey=None,
                    period=None,
                    cookies=None):
    jsonObjMaster = []
    noDateTimeFetch = False
    
    if not fromDate:
      start_date = None
    elif isinstance(fromDate, datetime):
      start_date = fromDate.date()
    else:
      start_date = fromDate

    if not toDate:
      final_end_date = None        
    if isinstance(toDate, datetime):
      final_end_date = toDate.date()
    else:
      final_end_date = toDate

    #logger1.info("BEFORE Function start_date ",start_date," end_date ",final_end_date)
    logger1.info(f"BEFORE start_date={start_date} end_date={final_end_date}")
    # First, get response from the main URL to fetch cookies
    if not cookies:
      response = fetchUrl(getBaseUrl(urlType=urlType,symbol=symbol))
      cookies = response.cookies
      logger1.info(response)
    
    if not symbol and not index:
      logger1.info("Fetching 1")
      jsonUrl = getTopicJsonQuery(urlType=urlType)
      jsonObj = fetchGetJson(jsonUrl, cookies)
      jsonObjMaster = jsonObj
      noDateTimeFetch = True
    elif symbol and not index and not instrumentType:
      logger1.info("Fetching 2")
      jsonUrl = getSymbolJsonUrlQuery(urlType=urlType, symbol=symbol)
      jsonObj = fetchGetJson(jsonUrl, cookies)
      jsonObjMaster = jsonObj
      noDateTimeFetch = True
    elif not fromDate and not toDate:
      logger1.info("Fetching 3")
      jsonUrl = getJsonUrlQuery(urlType=urlType, index=index, symbol=symbol, period=period)
      jsonObj = fetchGetJson(jsonUrl, cookies)
      jsonObjMaster = jsonObj
      noDateTimeFetch = True
    
    if noDateTimeFetch: 
      if jsonObjMaster:
        if urlType in ["forthcomingListing", "prefIssue", "integratedResults", "sastDeals", "insiderDeals", "commoditySpotAll"]:
          jsonObjMaster = jsonObjMaster["data"]
        if urlType=="bulkDeals":
          jsonObjMaster = jsonObjMaster["BULK_DEALS_DATA"]
        if urlType=="blockDeals":
          jsonObjMaster = jsonObjMaster["BLOCK_DEALS_DATA"]
        if urlType=="shortDeals":
          jsonObjMaster = jsonObjMaster["SHORT_DEALS_DATA"]
        return get_df_from_json_list(jsonObjMaster)
      else:
        return pd.DataFrame()
      
    # Ensure step is set properly if start and end dates are the same or close together
    # logger1.info("start_date ", start_date, " final_end_date ", final_end_date)
    if start_date == final_end_date:
        step = 0  # If dates are the same, no step needed
    elif (final_end_date - start_date).days < step:
        step = (final_end_date - start_date).days  # Adjust step to the remaining days if smaller than the step size

    while start_date <= final_end_date:
        # Calculate the dynamic end date, making sure it doesn't exceed the final end date
        end_date = start_date + timedelta(days=step)
        if end_date > final_end_date:
            end_date = final_end_date

        # Fetch the JSON object using the calculated start and end date
        #logger1.info("AFTER Function start_date ",start_date," end_date ",end_date)
        logger1.info(f"AFTER start_date={start_date} end_date={end_date}")
    
        jsonUrl = getJsonUrlQuery(urlType=urlType, 
                                  index=index, 
                                  symbol=symbol, 
                                  instrumentType=instrumentType, 
                                  fromDate=start_date, 
                                  toDate=end_date,
                                  period=period)
        jsonObj = fetchGetJson(jsonUrl, cookies)
        
        if urlType in ["forthcomingListing", "prefIssue", "integratedResults", "sastDeals", "insiderDeals"]:
          if jsonObj:
            jsonObj = jsonObj["data"]

        # Extend the list with the fetched data
        if jsonObj:
          if listExtractKey:
            jsonObjMaster.extend(jsonObj.get(listExtractKey, []))
          else:
            jsonObjMaster.extend(jsonObj)

        # Move to the next iteration (next step after the current end_date)
        start_date = end_date + timedelta(days=1)

        time.sleep(delaySec)  # Delay between API requests

    #logger1.info(jsonObjMaster)
    return get_df_from_json_list(jsonObjMaster)

# ==========================================================================
# ============================  Yahoo Fin API ==============================

'''
ref
https://www.geeksforgeeks.org/get-financial-data-from-yahoo-finance-with-python/

# max->maximum number of daily prices available 
# for Facebook.
# Valid options are 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 
# 5y, 10y and ytd.

take care about holidays.
test this function more.
Holiday calendar ?

0 - Monday
1 - Tuesday
2 - wednesday
3 - thursday
4 - Friday
5 - Saturday
6 - sunday

This will give stock % change on given date for 1 day.

if nextDay = True then in case response was empty for given date,
it will find next trading day and will give %change of
that day.

seems like to get 1 day data we have to always give 1 day gap between star date
and end date.

start_date 2024-04-12 00:00:00+05:30
end_date 2024-04-13 00:00:00+05:30


Example usage
result = fetchPercentageChange1Day("BRIGADE.NS", datetime(2024, 4, 12))
logger1.info("1d % change " + str(result))

result = calculatePercentageDifference("BRIGADE.NS", datetime(2024, 4, 3))
logger1.info("1d " + str(result["1d"]) + " 3d " + str(result["3d"]) + " 5d " + str(result["5d"]))

'''
def fetchPercentageChange1Day(yFinTicker, date, nextDay=False):

    # Set the timezone to UTC
    ist_timezone = pytz.timezone('Asia/Kolkata')
    
    # Convert the input date to UTC timezone
    date_ist = date.astimezone(ist_timezone)

    dayNum = date_ist.weekday()
    logger1.info("inputDate " + str(date_ist))
    logger1.info("dayNum " + str(dayNum))

    if date_ist >= datetime.now(ist_timezone):
        logger1.info("Date cannot be higher or equal to today's date")
        return None

    # calculate start_date and end_date
    start_date = date_ist
    end_date = start_date + datetime.timedelta(days=1)

    logger1.info("start_date " + str(start_date))
    logger1.info("end_date " + str(end_date))

    # Fetch historical data for the specified date range
    tickerInformation = yf.Ticker(yFinTicker)
    tickerHistory = tickerInformation.history(start=start_date, end=end_date)

    if not tickerHistory.empty:
      logger1.info(tickerHistory)
      if len(tickerHistory) == 1:
          day1Percentage = (tickerHistory.iloc[0]['Close'] - tickerHistory.iloc[0]['Open'])*100/\
            tickerHistory.iloc[0]['Open']
          return day1Percentage
    else:
      logger1.info("tickerHistory is empty ...")
      # If nextDay is True, fetch data for the next trading day
      if nextDay:
          # Find the next trading day
          next_trading_day = start_date + datetime.timedelta(days=1)
          while next_trading_day.weekday() >= 5:  # Skip Saturday and Sunday
              next_trading_day += datetime.timedelta(days=1)
          
          start_date = next_trading_day
          end_date = start_date + datetime.timedelta(days=1)

          # Fetch historical data for the next trading day
          tickerHistory = tickerInformation.history(start=start_date, end=end_date)
          if not tickerHistory.empty:
              logger1.info("Next trading day data: ", tickerHistory)
              if len(tickerHistory) == 1:
                  day1Percentage = (tickerHistory.iloc[0]['Close'] - tickerHistory.iloc[0]['Open'])*100/\
                    tickerHistory.iloc[0]['Open']
                  return day1Percentage
          else:
              logger1.info("No data available for the next trading day.")
              return None

'''
This is a custom function, it will calculate % change from next day

example
result = calculatePercentageDifference("BRIGADE.NS", datetime(2024, 4, 3))
logger1.info("1d " + str(result["1d"]) + " 3d " + str(result["3d"]) + " 5d " + str(result["5d"]))

start_date:  2024-04-04 00:00:00+05:30
end_date:  2024-04-11 00:00:00+05:30
                                 Open         High         Low       Close  Volume  Dividends  Stock Splits
Date
2024-04-04 00:00:00+05:30  962.150024   963.849976  941.299988  957.799988  305657        0.0           0.0
2024-04-05 00:00:00+05:30  957.799988   982.200012  949.200012  964.700012  624117        0.0           0.0
2024-04-08 00:00:00+05:30  978.650024  1006.099976  957.650024  963.400024  372990        0.0           0.0
2024-04-09 00:00:00+05:30  972.099976   998.000000  963.200012  985.049988  706374        0.0           0.0
2024-04-10 00:00:00+05:30  995.950012   999.500000  977.000000  986.750000  527405        0.0           0.0

'''          
def calculatePercentageDifference(yFinTicker, date):  
    num_days = 5

    # Set the timezone to UTC
    ist_timezone = pytz.timezone('Asia/Kolkata')
    
    # Convert the input date to UTC timezone
    date_ist = date.astimezone(ist_timezone)

    # Adjust start_date to skip weekends
    start_date = add_business_days(date_ist, 1)

    # Calculate the end date by adding num_days while skipping weekends
    end_date = add_business_days(start_date, num_days)

    if start_date >= datetime.now(ist_timezone) or \
      end_date >= datetime.now(ist_timezone):
        logger1.info("Date cannot be higher or equal to today's date")
        return None

    logger1.info(f"start_date: {start_date}")
    logger1.info(f"end_date: {end_date}")

    try:
      # Fetch historical data for the specified date range
      tickerInformation = yf.Ticker(yFinTicker)
      tickerHistory = tickerInformation.history(start=start_date, end=end_date)
      logger1.info(tickerHistory)

      if not tickerHistory.empty:
          # Calculate the percentage difference between close price of (start_date + num_days) and open price of start_date
          open_price = tickerHistory.iloc[0]['Open']
          close_price = tickerHistory.iloc[0]['Close']
          percentageDiff1d = ((close_price - open_price) / open_price) * 100
          percentageDiff1d = round(percentageDiff1d,2)

          mid_day = math.ceil(len(tickerHistory)/2) - 1
          open_price = tickerHistory.iloc[0]['Open']
          close_price = tickerHistory.iloc[mid_day]['Close']
          percentageDiff3d = ((close_price - open_price) / open_price) * 100
          percentageDiff3d = round(percentageDiff3d,2)

          open_price = tickerHistory.iloc[0]['Open']
          close_price = tickerHistory.iloc[-1]['Close']
          percentageDiff5d = ((close_price - open_price) / open_price) * 100
          percentageDiff5d = round(percentageDiff5d,2)

          return {'1d':percentageDiff1d,'3d':percentageDiff3d,'5d':percentageDiff5d}
      else:
          logger1.info("No historical data available for the specified date range.")
          return None
    except Exception as e:
        logger1.info(e)
        return None

def getDateKeyForNseDocument(urlType):
  date_key_dict = {
      "announcement":"an_dt",
      
      "events":"date",
      "forthcomingListing":"effectiveDate",  #no date needed
      "upcomingIssues":"issueEndDate",       #no date needed
      "forthcomingOfs":"endDate",
      "upcomingTender":"todEndDate",
      "upcomingRights":None,
      "liveTender":"todEndDate",
      "liveRights":None,
      
      "rightsFilings":"date",   #done
      "qipFilings":"date",           #done
      "prefIssue":"systemDate",    #done
      "schemeOfArrangement":"date",  #done
      
      #results - "broadcast_Date" and "revised_Date" are combined
      "integratedResults":"creation_Date",   #done
      
      "bulkDeals":"date",
      "blockDeals":"date",
      "shortDeals":"date",
      "sastDeals":"date",
      "insiderDeals":"date"
  }
  
  return date_key_dict[urlType]

def normalize_rights_filings(df):
    normalized_rows = []

    for _, row in df.iterrows():
        base_data = {
            "company": row.get("company"),
            "symbol": row.get("symbol"),
            "isin": row.get("isin")
        }

        # Draft record
        if pd.notna(row.get("draftDate")) or pd.notna(row.get("draftAttch")):
            normalized_rows.append({
                **base_data,
                "type": "Draft",
                "date": row.get("draftDate"),
                "attachment": row.get("draftAttch")
            })

        # Final record
        if pd.notna(row.get("finalDate")) or pd.notna(row.get("finalAttach")):
            normalized_rows.append({
                **base_data,
                "type": "Final",
                "date": row.get("finalDate"),
                "attachment": row.get("finalAttach")
            })

    return pd.DataFrame(normalized_rows)

'''
this function takes a jsonObj as input and returns a Df with Hash
and date in ascending order.
'''
def processJsonToDfForNseDocument(jsonObj, urlType):

  date_key = getDateKeyForNseDocument(urlType)
  
  # Convert the list of dictionaries to a DataFrame
  df = pd.DataFrame(jsonObj)
  
  # "upcomingIssues" clean up
  if urlType == "upcomingIssues" and 'sr_no' in df.columns:
      df = df.drop(columns=['sr_no'])
      
  if urlType == "upcomingIssues" and 'lotSize' in df.columns:
      df = df.drop(columns=['lotSize'])
      
  if urlType == "upcomingIssues" and 'priceBand' in df.columns:
      df = df.drop(columns=['priceBand'])
      
  if urlType == "upcomingIssues" and 'issueSize' in df.columns:
      df['issueSize'] = df['issueSize'].apply(
          lambda x: int(float(x)) if str(x).strip() not in ["", "nan", "NaN", "None"] else 0
      )

  if urlType == "upcomingIssues" and 'isBse' in df.columns:
      df['isBse'] = df['isBse'].apply(
          lambda x: int(float(x)) if str(x).strip() not in ["", "nan", "NaN", "None"] else 0
      )
      
  # "rightsFilings" clean up - "draftDate" | "draftAttch" | 'finalDate' | 'finalAttach'
  if urlType == "rightsFilings":
      df = normalize_rights_filings(df)
      
  # "forthcomingOfs" clean up
  if urlType == "forthcomingOfs" and 'sr_no' in df.columns:
      df = df.drop(columns=['sr_no'])
     
  # "qipFilings" clean up 
  if urlType == "qipFilings" and 'sharehold' in df.columns:
      df = df.drop(columns=['sharehold'])
      
  if urlType == "qipFilings" and 'allottee' in df.columns:
      df = df.drop(columns=['allottee'])
  
  # "prefIssue" clean up    
  if urlType == "prefIssue" and 'nseSymbol' in df.columns:
      df.rename(columns={"nseSymbol": "symbol"}, inplace=True)
      
  # "prefIssue" clean up    
  if urlType == "sastDeals" and 'timestamp' in df.columns:
      df.rename(columns={"timestamp": "date"}, inplace=True)
  
  # "upcomingTender" clean up   
  if urlType == "upcomingTender" and 'sr_no' in df.columns:
      df = df.drop(columns=['sr_no'])
      
  if urlType == "upcomingTender" and 'timeStamp' in df.columns:
      df = df.drop(columns=['timeStamp'])
        
  # logger1.info(df)
  df[date_key] = pd.to_datetime(df[date_key])
  df = df.sort_values(by=date_key)

  # compute hash of all rows
  df['hash'] = df.apply(compute_hash, axis=1)

  return df


def getyFinTickerInfo(yFinTicker, sub="INFO"):
    session = requests.Session()

    # Optional: Impersonate Chrome using headers
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/113.0.0.0 Safari/537.36"
    })
    
    try:
      logger1.info("fetching " + yFinTicker)
      tickerInformation = yf.Ticker(yFinTicker)
      #logger1.info(tickerInformation)
      #logger1.info(dir(tickerInformation))

      if sub == "INFO":
        return tickerInformation.info
      
    except Exception as e:
        logger1.info(e)
        return None

'''
will return ticker history between start_date and end_date
if it is not supported by yFin will return None
'''
def getyFinTickerCandles(yFinTicker,start_date,end_date):
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/113.0.0.0 Safari/537.36"
    })

    try:
      tickerInformation = yf.Ticker(yFinTicker)
      tickerHistory = tickerInformation.history(start=start_date, end=end_date)
      if not tickerHistory.empty:
        return tickerHistory
      else:
          return None
    except Exception as e:
        logger1.info(e)
        return None

'''
@return
open_price next day
next_1D_change
next_5D_change
next_10D_change

candles are in descending order i.e oldest are first.
'''
def getPercentageChange(symbol,annDate,hash):
    resp = {"Open":None,"1D":None,"5D":None,"10D":None}
    local_url = os.path.join("stock_charts", f"{symbol}.csv")
    
    # Get the absolute path of the local CSV file
    abs_path = os.path.abspath(local_url)
    
    # Read the CSV data into a DataFrame
    try:
      df = pd.read_csv(abs_path)

      # Parse the 'Date' column as datetime
      df['Date'] = pd.to_datetime(df['Date'])
      
      # extract the date part
      annDate_datepart = annDate.date()

      # Find the minimum date greater than the given date
      next_available_date = df[df['Date'].dt.date > annDate_datepart]['Date'].min()
      
      # Filter the DataFrame to get the row corresponding to the next available date
      next_day_row = df[df['Date'] == next_available_date]
      
      # Print the index of the row(s) in next_day_row
      # logger1.info("Index of the row(s) in next_day_row:")
      total_entries = len(df)
      curr_row_index = next_day_row.index[0]
      
      # Print the candle data for the next day if found
      if not next_day_row.empty:
          #logger1.info("Candle data for the next day:")
          curr_open = df.iloc[curr_row_index]['Open']
          curr_close = df.iloc[curr_row_index]['Close']

          resp["Open"] = round(curr_open,2)
          resp["1D"] = calculatePercentage(curr_open,curr_close)
          if curr_row_index + 4 < total_entries:
              resp["5D"] = calculatePercentage(curr_open,df.iloc[curr_row_index + 4]["Close"])
          if curr_row_index + 9 < total_entries:
              resp["10D"] = calculatePercentage(curr_open,df.iloc[curr_row_index + 9]["Close"])

          #logger1.info(next_day_row)
          #logger1.info(resp)
      else:
          logger1.error("No data found for the next day ... " + symbol + " " + str(annDate) + " " + hash)
    except Exception as e:
      logger1.error("Exception getPercentageChange ... " + symbol + " " + str(annDate) + " " + hash)
      logger1.error(e)
    
    return resp

def getPercentageChangeList(json_data):
  #date_format = '%d-%b-%Y %H:%M:%S'
  date_format = '%Y-%m-%d %H:%M:%S'
  unsupported_symbols = []

  for idx,obj in enumerate(json_data):
      symbol = obj["symbol"].replace(" ", "")
      annDate = datetime.strptime(obj["an_dt"], date_format)
      hash = obj["hash"]
      pcChange = getPercentageChange(symbol,annDate,hash)
      if pcChange["Open"] is None:
          unsupported_symbols.append(symbol)
      obj.update(pcChange)
      json_data[idx] = obj
  return (json_data,unsupported_symbols)

def getLastProcessedHashForPercentage(file_path):

    # Read the CSV data into a DataFrame
    df = pd.read_csv(os.path.abspath(file_path))

    processed_hash = df.iloc[-1]['hash']
    processed_len = len(df)
    
    return {"processed_len":processed_len,"processed_hash":processed_hash}

# ==========================================================================
# ======================= Core Fetch Functions =============================
'''
website
city
industry
sector
longBusinessSummary   #summary of company
beta
trailingPE
marketCap             #in rupee
bookValue
priceToBook
symbol                #attached with .NS for NSE, .BO for BSE
longName              #long name of company
currentPrice
recommendationKey
debtToEquity
totalCashPerShare

example:
stockInfo = readYFinStockInfo()
logger1.info(stockInfo)

return:
return list of objects [{},{},{}]
'''

def readYFinStockInfo():
    local_url = os.path.join("stock_info", "csv", "yFinStockInfo_NSE.csv")
    json_data = None

    if os.path.exists(local_url):
      df = pd.read_csv(local_url)

      # Convert the DataFrame to a dictionary
      json_data = df.to_dict(orient='records')
    else:
      logger1.info("csv path do not exists")
    
    return json_data

def getBhavCopyNameForTicker(NseTicker):
    ticker_map = {
      "ADORWELD":"ADOR",
      "AHL":"",
      "AMIORG":"ACUTAAS",
      "ATFL":"",
      "BLUECHIP":"",
      "CAREERP":"",
      "HIL":"",
      "ISEC":"",
      "JPASSOCIAT":"",
      "JYOTI-RE1":"",
      "KALYANI":"",
      "MARSHALL":"",
      "MORARJEE":"",
      "MRO-TEK":"",
      "NIRAJISPAT":"",
      "ORTEL":"",
      "RANEENGINE":"",
      "RBL":"RBLBANK",
      "SICALLOG":"",
      "SUULD":"",
      "SUVENPHAR":"SUVEN",
      "THANG-RE":"THANGAMAYL",
      "ZOMATO":"ETERNAL",
    }
    
    new_name = ticker_map.get(NseTicker.upper(), NseTicker.upper())
    if new_name != NseTicker:
      logger1.info("** Using " + new_name + " instead of " + NseTicker)
    
    return new_name

'''
Note:
    in yahoo finance all stock ticker are appended by ".NS"
'''
def getYFinTickerName(NseTicker, exchange):
    if exchange == "NSE" or exchange == "COMMODITY_ETF":
        return NseTicker + ".NS"
    elif exchange == "BSE":
        return NseTicker + ".BO"
    elif exchange == "CURRENCY":
        return NseTicker + "=X"
    elif exchange == "GLOBAL_INDEX":
        return "^" + NseTicker
    elif exchange == "NSE_CHARTING":
        return NseTicker + "-EQ"
    else:
        return NseTicker
      
def ifDfNanOrEmptyString(val):
  return val is None or (isinstance(val, str) and val.strip() == "") or (isinstance(val, float) and pd.isna(val))

'''
This function fetch and save stock info like market cap, stock price, 
industry, book values etc.

example:
    nseStockList = getAllNseSymbols(local=True)
    fetchYFinStockInfo(nseStockList,partial=False)

Note:
  To download all bse stock list:
  https://www.bseindia.com/corporates/List_Scrips.html
  and select Equity T + 1 > Active

  To download all nse stock list:
  "https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv"

  For NSE yahoo attach .NS and for BSE yahoo attach .BO

'''
def fetchYFinStockInfo(nseStockList, delay=5, partial=False, exchange="NSE"):
    master_list = []
    unsupported_tickers = []
    lookup_list = []
    local_url = os.path.join("stock_info", f"yFinStockInfo_{exchange}.csv")
    # NSE = "SYMBOL" , BSE = "Security Id"
    symbolCsvId = "SYMBOL" if exchange == "NSE" else "Security Id" 
    # Load existing CSV
    existing_df = pd.read_csv(local_url) if os.path.exists(local_url) else pd.DataFrame()
    master_list = existing_df.to_dict(orient='records')
    
    # if partial create list of existing symbol list, don't include stocks where there is no longBusinessSummary
    if partial:
      lookup_list = [item["symbol"] for item in master_list]
      # lookup_list = [
      #     item["symbol"]
      #     for item in master_list
      #     if item.get("longBusinessSummary") not in [None, "", "None"]
      # ]
    
    for idx, obj in enumerate(nseStockList):
        yFinNseTicker = getYFinTickerName(obj[symbolCsvId], exchange)
        if partial and (yFinNseTicker in lookup_list):
            continue
            
        logger1.info("fetching " + str(idx) + " " + obj[symbolCsvId] )
        result = getyFinTickerInfo(yFinNseTicker)
        logger1.info(result)
        if result and 'symbol' in result:
            if not existing_df.empty:
                existing_row = existing_df[existing_df['symbol'] == result['symbol']]
                if not existing_row.empty:
                    for col in existing_df.columns:
                        val = result.get(col, None)  # Use .get() to safely access missing keys
                        if ifDfNanOrEmptyString(val):
                            result[col] = existing_row.iloc[0][col]
            if partial:
              result["tjiIndustry"] = "NEW"
            master_list.append(result)
            time.sleep(delay)
        else:
           logger1.info("UNSUPPORTED " + str(idx) + " " + obj[symbolCsvId] )
           unsupported_tickers.append(obj[symbolCsvId])

    df = pd.DataFrame(master_list)
    df.drop_duplicates(subset="symbol", keep="last", inplace=True)
    df.to_csv(local_url, index=False, encoding='utf-8')
    logger1.info("saved " + local_url)

    if unsupported_tickers:
      df = pd.DataFrame(unsupported_tickers)
      csv_filename = os.path.join("stock_info", "temp", f"yFinUnsupportedTickers_fetchYFinStockInfo_{exchange}.csv")
      df.to_csv(csv_filename, index=False, encoding='utf-8')
      logger1.info("saved " + csv_filename)

'''
yahoo candles:
2025-07-31 00:00:00+05:30	389	389.65	381.2	385.25	9943	0	0


'''
def convert_date_to_panda_date(date_input):
  panda_date = pd.to_datetime(date_input)
  if panda_date.tzinfo is None:
      panda_date = ist.localize(panda_date)
  return panda_date

'''
candle stick data is uniform with format
2025-07-31 00:00:00+05:30,30850.0,31150.0,30375.0,30755.0,5096,0.0,0.0

Bhav copy uses this format
04-Jul-2025

and in our csv it is getting stored, as python date object
2025-07-31

'''
def convert_to_date(date_str, candle_type=None):
    logger1.info(f"date_str: {date_str}")

    # Handle NaN or None
    if pd.isna(date_str) or date_str is None:
        return None

    # If already a date/datetime, return as date
    if isinstance(date_str, (datetime, date)):
        return date_str if isinstance(date_str, date) else date_str.date()

    # Convert non-strings to string
    if not isinstance(date_str, str):
        date_str = str(date_str)

    # Try parsing in multiple formats
    for fmt in ("%Y-%m-%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue

    # Could not parse
    logger1.warning(f"Could not parse date: {date_str}")
    return None

def recalculate_financials(row, current_price, volume, candle_date, candle_type):
    updated_row = row.copy()

    if candle_type == "NSE":
      try:
          if pd.notna(row.get('trailingEps')) and row['trailingEps'] != 0:
              updated_row['trailingPE'] = current_price / row['trailingEps']
          if pd.notna(row.get('forwardEps')) and row['forwardEps'] != 0:
              updated_row['forwardPE'] = current_price / row['forwardEps']
          if pd.notna(row.get('sharesOutstanding')):
              updated_row['marketCap'] = current_price * row['sharesOutstanding']
          if pd.notna(row.get('bookValue')) and row['bookValue'] != 0:
              updated_row['priceToBook'] = current_price / row['bookValue']
      except Exception as e:
          logger1.warning(f"Error recalculating for {row.get('symbol')}: {e}")

    candle_date = convert_date_to_panda_date(candle_date)
    candle_date = candle_date.date()
    
    # this will be python date object, so we should not use pandas date
    lastUpdateDate = convert_to_date(updated_row['lastUpdateDate'], candle_type)
    #logger1.info("candle date ", candle_date, " csv date ", lastUpdateDate," symbol ", updated_row['symbol'])

    if lastUpdateDate != candle_date:
      updated_row['previousClose'] = updated_row['currentPrice']
      updated_row['currentPrice'] = current_price
      updated_row['lastUpdateDate'] = candle_date
    else:
      logger1.info(f"Not updating price, same date {candle_date}")
      pass
      
    updated_row['volume'] = volume
    return updated_row

def get_last5_financials(symbol):
    def load_last5(path):
        if not os.path.exists(path):
            logger1.warning(f"File not found: {path}")
            return None, None
        try:
            df = pd.read_csv(path)

            if 'toDate' not in df.columns or 'Sales' not in df.columns or 'NetProfit' not in df.columns:
                logger1.warning(f"Missing required columns in {path}")
                return None, None

            df['toDate'] = pd.to_datetime(df['toDate'], format="%d-%b-%Y", errors='coerce')
            df = df.dropna(subset=['toDate', 'Sales', 'NetProfit'])

            df = df.sort_values('toDate').tail(5)

            last5revenue = {
                dt.strftime("%d-%b-%Y"): int(val) for dt, val in zip(df['toDate'], df['Sales'])
            }
            last5PAT = {
                dt.strftime("%d-%b-%Y"): int(val) for dt, val in zip(df['toDate'], df['NetProfit'])
            }

            return json.dumps(last5revenue), json.dumps(last5PAT)

        except Exception as e:
            logger1.info(f"Error reading {path}: {e}")
            return None, None

    consolidated_path = f"stock_results/consolidated/{symbol}/{symbol}.csv"
    standalone_path = f"stock_results/standalone/{symbol}/{symbol}.csv"

    last5revenue_consolidated, last5PAT_consolidated = load_last5(consolidated_path)
    last5revenue_standalone, last5PAT_standalone = load_last5(standalone_path)

    return {
        "last5revenue_consolidated": last5revenue_consolidated,
        "last5PAT_consolidated": last5PAT_consolidated,
        "last5revenue_standalone": last5revenue_standalone,
        "last5PAT_standalone": last5PAT_standalone,
    }

      
'''
bhavcopy will give us df
SYMBOL	 SERIES	 DATE1	 PREV_CLOSE	 OPEN_PRICE	 HIGH_PRICE	 LOW_PRICE	 LAST_PRICE	 CLOSE_PRICE	 AVG_PRICE

fullExchangeName = NSE
quoteType = EQUITY

'''    
def recalculateYFinStockInfo(useNseBhavCopy=True):
    bhavcopy_not_found_tickers = []
    exchange_clean = None
    local_url = os.path.join("stock_info", "yFinStockInfo_NSE.csv")

    if useNseBhavCopy:
      #bhavCopy = get_bhavcopy(date(2025, 7, 2))
      bhavCopy = get_bhavcopy()
      bhavCopy.columns = bhavCopy.columns.str.strip().str.upper()
      
    if os.path.exists(local_url):
      df = pd.read_csv(local_url)
      df["last5revenue_consolidated"] = df["last5revenue_consolidated"].astype("object")
      df["last5PAT_consolidated"] = df["last5PAT_consolidated"].astype("object")
      df["last5revenue_standalone"] = df["last5revenue_standalone"].astype("object")
      df["last5PAT_standalone"] = df["last5PAT_standalone"].astype("object")
    else:
      logger1.info("No stock info file exists")
      return

    for idx, row in df.iterrows():
      try:
        exchange_clean = row.get("fullExchangeName")
        if not exchange_clean:
          exchange_clean == "OTHER"
          
        if exchange_clean == "NSE" and row.get("quoteType") == "EQUITY":
          symbol_clean = row["symbol"].replace(".NS", "")
        else:
          symbol_clean = row["symbol"]
          
        if exchange_clean == "NSE" and useNseBhavCopy:
          row_bhavCopy = bhavCopy[
              (bhavCopy['SYMBOL'] == symbol_clean.upper()) &
              (bhavCopy['SERIES'].str.strip().isin(['EQ', 'BE', 'BZ']))
          ]

          if not row_bhavCopy.empty:
            close_price = row_bhavCopy.iloc[0]["CLOSE_PRICE"]
            date1 = row_bhavCopy.iloc[0]["DATE1"]
            volume = row_bhavCopy.iloc[0].get("TTL_TRD_QNTY", 0)  # Use .get() to avoid crash if column missing
            
            df.loc[idx] = recalculate_financials(row, current_price=close_price, volume=volume, candle_date=date1, candle_type=exchange_clean)
        else:
          # Other Tickers
          symbol_csv_filename = os.path.join("stock_charts", f"{symbol_clean}.csv")
          df_symbol = pd.read_csv(symbol_csv_filename)

          close_price = df_symbol.iloc[-1]['Close']
          volume = df_symbol.iloc[-1]['Volume']
          date1 = df_symbol.iloc[-1]['Date']
          df.loc[idx] = recalculate_financials(row, current_price=close_price, volume=volume, candle_date=date1, candle_type=exchange_clean)
       
        if exchange_clean == "NSE":
          last5_financials =  get_last5_financials(symbol_clean)
          df.at[idx, "last5revenue_consolidated"] = last5_financials["last5revenue_consolidated"]
          df.at[idx, "last5PAT_consolidated"] = last5_financials["last5PAT_consolidated"]
          df.at[idx, "last5revenue_standalone"] = last5_financials["last5revenue_standalone"]
          df.at[idx, "last5PAT_standalone"] = last5_financials["last5PAT_standalone"]       
      except Exception as e:
        traceback.print_exc()  # <-- this prints the full stack trace with line number
        logger1.info("SYMBOL NAME " + symbol_clean)
        bhavcopy_not_found_tickers.append(symbol_clean)
          
    df.to_csv(local_url, index=False)
    logger1.info(f"Saved updated file to: {local_url}")
    
    if bhavcopy_not_found_tickers:
      df = pd.DataFrame(bhavcopy_not_found_tickers)
      csv_filename = os.path.join("stock_info", "temp", "bhavcopy_not_found_tickers_recalculateYFinStockInfo_NSE.csv")
      df.to_csv(csv_filename, index=False, encoding='utf-8')
      logger1.info("saved " + csv_filename)

'''
Fetch candle data of list of given symbol. it will store candles in the file
names with stock in the list in csv format

Args:
    nseStockList (list): list of stock symbol, can be fetched by 
                         getAllNseSymbols()
    delay (int): delay in seconds between each symbol fetch.
    partial (boolean): make this true if you have ran script and don't want to 
                       start over again it will avoid csv file which already exists.

Returns:
    None

Example:
    nseStockList = getAllNseSymbols(local=True)
    fetchYFinTickerCandles(nseStockList,partial=True)

'''
def fetchYFinTickerCandles(nseStockList, symbolType, delaySec=6, partial=False, useNseCharting=False):
    unsupported_tickers = []
    ist_timezone = pytz.timezone('Asia/Kolkata')

    start_date = scrappingStartingDate
    end_date = datetime.now(ist_timezone)

    for idx, obj in enumerate(nseStockList):
        logger1.info("fetching " + str(idx) + " " + obj["SYMBOL"] )
        csv_filename = os.path.join("stock_charts", f"{obj['SYMBOL']}.csv")

        if partial and os.path.exists(csv_filename):
            continue

        if useNseCharting:
          symbolType = "NSE_CHARTING"
          result = get_nse_chart_data(getYFinTickerName(obj["SYMBOL"],symbolType))
        else:
          result = getyFinTickerCandles(getYFinTickerName(obj["SYMBOL"],symbolType), \
                                        start_date=start_date, \
                                        end_date=end_date)
        
        logger1.info(result)
        if result is not None and not result.empty:
            # Assuming df is your DataFrame containing historical data
            # Reset the index to include 'Date' as a regular column
            result.reset_index(inplace=True)
            result.to_csv(csv_filename, index=False, encoding='utf-8')
            logger1.info("saved " + csv_filename)
            time.sleep(delaySec)
        else:
           unsupported_tickers.append(obj["SYMBOL"])
           logger1.info("UNSUPPORTED " + str(idx) + " " + obj["SYMBOL"] )
           
    if unsupported_tickers:
      df = pd.DataFrame(unsupported_tickers)
      csv_filename = os.path.join("stock_info", "temp", "yFinUnsupportedTickers_fetchYFinTickerCandles.csv")
      df.to_csv(csv_filename, index=False, encoding='utf-8')
      logger1.info("saved " + csv_filename)

'''
Fetch all NSE announcements between start date and end date and store it in a
csv file.

Args:
    start_date (datetime): start date
    end_date (datetime): end date
    file_name (str): file name to be stored

Returns:
    None

Example:
fetchNseDocuments(urlType="announcement",
                  index="equities",
                  start_date=datetime(2025, 6, 1), 
                  end_date=datetime(2025, 7, 12))

fetchNseDocuments(urlType="events",
                  index="equities",
                  start_date=datetime(2025, 6, 1), 
                  end_date=datetime(2025, 7, 12))

fetchNseDocuments("upcomingIssues")

fetchNseDocuments("forthcomingListing")

fetchNseDocuments(urlType="rightsFilings",
                  index="equities",
                  start_date=datetime(2025, 6, 1), 
                  end_date=datetime(2025, 7, 12))
                  
fetchNseDocuments(urlType="qipFilings",
                  index="qip",
                  start_date=datetime(2025, 6, 1), 
                  end_date=datetime(2025, 7, 12))

fetchNseDocuments(urlType="prefIssue",
                  index="inListing",
                  start_date=datetime(2025, 6, 1),
                  end_date=datetime(2025, 7, 12))

fetchNseDocuments(urlType="schemeOfArrangement",
                  index="equities",
                  start_date=datetime(2025, 6, 1), 
                  end_date=datetime(2025, 7, 12))
                  
fetchNseDocuments(urlType="integratedResults",
                  index="equities",
                  start_date=datetime(2025, 6, 1), 
                  end_date=datetime(2025, 7, 12))
'''
def fetchNseDocuments(urlType, index=None, start_date=None, end_date=None, file_name=None, cookies=None):

  if not file_name:
    file_name = getOutputCsvFile(urlType)
  
  try:
    master_json_list = fetchNseJsonObj(urlType=urlType, 
                                       index=index, 
                                       fromDate=start_date, 
                                       toDate=end_date, 
                                       cookies=cookies)
    #logger1.info(master_json_list)
    total_entries = len(master_json_list)
    logger1.info("total entries " + str(total_entries))

    # Convert the list of dictionaries to a DataFrame
    if total_entries:
      df = processJsonToDfForNseDocument(master_json_list, urlType)
      df.reset_index(drop=True)
      df.set_index('hash', inplace=True)

      #remove if any duplicate
      df = df[~df.index.duplicated()]
      df.to_csv(file_name, encoding='utf-8')
      
      # logger1.info(df)

      logger1.info(">>> Data saved to " + file_name)
    else:
      logger1.info("Empty data in JSON")
      
  except Exception as e:
      logger1.info(urlType, " - An error occurred:", e)
      traceback.print_exc()  # <-- this prints the full stack trace with line number

'''
This function reads announcement list and finds 3D, 5D and 10D stock movement 
after that.

Note:
df.to_dict(orient='records') will return <class 'list'>
'''
def updatePercentageForAnnouncements():
    local_url = os.path.join("stock_fillings", "announcements.csv")
    output_url = os.path.join("output", "announcements_with_percentage.csv")
    unsupported_symbols = []
    
    # Read the CSV data into a DataFrame
    df = pd.read_csv(os.path.abspath(local_url))
    
    # Convert the DataFrame to a dictionary
    json_data = df.to_dict(orient='records')
    
    logger1.info(type(json_data))
    logger1.info("total entries to process " + str(len(json_data)))

    json_data, unsupported_symbols = getPercentageChangeList(json_data)
    
    df = pd.DataFrame(json_data)
    df.to_csv(output_url, index=False, encoding='utf-8')
    logger1.info("saved " + output_url)

    if unsupported_symbols:
      df = pd.DataFrame(unsupported_symbols)
      csv_filename = os.path.join("output", "unsupportedSymbols.csv")
      df.to_csv(csv_filename, index=False, encoding='utf-8')
      logger1.info("saved " + csv_filename)

def fetchNseCommodity(nseCommodityList, delaySec=6, partial=False):
    unsupported_commodity = []
    ist_timezone = pytz.timezone('Asia/Kolkata')

    start_date = datetime(2023, 1, 1).astimezone(ist_timezone)
    end_date = datetime.now(ist_timezone)
    
    response = fetchUrl(getBaseUrl("commodityIndividual"))
    cookies = response.cookies

    for idx, obj in enumerate(nseCommodityList):
        logger1.info("fetching " + str(idx) + " " + obj["SYMBOL"] )
        csv_filename = os.path.join("stock_charts", f"{obj['SYMBOL']}.csv")

        if partial and os.path.exists(csv_filename):
            continue

        instrumentType = get_value_by_key(nseCommodityList, "SYMBOL", obj["SYMBOL"], "instrumentType")
        
        try:
            result = fetchNseJsonObj(
                "commodityIndividual", 
                symbol=obj["SYMBOL"], 
                instrumentType=instrumentType,
                fromDate=start_date, 
                toDate=end_date,
                delaySec=delaySec,
                listExtractKey="data",
                cookies=cookies
            )
            
            result = convert_nse_commodity_to_yahoo_style(result)
            
            if result is not None and not result.empty:
                result.reset_index(inplace=True)
                result.to_csv(csv_filename, index=False, encoding='utf-8')
                logger1.info(f"Saved: {csv_filename}")
                time.sleep(delaySec)
            else:
                logger1.warning("Empty result for", obj["SYMBOL"])
                unsupported_commodity.append(obj["SYMBOL"])
        
        except Exception as e:
            logger1.warning(f"Exception while fetching {obj['SYMBOL']}: {e}")
            unsupported_commodity.append(obj["SYMBOL"])
  
    if unsupported_commodity:
        df = pd.DataFrame(unsupported_commodity, columns=["SYMBOL"])
        df.to_csv(os.path.join("stock_info", "temp", "unsupported_commodities.csv"), index=False, encoding='utf-8')
        logger1.info("Unsupported commodities saved.")        
# ==========================================================================
# ============================  Sync Up API ================================
# sync up function are used so that only delta difference get downloaded not 
# entire data set.

'''
Reads the current csv file finds the last entries and fetch the data after that.
and concat the data and saves it.

note:
if there is no default index then pandas allot incremental numbers and index.
'''
def syncUpNseDocuments(urlType, startDateOffset=0, endDateOffset=0, cookies=None): 
    
  csv_filename = getOutputCsvFile(urlType)
  current_date = datetime.now()

  # Read the CSV data into a DataFrame
  df = pd.read_csv(csv_filename)

  # Print the length of the DataFrame
  logger1.info(f"Current Entries : {len(df)}")

  date_key = getDateKeyForNseDocument(urlType)
  
  # Parse the 'Date' column as datetime
  df[date_key] = pd.to_datetime(df[date_key])

  last_row_date = df.iloc[-1][date_key]    
  start_date = last_row_date - timedelta(days=startDateOffset)
  end_date = current_date + timedelta(days=endDateOffset)  # Apply offset to end date
  
  # no date needed for this two
  if urlType in ["upcomingIssues", "forthcomingListing", "forthcomingOfs"]:
    start_date = None
    end_date = None
    
  # logger1.info(df)

  logger1.info(f"endDateOffset={endDateOffset} last_row_date={last_row_date} start_date={start_date} end_date={end_date}")

  try:
    master_json_list = fetchNseJsonObj(urlType=urlType, 
                                      index=getIndexForNseDocuments(urlType), 
                                      fromDate=start_date, 
                                      toDate=end_date,
                                      cookies=cookies)
    logger1.info(f"New Entries : {len(master_json_list)}")
    if master_json_list.empty:
        logger1.warning(f"No new entries for {urlType}, Exiting.")
        return
    
    df_new = processJsonToDfForNseDocument(master_json_list, urlType)
            
    df.reset_index(drop=True)
    df.set_index('hash', inplace=True)
    # logger1.info("df")
    # logger1.info(df)

    df_new.reset_index(drop=True)
    df_new.set_index('hash', inplace=True)
    # logger1.info("df_new")
    # logger1.info(df_new)

    concatenated_df = pd.concat([df, df_new])
    concatenated_df = concatenated_df[~concatenated_df.index.duplicated()]        
    concatenated_df.reset_index(inplace=True)
    # logger1.info("concatenated_df")
    # logger1.info(concatenated_df)

    concatenated_df.to_csv(csv_filename, index=False, encoding='utf-8')
    logger1.info(">>> saved " + csv_filename)

  except Exception as e:
      logger1.info(f"{urlType} - An error occurred: {e}")
      traceback.print_exc()  # <-- this prints the full stack trace with line number
      
      
'''
Reads the current csv file finds the last entries and fetch the data after that.
and concat the data and saves it.

Drop Duplicate with Datetime
https://stackoverflow.com/questions/46489695/drop-duplicates-not-working-in-pandas
https://stackoverflow.com/questions/50686970/understanding-why-drop-duplicates-is-not-working
'''
def syncUpYFinTickerCandles(nseStockList, symbolType, delaySec=6, useNseBhavCopy = False):
    ist_timezone = pytz.timezone('Asia/Kolkata')
    current_date = get_last_trading_day()
    unsupported_tickers = []
    split_tickers = []
    bhavCopy = None
    percent_change = 0

    if useNseBhavCopy:
      #bhavCopy = get_bhavcopy(date(2025, 8, 6))
      bhavCopy = get_bhavcopy()

    for idx, obj in enumerate(nseStockList):
        logger1.info("fetching " + str(idx) + " " + obj["SYMBOL"] )
        csv_filename = os.path.join("stock_charts", f"{obj['SYMBOL']}.csv")

        # Read the CSV data into a DataFrame
        try:
            # NEW STOCK ALERT ?
            if not os.path.exists(csv_filename):
              dummyList = [{"SYMBOL":obj["SYMBOL"]}]
              fetchYFinTickerCandles(dummyList,symbolType=symbolType,delaySec=6,partial=False,useNseCharting=False)
              
            df = pd.read_csv(csv_filename)
            # Parse the 'Date' column as datetime
            df['Date'] = pd.to_datetime(df['Date']) 
            last_row_date = df.iloc[-1]['Date']
            start_date = last_row_date + timedelta(days=1) # next day
            end_date = current_date + timedelta(days=1)
        except Exception as e:
            logger1.info(f"An error occurred: {e}")
            traceback.print_exc()  # <-- this prints the full stack trace with line number
            unsupported_tickers.append(obj["SYMBOL"])
            continue

        if last_row_date.date() >= current_date:
        #if last_row_date.date() >= date(2025, 4, 25):
            logger1.info("All Synced up, skipping ...")
            continue
        
        if useNseBhavCopy:
          result = convert_to_yahoo_style(bhavCopy, getBhavCopyNameForTicker(obj["SYMBOL"]))
        else:
          result = getyFinTickerCandles(getYFinTickerName(obj["SYMBOL"],symbolType), \
                                        start_date=start_date, \
                                        end_date=end_date)
          logger1.info(result)
        
        if result is not None and not result.empty:
            df.reset_index(drop=True)
            df['Date'] = pd.to_datetime(df['Date'], utc=True)  # Ensures UTC, avoids FutureWarning
            df.set_index('Date', inplace=True)

            df.index = df.index.tz_convert(ist_timezone)
            result.index = result.index.tz_convert(ist_timezone)

            concatenated_df = pd.concat([df, result])
            concatenated_df = concatenated_df[~concatenated_df.index.duplicated()]        
            concatenated_df.reset_index(inplace=True)
            concatenated_df.sort_values("Date", inplace=True)
            
            # STOCK SPLIT or STOCK BONUS ?
            if len(concatenated_df) >= 2:
              second_last_close = concatenated_df.iloc[-2]['Close']
              last_close = concatenated_df.iloc[-1]['Close']
              percent_change = ((last_close - second_last_close) / second_last_close) * 100

            if percent_change <= -20 or percent_change >= 20:
              dummyList = [{"SYMBOL":obj["SYMBOL"]}]
              fetchYFinTickerCandles(dummyList,symbolType="NSE",delaySec=6,partial=False,useNseCharting=False)
              split_tickers.append(obj["SYMBOL"])
            else:
              try:
                  concatenated_df.to_csv(csv_filename, index=False, encoding='utf-8')
                  logger1.info("Saved " + csv_filename)
                  if not useNseBhavCopy:
                      time.sleep(delaySec)
              except Exception as e:
                  logger1.info(f"An error occurred: {e}")
        else:
           logger1.info("UNSUPPORTED " + str(idx) + " " + obj["SYMBOL"] )
           unsupported_tickers.append(obj["SYMBOL"])
           
    if unsupported_tickers:
      df = pd.DataFrame(unsupported_tickers)
      csv_filename = os.path.join("stock_info", "temp", f"yFinUnsupportedTickers_syncUpYFinTickerCandles_{symbolType}.csv")
      df.to_csv(csv_filename, index=False, encoding='utf-8')
      logger1.info("saved " + csv_filename)
      
    if split_tickers:
      df = pd.DataFrame(split_tickers)
      csv_filename = os.path.join("stock_info", "temp", f"yFinSplitTickers_syncUpYFinTickerCandles{symbolType}.csv")
      df.to_csv(csv_filename, index=False, encoding='utf-8')
      logger1.info("saved " + csv_filename)
      
def syncUpYahooFinOtherSymbols():
  symbolTypeList = ["GLOBAL_INDEX","CURRENCY","COMMODITY_ETF","CRYPTO"]
  for symbolType in symbolTypeList:
    symbolList = getJsonFromCsvForSymbols(symbolType)
    logger1.info(symbolList)
    syncUpYFinTickerCandles(symbolList,symbolType,delaySec=5)

def getIndexForNseDocuments(urlType):
    index_type = {
        "announcement":"equities",
        #events
        "events":"equities",
        "upcomingIssues":None,
        "forthcomingListing":None,
        "forthcomingOfs":None,
        #fund raise
        "rightsFilings":"equities",
        "qipFilings":"qip",
        "prefIssue":"inListing",
        "schemeOfArrangement":"equities",
        #results
        "integratedResults":"equities",
        
        "bulkDeals":None,
        "blockDeals":None,
        "shortDeals":None,
        "sastDeals":"equities",
        "insiderDeals":"equities",
        "upcomingTender": None,
        "upcomingRights":None,
        "liveTender": None,
        "liveRights":None
    }
    return index_type[urlType]

def getNseCookies():
  response = fetchUrl(getBaseUrl(urlType="announcement"))
  cookies = response.cookies
  return cookies

def syncUpAllNseFillings(cookies = None):

  syncUpNseDocuments(urlType="announcement", cookies=cookies)
  
  syncUpNseDocuments(urlType="events",endDateOffset=30, cookies=cookies)
  syncUpNseDocuments(urlType="upcomingIssues", cookies=cookies)
  syncUpNseDocuments(urlType="forthcomingListing", cookies=cookies)
  syncUpNseDocuments(urlType="forthcomingOfs", cookies=cookies)
  syncUpNseDocuments(urlType="upcomingTender", cookies=cookies_local)
  
  syncUpNseDocuments(urlType="rightsFilings", cookies=cookies)
              
  syncUpNseDocuments(urlType="qipFilings", cookies=cookies)
  syncUpNseDocuments(urlType="prefIssue", cookies=cookies)
  syncUpNseDocuments(urlType="schemeOfArrangement", cookies=cookies)
  
  syncUpNseDocuments(urlType="integratedResults", startDateOffset=3, cookies=cookies)
  
  syncUpNseDocuments(urlType="bulkDeals", cookies=cookies)
  syncUpNseDocuments(urlType="blockDeals", cookies=cookies)
  syncUpNseDocuments(urlType="shortDeals", cookies=cookies)
  syncUpNseDocuments(urlType="sastDeals", cookies=cookies)
  syncUpNseDocuments(urlType="insiderDeals", cookies=cookies)
  
  pass

'''
"prefIssue" , "forthcomingListing"
UserWarning: Could not infer format, so each element will be parsed individually, falling back to `dateutil`. To ensure parsing is consistent and as-expected, please specify a format.
'''
def fetchAllNseFillings():
  
  response = fetchUrl(getBaseUrl(urlType="announcement"))
  cookies = response.cookies
  
  # fetchNseDocuments(urlType="announcement",
  #                 index="equities",
  #                 start_date=datetime(2025, 6, 1), 
  #                 end_date=datetime(2025, 7, 12),
  #                 cookies=cookies)
  
  # fetchNseDocuments(urlType="events",
  #                   index="equities",
  #                   start_date=datetime(2025, 6, 1), 
  #                   end_date=datetime(2025, 7, 12),
  #                   cookies=cookies)
  
  # fetchNseDocuments("upcomingIssues", cookies=cookies)

  # fetchNseDocuments("forthcomingListing", cookies=cookies)
  
  fetchNseDocuments(urlType="upcomingTender",cookies=cookies_local)
  
  fetchNseDocuments(urlType="rightsFilings", 
                    index="equities",
                    start_date=datetime(2025, 6, 1), 
                    end_date=datetime(2025, 8, 7), 
                    cookies=cookies)
  
  # fetchNseDocuments(urlType="qipFilings",
  #                   index="qip",
  #                   start_date=datetime(2025, 6, 1), 
  #                   end_date=datetime(2025, 7, 12),
  #                   cookies=cookies)
  
  # fetchNseDocuments(urlType="prefIssue",
  #                   index="inListing",
  #                   start_date=datetime(2025, 6, 1),
  #                   end_date=datetime(2025, 7, 12),
  #                   cookies=cookies)
  
  # fetchNseDocuments(urlType="schemeOfArrangement",
  #                   index="equities",
  #                   start_date=datetime(2025, 6, 1), 
  #                   end_date=datetime(2025, 7, 12),
  #                   cookies=cookies)
  
  # fetchNseDocuments(urlType="integratedResults",
  #                   index="equities",
  #                   start_date=datetime(2025, 6, 1), 
  #                   end_date=datetime(2025, 7, 12),
  #                   cookies=cookies)
  
  # fetchNseDocuments("bulkDeals", cookies=cookies)
  # fetchNseDocuments("blockDeals", cookies=cookies)
  # fetchNseDocuments("shortDeals", cookies=cookies)
  
  # fetchNseDocuments("forthcomingOfs", cookies=cookies)
  # fetchNseDocuments("sastDeals", index="equities", cookies=cookies)
  # fetchNseDocuments(urlType="insiderDeals",
  #                   index="equities",
  #                   start_date=datetime(2025, 7, 1), 
  #                   end_date=datetime(2025, 8, 3),
  #                   cookies=cookies)
  pass
  

'''
use separate = True if you want to store current delta in a separate file, it 
will be stored with suffix of last hash.
'''
def syncUpCalculatePercentageForAnnouncement(separate=False):
    input_announcement_csv = os.path.join("stock_fillings", "announcements.csv")
    output_csv = os.path.join("output", "announcements_with_percentage.csv")

    processed = getLastProcessedHashForPercentage(output_csv)

    logger1.info("processed_len " +str(processed["processed_len"]) + \
          " processed_hash " + str(processed["processed_hash"]))
    
    df_input = pd.read_csv(os.path.abspath(input_announcement_csv))
    row_number = df_input.index[df_input['hash'] == processed["processed_hash"]].tolist()[0]
    input_len = len(df_input)
    diff = input_len - (row_number+1)

    df_subset = df_input.iloc[(row_number+1):input_len]
    json_data = df_subset.to_dict(orient='records')
    logger1.info("New data set size " + str(diff))
    logger1.info(df_subset)

    json_data, unsupported_symbols = getPercentageChangeList(json_data)
    
    df = pd.DataFrame(json_data)
    if separate:
      output_csv = os.path.join("output", f"announcements_with_percentage_{processed['processed_hash']}.csv")
      df.to_csv(output_csv, index=False, encoding='utf-8')
    else:
      df.to_csv(output_csv, index=False, header=False, mode='a', encoding='utf-8')
    logger1.info("saved " + output_csv)

    if unsupported_symbols:
      df = pd.DataFrame(unsupported_symbols)
      csv_filename = os.path.join("output", f"unsupportedSymbols_{processed['processed_hash']}.csv")
      df.to_csv(csv_filename, index=False, encoding='utf-8')
      logger1.info("saved " + csv_filename)

def syncUpNseCommodity(nseCommodityList, delaySec=6, useNseBhavCopy = False, cookies = None):
    ist_timezone = pytz.timezone('Asia/Kolkata')
    current_date = get_last_trading_day()
    unsupported_tickers = []
    bhavCopy = None
    
    if useNseBhavCopy:
      bhavCopy = fetchNseJsonObj("commoditySpotAll", index="commodityspotrates",cookies=cookies)
    else:
      if not cookies:
        response = fetchUrl(getBaseUrl("commodityIndividual"))
        cookies = response.cookies

    for idx, obj in enumerate(nseCommodityList):
        logger1.info("fetching " + str(idx) + " " + obj["SYMBOL"] )
        csv_filename = os.path.join("stock_charts", f"{obj['SYMBOL']}.csv")

        # Read the CSV data into a DataFrame
        try:
            df = pd.read_csv(csv_filename)
            # Parse the 'Date' column as datetime
            df['Date'] = pd.to_datetime(df['Date']) 

            last_row_date = df.iloc[-1]['Date']
            last_row_date = normalize_to_date(last_row_date)
            start_date = last_row_date + timedelta(days=1) # next day
            end_date = current_date + timedelta(days=1)

            if last_row_date >= current_date:
            #if last_row_date.date() >= date(2025, 4, 25):
                logger1.info("All Synced up, skipping ...")
                continue
                          
            # if isinstance(start_date, datetime):
            #     start_date = start_date.date()
            # else:
            #     start_date = start_date  # already a date
            
            if useNseBhavCopy:
              #1. fetch all bhav copies for given dates - remove holidays and weekends
              #2. iterate and concat the results
              result = convert_nse_spot_commodity_to_yahoo_style(bhavCopy, getBhavCopyNameForTicker(obj["SYMBOL"]))
              # logger1.info(result)
            else:
              instrumentType = get_value_by_key(nseCommodityList, "SYMBOL", obj["SYMBOL"], "instrumentType")
              result = fetchNseJsonObj("commodityIndividual", 
                                    symbol=obj["SYMBOL"], 
                                    instrumentType=instrumentType,
                                    fromDate=start_date, 
                                    toDate=end_date,
                                    delaySec=delaySec,
                                    listExtractKey="data",
                                    cookies=cookies)
              result = convert_nse_commodity_to_yahoo_style(result)
            
            if result is not None and not result.empty:
                df.reset_index(drop=True)
                df.set_index('Date', inplace=True)

                df.index = df.index.tz_convert(ist_timezone)
                result.index = result.index.tz_convert(ist_timezone)

                concatenated_df = pd.concat([df, result])
                concatenated_df = concatenated_df[~concatenated_df.index.duplicated(keep='last')]
                concatenated_df.reset_index(inplace=True)

                try:
                    concatenated_df.to_csv(csv_filename, index=False, encoding='utf-8')
                    logger1.info("Saved " + csv_filename)
                    if not useNseBhavCopy:
                        time.sleep(delaySec)
                except Exception as e:
                    logger1.info(f"An error occurred: {e}")
            else:
              logger1.info("UNSUPPORTED " + str(idx) + " " + obj["SYMBOL"] )
              unsupported_tickers.append(obj["SYMBOL"])
        except Exception as e:
            logger1.warning(f"Exception while fetching {obj['SYMBOL']}: {e}")
            traceback.print_exc()  # <-- this prints the full stack trace with line number
            unsupported_tickers.append(obj["SYMBOL"])
           
    if unsupported_tickers:
      df = pd.DataFrame(unsupported_tickers)
      csv_filename = os.path.join("stock_info", "temp", "yFinUnsupportedTickers_syncUpNseCommodity.csv")
      df.to_csv(csv_filename, index=False, encoding='utf-8')
      logger1.info("saved " + csv_filename)


'''
#yahooFinTesting("RELIANCE.NS")
''' 
def yahooFinTesting(yFinTicker, full=None, date=None):
    # Set the timezone to UTC
    ist_timezone = pytz.timezone('Asia/Kolkata')
    
    if date:
        # Convert the input date to UTC timezone
        date_ist = date.astimezone(ist_timezone)
    
        # calculate start_date and end_date
        start_date = date_ist
        end_date = start_date + datetime.timedelta(days=1)

    tickerInformation = yf.Ticker(yFinTicker)
    
    if date:
        tickerHistory = tickerInformation.history(start=start_date, end=end_date) 
        logger1.info(tickerHistory)

    logger1.info("information")
    #logger1.info(tickerInformation.info)

    if full:
        logger1.info("history_metadata")
        #logger1.info(tickerInformation.history_metadata)

        logger1.info("actions")
        #logger1.info(tickerInformation.actions)

        logger1.info("news")
        #logger1.info(tickerInformation.news)
        
        logger1.info("analyst_price_targets")
        #logger1.info(tickerInformation.analyst_price_targets)
        
        logger1.info("quarterly_income_stmt")
        statement_df = tickerInformation.quarterly_income_stmt
        
    return statement_df[['2025-03-31']] 
    
def yahooFinMulti():
  tickers = yf.Tickers('MSFT AAPL GOOG')
  logger1.info(tickers.tickers['MSFT'].info)
  logger1.info(tickers.tickers['AAPL'].info)
  logger1.info(tickers.tickers['GOOG'].info)
  # yf.download(['MSFT', 'AAPL', 'GOOG'], period='1mo')

'''
#yahooSingleTicker("RELIANCE.NS")
'''    
def yahooSingleTicker(yFinTicker):
    tickerInformation = yf.Ticker(yFinTicker)
    logger1.info("information")
    logger1.info(tickerInformation.info)

def objList_to_dict(objects_list, key):
    lookup_dict = {}
    for obj in objects_list:
        lookup_value = obj.get(key)
        lookup_dict[lookup_value] = obj  # If unique values are expected
    return lookup_dict

def searchInText(text, keywords):
    # Split the text into lines
    lines = text.splitlines()

    # Dictionary to hold search results
    search_results = {}

    for keyword in keywords:
        keyword_pattern = re.compile(rf'\b{re.escape(keyword)}\b', re.IGNORECASE)
        for line_number, line in enumerate(lines, start=1):
            if re.search(keyword_pattern, line):
                if keyword not in search_results:
                    search_results[keyword] = []
                search_results[keyword].append((line_number, line.strip()))

    return search_results

def getStockInfoObj(stockInfoList, stockNseName):
    yFinStock = getYFinTickerName(stockNseName)

def nseStockFilterTest():
    count = 0
    nseStockList = getAllNseSymbols(local=False)
    #logger1.info(nseStockList)

    # get stock info
    stockInfoList = readYFinStockInfo()
    stockInfoDict = objList_to_dict(stockInfoList, "symbol")

    for i, entry in enumerate(nseStockList):
        stockInfoObj = stockInfoDict.get(getYFinTickerName(nseStockList[i]['SYMBOL']))
        if stockInfoObj:
            if rupees_to_crores(stockInfoObj['marketCap']) > 1000:
                count = count + 1

    logger1.info("Total counts : " + str(count))

def searchKeywordsFromCsvList(csv_filename, keywords, downloadDir="."):
    attachmentKey = "attchmntFile"
    symbolKey = "symbol"
    titleKey = "desc"
    companyNameKey = "sm_name"
    descriptionKey = "attchmntText"
    dateKey = "an_dt"
    entryWithKeywords = 0

    # get stock info
    stockInfoList = readYFinStockInfo()
    stockInfoDict = objList_to_dict(stockInfoList, "symbol")

    # Read the CSV data into a DataFrame
    df = pd.read_csv(csv_filename)

    # Parse the 'an_dt' column as datetime
    df['an_dt'] = pd.to_datetime(df['an_dt'])

    # Iterate over the DataFrame rows
    for index, row in df.iterrows():
        # Check if the attachment key exists and is not NaN
        if pd.notna(row[attachmentKey]) and len(row[attachmentKey]) > 10:
            logger1.info(str(index) + " " + row[attachmentKey])  # Access row by column name
            url = row[attachmentKey]
            if url or len(url) < 10:
                # Get the file name from the URL
                fileName = url.split("/")[-1]
                fileExtension = fileName.split(".")[-1]
                filePath = os.path.join(downloadDir, fileName)

                stockInfoObj = stockInfoDict.get(getYFinTickerName(row['symbol']))

                # Check if the output directory exists
                if fileExtension.lower() in accepted_extensions and \
                    os.path.exists(filePath) and \
                    row['symbol'] not in avoid_tickers:

                    results = search_keywords_in_pdf(filePath, keywords, jpg_pdf = True)
                    if results:
                        #details from yahoo fin
                        if stockInfoObj:
                              if rupees_to_crores(stockInfoObj['marketCap']) > market_cap_limit_cr:
                                  logger1.info("==============================================================")
                                  logger1.info("Name: " + row[companyNameKey] + "\n" +
                                        "Title: " + row[titleKey] + "\n" +
                                        "Desc: " + row[descriptionKey] + "\n" + 
                                        "Link: " + row[attachmentKey] + "\n" +
                                        "Market cap(cr): " + str(rupees_to_crores(stockInfoObj['marketCap'])))

                                  print_keyword_search_results(results)
                                  entryWithKeywords = entryWithKeywords + 1
                                  logger1.info("==============================================================")
                        else:
                            logger1.info("** NO YAHOO FIN OBJ **")

    logger1.info("Out of " + str(len(df)) + " entry matches " + str(entryWithKeywords))

'''
'''
def generateAnnouncementAnalysis():
    fetchNseDocuments(urlType="announcement",
                      start_date=datetime(2024, 5, 4), 
                      end_date=datetime(2024, 5, 4),
                      file_name = os.path.join("stock_fillings", f"announcements_{formatted_datetime}.csv"))

    downloadFilesFromCsvList(os.path.join("stock_fillings", f"announcements_{formatted_datetime}.csv"),
                            downloadDir="downloads")

    searchKeywordsFromCsvList(os.path.join("stock_fillings", f"announcements_{formatted_datetime}.csv"),
                              announcementKeywords,
                              downloadDir="downloads")

# ==========================================================================
# =========================== NSE Extra functions =========================

def fetch_public_holidays(local=True):
    file_path = csv_list["NSE_HOLIDAYS"].local_url

    if local:
        if os.path.exists(file_path):
            df = pd.read_csv(file_path)
        else:
            logger1.info(f"Local file not found at {file_path}. Fetching from source...")
            local = False  # Fall back to fetch if file doesn't exist

    if not local:
        try:
            resp = fetchNseJsonObj("tradingHoliday")
            data = resp.get("FO", [])
            df = pd.DataFrame(data)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            df.to_csv(file_path, index=False)
        except Exception as e:
            logger1.info(f"Failed to fetch data from source: {e}")
            df = pd.DataFrame()  # Return empty DataFrame on failure

    return df
  
def get_last_trading_day():
    ist = pytz.timezone("Asia/Kolkata")
    now = datetime.now(ist)

    # If before 9:30 AM IST, treat it as "not yet trading"
    if now.hour < 9 or (now.hour == 9 and now.minute < 30):
        current = now.date() - timedelta(days=1)
    else:
        current = now.date()

    # Walk back until a valid trading day is found
    while True:
        dt = datetime.combine(current, datetime.min.time()).replace(tzinfo=ist)
        if is_trading_day(dt):
            return dt.date()
        current -= timedelta(days=1)
  
'''
date2 = datetime.strptime("14-Mar-2025", "%d-%b-%Y")
logger1.info(is_trading_day(date2))  # Output: False (Republic Day, Sunday)

date2 = datetime.strptime("18-Jan-2025", "%d-%b-%Y")
logger1.info(is_trading_day(date2))  # Output: True (Tuesday, not a holiday)

date2 = datetime.strptime("22-Jan-2025", "%d-%b-%Y")
logger1.info(is_trading_day(date2))  # Output: True (Tuesday, not a holiday)
'''  
def is_trading_day(date_to_check):

    holidays_df = fetch_public_holidays(local=True)

    # Convert holiday column to datetime
    holidays_df['tradingDate'] = pd.to_datetime(
        holidays_df['tradingDate'], format='%d-%b-%Y', errors='coerce'
    )
    
    # Extract date part only for comparison
    holiday_dates = holidays_df['tradingDate'].dt.date

    input_date = date_to_check.date()

    # 🐞 Debugging Print
    # logger1.info("Checking date:", input_date)
    # logger1.info("Holiday list sample:", holiday_dates.head(10).tolist())

    # Weekend check
    if date_to_check.weekday() >= 5:
        #logger1.info("It's a weekend.")
        return False

    # Holiday check
    if input_date in holiday_dates.values:
        #logger1.info("It's a holiday.")
        return False

    #logger1.info("It's a trading day.")
    return True

'''
https://charting.nseindia.com/?symbol=RELIANCE-EQ

{
    "exch": "N",
    "tradingSymbol": "RELIANCE-EQ",
    "fromDate": 1746719996,
    "toDate": 1746761008,
    "timeInterval": 1,
    "chartPeriod": "D",
    "chartStart": 0
}

{
    "exch": "N",
    "tradingSymbol": "RELIANCE-EQ",
    "fromDate": 1746719996,
    "toDate": 1746761069,
    "timeInterval": 1,
    "chartPeriod": "D",
    "chartStart": 0
}

response
{
    "s": "Ok",
    "t": [
        1750436099
    ],
    "o": [
        24787.65
    ],
    "h": [
        25136.2
    ],
    "l": [
        24783.65
    ],
    "c": [
        25112.4
    ],
    "v": [
        1
    ]
}

https://www.nseindia.com/market-data/live-market-indices
https://www.nseindia.com/market-data/index-performances
https://www.nseindia.com/market-data/live-market-indices/heatmap
'''
def get_nse_chart_data(symbol="RELIANCE", interval=1, period="D", fromDate=None, toDate=None, printData=None):
    url = "https://charting.nseindia.com//Charts/ChartData/"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        "Content-Type": "application/json; charset=utf-8",
        "Origin": "https://charting.nseindia.com",
        "Referer": "https://charting.nseindia.com/",
        "Accept": "*/*"
    }
    symbol = getYFinTickerName(symbol,"NSE_CHARTING")

    # Convert datetime to epoch (in seconds)
    from_epoch = 0 if fromDate is None else int(fromDate.timestamp())
    to_epoch = int(toDate.timestamp()) if toDate else int(datetime.now().timestamp())

    payload = {
        "exch": "N",
        "tradingSymbol": symbol,
        "fromDate": from_epoch,
        "toDate": to_epoch,
        "timeInterval": interval,
        "chartPeriod": period,
        "chartStart": 0
    }

    session = requests.Session()
    session.headers.update(headers)

    # Initial request to set cookies (optional, helps with bot protection)
    session.get("https://charting.nseindia.com", timeout=5)

    # Actual POST request
    response = session.post(url, data=json.dumps(payload), timeout=10)
    #logger1.info(response.text)

    if response.status_code == 200:
        data = response.json()
        
        if printData:
          timestamps = data["t"]
          opens = data["o"]
          highs = data["h"]
          lows = data["l"]
          closes = data["c"]
          volumes = data["v"]

          logger1.info("Date       | Open  | High  | Low   | Close | Volume")
          logger1.info("-----------|-------|-------|-------|-------|--------")

          for i in range(len(timestamps)):
              dt = datetime.fromtimestamp(timestamps[i], tz=timezone.utc)
              ts = dt.strftime("%Y-%m-%d")
              #ts = timestamps[i] if i < len(opens) else "-"
              
              o = opens[i] if i < len(opens) else "-"
              h = highs[i] if i < len(highs) else "-"
              l = lows[i] if i < len(lows) else "-"
              c = closes[i] if i < len(closes) else "-"
              v = volumes[i] if i < len(volumes) else "-"
              logger1.info(f"{ts} | {o:<5} | {h:<5} | {l:<5} | {c:<5} | {v}")
        
        df = convert_nse_chart_data_to_yahoo_df(data)
        return df
    else:
        logger1.warning(f"Request failed: {response.status_code}")
        logger1.info(response.text)
        return None

'''
logger1.info(get_bhavcopy(date(2025, 6, 14)))
'''
def get_bhavcopy(date=None, saveCSV=False):
    if date is None:
      date = get_last_trading_day()
      date = date.strftime("%d-%m-%Y")
    else:
      date = date.strftime("%d-%m-%Y")

    date_str = date.replace("-", "")
    url = f"https://archives.nseindia.com/products/content/sec_bhavdata_full_{date_str}.csv"
    logger1.info("fetching " + url)

    try:
        df = pd.read_csv(url)
        df.columns = df.columns.str.strip().str.upper()  # Normalize column names
        logger1.info(f"Bhavcopy loaded for {date}")

        if saveCSV:
            filename = f"output/bhavcopy_{date_str}.csv"
            df.to_csv(filename, index=False)
            logger1.info(f"Saved to {filename}")

        return df
    except Exception as e:
        logger1.warning(f"Failed to load Bhavcopy for {date}: {e}")
        return pd.DataFrame()


def get_bulkdeals():
    payload=pd.read_csv("https://archives.nseindia.com/content/equities/bulk.csv")
    return payload

def get_blockdeals():
    payload=pd.read_csv("https://archives.nseindia.com/content/equities/block.csv")
    return payload


def convert_nse_chart_data_to_yahoo_df(data):
    """
    Converts NSE chart data to Yahoo Finance style DataFrame.

    Parameters:
    - data: dict with keys 't', 'o', 'h', 'l', 'c', 'v'

    Returns:
    - DataFrame with Yahoo style format: Open, High, Low, Close, Volume, Dividends, Stock Splits
    """
    
    if not data or not data.get("t"):  # Check if data or timestamps are empty
      return pd.DataFrame(columns=["Open", "High", "Low", "Close", "Volume", "Dividends", "Stock Splits"])

    timestamps = data.get("t", [])
    opens = data.get("o", [])
    highs = data.get("h", [])
    lows = data.get("l", [])
    closes = data.get("c", [])
    volumes = data.get("v", [])

    records = []
    for i in range(len(timestamps)):
        try:
            dt = datetime.fromtimestamp(timestamps[i], tz=timezone.utc).astimezone()  # Local time
            record = {
                "Date": dt,
                "Open": opens[i] if i < len(opens) else None,
                "High": highs[i] if i < len(highs) else None,
                "Low": lows[i] if i < len(lows) else None,
                "Close": closes[i] if i < len(closes) else None,
                "Volume": volumes[i] if i < len(volumes) else 0,
                "Dividends": 0.0,
                "Stock Splits": 0.0
            }
            records.append(record)
        except Exception as e:
            logger1.warning(f"Error processing index {i}: {e}")

    df = pd.DataFrame(records)
    df.set_index("Date", inplace=True)
    df.sort_index(inplace=True)
    return df


"""
Converts NSE Bhavcopy row to Yahoo Finance-style OHLCV data for a given symbol.

Parameters:
- bhavcopy_df (pd.DataFrame): Output of get_bhavcopy()
- symbol (str): Stock symbol (e.g., 'ZYDUSWELL')

Returns:
- pd.DataFrame: Yahoo Finance-style dataframe with one row


Bhav Copy Output
SYMBOL    SERIES DATE1   PREV_CLOSE OPEN_PRICE HIGH_PRICE LOW_PRICE  LAST_PRICE CLOSE_PRICE AVG_PRICE TTL_TRD_QNTY  TURNOVER_LACS   NO_OF_TRADES DELIV_QTY  DELIV_PER
ZYDUSWELL EQ     04-Jun  1949.70    1950.00    1965.40    1894.00    1899.00    1900.10     1915.31   143636        2751.08         6551         120854      84.14


Yahoo Fin Object
                             Open         High     Low        Close  Volume  Dividends  Stock Splits
Date
2025-06-04 00:00:00+05:30  1950.0  1965.400024  1894.0  1900.099976  143561        0.0           0.0
"""
def convert_to_yahoo_style(bhavcopy_df, symbol):
    bhavcopy_df.columns = bhavcopy_df.columns.str.strip().str.upper()

    row = bhavcopy_df[
        (bhavcopy_df['SYMBOL'] == symbol.upper()) &
        (bhavcopy_df['SERIES'].str.strip().isin(['EQ', 'BE', 'BZ']))
    ]

    if row.empty:
        logger1.warning(f"Symbol '{symbol}' not found.")
        return pd.DataFrame()

    row = row.iloc[0]

    # Proper datetime with IST timezone
    date = pd.to_datetime(row['DATE1'].strip(), format='%d-%b-%Y')
    date = date.tz_localize('Asia/Kolkata')

    yahoo_row = {
        'Open': float(row['OPEN_PRICE']),
        'High': float(row['HIGH_PRICE']),
        'Low': float(row['LOW_PRICE']),
        'Close': float(row['CLOSE_PRICE']),
        'Volume': int(row['TTL_TRD_QNTY']),
        'Dividends': 0.0,
        'Stock Splits': 0.0
    }

    yahoo_df = pd.DataFrame([yahoo_row], index=[date])
    yahoo_df.index.name = "Date"  # Match Yahoo Finance format
    return yahoo_df
  
def convert_nse_spot_commodity_to_yahoo_style(df, symbol):

    ist = pytz.timezone("Asia/Kolkata")

    # Filter by symbol (case-insensitive)
    match = df[df['symbol'].str.upper() == symbol.upper()]
    if match.empty:
        logger1.warning(f"Symbol '{symbol}' not found.")
        return pd.DataFrame()

    entry = match.iloc[0]

    # Parse the date
    try:
        date_obj = datetime.strptime(entry["updatedDate"], "%d-%b-%Y")
    except ValueError:
        date_obj = datetime.strptime(entry["updatedDate"], "%d-%b-%y")

    date_obj = ist.localize(date_obj)

    # Parse price
    try:
        price = float(str(entry["lastSpotPrice"]).replace(",", ""))
    except:
        logger1.warning(f"Could not parse price for '{symbol}'")
        return pd.DataFrame()

    # Create Yahoo-style DataFrame
    df_yahoo = pd.DataFrame([{
        "Date": pd.to_datetime(date_obj),
        "Open": price,
        "High": price,
        "Low": price,
        "Close": price,
        "Volume": 0,
        "Dividends": 0.0,
        "Stock Splits": 0.0
    }])

    df_yahoo.set_index("Date", inplace=True)
    return df_yahoo
 
def convert_nse_commodity_to_yahoo_style(df):
    # Step 1: Convert date columns to datetime
    df['COM_TIMESTAMP'] = pd.to_datetime(df['COM_TIMESTAMP'], format="%d-%b-%Y", errors='coerce')
    df['COM_EXPIRY_DT'] = pd.to_datetime(df['COM_EXPIRY_DT'], format="%d-%b-%Y", errors='coerce')

    # Step 2: Filter rows where expiry is on/after timestamp
    valid_rows = df[df['COM_EXPIRY_DT'] >= df['COM_TIMESTAMP']]

    # Step 3: For each COM_TIMESTAMP, find the row with the closest expiry
    closest_rows = valid_rows.loc[
        valid_rows.groupby('COM_TIMESTAMP')['COM_EXPIRY_DT'].idxmin()
    ]

    # Step 4: Convert COM_TIMESTAMP to timezone-aware datetime (IST)
    ist = pytz.timezone('Asia/Kolkata')
    closest_rows['Date'] = closest_rows['COM_TIMESTAMP'].apply(
        lambda x: ist.localize(datetime.combine(x.date(), datetime.min.time()))
    )

    # Step 5: Create Yahoo Finance style DataFrame
    yf_df = closest_rows.set_index('Date')[['COM_SETTLE_PRICE']].rename(
        columns={'COM_SETTLE_PRICE': 'Close'}
    )

    for col in ['Open', 'High', 'Low']:
        yf_df[col] = yf_df['Close']
    yf_df['Volume'] = 0
    yf_df['Dividends'] = 0.0
    yf_df['Stock Splits'] = 0.0

    # Rearrange columns
    yf_df = yf_df[['Open', 'High', 'Low', 'Close', 'Volume', 'Dividends', 'Stock Splits']]

    # keep='last' will keep the last occurrence
    yf_df = yf_df[~yf_df.index.duplicated(keep='last')]

    return yf_df

# ==========================================================================
# =========================== NSE results functions =========================

def clean_label(label):
    if not isinstance(label, str):
        return label
    return re.sub(r'\s+', ' ', label.replace('\n', ' ')).strip().lower()

def nse_html_to_json_results(url, period='period_short'):
  
  input_data = scrape_financial_results_to_json(url)
   
  pd.options.display.float_format = '{:,.2f}'.format
  pd.set_option('display.max_colwidth', None)

  # Convert to DataFrame
  df = pd.DataFrame(input_data)
  df['label'] = df['label'].apply(clean_label)
  # logger1.info(df)

  # Validate period column
  if period not in ['period_short', 'period_ytd']:
      raise ValueError("Invalid period. Use 'period_short' or 'period_ytd'.")

  # Helper function to get value by label
  def get(label):
      match = df.loc[df['label'].str.strip() == label.strip()]
      try:
          return float(match[period].values[0]) if not match.empty and period in match.columns else 0.0
      except (ValueError, TypeError):
          return 0.0
        
  def get_ytd(label):
      match = df.loc[df['label'].str.strip() == label.strip()]
      try:
          return float(match['period_ytd'].values[0]) if not match.empty and 'period_ytd' in match.columns else 0.0
      except (ValueError, TypeError):
          return 0.0

  title = df.loc[df['label'] == 'title', 'period_short'].values[0]
  start_date = df.loc[df['label'] == 'date of start of reporting period', 'period_short'].values[0]
  end_date = df.loc[df['label'] == 'date of end of reporting period', 'period_short'].values[0]
  # logger1.info(title)
  
  # calculate top level revenue
  revenue = get('revenue from operations')
  if not revenue:
    revenue = get("total revenue from operations")
  interestEarned = get('total interest earned')
  interestExpense = get('interest expenses')
  if not revenue and interestEarned != 0:
    revenue = interestEarned #Banking
  
  # individual expnese items
  material_cost = get('cost of materials consumed')
  stock_in_trade = get('purchases of stock-in-trade')
  inventory_change = get('changes in inventories of finished goods, work-in-progress and stock-in-trade')
  employee_expenses =  get('employee benefit expense')
  if employee_expenses == 0:
    employee_expenses = get('employee cost')
  
  finance_cost = get('finance costs')
  
  other_expense = get('total other expenses')
  if not other_expense:
    other_expense = get("total other operating expenses")
  if not other_expense:
    other_expense = get('other expenses')
  
  # calculate total expense
  operating_expense = get("total expenses")
  if not operating_expense:
    operating_expense = get("total operating expenses")
  if not operating_expense:
    operating_expense = get("operating expenses")

  provisions = get("provisions other than tax and contingencies")
  
  #for NBFC change this, also for NBFC total expense already includes finance cost
  if title == "Financial Results — NBFC":
    interestExpense = finance_cost
    finance_cost = 0.0
    operating_expense = operating_expense - interestExpense
     
  exceptional_items = get('exceptional items')
  other_income = get("other income")
  total_other_income = (other_income + exceptional_items)
 
  #depreciation
  depreciation = get('depreciation, depletion and amortisation expense')
    
  #profit before tax
  profit_before_tax = get("total profit before tax")
  if profit_before_tax == 0:
    profit_before_tax = int(get("total profit (loss) from ordinary activities before tax"))
    profit_before_tax_ytd = int(get_ytd("total profit (loss) from ordinary activities before tax")) #Banking

    str1 = str(profit_before_tax)
    str2 = str(profit_before_tax_ytd)
    result = str1[:-len(str2)]
    
    profit_before_tax = float(result)
    
  #net profit
  net_profit = get("total profit (loss) for period")
  if net_profit == 0:
    net_profit = get("net profit (loss) for the period") 

  #eps
  eps = get("diluted earnings (loss) per share from continuing operations")
  if eps == 0:
    eps = get("diluted earnings per share from continuing operations")
  if eps == 0:
    eps = get("basic earnings per share after extraordinary items")

  #derived items
  total_expense = (operating_expense + provisions)   
  operating_profit = revenue - (total_expense + interestExpense)
  
  if profit_before_tax != 0:
    tax_per = (profit_before_tax - net_profit)*100/profit_before_tax
  else:
    tax_per = 0
    
  if revenue !=0:
    opm = operating_profit * 100/revenue
  else:
    opm = 0
    
  # logger1.info(json.dumps(xbrl_data, indent=2))
  
  result_obj = {
    "Sales": revenue,
    "InterestBanking": interestExpense,
    "Expenses": total_expense,
    "OperatingProfit": operating_profit,
    "OPM": opm,
    "OtherIncome": total_other_income,
    "ExceptionalItem": exceptional_items,
    "Interest": finance_cost,
    "Depreciation": depreciation,
    "ProfitBeforeTax": profit_before_tax,
    "TaxPercentage": tax_per,
    "NetProfit": net_profit,
    "EPS": eps
  }
  
  return result_obj

def scrape_financial_results_to_json(url):
    try:
        response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "html.parser")
        tables = soup.find_all("table")

        for table in tables:
            if "Financial Results" in table.get_text():
                rows = table.find_all("tr")
                table_data = []

                # mark
                for row in rows:
                    h3 = row.find("h3")
                    if h3:
                        # Add as a label row or tag
                        table_data.append({
                            "label": "title",
                            "period_short": h3.get_text(strip=True),
                            "period_ytd": h3.get_text(strip=True)
                        })
                        continue
                      
                    cols = row.find_all(["td", "th"])
                    texts = [col.get_text(strip=True) for col in cols]
                    #logger1.info(texts)

                    # Skip rows that are clearly not data rows
                    if len(texts) < 3:
                        continue

                    label = None
                    short_val = None
                    ytd_val = None

                    if len(texts) >= 4:
                        label_1 = texts[1]
                        if label_1 == "Date of start of reporting period" or label_1 == "Date of end of reporting period":
                          table_data.append({
                              "label": label_1,
                              "period_short": texts[2],
                              "period_ytd": texts[3]
                          })
                          
                        # Clean and parse numbers
                        short_val_str = texts[2].replace(",", "").replace("₹", "").strip()
                        ytd_val_str = texts[3].replace(",", "").replace("₹", "").strip()

                        try:
                            short_val = float(short_val_str)
                        except:
                            short_val = None

                        try:
                            ytd_val = float(ytd_val_str)
                        except:
                            ytd_val = None

                        # Extract label from first or second column
                        for t in reversed(texts[:2]):
                            if t and not t.isdigit():
                                # Remove trailing digits from label
                                cleaned_label = re.sub(r'[\d\.,]+$', '', t).strip()
                                label = cleaned_label
                                break

                    if label and (short_val is not None or ytd_val is not None):
                        table_data.append({
                            "label": label,
                            "period_short": short_val,
                            "period_ytd": ytd_val
                        })

                return table_data

        logger1.warning("No 'Financial Results' table found.")
        return []

    except Exception as e:
        logger1.warning(f"Error: {e}")
        return []
     
def compare_dfs(nse_df, yahoo_df):
  # Make sure both DataFrames have the same column name for comparison (e.g., "2025-03-31")
  nse_col = nse_df.columns[0]
  yahoo_col = yahoo_df.columns[0]

  # Align both on the same index (row labels)
  common_index = nse_df.index.intersection(yahoo_df.index)

  # Filter only common rows to avoid KeyErrors
  nse_common = nse_df.loc[common_index]
  yahoo_common = yahoo_df.loc[common_index]

  # Compare the values
  mismatches = []
  for idx in common_index:
      val_nse = nse_common.at[idx, nse_col]
      val_yahoo = yahoo_common.at[idx, yahoo_col]
      
      # Compare with a tolerance (to avoid float rounding issues)
      if pd.isna(val_nse) and pd.isna(val_yahoo):
          continue
      elif pd.isna(val_nse) or pd.isna(val_yahoo):
          mismatches.append((idx, val_nse, val_yahoo))
      elif abs(val_nse - val_yahoo) > 1e-2:  # adjust threshold if needed
          mismatches.append((idx, val_nse, val_yahoo))

  # Print mismatched entries
  if mismatches:
      logger1.warning("\nMismatched entries:")
      for label, nse_val, yahoo_val in mismatches:
          logger1.info(f"{label:50} | NSE: {nse_val:>15,.2f} | Yahoo: {yahoo_val:>15,.2f}")
  else:
      logger1.info("\nAll values matched between NSE and Yahoo.")
      
def nse_xbrl_to_json(xml_path):

    with open(xml_path, "r", encoding="utf-8") as f:
      content = f.read()
      soup = BeautifulSoup(content, "xml")

    # Parse all tags with values
    xbrl_data = []
    for tag in soup.find_all(True):
        if tag.text.strip():
            xbrl_data.append({
                "tag": tag.name,
                "context": tag.get("contextRef", None),
                "unit": tag.get("unitRef", None),
                "decimals": tag.get("decimals", None),
                "value": tag.text.strip()
            })

    # Generic getter with safe float conversion
    def get(tag_name):
        val = next(
            (item.get("value") for item in xbrl_data if item.get("tag") == tag_name and item.get("context") == "OneD"),
            None
        )
        try:
            return float(val)
        except (TypeError, ValueError):
            return 0.0

    title = next((item.get("value") for item in xbrl_data if item.get("tag") == "DescriptionOfSingleSegment"),None)
    start_date = next((item.get("value") for item in xbrl_data if item.get("tag") == "startDate"),None)
    end_date = next((item.get("value") for item in xbrl_data if item.get("tag") == "endDate"),None)
    
    # calculate top level revenue
    revenue = get("RevenueFromOperations")
    if not revenue:
      revenue = get("TotalRevenueFromOperations")
    interestEarned = get("InterestEarned")
    interestExpense = get("InterestExpended")
    if not revenue and interestEarned != 0:
      revenue = interestEarned  #Banking
    
    # individual expnese items
    material_cost = get("CostOfMaterialsConsumed")
    stock_in_trade = get("PurchasesOfStockInTrade")
    inventory_change = get("ChangesInInventoriesOfFinishedGoodsWorkInProgressAndStockInTrade")
    employee_expenses = get("EmployeeBenefitExpense")
    if employee_expenses == 0:
      employee_expenses = get("EmployeesCost")
      
    finance_cost = get("FinanceCosts")
    
    other_expense = get("TotalOtherExpenses")
    if not other_expense:
      other_expense = get("TotalOtherOperatingExpenses")
    if not other_expense:
      other_expense = get("OtherExpenses")
    
    # calculate total expense
    operating_expense = get("TotalExpenses")
    if not operating_expense:
      operating_expense = get("TotalOperatingExpenses")
    if not operating_expense:
      operating_expense = get("OperatingExpenses")
    if not operating_expense:
      operating_expense = get("Expenses")

    provisions = get("ProvisionsOtherThanTaxAndContingencies")
    
    #for NBFC change this, also for NBFC total expense already includes finance cost
    if title == "NBFC" or title == "Financial Activities":
      interestExpense = finance_cost
      finance_cost = 0.0
      operating_expense = operating_expense - interestExpense
    
    exceptional_items = get("ExceptionalItemsBeforeTax")
    other_income = get("OtherIncome")
    other_company_income = get("ShareOfProfitLossOfAssociatesAndJointVenturesAccountedForUsingEquityMethod")
    total_other_income = (other_income + exceptional_items) - other_company_income
    
    #depreciation
    depreciation = get("DepreciationDepletionAndAmortisationExpense")
    
    #profit before tax
    profit_before_tax = get("ProfitBeforeTax")
    if profit_before_tax == 0:
      profit_before_tax = get("ProfitLossFromOrdinaryActivitiesBeforeTax") #Banking
    
    #net profit
    net_profit = get("ProfitLossForPeriod")
    if net_profit == 0:
      net_profit = get("ProfitLossFromOrdinaryActivitiesAfterTax") #Banking
    
    #eps 
    eps = get("DilutedEarningsLossPerShareFromContinuingOperations")
    if eps == 0:
      eps = get("DilutedEarningsPerShareFromContinuingOperations")
    if eps == 0:
      eps = get("BasicEarningsPerShareBeforeExtraordinaryItems")
    
    #derived items
    total_expense = (operating_expense + provisions)             
    operating_profit = revenue - (total_expense + interestExpense)
    
    if profit_before_tax != 0:
      tax_per = (profit_before_tax - net_profit)*100/profit_before_tax
    else:
      tax_per = 0
      
    if revenue !=0:
      opm = operating_profit * 100/revenue
    else:
      opm = 0
      
    PaidUpShareCapital = get("PaidUpValueOfEquityShareCapital")
    FaceValue = get("FaceValueOfEquityShareCapital")

    result_obj = {
      "Sales": revenue,
      "InterestBanking": interestExpense,
      "Expenses": total_expense,
      "OperatingProfit": operating_profit,
      "OPM": opm,
      "OtherIncome": total_other_income,
      "ExceptionalItem": exceptional_items,
      "Interest": finance_cost,
      "Depreciation": depreciation,
      "ProfitBeforeTax": profit_before_tax,
      "TaxPercentage": tax_per,
      "NetProfit": net_profit,
      "EPS": eps,
      "PaidUpShareCapital" : PaidUpShareCapital,
      "FaceValue" : FaceValue
    }
    
    # logger1.info(json.dumps(xbrl_data, indent=2))
    
    return result_obj
  
def save_xml_from_url(url, save_dir="."):
    try:
        response = requests.get(url, headers=headers, timeout=60)
        response.raise_for_status()

        # Extract filename from URL
        parsed_url = urlparse(url)
        filename = os.path.basename(parsed_url.path)

        if not filename.lower().endswith(".xml"):
            logger1.warning("URL does not point to an XML file.")
            return None

        # Ensure save directory exists
        os.makedirs(save_dir, exist_ok=True)
        file_path = os.path.join(save_dir, filename)

        with open(file_path, "wb") as f:
            f.write(response.content)

        logger1.info(f"XML saved to {file_path}")
        return file_path

    except Exception as e:
        logger1.warning(f"Error downloading or saving XML from {url}")
        logger1.info(f"Error: {e}")
        return None

def modify_result_files(nseStockList, resultType="Consolidated"):
    for idx, obj in enumerate(nseStockList):
        symbol = obj["SYMBOL"]
        logger1.info(f"Processing {idx}: {symbol}")

        sub_folder = "consolidated" if resultType == "Consolidated" else "standalone"
        csv_dir = f"stock_results/{sub_folder}/{symbol}"
        csv_path = f"{csv_dir}/{symbol}.csv"

        if os.path.exists(csv_path):
            try:
                df = pd.read_csv(csv_path)

                # Convert 'audited' column to lowercase if it exists
                if 'audited' in df.columns:
                    df['audited'] = df['audited'].astype(str).str.lower()

                # Convert or create 'consolidated' column
                if 'consolidated' in df.columns:
                    df['consolidated'] = df['consolidated'].astype(str).str.lower()
                else:
                    df['consolidated'] = "consolidated"

                # Save CSV back
                df.to_csv(csv_path, index=False)
                logger1.info(f"Updated: {symbol}")
            except Exception as e:
                logger1.warning(f"Failed for {symbol}: {e}")
                
def modify_result_files_dates(nseStockList, resultType="Consolidated"):
    for idx, obj in enumerate(nseStockList):
        symbol = obj["SYMBOL"]
        logger1.info(f"Processing {idx}: {symbol}")

        sub_folder = "consolidated" if resultType.lower() == "consolidated" else "standalone"
        csv_dir = f"stock_results/{sub_folder}/{symbol}"
        csv_path = f"{csv_dir}/{symbol}.csv"

        if os.path.exists(csv_path):
            try:
                df = pd.read_csv(csv_path)
                df.to_csv(csv_path, index=False)

            except Exception as e:
                logger1.warning(f"Failed for {symbol}: {e}")
                

def get_xml_value(xml_path, tag_name):
    """Safely extract a tag value from an XML file."""
    try:
        tree = ET.parse(xml_path)
        root = tree.getroot()
        for elem in root.iter():
            if elem.tag.lower().endswith(tag_name.lower()):
                return elem.text
    except Exception as e:
        logger1.warning(f"Error parsing {xml_path}: {e}")
    return None

def modify_result_files_share_capital(nseStockList, resultType="Consolidated"):
    for idx, obj in enumerate(nseStockList):
        symbol = obj["SYMBOL"]
        logger1.info(f"Processing {idx}: {symbol}")

        sub_folder = "consolidated" if resultType.lower() == "consolidated" else "standalone"
        csv_dir = f"stock_results/{sub_folder}/{symbol}"
        csv_path = f"{csv_dir}/{symbol}.csv"

        if not os.path.exists(csv_path):
            continue

        try:
            df = pd.read_csv(csv_path)

            # Create empty columns
            df["PaidUpShareCapital"] = None
            df["FaceValue"] = None

            for i, row in df.iterrows():
                xbrl_url = row.get("xbrl", "")
                if not xbrl_url:
                    continue

                xbrl_filename = os.path.basename(xbrl_url)
                local_xbrl_path = os.path.join(csv_dir, xbrl_filename)

                if os.path.exists(local_xbrl_path):
                    paid_up = get_xml_value(local_xbrl_path, "PaidUpValueOfEquityShareCapital")
                    face_val = get_xml_value(local_xbrl_path, "FaceValueOfEquityShareCapital")

                    df.at[i, "PaidUpShareCapital"] = paid_up
                    df.at[i, "FaceValue"] = face_val
                else:
                    logger1.warning(f"XBRL file not found for {symbol}: {xbrl_filename}")

            df.to_csv(csv_path, index=False)
            logger1.info(f"Updated {symbol}")

        except Exception as e:
            logger1.warning(f"Failed for {symbol}: {e}")

def merge_symbol_lists(list1, list2):
    # Use a set to track seen symbols
    seen = set()
    merged = []

    for item in list1 + list2:
        symbol = item["SYMBOL"].strip().upper()
        if symbol not in seen:
            seen.add(symbol)
            merged.append({"SYMBOL": symbol})

    return merged

def get_financial_result_symbols(urlType, days=5):
    # Load the CSV file
    csv_filename = getOutputCsvFile(urlType)
    date_key = getDateKeyForNseDocument(urlType)
    df = pd.read_csv(csv_filename)

    # Parse the date column safely
    df[date_key] = pd.to_datetime(df[date_key], errors='coerce')

    # Filter for recent entries
    cutoff_date = datetime.now() - timedelta(days=days)
    recent_df = df[df[date_key] >= cutoff_date]

    # Filter symbols
    if urlType == "events":
        filtered = recent_df[recent_df['purpose'].str.split('/').apply(
            lambda parts: any('Financial Results' in part.strip() for part in parts)
        )]
    elif urlType == "integratedResults":
        filtered = recent_df
    else:
        return []

    # Extract unique symbols
    unique_symbols = filtered['symbol'].dropna().apply(str.strip).unique()

    # Format as list of dicts
    result = [{"SYMBOL": sym} for sym in unique_symbols]
    return result

                
'''
"consolidated" , "non-consolidated"
'''
def fetchNseResults(nseStockList, period="Quarterly", resultType="consolidated", partial=False, delaySec=4):
    result_date_list = [
        "31-Mar-2023", "30-Jun-2023", "30-Sep-2023", "31-Dec-2023",
        "31-Mar-2024", "30-Jun-2024", "30-Sep-2024", "31-Dec-2024"
    ]

    response = fetchUrl(getBaseUrl("financialResults"))
    cookies = response.cookies

    for idx, obj in enumerate(nseStockList):
        symbol = obj["SYMBOL"]
        logger1.info(f"Fetching {idx}: {symbol}")

        sub_folder = "consolidated" if resultType == "consolidated" else "standalone"
        csv_dir = f"stock_results/{sub_folder}/{symbol}"
        csv_path = f"{csv_dir}/{symbol}.csv"

        if partial and os.path.exists(csv_path):
            logger1.info(f">> Skipping (already exists): {csv_path}")
            continue

        latest_by_date = {}

        try:
            data = fetchNseJsonObj(
                urlType="financialResults",
                index="equities",
                symbol=symbol,
                period=period,
                cookies=cookies
            )

            # Ensure data is valid DataFrame
            if not isinstance(data, pd.DataFrame) or data.empty:
                logger1.warning(f"No data for {symbol}")
                continue

            # Clean and normalize columns
            data["toDate"] = data["toDate"].astype(str).str.strip()
            data["consolidated"] = data["consolidated"].astype(str).str.lower().str.strip()
            data["broadCastDate"] = data["broadCastDate"].astype(str).fillna("01-Jan-1900 00:00:00")

            for result_date in result_date_list:
                # Filter entries by result date and result type
                filtered_df = data[
                    (data["toDate"] == result_date) &
                    (data["consolidated"] == resultType.lower())
                ].copy()

                if filtered_df.empty:
                    logger1.warning(f"No matching entries for {symbol} on {result_date}")
                    continue

                # Parse broadCastDate safely
                filtered_df["parsed_bc"] = pd.to_datetime(
                    filtered_df["broadCastDate"], format="%d-%b-%Y %H:%M:%S", errors="coerce"
                )

                # Use latest broadcast
                latest_entry = filtered_df.sort_values("parsed_bc", ascending=False).iloc[0]

                xbrl_url = latest_entry.get("xbrl")
                if not xbrl_url:
                    continue

                to_date = latest_entry.get("toDate")
                broad_cast_date = latest_entry.get("broadCastDate")

                logger1.info(f"→ Using entry for {to_date} (broadcast: {broad_cast_date})")

                local_xml_path = save_xml_from_url(xbrl_url, save_dir=csv_dir)
                json_obj = nse_xbrl_to_json(local_xml_path)

                # Enrich result
                json_obj["toDate"] = to_date
                json_obj["audited"] = str(latest_entry.get("audited", "")).lower()
                json_obj["consolidated"] = str(latest_entry.get("consolidated", "")).lower()
                json_obj["xbrl"] = xbrl_url
                json_obj["broadCastDate"] = broad_cast_date

                latest_by_date[to_date] = json_obj

                time.sleep(delaySec)

        except Exception as e:
            logger1.warning(f"Error fetching {symbol}: {e}")
            continue

        # Save output
        if latest_by_date:
            output_rows = list(latest_by_date.values())
            df = pd.DataFrame(output_rows)
            os.makedirs(os.path.dirname(csv_path), exist_ok=True)
            df.to_csv(csv_path, index=False)
            logger1.info(f"Saved to {csv_path}")
        else:
            logger1.warning(f"No data found for {symbol}")

'''
integarated filings always show quaterly results
# dummyList = [{"SYMBOL":"BAJAJCON"}]
"Standalone" / "Consolidated"
'''        
def syncUpNseResults(nseStockList, period="Quarterly", resultType="consolidated", cookies=None, delaySec=8):
    result_date_list = ["31-Mar-2025", "30-Jun-2025"]

    for idx, obj in enumerate(nseStockList):
        symbol = obj["SYMBOL"]
        logger1.info(f"Fetching {idx}: {symbol}")

        sub_folder = "consolidated" if resultType == "consolidated" else "standalone"
        csv_dir = f"stock_results/{sub_folder}/{symbol}"
        csv_path = f"{csv_dir}/{symbol}.csv"

        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
        else:
            df = pd.DataFrame()

        # Skip fetching if all result_date_list are already in df['toDate']
        if not df.empty:
            existing_dates = set(df['toDate'].astype(str).str.strip().str.lower())
            if all(date.lower() in existing_dates for date in result_date_list):
                logger1.info(f">> Skipping {symbol}: All result dates already present.")
                continue

        try:
            data = fetchNseJsonObj(
                urlType="integratedResults",
                index="equities",
                symbol=symbol,
                cookies=cookies
            )

            # 🛡 Ensure data is a DataFrame
            if not isinstance(data, pd.DataFrame) or data.empty:
                logger1.warning(f"No valid data returned for {symbol}. Skipping.")
                continue

            # Normalize relevant columns
            data['qe_Date'] = data['qe_Date'].astype(str).str.strip().str.lower()
            data['consolidated'] = data['consolidated'].astype(str).str.strip().str.lower()
            data['creation_Date'] = data['creation_Date'].astype(str).fillna("01-Jan-1900 00:00:00")

            for result_date in result_date_list:
                if not df.empty and result_date.lower() in existing_dates:
                    logger1.info(f">> Skipping {symbol} for {result_date}: Already exists.")
                    continue

                filtered_df = data[
                    (data['qe_Date'] == result_date.lower()) &
                    (data['consolidated'] == resultType.lower())
                ].copy()

                if filtered_df.empty:
                    continue

                # Sort by creation_Date (converted) to get the latest
                try:
                    filtered_df['parsed_creation'] = pd.to_datetime(
                        filtered_df['creation_Date'], format="%d-%b-%Y %H:%M:%S", errors='coerce'
                    )
                except Exception:
                    filtered_df['parsed_creation'] = pd.NaT

                matching_entry = filtered_df.sort_values('parsed_creation', ascending=False).iloc[0]

                xbrl_url = matching_entry.get("xbrl")
                html_url = matching_entry.get("ixbrl")
                if not xbrl_url or not html_url:
                    continue

                to_date = matching_entry.get("qe_Date")
                broad_cast_date = matching_entry.get("creation_Date")

                logger1.info(f"→ Using entry for {to_date} (broadcast: {broad_cast_date})")
                local_xml_path = save_xml_from_url(xbrl_url, save_dir=csv_dir)
                json_obj = nse_xbrl_to_json(local_xml_path)

                json_obj["toDate"] = to_date
                json_obj["audited"] = str(matching_entry.get("audited", "")).lower()
                res_type_local = matching_entry.get("consolidated", "").lower()
                json_obj["consolidated"] = "consolidated" if res_type_local == "consolidated" else "non-consolidated"
                json_obj["xbrl"] = xbrl_url
                json_obj["broadCastDate"] = broad_cast_date

                if df.empty:
                    df = pd.DataFrame([json_obj])
                else:
                    df = pd.concat([df, pd.DataFrame([json_obj])], ignore_index=True)
                    df = df.sort_values("broadCastDate")
                    df = df.drop_duplicates(subset="toDate", keep="last").reset_index(drop=True)

                time.sleep(delaySec)

        except Exception as e:
            traceback.print_exc()
            logger1.warning(f"Error fetching data for {symbol}: {e}")
            continue

        if not df.empty:
            os.makedirs(os.path.dirname(csv_path), exist_ok=True)
            df.to_csv(csv_path, index=False)
            logger1.info(f"Saved to {csv_path}")
        else:
            logger1.warning(f"No data to save for {symbol}")

# ==========================================================================
# ============================  TEST FUNCTIONS =============================


# ==========================================================================
# ============================  SCRIPT RUN =================================
# resp = fetchNseJsonObj("stockQuote", symbol="RELIANCE")
# resp = fetchNseJsonObj("stockInfo", symbol="RELIANCE")
# logger1.info(resp)

# resp = fetchNseJsonObj("upcomingIssues")
# logger1.info(resp)

# resp = fetchNseJsonObj("forthcomingListing")
# logger1.info(resp)

# yahooFinTesting("BALAJITELE.NS",full=True)
# resp = fetchNseJsonObj(urlType="integratedResults", index="equities")
# logger1.info(resp)

# symbol = "GENCON"
# url = "https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_INDAS_101676_04072025113823_iXBRL_WEB.html"

# symbol = "UNIPARTS"
# url = "https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_INDAS_101679_04072025120625_iXBRL_WEB.html"

# symbol = "RELIABLE"
# url = "https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_INDAS_101794_05072025154109_iXBRL_WEB.html"

# symbol = "UMESLTD"
# url = "https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_INDAS_101732_04072025170829_iXBRL_WEB.html"

# symbol = "AUTOIND"
# url = "https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_INDAS_101478_02072025105053_iXBRL_WEB.html"

# symbol = "LANCORHOL"
# url = "https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_INDAS_101433_01072025180132_iXBRL_WEB.html"

# symbol = "JPASSOCIAT"
# url = "https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_INDAS_101397_01072025144110_iXBRL_WEB.html"

# symbol = "ALPSINDUS"
# url = "https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_INDAS_101002_30062025113549_iXBRL_WEB.html"

# symbol = "HCLTECH"
# url = "https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_INDAS_86087_22042025190125_iXBRL_WEB.html"
# PASS

# symbol = "RELIANCE"
# url = "https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_INDAS_87057_25042025215716_iXBRL_WEB.html"

# symbol = "AXISBANK"
# url = "https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_BANKING_86628_24042025195151_iXBRL_WEB.html"

# symbol = "ONGC"
# url = "https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_INDAS_92646_21052025231055_iXBRL_WEB.html"

# symbol = "BAJFINANCE"
# url = "https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_NBFC_INDAS_88426_30042025123348_iXBRL_WEB.html"

# symbol = "SHRIRAMFIN"
# url = "https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_NBFC_INDAS_86907_25042025172758_iXBRL_WEB.html"

# symbol = "BRIGADE"
# url = "https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_INDAS_90922_14052025232935_iXBRL_WEB.html"

# resp = scrape_financial_results_to_json(url)
# nse_df = convert_financial_results_to_yFin_style(resp)
# logger1.info(nse_df)

# yahoo_df = yahooFinTesting(getYFinTickerName(symbol,"NSE"),full=True)
# # logger1.info(yahoo_df)

# compare_dfs(nse_df,yahoo_df)

# ---------------------------------------------------------------------------------------------------------------
# data = fetchNseJsonObj(urlType="financialResults", index="equities", symbol="RELIANCE", period="Quarterly")
# logger1.info(data)
# matching_entry = next(
#     (item for item in data if item.get("toDate") == "31-Dec-2024" and item.get("consolidated") == "Consolidated"),
#     None
# )
# logger1.info(matching_entry)

# matching_entry = next(
#     (item for item in data if item.get("toDate") == "31-Dec-2024"),
#     None
# )


#ONGC
# url = "https://nsearchives.nseindia.com/corporate/xbrl/INDAS_118395_1368047_31012025084518.xml"

# RELIANCE
# url = "https://nsearchives.nseindia.com/corporate/xbrl/INDAS_117297_1348248_16012025081520.xml"

#SUNPHARMA
# url = "https://nsearchives.nseindia.com/corporate/xbrl/INDAS_118371_1367891_31012025073304.xml"

#Airtel
# url =  'https://nsearchives.nseindia.com/corporate/xbrl/INDAS_118975_1373825_06022025101955.xml'

#Axis Bank
# url = 'https://nsearchives.nseindia.com/corporate/xbrl/BANKING_117296_1348238_16012025080654.xml'

#Kaynes
#url = 'https://nsearchives.nseindia.com/corporate/xbrl/INDAS_117898_1363553_28012025062830.xml'

# Cupid
# url = 'https://nsearchives.nseindia.com/corporate/xbrl/INDAS_120863_1386051_15022025013252.xml'

#SKM
# url = 'https://nsearchives.nseindia.com/corporate/xbrl/INDAS_119206_1375340_08022025094824.xml'

#BAJFINANCE
# url = 'https://nsearchives.nseindia.com/corporate/xbrl/NBFC_INDAS_118072_1365160_29012025074915.xml'

#SHRIRAMFIN
# url = 'https://nsearchives.nseindia.com/corporate/xbrl/NBFC_INDAS_117665_1360798_24012025070921.xml'

#UJJIVANSFB
# url = 'https://nsearchives.nseindia.com/corporate/xbrl/BANKING_117578_1359754_23012025075648.xml'

# nse_xbrl_to_json(url)
  
# resp = fetchNseJsonObj(urlType="resultsComparison", index="equities", symbol="RELIANCE")
# logger1.info(resp)

# resp = fetchNseJsonObj(urlType="schemeOfArrangement", index="equities")
# logger1.info(resp)

# resp = fetchNseJsonObj(urlType="creditRating", index="equities")
# logger1.info(resp)

# resp = fetchNseJsonObj(urlType="insiderTrading", index="equities")
# logger1.info(resp)

# resp = fetchNseJsonObj(urlType="shareholdingPattern", index="equities")
# logger1.info(resp)

# resp = fetchNseJsonObj(urlType="annualReports", index="equities", symbol="RELIANCE")
# logger1.info(resp)

# resp = fetchNseJsonObj(urlType="rightsFilings", index="equities")
# logger1.info(resp)

# resp = fetchNseJsonObj(urlType="qipFilings", index="qip")
# logger1.info(resp)

# resp = fetchNseJsonObj(urlType="prefIssue", index="inListing")
# logger1.info(resp)

# fetchNseEvents(start_date=datetime(2025, 6, 15), 
#                   end_date=datetime(2025, 6, 30),
#                   file_name="stock_fillings\\events_" + formatted_datetime + ".csv")


# result = get_bhavcopy(date(2025, 6, 13))
# # # result2 = convert_to_yahoo_style(result, "RELIANCE")
# logger1.info(result)

# result = getyFinTickerCandles(getYFinTickerName("ZYDUSWELL"), \
#                               start_date=datetime(2025, 6, 4), \
#                               end_date=datetime(2025, 6, 5))
# logger1.info(result)

# nseStockList = getAllNseSymbols(local=False)
# dummyList = [{"SYMBOL":"ISEC"}]
# syncUpYFinTickerCandles(dummyList,symbolType=None,delaySec=7, useNseBhavCopy=False)

# commodityNseList = getJsonFromCsvForSymbols(symbolType="COMMODITY_NSE",local=True)
# syncUpNseCommodity(commodityNseList, delaySec=6, useNseBhavCopy=True)

# symbolType = "GLOBAL_INDEX"
# currencyList = getJsonFromCsvForSymbols(symbolType)
# logger1.info(currencyList)
# fetchYFinTickerCandles(currencyList,symbolType,delaySec=15,partial=True)

# resp = getJsonFromCsvForSymbols(symbolType="NSE",local=False)
# logger1.info(resp)

# dummyList = [{"SYMBOL":"BAJFINANCE"}]
# fetchYFinTickerCandles(dummyList,symbolType="NSE",delaySec=6,partial=False,useNseCharting=False)
# logger1.info(result)

# nseStockList = getAllNseSymbols(local=True)
# dummyList = [{"SYMBOL":"KROSS"}]
# fetchYFinStockInfo(dummyList,partial=False)

# getPercentageChange(None,datetime(2024, 2, 1))

# syncUpCalculatePercentageForAnnouncement()
#updatePercentageForAnnouncements()

# downloadFileFromUrl("https://nsearchives.nseindia.com/corporate/Announcement_01012018094304_154.zip",
#                     outputDir="downloads")


# generateAnnouncementAnalysis()

# nseStockList = getAllNseSymbols(local=False)
# fetchYFinStockInfo(nseStockList,delay=3,partial=False)

# stockInfo = readYFinStockInfo()
# logger1.info(stockInfo)

# nseStockFilterTest()

# bseStockList = getAllBseSymbol(local=True)
# fetchYFinStockInfo(bseStockList,delay=3,partial=True,exchange="BSE")

# resp = fetchNseJsonObj("commoditySpotAll", index="commodityspotrates")
# logger1.info(resp)


# commodityNseList = getJsonFromCsvForSymbols(symbolType="COMMODITY_NSE",local=True)
# instrumentType = get_value_by_key(commodityNseList, "SYMBOL", "SILVER", "instrumentType")
# resp = fetchNseJsonObj("commodityIndividual", 
#                        symbol="SILVER", 
#                        instrumentType=instrumentType,
#                        fromDate=datetime(2025, 6, 13), 
#                        toDate=datetime(2025, 6, 13),
#                        delaySec=2,
#                        listExtractKey="data")
# logger1.info(resp)


# nseCommodityList = getJsonFromCsvForSymbols(symbolType="COMMODITY_NSE",local=True)
# fetchNseCommodity(nseCommodityList, delaySec=6, partial=False)


# resp = download_mcx_bhavcopy(
#     start_date=date(2025, 6, 10),
#     end_date=date(2025, 6, 11),
#     download_dir=r"C:\temp"
# )

# logger1.info(resp)

# syncUpYahooFinOtherSymbols()

# resp = get_nse_chart_data(symbol="ITC")
# logger1.info(resp)

# yahooFinMulti()

# yahooSingleTicker("RELIANCE.NS")

# get_bhavcopy(date=None, saveCSV=True)

# recalculateYFinStockInfo()

# cookies_local = getNseCookies()
# # dummyList = [{"SYMBOL":"M&M"}]
# nseStockList = getAllNseSymbols(local=False)
# # fetchNseResults(nseStockList, period="Quarterly", resultType="non-consolidated", partial=True)
# # syncUpNseResults(nseStockList, resultType="consolidated", cookies=cookies_local)
# # syncUpNseResults(nseStockList, resultType="standalone", cookies=cookies_local)
# # modify_result_files(nseStockList)
# # modify_result_files_dates(nseStockList, resultType="standalone")
# modify_result_files_share_capital(nseStockList, resultType="consolidated")

# fetchNseDocuments(urlType="prefIssue",
#                   index="inListing",
#                   start_date=datetime(2025, 6, 1),
#                   end_date=datetime(2025, 7, 31),
#                   cookies=cookies_local)

# syncUpNseDocuments("upcomingIssues", cookies=cookies_local)


# fetchAllNseFillings()


# dummyList = [{"SYMBOL":"UJJIVANSFB"}]
# syncUpNseResults(dummyList)

# **************************** Daily Sync Up ********************************
cookies_local = getNseCookies()
nseStockList = getAllNseSymbols(local=False)

# Fetch any new symbol from yahoo with partial True
fetchYFinStockInfo(nseStockList, delay=5, partial=True, exchange="NSE")

# Fetch NSE Candles
syncUpYFinTickerCandles(nseStockList,symbolType="NSE", delaySec=7, useNseBhavCopy=True)

# Fetch Commodities Candles
commodityNseList = getJsonFromCsvForSymbols(symbolType="COMMODITY_NSE",local=True)
syncUpNseCommodity(commodityNseList, delaySec=6, useNseBhavCopy=True, cookies=cookies_local)

# Fetch Other Candles From Yahoo
syncUpYahooFinOtherSymbols()

# Fetch NSE Fillings and results
syncUpAllNseFillings(cookies=cookies_local)
integratedResultsSymbolList = get_financial_result_symbols(urlType="integratedResults", days=2)
syncUpNseResults(integratedResultsSymbolList, resultType="consolidated", cookies=cookies_local)
syncUpNseResults(integratedResultsSymbolList, resultType="standalone", cookies=cookies_local)

# Finally recalculate details
recalculateYFinStockInfo(useNseBhavCopy=True)

# **************************************************************************

