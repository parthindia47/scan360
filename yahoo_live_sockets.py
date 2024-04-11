# -*- coding: utf-8 -*-
"""
Created on Tue Sep  8 20:29:38 2020

example :

{"id": "^NSEI", "exchange": "NSI", "quoteType": 9, "price": 11265.5, "timestamp": 1599642762000, "marketHours": 1, "changePercent": -0.4581426680088043, "dayVolume": 0, "change": -51.849609375, "priceHint": 2}
2020-09-09 14:42:42.380947
{"id": "^NSEBANK", "exchange": "NSI", "quoteType": 9, "price": 22181.650390625, "timestamp": 1599642761000, "marketHours": 1, "changePercent": -2.4742352962493896, "dayVolume": 0, "change": -562.75, "priceHint": 2}

"""

import yliveticker
from datetime import time, datetime


# this function is called on each ticker update
def on_new_msg(msg):
    print(datetime.now())
    print(msg)


yliveticker.YLiveTicker(on_ticker=on_new_msg, ticker_names=["^NSEBANK","^NSEI"])