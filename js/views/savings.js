/* ==========================================================================
   BudgetBuddy - Savings Goals View Controller
   ========================================================================== */

class SavingsView {
  constructor(store) {
    this.store = store;
  }

  render() {
    const container = document.getElementById('view-savings');
    if (!container) return;

    const goals = this.store.getSavingsGoals();

    let totalSavedPaise = 0;
    let totalTargetPaise = 0;
    goals.forEach(g => {
      totalSavedPaise += toPaise(g.savedAmount);
      totalTargetPaise += toPaise(g.targetAmount);
    });

    const totalSavedAll = fromPaise(totalSavedPaise);
    const totalTargetAll = fromPaise(totalTargetPaise);
    const overallPct = totalTargetPaise > 0 ? (totalSavedPaise / totalTargetPaise) * 100 : 0;

    let cardsHTML = '';
    if (goals.length === 0) {
      cardsHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; background: var(--bg-card); border-radius: var(--radius-lg); padding: 40px;">
          <div class="empty-state-icon" aria-hidden="true">🎯</div>
          <h3 class="empty-state-title">No savings goals yet</h3>
          <p class="empty-state-desc">Set aside money for headphones, college trips, or gadgets.</p>
          <button type="button" class="btn btn-primary" onclick="window.appController.openAddSavingsGoalModal()">+ Create First Goal</button>
        </div>
      `;
    } else {
      cardsHTML = goals.map(goal => {
        const savedPaise = toPaise(goal.savedAmount);
        const targetPaise = toPaise(goal.targetAmount);
        const saved = fromPaise(savedPaise);
        const target = fromPaise(targetPaise);
        const pct = targetPaise > 0 ? Math.min(100, (savedPaise / targetPaise) * 100) : 0;
        const remaining = Math.max(0, fromPaise(targetPaise - savedPaise));
        const safeName = escapeHTML(goal.name);
        const safeId = escapeHTML(goal.id);

        let daysText = 'Target date reached';
        if (goal.targetDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tgt = new Date(goal.targetDate + 'T00:00:00');
          const diffDays = Math.ceil((tgt - today) / (1000 * 60 * 60 * 24));
          daysText = diffDays > 0 ? `${diffDays} days remaining` : 'Target date reached';
        }

        let barClass = 'progress-normal';
        if (pct < 30) barClass = 'progress-warning';

        return `
          <article class="goal-card">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span class="category-icon-circle" aria-hidden="true" style="background: var(--bg-subtle);">
                  ${escapeHTML(goal.icon || '🎯')}
                </span>
                <div>
                  <h4 style="font-size: 0.96rem; font-weight: 700; color: var(--text-primary);">${safeName}</h4>
                  <small style="color: var(--text-secondary); font-size: 0.74rem;">${escapeHTML(daysText)}</small>
                </div>
              </div>
              <span class="badge ${pct >= 100 ? 'badge-income' : 'badge-neutral'}">
                ${pct >= 100 ? '✅ ' : ''}${pct.toFixed(0)}%
              </span>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
                <span style="font-size: 1.35rem; font-weight: 800; font-family: var(--font-mono); color: var(--text-primary);">
                  ${formatINR(saved)}
                </span>
                <span style="font-size: 0.82rem; color: var(--text-secondary);">
                  of ${formatINR(target)}
                </span>
              </div>
              <div class="progress-bar-track" role="progressbar" aria-label="${safeName} savings progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}">
                <div class="progress-bar-fill ${barClass}" style="width: ${pct}%;"></div>
              </div>
              <div style="font-size: 0.76rem; color: var(--text-secondary); margin-top: 6px;">
                ${pct >= 100 ? '🎉 Goal Completed!' : `Need <strong>${formatINR(remaining)}</strong> more`}
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 6px; padding-top: 6px; border-top: 1px solid var(--border-subtle); flex-wrap: wrap;">
              <button type="button" class="btn btn-secondary btn-sm" aria-label="Deposit ₹100 to ${safeName}" onclick="window.appController.quickDepositSavings('${safeId}', 100)">
                +₹100
              </button>
              <button type="button" class="btn btn-secondary btn-sm" aria-label="Deposit ₹500 to ${safeName}" onclick="window.appController.quickDepositSavings('${safeId}', 500)">
                +₹500
              </button>
              <button type="button" class="btn btn-primary btn-sm" aria-label="Add or withdraw custom amount for ${safeName}" onclick="window.appController.openAdjustSavingsModal('${safeId}')">
                Add / Withdraw
              </button>
              <button type="button" class="btn btn-secondary btn-sm" aria-label="Edit goal ${safeName}" onclick="window.appController.openEditSavingsGoalModal('${safeId}')">
                Edit
              </button>
              <button type="button" class="btn btn-secondary btn-sm" aria-label="Delete goal ${safeName}" onclick="window.appController.confirmDeleteSavingsGoal('${safeId}')" style="color: var(--color-rose);">
                🗑️
              </button>
            </div>
          </article>
        `;
      }).join('');
    }

    container.innerHTML = `
      <div class="section-header">
        <div>
          <h2 class="section-title">Savings Goals</h2>
          <p class="section-subtitle">Set goals for gadgets, semester trips, and emergency pocket buffers.</p>
        </div>
        <button type="button" class="btn btn-primary" onclick="window.appController.openAddSavingsGoalModal()">
          <span aria-hidden="true">+</span> Create New Goal
        </button>
      </div>

      <div class="card" style="margin-bottom: 22px; padding: 22px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
          <div>
            <span style="font-size: 0.76rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">
              Total Saved Across Goals
            </span>
            <div style="font-size: 2rem; font-weight: 800; color: var(--color-primary); font-family: var(--font-mono);">
              ${formatINR(totalSavedAll)}
              <span style="font-size: 1rem; color: var(--text-secondary); font-weight: 500;">
                / ${formatINR(totalTargetAll)}
              </span>
            </div>
          </div>
          <span class="badge badge-income" style="font-size: 0.85rem; padding: 5px 12px;">
            ${overallPct.toFixed(0)}% Achieved
          </span>
        </div>

        <div class="progress-bar-track" style="height: 10px;" role="progressbar" aria-label="Combined savings goals progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(100, Math.round(overallPct))}">
          <div class="progress-bar-fill progress-normal" style="width: ${Math.min(100, overallPct)}%;"></div>
        </div>
      </div>

      <div class="goals-grid">
        ${cardsHTML}
      </div>
    `;
  }
}

window.savingsView = new SavingsView(window.appStore);
