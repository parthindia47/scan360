# -*- coding: utf-8 -*-
"""
Created on Sun Sep  6 01:43:43 2020

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
# ============================ fetch Function ==============================

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
def fetchJsonObj(urlType):
    response = fetchUrl(getBaseUrl(urlType=urlType))
    jsonUrl = getJsonUrlQuery(urlType=urlType,index="equities")
    jsonObj = fetchJson(jsonUrl, response.cookies)

    return jsonObj

def fetchAnnouncements():
    announcementBaseUrl = "https://www.nseindia.com/companies-listing/corporate-filings-announcements"
    response = fetchUrl(announcementBaseUrl)

    # announcementSchemaUrl = getAnnouncementSchemaUrl(index="equities")
    # announcementSchemaJson = fetchJson(announcementSchemaUrl,response.cookies)
    # print(announcementSchemaJson)

    # announcementJsonUrl = getAnnouncementUrlQuery(index="equities")
    # announcementJson = fetchJson(announcementJsonUrl,response.cookies)

    # subjectUrl = getListOfSubjectsUrl(index="equities")
    # subjectList = fetchJson(subjectUrl)
    # print(subjectList)

    # downloadFromJsonArray(announcementJson, "attchmntFile", "C:\\Users\\Parth\\Documents\\scan360\\downloads" )
    # print(announcementJson)

'''
=> Amalgamation / Merger / arrangements of listed Companies ???
https://www.nseindia.com/companies-listing/corporate-filings-scheme-document

json
https://www.nseindia.com/api/corporates/offerdocs/arrangementscheme"

schema
https://www.nseindia.com/json/CorporateFiling/CF-scheme-document.json

company list
https://www.nseindia.com/api/corporates/offerdocs/arrangementscheme/master


filters :
https://www.nseindia.com/api/corporates/offerdocs/arrangementscheme?index=equities&from_date=14-03-2024&to_date=14-04-2024
https://www.nseindia.com/api/corporates/offerdocs/arrangementscheme?index=equities&issuer=3i%20Infotech%20Limited&type=3i%20Infotech%20Limited
'''
def fetchCorporateArrangement():

    schemaUrl = "https://www.nseindia.com/json/CorporateFiling/CF-scheme-document.json"
    companiesListUrl = "https://www.nseindia.com/api/corporates/offerdocs/arrangementscheme/master"

    response = fetchUrl(getBaseUrl(urlType="arrangement"))
    arrangementJsonUrl = getJsonUrlQuery(urlType="arrangement",index="equities")
    arrangementJson = fetchJson(arrangementJsonUrl, response.cookies)

    print(arrangementJson)

'''
=> Board Meetings
https://www.nseindia.com/companies-listing/corporate-filings-board-meetings



json
https://www.nseindia.com/api/corporate-board-meetings?index=equities
https://www.nseindia.com/api/corporate-board-meetings?index=sme

schema
https://www.nseindia.com/json/CorporateFiling/CF-boardmeeting-equity.json
https://www.nseindia.com/json/CorporateFiling/CF-boardmeeting-sme.json

subjects :
https://www.nseindia.com/api/corporate-board-meetings-subject?index=equities

filters :
https://www.nseindia.com/api/corporate-board-meetings?index=equities&symbol=SUBEX&issuer=Subex%20Limited
https://www.nseindia.com/api/corporate-board-meetings?index=equities&from_date=14-04-2024&to_date=29-04-2024

'''
def fetchBoardMeetings():

    response = fetchUrl(getBaseUrl(urlType="boardMeetings"))
    boardMeetingsJsonUrl = getJsonUrlQuery(urlType="boardMeetings",index="equities")
    boardMeetingsJson = fetchJson(boardMeetingsJsonUrl, response.cookies)
    print(boardMeetingsJson)

'''
=> Bonus / Dividend / Buy Back / Rights Issue / General Meeting
https://www.nseindia.com/companies-listing/corporate-filings-actions


schema:
https://www.nseindia.com/json/CorporateFiling/CF-corpactions-equity.json
https://www.nseindia.com/json/CorporateFiling/CF-corpactions-debt.json
https://www.nseindia.com/json/CorporateFiling/CF-corpactions-mf.json
https://www.nseindia.com/json/CorporateFiling/CF-corpactions-sme.json

holiday:
https://www.nseindia.com/api/holiday-master?type=trading

subjects:
https://www.nseindia.com/api/corporates-corporateActions-subject?index=equities

list of companies:
https://www.nseindia.com/api/corporates-corporateActions-debtcompany

json:
https://www.nseindia.com/api/corporates-corporateActions?index=equities
https://www.nseindia.com/api/corporates-corporateActions?index=debt
https://www.nseindia.com/api/corporates-corporateActions?index=mf
https://www.nseindia.com/api/corporates-corporateActions?index=sme

filters:
https://www.nseindia.com/api/corporates-corporateActions?index=equities&from_date=14-04-2024&to_date=21-04-2024
https://www.nseindia.com/api/corporates-corporateActions?index=equities&from_date=07-04-2024&to_date=14-04-2024

https://www.nseindia.com/api/corporates-corporateActions?index=equities&from_date=14-04-2024&to_date=14-04-2024
https://www.nseindia.com/api/corporates-corporateActions?index=equities&from_date=14-04-2024&to_date=14-07-2024&fo_sec=true

https://www.nseindia.com/api/corporates-corporateActions?index=equities&from_date=undefined&to_date=undefined&symbol=SUBEX&issuer=Subex%20Limited

https://www.nseindia.com/api/corporates-corporateActions?index=equities&from_date=undefined&to_date=undefined&symbol=SUBEX&subject=BONUS&issuer=Subex%20Limited

'''
def fetchCorporateActions():
    response = fetchUrl(getBaseUrl(urlType="corporateActions"))
    boardMeetingsJsonUrl = getJsonUrlQuery(urlType="corporateActions",index="equities")
    boardMeetingsJson = fetchJson(boardMeetingsJsonUrl, response.cookies)
    print(boardMeetingsJson)

'''
=> Financial Results
https://www.nseindia.com/companies-listing/corporate-filings-financial-results


https://www.nseindia.com/api/corporates-financial-results?index=equities&period=Annual
https://www.nseindia.com/api/corporates-financial-results?index=equities&period=Quarterly
https://www.nseindia.com/api/corporates-financial-results?index=equities&period=Half-Yearly

https://www.nseindia.com/api/corporates-financial-results?index=equities&from_date=14-01-2024&to_date=14-04-2024&fo_sec=true&period=Half-Yearly

https://www.nseindia.com/api/corporates-financial-results?index=equities&fo_sec=true&symbol=SUBEX&issuer=Subex%20Limited&period=Half-Yearly

'''
def fetchFinancialResults():
    response = fetchUrl(getBaseUrl(urlType="financialResults"))
    boardMeetingsJsonUrl = getJsonUrlQuery(urlType="financialResults",index="equities")
    boardMeetingsJson = fetchJson(boardMeetingsJsonUrl, response.cookies)
    print(boardMeetingsJson)


'''
=> IPO fillings 
https://www.nseindia.com/companies-listing/corporate-filings-offer-documents

schema:
https://www.nseindia.com/json/CorporateFiling/CF-equity-offer-document.json
https://www.nseindia.com/json/CorporateFiling/CF-sme-offer-document.json
https://www.nseindia.com/json/CorporateFiling/CF-debt-offer-document.json

json:
https://www.nseindia.com/api/corporates/offerdocs?index=equities
https://www.nseindia.com/api/corporates/offerdocs?index=sme
https://www.nseindia.com/api/corporates/offerdocs?index=debt

filter:
https://www.nseindia.com/api/corporates/offerdocs?index=equities&from_date=14-10-2023&to_date=14-04-2024

company list:
https://www.nseindia.com/api/corporates/offerdocs?index=equities&company=Adani%20Wilmar%20Limited
https://www.nseindia.com/api/corporates/offerdocs?index=equities&isin=IDERR


'''
def fetchOfferDocuments():
    response = fetchUrl(getBaseUrl(urlType="offerDocs"))
    boardMeetingsJsonUrl = getJsonUrlQuery(urlType="offerDocs",index="equities")
    boardMeetingsJson = fetchJson(boardMeetingsJsonUrl, response.cookies)
    print(boardMeetingsJson)

    
#fetchAnnouncements()

'''
ref
https://www.geeksforgeeks.org/get-financial-data-from-yahoo-finance-with-python/

# max->maximum number of daily prices available 
# for Facebook.
# Valid options are 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 
# 5y, 10y and ytd.

'''
def fetchStockPrice():
  # startDate , as per our convenience we can modify
  startDate = datetime.datetime(2019, 5, 31)
  
  # endDate , as per our convenience we can modify
  endDate = datetime.datetime(2021, 1, 30)
  GetFacebookInformation = yf.Ticker("META")
  
  # pass the parameters as the taken dates for start and end
  print(GetFacebookInformation.history(start=startDate, 
                                      end=endDate))


#fetchOfferDocuments()

url = getSubjectUrl(urlType="boardMeetings",index="equities")
print(url)
