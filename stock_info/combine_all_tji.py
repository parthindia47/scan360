import os
import pandas as pd

# Specify the folder containing the CSV files
folder_path = "tji/"

# Initialize an empty DataFrame to store the results
combined_df = pd.DataFrame(columns=["name", "file_title"])

# Iterate through each file in the folder
for filename in os.listdir(folder_path):
    # Check if the file is a CSV
    if filename.endswith(".csv"):
        # Remove ".csv" and initial "TJI" from the filename
        title = filename.replace(".csv", "").replace("TJI","")
        
        # Construct the full file path
        file_path = os.path.join(folder_path, filename)
        
        # Read the CSV file into a DataFrame
        df = pd.read_csv(file_path)
        
        # Check if the 'name' column exists
        if "name" in df.columns:
            # Create a temporary DataFrame with 'name' and 'file_title' columns
            temp_df = pd.DataFrame({
                "name": df["name"],
                "file_title": title  # Assign the file name as the title
            })
            
            # Append the temporary DataFrame to the combined DataFrame
            combined_df = pd.concat([combined_df, temp_df], ignore_index=True)

# Save the combined DataFrame to a new CSV file
combined_df.to_csv("csv/combined_tji.csv", index=False)
print("Combined CSV file created as 'combined_tji.csv'")
