
# CommodityList = ["BAJRA"
# "BARLEYJPR"
# "CASTOR"
# "CASTOROIL"
# "COCUDAKL"
# "COTTON"
# "COTWASOIL"
# "DHANIYA"
# "GROUNDNUT"
# "GUARGUM5"
# "GUARSEED10"
# "ISABGOL"
# "JEERAMINI"
# "JEERAUNJHA"
# "KAPAS"
# "MAIZE"
# "SESAMESEED"
# "STEEL"
# "SUNOIL"
# "TMCFGRNZM"
# "YELLOWP"]


CommodityList = ["GROUNDNUT"]

import time, re, requests
from bs4 import BeautifulSoup
from urllib.parse import urlencode, unquote
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo  # Python 3.9+
import pandas as pd

IST = ZoneInfo("Asia/Kolkata")

BASE = "https://www.ncdex.com"
SPOT_PAGE   = f"{BASE}/markets/spotprices"
VERIFY_FP   = f"{BASE}/__verify/fp"
VERIFY_IMG  = f"{BASE}/__verify/fp/fake_image.png"
PRICE_GRAPH = f"{BASE}/spotprices/price_graph"

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36")

STATIC_TOKEN = "7W9IVqXYCHo20XAEiFcS1fwmC4DZBCgicdVidn6Z"  # fallback if page token not found

COMMON = {
    "User-Agent": UA,
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Connection": "keep-alive",
}

XHR_HEADERS_BASE = {
    "Origin": BASE,
    "Referer": SPOT_PAGE,
    "X-Requested-With": "XMLHttpRequest",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
    "sec-ch-ua-platform": '"Windows"',
    "sec-ch-ua-mobile": "?0",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
}

def _fingerprint(sess: requests.Session, path="/spotprices/price_graph"):
    sess.headers.update(COMMON)
    # Warm-up (sets hd_* cookies & session)
    sess.get(SPOT_PAGE, timeout=(7,25))
    # The challenge script loads a fake image
    sess.get(VERIFY_IMG, timeout=(7,25))
    # Then POSTs JSON with ?url=...
    payload = {"version":1, "src":"", "userAgent":UA, "checks":{"navigatorLanguages":1}}
    sess.post(f"{VERIFY_FP}?{urlencode({'url': path})}",
              json=payload,
              headers={"Origin": BASE, "Referer": SPOT_PAGE, **COMMON},
              timeout=(7,25))
    # The response normally sets a number; the cookie is client-set in JS.
    # We mimic by setting a future-looking ms timestamp if not present:
    if "__hd_fingerprint" not in sess.cookies:
        # small positive delay (2 seconds) -> milliseconds from now
        expiry_ms = int((time.time() + 2) * 1000)
        sess.cookies.set("__hd_fingerprint", str(expiry_ms),
                         domain=".ncdex.com", path="/", secure=True)
    # Their JS calls location.reload() → do one GET to the challenged path
    time.sleep(0.3)
    sess.get(PRICE_GRAPH, headers={"Referer": SPOT_PAGE, **COMMON}, timeout=(7,25))

def _extract_page_token(html: str):
    soup = BeautifulSoup(html, "html.parser")
    i = soup.find("input", attrs={"name": "_token"})
    if i and i.get("value"):
        return i["value"].strip()
    m = soup.find("meta", attrs={"name": re.compile(r"csrf", re.I)})
    if m and m.get("content"):
        return m["content"].strip()
    m2 = re.search(r'[_]token["\']?\s*[:=]\s*["\']([^"\']+)["\']', html, re.I)
    return m2.group(1).strip() if m2 else None

def fetch_spot_price_graph(fromDate: datetime, toDate: datetime, symbol="BAJRA"):
    df = fromDate.strftime("%d-%b-%Y")
    dt = toDate.strftime("%d-%b-%Y")

    with requests.Session() as s:
        _fingerprint(s)

        # Load page NOW (after fingerprint) so CSRF & session are in-sync
        rp = s.get(SPOT_PAGE, headers=COMMON, timeout=(7,25))
        rp.raise_for_status()
        page_token = _extract_page_token(rp.text) or STATIC_TOKEN
        #page_token = STATIC_TOKEN

        # Pull XSRF-TOKEN cookie and URL-decode it, then echo in header
        xsrf_cookie = s.cookies.get("XSRF-TOKEN")
        if not xsrf_cookie:
            raise RuntimeError("No XSRF-TOKEN cookie on session.")
        x_xsrf_header = unquote(xsrf_cookie)

        headers = {**COMMON, **XHR_HEADERS_BASE, "X-XSRF-TOKEN": x_xsrf_header}
        # Some stacks also accept X-CSRF-TOKEN (harmless if present)
        headers["X-CSRF-TOKEN"] = page_token

        form = {"symbol": symbol, "ftype": "1", "df": df, "dt": dt, "_token": page_token}

        print("POST ->", f"{PRICE_GRAPH}?{urlencode(form)}")
        # (We POST form body; the query string print is just for logs)
        r = s.post(PRICE_GRAPH, headers=headers, data=form, timeout=(7,25))
        ctype = r.headers.get("Content-Type", "").lower()
        
        # print("Cookies:", s.cookies.get_dict())
        # print("Headers:", headers)
        # print("Status:", r.status_code, r.headers.get("Content-Type"))
        # print(r.text[:600])

        if r.status_code == 419 or "text/html" in ctype:
            print("Challenge/419 again. Cookies:", s.cookies.get_dict())
            print("First 400 bytes:\n", r.text[:400])
            raise RuntimeError("Server still challenging. Check headers/cookies/clock.")

        return r.json()


_time12 = "%d-%m-%Y %I:%M %p"  # 01-10-2025 12:14 pm
_time24 = "%d-%m-%Y %H:%M"     # 01-10-2025 13:17

def _parse_nc_time(s: str) -> datetime:
    """
    Handle both 'dd-mm-YYYY hh:mm am/pm' and the odd 'dd-mm-YYYY HH:MM pm' (13..23 with am/pm).
    Returns timezone-aware IST datetime.
    """
    s = s.strip().lower()
    # try normal 12h first
    try:
        dt = datetime.strptime(s, _time12)
        return dt.replace(tzinfo=IST)
    except ValueError:
        pass

    # detect 24h mixed with am/pm and strip the meridiem
    m = re.match(r"^(\d{2}-\d{2}-\d{4})\s+(\d{1,2}:\d{2})\s*(am|pm)$", s)
    if m:
        date_part, hm, mer = m.groups()
        hour = int(hm.split(":")[0])
        # if hour >= 13, the meridiem is bogus; drop it and parse as 24h
        if hour >= 13:
            s2 = f"{date_part} {hm}"
            dt = datetime.strptime(s2, _time24)
            return dt.replace(tzinfo=IST)
        # otherwise we already failed 12h; fall through

    # fallback: try strict 24h with meridiem removed if present
    s2 = re.sub(r"\s*(am|pm)$", "", s)
    try:
        dt = datetime.strptime(s2, _time24)
        return dt.replace(tzinfo=IST)
    except ValueError:
        raise ValueError(f"Unparseable NCDEX timestamp: {s!r}")

def graph_json_to_ohlc_csv(graph_json: dict, out_csv_path: str) -> pd.DataFrame:
    """
    Convert {'dates': [...], 'prices': [...]} intraday series to daily OHLC in IST and save as CSV.
    Columns: Date,Open,High,Low,Close,Volume,Dividends,Stock Splits
    """
    if not graph_json.get("dates"):
        raise ValueError("Empty graph_json['dates'].")

    dt_list = [_parse_nc_time(s) for s in graph_json["dates"]]
    df = pd.DataFrame({"dt": dt_list, "price": graph_json["prices"]}).sort_values("dt")

    # group by calendar day (IST) and compute OHLC
    df["day"] = df["dt"].dt.date
    daily = (
        df.groupby("day", sort=True)["price"]
          .agg(Open="first", High="max", Low="min", Close="last", Volume="count")
          .reset_index()
    )

    # make midnight IST timestamps for the Date column
    daily["Date"] = pd.to_datetime(daily["day"]).dt.tz_localize(IST)
    daily["Dividends"] = 0.0
    daily["Stock Splits"] = 0.0

    out = daily[["Date", "Open", "High", "Low", "Close", "Volume", "Dividends", "Stock Splits"]]
    out.to_csv(out_csv_path, index=False)
    return out

def fetch_spot_price_graph_range(symbol: str,
                                 start: datetime,
                                 end: datetime,
                                 step_days: int = 20,
                                 pause_seconds: float = 1.2) -> dict:
    """
    Walk [start, end] in step_days windows; merge {'dates','prices'} de-duplicated by timestamp.
    Assumes you already have a working fetch_spot_price_graph(start, end, symbol).
    """
    def _midnight_ist(d: datetime) -> datetime:
        d = d.astimezone(IST) if d.tzinfo else d.replace(tzinfo=IST)
        return d.replace(hour=0, minute=0, second=0, microsecond=0)

    cur = _midnight_ist(start)
    end = _midnight_ist(end)

    all_dates, all_prices = [], []
    while cur <= end:
        chunk_end = min(cur + timedelta(days=step_days - 1), end)
        print(f"Fetching chunk {cur.date()} → {chunk_end.date()} ({symbol})")
        chunk = fetch_spot_price_graph(cur, chunk_end, symbol)   # your existing function
        print(chunk)
        if chunk and "dates" in chunk and "prices" in chunk:
            all_dates.extend(chunk["dates"])
            all_prices.extend(chunk["prices"])
        time.sleep(pause_seconds)
        cur = chunk_end + timedelta(days=1)

    if not all_dates:
        return {"dates": [], "prices": [], "min": None, "max": None}

    merged = pd.DataFrame({"date_str": all_dates, "price": all_prices})
    merged["dt"] = merged["date_str"].map(_parse_nc_time)
    merged = merged.sort_values("dt").drop_duplicates(subset=["dt"], keep="last")

    return {
        "dates": [d.strftime("%d-%m-%Y %I:%M %p").lower().replace("am", "am").replace("pm", "pm")
                  for d in merged["dt"]],
        "prices": merged["price"].tolist(),
        "min": float(merged["price"].min()),
        "max": float(merged["price"].max()),
    }
    

for idx, symbol in enumerate(CommodityList):
  merged = fetch_spot_price_graph_range(
      symbol=symbol,
      start=datetime(2025, 1, 1),
      end=datetime(2025, 2, 20),
      step_days=20,
      pause_seconds=3
  )

  # 2) Convert merged intraday series to daily OHLC and save:
  op_file = symbol + ".csv"
  df_out = graph_json_to_ohlc_csv(merged, out_csv_path=op_file)
  print("Saved:", op_file)
  print(df_out.head())

# Example:
# data = fetch_spot_price_graph(datetime(2025,10,1), datetime(2025,10,15), "BAJRA")
# print(data)
#print("items:", len(data) if hasattr(data, "__len__") else type(data))


