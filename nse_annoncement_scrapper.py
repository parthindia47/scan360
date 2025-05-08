# -*- coding: utf-8 -*-
"""
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

"""
import os
import requests
import json
import time
import datetime
from datetime import date
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
from pdf2image import convert_from_path
from curl_cffi import requests
from dataclasses import dataclass


# =======================================================================
# ========================== Classes ==================================
@dataclass
class CsvFile:
    remote_url: str
    local_url: str

csv_list = {
    "NSE": CsvFile(
        remote_url="https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv",
        local_url="stock_info/csv/EQUITY_L.csv"
    ),
    "CURRENCY": CsvFile(
        remote_url="",
        local_url="stock_info/csv/currency_pair.csv"
    ),
    "COMMODITY_ETF": CsvFile(
        remote_url="",
        local_url="stock_info/csv/commodity_etf.csv"
    ),
    "INDEX": CsvFile(
        remote_url="",
        local_url="stock_info/csv/index.csv"
    )
}


# =======================================================================
# ========================== Constants ==================================

nseSegments = {"equities":"equities",
              "debt":"debt",
              "sme":"sme",
              "sse":"sse",
              "mf":"mf",
              "municipalBond":"municipalBond",
              "invitsreits":"invitsreits"}

headers = {"User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36'}

scrappingStartingDate = datetime.datetime(2024, 1, 1)
current_datetime = datetime.datetime.now()
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
"clarification"
"Partnership",      #newly_added
"Joint venture",
"Collaboration",
"Capital expenditure",
"capacity addition"
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
"Movement in price"
]

'''
"SWSOLAR"
'''
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
    file_handler = logging.FileHandler(f"logs//log_file_{datetime.datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.log")
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    return logger

logger1 = setup_logger()
# ========================================================================
# ========================== Helper Function =============================
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

# ==========================================================================
# ========================== NSE Helper Function ===========================

def getAllBseSymbol(local=False):
    local_url = "stock_info\equity_bse.csv"  # Adjust the path as needed
    if local:
        # Get the absolute path of the local CSV file
        abs_path = os.path.abspath(local_url)
        print("Fetching locally " + abs_path)
        
        # Read the CSV data into a DataFrame
        df = pd.read_csv(abs_path)
        
        # Convert the DataFrame to a dictionary
        json_data = df.to_dict(orient='records')
        
        return json_data

'''
EQ (Equity): EQ represents the Equity segment
BE (Group B): BE stands for "Trade-to-Trade" segment or the "Limited Physical Market" segment. 
BZ (Group Z): BZ represents the Trade-to-Trade segment for securities that 
              have not been traded at all during the last 365 days

return list of object
'''
def getAllNseSymbols(local=False):
    remote_url = "https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv"
    local_url = "stock_info\csv\EQUITY_L.csv"  # Adjust the path as needed
    
    if local:
        # Get the absolute path of the local CSV file
        abs_path = os.path.abspath(local_url)
        print("Fetching locally " + abs_path)
        
        # Read the CSV data into a DataFrame
        df = pd.read_csv(abs_path)
        
        # Convert the DataFrame to a dictionary
        json_data = df.to_dict(orient='records')
        
        return json_data
    else:
        print("Fetching remotely " + remote_url)
        response = requests.get(remote_url,headers=headers)
        
        # Save the CSV data to the local file path
        with open(local_url, 'w', encoding='utf-8') as f:
            f.write(response.text)
        
        # Read the local CSV data into a DataFrame
        df = pd.read_csv(StringIO(response.text))
        
        # Convert the DataFrame to a dictionary
        json_data = df.to_dict(orient='records')
        
        return json_data

def getJsonFromCsvForSymbols(symbolType,local=True):
    
    if local:
        if csv_list[symbolType].local_url == "":
          print("No local URL for type " + symbolType)
          return

        # Get the absolute path of the local CSV file
        abs_path = os.path.abspath(csv_list[symbolType].local_url)
        print("Fetching locally " + abs_path)
        
        # Read the CSV data into a DataFrame
        df = pd.read_csv(abs_path)
        
        # Convert the DataFrame to a dictionary
        json_data = df.to_dict(orient='records')
        
        return json_data
    else:
        if csv_list[symbolType].remote_url == "":
          print("No Remote URL for type " + symbolType)
          return

        print("Fetching remotely " + remote_url)
        response = requests.get(csv_list[symbolType].remote_url,headers=headers)
        
        # Save the CSV data to the local file path
        with open(local_url, 'w', encoding='utf-8') as f:
            f.write(response.text)
        
        # Read the local CSV data into a DataFrame
        df = pd.read_csv(StringIO(response.text))
        
        # Convert the DataFrame to a dictionary
        json_data = df.to_dict(orient='records')
        
        return json_data


'''
==> Equity based
https://www.nseindia.com/get-quotes/equity?symbol=RAYMOND

total market cap, trade volume etc
https://www.nseindia.com/api/quote-equity?symbol=RAYMOND&section=trade_info

prices and quote
https://www.nseindia.com/api/quote-equity?symbol=RAYMOND

financial results, announcement etc.
https://www.nseindia.com/api/top-corp-info?symbol=RAYMOND&market=equities

meta-data
https://www.nseindia.com/api/equity-meta-info?symbol=RAYMOND
'''
def getNseStockInfo(nseTicker):
    pass

# ==========================================================================
# ========================== NSE URL Function ==============================

'''
# announcements 
index = [Equity,SME,debt,MF,REIT]
filter = [company,Subject,time,FnO]

"https://www.nseindia.com/api/corporate-announcements?index=equities&from_date=10-04-2024&to_date=11-04-2024"
"https://www.nseindia.com/api/corporate-announcements?index=equities&from_date=9-04-2024&to_date=11-04-2024&fo_sec=true"
"https://www.nseindia.com/api/corporate-announcements?index=equities&symbol=SUBEX&issuer=Subex%20Limited"
https://www.nseindia.com/api/corporate-announcements?index=equities&subject=Amalgamation%20%2F%20Merger

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


Always Replace special characters example
space - %20
backslash - %2F

Example of Usage:
print(getAnnouncementUrlQuery("equities"))  # JSON response for equities
print(getAnnouncementUrlQuery("equities", fromDate="10-04-2024", toDate="11-04-2024"))  # Time-wise search
print(getAnnouncementUrlQuery("equities", fromDate="9-04-2024", toDate="11-04-2024", isOnlyFnO=True))  # FnO search
print(getAnnouncementUrlQuery("equities", symbol="SUBEX", issuer="Subex Limited"))  # Company-wise search
print(getAnnouncementUrlQuery("equities", subject="Amalgamation / Merger"))  # Subject-wise search
'''
def getJsonUrlQuery(urlType,
                index, 
                fromDate = None, 
                toDate = None, 
                symbol = None, 
                issuer = None,
                subject = None,
                isOnlyFnO = False):
    baseUrls = {
        "announcement":"https://www.nseindia.com/api/corporate-announcements?index=" ,
        "arrangement":"https://www.nseindia.com/api/corporates/offerdocs/arrangementscheme?index=",
        "boardMeetings": "https://www.nseindia.com/api/corporate-board-meetings?index=",
        "corporateActions": "https://www.nseindia.com/api/corporates-corporateActions?index=",
        "financialResults":"https://www.nseindia.com/api/corporates-financial-results?index=",
        "offerDocs":"https://www.nseindia.com/api/corporates/offerdocs?index="
    }

    baseUrl = baseUrls[urlType] + nseSegments[index]
    
    # Handling time-wise search
    if fromDate and toDate:
        fromDate_str = fromDate.strftime("%d-%m-%Y")  # Convert Python date to string in "dd-mm-yyyy" format
        toDate_str = toDate.strftime("%d-%m-%Y")      # Convert Python date to string in "dd-mm-yyyy" format
        baseUrl += f"&from_date={fromDate_str}&to_date={toDate_str}"
    
    # Handling company-wise search
    if symbol and issuer:
        baseUrl += f"&symbol={symbol}&issuer={issuer}"
    
    # Handling subject-wise search
    if subject:
        # Replace special characters
        subject = subject.replace(' ', '%20').replace('/', '%2F')
        baseUrl += f"&subject={subject}"
    
    # Handling FnO search
    if isOnlyFnO:
        baseUrl += "&fo_sec=true"
    
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

    arrangementSchema = { 
        "equities":"CF-scheme-document.json",
        "debt":"CF-scheme-document.json"
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

    schemaObjs = {
        "announcement":announcementSchema,
        "arrangement":arrangementSchema,
        "boardMeetings":boardMeetingSchema,
        "corporateActions":corporateActionSchema,
        "financialResults":financialResultsSchema,
        "offerDocs":offerDocumentSchema
    }

    schemaBaseUrl = schemaBaseUrl + schemaObjs[urlType][index]
    return schemaBaseUrl

def getBaseUrl(urlType):
    baseUrls = {
        "announcement":"https://www.nseindia.com/companies-listing/corporate-filings-announcements" ,
        "arrangement":"https://www.nseindia.com/companies-listing/corporate-filings-scheme-document",
        "boardMeetings": "https://www.nseindia.com/companies-listing/corporate-filings-board-meetings",
        "corporateActions": "https://www.nseindia.com/companies-listing/corporate-filings-actions",
        "financialResults":"https://www.nseindia.com/companies-listing/corporate-filings-financial-results",
        "offerDocs":"https://www.nseindia.com/companies-listing/corporate-filings-offer-documents"
    }

    baseUrl = baseUrls[urlType]
    return baseUrl
    
def getSubjectUrl(urlType,index):
    subjectUrls = {
        "announcement":"https://www.nseindia.com/api/corporate-announcements-subject?index=" ,
        "arrangement":"",
        "boardMeetings": "https://www.nseindia.com/api/corporate-board-meetings-subject?index=",
        "corporateActions": "https://www.nseindia.com/api/corporates-corporateActions-subject?index=",
        "financialResults":"",
        "offerDocs":""
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
        "arrangement":"https://www.nseindia.com/api/corporates/offerdocs/arrangementscheme/master",
        "boardMeetings": "",
        "corporateActions": "https://www.nseindia.com/api/corporates-corporateActions-debtcompany",
        "financialResults":"",
        "offerDocs":"https://www.nseindia.com/api/corporates/offerdocs/equity/companylist"
    }
    return companiesListUrl[urlType]

def getAllNseHolidays():
    url = "https://www.nseindia.com/api/holiday-master?type=trading"
    response = fetchJson(url)
    return response

# ==========================================================================
# ============================ URL fetch Function ==========================

'''
Fetch any Json from URL
'''
def fetchJson(url,cookies=None):
    print("Fetching JSON " + url)
    try:
        # Send a GET request to the URL to download the JSON content
        #print("Cookies Type:", type(cookies))
        # for i, cookie in enumerate(cookies):
        #     print(f"Cookie {i}: type={type(cookie)}, value={cookie}")

        if cookies:
          headers["Cookie"] = '; '.join([f"{k}={v}" for k, v in cookies.items()])
        response = requests.get(url,headers=headers)
        
        # Check if the request was successful (status code 200)
        if response.status_code == 200:
            # Parse the JSON content
            jsonData = response.json()
            return jsonData
        else:
            print("Failed to download JSON. Status code:", response.status_code)
    except Exception as e:
        print("An error occurred:", e)

'''
returns the response of given url
should pass base/first urls which "do not need cookies" to access.
'''
def fetchUrl(url):
    print("Fetching URL : " + url)
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
    print("Exception while opening pdf !!")
    print(e)

  # if text is None then return
  if not text:
    return

  #print("Length of text " + str(len(text)))

  #if length of text is less, it is possible that it is image.
  #we will extract text from image using ocr
  if len(text) < 50 and jpg_pdf :
      print("converting image to text ...")
      text = ocr_pdf_to_text(pdf_file_path)

  #this will return line number and line containing keywords
  results = searchInText(text, keywords)

  return results

def print_keyword_search_results(results):
  # Print the results
  for keyword, occurrences in results.items():
      print(f"Keyword: {keyword}")
      for line_number, line in occurrences:
          print(f"Line {line_number}: {line}")
      print("\n")

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
            print("URL is None")
            return
        
        # Get the file name from the URL
        fileName = url.split("/")[-1]
        fileExtension = fileName.split(".")[-1]

        # if it is not accepted extension then don't download
        if fileExtension.lower() not in accepted_extensions:
          return
        
        # Determine the output path
        fileOutputPath = os.path.join(outputDir, fileName)

        #print("Downloading " + url + " Saving to " + fileOutputPath)
        
        # Send a GET request to the URL
        response = requests.get(url,headers=headers)
        response.raise_for_status()  # Raise an exception for 4xx or 5xx status codes
        
        # Save the content of the response to a file
        with open(fileOutputPath, 'wb') as file:
            file.write(response.content)

        # this is zip file
        if fileExtension == "zip":
            print("This is zip file, extracting")
            extractZipFile(fileOutputPath, outputDir)
        
        print(f"File downloaded successfully as '{fileOutputPath}'")
    except (requests.exceptions.RequestException, FileNotFoundError) as e:
        print("Error:", e)

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
        print("** NO YAHOO FIN OBJ **")

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

        print("Downloading " + str(index) + " of " + str(total_rows) + " ...")
        if pd.notna(row[attachmentKey]) and len(row[attachmentKey]) > 10:
            print(row[attachmentKey])  # Access row by column name
            downloadFileFromUrl(row[attachmentKey],downloadDir)
            time.sleep(delay)  # Pause execution for 2 seconds


# ==========================================================================
# ==============================  Fetch JSON ===============================

'''
This is master function to fetch any type of fillings from NSE.
step indicate how many days step it should fetch the data.

Example:
fetchNseJsonObj(urlType="announcement", index="equities", fromDate=start_date, toDate=end_date)
'''
def fetchNseJsonObj(urlType, index, fromDate=None, toDate=None, step=7, delaySec=5):
    jsonObjMaster = []
    start_date = fromDate
    final_end_date = toDate  # Rename to avoid confusion

    # First, get response from the main URL to fetch cookies
    response = fetchUrl(getBaseUrl(urlType=urlType))
    print(response)

    # Ensure step is set properly if start and end dates are the same or close together
    if start_date == final_end_date:
        step = 0  # If dates are the same, no step needed
    elif (final_end_date - start_date).days < step:
        step = (final_end_date - start_date).days  # Adjust step to the remaining days if smaller than the step size

    while start_date <= final_end_date:
        # Calculate the dynamic end date, making sure it doesn't exceed the final end date
        end_date = start_date + datetime.timedelta(days=step)
        if end_date > final_end_date:
            end_date = final_end_date

        # Fetch the JSON object using the calculated start and end date
        jsonUrl = getJsonUrlQuery(urlType=urlType, index=index, fromDate=start_date, toDate=end_date)
        jsonObj = fetchJson(jsonUrl, response.cookies)

        # Extend the list with the fetched data
        jsonObjMaster.extend(jsonObj)

        # Move to the next iteration (next step after the current end_date)
        start_date = end_date + datetime.timedelta(days=1)

        time.sleep(delaySec)  # Delay between API requests

    return jsonObjMaster

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
result = fetchPercentageChange1Day("BRIGADE.NS", datetime.datetime(2024, 4, 12))
print("1d % change " + str(result))

result = calculatePercentageDifference("BRIGADE.NS", datetime.datetime(2024, 4, 3))
print("1d " + str(result["1d"]) + " 3d " + str(result["3d"]) + " 5d " + str(result["5d"]))

'''
def fetchPercentageChange1Day(yFinTicker, date, nextDay=False):

    # Set the timezone to UTC
    ist_timezone = pytz.timezone('Asia/Kolkata')
    
    # Convert the input date to UTC timezone
    date_ist = date.astimezone(ist_timezone)

    dayNum = date_ist.weekday()
    print("inputDate " + str(date_ist))
    print("dayNum " + str(dayNum))

    if date_ist >= datetime.datetime.now(ist_timezone):
        print("Date cannot be higher or equal to today's date")
        return None

    # calculate start_date and end_date
    start_date = date_ist
    end_date = start_date + datetime.timedelta(days=1)

    print("start_date " + str(start_date))
    print("end_date " + str(end_date))

    # Fetch historical data for the specified date range
    tickerInformation = yf.Ticker(yFinTicker)
    tickerHistory = tickerInformation.history(start=start_date, end=end_date)

    if not tickerHistory.empty:
      print(tickerHistory)
      if len(tickerHistory) == 1:
          day1Percentage = (tickerHistory.iloc[0]['Close'] - tickerHistory.iloc[0]['Open'])*100/\
            tickerHistory.iloc[0]['Open']
          return day1Percentage
    else:
      print("tickerHistory is empty ...")
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
              print("Next trading day data: ", tickerHistory)
              if len(tickerHistory) == 1:
                  day1Percentage = (tickerHistory.iloc[0]['Close'] - tickerHistory.iloc[0]['Open'])*100/\
                    tickerHistory.iloc[0]['Open']
                  return day1Percentage
          else:
              print("No data available for the next trading day.")
              return None

'''
This is a custom function, it will calculate % change from next day

example
result = calculatePercentageDifference("BRIGADE.NS", datetime.datetime(2024, 4, 3))
print("1d " + str(result["1d"]) + " 3d " + str(result["3d"]) + " 5d " + str(result["5d"]))

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

    if start_date >= datetime.datetime.now(ist_timezone) or \
      end_date >= datetime.datetime.now(ist_timezone):
        print("Date cannot be higher or equal to today's date")
        return None

    print("start_date: ", start_date)
    print("end_date: ", end_date)

    try:
      # Fetch historical data for the specified date range
      tickerInformation = yf.Ticker(yFinTicker)
      tickerHistory = tickerInformation.history(start=start_date, end=end_date)
      print(tickerHistory)

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
          print("No historical data available for the specified date range.")
          return None
    except Exception as e:
        print(e)
        return None

'''
this function takes a jsonObj as input and returns a Df with Hash
and date in ascending order.
'''
def processJsonToDfForNseFilling(jsonObj):
  # Convert the list of dictionaries to a DataFrame
  df = pd.DataFrame(jsonObj)
  df['an_dt'] = pd.to_datetime(df['an_dt'])
  df = df.sort_values(by='an_dt')

  # compute hash of all rows
  df['hash'] = df.apply(compute_hash, axis=1)

  return df

'''
#yahooFinTesting("RELIANCE.NS")
'''    
def getyFinTickerInfo(yFinTicker, sub="INFO"):
    try:
      tickerInformation = yf.Ticker(yFinTicker)

      if sub == "INFO":
        return tickerInformation.info
      
    except Exception as e:
        print(e)
        return None

'''
will return ticker history between start_date and end_date
if it is not supported by yFin will return None
'''
def getyFinTickerCandles(yFinTicker,start_date,end_date):
    session = requests.Session(impersonate="chrome")

    try:
      tickerInformation = yf.Ticker(yFinTicker,session=session)
      tickerHistory = tickerInformation.history(start=start_date, end=end_date)
      if not tickerHistory.empty:
        return tickerHistory
      else:
          return None
    except Exception as e:
        print(e)
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
    #local_url = "stock_charts\\3IINFOLTD.csv"
    local_url = f"stock_charts\\{symbol}.csv"
    
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
      # print("Index of the row(s) in next_day_row:")
      total_entries = len(df)
      curr_row_index = next_day_row.index[0]
      
      # Print the candle data for the next day if found
      if not next_day_row.empty:
          #print("Candle data for the next day:")
          curr_open = df.iloc[curr_row_index]['Open']
          curr_close = df.iloc[curr_row_index]['Close']

          resp["Open"] = round(curr_open,2)
          resp["1D"] = calculatePercentage(curr_open,curr_close)
          if curr_row_index + 4 < total_entries:
              resp["5D"] = calculatePercentage(curr_open,df.iloc[curr_row_index + 4]["Close"])
          if curr_row_index + 9 < total_entries:
              resp["10D"] = calculatePercentage(curr_open,df.iloc[curr_row_index + 9]["Close"])

          #print(next_day_row)
          #print(resp)
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
      annDate = datetime.datetime.strptime(obj["an_dt"], date_format)
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
print(stockInfo)

return:
return list of objects [{},{},{}]
'''

def readYFinStockInfo():
    local_url = "stock_info\\csv\\yFinStockInfo_NSE.csv"
    json_data = None

    if os.path.exists(local_url):
      df = pd.read_csv(local_url)

      # Convert the DataFrame to a dictionary
      json_data = df.to_dict(orient='records')
    else:
      print("csv path do not exists")
    
    return json_data

'''
Note:
    in yahoo finance all stock ticker are appended by ".NS"
'''
def getYFinTickerName(NseTicker, exchange="NSE"):
    if exchange == "NSE" or exchange == "COMMODITY_ETF":
        return NseTicker + ".NS"
    elif exchange == "BSE":
        return NseTicker + ".BO"
    elif exchange == "CURRENCY":
        return NseTicker + "=X"
    elif exchange == "INDEX":
        return "^" + NseTicker

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
    local_url = "stock_info\\yFinStockInfo_" + exchange + ".csv"
    symbolCsvId = None

    if exchange == "NSE":
        symbolCsvId = "SYMBOL"
    elif exchange == "BSE":
        symbolCsvId = "Security Id"
    
    if partial:
      df = pd.read_csv(local_url)

      # Convert the DataFrame to a dictionary
      json_data = df.to_dict(orient='records')
      master_list = json_data
      lookup_list = [item["symbol"] for item in master_list]
      #print(lookup_list)
    
    for idx, obj in enumerate(nseStockList):
        yFinNseTicker = getYFinTickerName(obj[symbolCsvId], exchange)
        if partial and yFinNseTicker in lookup_list:
            continue
            
        print("fetching " + str(idx) + " " + obj[symbolCsvId] )
        result = getyFinTickerInfo(yFinNseTicker)
        if result:
            #print(result)
            master_list.append(result)
            time.sleep(delay)
        else:
           print("UNSUPPORTED " + str(idx) + " " + obj[symbolCsvId] )
           unsupported_tickers.append(obj[symbolCsvId])

    df = pd.DataFrame(master_list)
    df.to_csv(local_url, index=False, encoding='utf-8')
    print("saved " + local_url)

    if unsupported_tickers:
      df = pd.DataFrame(unsupported_tickers)
      csv_filename = "stock_info\\yFinUnsupportedTickers_" + exchange + ".csv"
      df.to_csv(csv_filename, index=False, encoding='utf-8')
      print("saved " + csv_filename)


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
def fetchYFinTickerCandles(nseStockList, symbolType, delaySec=6, partial=False):
    ist_timezone = pytz.timezone('Asia/Kolkata')

    # start_date = scrappingStartingDate
    # end_date = datetime.datetime.now(ist_timezone)

    start_date = scrappingStartingDate
    end_date = datetime.datetime.now(ist_timezone)

    for idx, obj in enumerate(nseStockList):
        print("fetching " + str(idx) + " " + obj["SYMBOL"] )
        csv_filename = "stock_charts\\" + obj["SYMBOL"] + ".csv"

        if partial and os.path.exists(csv_filename):
            continue

        result = getyFinTickerCandles(getYFinTickerName(obj["SYMBOL"],symbolType), \
                                      start_date=start_date, \
                                      end_date=end_date)
        
        if result is not None and not result.empty:
            # Assuming df is your DataFrame containing historical data
            # Reset the index to include 'Date' as a regular column
            result.reset_index(inplace=True)
            result.to_csv(csv_filename, index=False, encoding='utf-8')
            print("saved " + csv_filename)
            time.sleep(delaySec)
        else:
           print("UNSUPPORTED " + str(idx) + " " + obj["SYMBOL"] )

'''
Fetch all NSE announcements between start date and end date and store it in a
csv file.

Args:
    start_date (datetime.datetime): start date
    end_date (datetime.datetime): end date
    file_name (str): file name to be stored

Returns:
    None

Example:
    fetchNseAnnouncements(start_date=datetime.datetime(2014, 1, 1), 
                      end_date=datetime.datetime(2020, 4, 1),
                      file_name="nse_fillings\\announcements_" + formatted_datetime + ".csv")
'''
def fetchNseAnnouncements(start_date, end_date, file_name):

  master_json_list = fetchNseJsonObj(urlType="announcement", index="equities", fromDate=start_date, toDate=end_date)
  print("total entries " + str(len(master_json_list)))

  # Convert the list of dictionaries to a DataFrame
  df = processJsonToDfForNseFilling(master_json_list)
  df.reset_index(drop=True)
  df.set_index('hash', inplace=True)

  #remove if any duplicate
  df = df[~df.index.duplicated()]
  df.to_csv(file_name, encoding='utf-8')

  print("Data saved to " + file_name)

'''
This function reads announcement list and finds 3D, 5D and 10D stock movement 
after that.

Note:
df.to_dict(orient='records') will return <class 'list'>
'''
def updatePercentageForAnnouncements():
    local_url = "nse_fillings\\announcements.csv"
    output_url = "output\\announcements_with_percentage.csv"
    unsupported_symbols = []
    
    # Read the CSV data into a DataFrame
    df = pd.read_csv(os.path.abspath(local_url))
    
    # Convert the DataFrame to a dictionary
    json_data = df.to_dict(orient='records')
    
    print(type(json_data))
    print("total entries to process " + str(len(json_data)))

    json_data, unsupported_symbols = getPercentageChangeList(json_data)
    
    df = pd.DataFrame(json_data)
    df.to_csv(output_url, index=False, encoding='utf-8')
    print("saved " + output_url)

    if unsupported_symbols:
      df = pd.DataFrame(unsupported_symbols)
      csv_filename = "output\\unsupportedSymbols.csv"
      df.to_csv(csv_filename, index=False, encoding='utf-8')
      print("saved " + csv_filename)


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
def syncUpNseAnnouncements():
  csv_filename = "nse_fillings\\announcements.csv"
  current_date = datetime.datetime.now()

  # Read the CSV data into a DataFrame
  df = pd.read_csv(csv_filename)
  
  # Parse the 'Date' column as datetime
  df['an_dt'] = pd.to_datetime(df['an_dt']) 

  last_row_date = df.iloc[-1]['an_dt']    
  start_date = last_row_date
  end_date = current_date

  print("last_row_date " + str(last_row_date) + \
        " start_date " + str(start_date) + \
        " end_date " + str(end_date))

  master_json_list = fetchNseJsonObj(urlType="announcement", index="equities", fromDate=start_date, toDate=end_date)
  df_new = processJsonToDfForNseFilling(master_json_list)
           
  df.reset_index(drop=True)
  df.set_index('hash', inplace=True)
  # print("df")
  # print(df)

  df_new.reset_index(drop=True)
  df_new.set_index('hash', inplace=True)
  # print("df_new")
  # print(df_new)

  concatenated_df = pd.concat([df, df_new])
  concatenated_df = concatenated_df[~concatenated_df.index.duplicated()]        
  concatenated_df.reset_index(inplace=True)

  # print("concatenated_df")
  # print(concatenated_df)

  concatenated_df.to_csv(csv_filename, index=False, encoding='utf-8')

'''
Reads the current csv file finds the last entries and fetch the data after that.
and concat the data and saves it.

Drop Duplicate with Datetime
https://stackoverflow.com/questions/46489695/drop-duplicates-not-working-in-pandas
https://stackoverflow.com/questions/50686970/understanding-why-drop-duplicates-is-not-working
'''
def syncUpYFinTickerCandles(nseStockList, delaySec=6):
    ist_timezone = pytz.timezone('Asia/Kolkata')
    current_date = datetime.datetime.now(ist_timezone)

    for idx, obj in enumerate(nseStockList):
        print("fetching " + str(idx) + " " + obj["SYMBOL"] )
        csv_filename = "stock_charts\\" + obj["SYMBOL"] + ".csv"
        #csv_filename = "temp\\3IINFOLTD.csv"
        #obj["SYMBOL"] = "3IINFOLTD"

        # Read the CSV data into a DataFrame
        try:
            df = pd.read_csv(csv_filename)

            # Parse the 'Date' column as datetime
            df['Date'] = pd.to_datetime(df['Date']) 

            last_row_date = df.iloc[-1]['Date']    
            start_date = last_row_date + datetime.timedelta(days=1) # next day
            end_date = current_date + datetime.timedelta(days=1)
        except Exception as e:
            print("An error occurred:", e)
            continue

        # print("last_row_date " + str(last_row_date) + \
        #       " start_date " + str(start_date) + \
        #       " end_date " + str(end_date))

        if last_row_date >= current_date:
        #if last_row_date.date() >= date(2025, 4, 25):
            print("All Synced up, skipping ...")
            continue

        result = getyFinTickerCandles(getYFinTickerName(obj["SYMBOL"]), \
                                      start_date=start_date, \
                                      end_date=end_date)
        
        if result is not None and not result.empty:
            df.reset_index(drop=True)
            df.set_index('Date', inplace=True)

            df.index = df.index.tz_convert(ist_timezone)
            result.index = result.index.tz_convert(ist_timezone)

            # print("df")
            # print(df)

            # print("result")
            # print(result)

            concatenated_df = pd.concat([df, result])
            concatenated_df = concatenated_df[~concatenated_df.index.duplicated()]        
            concatenated_df.reset_index(inplace=True)

            # print("concatenated_df")
            # print(concatenated_df)

            try:
                concatenated_df.to_csv(csv_filename, index=False, encoding='utf-8')
                print("Saved " + csv_filename)
                time.sleep(delaySec)
            except Exception as e:
                print("An error occurred:", e)
        else:
           print("UNSUPPORTED " + str(idx) + " " + obj["SYMBOL"] )


'''
use separate = True if you want to store current delta in a separate file, it 
will be stored with suffix of last hash.
'''
def syncUpCalculatePercentageForAnnouncement(separate=False):
    input_announcement_csv = "nse_fillings\\announcements.csv"
    output_csv = "output\\announcements_with_percentage.csv"

    processed = getLastProcessedHashForPercentage(output_csv)

    print("processed_len " +str(processed["processed_len"]) + \
          " processed_hash " + str(processed["processed_hash"]))
    
    df_input = pd.read_csv(os.path.abspath(input_announcement_csv))
    row_number = df_input.index[df_input['hash'] == processed["processed_hash"]].tolist()[0]
    input_len = len(df_input)
    diff = input_len - (row_number+1)

    df_subset = df_input.iloc[(row_number+1):input_len]
    json_data = df_subset.to_dict(orient='records')
    print("New data set size " + str(diff))
    print(df_subset)

    json_data, unsupported_symbols = getPercentageChangeList(json_data)
    
    df = pd.DataFrame(json_data)
    if separate:
      output_csv = "output\\announcements_with_percentage" + "_" + str(processed["processed_hash"]) + ".csv"
      df.to_csv(output_csv, index=False, encoding='utf-8')
    else:
      df.to_csv(output_csv, index=False, header=False, mode='a', encoding='utf-8')
    print("saved " + output_csv)

    if unsupported_symbols:
      df = pd.DataFrame(unsupported_symbols)
      csv_filename = "output\\unsupportedSymbols" + "_" + str(processed["processed_hash"]) + ".csv"
      df.to_csv(csv_filename, index=False, encoding='utf-8')
      print("saved " + csv_filename)

def yahooFinTesting(yFinTicker, date):
    # Set the timezone to UTC
    ist_timezone = pytz.timezone('Asia/Kolkata')
    
    # Convert the input date to UTC timezone
    date_ist = date.astimezone(ist_timezone)

    # calculate start_date and end_date
    start_date = date_ist
    end_date = start_date + datetime.timedelta(days=1)

    tickerInformation = yf.Ticker(yFinTicker)
    tickerHistory = tickerInformation.history(start=start_date, end=end_date) 
    print(tickerHistory)

    print("information")
    print(tickerInformation.info)

    print("history_metadata")
    print(tickerInformation.history_metadata)

    print("actions")
    print(tickerInformation.actions)

    print("news")
    print(tickerInformation.news)

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
    #print(nseStockList)

    # get stock info
    stockInfoList = readYFinStockInfo()
    stockInfoDict = objList_to_dict(stockInfoList, "symbol")

    for i, entry in enumerate(nseStockList):
        stockInfoObj = stockInfoDict.get(getYFinTickerName(nseStockList[i]['SYMBOL']))
        if stockInfoObj:
            if rupees_to_crores(stockInfoObj['marketCap']) > 1000:
                count = count + 1

    print("Total counts : " + str(count))


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
            print(str(index) + " " + row[attachmentKey])  # Access row by column name
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
                                  print("==============================================================")
                                  print("Name: " + row[companyNameKey] + "\n" +
                                        "Title: " + row[titleKey] + "\n" +
                                        "Desc: " + row[descriptionKey] + "\n" + 
                                        "Link: " + row[attachmentKey] + "\n" +
                                        "Market cap(cr): " + str(rupees_to_crores(stockInfoObj['marketCap'])))

                                  print_keyword_search_results(results)
                                  entryWithKeywords = entryWithKeywords + 1
                                  print("==============================================================")
                        else:
                            print("** NO YAHOO FIN OBJ **")

    print("Out of " + str(len(df)) + " entry matches " + str(entryWithKeywords))

'''
'''
def generateAnnouncementAnalysis():
    fetchNseAnnouncements(start_date=datetime.datetime(2024, 5, 4), 
                      end_date=datetime.datetime(2024, 5, 4),
                      file_name="nse_fillings\\announcements_" + formatted_datetime + ".csv")

    downloadFilesFromCsvList("nse_fillings\\announcements_" + formatted_datetime + ".csv",
                            downloadDir="downloads")

    searchKeywordsFromCsvList("nse_fillings\\announcements_" + formatted_datetime + ".csv",
                              announcementKeywords,
                              downloadDir="downloads")

# ==========================================================================
# ============================  TEST FUNCTIONS =============================


# ==========================================================================
# ============================  SCRIPT RUN =================================


# result = getAllNseHolidays()
# print(result)

nseStockList = getAllNseSymbols(local=True)
syncUpYFinTickerCandles(nseStockList,delaySec=10)

# symbolType = "INDEX"
# currencyList = getJsonFromCsvForSymbols(symbolType)
# print(currencyList)
# fetchYFinTickerCandles(currencyList,symbolType,delaySec=15,partial=True)

#fetchYFinTickerCandles(nseStockList,delaySec=15,partial=True)
#print(result)

#fetchYFinStockInfo(nseStockList,partial=False)

#fetchNseAnnouncements()

#getPercentageChange(None,datetime.datetime(2024, 2, 1))

#syncUpCalculatePercentageForAnnouncement()

# fetchNseAnnouncements(start_date=datetime.datetime(2025, 1, 1), 
#                       end_date=current_datetime,
#                       file_name="nse_fillings\\announcements_" + formatted_datetime + ".csv")
#syncUpNseAnnouncements()
#updatePercentageForAnnouncements()

# downloadFileFromUrl("https://nsearchives.nseindia.com/corporate/Announcement_01012018094304_154.zip",
#                     outputDir="downloads")


# generateAnnouncementAnalysis()

# nseStockList = getAllNseSymbols(local=False)
# fetchYFinStockInfo(nseStockList,delay=3,partial=False)

# stockInfo = readYFinStockInfo()
# print(stockInfo)

# nseStockFilterTest()

# bseStockList = getAllBseSymbol(local=True)
# fetchYFinStockInfo(bseStockList,delay=3,partial=True,exchange="BSE")

# *************************************************************************

