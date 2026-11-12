/* ==========================================================================
   BudgetBuddy - Transactions Management View Controller
   ========================================================================== */

class TransactionsView {
  constructor(store) {
    this.store = store;
    this.filters = {
      searchQuery: '',
      category: 'all',
      type: 'all',
      dateRange: 'all',
      startDate: '',
      endDate: '',
      sortBy: 'date-desc'
    };
  }

  setFilter(key, value) {
    this.filters[key] = value;
    this.render();
  }

  resetFilters() {
    this.filters = {
      searchQuery: '',
      category: 'all',
      type: 'all',
      dateRange: 'all',
      startDate: '',
      endDate: '',
      sortBy: 'date-desc'
    };
    this.render();
  }

  getFilteredTransactions() {
    let list = this.store.getTransactions();
    const { searchQuery, category, type, dateRange, startDate, endDate, sortBy } = this.filters;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(t =>
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q))
      );
    }

    if (type !== 'all') {
      list = list.filter(t => t.type === type);
    }

    if (category !== 'all') {
      list = list.filter(t => t.category === category);
    }

    const now = new Date();
    if (dateRange === 'this_month') {
      const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      list = list.filter(t => t.date && t.date.startsWith(ym));
    } else if (dateRange === 'last_month') {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const ym = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
      list = list.filter(t => t.date && t.date.startsWith(ym));
    } else if (dateRange === 'custom') {
      if (startDate) list = list.filter(t => t.date >= startDate);
      if (endDate) list = list.filter(t => t.date <= endDate);
    }

    list.sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
      if (sortBy === 'amount-desc') return toPaise(b.amount) - toPaise(a.amount);
      if (sortBy === 'amount-asc') return toPaise(a.amount) - toPaise(b.amount);
      return 0;
    });

    return list;
  }

  render() {
    const container = document.getElementById('view-transactions');
    if (!container) return;

    const filteredTx = this.getFilteredTransactions();
    const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

    let filteredIncomePaise = 0;
    let filteredExpensePaise = 0;
    filteredTx.forEach(t => {
      const amtPaise = toPaise(t.amount);
      if (t.type === 'income') filteredIncomePaise += amtPaise;
      else if (t.type === 'expense') filteredExpensePaise += amtPaise;
    });

    const categoryOptions = allCategories.map(c => `
      <option value="${escapeHTML(c)}" ${this.filters.category === c ? 'selected' : ''}>${escapeHTML(c)}</option>
    `).join('');

    let tableRowsHTML = '';
    if (filteredTx.length === 0) {
      tableRowsHTML = `
        <tr>
          <td colspan="7" class="empty-state">
            <div class="empty-state-icon" aria-hidden="true">🔍</div>
            <p class="empty-state-title">No transactions found</p>
            <p class="empty-state-desc">Try clearing your filters or search keywords.</p>
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.transactionsView.resetFilters()">Clear Filters</button>
          </td>
        </tr>
      `;
    } else {
      tableRowsHTML = filteredTx.map((tx, idx) => {
        const isIncome = tx.type === 'income';
        const icon = DashboardView.getCategoryIcon(tx.category);
        const sign = isIncome ? '+' : '-';
        const amtClass = isIncome ? 'amount-income' : 'amount-expense';
        const badgeClass = isIncome ? 'badge-income' : 'badge-expense';
        const safeTitle = escapeHTML(tx.title);

        return `
          <tr>
            <td style="color: var(--text-muted); font-size: 0.78rem; width: 36px;">${idx + 1}</td>
            <td>
              <div class="category-pill">
                <span class="category-icon-circle" aria-hidden="true" style="background-color: var(--bg-subtle);">
                  ${icon}
                </span>
                <div>
                  <strong style="font-size: 0.88rem; color: var(--text-primary); display: block;">${safeTitle}</strong>
                  ${tx.description ? `<small style="color: var(--text-secondary); font-size: 0.75rem;">${escapeHTML(tx.description)}</small>` : ''}
                </div>
              </div>
            </td>
            <td>
              <span class="badge ${badgeClass}">${isIncome ? '↑' : '↓'} ${escapeHTML(tx.category)}</span>
            </td>
            <td>
              <span class="badge badge-neutral">${escapeHTML(tx.paymentMethod || 'UPI')}</span>
            </td>
            <td style="color: var(--text-secondary); font-size: 0.82rem;">${escapeHTML(tx.date)}</td>
            <td class="amount-cell ${amtClass}">${sign}${formatINR(tx.amount)}</td>
            <td style="text-align: right; white-space: nowrap;">
              <button type="button" class="btn btn-secondary btn-sm" aria-label="Edit transaction ${safeTitle}" onclick="window.appController.openEditTransactionModal('${escapeHTML(tx.id)}')">
                ✏️
              </button>
              <button type="button" class="btn btn-secondary btn-sm" aria-label="Delete transaction ${safeTitle}" onclick="window.appController.confirmDeleteTransaction('${escapeHTML(tx.id)}')" style="color: var(--color-rose);">
                🗑️
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }

    container.innerHTML = `
      <div class="section-header">
        <div>
          <h2 class="section-title">Transactions</h2>
          <p class="section-subtitle">Manage, search, and track all your pocket money and college expenses.</p>
        </div>
        <button type="button" class="btn btn-primary" onclick="window.appController.openAddTransactionModal()">
          <span aria-hidden="true">+</span> Add Transaction
        </button>
      </div>

      <div class="filter-toolbar" role="region" aria-label="Transaction filters">
        <div class="filter-group">
          <div class="header-search" style="width: 220px;">
            <label for="txSearchFilter" class="sr-only">Search transactions by title or note</label>
            <span class="search-icon" aria-hidden="true">🔍</span>
            <input type="search" id="txSearchFilter" placeholder="Search title or note..." value="${escapeHTML(this.filters.searchQuery)}"
              oninput="window.transactionsView.setFilter('searchQuery', this.value)">
          </div>

          <label for="txTypeFilter" class="sr-only">Filter by transaction type</label>
          <select id="txTypeFilter" class="form-select" style="width: 130px; padding: 7px 10px;"
            onchange="window.transactionsView.setFilter('type', this.value)">
            <option value="all" ${this.filters.type === 'all' ? 'selected' : ''}>All Types</option>
            <option value="expense" ${this.filters.type === 'expense' ? 'selected' : ''}>Expenses</option>
            <option value="income" ${this.filters.type === 'income' ? 'selected' : ''}>Income</option>
          </select>

          <label for="txCategoryFilter" class="sr-only">Filter by category</label>
          <select id="txCategoryFilter" class="form-select" style="width: 160px; padding: 7px 10px;"
            onchange="window.transactionsView.setFilter('category', this.value)">
            <option value="all" ${this.filters.category === 'all' ? 'selected' : ''}>All Categories</option>
            ${categoryOptions}
          </select>

          <label for="txDateRangeFilter" class="sr-only">Filter by date range</label>
          <select id="txDateRangeFilter" class="form-select" style="width: 140px; padding: 7px 10px;"
            onchange="window.transactionsView.setFilter('dateRange', this.value)">
            <option value="all" ${this.filters.dateRange === 'all' ? 'selected' : ''}>All Time</option>
            <option value="this_month" ${this.filters.dateRange === 'this_month' ? 'selected' : ''}>This Month</option>
            <option value="last_month" ${this.filters.dateRange === 'last_month' ? 'selected' : ''}>Last Month</option>
            <option value="custom" ${this.filters.dateRange === 'custom' ? 'selected' : ''}>Custom Range</option>
          </select>

          ${this.filters.dateRange === 'custom' ? `
            <label for="txStartDateFilter" class="sr-only">Start date</label>
            <input type="date" id="txStartDateFilter" class="form-input" style="width: 135px; padding: 6px 8px;" value="${escapeHTML(this.filters.startDate)}"
              onchange="window.transactionsView.setFilter('startDate', this.value)">
            <span style="color: var(--text-muted); font-size: 0.8rem;">to</span>
            <label for="txEndDateFilter" class="sr-only">End date</label>
            <input type="date" id="txEndDateFilter" class="form-input" style="width: 135px; padding: 6px 8px;" value="${escapeHTML(this.filters.endDate)}"
              onchange="window.transactionsView.setFilter('endDate', this.value)">
          ` : ''}
        </div>

        <div class="filter-group">
          <label for="txSortFilter" class="sr-only">Sort transactions</label>
          <select id="txSortFilter" class="form-select" style="width: 165px; padding: 7px 10px;"
            onchange="window.transactionsView.setFilter('sortBy', this.value)">
            <option value="date-desc" ${this.filters.sortBy === 'date-desc' ? 'selected' : ''}>Date: Newest</option>
            <option value="date-asc" ${this.filters.sortBy === 'date-asc' ? 'selected' : ''}>Date: Oldest</option>
            <option value="amount-desc" ${this.filters.sortBy === 'amount-desc' ? 'selected' : ''}>Amount: High to Low</option>
            <option value="amount-asc" ${this.filters.sortBy === 'amount-asc' ? 'selected' : ''}>Amount: Low to High</option>
          </select>
        </div>
      </div>

      <div style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
        <span class="badge badge-neutral" style="padding: 5px 12px; font-size: 0.8rem;">
          Showing: <strong>${filteredTx.length} records</strong>
        </span>
        <span class="badge badge-income" style="padding: 5px 12px; font-size: 0.8rem;">
          Total Inflow: <strong>+${formatINR(fromPaise(filteredIncomePaise))}</strong>
        </span>
        <span class="badge badge-expense" style="padding: 5px 12px; font-size: 0.8rem;">
          Total Outflow: <strong>-${formatINR(fromPaise(filteredExpensePaise))}</strong>
        </span>
      </div>

      <div class="card" style="padding: 0; overflow: hidden;">
        <div class="table-responsive">
          <table class="data-table" aria-label="Filtered transactions ledger">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Item & Note</th>
                <th scope="col">Category</th>
                <th scope="col">Payment Mode</th>
                <th scope="col">Date</th>
                <th scope="col" style="text-align: right;">Amount</th>
                <th scope="col" style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHTML}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

window.transactionsView = new TransactionsView(window.appStore);
