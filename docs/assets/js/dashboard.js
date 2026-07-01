const GITHUB_USER = 'krishnaharshap';

const LANG_COLORS = {
  Java: '#b07219', Python: '#3572A5', JavaScript: '#f1e05a',
  TypeScript: '#2b7489', HTML: '#e34c26', CSS: '#563d7c',
  Shell: '#89e051', Go: '#00ADD8', Rust: '#dea584',
  Kotlin: '#A97BFF', Ruby: '#701516', 'C#': '#178600',
  'C++': '#f34b7d', Swift: '#F05138',
};

const FALLBACK_COLOR = '#8b949e';

function langColor(lang) {
  return LANG_COLORS[lang] || FALLBACK_COLOR;
}

Chart.defaults.color = '#8b949e';
Chart.defaults.borderColor = '#21262d';
Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
Chart.defaults.font.size = 11;

const BASE_CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: '#161b22', borderColor: '#30363d', borderWidth: 1, titleColor: '#e6edf3', bodyColor: '#8b949e' } },
};

// ── Profile + repo stats (GitHub public API, no auth required) ──────────────

async function loadRepoStats() {
  try {
    const [profileRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${GITHUB_USER}`),
      fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`),
    ]);

    if (!profileRes.ok) throw new Error(`Profile API ${profileRes.status}`);
    if (!reposRes.ok) throw new Error(`Repos API ${reposRes.status}`);

    const profile = await profileRes.json();
    const repos = await reposRes.json();

    renderProfile(profile);
    renderKPI(repos);
    renderLangChart(repos);
    renderTopReposChart(repos);
    renderReposTable(repos);
  } catch (err) {
    console.error('GitHub API error:', err);
    document.getElementById('kpiRow').innerHTML =
      `<p style="color:#f85149;padding:.75rem;font-size:.85rem">Live GitHub data unavailable (${err.message}). Rate limit may apply — try refreshing in a minute.</p>`;
    document.getElementById('reposTableBody').innerHTML =
      '<tr><td colspan="5" class="loading-row" style="color:#f85149">Could not load repositories.</td></tr>';
  }
}

function renderProfile(p) {
  const avatar = document.getElementById('avatar');
  avatar.src = p.avatar_url;
  avatar.alt = p.login + ' avatar';

  document.getElementById('display-name').textContent = p.name || p.login;
  document.getElementById('bio').textContent = p.bio || '';

  document.getElementById('followers-count').innerHTML = `<strong>${p.followers}</strong> followers`;
  document.getElementById('following-count').innerHTML = `<strong>${p.following}</strong> following`;
}

function renderKPI(repos) {
  const stars = repos.reduce((s, r) => s + r.stargazers_count, 0);
  const forks = repos.reduce((s, r) => s + r.forks_count, 0);
  const langs = new Set(repos.map(r => r.language).filter(Boolean));

  document.querySelector('#kpi-repos .kpi-value').textContent = repos.length;
  document.querySelector('#kpi-stars .kpi-value').textContent = stars;
  document.querySelector('#kpi-forks .kpi-value').textContent = forks;
  document.querySelector('#kpi-langs .kpi-value').textContent = langs.size;
}

function renderLangChart(repos) {
  const counts = {};
  repos.forEach(r => { if (r.language) counts[r.language] = (counts[r.language] || 0) + 1; });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const labels = sorted.map(([l]) => l);
  const data = sorted.map(([, n]) => n);
  const colors = labels.map(langColor);

  new Chart(document.getElementById('chartLangs'), {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: '#161b22', borderWidth: 2, hoverOffset: 4 }] },
    options: {
      ...BASE_CHART_OPTS,
      plugins: {
        ...BASE_CHART_OPTS.plugins,
        legend: {
          display: true,
          position: 'right',
          labels: { color: '#8b949e', boxWidth: 10, padding: 8, font: { size: 11 } },
        },
      },
    },
  });
}

function renderTopReposChart(repos) {
  const top = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 6);
  const labels = top.map(r => r.name);
  const data = top.map(r => r.stargazers_count);
  const colors = top.map(r => langColor(r.language));

  new Chart(document.getElementById('chartTopRepos'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors, borderRadius: 4, borderSkipped: false }],
    },
    options: {
      ...BASE_CHART_OPTS,
      indexAxis: 'y',
      scales: {
        x: { ticks: { color: '#6e7681' }, grid: { color: '#21262d' }, beginAtZero: true },
        y: { ticks: { color: '#8b949e' }, grid: { display: false } },
      },
    },
  });
}

function renderReposTable(repos) {
  const sorted = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 10);
  const tbody = document.getElementById('reposTableBody');

  tbody.innerHTML = sorted.map(r => {
    const color = langColor(r.language || '');
    const updated = new Date(r.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const fork = r.fork ? '<span class="fork-badge">(fork)</span>' : '';
    const lang = r.language
      ? `<span class="lang-dot" style="background:${color}"></span>${r.language}`
      : '<span style="color:#6e7681">—</span>';

    return `<tr>
      <td><a href="${r.html_url}" target="_blank" rel="noopener">${r.name}</a>${fork}</td>
      <td>${lang}</td>
      <td>★ ${r.stargazers_count}</td>
      <td>${r.forks_count}</td>
      <td>${updated}</td>
    </tr>`;
  }).join('');
}

// ── Billing history (docs/data/usage_history.json, committed by GH Actions) ─

async function loadBillingData() {
  try {
    const res = await fetch('data/usage_history.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const history = await res.json();
    if (!Array.isArray(history) || history.length === 0) throw new Error('empty');

    history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const labels = history.map(item =>
      new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
    const actionsData = history.map(item => item.actions?.total_minutes_used ?? 0);
    const storageData = history.map(item => item.shared_storage?.total_gigabytes_used ?? 0);

    renderLineChart('chartActions', labels, actionsData, '#388bfd', 'min');
    renderLineChart('chartStorage', labels, storageData, '#f0883e', 'GB');
  } catch (err) {
    console.error('Billing data unavailable:', err);
    document.getElementById('billingCharts').style.display = 'none';
    const errEl = document.getElementById('billing-error');
    errEl.textContent = 'Billing history not yet available. The GitHub Actions workflow will populate this on its next weekly run.';
    errEl.classList.remove('hidden');
  }
}

function renderLineChart(canvasId, labels, data, color, yLabel) {
  new Chart(document.getElementById(canvasId), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data,
        borderColor: color,
        backgroundColor: color + '1a',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointBackgroundColor: color,
        pointBorderColor: '#0d1117',
        pointBorderWidth: 1.5,
      }],
    },
    options: {
      ...BASE_CHART_OPTS,
      scales: {
        x: { ticks: { color: '#6e7681', maxTicksLimit: 9 }, grid: { color: '#21262d' } },
        y: {
          beginAtZero: true,
          ticks: { color: '#6e7681' },
          grid: { color: '#21262d' },
          title: { display: true, text: yLabel, color: '#6e7681', font: { size: 10 } },
        },
      },
    },
  });
}

// ── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  loadRepoStats();
  loadBillingData();
});
