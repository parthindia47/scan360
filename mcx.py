import os
import time
import pandas as pd
from datetime import date
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import Select
import glob

# 1. Create date range
start_dt = date(2025, 5, 12)
end_dt = date(2025, 5, 12)
date_range_df = pd.date_range(start_dt, end_dt).strftime("%d-%m-%Y")  # DD-MM-YYYY format

# 2. Chrome config
download_dir = r"C:\work"
chrome_options = Options()
chrome_options.add_argument("--headless=new")  # Chrome 109+ requires `new`
chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")

chrome_options.add_experimental_option("prefs", {
    "download.default_directory": download_dir,
    "download.prompt_for_download": False,
    "download.directory_upgrade": True,
    "safebrowsing.enabled": True
})

# 3. Start browser once
driver = webdriver.Chrome(options=chrome_options)
wait = WebDriverWait(driver, 10)
actions = ActionChains(driver)

# 4. Loop through dates
for date_str in date_range_df:
    filename = os.path.join(download_dir, f"BhavCopyDateWise_{date_str.replace('-', '')}.csv")

    if os.path.exists(filename):
        print(f"🗑️ Already downloaded: {filename}")
        continue

    print(f"⬇️ Downloading for {date_str}")

    try:
        driver.get("https://www.mcxindia.com/market-data/bhavcopy")

        print("step 1")
        wait.until(EC.presence_of_element_located((By.ID, "txtDate")))
        # Remove readonly and enter date
        input_date = driver.find_element(By.ID, "txtDate")
        driver.execute_script("arguments[0].removeAttribute('readonly')", input_date)
        input_date.clear()
        input_date.send_keys(date_str)  # Format must be DD-MM-YYYY
        
        print("step 2")
        wait.until(EC.presence_of_element_located((By.ID, "ddlInstrumentName")))
        dropdown = Select(driver.find_element(By.ID, "ddlInstrumentName"))
        dropdown.select_by_value("FUTCOM")  # You can also use .select_by_visible_text("FUTCOM")

        print("step 3")
        # Click Show button
        show_btn = driver.find_element(By.ID, "btnShowDatewise")
        show_btn.click()
        time.sleep(5)  # Wait for table to load
        
        print("step 4")
        # Click CSV Download
        csv_link = wait.until(EC.element_to_be_clickable((By.ID, "lnkExpToCSV")))
        csv_link.click()
        
        print("step 5")
        print(f"✅ Triggered download for {date_str}")

        time.sleep(7)  # Give time to download

    except Exception as e:
        print(f"❌ Error for {date_str}: {e}")

# 5. Clean up
driver.quit()
