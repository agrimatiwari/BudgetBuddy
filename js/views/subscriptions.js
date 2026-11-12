/* ==========================================================================
   BudgetBuddy - Subscriptions & Recurring Bills View Controller
   ========================================================================== */

class SubscriptionsView {
  constructor(store) {
    this.store = store;
  }

  static getDaysRemaining(dateStr) {
    if (!dateStr) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr + 'T00:00:00');
    return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  }

  render() {
    const container = document.getElementById('view-subscriptions');
    if (!container) return;

    const subscriptions = this.store.getSubscriptions();

    let monthlyTotalPaise = 0;
    subscriptions.forEach(s => {
      const amtPaise = toPaise(s.amount);
      if (s.frequency === 'Yearly') monthlyTotalPaise += Math.round(amtPaise / 12);
      else if (s.frequency === 'Weekly') monthlyTotalPaise += Math.round(amtPaise * 4.33);
      else monthlyTotalPaise += amtPaise;
    });

    let cardsHTML = '';
    if (subscriptions.length === 0) {
      cardsHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; background: var(--bg-card); border-radius: var(--radius-lg); padding: 40px;">
          <div class="empty-state-icon" aria-hidden="true">🔄</div>
          <h3 class="empty-state-title">No subscriptions recorded</h3>
          <p class="empty-state-desc">Track your student subscriptions like Spotify, Netflix, or cloud storage.</p>
          <button type="button" class="btn btn-primary" onclick="window.appController.openAddSubscriptionModal()">+ Add Subscription</button>
        </div>
      `;
    } else {
      cardsHTML = subscriptions.map(sub => {
        const days = SubscriptionsView.getDaysRemaining(sub.nextBillingDate);
        let dueBadge = '';
        if (days < 0) {
          dueBadge = `<span class="badge badge-expense">🚨 Overdue</span>`;
        } else if (days === 0) {
          dueBadge = `<span class="badge badge-expense">⏰ Due Today</span>`;
        } else if (days <= 3) {
          dueBadge = `<span class="badge" style="background: var(--color-highlight-bg); color: var(--color-highlight-text);">⚠️ Due in ${days}d</span>`;
        } else {
          dueBadge = `<span class="badge badge-neutral">In ${days} days</span>`;
        }

        const safeName = escapeHTML(sub.name);
        const safeId = escapeHTML(sub.id);
        const brandInitial = safeName ? safeName.charAt(0).toUpperCase() : 'S';
        const brandColor = sub.brandColor || 'var(--color-primary)';

        return `
          <article class="sub-card">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div aria-hidden="true" style="width: 36px; height: 36px; border-radius: var(--radius-sm); background-color: ${brandColor}; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1rem;">
                  ${brandInitial}
                </div>
                <div>
                  <h4 style="font-size: 0.96rem; font-weight: 700; color: var(--text-primary);">${safeName}</h4>
                  <small style="color: var(--text-secondary); font-size: 0.74rem;">${escapeHTML(sub.frequency)} • ${escapeHTML(sub.category)}</small>
                </div>
              </div>
              ${dueBadge}
            </div>

            <div>
              <span style="font-size: 1.4rem; font-weight: 800; color: var(--text-primary); font-family: var(--font-mono);">
                ${formatINR(sub.amount)}
              </span>
              <span style="font-size: 0.76rem; color: var(--text-secondary);">/${escapeHTML(sub.frequency.toLowerCase())}</span>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px solid var(--border-subtle); font-size: 0.76rem; color: var(--text-secondary);">
              <span>Next: <strong>${escapeHTML(sub.nextBillingDate)}</strong></span>
              <div style="display: flex; gap: 6px;">
                <button type="button" class="btn btn-secondary btn-sm" aria-label="Edit subscription ${safeName}" onclick="window.appController.openEditSubscriptionModal('${safeId}')">Edit</button>
                <button type="button" class="btn btn-secondary btn-sm" aria-label="Delete subscription ${safeName}" onclick="window.appController.confirmDeleteSubscription('${safeId}')" style="color: var(--color-rose);">🗑️</button>
              </div>
            </div>
          </article>
        `;
      }).join('');
    }

    container.innerHTML = `
      <div class="section-header">
        <div>
          <h2 class="section-title">Subscriptions</h2>
          <p class="section-subtitle">Track recurring student plans, streaming platforms, and digital tools.</p>
        </div>
        <button type="button" class="btn btn-primary" onclick="window.appController.openAddSubscriptionModal()">
          <span aria-hidden="true">+</span> Add Subscription
        </button>
      </div>

      <div class="card" style="margin-bottom: 22px; padding: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;">
        <div>
          <span style="font-size: 0.76rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">
            Total Monthly Subscription Expense
          </span>
          <div style="font-size: 2rem; font-weight: 800; color: var(--color-primary); font-family: var(--font-mono);">
            ${formatINR(fromPaise(monthlyTotalPaise))}
            <span style="font-size: 0.88rem; color: var(--text-secondary); font-weight: 500;">/ month</span>
          </div>
        </div>
        <span class="badge badge-neutral" style="padding: 6px 14px; font-size: 0.82rem;">
          ${subscriptions.length} Active Subscriptions
        </span>
      </div>

      <div class="subscriptions-grid">
        ${cardsHTML}
      </div>
    `;
  }
}

window.subscriptionsView = new SubscriptionsView(window.appStore);
