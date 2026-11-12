/* ==========================================================================
   BudgetBuddy - Dashboard View Controller
   Clean, spacious, accessible fintech dashboard for students
   ========================================================================== */

class DashboardView {
  constructor(store) {
    this.store = store;
  }

  static getCategoryIcon(category) {
    const map = {
      'Food & Dining': '🍔',
      'Transportation': '🚌',
      'Academics': '📚',
      'Shopping': '🛍️',
      'Entertainment': '🎬',
      'Hostel & Living': '🏠',
      'Personal Care': '✨',
      'Other': '📦',
      'Monthly Pocket Money': '💰',
      'Allowance from Parents': '🎁',
      'Scholarship': '🎓',
      'Part-time Work': '💼',
      'Freelancing': '💻'
    };
    return map[category] || '💵';
  }

  render() {
    const container = document.getElementById('view-dashboard');
    if (!container) return;

    const selectedPeriod = this.store.getSelectedPeriod();
    const summary = window.insightsEngine.getFinancialSummary(selectedPeriod);
    const userName = this.store.getUserName();
    const allTx = this.store.getTransactions();
    const budgets = this.store.getBudgets(selectedPeriod);

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    let periodOptions = '';
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      periodOptions += `<option value="${val}" ${val === selectedPeriod ? 'selected' : ''}>${escapeHTML(label)}</option>`;
    }

    const latestFiveTx = [...allTx]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    let recentTxHTML = '';
    if (latestFiveTx.length === 0) {
      recentTxHTML = `
        <tr>
          <td colspan="3" class="empty-state">
            <p class="empty-state-desc">No transactions logged yet. Click "+ Add Transaction" to start.</p>
          </td>
        </tr>
      `;
    } else {
      recentTxHTML = latestFiveTx.map(tx => {
        const isIncome = tx.type === 'income';
        const icon = DashboardView.getCategoryIcon(tx.category);
        const sign = isIncome ? '+' : '-';
        const amtClass = isIncome ? 'amount-income' : 'amount-expense';

        return `
          <tr>
            <td>
              <div class="category-pill">
                <span class="category-icon-circle" aria-hidden="true" style="background-color: var(--bg-subtle);">
                  ${icon}
                </span>
                <div>
                  <strong style="display: block; font-size: 0.88rem; color: var(--text-primary);">${escapeHTML(tx.title)}</strong>
                  <small style="color: var(--text-secondary); font-size: 0.74rem;">${escapeHTML(tx.category)}</small>
                </div>
              </div>
            </td>
            <td style="color: var(--text-secondary); font-size: 0.82rem;">${escapeHTML(tx.date)}</td>
            <td class="amount-cell ${amtClass}">
              ${sign}${formatINR(tx.amount)}
            </td>
          </tr>
        `;
      }).join('');
    }

    const overallBudget = Number(budgets.overallMonthly) || 0;
    const spent = summary.totalExpenses;
    const rawOverallPct = overallBudget > 0 ? (toPaise(spent) / toPaise(overallBudget)) * 100 : 0;
    const clampedOverallPct = Math.min(100, rawOverallPct);

    let overallBarClass = 'progress-normal';
    let overallStatusText = 'Within budget';
    if (rawOverallPct > 100) {
      overallBarClass = 'progress-danger';
      overallStatusText = 'Exceeded';
    } else if (rawOverallPct >= 80) {
      overallBarClass = 'progress-warning';
      overallStatusText = 'Near limit';
    }

    const categoryEntries = Object.entries(budgets.categories || {}).slice(0, 3);
    const categoryBarsHTML = categoryEntries.map(([cat, limit]) => {
      const catSpent = summary.categoryExpenses[cat] || 0;
      const rawCatPct = limit > 0 ? (toPaise(catSpent) / toPaise(limit)) * 100 : 0;
      const clampedCatPct = Math.min(100, rawCatPct);

      let barCol = 'progress-normal';
      let statusIcon = '';
      if (rawCatPct > 100) {
        barCol = 'progress-danger';
        statusIcon = '🚨 ';
      } else if (rawCatPct >= 80) {
        barCol = 'progress-warning';
        statusIcon = '⚠️ ';
      }

      const safeCat = escapeHTML(cat);
      return `
        <div class="progress-container">
          <div class="progress-header">
            <span class="progress-label">${statusIcon}${safeCat}</span>
            <span class="progress-meta">${formatINR(catSpent)} of ${formatINR(limit)} (${rawCatPct.toFixed(0)}%)</span>
          </div>
          <div class="progress-bar-track" role="progressbar" aria-label="${safeCat} budget progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(clampedCatPct)}">
            <div class="progress-bar-fill ${barCol}" style="width: ${clampedCatPct}%;"></div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <section class="dashboard-top-bar" aria-label="Dashboard Header">
        <div class="dashboard-greeting-group">
          <h1>Hello, ${escapeHTML(userName)}! <span aria-hidden="true">👋</span></h1>
          <p class="dashboard-date-text">${escapeHTML(dateFormatted)}</p>
        </div>
        <div class="dashboard-actions">
          <div class="month-selector">
            <label for="dashboardPeriodSelect" style="font-size: 0.82rem; color: var(--text-secondary);">Month:</label>
            <select id="dashboardPeriodSelect" onchange="window.appController.changePeriod(this.value)">
              ${periodOptions}
            </select>
          </div>
          <button type="button" class="btn btn-primary" onclick="window.appController.openAddTransactionModal()">
            <span aria-hidden="true">+</span> Add Transaction
          </button>
        </div>
      </section>

      <section class="summary-cards-grid" aria-label="Financial Overview">
        <div class="summary-card card-balance">
          <div class="summary-header">
            <span class="summary-label">Total Balance</span>
            <div class="summary-icon" aria-hidden="true">💳</div>
          </div>
          <div class="summary-amount">${formatINR(summary.availableBalance)}</div>
          <div class="summary-subtext">Current available savings</div>
        </div>

        <div class="summary-card card-income">
          <div class="summary-header">
            <span class="summary-label">Total Income</span>
            <div class="summary-icon" aria-hidden="true">📈</div>
          </div>
          <div class="summary-amount" style="color: var(--color-success-text);">${formatINR(summary.totalIncome)}</div>
          <div class="summary-subtext">Received this month</div>
        </div>

        <div class="summary-card card-expenses">
          <div class="summary-header">
            <span class="summary-label">Total Expenses</span>
            <div class="summary-icon" aria-hidden="true">📉</div>
          </div>
          <div class="summary-amount" style="color: var(--color-accent-text);">${formatINR(summary.totalExpenses)}</div>
          <div class="summary-subtext">Spent this month</div>
        </div>

        <div class="summary-card card-budget">
          <div class="summary-header">
            <span class="summary-label">Remaining Budget</span>
            <div class="summary-icon" aria-hidden="true">🎯</div>
          </div>
          <div class="summary-amount">${formatINR(summary.remainingBudget)}</div>
          <div class="summary-subtext">Of ${formatINR(overallBudget)} limit</div>
        </div>
      </section>

      <section class="dashboard-middle-grid" aria-label="Spending Breakdown and Recent Transactions">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">
              <span aria-hidden="true">🍩</span> Spending Breakdown
            </h2>
            <span style="font-size: 0.78rem; color: var(--text-secondary);">${escapeHTML(selectedPeriod)}</span>
          </div>
          <div class="breakdown-body">
            <div class="doughnut-wrapper">
              <canvas id="dashboardDoughnutChart"></canvas>
            </div>
            <div class="compact-legend" id="dashboardCompactLegend"></div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h2 class="card-title">
              <span aria-hidden="true">🕒</span> Recent Transactions
            </h2>
            <a href="#transactions" class="card-action" onclick="window.appRouter.navigateTo('transactions')">
              View All (${allTx.length}) →
            </a>
          </div>
          <div class="table-responsive">
            <table class="data-table" aria-label="Recent 5 transactions">
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Date</th>
                  <th scope="col" style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${recentTxHTML}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="dashboard-bottom-grid" aria-label="Monthly Trend and Budget Progress">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">
              <span aria-hidden="true">📊</span> Monthly Spending Trend
            </h2>
            <span style="font-size: 0.78rem; color: var(--text-secondary);">Income vs Expense</span>
          </div>
          <div class="chart-compact-wrapper">
            <canvas id="dashboardTrendChart"></canvas>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h2 class="card-title">
              <span aria-hidden="true">⚡</span> Monthly Budget Progress
            </h2>
            <a href="#budgets" class="card-action" onclick="window.appRouter.navigateTo('budgets')">Manage →</a>
          </div>

          <div class="progress-container" style="margin-bottom: 16px;">
            <div class="progress-header">
              <span class="progress-label" style="font-size: 0.9rem;">Overall Monthly Budget (${overallStatusText})</span>
              <span class="progress-meta" style="font-weight: 700; color: var(--text-primary);">
                ${formatINR(spent)} / ${formatINR(overallBudget)} (${rawOverallPct.toFixed(0)}%)
              </span>
            </div>
            <div class="progress-bar-track" style="height: 10px;" role="progressbar" aria-label="Overall monthly budget" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(clampedOverallPct)}">
              <div class="progress-bar-fill ${overallBarClass}" style="width: ${clampedOverallPct}%;"></div>
            </div>
          </div>

          <div style="font-size: 0.76rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.04em;">
            Top Category Limits
          </div>
          <div class="budget-meters-list">
            ${categoryBarsHTML}
          </div>
        </div>
      </section>
    `;

    setTimeout(() => {
      window.chartService?.renderCategoryDoughnut('dashboardDoughnutChart', 'dashboardCompactLegend', selectedPeriod);
      window.chartService?.renderMonthlyTrend('dashboardTrendChart');
    }, 40);
  }
}

window.dashboardView = new DashboardView(window.appStore);
