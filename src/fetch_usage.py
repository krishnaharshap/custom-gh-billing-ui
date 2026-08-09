#!/usr/bin/env python3
"""
fetch_usage.py - Collect weekly GitHub CI activity and repo storage metrics.

Replaces the deprecated /users/{user}/settings/billing/* endpoints (removed by
GitHub, returns 410) with data available via the standard REST API:
  - Actions minutes: estimated from workflow run durations across owned repos
  - Storage: total disk size of owned repos in GB

Token required: fine-grained PAT with Actions (read) + Metadata (read) on all repos.
No billing permissions needed.
"""

import os
import sys
import json
import datetime
import requests
import yaml

API_BASE = "https://api.github.com"
OUTPUT_FILE = os.path.join("docs", "data", "usage_history.json")
CONFIG_FILE = "config.yaml"

API_HEADERS = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}


def load_config():
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)
    except Exception as e:
        print(f"ERROR: cannot load {CONFIG_FILE}: {e}", file=sys.stderr)
        sys.exit(1)


def get_token():
    token = os.getenv("GITHUB_PAT")
    if not token:
        print("ERROR: GITHUB_PAT environment variable not set", file=sys.stderr)
        sys.exit(1)
    return token


def call_api(path, token, params=None):
    headers = {**API_HEADERS, "Authorization": f"Bearer {token}"}
    resp = requests.get(f"{API_BASE}{path}", headers=headers, params=params)
    if not resp.ok:
        print(f"WARNING: {path} -> {resp.status_code}", file=sys.stderr)
        resp.raise_for_status()
    return resp.json()


def fetch_actions(token):
    """
    Estimate Actions minutes used in the last 7 days by summing workflow run
    durations (updated_at - created_at) across all owned non-fork repos.
    This uses the workflow runs API, which works on fine-grained tokens with
    Actions: read, replacing the deprecated billing endpoint.
    """
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=7)
    repos = call_api("/user/repos", token, params={"per_page": 100, "affiliation": "owner", "sort": "pushed"})

    total_minutes = 0.0
    for repo in repos:
        if repo.get("fork") or repo.get("archived"):
            continue
        try:
            data = call_api(
                f"/repos/{repo['full_name']}/actions/runs",
                token,
                params={"per_page": 20, "status": "completed"},
            )
            for run in data.get("workflow_runs", []):
                updated = datetime.datetime.fromisoformat(run["updated_at"].rstrip("Z"))
                if updated < cutoff:
                    continue
                created = datetime.datetime.fromisoformat(run["created_at"].rstrip("Z"))
                total_minutes += max(0.0, (updated - created).total_seconds() / 60.0)
        except Exception as e:
            print(f"WARNING: skipping {repo['name']} runs: {e}", file=sys.stderr)

    return {
        "total_minutes_used": round(total_minutes),
        "total_paid_minutes_used": 0,
        "included_minutes": 2000,
    }


def fetch_storage(token):
    """Total disk size of all owned non-fork repos, in GB."""
    repos = call_api("/user/repos", token, params={"per_page": 100, "affiliation": "owner"})
    total_kb = sum(r.get("size", 0) for r in repos if not r.get("fork"))
    return {
        "total_gigabytes_used": round(total_kb / 1_048_576, 4),
    }


def append_record(record):
    history = []
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                history = json.load(f)
        except (json.JSONDecodeError, ValueError):
            print(f"WARNING: corrupt {OUTPUT_FILE}, starting fresh", file=sys.stderr)

    history.append(record)

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)
    print(f"Appended record {record['timestamp']} to {OUTPUT_FILE}")


def main():
    cfg = load_config()
    token = get_token()
    enabled = cfg.get("metrics", [])

    record = {"timestamp": datetime.datetime.utcnow().isoformat()}

    if "actions" in enabled:
        record["actions"] = fetch_actions(token)

    if "storage" in enabled:
        record["shared_storage"] = fetch_storage(token)

    append_record(record)
    print("Done.")


if __name__ == "__main__":
    main()
