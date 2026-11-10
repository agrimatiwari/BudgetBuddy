/* ==========================================================================
   BudgetBuddy - Chart.js Configuration & Management Service
   Compact, readable charts adapted for Light/Dark themes and Indian Rupee format
   ========================================================================== */

class ChartService {
  constructor(store) {
    this.store = store;
    this.charts = {
      categoryDoughnut: null,
      monthlyTrend: null
    };

    // Category Colors Mapped to College Student Categories
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
      textColor: isDark ? '#A0A8B4' : '#858B96',
      titleColor: isDark ? '#F1F3F5' : '#252A31',
      gridColor: isDark ? 'rgba(52, 60, 72, 0.4)' : 'rgba(232, 235, 240, 0.8)',
      tooltipBg: isDark ? '#272E39' : '#FFFFFF',
      tooltipText: isDark ? '#F1F3F5' : '#252A31',
      tooltipBorder: isDark ? '#343C48' : '#E8EBF0'
    };
  }

  // 1. Spending Breakdown Doughnut Chart (Compact & Clean)
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

    if (labels.length === 0 || summary.totalExpenses === 0) {
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

    this.charts.categoryDoughnut = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
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

    // Populate clean, compact legend with category names, percentages and amounts
    if (legendContainer) {
      legendContainer.innerHTML = labels.map((lbl, idx) => {
        const amt = data[idx];
        const pct = summary.totalExpenses > 0 ? ((amt / summary.totalExpenses) * 100).toFixed(0) : '0';
        return `
          <div class="legend-row">
            <div class="legend-label-wrap">
              <span class="legend-dot" style="background-color: ${colors[idx]}"></span>
              <span style="font-weight: 500;">${lbl}</span>
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

  // 2. Monthly Spending Trend Chart (Compact & Calm)
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

    // Last 5 months for clean readability
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const periodStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      labels.push(d.toLocaleDateString(undefined, { month: 'short' }));

      const monthTx = allTx.filter(t => t.date && t.date.startsWith(periodStr));
      let inc = 0;
      let exp = 0;
      monthTx.forEach(t => {
        if (t.type === 'income') inc += Number(t.amount);
        if (t.type === 'expense') exp += Number(t.amount);
      });
      incomeData.push(inc);
      expenseData.push(exp);
    }

    const incomeColor = this.isDarkMode() ? '#59C58E' : '#48A878';
    const expenseColor = this.isDarkMode() ? '#E98791' : '#E98778';

    this.charts.monthlyTrend = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
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

// Global Chart Service Instance
window.chartService = new ChartService(window.appStore);
