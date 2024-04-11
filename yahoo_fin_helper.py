# -*- coding: utf-8 -*-
"""
Created on Sun Sep  6 01:43:43 2020

"""

from bs4 import BeautifulSoup
import requests

simple_headers = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36"}

def BNprice():
    
    url = 'https://finance.yahoo.com/quote/^NSEBANK?p=^NSEBANK&.tsrc=fin-srch'

    try:
        response = requests.get(url, headers=simple_headers  )
    except:
        print("issue fetching bank nifty")
    
    soup = BeautifulSoup(response.text, 'lxml')

    index = soup.find_all('div', {'class': 'My(6px) Pos(r) smartphone_Mt(6px)'})[0].find('span').text
    index = index.replace(',','')
    
    changes = soup.find_all('div', {'class': 'My(6px) Pos(r) smartphone_Mt(6px)'})[0].find_all('span')[1].text
    
    abs_index_change = changes.split( "(" )[0];
    pc_index_change = changes.split( "(" )[1];
    pc_index_change = pc_index_change.split( "%)" )[0];
    
    
    return( index, abs_index_change, pc_index_change)
    
def Niftyprice():
    
    url = 'https://finance.yahoo.com/quote/^NSEI?p=^NSEI&.tsrc=fin-srch'

    try:
        response = requests.get(url, headers=simple_headers )
    except:
        print("issue fetching nifty")
    soup = BeautifulSoup(response.text, 'lxml')

    index = soup.find_all('div', {'class': 'My(6px) Pos(r) smartphone_Mt(6px)'})[0].find('span').text
    index = index.replace(',','')
    
    changes = soup.find_all('div', {'class': 'My(6px) Pos(r) smartphone_Mt(6px)'})[0].find_all('span')[1].text
    
    abs_index_change = changes.split( "(" )[0];
    pc_index_change = changes.split( "(" )[1];
    pc_index_change = pc_index_change.split( "%)" )[0];
    
    
    return( index, abs_index_change, pc_index_change )