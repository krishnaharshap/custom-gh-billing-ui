#!/usr/bin/env python3
"""
fetch_usage.py – Fetch billing usage metrics from GitHub REST API for a personal account
Author: Krishna Harsha (krishnaharshap)
Date: YYYY-MM-DD
Description:
  - Uses GitHub REST API endpoints to fetch usage summaries for:
      * Actions minutes
      * Packages storage
      * Shared storage
  - Appends each run’s data as a record in data/usage_history.json
  - Supports configuration via config.yaml (schedule, thresholds, metrics)
  - Securely uses GITHUB_PAT from environment variable (stored in GitHub Secrets)
  - Commits back to repo via GitHub Actions workflow (not done here)
"""

import os
import sys
import json
import datetime
import requests
import yaml

# Constants
API_BASE = "https://api.github.com"
USERNAME = "krishnaharshap"  # change if needed
OUTPUT_FILE = os.path.join("docs", "data", "usage_history.json")
CONFIG_FILE = "config.yaml"

def load_config():
    """ Load configuration from config.yaml """
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            cfg = yaml.safe_load(f)
        return cfg
    except Exception as e:
        print(f"ERROR: Unable to load config file '{CONFIG_FILE}': {e}", file=sys.stderr)
        sys.exit(1)

def get_github_token():
    """ Retrieve GitHub PAT from environment variable """
    token = os.getenv("GITHUB_PAT")
    if not token:
        print("ERROR: Environment variable GITHUB_PAT not set", file=sys.stderr)
        sys.exit(1)
    return token

def call_api(endpoint):
    """ Call GitHub API endpoint and return JSON response """
    token = get_github_token()
    url = f"{API_BASE}{endpoint}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json"
    }
    resp = requests.get(url, headers=headers)
    if resp.status_code != 200:
        print(f"ERROR: API call to {url} failed with status {resp.status_code}: {resp.text}", file=sys.stderr)
        resp.raise_for_status()
    return resp.json()

def fetch_actions():
    """ Fetch Actions minutes usage summary for user """
    endpoint = f"/users/{USERNAME}/settings/billing/actions"
    return call_api(endpoint)

def fetch_packages():
    """ Fetch Packages storage usage summary for user """
    endpoint = f"/users/{USERNAME}/settings/billing/packages"
    return call_api(endpoint)

def fetch_shared_storage():
    """ Fetch shared storage usage summary for user """
    endpoint = f"/users/{USERNAME}/settings/billing/shared-storage"
    return call_api(endpoint)

def append_record(record):
    """ Append a new record to the JSON output file """
    history = []
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                history = json.load(f)
        except json.JSONDecodeError:
            print(f"WARNING: JSON decode failed for {OUTPUT_FILE}, starting new history list", file=sys.stderr)
            history = []
    history.append(record)
    # Optionally trim history (e.g., last 24 months) — not implemented now
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)
    print(f"Appended record for timestamp {record['timestamp']} to {OUTPUT_FILE}")

def main():
    cfg = load_config()
    timestamp = datetime.datetime.utcnow().isoformat()
    enabled = cfg.get("metrics", [])
    record = {"timestamp": timestamp}
    if "actions" in enabled:
        record["actions"] = fetch_actions()
    if "packages" in enabled:
        record["packages"] = fetch_packages()
    if "shared-storage" in enabled:
        record["shared_storage"] = fetch_shared_storage()

    # Additional thresholds/notification logic could be added here based on cfg thresholds.

    append_record(record)
    print("Fetch usage completed successfully.")

if __name__ == "__main__":
    main()
