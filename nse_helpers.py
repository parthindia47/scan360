# -*- coding: utf-8 -*-
"""
Created on Sat Sep  5 19:54:14 2020

where Monday is 0 and Sunday is 6.
"""

import nsepy as nsepy
from datetime import date, datetime, timedelta
import calendar


# use symbol "NIFTY" "BANKNIFTY"
    
"""
nsepy.get_expiry_date( year=2020, month=10 )
{datetime.date(2020, 10, 1),
 datetime.date(2020, 10, 8),
 datetime.date(2020, 10, 15),
 datetime.date(2020, 10, 29)}

1 Monday
...
7 Sunday

"""

def get_expiry_date_custom( year, month ):
    thursdayset = set()
    daysInMonth = calendar.monthrange(year, month)[1]   # Returns (month, numberOfDaysInMonth)
    last_date = date(year, month, daysInMonth)
    first_date = date(year, month, 1)
        
    offset = 4 - first_date.isoweekday()
    if offset >= 0: 
        first_thursday = first_date + timedelta(offset)
    else:
        first_thursday = first_date + timedelta( 7 + offset)
        
    thursdayset.add(first_thursday)
    curr_thursday = first_thursday
    
    for idx in range(1,6):
        next_thursday = curr_thursday + timedelta(7)
        if next_thursday <= last_date:
            thursdayset.add(next_thursday)
            curr_thursday = next_thursday
            
    return thursdayset


def get_safe_current_expiry():
    
    #expiry = nsepy.get_expiry_date( year=datetime.today().year, month= datetime.today().month )
    expiry = get_expiry_date_custom( year=datetime.today().year, month= datetime.today().month )
    
    
    expiry_list = list(expiry)
    expiry_list.sort()
    curr_fut_expiry_date = expiry_list[-1]
    
    day_delta = curr_fut_expiry_date.day - datetime.today().day
    
    # that means we are close to expiry so we need to move to next expiry
    if( day_delta < 4 ):
        
        new_month = datetime.today().month + 1
        new_year = datetime.today().year
        
        if( new_month > 12 ):
            new_month = 1
            new_year =  new_year + 1
        
        #expiry = nsepy.get_expiry_date( year = new_year , month = new_month )
        expiry = get_expiry_date_custom( year = new_year , month = new_month )
        
        expiry_list = list(expiry)
        expiry_list.sort()
        curr_fut_expiry_date = expiry_list[-1]
        return curr_fut_expiry_date
    else:
        return curr_fut_expiry_date
    
def get_last_closing_value_fut( exch_symbol ):
    
    symbol_data = nsepy.get_history( symbol = exch_symbol,
                        start = datetime.today() - timedelta(days=10),
                        end = datetime.today(),
                        index=True,
                        futures = True,
                        expiry_date = get_safe_current_expiry() )
    
    #change to "Last" if percentage calculation is done on this basis.
    return symbol_data.iloc[-1]["Close"]

 
def get_last_closing_value_equity( exch_symbol ):

    symbol_data = nsepy.get_history( symbol=exch_symbol, 
                        start=datetime.today() - timedelta(days=10) , 
                        end=datetime.today(),
    					index=True)
    
    return symbol_data.iloc[-1]["Close"]
    
if __name__ == "__main__":
    pass
    #print(get_expiry_date_custom(2020,10))    
    #print(get_safe_current_expiry())
    #print(get_prev_closing_date("NIFTY"))
    #print(get_prev_closing_date("BANKNIFTY"))