import os
import pandas as pd


def get_pct_change(
    symbol: str,
    event_date,
    charts_root: str = "stock_charts",
    round_to: int = 2,
):
    """
    Calculate percentage change for 1D (vs previous trading day)
    and 1W (vs ~5 trading days earlier) for `symbol` on or after event_date.

    Returns dict like {"1D": 1.23, "1W": -2.45}
    or None if unavailable.
    """
    fp = os.path.join(charts_root, f"{symbol.upper()}.csv")
    if not os.path.exists(fp):
        return None, None   # ✅ safe unpack

    cdf = pd.read_csv(fp, usecols=["Date", "Close"])
    cdf["Date"] = pd.to_datetime(cdf["Date"], errors="coerce")
    cdf = cdf.dropna(subset=["Date", "Close"]).copy()
    cdf["cal_date"] = cdf["Date"].dt.date
    cdf.sort_values("cal_date", inplace=True, kind="mergesort")
    cdf.reset_index(drop=True, inplace=True)

    # Normalize input event_date
    if isinstance(event_date, str):
        ev = pd.to_datetime(event_date, errors="coerce")
        if pd.isna(ev):
            return None, None   # ✅ safe unpack
        ev_date = ev.date()
    else:
        ev_date = event_date

    # Find first index with trading date >= event_date
    idx_list = cdf.index[cdf["cal_date"] >= ev_date].tolist()
    if not idx_list:
        return None, None   # ✅ safe unpack
    i = idx_list[0]

    results_1D, results_1W = None, None

    # ---- 1D change ----
    if i > 0:
        cur = float(cdf.at[i, "Close"])
        prev = float(cdf.at[i - 1, "Close"])
        if prev != 0:
            results_1D = round((cur - prev) / prev * 100.0, round_to)

    # ---- 1W change (≈ 5 trading days back) ----
    if i > 5:
        cur = float(cdf.at[i, "Close"])
        prev_w = float(cdf.at[i - 5, "Close"])  # 5th trading day earlier
        if prev_w != 0:
            results_1W = round((cur - prev_w) / prev_w * 100.0, round_to)

    return (results_1D, results_1W)


def calculate_percentage_column(
    csv_file: str,
    date_key: str,
    charts_root: str = "stock_charts",
    round_to: int = 2,
    is_news_feed: bool = False,
    only_if_empty: bool = True  # if True, calculate only where columns are empty
):
    count = 0
    df = pd.read_csv(csv_file)
    print("processing ... ", csv_file)

    if "symbol" not in df.columns:
        raise KeyError("Expected a 'symbol' column in the CSV.")
    if date_key not in df.columns:
        raise KeyError(f"Expected a '{date_key}' column in the CSV.")

    # Normalize event dates
    df[date_key] = pd.to_datetime(df[date_key], errors="coerce")

    # Ensure change cols exist
    if "change_1D" not in df.columns:
        df["change_1D"] = None
    if "change_1W" not in df.columns:
        df["change_1W"] = None

    # Iterate rows
    for idx, row in df.iterrows():
        dstr = row[date_key]
        if pd.isna(dstr):
            continue

        # Skip if only_if_empty=True and already has values
        if only_if_empty and pd.notna(row.get("change_1D")) and pd.notna(row.get("change_1W")):
            continue

        # Normalize symbol
        symbol = str(row["symbol"]).strip().upper()
        if is_news_feed:
            symbol = symbol.removesuffix(".NS")

        # Compute
        pct_1D, pct_1W = get_pct_change(symbol, dstr.strftime("%Y-%m-%d"),
                                        charts_root=charts_root, round_to=round_to)
        if pct_1D is not None:
            df.at[idx, "change_1D"] = pct_1D
        if pct_1W is not None:
            df.at[idx, "change_1W"] = pct_1W
        count = count + 1

    # Overwrite CSV
    df.to_csv(csv_file, index=False)
    print(f"✔ Updated '{csv_file}' with change_1D and change_1W for {count} rows.")
  