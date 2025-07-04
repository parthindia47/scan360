import pandas as pd
import yfinance as yf

# Load CSV files
def merge_csv_files():
    df1 = pd.read_csv("yFinStockInfo_NSE.csv")         # First CSV with All yahoo finance fetch
    df2 = pd.read_csv("updated_yahoo_with_tji.csv")    # Second CSV with catagory

    # Function to safely clean symbol
    def clean_symbol(x):
        if isinstance(x, str):
            return x.split('.')[0].strip()
        return None

    # Clean symbols
    df1['symbol_clean'] = df1['symbol'].apply(clean_symbol)
    df2['symbol_clean'] = df2['symbol'].apply(clean_symbol)

    # Merge on cleaned symbol
    merged_df = df1.merge(
        df2[['symbol_clean', 'tjiIndustry']],
        on='symbol_clean',
        how='left'
    )

    # Fill missing tjiIndustry with "N"
    merged_df['tjiIndustry'] = merged_df['tjiIndustry'].fillna("NEW")

    # Drop helper column
    merged_df.drop(columns=['symbol_clean'], inplace=True)

    # Save to new CSV
    merged_df.to_csv("merged_stocks_with_industry.csv", index=False)

    print("✅ Merging complete. Saved as 'merged_stocks_with_industry.csv'.")


def get_stock_info_with_industry(yahoo_symbol):

    # Load the existing merged industry data once
    industry_df = pd.read_csv("merged_stocks_with_industry.csv")
    industry_df['symbol_clean'] = industry_df['symbol'].apply(lambda x: x.split('.')[0] if isinstance(x, str) else x)

    # Fetch stock info from yFinance
    ticker = yf.Ticker(yahoo_symbol)
    try:
        info = ticker.info
    except Exception as e:
        print(f"❌ Failed to fetch info for {yahoo_symbol}: {e}")
        return {}

    # Clean the symbol (remove .NS, .BO etc.)
    base_symbol = yahoo_symbol.split('.')[0]

    # Try to find the corresponding tjiIndustry
    match = industry_df[industry_df['symbol_clean'] == base_symbol]

    if not match.empty:
        tji_industry = match.iloc[0]['tjiIndustry']
    else:
        tji_industry = "N"

    # Attach the industry info to result
    info['tjiIndustry'] = tji_industry

    return info
    
def yahoo_fetch_file_update():
    # Load your original data with tjiIndustry
    industry_df = pd.read_csv("merged_stocks_with_industry.csv")
    industry_df['symbol_clean'] = industry_df['symbol'].apply(lambda x: x.split('.')[0] if isinstance(x, str) else x)

    # List of Yahoo Finance symbols you want to fetch
    symbols = ["RELIANCE.NS", "INFY.NS", "TCS.NS", "HDFCBANK.NS"]

    # Collect info for all symbols
    data = []
    for sym in symbols:
        try:
            info = yf.Ticker(sym).info
            info['symbol'] = sym
            data.append(info)
        except Exception as e:
            print(f"❌ Failed to fetch {sym}: {e}")

    # Create DataFrame from fetched data
    df_yf = pd.DataFrame(data)

    # Clean Yahoo symbols
    df_yf['symbol_clean'] = df_yf['symbol'].apply(lambda x: x.split('.')[0] if isinstance(x, str) else x)

    # Merge with tjiIndustry info
    final_df = pd.merge(df_yf, industry_df[['symbol_clean', 'tjiIndustry']], on='symbol_clean', how='left')

    # Fill missing industry info with "N"
    final_df['tjiIndustry'] = final_df['tjiIndustry'].fillna("N")

    # Save to CSV
    final_df.to_csv("merged_stocks_with_industry.csv", index=False)
    print("✅ Saved final_with_industry.csv with tjiIndustry column.")

        

#stock_info = get_stock_info_with_industry("RELIANCE.NS")
#print(stock_info)
#print(stock_info.get("symbol"), "| tjiIndustry:", stock_info.get("tjiIndustry"))

merge_csv_files()
