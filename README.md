# custom-gh-billing-ui

A personal GitHub monitoring dashboard hosted on GitHub Pages. Pulls live profile and repository stats from the public GitHub API, and tracks weekly billing usage via a scheduled GitHub Actions workflow.

**Live site:** https://krishnaharshap.github.io/custom-gh-billing-ui/

## What it shows

- Profile header with avatar, bio, and follower counts
- KPI cards: public repo count, total stars, forks, and languages used
- Language breakdown chart and top repos by stars (live, no token required)
- Repo table with language, stars, forks, and last-updated date
- Billing history charts: Actions minutes and shared storage (updated weekly)

## Tech stack

| Layer | Tool |
|---|---|
| Frontend | HTML / CSS / Chart.js |
| Data (repos) | GitHub public API — fetched client-side |
| Data (billing) | Python + GitHub REST API → `docs/data/usage_history.json` |
| Automation | GitHub Actions (weekly cron) |
| Hosting | GitHub Pages (served from `docs/`) |

## Project structure

```
custom-gh-billing-ui/
├── .github/workflows/fetch_usage.yml   # weekly billing fetch + commit
├── docs/                               # GitHub Pages root
│   ├── index.html
│   ├── data/usage_history.json         # billing history (committed by workflow)
│   └── assets/
│       ├── css/styles.css
│       └── js/dashboard.js
├── src/fetch_usage.py                  # billing data fetcher
├── config.yaml                         # schedule, thresholds, metrics
└── requirements.txt
```

## Setup

**1. Clone and install dependencies**

```bash
git clone https://github.com/krishnaharshap/custom-gh-billing-ui.git
cd custom-gh-billing-ui
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**2. Add GitHub secret**

Go to repo → Settings → Secrets and variables → Actions → New repository secret:

- Name: `GH_BILLING_PAT`
- Value: a **fine-grained personal access token** with these permissions only:
  - Repository permissions: `Actions → Read-only` (to read workflow run data)
  - Repository permissions: `Metadata → Read-only` (implicit, for repo listing)
  - No billing permissions needed — the old billing API was removed by GitHub (410 Gone).
  The script now derives CI minutes from workflow run durations and storage from repo sizes.

**3. Enable GitHub Pages**

Go to repo → Settings → Pages → Source: `Deploy from a branch` → Branch: `main` → Folder: `/docs`

**4. Push and let the workflow run**

The workflow (`fetch_usage.yml`) runs every Sunday at 03:00 UTC and can also be triggered manually from the Actions tab. It fetches billing data, appends to `docs/data/usage_history.json`, and commits the result back to `main`.

## Local preview

Serve the `docs/` folder with any static file server:

```bash
npx serve docs
```

## Configuration

Edit `config.yaml` to adjust the cron schedule, alert thresholds, and which metrics to collect:

```yaml
schedule: "0 3 * * 0"       # cron for the GitHub Actions workflow
thresholds:
  actions_minutes: 1000
  shared_storage_gb: 5
metrics:
  - actions
  - packages
  - shared-storage
```

## License

MIT
