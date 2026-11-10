/* ==========================================================================
   BudgetBuddy - Dashboard View Controller
   Clean, spacious, minimal, and uncluttered fintech dashboard for students
   ========================================================================== */

class DashboardView {
  constructor(store) {
    this.store = store;
  }

  // Clean category icon mapping
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

    const summary = window.insightsEngine.getFinancialSummary();
    const userName = this.store.getUserName();
    const selectedPeriod = this.store.getSelectedPeriod();
    const allTx = this.store.getTransactions();
    const budgets = this.store.getBudgets();

    // Time-based greeting
    const hour = new Date().getHours();
    let timeGreeting = 'Good morning';
    if (hour >= 12 && hour < 17) timeGreeting = 'Good afternoon';
    else if (hour >= 17) timeGreeting = 'Good evening';

    // Formatted current date
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    // Populate month options (Current + past 5 months)
    let periodOptions = '';
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      periodOptions += `<option value="${val}" ${val === selectedPeriod ? 'selected' : ''}>${label}</option>`;
    }

    // Latest 5 Transactions (Clean & Minimal)
    const latestFiveTx = [...allTx]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    let recentTxHTML = '';
    if (latestFiveTx.length === 0) {
      recentTxHTML = `
        <tr>
          <td colspan="4" class="empty-state">
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
                <span class="category-icon-circle" style="background-color: var(--bg-subtle);">
                  ${icon}
                </span>
                <div>
                  <strong style="display: block; font-size: 0.88rem; color: var(--text-primary);">${tx.title}</strong>
                  <small style="color: var(--text-secondary); font-size: 0.74rem;">${tx.category}</small>
                </div>
              </div>
            </td>
            <td style="color: var(--text-secondary); font-size: 0.82rem;">${tx.date}</td>
            <td class="amount-cell ${amtClass}">
              ${sign}${formatINR(tx.amount)}
            </td>
          </tr>
        `;
      }).join('');
    }

    // Monthly Budget Progress (Overall + Top 3 Categories)
    const overallBudget = Number(budgets.overallMonthly) || 0;
    const spent = summary.totalExpenses;
    const overallPct = overallBudget > 0 ? Math.min(100, (spent / overallBudget) * 100) : 0;
    let overallBarClass = 'progress-normal';
    if (overallPct >= 100) overallBarClass = 'progress-danger';
    else if (overallPct >= 80) overallBarClass = 'progress-warning';

    const categoryEntries = Object.entries(budgets.categories || {}).slice(0, 3);
    const categoryBarsHTML = categoryEntries.map(([cat, limit]) => {
      const catSpent = summary.categoryExpenses[cat] || 0;
      const catPct = limit > 0 ? Math.min(100, (catSpent / limit) * 100) : 0;
      let barCol = 'progress-normal';
      if (catPct >= 100) barCol = 'progress-danger';
      else if (catPct >= 80) barCol = 'progress-warning';

      return `
        <div class="progress-container">
          <div class="progress-header">
            <span class="progress-label">${cat}</span>
            <span class="progress-meta">${formatINR(catSpent)} of ${formatINR(limit)} (${catPct.toFixed(0)}%)</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill ${barCol}" style="width: ${catPct}%;"></div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <!-- 1. Top Section -->
      <section class="dashboard-top-bar">
        <div class="dashboard-greeting-group">
          <h1>${timeGreeting}, ${userName}! 👋</h1>
          <p class="dashboard-date-text">${dateFormatted}</p>
        </div>
        <div class="dashboard-actions">
          <div class="month-selector">
            <span style="font-size: 0.82rem; color: var(--text-secondary);">Month:</span>
            <select id="dashboardPeriodSelect" onchange="window.appController.changePeriod(this.value)">
              ${periodOptions}
            </select>
          </div>
          <button class="btn btn-primary" onclick="window.appController.openAddTransactionModal()">
            <span>+</span> Add Transaction
          </button>
        </div>
      </section>

      <!-- 2. Financial Overview (4 Clean Summary Cards) -->
      <section class="summary-cards-grid">
        <!-- 1. Total Balance -->
        <div class="summary-card card-balance">
          <div class="summary-header">
            <span class="summary-label">Total Balance</span>
            <div class="summary-icon">💳</div>
          </div>
          <div class="summary-amount">${formatINR(summary.availableBalance)}</div>
          <div class="summary-subtext">Current available savings</div>
        </div>

        <!-- 2. Total Income -->
        <div class="summary-card card-income">
          <div class="summary-header">
            <span class="summary-label">Total Income</span>
            <div class="summary-icon">📈</div>
          </div>
          <div class="summary-amount" style="color: var(--color-success-text);">${formatINR(summary.totalIncome)}</div>
          <div class="summary-subtext">Received this month</div>
        </div>

        <!-- 3. Total Expenses -->
        <div class="summary-card card-expenses">
          <div class="summary-header">
            <span class="summary-label">Total Expenses</span>
            <div class="summary-icon">📉</div>
          </div>
          <div class="summary-amount" style="color: var(--color-accent-text);">${formatINR(summary.totalExpenses)}</div>
          <div class="summary-subtext">Spent this month</div>
        </div>

        <!-- 4. Remaining Budget -->
        <div class="summary-card card-budget">
          <div class="summary-header">
            <span class="summary-label">Remaining Budget</span>
            <div class="summary-icon">🎯</div>
          </div>
          <div class="summary-amount">${formatINR(summary.remainingBudget)}</div>
          <div class="summary-subtext">Of ${formatINR(overallBudget)} limit</div>
        </div>
      </section>

      <!-- 3. Main Dashboard Layout (Two-Column: Spending Breakdown + Recent Transactions) -->
      <section class="dashboard-middle-grid">
        <!-- Left: Spending Breakdown -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>🍩</span> Spending Breakdown
            </div>
            <span style="font-size: 0.78rem; color: var(--text-secondary);">This Month</span>
          </div>
          <div class="breakdown-body">
            <div class="doughnut-wrapper">
              <canvas id="dashboardDoughnutChart"></canvas>
            </div>
            <div class="compact-legend" id="dashboardCompactLegend"></div>
          </div>
        </div>

        <!-- Right: Recent Transactions -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>🕒</span> Recent Transactions
            </div>
            <a class="card-action" onclick="window.appRouter.navigateTo('transactions')">
              View All (${allTx.length}) →
            </a>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Date</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${recentTxHTML}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- 4. Bottom Section (Compact Trend + Budget Progress) -->
      <section class="dashboard-bottom-grid">
        <!-- Monthly Spending Trend Chart -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>📊</span> Monthly Spending Trend
            </div>
            <span style="font-size: 0.78rem; color: var(--text-secondary);">Income vs Expense</span>
          </div>
          <div class="chart-compact-wrapper">
            <canvas id="dashboardTrendChart"></canvas>
          </div>
        </div>

        <!-- Monthly Budget Progress -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>⚡</span> Monthly Budget Progress
            </div>
            <a class="card-action" onclick="window.appRouter.navigateTo('budgets')">Manage →</a>
          </div>

          <!-- Overall Limit -->
          <div class="progress-container" style="margin-bottom: 16px;">
            <div class="progress-header">
              <span class="progress-label" style="font-size: 0.9rem;">Overall Monthly Budget</span>
              <span class="progress-meta" style="font-weight: 700; color: var(--text-primary);">
                ${formatINR(spent)} / ${formatINR(overallBudget)} (${overallPct.toFixed(0)}%)
              </span>
            </div>
            <div class="progress-bar-track" style="height: 10px;">
              <div class="progress-bar-fill ${overallBarClass}" style="width: ${overallPct}%;"></div>
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
      window.chartService.renderCategoryDoughnut('dashboardDoughnutChart', 'dashboardCompactLegend', selectedPeriod);
      window.chartService.renderMonthlyTrend('dashboardTrendChart');
    }, 40);
  }
}

window.dashboardView = new DashboardView(window.appStore);
