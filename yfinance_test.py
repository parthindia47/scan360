import yfinance as yf
dat = yf.Ticker("MSFT")
#print(dir(dat))
print(dat.info)