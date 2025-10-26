# GitHub Billing Dashboard  
A free-tier dashboard to monitor usage and spending for GitHub metered products on a personal account.

## Overview  
This project fetches usage data from GitHub’s billing API for your personal account (Actions minutes, Packages storage, Shared storage) and hosts a static dashboard via GitHub Pages. The JSON-formatted usage history is stored in the repo and visualized with Chart.js.

## Features  
- Weekly (configurable) data fetch via GitHub Actions cron.  
- JSON data storage for historical trend analysis (monthly, yearly).  
- Static dashboard showing charts and summary tables.  
- Email notification when defined usage thresholds are breached (optional).  
- Fully free to host: uses GitHub Actions + GitHub Pages—no external paid infrastructure.

## Tech Stack  
- Backend: Python 3.10+ (`fetch_usage.py`)  
- Frontend: HTML/CSS/JS + Chart.js  
- Hosting: GitHub Pages (static site)  
- Automation: GitHub Actions for scheduled fetch and commit  
- Configuration: `config.yaml` for schedule/thresholds/metrics  
- Storage: JSON file (`data/usage_history.json`) in repo

## Setup (local + initial push)  
### Prerequisites  
- Python 3.10+  
- Git + GitHub account  
- Personal Access Token (classic) with `user` scope  
- VS Code or your preferred editor

### Steps  
1. Clone the repo:  
   ```shell
   git clone https://github.com/krishnaharshap/custom-gh-billing-ui.git
   cd custom-gh-billing-ui
