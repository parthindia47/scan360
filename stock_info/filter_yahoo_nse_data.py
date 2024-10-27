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
import csv
import hashlib
import logging
import zipfile
import re
from bs4 import BeautifulSoup


simple_headers = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36"}

market_cap_limit = 15000000000  # 1500 cr

def rupees_to_crores(rupees):
    crores = rupees / 10000000
    return crores

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
symbol                #attached with .NS
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
def filterNseData():
    global market_cap_limit
    local_url = "csv/yFinStockInfo_NSE.csv"
    json_data = None

    if os.path.exists(local_url):
      df = pd.read_csv(local_url)

      filtered_df = df[df['marketCap'] > market_cap_limit]

      new_df = filtered_df[['website', 'marketCap', 'trailingPE', 'longBusinessSummary', 'symbol', 'longName', 'industry', 'sector']]

      # Convert the DataFrame to a dictionary
      new_df.to_csv('csv/filtered_data_nse.csv', index=False)

      print("total number of rows filtered " + str(len(new_df)))
    else:
      print("csv path do not exists")

filterNseData()