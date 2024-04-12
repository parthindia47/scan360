# -*- coding: utf-8 -*-
"""
Created on Sun Sep  6 01:43:43 2020

JSON responses
"https://www.nseindia.com/api/corporate-announcements?index=equities"
"https://www.nseindia.com/api/corporate-announcements?index=debt"
"https://www.nseindia.com/api/corporate-announcements?index=sme"
"https://www.nseindia.com/api/corporate-announcements?index=sse"
"https://www.nseindia.com/api/corporate-announcements?index=mf"
"https://www.nseindia.com/api/corporate-announcements?index=municipalBond"
"https://www.nseindia.com/api/corporate-announcements?index=invitsreits"

Time wise search
"https://www.nseindia.com/api/corporate-announcements?index=equities&from_date=10-04-2024&to_date=11-04-2024"

FnO search
"https://www.nseindia.com/api/corporate-announcements?index=equities&from_date=9-04-2024&to_date=11-04-2024&fo_sec=true"

Company wise search
"https://www.nseindia.com/api/corporate-announcements?index=equities&symbol=SUBEX&issuer=Subex%20Limited"

All subjects(keywords) to test
"https://www.nseindia.com/api/corporate-announcements-subject?index=equities"

Table titles 
"https://www.nseindia.com/json/CorporateFiling/CF-annc-equity.json"
"https://www.nseindia.com/json/CorporateFiling/CF-annc-debt.json"
"https://www.nseindia.com/json/CorporateFiling/CF-annc-mf.json"
"https://www.nseindia.com/json/CorporateFiling/CF-annc-sme.json"
"https://www.nseindia.com/json/CorporateFiling/CF-annc-sse.json"
"https://www.nseindia.com/json/CorporateFiling/CF-annc-sme.json"

Main url
"https://www.nseindia.com/companies-listing/corporate-filings-announcements"

List of all companies ???
"https://www.nseindia.com/api/corporates-corporateActions-debtcompany"


=> Board Meetings
https://www.nseindia.com/companies-listing/corporate-filings-board-meetings

=> Bonus / Dividend / Buy Back / Rights Issue / General Meeting
https://www.nseindia.com/companies-listing/corporate-filings-actions

=> Financial Results
https://www.nseindia.com/companies-listing/corporate-filings-financial-results

=> IPO fillings 
https://www.nseindia.com/companies-listing/corporate-filings-offer-documents

=> Amalgamation / Merger / arrangements of listed Companies ???
https://www.nseindia.com/companies-listing/corporate-filings-scheme-document


=> listing
https://www.nseindia.com/market-data/all-upcoming-issues-ipo


"""

nseRootUrl = "https://www.nseindia.com/"
announcementMainUrl = "https://www.nseindia.com/companies-listing/corporate-filings-announcements"

