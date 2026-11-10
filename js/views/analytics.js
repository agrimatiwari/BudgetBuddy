/* ==========================================================================
   BudgetBuddy - Smart Spending Insights & Financial Health View
   ========================================================================== */

class AnalyticsView {
  constructor(store) {
    this.store = store;
  }

  render() {
    const container = document.getElementById('view-insights');
    if (!container) return;

    const summary = window.insightsEngine.getFinancialSummary();
    const health = window.insightsEngine.calculateFinancialHealth();
    const insights = window.insightsEngine.generateSmartInsights();

    // Insights Cards
    let insightsHTML = '';
    if (insights.length === 0) {
      insightsHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; padding: 24px;">
          <p class="empty-state-desc">Log a few more transactions across categories to unlock smart insights.</p>
        </div>
      `;
    } else {
      insightsHTML = insights.map(ins => `
        <div class="insight-card type-${ins.type}">
          <div class="insight-icon">${ins.icon}</div>
          <div>
            <h4 class="insight-title">${ins.title}</h4>
            <p class="insight-body">${ins.body}</p>
          </div>
        </div>
      `).join('');
    }

    // Health factors
    const factorsHTML = health.factors.map(f => {
      const pct = (f.score / f.max) * 100;
      let barCol = 'progress-normal';
      if (pct < 50) barCol = 'progress-danger';
      else if (pct < 75) barCol = 'progress-warning';

      return `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 10px;">
          <span style="font-size: 0.84rem; font-weight: 500; color: var(--text-primary); flex: 1.2;">
            ${f.title}
          </span>
          <div style="flex: 1; display: flex; align-items: center; gap: 10px;">
            <div class="progress-bar-track" style="height: 6px; flex: 1;">
              <div class="progress-bar-fill ${barCol}" style="width: ${pct}%;"></div>
            </div>
            <span style="font-family: var(--font-mono); font-size: 0.78rem; font-weight: 700; min-width: 40px; text-align: right;">
              ${f.score}/${f.max}
            </span>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="section-header">
        <div>
          <h2 class="section-title">Smart Spending Insights</h2>
          <p class="section-subtitle">Real-time observations, habits, and financial health derived from your actual spending.</p>
        </div>
      </div>

      <!-- Financial Health Scorecard -->
      <div class="card" style="display: grid; grid-template-columns: 200px 1fr; gap: 24px; align-items: center; margin-bottom: 22px;">
        <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
          <div style="font-size: 2.5rem; font-weight: 800; color: var(--color-primary); font-family: var(--font-mono); line-height: 1;">
            ${health.score}
          </div>
          <div style="font-size: 0.92rem; font-weight: 700; color: ${health.ratingColor}; margin-top: 4px;">
            ${health.rating} Health
          </div>
          <small style="color: var(--text-secondary); font-size: 0.74rem;">Score out of 100</small>
        </div>

        <div>
          <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px;">
            Student Health Factors
          </div>
          ${factorsHTML}
        </div>
      </div>

      <!-- Core 5 Student Insights Grid -->
      <div style="margin-bottom: 14px;">
        <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 14px;">
          💡 Personalized Spending Observations
        </h3>
        <div class="insights-grid">
          ${insightsHTML}
        </div>
      </div>
    `;
  }
}

window.analyticsView = new AnalyticsView(window.appStore);
