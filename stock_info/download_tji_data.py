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
https://www.tijorifinance.com/markets
'''
def downloadTijoriFinIndex(partial=True, delay=3):
    global simple_headers
    count = 0

    # URL of the webpage
    url = "https://www.tijorifinance.com/markets"

    # Download the HTML content
    response = requests.get(url, headers=simple_headers)
    soup = BeautifulSoup(response.content, 'html.parser')
    #print(soup.prettify())

    # Find the table with id "market__table__niche"
    table = soup.find('table', id="market__table__niche")

    # Find all <tr> elements inside the table body <tbody>
    rows = table.find('tbody').find_all('tr')

    # Base URL for JSON API requests
    api_base_url = "https://www.tijorifinance.com/api/v1/markets/company_trailings/"

    # Iterate through each <tr> and generate URLs to download JSON
    for row in rows:
        # Extract the attributes 'tjiid' and 'myid' from each <tr>
        tjiid = row.get('tjiid')
        myid = row.get('myid')

        if partial and os.path.exists("tji\\" + myid + ".csv"):
            print("skipping " + myid)
            continue
        
        # Construct the JSON API URL
        json_url = api_base_url + tjiid

        # Download the JSON data
        json_response = requests.get(json_url, headers=simple_headers)
        
        # Convert the JSON data to a pandas DataFrame
        if json_response.status_code == 200:
            json_data = json_response.json()

            # Assuming the JSON data is a list of dictionaries
            df = pd.DataFrame(json_data['data'])
            
            # Save the DataFrame to CSV with filename as 'myid'
            filename = "tji\\" + myid + ".csv"
            
            # Save to the current working directory
            df.to_csv(filename, index=False)
            print(f"Saved: {filename}")
            count = count + 1
            
            time.sleep(delay)
        else:
            print(f"Failed to fetch data for {myid}, Status Code: {json_response.status_code}")
    
    print("Saved total " + str(count) + " files")


downloadTijoriFinIndex(partial=True)