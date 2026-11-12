/* ==========================================================================
   BudgetBuddy - Spending Calendar View Controller (Keyboard Accessible)
   ========================================================================== */

class CalendarView {
  constructor(store) {
    this.store = store;
    const now = new Date();
    this.currentYear = now.getFullYear();
    this.currentMonth = now.getMonth();
  }

  prevMonth() {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.render();
  }

  nextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.render();
  }

  goToToday() {
    const now = new Date();
    this.currentYear = now.getFullYear();
    this.currentMonth = now.getMonth();
    this.render();
  }

  render() {
    const container = document.getElementById('view-calendar');
    if (!container) return;

    const allTx = this.store.getTransactions();
    const monthName = new Date(this.currentYear, this.currentMonth, 1).toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric'
    });

    const firstDayIndex = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(this.currentYear, this.currentMonth, 0).getDate();

    const currentMonthPrefix = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}`;
    const dailyExpensesPaise = {};
    const dailyTxCount = {};

    let totalMonthSpendPaise = 0;
    allTx.forEach(t => {
      if (t.type === 'expense' && t.date && t.date.startsWith(currentMonthPrefix)) {
        const amtPaise = toPaise(t.amount);
        dailyExpensesPaise[t.date] = (dailyExpensesPaise[t.date] || 0) + amtPaise;
        dailyTxCount[t.date] = (dailyTxCount[t.date] || 0) + 1;
        totalMonthSpendPaise += amtPaise;
      }
    });

    const activeDays = Object.keys(dailyExpensesPaise).length;
    const avgDailySpendPaise = activeDays > 0 ? totalMonthSpendPaise / activeDays : 0;
    const todayStr = new Date().toISOString().split('T')[0];

    let cellsHTML = '';
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      .map(d => `<div class="calendar-day-header" role="columnheader">${d}</div>`)
      .join('');

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDateNum = prevMonthDays - i;
      cellsHTML += `
        <div class="calendar-cell other-month" aria-hidden="true">
          <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">${prevDateNum}</span>
        </div>
      `;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentMonthPrefix}-${String(day).padStart(2, '0')}`;
      const spendPaise = dailyExpensesPaise[dateStr] || 0;
      const spend = fromPaise(spendPaise);
      const count = dailyTxCount[dateStr] || 0;
      const isToday = dateStr === todayStr;

      let spendClass = '';
      let intensityLabel = 'No spend';
      if (spendPaise > 0) {
        if (spendPaise > avgDailySpendPaise * 2 && spend > 500) {
          spendClass = 'high-spend';
          intensityLabel = 'High spend';
        } else if (spendPaise > avgDailySpendPaise) {
          spendClass = 'moderate-spend';
          intensityLabel = 'Moderate spend';
        } else {
          spendClass = 'low-spend';
          intensityLabel = 'Low spend';
        }
      }

      const ariaDesc = `${dateStr}, ${intensityLabel}${spend > 0 ? `, spent ${formatINR(spend)} across ${count} transactions` : ''}`;

      cellsHTML += `
        <button type="button" class="calendar-cell ${isToday ? 'today' : ''} ${spendClass}" aria-label="${escapeHTML(ariaDesc)}" onclick="window.appController.openCalendarDateModal('${dateStr}')">
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-primary);">${day}</span>
            ${count > 0 ? `<span style="font-size: 0.68rem; color: var(--text-secondary);">${count} tx</span>` : ''}
          </div>
          <div>
            ${spend > 0 ? `<div class="calendar-cell-spend">-${formatINR(spend)}</div>` : ''}
          </div>
        </button>
      `;
    }

    const totalRendered = firstDayIndex + daysInMonth;
    const remainingFiller = (7 - (totalRendered % 7)) % 7;
    for (let i = 1; i <= remainingFiller; i++) {
      cellsHTML += `
        <div class="calendar-cell other-month" aria-hidden="true">
          <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">${i}</span>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="section-header">
        <div>
          <h2 class="section-title">Spending Calendar</h2>
          <p class="section-subtitle">Visual overview of your daily student expenditures. Select any date to view transactions.</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn btn-secondary btn-sm" aria-label="Previous month" onclick="window.calendarView.prevMonth()">‹ Prev</button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.calendarView.goToToday()">Today</button>
          <button type="button" class="btn btn-secondary btn-sm" aria-label="Next month" onclick="window.calendarView.nextMonth()">Next ›</button>
        </div>
      </div>

      <div class="calendar-card">
        <div class="calendar-nav-bar">
          <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary);">${escapeHTML(monthName)}</h3>
          <div style="display: flex; align-items: center; gap: 14px; font-size: 0.78rem; color: var(--text-secondary);">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span aria-hidden="true" style="width: 10px; height: 10px; border-radius: 2px; background: rgba(72, 168, 120, 0.25);"></span>
              <span>Low</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span aria-hidden="true" style="width: 10px; height: 10px; border-radius: 2px; background: rgba(232, 183, 93, 0.25);"></span>
              <span>Moderate</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span aria-hidden="true" style="width: 10px; height: 10px; border-radius: 2px; background: rgba(233, 135, 120, 0.25);"></span>
              <span>High Spend</span>
            </div>
          </div>
        </div>

        <div class="calendar-grid" role="grid" aria-label="Daily spending calendar for ${escapeHTML(monthName)}">
          ${dayHeaders}
          ${cellsHTML}
        </div>
      </div>
    `;
  }
}

window.calendarView = new CalendarView(window.appStore);
