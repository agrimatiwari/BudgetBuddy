/* ==========================================================================
   BudgetBuddy - Central Data Store & LocalStorage Persistence
   Designed specifically for college students with Indian Rupees (₹) formatting
   ========================================================================== */

const STORAGE_KEY = 'budgetbuddy_student_store_v1';

// Predefined College Student Categories
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

// Helper to format currency in Indian numbering system (e.g., ₹1,500, ₹12,500, ₹1,45,555)
function formatINR(amount, includeSymbol = true) {
  const num = Math.round(Number(amount) || 0);
  const formatted = num.toLocaleString('en-IN');
  return includeSymbol ? `₹${formatted}` : formatted;
}

// Helpers for dates
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

// Generate authentic college student sample data
function generateDefaultData() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const curr = (day) => {
    const d = new Date(currentYear, currentMonth, Math.min(day, 28));
    return d.toISOString().split('T')[0];
  };

  const prev = (day) => {
    const d = new Date(currentYear, currentMonth - 1, Math.min(day, 28));
    return d.toISOString().split('T')[0];
  };

  return {
    version: '2.0.0',
    settings: {
      userName: 'Rahul Sharma',
      currency: '₹',
      theme: 'light',
      selectedPeriod: getMonthYearStr(now),
      dateFormat: 'YYYY-MM-DD'
    },
    budgets: {
      overallMonthly: 10500,
      categories: {
        'Food & Dining': 3000,
        'Transportation': 1000,
        'Academics': 1500,
        'Entertainment': 1000,
        'Shopping': 1500,
        'Hostel & Living': 1200,
        'Personal Care': 800,
        'Other': 500
      }
    },
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
      // Current Month Realistic Student Transactions
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

      // Previous Month Sample Data (For Trend & MoM comparison)
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
  constructor() {
    this.subscribers = [];
    this.state = this.load();
  }

  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.transactions && parsed.budgets) {
          // Remove laundry if present
          parsed.transactions = parsed.transactions.filter(t => 
            !(t.title && t.title.toLowerCase().includes('laundry')) &&
            !(t.description && t.description.toLowerCase().includes('laundry'))
          );
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse localStorage, resetting defaults', e);
    }
    const defaults = generateDefaultData();
    this.save(defaults);
    return defaults;
  }

  save(stateToSave = null) {
    if (stateToSave) {
      this.state = stateToSave;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Could not save to localStorage', e);
    }
    this.notify();
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
        console.error('Error in store subscriber:', err);
      }
    });
  }

  getState() { return this.state; }
  getSettings() { return this.state.settings; }
  getUserName() { return this.state.settings.userName || 'Rahul'; }
  getSelectedPeriod() { return this.state.settings.selectedPeriod || getMonthYearStr(new Date()); }

  setSelectedPeriod(periodStr) {
    this.state.settings.selectedPeriod = periodStr;
    this.save();
  }

  setTheme(theme) {
    this.state.settings.theme = theme;
    this.save();
  }

  updateSettings(newSettings) {
    this.state.settings = { ...this.state.settings, ...newSettings };
    this.save();
  }

  // Transactions
  getTransactions() { return [...this.state.transactions]; }

  getTransactionById(id) {
    return this.state.transactions.find(t => t.id === id);
  }

  addTransaction(tx) {
    const newTx = {
      ...tx,
      id: 'tx_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      amount: parseFloat(tx.amount) || 0
    };
    this.state.transactions.unshift(newTx);
    this.save();
    return newTx;
  }

  updateTransaction(id, updatedFields) {
    const idx = this.state.transactions.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.state.transactions[idx] = {
        ...this.state.transactions[idx],
        ...updatedFields,
        amount: parseFloat(updatedFields.amount) || this.state.transactions[idx].amount
      };
      this.save();
      return this.state.transactions[idx];
    }
    return null;
  }

  deleteTransaction(id) {
    this.state.transactions = this.state.transactions.filter(t => t.id !== id);
    this.save();
  }

  // Budgets
  getBudgets() { return this.state.budgets; }

  updateOverallBudget(amount) {
    this.state.budgets.overallMonthly = parseFloat(amount) || 0;
    this.save();
  }

  updateCategoryBudget(category, amount) {
    if (!this.state.budgets.categories) {
      this.state.budgets.categories = {};
    }
    this.state.budgets.categories[category] = parseFloat(amount) || 0;
    this.save();
  }

  // Subscriptions
  getSubscriptions() { return [...this.state.subscriptions]; }

  addSubscription(sub) {
    const newSub = {
      ...sub,
      id: 'sub_' + Date.now(),
      amount: parseFloat(sub.amount) || 0
    };
    this.state.subscriptions.push(newSub);
    this.save();
    return newSub;
  }

  updateSubscription(id, updatedFields) {
    const idx = this.state.subscriptions.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.state.subscriptions[idx] = {
        ...this.state.subscriptions[idx],
        ...updatedFields,
        amount: parseFloat(updatedFields.amount) || this.state.subscriptions[idx].amount
      };
      this.save();
      return this.state.subscriptions[idx];
    }
    return null;
  }

  deleteSubscription(id) {
    this.state.subscriptions = this.state.subscriptions.filter(s => s.id !== id);
    this.save();
  }

  // Savings Goals
  getSavingsGoals() { return [...this.state.savingsGoals]; }

  addSavingsGoal(goal) {
    const newGoal = {
      ...goal,
      id: 'goal_' + Date.now(),
      targetAmount: parseFloat(goal.targetAmount) || 0,
      savedAmount: parseFloat(goal.savedAmount) || 0
    };
    this.state.savingsGoals.push(newGoal);
    this.save();
    return newGoal;
  }

  updateSavingsGoal(id, updatedFields) {
    const idx = this.state.savingsGoals.findIndex(g => g.id === id);
    if (idx !== -1) {
      this.state.savingsGoals[idx] = {
        ...this.state.savingsGoals[idx],
        ...updatedFields,
        targetAmount: parseFloat(updatedFields.targetAmount) || this.state.savingsGoals[idx].targetAmount,
        savedAmount: parseFloat(updatedFields.savedAmount) || this.state.savingsGoals[idx].savedAmount
      };
      this.save();
      return this.state.savingsGoals[idx];
    }
    return null;
  }

  adjustSavingsAmount(id, deltaAmount) {
    const goal = this.state.savingsGoals.find(g => g.id === id);
    if (goal) {
      goal.savedAmount = Math.max(0, (goal.savedAmount || 0) + parseFloat(deltaAmount));
      this.save();
      return goal;
    }
    return null;
  }

  deleteSavingsGoal(id) {
    this.state.savingsGoals = this.state.savingsGoals.filter(g => g.id !== id);
    this.save();
  }

  // Sample Data Reset
  resetDefaults() {
    this.state = generateDefaultData();
    this.save();
  }

  clearAll() {
    this.state = {
      version: '2.0.0',
      settings: {
        userName: 'Student',
        currency: '₹',
        theme: this.state.settings.theme || 'light',
        selectedPeriod: getMonthYearStr(new Date()),
        dateFormat: 'YYYY-MM-DD'
      },
      budgets: {
        overallMonthly: 5000,
        categories: {}
      },
      subscriptions: [],
      savingsGoals: [],
      transactions: []
    };
    this.save();
  }

  exportJSON() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.state, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `budgetbuddy_backup_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchor.click();
  }

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.transactions) || !parsed.budgets) {
        throw new Error('Invalid BudgetBuddy JSON format.');
      }
      this.state = {
        version: parsed.version || '2.0.0',
        settings: {
          userName: parsed.settings?.userName || 'Rahul Sharma',
          currency: '₹',
          theme: parsed.settings?.theme || this.state.settings.theme || 'light',
          selectedPeriod: parsed.settings?.selectedPeriod || getMonthYearStr(new Date()),
          dateFormat: 'YYYY-MM-DD'
        },
        budgets: {
          overallMonthly: parseFloat(parsed.budgets.overallMonthly) || 10500,
          categories: parsed.budgets.categories || {}
        },
        subscriptions: Array.isArray(parsed.subscriptions) ? parsed.subscriptions : [],
        savingsGoals: Array.isArray(parsed.savingsGoals) ? parsed.savingsGoals : [],
        transactions: parsed.transactions.map(t => ({
          ...t,
          amount: parseFloat(t.amount) || 0
        }))
      };
      this.save();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

// Global Store Instance
window.appStore = new Store();
