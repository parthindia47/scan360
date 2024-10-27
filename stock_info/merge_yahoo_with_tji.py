import pandas as pd
import re

# Define a function to clean up company names by removing specific suffixes
def clean_company_name(name):
    # Check if the input is a string
    if isinstance(name, str):
        return re.sub(r"(\s+Company\s+Limited|\s+Limited|,\s+Limited|\s+Ltd\.?|\s+Ltd)$", "", name, flags=re.IGNORECASE).strip()
    return name  # Return as is if it's not a string (e.g., NaN or None)

def merge_yahoo_with_tji():
    # Load the main CSV file with the "longName" column
    main_df = pd.read_csv("csv\\filtered_data_nse.csv")

    # Load the reference CSV file with "longName" and "tjiIndustry" columns
    reference_df = pd.read_csv("csv\\combined_tji.csv")

    # Apply the cleaning function to the "longName" column in main_df
    main_df["cleaned_longName"] = main_df["longName"].apply(clean_company_name)

    # Apply the cleaning function to the "longName" column in reference_df for a consistent match
    reference_df["cleaned_longName"] = reference_df["longName"].apply(clean_company_name)

    # Group by "cleaned_longName" and concatenate 'tjiIndustry' entries with a "/"
    reference_df_grouped = reference_df.groupby("cleaned_longName")["tjiIndustry"].apply(lambda x: "/".join(x)).reset_index()

    # Merge the grouped reference DataFrame with main_df
    merged_df = main_df.merge(reference_df_grouped, on="cleaned_longName", how="left")

    # Drop the temporary "cleaned_longName" column and save the updated DataFrame to a new CSV file
    merged_df.drop(columns=["cleaned_longName"], inplace=True)
    fileName = "csv\\updated_yahoo_with_tji.csv"
    merged_df.to_csv(fileName, index=False)

    print("Updated CSV file created as " + fileName)

def remove_NS(name):
    return re.sub(r"\.NS$", "", name).strip()

def merge_yahoo_with_bse():

    # Load the main CSV file with the "longName" column
    main_df = pd.read_csv("csv/filtered_data_nse.csv")

    # Load the reference CSV file with "longName" and "tjiIndustry" columns
    reference_df = pd.read_csv("csv/equity_bse.csv")

    # Apply the cleaning function to the "longName" column in main_df
    main_df["cleaned_symbol"] = main_df["symbol"].apply(remove_NS)

    # Apply the cleaning function to the "longName" column in reference_df for a consistent match
    reference_df["cleaned_symbol"] = reference_df["symbol"].apply(remove_NS)

    # Merge both DataFrames on the "cleaned_longName" column to bring "tjiIndustry" to main_df
    merged_df = main_df.merge(reference_df[['cleaned_symbol', 'bseIndustry']], 
                              on="cleaned_symbol", how="left")

    # Drop the temporary "cleaned_longName" column and save the updated DataFrame to a new CSV file
    merged_df.drop(columns=["cleaned_symbol"], inplace=True)
    fileName = "csv/updated_yahoo_with_bse.csv"
    merged_df.to_csv(fileName, index=False)

    print("Updated CSV file created as " + fileName)

#merge_yahoo_with_bse()
merge_yahoo_with_tji()