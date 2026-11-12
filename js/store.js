/* ==========================================================================
   BudgetBuddy - Central Data Store, Financial Precision & LocalStorage Persistence
   Uses integer paise (1 INR = 100 paise) internally to avoid floating-point drift.
   ========================================================================== */

(function (global) {
  'use strict';

  const STORAGE_KEY = 'budgetbuddy_student_store_v1';

  const EXPENSE_CATEGORIES = [
    'Food & Dining',
    'Transportation',
    'Academics',
    'Shopping',
    'Entertainment',
    'Hostel & Living',
    'Personal Care',
    'Other'
  ];

  const INCOME_CATEGORIES = [
    'Monthly Pocket Money',
    'Allowance from Parents',
    'Scholarship',
    'Part-time Work',
    'Freelancing',
    'Other'
  ];

  const PAYMENT_METHODS = ['UPI', 'Cash', 'Card', 'Bank Transfer'];

  function toPaise(rupees) {
    const num = Number(rupees);
    if (!Number.isFinite(num)) return 0;
    return Math.round(num * 100);
  }

  function fromPaise(paise) {
    const intPaise = Math.round(Number(paise) || 0);
    return intPaise / 100;
  }

  function formatINR(amount, includeSymbol = true) {
    const paise = toPaise(amount);
    const rupees = paise / 100;
    const hasFraction = paise % 100 !== 0;
    const formatted = rupees.toLocaleString('en-IN', {
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: hasFraction ? 2 : 0
    });
    return includeSymbol ? `₹${formatted}` : formatted;
  }

  function escapeHTML(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function isValidISODate(dateStr) {
    if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return false;
    }
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return (
      dt.getUTCFullYear() === y &&
      dt.getUTCMonth() === m - 1 &&
      dt.getUTCDate() === d
    );
  }

  function validateTransactionInput(tx) {
    if (!tx || typeof tx !== 'object') {
      return { valid: false, error: 'Invalid transaction payload.' };
    }
    const title = typeof tx.title === 'string' ? tx.title.trim() : '';
    if (!title || title.length > 100) {
      return { valid: false, error: 'Transaction title must be between 1 and 100 characters.' };
    }

    const amount = Number(tx.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 10000000) {
      return { valid: false, error: 'Amount must be a positive number up to ₹1,00,00,000.' };
    }

    if (tx.type !== 'expense' && tx.type !== 'income') {
      return { valid: false, error: 'Transaction type must be expense or income.' };
    }

    const allowedCats = tx.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!allowedCats.includes(tx.category)) {
      return { valid: false, error: `Invalid category "${tx.category}" for ${tx.type}.` };
    }

    if (!isValidISODate(tx.date)) {
      return { valid: false, error: 'Please provide a valid date (YYYY-MM-DD).' };
    }

    const paymentMethod = PAYMENT_METHODS.includes(tx.paymentMethod) ? tx.paymentMethod : 'UPI';
    const description = typeof tx.description === 'string' ? tx.description.trim().slice(0, 300) : '';

    return {
      valid: true,
      sanitized: {
        title,
        amount: fromPaise(toPaise(amount)),
        type: tx.type,
        category: tx.category,
        date: tx.date,
        paymentMethod,
        description
      }
    };
  }

  function getDateOffset(daysOffset) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  }

  function getMonthYearStr(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  function generateDefaultData() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentPeriod = getMonthYearStr(now);

    const curr = (day) => {
      const d = new Date(currentYear, currentMonth, Math.min(day, 28));
      return d.toISOString().split('T')[0];
    };

    const prev = (day) => {
      const d = new Date(currentYear, currentMonth - 1, Math.min(day, 28));
      return d.toISOString().split('T')[0];
    };

    const prevPeriod = getMonthYearStr(new Date(currentYear, currentMonth - 1, 1));

    const defaultCategories = {
      'Food & Dining': 3000,
      'Transportation': 1000,
      'Academics': 1500,
      'Entertainment': 1000,
      'Shopping': 1500,
      'Hostel & Living': 1200,
      'Personal Care': 800,
      'Other': 500
    };

    return {
      version: '2.1.0',
      settings: {
        userName: 'Rahul Sharma',
        currency: '₹',
        theme: 'light',
        selectedPeriod: currentPeriod,
        dateFormat: 'YYYY-MM-DD'
      },
      budgets: {
        overallMonthly: 10500,
        categories: { ...defaultCategories },
        history: {
          [currentPeriod]: {
            overallMonthly: 10500,
            categories: { ...defaultCategories }
          },
          [prevPeriod]: {
            overallMonthly: 10500,
            categories: { ...defaultCategories }
          }
        }
      },
      acknowledgedAlerts: {},
      subscriptions: [
        {
          id: 'sub_1',
          name: 'Spotify Student',
          amount: 59,
          frequency: 'Monthly',
          nextBillingDate: getDateOffset(4),
          category: 'Entertainment',
          brandColor: '#1DB954'
        },
        {
          id: 'sub_2',
          name: 'YouTube Premium Student',
          amount: 79,
          frequency: 'Monthly',
          nextBillingDate: getDateOffset(12),
          category: 'Entertainment',
          brandColor: '#FF0000'
        },
        {
          id: 'sub_3',
          name: 'Netflix Mobile',
          amount: 149,
          frequency: 'Monthly',
          nextBillingDate: getDateOffset(18),
          category: 'Entertainment',
          brandColor: '#E50914'
        },
        {
          id: 'sub_4',
          name: 'Google One 100GB Storage',
          amount: 130,
          frequency: 'Monthly',
          nextBillingDate: getDateOffset(25),
          category: 'Academics',
          brandColor: '#4285F4'
        }
      ],
      savingsGoals: [
        {
          id: 'goal_1',
          name: 'New Noise ANC Headphones',
          targetAmount: 3000,
          savedAmount: 1800,
          targetDate: getDateOffset(40),
          category: 'Shopping',
          icon: '🎧'
        },
        {
          id: 'goal_2',
          name: 'Semester Goa Trip',
          targetAmount: 5000,
          savedAmount: 3200,
          targetDate: getDateOffset(75),
          category: 'Entertainment',
          icon: '🏖️'
        },
        {
          id: 'goal_3',
          name: 'Laptop Upgrade Fund',
          targetAmount: 50000,
          savedAmount: 22000,
          targetDate: getDateOffset(240),
          category: 'Academics',
          icon: '💻'
        },
        {
          id: 'goal_4',
          name: 'Emergency Pocket Buffer',
          targetAmount: 2000,
          savedAmount: 1500,
          targetDate: getDateOffset(60),
          category: 'Other',
          icon: '🛡️'
        }
      ],
      transactions: [
        {
          id: 'tx_c_01',
          title: 'Monthly Pocket Money from Parents',
          amount: 10000,
          type: 'income',
          category: 'Monthly Pocket Money',
          date: curr(1),
          paymentMethod: 'UPI',
          description: 'Transferred by Dad for monthly expenses'
        },
        {
          id: 'tx_c_02',
          title: 'Hostel Mess & Room Rent Share',
          amount: 2200,
          type: 'expense',
          category: 'Hostel & Living',
          date: curr(2),
          paymentMethod: 'UPI',
          description: 'Room maintenance and mess advance'
        },
        {
          id: 'tx_c_03',
          title: 'Semester Textbooks & Lab Manuals',
          amount: 1250,
          type: 'expense',
          category: 'Academics',
          date: curr(3),
          paymentMethod: 'UPI',
          description: 'Purchased from campus bookstore'
        },
        {
          id: 'tx_c_04',
          title: 'Canteen Dosa, Samosa & Chai',
          amount: 140,
          type: 'expense',
          category: 'Food & Dining',
          date: curr(4),
          paymentMethod: 'UPI',
          description: 'Snacks with classmates after lecture'
        },
        {
          id: 'tx_c_05',
          title: 'Metro Smart Card Recharge',
          amount: 500,
          type: 'expense',
          category: 'Transportation',
          date: curr(5),
          paymentMethod: 'UPI',
          description: 'Monthly transit card top-up'
        },
        {
          id: 'tx_c_06',
          title: 'Freelance College Website Bug Fix',
          amount: 3500,
          type: 'income',
          category: 'Freelancing',
          date: curr(6),
          paymentMethod: 'UPI',
          description: 'React UI fixes for senior student startup'
        },
        {
          id: 'tx_c_07',
          title: 'Assignment Printing & Xerox Photocopy',
          amount: 85,
          type: 'expense',
          category: 'Academics',
          date: curr(7),
          paymentMethod: 'Cash',
          description: 'Engineering drawing printouts'
        },
        {
          id: 'tx_c_08',
          title: 'Swiggy Dinner with Roommates',
          amount: 380,
          type: 'expense',
          category: 'Food & Dining',
          date: curr(8),
          paymentMethod: 'UPI',
          description: 'Biryani order on exam night'
        },
        {
          id: 'tx_c_09',
          title: 'Weekend Movie Ticket & Popcorn',
          amount: 320,
          type: 'expense',
          category: 'Entertainment',
          date: curr(9),
          paymentMethod: 'UPI',
          description: 'Watched new sci-fi movie with friends'
        },
        {
          id: 'tx_c_11',
          title: 'Shampoo, Soap & Grooming Kit',
          amount: 260,
          type: 'expense',
          category: 'Personal Care',
          date: curr(10),
          paymentMethod: 'UPI',
          description: 'Monthly toiletries from pharmacy'
        },
        {
          id: 'tx_c_12',
          title: 'Auto Rickshaw to College Gate',
          amount: 60,
          type: 'expense',
          category: 'Transportation',
          date: curr(10),
          paymentMethod: 'Cash',
          description: 'Shared auto from metro station'
        },
        {
          id: 'tx_p_01',
          title: 'Monthly Pocket Money from Parents',
          amount: 10000,
          type: 'income',
          category: 'Monthly Pocket Money',
          date: prev(1),
          paymentMethod: 'UPI',
          description: 'Monthly pocket money'
        },
        {
          id: 'tx_p_02',
          title: 'College Merit Scholarship',
          amount: 5000,
          type: 'income',
          category: 'Scholarship',
          date: prev(4),
          paymentMethod: 'Bank Transfer',
          description: 'Semester performance scholarship'
        },
        {
          id: 'tx_p_03',
          title: 'Hostel Maintenance & Mess',
          amount: 2200,
          type: 'expense',
          category: 'Hostel & Living',
          date: prev(2),
          paymentMethod: 'UPI',
          description: 'Hostel dues'
        },
        {
          id: 'tx_p_04',
          title: 'Food & Canteen Total',
          amount: 2450,
          type: 'expense',
          category: 'Food & Dining',
          date: prev(8),
          paymentMethod: 'UPI',
          description: 'Meals and canteen expenses'
        },
        {
          id: 'tx_p_05',
          title: 'Bus Pass & Auto Rides',
          amount: 750,
          type: 'expense',
          category: 'Transportation',
          date: prev(12),
          paymentMethod: 'UPI',
          description: 'Commuting to college'
        },
        {
          id: 'tx_p_06',
          title: 'College Hoodie & Casual Tee',
          amount: 1100,
          type: 'expense',
          category: 'Shopping',
          date: prev(16),
          paymentMethod: 'UPI',
          description: 'Fest hoodie'
        },
        {
          id: 'tx_p_07',
          title: 'Fest Passes & Outing',
          amount: 850,
          type: 'expense',
          category: 'Entertainment',
          date: prev(22),
          paymentMethod: 'UPI',
          description: 'Annual cultural fest concert'
        }
      ]
    };
  }

  class Store {
    constructor(storageArea = null) {
      this.storage = storageArea || (typeof localStorage !== 'undefined' ? localStorage : null);
      this.subscribers = [];
      this.lastStorageError = null;
      this.state = this.load();
    }

    normalizeLoadedState(parsed) {
      const defaults = generateDefaultData();
      const currentPeriod = parsed.settings?.selectedPeriod || getMonthYearStr(new Date());
      const baseCategories = {
        ...defaults.budgets.categories,
        ...(parsed.budgets?.categories || {})
      };
      const baseOverall = Number.isFinite(Number(parsed.budgets?.overallMonthly))
        ? Number(parsed.budgets.overallMonthly)
        : defaults.budgets.overallMonthly;

      const history = parsed.budgets?.history && typeof parsed.budgets.history === 'object'
        ? { ...parsed.budgets.history }
        : {};

      if (!history[currentPeriod]) {
        history[currentPeriod] = {
          overallMonthly: baseOverall,
          categories: { ...baseCategories }
        };
      }

      const cleanTransactions = Array.isArray(parsed.transactions)
        ? parsed.transactions
            .filter(t => t && typeof t === 'object' && isValidISODate(t.date) && Number(t.amount) > 0)
            .map(t => ({
              id: String(t.id || 'tx_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)),
              title: String(t.title || 'Untitled').slice(0, 100),
              amount: fromPaise(toPaise(t.amount)),
              type: t.type === 'income' ? 'income' : 'expense',
              category: String(t.category || 'Other'),
              date: t.date,
              paymentMethod: PAYMENT_METHODS.includes(t.paymentMethod) ? t.paymentMethod : 'UPI',
              description: String(t.description || '').slice(0, 300)
            }))
        : [];

      return {
        version: parsed.version || '2.1.0',
        settings: {
          userName: String(parsed.settings?.userName || 'Rahul Sharma').slice(0, 60),
          currency: '₹',
          theme: parsed.settings?.theme === 'dark' ? 'dark' : 'light',
          selectedPeriod: currentPeriod,
          dateFormat: 'YYYY-MM-DD'
        },
        budgets: {
          overallMonthly: baseOverall,
          categories: baseCategories,
          history
        },
        acknowledgedAlerts: parsed.acknowledgedAlerts && typeof parsed.acknowledgedAlerts === 'object'
          ? { ...parsed.acknowledgedAlerts }
          : {},
        subscriptions: Array.isArray(parsed.subscriptions) ? parsed.subscriptions : [],
        savingsGoals: Array.isArray(parsed.savingsGoals) ? parsed.savingsGoals : [],
        transactions: cleanTransactions
      };
    }

    load() {
      try {
        if (this.storage) {
          const stored = this.storage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === 'object' && Array.isArray(parsed.transactions) && parsed.budgets) {
              return this.normalizeLoadedState(parsed);
            }
          }
        }
      } catch (e) {
        this.lastStorageError = e.message;
      }
      const defaults = generateDefaultData();
      this.save(defaults, false);
      return defaults;
    }

    save(stateToSave = null, shouldNotify = true) {
      if (stateToSave) {
        this.state = stateToSave;
      }
      this.lastStorageError = null;
      try {
        if (this.storage) {
          this.storage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        }
      } catch (e) {
        this.lastStorageError = e.name || e.message || 'Storage unavailable';
      }
      if (shouldNotify) {
        this.notify();
      }
      return !this.lastStorageError;
    }

    subscribe(callback) {
      this.subscribers.push(callback);
      return () => {
        this.subscribers = this.subscribers.filter(sub => sub !== callback);
      };
    }

    notify() {
      this.subscribers.forEach(cb => {
        try {
          cb(this.state);
        } catch (err) {
          // Isolate subscriber errors
        }
      });
    }

    getState() { return this.state; }
    getSettings() { return this.state.settings; }
    getUserName() { return this.state.settings.userName || 'Rahul'; }
    getSelectedPeriod() { return this.state.settings.selectedPeriod || getMonthYearStr(new Date()); }

    setSelectedPeriod(periodStr) {
      if (!/^\d{4}-\d{2}$/.test(periodStr)) return false;
      this.state.settings.selectedPeriod = periodStr;
      if (!this.state.budgets.history[periodStr]) {
        this.state.budgets.history[periodStr] = {
          overallMonthly: this.state.budgets.overallMonthly,
          categories: { ...this.state.budgets.categories }
        };
      }
      this.save();
      return true;
    }

    setTheme(theme) {
      this.state.settings.theme = theme === 'dark' ? 'dark' : 'light';
      this.save();
    }

    updateSettings(newSettings) {
      const clean = { ...newSettings };
      if (typeof clean.userName === 'string') {
        clean.userName = clean.userName.trim().slice(0, 60);
      }
      this.state.settings = { ...this.state.settings, ...clean };
      this.save();
    }

    getTransactions() { return [...this.state.transactions]; }

    getTransactionById(id) {
      return this.state.transactions.find(t => t.id === id) || null;
    }

    isDuplicateRecentTransaction(sanitized) {
      const now = Date.now();
      return this.state.transactions.some(t =>
        t.title.toLowerCase() === sanitized.title.toLowerCase() &&
        toPaise(t.amount) === toPaise(sanitized.amount) &&
        t.type === sanitized.type &&
        t.category === sanitized.category &&
        t.date === sanitized.date &&
        t.createdAt &&
        now - t.createdAt < 10000
      );
    }

    addTransaction(tx, options = { allowDuplicate: false }) {
      const check = validateTransactionInput(tx);
      if (!check.valid) {
        return { success: false, error: check.error };
      }
      if (!options.allowDuplicate && this.isDuplicateRecentTransaction(check.sanitized)) {
        return { success: false, error: 'Duplicate transaction detected. Please wait a moment before adding an identical entry.' };
      }

      const newTx = {
        ...check.sanitized,
        id: 'tx_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
        createdAt: Date.now()
      };
      this.state.transactions.unshift(newTx);

      const triggeredAlerts = newTx.type === 'expense'
        ? this.evaluateCategoryThresholdAlerts(newTx.date.slice(0, 7), newTx.category)
        : [];

      this.save();
      return { success: true, transaction: newTx, alerts: triggeredAlerts };
    }

    updateTransaction(id, updatedFields) {
      const idx = this.state.transactions.findIndex(t => t.id === id);
      if (idx === -1) {
        return { success: false, error: 'Transaction not found.' };
      }

      const existing = this.state.transactions[idx];
      const merged = { ...existing, ...updatedFields };
      const check = validateTransactionInput(merged);
      if (!check.valid) {
        return { success: false, error: check.error };
      }

      this.state.transactions[idx] = {
        ...existing,
        ...check.sanitized
      };

      const oldPeriod = existing.date.slice(0, 7);
      const newPeriod = check.sanitized.date.slice(0, 7);
      this.reconcileThresholdState(oldPeriod, existing.category);
      const triggeredAlerts = check.sanitized.type === 'expense'
        ? this.evaluateCategoryThresholdAlerts(newPeriod, check.sanitized.category)
        : [];

      this.save();
      return { success: true, transaction: this.state.transactions[idx], alerts: triggeredAlerts };
    }

    deleteTransaction(id) {
      const existing = this.getTransactionById(id);
      if (!existing) return false;
      this.state.transactions = this.state.transactions.filter(t => t.id !== id);
      if (existing.type === 'expense') {
        this.reconcileThresholdState(existing.date.slice(0, 7), existing.category);
      }
      this.save();
      return true;
    }

    getBudgets(periodStr = null) {
      const period = periodStr || this.getSelectedPeriod();
      const historyEntry = this.state.budgets.history?.[period];
      if (historyEntry) {
        return {
          overallMonthly: historyEntry.overallMonthly,
          categories: { ...historyEntry.categories }
        };
      }
      return {
        overallMonthly: this.state.budgets.overallMonthly,
        categories: { ...this.state.budgets.categories }
      };
    }

    updateOverallBudget(amount, periodStr = null) {
      const period = periodStr || this.getSelectedPeriod();
      const val = fromPaise(toPaise(amount));
      if (!Number.isFinite(val) || val < 0) return false;

      if (!this.state.budgets.history[period]) {
        this.state.budgets.history[period] = {
          overallMonthly: this.state.budgets.overallMonthly,
          categories: { ...this.state.budgets.categories }
        };
      }
      this.state.budgets.history[period].overallMonthly = val;
      if (period === this.getSelectedPeriod()) {
        this.state.budgets.overallMonthly = val;
      }
      this.save();
      return true;
    }

    updateCategoryBudget(category, amount, periodStr = null) {
      const period = periodStr || this.getSelectedPeriod();
      const val = fromPaise(toPaise(amount));
      if (!EXPENSE_CATEGORIES.includes(category) || !Number.isFinite(val) || val < 0) {
        return false;
      }

      if (!this.state.budgets.history[period]) {
        this.state.budgets.history[period] = {
          overallMonthly: this.state.budgets.overallMonthly,
          categories: { ...this.state.budgets.categories }
        };
      }
      this.state.budgets.history[period].categories[category] = val;
      if (period === this.getSelectedPeriod()) {
        this.state.budgets.categories[category] = val;
      }
      this.reconcileThresholdState(period, category);
      const alerts = this.evaluateCategoryThresholdAlerts(period, category);
      this.save();
      return { success: true, alerts };
    }

    getCategorySpentPaise(periodStr, category) {
      return this.state.transactions.reduce((sumPaise, t) => {
        if (t.type === 'expense' && t.category === category && t.date.startsWith(periodStr)) {
          return sumPaise + toPaise(t.amount);
        }
        return sumPaise;
      }, 0);
    }

    evaluateCategoryThresholdAlerts(periodStr, category) {
      const budgets = this.getBudgets(periodStr);
      const limitPaise = toPaise(budgets.categories[category] || 0);
      if (limitPaise <= 0) return [];

      const spentPaise = this.getCategorySpentPaise(periodStr, category);
      const pct = (spentPaise / limitPaise) * 100;

      const key = `${periodStr}::${category}`;
      const ack = new Set(this.state.acknowledgedAlerts[key] || []);
      const newlyTriggered = [];

      const milestones = [
        { code: '50', check: pct >= 50 && pct < 80, label: `50% of ${category} budget used (${formatINR(fromPaise(spentPaise))} / ${formatINR(fromPaise(limitPaise))})` },
        { code: '80', check: pct >= 80 && pct < 100, label: `Warning: 80% of ${category} budget reached (${formatINR(fromPaise(spentPaise))} / ${formatINR(fromPaise(limitPaise))})` },
        { code: '100', check: spentPaise === limitPaise, label: `Limit reached: 100% of ${category} budget used (${formatINR(fromPaise(limitPaise))})` },
        { code: 'OVER', check: spentPaise > limitPaise, label: `Budget exceeded for ${category} by ${formatINR(fromPaise(spentPaise - limitPaise))}!` }
      ];

      for (const m of milestones) {
        if (m.check && !ack.has(m.code)) {
          ack.add(m.code);
          newlyTriggered.push({
            threshold: m.code,
            category,
            period: periodStr,
            percentage: Number(pct.toFixed(1)),
            message: m.label
          });
        }
      }

      this.state.acknowledgedAlerts[key] = Array.from(ack);
      return newlyTriggered;
    }

    reconcileThresholdState(periodStr, category) {
      const budgets = this.getBudgets(periodStr);
      const limitPaise = toPaise(budgets.categories[category] || 0);
      const key = `${periodStr}::${category}`;
      if (limitPaise <= 0) {
        delete this.state.acknowledgedAlerts[key];
        return;
      }
      const spentPaise = this.getCategorySpentPaise(periodStr, category);
      const pct = (spentPaise / limitPaise) * 100;
      const ack = this.state.acknowledgedAlerts[key] || [];
      this.state.acknowledgedAlerts[key] = ack.filter(code => {
        if (code === '50') return pct >= 50;
        if (code === '80') return pct >= 80;
        if (code === '100') return spentPaise === limitPaise;
        if (code === 'OVER') return spentPaise > limitPaise;
        return false;
      });
    }

    getSubscriptions() { return [...this.state.subscriptions]; }

    addSubscription(sub) {
      const name = String(sub.name || '').trim().slice(0, 80);
      const amount = fromPaise(toPaise(sub.amount));
      if (!name || amount <= 0 || !isValidISODate(sub.nextBillingDate)) {
        return { success: false, error: 'Invalid subscription details.' };
      }
      const newSub = {
        id: 'sub_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        name,
        amount,
        frequency: ['Monthly', 'Yearly', 'Weekly'].includes(sub.frequency) ? sub.frequency : 'Monthly',
        category: EXPENSE_CATEGORIES.includes(sub.category) ? sub.category : 'Entertainment',
        nextBillingDate: sub.nextBillingDate
      };
      this.state.subscriptions.push(newSub);
      this.save();
      return { success: true, subscription: newSub };
    }

    updateSubscription(id, updatedFields) {
      const idx = this.state.subscriptions.findIndex(s => s.id === id);
      if (idx === -1) return null;
      const merged = { ...this.state.subscriptions[idx], ...updatedFields };
      if (!String(merged.name || '').trim() || toPaise(merged.amount) <= 0 || !isValidISODate(merged.nextBillingDate)) {
        return null;
      }
      this.state.subscriptions[idx] = {
        ...merged,
        name: String(merged.name).trim().slice(0, 80),
        amount: fromPaise(toPaise(merged.amount))
      };
      this.save();
      return this.state.subscriptions[idx];
    }

    deleteSubscription(id) {
      this.state.subscriptions = this.state.subscriptions.filter(s => s.id !== id);
      this.save();
    }

    getSavingsGoals() { return [...this.state.savingsGoals]; }

    addSavingsGoal(goal) {
      const name = String(goal.name || '').trim().slice(0, 80);
      const targetAmount = fromPaise(toPaise(goal.targetAmount));
      const savedAmount = Math.max(0, fromPaise(toPaise(goal.savedAmount || 0)));
      if (!name || targetAmount <= 0) {
        return { success: false, error: 'Goal name and positive target amount are required.' };
      }
      const newGoal = {
        id: 'goal_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        name,
        targetAmount,
        savedAmount,
        targetDate: isValidISODate(goal.targetDate) ? goal.targetDate : '',
        icon: String(goal.icon || '🎯').slice(0, 8)
      };
      this.state.savingsGoals.push(newGoal);
      this.save();
      return { success: true, goal: newGoal };
    }

    updateSavingsGoal(id, updatedFields) {
      const idx = this.state.savingsGoals.findIndex(g => g.id === id);
      if (idx === -1) return null;
      const merged = { ...this.state.savingsGoals[idx], ...updatedFields };
      const targetAmount = fromPaise(toPaise(merged.targetAmount));
      const savedAmount = Math.max(0, fromPaise(toPaise(merged.savedAmount || 0)));
      if (!String(merged.name || '').trim() || targetAmount <= 0) {
        return null;
      }
      this.state.savingsGoals[idx] = {
        ...merged,
        name: String(merged.name).trim().slice(0, 80),
        targetAmount,
        savedAmount
      };
      this.save();
      return this.state.savingsGoals[idx];
    }

    adjustSavingsAmount(id, deltaAmount) {
      const goal = this.state.savingsGoals.find(g => g.id === id);
      if (!goal) return null;
      const currentPaise = toPaise(goal.savedAmount || 0);
      const deltaPaise = toPaise(deltaAmount);
      const nextPaise = Math.max(0, currentPaise + deltaPaise);
      goal.savedAmount = fromPaise(nextPaise);
      this.save();
      return goal;
    }

    deleteSavingsGoal(id) {
      this.state.savingsGoals = this.state.savingsGoals.filter(g => g.id !== id);
      this.save();
    }

    resetDefaults() {
      this.state = generateDefaultData();
      this.save();
    }

    clearAll() {
      const currentPeriod = getMonthYearStr(new Date());
      this.state = {
        version: '2.1.0',
        settings: {
          userName: 'Student',
          currency: '₹',
          theme: this.state.settings.theme || 'light',
          selectedPeriod: currentPeriod,
          dateFormat: 'YYYY-MM-DD'
        },
        budgets: {
          overallMonthly: 5000,
          categories: {},
          history: {
            [currentPeriod]: { overallMonthly: 5000, categories: {} }
          }
        },
        acknowledgedAlerts: {},
        subscriptions: [],
        savingsGoals: [],
        transactions: []
      };
      this.save();
    }

    exportJSONString() {
      return JSON.stringify(this.state, null, 2);
    }

    exportJSON() {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(this.exportJSONString());
      const dlAnchor = document.createElement('a');
      dlAnchor.setAttribute('href', dataStr);
      dlAnchor.setAttribute('download', `budgetbuddy_backup_${new Date().toISOString().split('T')[0]}.json`);
      dlAnchor.click();
    }

    importJSON(jsonString) {
      try {
        if (typeof jsonString !== 'string' || jsonString.length > 5000000) {
          throw new Error('Backup file is empty or exceeds maximum allowed size (5 MB).');
        }
        const parsed = JSON.parse(jsonString);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('Invalid BudgetBuddy JSON structure.');
        }
        if (!Array.isArray(parsed.transactions) || !parsed.budgets || typeof parsed.budgets !== 'object') {
          throw new Error('Missing required transactions or budgets fields.');
        }

        const validatedTransactions = [];
        for (let i = 0; i < parsed.transactions.length; i++) {
          const rawTx = parsed.transactions[i];
          const check = validateTransactionInput(rawTx);
          if (!check.valid) {
            throw new Error(`Invalid transaction at index ${i}: ${check.error}`);
          }
          validatedTransactions.push({
            id: typeof rawTx.id === 'string' && rawTx.id.trim()
              ? rawTx.id.trim().slice(0, 64)
              : `tx_imp_${Date.now()}_${i}`,
            ...check.sanitized
          });
        }

        const nextState = this.normalizeLoadedState({
          ...parsed,
          transactions: validatedTransactions
        });

        this.state = nextState;
        this.save();
        return { success: true, importedCount: validatedTransactions.length };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  }

  const exported = {
    STORAGE_KEY,
    EXPENSE_CATEGORIES,
    INCOME_CATEGORIES,
    PAYMENT_METHODS,
    toPaise,
    fromPaise,
    formatINR,
    escapeHTML,
    isValidISODate,
    validateTransactionInput,
    getMonthYearStr,
    generateDefaultData,
    Store
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exported;
  }
  if (global) {
    Object.assign(global, exported);
    if (typeof window !== 'undefined') {
      global.appStore = new Store();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
