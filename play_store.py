#!/usr/bin/env python3
"""
Get Google Play install counts for an app.

Usage:
  python play_installs.py --app com.whatsapp
  python play_installs.py --app com.whatsapp --lang en --country IN
  python play_installs.py --apps com.whatsapp com.instagram.android
"""

import argparse
from typing import Dict, Any
from google_play_scraper import app as gp_app

play_store_list = [
"com.application.zomato",
"com.grofers.customerapp",
"com.wotu.app",
"in.swiggy.android",

]


def fetch_app_info(app_id: str, lang: str = "en", country: str = "US") -> Dict[str, Any]:
    """
    Returns key fields including 'installs' (string band like '10,000,000+')
    and 'minInstalls' (int lower bound).
    """
    data = gp_app(app_id=app_id, lang=lang, country=country)
    # Commonly useful fields:
    return {
        "appId": data.get("appId"),
        "title": data.get("title"),
        "developer": data.get("developer"),
        "score": data.get("score"),  # average rating
        "ratings": data.get("ratings"),
        "reviews": data.get("reviews"),
        "installs_display": data.get("installs"),      # e.g. "10,000,000+"
        "min_installs": data.get("minInstalls"),       # e.g. 10000000
        "real_installs_note": "Play shows ranges; exact installs are not public.",
        "free": data.get("free"),
        "price": data.get("price"),
        "genre": data.get("genre"),
        "updated": data.get("updated"),
        "version": data.get("version"),
        "containsAds": data.get("containsAds"),
        "offersIAP": data.get("offersIAP"),
        "url": data.get("url"),
    }
pkg = "com.application.zomato"
try:
    info = fetch_app_info(pkg)
    print(info)
    # print(f"\n[{pkg}] {info['title']} — {info['developer']}")
    # print(f"Installs (display): {info['installs_display']}")
    # print(f"Min installs (lower bound): {info['min_installs']:,}")
    # print(f"Rating: {info['score']} ({info['ratings']:,} ratings, {info['reviews']:,} reviews)")
    # print(f"Free: {info['free']}  Price: {info['price']}  Genre: {info['genre']}")
    # print(f"Updated: {info['updated']}  Version: {info['version']}")
    # if info["containsAds"]:
    #     print("Contains Ads: Yes")
    # if info["offersIAP"]:
    #     print("Offers In-App Purchases: Yes")
    # print(f"Store URL: {info['url']}")
    # print(f"Note: {info['real_installs_note']}")
except Exception as e:
    print(f"\n[{pkg}] ERROR: {e}")
