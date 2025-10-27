// site/assets/js/dashboard.js
// Handles loading usage_history.json and rendering charts with Chart.js

document.addEventListener("DOMContentLoaded", () => {
  const dataUrl = '../data/usage_history.json';

  fetch(dataUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(history => {
      // Sort history by timestamp just in case
      history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      const labels = history.map(item => new Date(item.timestamp).toLocaleDateString());
      const actionsData = history.map(item => (item.actions?.total_minutes_used) || 0);
      const packagesData = history.map(item => (item.packages?.total_gigabytes_used) || 0);
      const sharedStorageData = history.map(item => (item.shared_storage?.total_gigabytes_used) || 0);

      // Chart for Actions Minutes Used
      const ctxActions = document.getElementById('chartActions').getContext('2d');
      new Chart(ctxActions, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Actions Minutes Used',
              data: actionsData,
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              fill: false,
              tension: 0.1
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'GitHub Actions Minutes Usage Over Time'
            },
            legend: {
              display: true
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Date'
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Minutes'
              }
            }
          }
        }
      });

      // Chart for Packages Storage
      const ctxPackages = document.getElementById('chartPackages').getContext('2d');
      new Chart(ctxPackages, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Packages Storage (GB)',
              data: packagesData,
              borderColor: 'rgba(153, 102, 255, 1)',
              backgroundColor: 'rgba(153, 102, 255, 0.2)',
              fill: false,
              tension: 0.1
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'GitHub Packages Storage Usage Over Time'
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Date'
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'GB'
              }
            }
          }
        }
      });

      // Chart for Shared Storage
      const ctxShared = document.getElementById('chartShared').getContext('2d');
      new Chart(ctxShared, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Shared Storage (GB)',
              data: sharedStorageData,
              borderColor: 'rgba(255, 159, 64, 1)',
              backgroundColor: 'rgba(255, 159, 64, 0.2)',
              fill: false,
              tension: 0.1
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'GitHub Shared Storage Usage Over Time'
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Date'
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'GB'
              }
            }
          }
        }
      });

      // Populate table of history
      const tbody = document.getElementById('usageTable').querySelector('tbody');
      history.forEach(item => {
        const tr = document.createElement('tr');
        const dateStr = new Date(item.timestamp).toLocaleDateString();
        const actionsVal = item.actions?.total_minutes_used ?? 'N/A';
        const packagesVal = item.packages?.total_gigabytes_used ?? 'N/A';
        const sharedVal = item.shared_storage?.total_gigabytes_used ?? 'N/A';
        tr.innerHTML = `<td>${dateStr}</td><td>${actionsVal}</td><td>${packagesVal}</td><td>${sharedVal}</td>`;
        tbody.appendChild(tr);
      });

    })
    .catch(err => {
      console.error('Failed to load usage data:', err);
      const container = document.getElementById('dashboardContainer');
      container.innerHTML = '<p style="color:red;">Error loading usage data. See console for details.</p>';
    });
});
