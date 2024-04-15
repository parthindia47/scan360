# -*- coding: utf-8 -*-
"""
=> listing
https://www.nseindia.com/market-data/all-upcoming-issues-ipo

==> annual report
https://www.nseindia.com/companies-listing/corporate-filings-annual-reports

==> Equity based
https://www.nseindia.com/get-quotes/equity?symbol=RAYMOND

credit ratings seems to be having indirect links

list of all stocks
https://www.nseindia.com/market-data/securities-available-for-trading

https://www.nseindia.com/products-services/equity-market-trading
https://www.nseindia.com/market-data/securities-available-for-trading

-- list of all companies with symbol and ISBN.
-- Face value ?
-- total floating ?

"""
import os
import requests
import json
import time
import datetime
import yfinance as yf
import pytz  # Import pytz module for timezone support
import pandas as pd
from io import StringIO
import math

nseSegments = {"equities":"equities",
              "debt":"debt",
              "sme":"sme",
              "sse":"sse",
              "mf":"mf",
              "municipalBond":"municipalBond",
              "invitsreits":"invitsreits"}

headers = {"User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36'}

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
        baseUrl += f"&from_date={fromDate}&to_date={toDate}"
    
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

# ==========================================================================
# ============================ Fetch Function ==============================

'''
Fetch any Json from URL
'''
def fetchJson(url,cookies=None):
    print("Fetching JSON " + url)
    try:
        # Send a GET request to the URL to download the JSON content
        if cookies:
          headers["Cookie"] = '; '.join([f'{cookie.name}={cookie.value}' for cookie in cookies])
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
should pass base urls which do not need cookies to access.
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

def downloadFileFromUrl(url, outputDir="."):
    try:
        # Check if the output directory exists
        if not os.path.exists(outputDir):
            raise FileNotFoundError(f"The directory '{outputDir}' does not exist.")
        
        if not url:
            print("URL is None")
        
        # Get the file name from the URL
        fileName = url.split("/")[-1]
        
        # Determine the output path
        outputPath = os.path.join(outputDir, fileName)

        print("Downloading " + url + " Saving to " + outputPath)
        
        # Send a GET request to the URL
        response = requests.get(url,headers=headers)
        response.raise_for_status()  # Raise an exception for 4xx or 5xx status codes
        
        # Save the content of the response to a file
        with open(outputPath, 'wb') as file:
            file.write(response.content)
        
        print(f"File downloaded successfully as '{outputPath}'")
    except (requests.exceptions.RequestException, FileNotFoundError) as e:
        print("Error:", e)

def downloadFromJsonArray(jsonObjArray, attachmentKey, downloadPath):
    for obj in jsonObjArray:
      if obj[attachmentKey]:
        downloadFileFromUrl(obj[attachmentKey],downloadPath)
        time.sleep(2)  # Pause execution for 2 seconds

# ==========================================================================
# ============================  Fetch JSON ==============================

def fetchJsonObj(urlType,index):
    response = fetchUrl(getBaseUrl(urlType=urlType))
    jsonUrl = getJsonUrlQuery(urlType=urlType,index=index)
    jsonObj = fetchJson(jsonUrl, response.cookies)

    return jsonObj

# ==========================================================================
# ============================  Yahoo Fin API ==============================
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


'''
EQ (Equity): EQ represents the Equity segment
BE (Group B): BE stands for "Trade-to-Trade" segment or the "Limited Physical Market" segment. 
BZ (Group Z): BZ represents the Trade-to-Trade segment for securities that 
              have not been traded at all during the last 365 days
'''
def getAllNseSymbols():

    csv_url = "https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv"

    response = requests.get(csv_url, headers=headers)
    
    # Read the CSV data into a DataFrame
    df = pd.read_csv(StringIO(response.text))
    
    # Convert the DataFrame to a dictionary
    json_data = df.to_dict(orient='records')
    
    return json_data

def getAllNseHolidays():
    url = "https://www.nseindia.com/api/holiday-master?type=trading"
    response = fetchJson(url)
    return response

# Example usage
# result = fetchPercentageChange1Day("BRIGADE.NS", datetime.datetime(2024, 4, 12))
# print("1d % change " + str(result))

result = calculatePercentageDifference("BRIGADE.NS", datetime.datetime(2024, 4, 3))
print("1d " + str(result["1d"]) + " 3d " + str(result["3d"]) + " 5d " + str(result["5d"]))

# jsonObj = fetchJsonObj(urlType="boardMeetings",index="equities")
# print(jsonObj)

# result = getAllNseSymbols()
# print(result)

# result = getAllNseHolidays()
# print(result)
