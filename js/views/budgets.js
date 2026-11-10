/* ==========================================================================
   BudgetBuddy - Budget Management View Controller
   ========================================================================== */

class BudgetsView {
  constructor(store) {
    this.store = store;
  }

  render() {
    const container = document.getElementById('view-budgets');
    if (!container) return;

    const summary = window.insightsEngine.getFinancialSummary();
    const budgets = this.store.getBudgets();
    const categoryBudgets = budgets.categories || {};

    const overall = Number(budgets.overallMonthly) || 0;
    const spent = summary.totalExpenses;
    const remaining = Math.max(0, overall - spent);
    const consumedPct = overall > 0 ? (spent / overall) * 100 : 0;

    let overallStatusTag = '';
    let overallProgressColor = 'progress-normal';
    if (consumedPct >= 100) {
      overallStatusTag = `<span class="badge badge-expense">🚨 Budget Exceeded</span>`;
      overallProgressColor = 'progress-danger';
    } else if (consumedPct >= 80) {
      overallStatusTag = `<span class="badge" style="background: var(--color-highlight-bg); color: var(--color-highlight-text);">⚠️ Limit Approaching</span>`;
      overallProgressColor = 'progress-warning';
    } else {
      overallStatusTag = `<span class="badge badge-income">✅ Within Budget</span>`;
      overallProgressColor = 'progress-normal';
    }

    // Category Budget Cards
    const categoryCardsHTML = EXPENSE_CATEGORIES.map(cat => {
      const limit = Number(categoryBudgets[cat]) || 0;
      const catSpent = summary.categoryExpenses[cat] || 0;
      const catRemaining = Math.max(0, limit - catSpent);
      const catPct = limit > 0 ? (catSpent / limit) * 100 : 0;
      const icon = DashboardView.getCategoryIcon(cat);

      let statusBadge = '';
      let barColor = 'progress-normal';
      if (limit === 0) {
        statusBadge = `<span class="badge badge-neutral">No limit set</span>`;
      } else if (catPct >= 100) {
        statusBadge = `<span class="badge badge-expense">Exceeded (+${formatINR(catSpent - limit)})</span>`;
        barColor = 'progress-danger';
      } else if (catPct >= 80) {
        statusBadge = `<span class="badge" style="background: var(--color-highlight-bg); color: var(--color-highlight-text);">${catPct.toFixed(0)}% used</span>`;
        barColor = 'progress-warning';
      } else {
        statusBadge = `<span class="badge badge-income">On Track</span>`;
      }

      return `
        <div class="budget-card">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="category-icon-circle" style="background: var(--bg-subtle);">
                ${icon}
              </span>
              <div>
                <strong style="display: block; font-size: 0.92rem; color: var(--text-primary);">${cat}</strong>
                <small style="color: var(--text-secondary); font-size: 0.74rem;">Budget: ${limit > 0 ? formatINR(limit) : 'Not set'}</small>
              </div>
            </div>
            ${statusBadge}
          </div>

          <div>
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5px;">
              <span style="font-size: 1.25rem; font-weight: 800; font-family: var(--font-mono); color: var(--text-primary);">
                ${formatINR(catSpent)}
              </span>
              <span style="font-size: 0.8rem; color: var(--text-secondary);">
                ${limit > 0 ? `${catPct.toFixed(0)}% spent` : '—'}
              </span>
            </div>

            <div class="progress-bar-track">
              <div class="progress-bar-fill ${barColor}" style="width: ${Math.min(100, catPct)}%;"></div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.76rem; color: var(--text-secondary); margin-top: 8px;">
              <span>Left: <strong>${limit > 0 ? formatINR(catRemaining) : 'N/A'}</strong></span>
              <button class="btn btn-secondary btn-sm" onclick="window.appController.openEditBudgetModal('${cat}', ${limit})">
                Adjust
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="section-header">
        <div>
          <h2 class="section-title">Budget Management</h2>
          <p class="section-subtitle">Set disciplined monthly spending targets to keep your pocket money safe.</p>
        </div>
        <button class="btn btn-primary" onclick="window.appController.openEditOverallBudgetModal(${overall})">
          ⚙️ Set Total Monthly Budget
        </button>
      </div>

      <!-- Hero Monthly Budget Summary Card -->
      <div class="card" style="margin-bottom: 22px; padding: 22px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
          <div>
            <span style="font-size: 0.76rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">
              Total Monthly Spending Limit
            </span>
            <div style="font-size: 2rem; font-weight: 800; color: var(--color-primary); font-family: var(--font-mono);">
              ${formatINR(overall)}
            </div>
          </div>
          <div>${overallStatusTag}</div>
        </div>

        <div class="progress-container" style="margin-bottom: 16px;">
          <div class="progress-header">
            <span class="progress-label">Consumption Status</span>
            <span class="progress-meta" style="font-weight: 700; color: var(--text-primary);">
              ${formatINR(spent)} spent (${consumedPct.toFixed(1)}%) • ${formatINR(remaining)} remaining
            </span>
          </div>
          <div class="progress-bar-track" style="height: 10px;">
            <div class="progress-bar-fill ${overallProgressColor}" style="width: ${Math.min(100, consumedPct)}%;"></div>
          </div>
        </div>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
        <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary);">Category Budgets</h3>
        <span style="font-size: 0.8rem; color: var(--text-secondary);">Click "Adjust" on any category to change limits.</span>
      </div>

      <div class="budgets-grid">
        ${categoryCardsHTML}
      </div>
    `;
  }
}

window.budgetsView = new BudgetsView(window.appStore);
