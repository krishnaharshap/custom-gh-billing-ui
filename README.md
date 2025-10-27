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

2. Create and activate Python virtual environment:
		```bash
		python -m venv venv
		source venv/bin/activate        # Unix/mac  
		venv\Scripts\activate           # Windows
		
3. Install required dependencies (if any):
		```shell
		pip install -r requirements.txt

4. Create GitHub secret: go to your repo → Settings → Secrets → New repository secret named GITHUB_PAT (value = your token).

5. Edit config.yaml to set your schedule (weekly/daily), email address (krishnaharshap11@gmail.com), thresholds, metrics enabled.

6. Commit changes and push to GitHub. The GitHub Actions workflow (.github/workflows/fetch_usage.yml) will run at the next scheduled time.

## Branching & Data Storage

* All code resides on main.
* Historical usage data is appended to data/usage_history.json.
* Sensitive data (PAT) is never committed; use GitHub Secrets.
* When you are ready to publish, switch visibility to Public.

## Dashboard Usage

* Visit the GitHub Pages site (e.g., https://krishnaharshap.github.io/custom-gh-billing-ui/).
* Charts will show usage trends per metric; you can toggle timeframe (month/year).
* Configure thresholds in config.yaml to receive email alerts via webhook when usage exceeds limits.

## QA & Testing

* Unit tests (optional) for fetch_usage.py to mock API responses and ensure JSON schema integrity.
* Integration test: trigger workflow manually, inspect commit, validate front-end renders charts properly.
* Validate GitHub API responses for each metric endpoint (Actions, Packages, Shared Storage).
* Review GitHub Actions run logs to ensure no errors/failures.
* Validate no sensitive data (tokens/API keys) appear in logs or code.

## Future Enhancements (v2+)

* Add Copilot usage and other subscription billing (when you move to paid plan).
* Support daily schedule and customizable timeframe.
* More granular breakdown (by repo/user) if API allows.
* Alerts via gmail notifications.
* Export data to CSV/PDF.
* Dark mode for dashboard, mobile responsive UI.

## Known Limitations

* The GitHub billing API for user accounts returns summarized data only, not detailed breakdown by workflow or repo. 
* GitHub Action minutes and storage usage are tracked, but free quota may mean “paid usage” remains zero until premium usage begins.
* GitHub Pages is static: no server-side processing beyond what the fetch script commits.
* If you scale to many metrics or very frequent runs, consider external storage or database.

## License

MIT License

## Contact

If you have questions or suggestions, please open an Issue in this repo or reach out to krishnaharshap11@gmail.com.


---

## Proposed Folder Structure  


custom-gh-billing-ui/
├── .github/
│ └── workflows/
│ └── fetch_usage.yml
├── data/
│ └── usage_history.json
├── src/
│ └── fetch_usage.py
├── docs/ ← static assets for dashboard (or use docs/)
│ ├── index.html
│ ├── assets/
│ │ ├── chart.js (or CDN)
│ │ ├── dashboard.js
│ └── css/
│ └── styles.css
├── config.yaml
├── requirements.txt
├── README.md
└── .gitignore


---

## Windows PowerShell Script (for local VS Code setup)  
You can save this as e.g., `setup-repo.ps1` and run in PowerShell.  
```powershell
# setup-repo.ps1

param(
    [string]$repoName = "custom-gh-billing-ui",
    [string]$userName = "krishnaharshap"
)

Write-Host "Initializing project local repo: $repoName for user $userName"

# Create folder and cd
New-Item -ItemType Directory -Name $repoName
Set-Location $repoName

# Initialise Git
git init
Write-Host "Git repo initialised."

# Create virtual environment
python -m venv venv
Write-Host "Virtual environment created."

# Create standard folders
New-Item -ItemType Directory -Name "data"
New-Item -ItemType Directory -Name "src"
New-Item -ItemType Directory -Name "docs\assets\css" ․OutVariable _

# Create config file
@"
schedule: "0 3 * * 0"           # Sunday, 03:00 local (Calgary)
email: "krishnaharshap11@gmail.com"
thresholds:
  actions_minutes: 1000
  packages_storage_gb: 5
  shared_storage_gb: 5
metrics:
  - actions
  - packages
  - shared_storage
"@ | Out-File -FilePath config.yaml -Encoding UTF8
Write-Host "config.yaml created."

# Create requirements file
"requests==2.30.0
PyYAML==6.0" | Out-File -FilePath requirements.txt -Encoding UTF8
Write-Host "requirements.txt created."

# Create stub Python script
@"
#!/usr/bin/env python3
\"\"\"fetch_usage.py – fetch billing metrics from GitHub API\"\"\"

import os
import requests
import yaml
import json
import datetime

def load_config():
    with open('config.yaml', 'r') as f:
        return yaml.safe_load(f)

def main():
    cfg = load_config()
    username = '$userName'
    token = os.getenv('GITHUB_PAT')
    headers = {
        'Authorization': f'Bearer {token}',
        'Accept': 'application/vnd.github+json'
    }
    # Example endpoint: Actions
    url_actions = f'https://api.github.com/users/{username}/settings/billing/actions'
    resp = requests.get(url_actions, headers=headers)
    resp.raise_for_status()
    data_actions = resp.json()
    # Append to JSON usage history
    usage_file = 'data/usage_history.json'
    record = {
        'timestamp': datetime.datetime.utcnow().isoformat(),
        'actions': data_actions
    }
    if os.path.exists(usage_file):
        with open(usage_file, 'r') as f:
            history = json.load(f)
    else:
        history = []
    history.append(record)
    with open(usage_file, 'w') as f:
        json.dump(history, f, indent=2)
    print('Usage appended.', record)

if __name__ == '__main__':
    main()
"@ | Out-File -FilePath src/fetch_usage.py -Encoding UTF8
Write-Host "Stub Python script created."

# Create README
@"
# $repoName

See `README.md` for full documentation.
"@ | Out-File -FilePath README.md -Encoding UTF8
Write-Host "README.md placeholder created."

Write-Host "Project skeleton ready. Open in VS Code."
code .
```
