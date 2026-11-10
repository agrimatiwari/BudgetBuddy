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
      if (sortBy === 'amount-desc') return (Number(b.amount) || 0) - (Number(a.amount) || 0);
      if (sortBy === 'amount-asc') return (Number(a.amount) || 0) - (Number(b.amount) || 0);
      return 0;
    });

    return list;
  }

  render() {
    const container = document.getElementById('view-transactions');
    if (!container) return;

    const filteredTx = this.getFilteredTransactions();
    const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

    let filteredIncome = 0;
    let filteredExpense = 0;
    filteredTx.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') filteredIncome += amt;
      else if (t.type === 'expense') filteredExpense += amt;
    });

    const categoryOptions = allCategories.map(c => `
      <option value="${c}" ${this.filters.category === c ? 'selected' : ''}>${c}</option>
    `).join('');

    let tableRowsHTML = '';
    if (filteredTx.length === 0) {
      tableRowsHTML = `
        <tr>
          <td colspan="6" class="empty-state">
            <div class="empty-state-icon">🔍</div>
            <p class="empty-state-title">No transactions found</p>
            <p class="empty-state-desc">Try clearing your filters or search keywords.</p>
            <button class="btn btn-secondary btn-sm" onclick="window.transactionsView.resetFilters()">Clear Filters</button>
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

        return `
          <tr>
            <td style="color: var(--text-muted); font-size: 0.78rem; width: 36px;">${idx + 1}</td>
            <td>
              <div class="category-pill">
                <span class="category-icon-circle" style="background-color: var(--bg-subtle);">
                  ${icon}
                </span>
                <div>
                  <strong style="font-size: 0.88rem; color: var(--text-primary); display: block;">${tx.title}</strong>
                  ${tx.description ? `<small style="color: var(--text-secondary); font-size: 0.75rem;">${tx.description}</small>` : ''}
                </div>
              </div>
            </td>
            <td>
              <span class="badge ${badgeClass}">${tx.category}</span>
            </td>
            <td>
              <span class="badge badge-neutral">${tx.paymentMethod || 'UPI'}</span>
            </td>
            <td style="color: var(--text-secondary); font-size: 0.82rem;">${tx.date}</td>
            <td class="amount-cell ${amtClass}">${sign}${formatINR(tx.amount)}</td>
            <td style="text-align: right; white-space: nowrap;">
              <button class="btn btn-secondary btn-sm" onclick="window.appController.openEditTransactionModal('${tx.id}')" title="Edit">
                ✏️
              </button>
              <button class="btn btn-secondary btn-sm" onclick="window.appController.confirmDeleteTransaction('${tx.id}')" title="Delete" style="color: var(--color-rose);">
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
        <button class="btn btn-primary" onclick="window.appController.openAddTransactionModal()">
          <span>+</span> Add Transaction
        </button>
      </div>

      <!-- Filter Controls Toolbar -->
      <div class="filter-toolbar">
        <div class="filter-group">
          <!-- Search -->
          <div class="header-search" style="width: 220px;">
            <span class="search-icon">🔍</span>
            <input type="text" placeholder="Search title or note..." value="${this.filters.searchQuery}"
              oninput="window.transactionsView.setFilter('searchQuery', this.value)">
          </div>

          <!-- Type -->
          <select class="form-select" style="width: 130px; padding: 7px 10px;"
            onchange="window.transactionsView.setFilter('type', this.value)">
            <option value="all" ${this.filters.type === 'all' ? 'selected' : ''}>All Types</option>
            <option value="expense" ${this.filters.type === 'expense' ? 'selected' : ''}>Expenses</option>
            <option value="income" ${this.filters.type === 'income' ? 'selected' : ''}>Income</option>
          </select>

          <!-- Category -->
          <select class="form-select" style="width: 160px; padding: 7px 10px;"
            onchange="window.transactionsView.setFilter('category', this.value)">
            <option value="all" ${this.filters.category === 'all' ? 'selected' : ''}>All Categories</option>
            ${categoryOptions}
          </select>

          <!-- Date Filter -->
          <select class="form-select" style="width: 140px; padding: 7px 10px;"
            onchange="window.transactionsView.setFilter('dateRange', this.value)">
            <option value="all" ${this.filters.dateRange === 'all' ? 'selected' : ''}>All Time</option>
            <option value="this_month" ${this.filters.dateRange === 'this_month' ? 'selected' : ''}>This Month</option>
            <option value="last_month" ${this.filters.dateRange === 'last_month' ? 'selected' : ''}>Last Month</option>
            <option value="custom" ${this.filters.dateRange === 'custom' ? 'selected' : ''}>Custom Range</option>
          </select>

          ${this.filters.dateRange === 'custom' ? `
            <input type="date" class="form-input" style="width: 130px; padding: 6px 8px;" value="${this.filters.startDate}"
              onchange="window.transactionsView.setFilter('startDate', this.value)">
            <span style="color: var(--text-muted); font-size: 0.8rem;">to</span>
            <input type="date" class="form-input" style="width: 130px; padding: 6px 8px;" value="${this.filters.endDate}"
              onchange="window.transactionsView.setFilter('endDate', this.value)">
          ` : ''}
        </div>

        <div class="filter-group">
          <!-- Sort -->
          <select class="form-select" style="width: 160px; padding: 7px 10px;"
            onchange="window.transactionsView.setFilter('sortBy', this.value)">
            <option value="date-desc" ${this.filters.sortBy === 'date-desc' ? 'selected' : ''}>Date: Newest</option>
            <option value="date-asc" ${this.filters.sortBy === 'date-asc' ? 'selected' : ''}>Date: Oldest</option>
            <option value="amount-desc" ${this.filters.sortBy === 'amount-desc' ? 'selected' : ''}>Amount: High to Low</option>
            <option value="amount-asc" ${this.filters.sortBy === 'amount-asc' ? 'selected' : ''}>Amount: Low to High</option>
          </select>
        </div>
      </div>

      <!-- Quick Summary Pills -->
      <div style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
        <span class="badge badge-neutral" style="padding: 5px 12px; font-size: 0.8rem;">
          Showing: <strong>${filteredTx.length} records</strong>
        </span>
        <span class="badge badge-income" style="padding: 5px 12px; font-size: 0.8rem;">
          Total Inflow: <strong>+${formatINR(filteredIncome)}</strong>
        </span>
        <span class="badge badge-expense" style="padding: 5px 12px; font-size: 0.8rem;">
          Total Outflow: <strong>-${formatINR(filteredExpense)}</strong>
        </span>
      </div>

      <!-- Transactions Table -->
      <div class="card" style="padding: 0; overflow: hidden;">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item & Note</th>
                <th>Category</th>
                <th>Payment Mode</th>
                <th>Date</th>
                <th style="text-align: right;">Amount</th>
                <th style="text-align: right;">Actions</th>
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
