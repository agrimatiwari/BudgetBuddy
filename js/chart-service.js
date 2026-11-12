/* ==========================================================================
   BudgetBuddy - Chart.js Configuration & Management Service
   Includes ARIA attributes and screen-reader textual summaries for charts.
   ========================================================================== */

class ChartService {
  constructor(store) {
    this.store = store;
    this.charts = {
      categoryDoughnut: null,
      monthlyTrend: null
    };

    this.categoryColors = {
      'Food & Dining': '#E98778',
      'Transportation': '#729BC4',
      'Academics': '#8174C8',
      'Shopping': '#E8B75D',
      'Entertainment': '#D76C75',
      'Hostel & Living': '#287C72',
      'Personal Care': '#48A878',
      'Other': '#858B96'
    };
  }

  isDarkMode() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  getThemeColors() {
    const isDark = this.isDarkMode();
    return {
      textColor: isDark ? '#B0B8C4' : '#5E6570',
      titleColor: isDark ? '#F1F3F5' : '#252A31',
      gridColor: isDark ? 'rgba(52, 60, 72, 0.4)' : 'rgba(232, 235, 240, 0.8)',
      tooltipBg: isDark ? '#272E39' : '#FFFFFF',
      tooltipText: isDark ? '#F1F3F5' : '#252A31',
      tooltipBorder: isDark ? '#343C48' : '#E8EBF0'
    };
  }

  renderCategoryDoughnut(canvasId, legendContainerId, periodStr = null) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (this.charts.categoryDoughnut) {
      this.charts.categoryDoughnut.destroy();
      this.charts.categoryDoughnut = null;
    }

    const summary = window.insightsEngine.getFinancialSummary(periodStr);
    const catExpenses = summary.categoryExpenses;
    const labels = Object.keys(catExpenses);
    const data = Object.values(catExpenses);
    const colors = labels.map(lbl => this.categoryColors[lbl] || '#858B96');
    const theme = this.getThemeColors();
    const legendContainer = document.getElementById(legendContainerId);

    canvas.setAttribute('role', 'img');

    if (labels.length === 0 || summary.totalExpenses === 0) {
      canvas.setAttribute('aria-label', 'Spending breakdown chart: No expense records for this month yet.');
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (legendContainer) {
        legendContainer.innerHTML = `
          <div class="empty-state" style="padding: 16px 0;">
            <p class="empty-state-desc">No expense records for this month yet.</p>
          </div>
        `;
      }
      return;
    }

    const summaryParts = labels.map((lbl, idx) => {
      const pct = summary.totalExpenses > 0 ? ((data[idx] / summary.totalExpenses) * 100).toFixed(0) : 0;
      return `${lbl}: ${formatINR(data[idx])} (${pct}%)`;
    });
    canvas.setAttribute('aria-label', `Monthly spending breakdown doughnut chart. ${summaryParts.join(', ')}.`);

    this.charts.categoryDoughnut = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: this.isDarkMode() ? '#202630' : '#FFFFFF',
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: theme.tooltipBg,
            titleColor: theme.titleColor,
            bodyColor: theme.textColor,
            borderColor: theme.tooltipBorder,
            borderWidth: 1,
            padding: 8,
            cornerRadius: 6,
            callbacks: {
              label: (context) => {
                const val = context.raw || 0;
                const pct = summary.totalExpenses > 0 ? ((val / summary.totalExpenses) * 100).toFixed(0) : 0;
                return ` ${context.label}: ${formatINR(val)} (${pct}%)`;
              }
            }
          }
        }
      }
    });

    if (legendContainer) {
      legendContainer.innerHTML = labels.map((lbl, idx) => {
        const amt = data[idx];
        const pct = summary.totalExpenses > 0 ? ((amt / summary.totalExpenses) * 100).toFixed(0) : '0';
        return `
          <div class="legend-row">
            <div class="legend-label-wrap">
              <span class="legend-dot" aria-hidden="true" style="background-color: ${colors[idx]}"></span>
              <span style="font-weight: 500;">${escapeHTML(lbl)}</span>
            </div>
            <div class="legend-values">
              <span style="font-weight: 700; color: var(--text-primary);">${formatINR(amt)}</span>
              <span class="legend-pct">${pct}%</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  renderMonthlyTrend(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (this.charts.monthlyTrend) {
      this.charts.monthlyTrend.destroy();
      this.charts.monthlyTrend = null;
    }

    const allTx = this.store.getTransactions();
    const theme = this.getThemeColors();
    const now = new Date();

    const labels = [];
    const incomeData = [];
    const expenseData = [];

    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const periodStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      labels.push(d.toLocaleDateString('en-IN', { month: 'short' }));

      const monthTx = allTx.filter(t => t.date && t.date.startsWith(periodStr));
      let incPaise = 0;
      let expPaise = 0;
      monthTx.forEach(t => {
        if (t.type === 'income') incPaise += toPaise(t.amount);
        if (t.type === 'expense') expPaise += toPaise(t.amount);
      });
      incomeData.push(fromPaise(incPaise));
      expenseData.push(fromPaise(expPaise));
    }

    const ariaText = labels.map((m, idx) =>
      `${m}: Income ${formatINR(incomeData[idx])}, Expenses ${formatINR(expenseData[idx])}`
    ).join('; ');
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', `5-month income versus expense trend bar chart. ${ariaText}.`);

    const incomeColor = this.isDarkMode() ? '#59C58E' : '#2E8B57';
    const expenseColor = this.isDarkMode() ? '#E98791' : '#D9534F';

    this.charts.monthlyTrend = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Income',
            data: incomeData,
            backgroundColor: incomeColor,
            borderRadius: 5,
            barThickness: 14,
            maxBarThickness: 18
          },
          {
            label: 'Expenses',
            data: expenseData,
            backgroundColor: expenseColor,
            borderRadius: 5,
            barThickness: 14,
            maxBarThickness: 18
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              color: theme.textColor,
              usePointStyle: true,
              boxWidth: 6,
              padding: 12,
              font: { family: 'inherit', size: 11, weight: 600 }
            }
          },
          tooltip: {
            backgroundColor: theme.tooltipBg,
            titleColor: theme.titleColor,
            bodyColor: theme.textColor,
            borderColor: theme.tooltipBorder,
            borderWidth: 1,
            padding: 8,
            cornerRadius: 6,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${formatINR(ctx.raw)}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: theme.textColor, font: { family: 'inherit', size: 11 } },
            border: { display: false }
          },
          y: {
            grid: { color: theme.gridColor },
            ticks: {
              color: theme.textColor,
              font: { family: 'inherit', size: 10 },
              callback: (val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`
            },
            border: { display: false }
          }
        }
      }
    });
  }

  refreshThemes() {
    if (this.charts.categoryDoughnut) {
      this.renderCategoryDoughnut('dashboardDoughnutChart', 'dashboardCompactLegend');
    }
    if (this.charts.monthlyTrend) {
      this.renderMonthlyTrend('dashboardTrendChart');
    }
  }
}

window.chartService = new ChartService(window.appStore);
