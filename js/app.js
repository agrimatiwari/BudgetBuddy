/* ==========================================================================
   BudgetBuddy - Main Application Controller & Router
   ========================================================================== */

class AppRouter {
  constructor() {
    this.currentRoute = 'dashboard';
    this.routes = {
      'dashboard': window.dashboardView,
      'transactions': window.transactionsView,
      'budgets': window.budgetsView,
      'insights': window.analyticsView,
      'savings': window.savingsView,
      'subscriptions': window.subscriptionsView,
      'calendar': window.calendarView,
      'settings': window.settingsView
    };

    window.addEventListener('hashchange', () => this.handleHashChange());
  }

  init() {
    const hash = window.location.hash.replace('#', '');
    if (hash && this.routes[hash]) {
      this.navigateTo(hash, false);
    } else {
      this.navigateTo('dashboard', false);
    }
  }

  navigateTo(routeName, updateHash = true) {
    if (!this.routes[routeName]) {
      routeName = 'dashboard';
    }
    this.currentRoute = routeName;

    if (updateHash) {
      window.location.hash = routeName;
    }

    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    const targetSection = document.getElementById(`view-${routeName}`);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    document.querySelectorAll('.nav-link').forEach(link => {
      const linkRoute = link.getAttribute('data-route');
      if (linkRoute === routeName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    document.querySelector('.app-container')?.classList.remove('sidebar-open');

    if (this.routes[routeName]) {
      this.routes[routeName].render();
    }
  }

  handleHashChange() {
    const hash = window.location.hash.replace('#', '');
    if (hash && this.routes[hash] && hash !== this.currentRoute) {
      this.navigateTo(hash, false);
    }
  }

  refreshCurrentView() {
    if (this.routes[this.currentRoute]) {
      this.routes[this.currentRoute].render();
    }
  }
}

class AppController {
  constructor(store, router) {
    this.store = store;
    this.router = router;
    this.activeModal = null;
    this.deleteAction = null;
  }

  init() {
    const theme = this.store.getSettings().theme || 'light';
    this.applyTheme(theme);

    this.updateClock();
    setInterval(() => this.updateClock(), 1000);

    this.updateUserBadge();

    this.store.subscribe(() => {
      this.router.refreshCurrentView();
      this.updateUserBadge();
    });

    this.router.init();
  }

  updateClock() {
    const el = document.getElementById('headerLiveTime');
    if (el) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      el.textContent = `${timeStr} | ${dateStr}`;
    }
  }

  updateUserBadge() {
    const name = this.store.getUserName();
    const nameEl = document.getElementById('headerUserName');
    const avatarEl = document.getElementById('headerUserAvatar');
    if (nameEl) nameEl.textContent = name;
    if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();
  }

  showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `
      <span style="font-size: 1rem;">${icon}</span>
      <span style="flex: 1;">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  switchTheme(newTheme) {
    this.store.setTheme(newTheme);
    this.applyTheme(newTheme);
    this.showToast(`Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} Mode`, 'info');
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    this.switchTheme(next);
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const themeIcon = document.getElementById('themeToggleIcon');
    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
    setTimeout(() => {
      window.chartService?.refreshThemes();
    }, 40);
  }

  changePeriod(periodStr) {
    this.store.setSelectedPeriod(periodStr);
    this.showToast(`Selected period: ${periodStr}`, 'info');
  }

  handleGlobalSearch(query) {
    this.router.navigateTo('transactions');
    window.transactionsView.setFilter('searchQuery', query);
  }

  toggleSidebar() {
    const container = document.querySelector('.app-container');
    if (window.innerWidth <= 1024) {
      container.classList.toggle('sidebar-open');
    } else {
      container.classList.toggle('sidebar-collapsed');
    }
  }

  closeMobileSidebar() {
    document.querySelector('.app-container')?.classList.remove('sidebar-open');
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('open');
      this.activeModal = modal;
    }
  }

  closeModal(modalId = null) {
    if (modalId) {
      document.getElementById(modalId)?.classList.remove('open');
    } else if (this.activeModal) {
      this.activeModal.classList.remove('open');
      this.activeModal = null;
    }
  }

  // -------------------------------------------------------------------------
  // Transaction Modals
  // -------------------------------------------------------------------------
  openAddTransactionModal() {
    const form = document.getElementById('transactionForm');
    if (form) form.reset();

    document.getElementById('txModalTitle').textContent = 'Add Transaction';
    document.getElementById('txIdInput').value = '';
    document.getElementById('txDateInput').value = new Date().toISOString().split('T')[0];

    this.syncTxCategories('expense');
    this.openModal('transactionModal');
  }

  openEditTransactionModal(id) {
    const tx = this.store.getTransactionById(id);
    if (!tx) return;

    document.getElementById('txModalTitle').textContent = 'Edit Transaction';
    document.getElementById('txIdInput').value = tx.id;
    document.getElementById('txTitleInput').value = tx.title;
    document.getElementById('txAmountInput').value = tx.amount;
    document.getElementById('txTypeInput').value = tx.type;
    document.getElementById('txDateInput').value = tx.date;
    document.getElementById('txPaymentMethodInput').value = tx.paymentMethod || 'UPI';
    document.getElementById('txDescInput').value = tx.description || '';

    this.syncTxCategories(tx.type, tx.category);
    this.openModal('transactionModal');
  }

  syncTxCategories(type, selectedCategory = null) {
    const catSelect = document.getElementById('txCategoryInput');
    if (!catSelect) return;

    const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    catSelect.innerHTML = list.map(c => `
      <option value="${c}" ${c === selectedCategory ? 'selected' : ''}>${c}</option>
    `).join('');
  }

  saveTransactionForm(e) {
    e.preventDefault();
    const id = document.getElementById('txIdInput').value;
    const title = document.getElementById('txTitleInput').value.trim();
    const amount = parseFloat(document.getElementById('txAmountInput').value);
    const type = document.getElementById('txTypeInput').value;
    const category = document.getElementById('txCategoryInput').value;
    const date = document.getElementById('txDateInput').value;
    const paymentMethod = document.getElementById('txPaymentMethodInput').value;
    const description = document.getElementById('txDescInput').value.trim();

    if (!title) {
      this.showToast('Please enter an expense/income title', 'error');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      this.showToast('Please enter a valid amount greater than 0', 'error');
      return;
    }
    if (!date) {
      this.showToast('Please choose a date', 'error');
      return;
    }

    if (id) {
      this.store.updateTransaction(id, { title, amount, type, category, date, paymentMethod, description });
      this.showToast('Transaction updated', 'success');
    } else {
      this.store.addTransaction({ title, amount, type, category, date, paymentMethod, description });
      this.showToast('Transaction logged', 'success');
    }

    this.closeModal('transactionModal');
  }

  confirmDeleteTransaction(id) {
    this.openConfirmModal(
      'Delete Transaction',
      'Are you sure you want to delete this record?',
      () => {
        this.store.deleteTransaction(id);
        this.showToast('Transaction removed', 'info');
      }
    );
  }

  // -------------------------------------------------------------------------
  // Budget Modals
  // -------------------------------------------------------------------------
  openEditOverallBudgetModal(currentVal) {
    document.getElementById('overallBudgetInput').value = currentVal;
    this.openModal('overallBudgetModal');
  }

  saveOverallBudgetForm(e) {
    e.preventDefault();
    const val = parseFloat(document.getElementById('overallBudgetInput').value);
    if (isNaN(val) || val < 0) {
      this.showToast('Please enter a valid budget amount', 'error');
      return;
    }
    this.store.updateOverallBudget(val);
    this.showToast('Monthly budget updated', 'success');
    this.closeModal('overallBudgetModal');
  }

  openEditBudgetModal(category, currentLimit) {
    document.getElementById('catBudgetCategoryName').textContent = category;
    document.getElementById('catBudgetCategoryInput').value = category;
    document.getElementById('catBudgetAmountInput').value = currentLimit;
    this.openModal('categoryBudgetModal');
  }

  saveCategoryBudgetForm(e) {
    e.preventDefault();
    const category = document.getElementById('catBudgetCategoryInput').value;
    const amount = parseFloat(document.getElementById('catBudgetAmountInput').value);
    if (isNaN(amount) || amount < 0) {
      this.showToast('Please enter a valid budget amount', 'error');
      return;
    }
    this.store.updateCategoryBudget(category, amount);
    this.showToast(`Updated budget for ${category}`, 'success');
    this.closeModal('categoryBudgetModal');
  }

  // -------------------------------------------------------------------------
  // Subscription Modals
  // -------------------------------------------------------------------------
  openAddSubscriptionModal() {
    document.getElementById('subForm').reset();
    document.getElementById('subIdInput').value = '';
    document.getElementById('subModalTitle').textContent = 'Add Subscription';
    document.getElementById('subNextDateInput').value = new Date().toISOString().split('T')[0];
    this.openModal('subscriptionModal');
  }

  openEditSubscriptionModal(id) {
    const sub = this.store.getSubscriptions().find(s => s.id === id);
    if (!sub) return;

    document.getElementById('subModalTitle').textContent = 'Edit Subscription';
    document.getElementById('subIdInput').value = sub.id;
    document.getElementById('subNameInput').value = sub.name;
    document.getElementById('subAmountInput').value = sub.amount;
    document.getElementById('subFreqInput').value = sub.frequency;
    document.getElementById('subCategoryInput').value = sub.category;
    document.getElementById('subNextDateInput').value = sub.nextBillingDate;

    this.openModal('subscriptionModal');
  }

  saveSubscriptionForm(e) {
    e.preventDefault();
    const id = document.getElementById('subIdInput').value;
    const name = document.getElementById('subNameInput').value.trim();
    const amount = parseFloat(document.getElementById('subAmountInput').value);
    const frequency = document.getElementById('subFreqInput').value;
    const category = document.getElementById('subCategoryInput').value;
    const nextBillingDate = document.getElementById('subNextDateInput').value;

    if (!name || isNaN(amount) || amount <= 0 || !nextBillingDate) {
      this.showToast('Please fill all required subscription details', 'error');
      return;
    }

    if (id) {
      this.store.updateSubscription(id, { name, amount, frequency, category, nextBillingDate });
      this.showToast('Subscription updated', 'success');
    } else {
      this.store.addSubscription({ name, amount, frequency, category, nextBillingDate });
      this.showToast('Subscription added', 'success');
    }

    this.closeModal('subscriptionModal');
  }

  confirmDeleteSubscription(id) {
    this.openConfirmModal('Delete Subscription', 'Remove this recurring subscription?', () => {
      this.store.deleteSubscription(id);
      this.showToast('Subscription deleted', 'info');
    });
  }

  // -------------------------------------------------------------------------
  // Savings Goal Modals
  // -------------------------------------------------------------------------
  openAddSavingsGoalModal() {
    document.getElementById('goalForm').reset();
    document.getElementById('goalIdInput').value = '';
    document.getElementById('goalModalTitle').textContent = 'Create Savings Goal';
    this.openModal('goalModal');
  }

  openEditSavingsGoalModal(id) {
    const goal = this.store.getSavingsGoals().find(g => g.id === id);
    if (!goal) return;

    document.getElementById('goalModalTitle').textContent = 'Edit Savings Goal';
    document.getElementById('goalIdInput').value = goal.id;
    document.getElementById('goalNameInput').value = goal.name;
    document.getElementById('goalTargetInput').value = goal.targetAmount;
    document.getElementById('goalSavedInput').value = goal.savedAmount;
    document.getElementById('goalDateInput').value = goal.targetDate || '';
    document.getElementById('goalIconInput').value = goal.icon || '🎯';

    this.openModal('goalModal');
  }

  saveGoalForm(e) {
    e.preventDefault();
    const id = document.getElementById('goalIdInput').value;
    const name = document.getElementById('goalNameInput').value.trim();
    const targetAmount = parseFloat(document.getElementById('goalTargetInput').value);
    const savedAmount = parseFloat(document.getElementById('goalSavedInput').value) || 0;
    const targetDate = document.getElementById('goalDateInput').value;
    const icon = document.getElementById('goalIconInput').value || '🎯';

    if (!name || isNaN(targetAmount) || targetAmount <= 0) {
      this.showToast('Please enter a goal name and target amount', 'error');
      return;
    }

    if (id) {
      this.store.updateSavingsGoal(id, { name, targetAmount, savedAmount, targetDate, icon });
      this.showToast('Goal updated', 'success');
    } else {
      this.store.addSavingsGoal({ name, targetAmount, savedAmount, targetDate, icon });
      this.showToast('Savings goal created', 'success');
    }

    this.closeModal('goalModal');
  }

  quickDepositSavings(id, delta) {
    this.store.adjustSavingsAmount(id, delta);
    this.showToast(`Deposited +${formatINR(delta)} into goal!`, 'success');
  }

  openAdjustSavingsModal(id) {
    const goal = this.store.getSavingsGoals().find(g => g.id === id);
    if (!goal) return;

    document.getElementById('adjustGoalId').value = goal.id;
    document.getElementById('adjustGoalName').textContent = goal.name;
    document.getElementById('adjustGoalAmount').value = '';
    this.openModal('adjustSavingsModal');
  }

  saveAdjustSavings(e) {
    e.preventDefault();
    const id = document.getElementById('adjustGoalId').value;
    const action = document.getElementById('adjustActionType').value;
    const amt = parseFloat(document.getElementById('adjustGoalAmount').value);

    if (isNaN(amt) || amt <= 0) {
      this.showToast('Please enter a valid amount', 'error');
      return;
    }

    const delta = action === 'deposit' ? amt : -amt;
    this.store.adjustSavingsAmount(id, delta);
    this.showToast('Goal balance updated', 'success');
    this.closeModal('adjustSavingsModal');
  }

  confirmDeleteSavingsGoal(id) {
    this.openConfirmModal('Delete Savings Goal', 'Remove this savings goal?', () => {
      this.store.deleteSavingsGoal(id);
      this.showToast('Savings goal removed', 'info');
    });
  }

  // -------------------------------------------------------------------------
  // Calendar Date Modal
  // -------------------------------------------------------------------------
  openCalendarDateModal(dateStr) {
    const allTx = this.store.getTransactions().filter(t => t.date === dateStr);

    document.getElementById('calendarModalDate').textContent = dateStr;
    const body = document.getElementById('calendarModalContent');

    if (allTx.length === 0) {
      body.innerHTML = `
        <div class="empty-state" style="padding: 20px;">
          <p class="empty-state-desc">No transactions on ${dateStr}.</p>
          <button class="btn btn-primary btn-sm" onclick="window.appController.openAddTransactionForDate('${dateStr}')">
            + Log Expense for this date
          </button>
        </div>
      `;
    } else {
      const rows = allTx.map(tx => {
        const isIncome = tx.type === 'income';
        const icon = DashboardView.getCategoryIcon(tx.category);
        const sign = isIncome ? '+' : '-';
        const amtClass = isIncome ? 'amount-income' : 'amount-expense';

        return `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-subtle);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span>${icon}</span>
              <div>
                <strong style="font-size: 0.88rem; display: block;">${tx.title}</strong>
                <small style="color: var(--text-secondary); font-size: 0.74rem;">${tx.category}</small>
              </div>
            </div>
            <div class="${amtClass}" style="font-weight: 700; font-family: var(--font-mono);">
              ${sign}${formatINR(tx.amount)}
            </div>
          </div>
        `;
      }).join('');

      body.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px;">
          ${rows}
        </div>
        <button class="btn btn-secondary btn-sm" style="width: 100%;" onclick="window.appController.openAddTransactionForDate('${dateStr}')">
          + Add another transaction for this date
        </button>
      `;
    }

    this.openModal('calendarDateModal');
  }

  openAddTransactionForDate(dateStr) {
    this.closeModal('calendarDateModal');
    this.openAddTransactionModal();
    document.getElementById('txDateInput').value = dateStr;
  }

  // -------------------------------------------------------------------------
  // Settings & Backups
  // -------------------------------------------------------------------------
  saveProfileSettings() {
    const userName = document.getElementById('settingUserName').value.trim();
    if (!userName) {
      this.showToast('Please enter your name', 'error');
      return;
    }
    this.store.updateSettings({ userName });
    this.showToast('Profile updated', 'success');
  }

  handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const res = this.store.importJSON(event.target.result);
      if (res.success) {
        this.showToast('Backup restored successfully!', 'success');
      } else {
        this.showToast(`Import failed: ${res.error}`, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  loadSampleData() {
    this.store.resetDefaults();
    this.showToast('Loaded realistic college student dataset', 'success');
  }

  confirmWipeAllData() {
    this.openConfirmModal(
      'Clear All Financial Records',
      'This will erase all your transactions, budgets, subscriptions and goals stored in this browser. Are you sure?',
      () => {
        this.store.clearAll();
        this.showToast('All data erased', 'info');
      }
    );
  }

  openConfirmModal(title, message, onConfirm) {
    document.getElementById('confirmModalTitle').textContent = title;
    document.getElementById('confirmModalMessage').textContent = message;
    this.deleteAction = onConfirm;
    this.openModal('confirmModal');
  }

  executeConfirmAction() {
    if (this.deleteAction) {
      this.deleteAction();
      this.deleteAction = null;
    }
    this.closeModal('confirmModal');
  }
}

// Global App Initialization
document.addEventListener('DOMContentLoaded', () => {
  window.appRouter = new AppRouter();
  window.appController = new AppController(window.appStore, window.appRouter);
  window.appController.init();
});
