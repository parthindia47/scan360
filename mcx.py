import os
import glob
import time
import pandas as pd
from datetime import date
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains

def remove_all_csv_files(folder_path):
    csv_files = glob.glob(os.path.join(folder_path, "*.csv"))
    for file in csv_files:
        try:
            os.remove(file)
            print(f"🗑️ Deleted: {file}")
        except Exception as e:
            print(f"❌ Failed to delete {file}: {e}")

'''
TODO : this function should avoid weekends and public holiday.
also this function should avoid duplicate entries.
'''
def download_mcx_bhavcopy(start_date, end_date, download_dir, instrument_value="FUTCOM"):
    # Prepare date range and result container
    date_range_df = pd.date_range(start_date, end_date).strftime("%d-%m-%Y")
    combined_df = pd.DataFrame()

    # Chrome options
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_experimental_option("prefs", {
        "download.default_directory": download_dir,
        "download.prompt_for_download": False,
        "download.directory_upgrade": True,
        "safebrowsing.enabled": True
    })

    # Start browser
    driver = webdriver.Chrome(options=chrome_options)
    wait = WebDriverWait(driver, 10)
    actions = ActionChains(driver)
    
    remove_all_csv_files(download_dir)

    for date_str in date_range_df:
        print(f"⬇️ Downloading for {date_str}")
        try:
            driver.get("https://www.mcxindia.com/market-data/bhavcopy")

            # Enter date
            wait.until(EC.presence_of_element_located((By.ID, "txtDate")))
            input_date = driver.find_element(By.ID, "txtDate")
            driver.execute_script("arguments[0].removeAttribute('readonly')", input_date)
            input_date.clear()
            input_date.send_keys(date_str)
            
            # ✅ Print current value of the input field
            current_val = driver.execute_script("return arguments[0].value;", input_date)
            print(f"📅 Current date in input field: {current_val}")

            # Select dropdown
            wait.until(EC.presence_of_element_located((By.ID, "ddlInstrumentName")))
            dropdown = Select(driver.find_element(By.ID, "ddlInstrumentName"))
            dropdown.select_by_value(instrument_value)

            # Click Show
            driver.find_element(By.ID, "btnShowDatewise").click()
            time.sleep(60)

            # Download CSV
            csv_link = wait.until(EC.element_to_be_clickable((By.ID, "lnkExpToCSV")))
            csv_link.click()
            print(f"✅ Triggered download for {date_str}")

            # Wait for CSV to appear
            timeout = 30
            downloaded_file = None
            while timeout > 0:
                files = glob.glob(os.path.join(download_dir, "*.csv"))
                if files:
                    downloaded_file = files[0]
                    time.sleep(2)  # Allow write to complete
                    break
                time.sleep(1)
                timeout -= 1

            if not downloaded_file:
                print(f"❌ CSV not downloaded for {date_str}")
                continue

            # Read and append
            df = pd.read_csv(downloaded_file)
            combined_df = pd.concat([combined_df, df], ignore_index=True)

            # Delete downloaded file
            remove_all_csv_files(download_dir)

        except Exception as e:
            print(f"❌ Error for {date_str}: {e}")

    driver.quit()
    return combined_df

if __name__ == "__main__":
    resp = download_mcx_bhavcopy(
        start_date=date(2025, 6, 10),
        end_date=date(2025, 6, 10),
        download_dir=r"C:\temp"
    )
    print(resp)