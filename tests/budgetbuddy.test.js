import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

const {
  STORAGE_KEY,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  toPaise,
  fromPaise,
  formatINR,
  escapeHTML,
  Store
} = require('../js/store.js');

const { InsightsEngine } = require('../js/insights-engine.js');

function createMockStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
    clear: () => { Object.keys(data).forEach(k => delete data[k]); },
    _raw: data
  };
}

describe('1. Financial Precision & Currency Formatting', () => {
  it('avoids IEEE 754 floating-point drift using integer paise internally', () => {
    const totalPaise = toPaise(0.1) + toPaise(0.2);
    expect(totalPaise).toBe(30);
    expect(fromPaise(totalPaise)).toBe(0.3);
    expect(formatINR(fromPaise(totalPaise))).toBe('₹0.30');
  });

  it('formats Indian Rupee numbering system accurately', () => {
    expect(formatINR(1500)).toBe('₹1,500');
    expect(formatINR(145555)).toBe('₹1,45,555');
    expect(formatINR(249.5)).toBe('₹249.50');
  });
});

describe('2. Expense & Income Management + Validation', () => {
  let storage;
  let store;
  let engine;

  beforeEach(() => {
    storage = createMockStorage();
    store = new Store(storage);
    store.clearAll();
    store.setSelectedPeriod('2026-11');
    engine = new InsightsEngine(store);
  });

  it('adds, edits, and deletes expenses and updates dashboard summaries', () => {
    const addRes = store.addTransaction({
      title: 'Canteen Lunch',
      amount: 145.5,
      type: 'expense',
      category: 'Food & Dining',
      date: '2026-11-12',
      paymentMethod: 'UPI'
    });
    expect(addRes.success).toBe(true);
    expect(engine.getFinancialSummary('2026-11').totalExpenses).toBe(145.5);

    const editRes = store.updateTransaction(addRes.transaction.id, { amount: 200 });
    expect(editRes.success).toBe(true);
    expect(engine.getFinancialSummary('2026-11').totalExpenses).toBe(200);

    const deleted = store.deleteTransaction(addRes.transaction.id);
    expect(deleted).toBe(true);
    expect(engine.getFinancialSummary('2026-11').totalExpenses).toBe(0);
  });

  it('adds, edits, and deletes income entries and updates available balance', () => {
    const inc = store.addTransaction({
      title: 'Pocket Money',
      amount: 5000,
      type: 'income',
      category: 'Monthly Pocket Money',
      date: '2026-11-01'
    });
    expect(inc.success).toBe(true);

    store.addTransaction({
      title: 'Bus Pass',
      amount: 600,
      type: 'expense',
      category: 'Transportation',
      date: '2026-11-02'
    });

    let summary = engine.getFinancialSummary('2026-11');
    expect(summary.totalIncome).toBe(5000);
    expect(summary.availableBalance).toBe(4400);

    store.updateTransaction(inc.transaction.id, { amount: 6000 });
    summary = engine.getFinancialSummary('2026-11');
    expect(summary.totalIncome).toBe(6000);
    expect(summary.availableBalance).toBe(5400);

    store.deleteTransaction(inc.transaction.id);
    expect(engine.getFinancialSummary('2026-11').availableBalance).toBe(-600);
  });

  it('rejects missing fields, invalid amounts, invalid dates, and mismatched categories', () => {
    expect(store.addTransaction({ title: '', amount: 100, type: 'expense', category: 'Food & Dining', date: '2026-11-10' }).success).toBe(false);
    expect(store.addTransaction({ title: 'Test', amount: 0, type: 'expense', category: 'Food & Dining', date: '2026-11-10' }).success).toBe(false);
    expect(store.addTransaction({ title: 'Test', amount: -50, type: 'expense', category: 'Food & Dining', date: '2026-11-10' }).success).toBe(false);
    expect(store.addTransaction({ title: 'Test', amount: 100, type: 'expense', category: 'Food & Dining', date: '2026-02-30' }).success).toBe(false);
    expect(store.addTransaction({ title: 'Test', amount: 100, type: 'expense', category: 'Scholarship', date: '2026-11-10' }).success).toBe(false);
    expect(INCOME_CATEGORIES).toContain('Scholarship');
    expect(EXPENSE_CATEGORIES).toContain('Food & Dining');
  });
});

describe('3. Category-wise Budgets, Threshold Alerts & Monthly History', () => {
  let store;
  let engine;

  beforeEach(() => {
    store = new Store(createMockStorage());
    store.clearAll();
    store.setSelectedPeriod('2026-11');
    store.updateCategoryBudget('Food & Dining', 1000, '2026-11');
    engine = new InsightsEngine(store);
  });

  it('triggers alerts at 50%, 80%, 100%, and >100% without duplicating the same threshold', () => {
    const r1 = store.addTransaction({ title: 'Meal 1', amount: 500, type: 'expense', category: 'Food & Dining', date: '2026-11-05' });
    expect(r1.alerts.map(a => a.threshold)).toEqual(['50']);

    const r2 = store.addTransaction({ title: 'Meal 2', amount: 100, type: 'expense', category: 'Food & Dining', date: '2026-11-06' });
    expect(r2.alerts).toEqual([]);

    const r3 = store.addTransaction({ title: 'Meal 3', amount: 200, type: 'expense', category: 'Food & Dining', date: '2026-11-07' });
    expect(r3.alerts.map(a => a.threshold)).toEqual(['80']);

    const r4 = store.addTransaction({ title: 'Meal 4', amount: 200, type: 'expense', category: 'Food & Dining', date: '2026-11-08' });
    expect(r4.alerts.map(a => a.threshold)).toEqual(['100']);

    const r5 = store.addTransaction({ title: 'Meal 5', amount: 150, type: 'expense', category: 'Food & Dining', date: '2026-11-09' });
    expect(r5.alerts.map(a => a.threshold)).toEqual(['OVER']);
  });

  it('reconciles budget progress and alerts when an expense is edited or deleted', () => {
    const tx = store.addTransaction({ title: 'Big Dinner', amount: 900, type: 'expense', category: 'Food & Dining', date: '2026-11-05' }).transaction;
    expect(engine.getFinancialSummary('2026-11').categoryExpenses['Food & Dining']).toBe(900);

    store.deleteTransaction(tx.id);
    expect(engine.getFinancialSummary('2026-11').categoryExpenses['Food & Dining'] || 0).toBe(0);

    const reAdd = store.addTransaction({ title: 'Lunch', amount: 500, type: 'expense', category: 'Food & Dining', date: '2026-11-10' });
    expect(reAdd.alerts.map(a => a.threshold)).toEqual(['50']);
  });

  it('tracks monthly budgets separately and preserves previous months budget records', () => {
    store.updateCategoryBudget('Food & Dining', 2500, '2026-10');
    store.updateCategoryBudget('Food & Dining', 3200, '2026-11');

    expect(store.getBudgets('2026-10').categories['Food & Dining']).toBe(2500);
    expect(store.getBudgets('2026-11').categories['Food & Dining']).toBe(3200);
  });

  it('computes accurate weekly summaries', () => {
    store.addTransaction({ title: 'Day 1', amount: 200, type: 'expense', category: 'Food & Dining', date: '2026-11-06' });
    store.addTransaction({ title: 'Day 7', amount: 350, type: 'expense', category: 'Academics', date: '2026-11-12' });
    store.addTransaction({ title: 'Outside 7d', amount: 900, type: 'expense', category: 'Shopping', date: '2026-11-01' });

    const weekly = engine.getWeeklySummary('2026-11-12');
    expect(weekly.totalExpenses).toBe(550);
    expect(weekly.transactionCount).toBe(2);
  });
});

describe('4. Savings Goals Management', () => {
  it('creates, edits, deposits, withdraws, and deletes savings goals accurately', () => {
    const store = new Store(createMockStorage());
    store.clearAll();

    const created = store.addSavingsGoal({ name: 'Laptop Fund', targetAmount: 40000, savedAmount: 10000 });
    expect(created.success).toBe(true);

    store.adjustSavingsAmount(created.goal.id, 5000);
    expect(store.getSavingsGoals()[0].savedAmount).toBe(15000);

    store.adjustSavingsAmount(created.goal.id, -99999);
    expect(store.getSavingsGoals()[0].savedAmount).toBe(0);

    store.updateSavingsGoal(created.goal.id, { targetAmount: 50000, savedAmount: 25000 });
    const goal = store.getSavingsGoals()[0];
    expect((goal.savedAmount / goal.targetAmount) * 100).toBe(50);

    store.deleteSavingsGoal(goal.id);
    expect(store.getSavingsGoals()).toHaveLength(0);
  });
});

describe('5. LocalStorage Persistence, Corruption Recovery, Import/Export & Security', () => {
  it('persists data across store reloads and recovers safely from corrupted JSON', () => {
    const storage = createMockStorage();
    const store1 = new Store(storage);
    store1.clearAll();
    store1.addTransaction({ title: 'Books', amount: 450, type: 'expense', category: 'Academics', date: '2026-11-11' });

    const store2 = new Store(storage);
    expect(store2.getTransactions()).toHaveLength(1);
    expect(store2.getTransactions()[0].title).toBe('Books');

    storage.setItem(STORAGE_KEY, '{corrupted_json:::');
    const store3 = new Store(storage);
    expect(Array.isArray(store3.getTransactions())).toBe(true);
  });

  it('handles LocalStorage quota/unavailable errors gracefully without throwing', () => {
    const brokenStorage = {
      getItem: () => null,
      setItem: () => { throw new Error('QuotaExceededError'); }
    };
    const store = new Store(brokenStorage);
    const res = store.addTransaction({ title: 'Coffee', amount: 80, type: 'expense', category: 'Food & Dining', date: '2026-11-12' });
    expect(res.success).toBe(true);
    expect(store.lastStorageError).toBeTruthy();
  });

  it('validates imported JSON and prevents invalid files from overwriting existing data', () => {
    const store = new Store(createMockStorage());
    store.clearAll();
    store.addTransaction({ title: 'Existing Record', amount: 500, type: 'expense', category: 'Food & Dining', date: '2026-11-10' });

    const badImport = store.importJSON(JSON.stringify({
      budgets: { overallMonthly: 5000 },
      transactions: [{ title: 'Bad', amount: -100, type: 'expense', category: 'Food & Dining', date: '2026-11-10' }]
    }));
    expect(badImport.success).toBe(false);
    expect(store.getTransactions()).toHaveLength(1);
    expect(store.getTransactions()[0].title).toBe('Existing Record');

    const exported = store.exportJSONString();
    store.clearAll();
    expect(store.getTransactions()).toHaveLength(0);

    const goodImport = store.importJSON(exported);
    expect(goodImport.success).toBe(true);
    expect(store.getTransactions()).toHaveLength(1);
    expect(store.getTransactions()[0].title).toBe('Existing Record');
  });

  it('escapes HTML injection payloads in user-supplied text', () => {
    const payload = `<script>alert('xss')</script><img src=x onerror=alert(1)>`;
    const escaped = escapeHTML(payload);
    expect(escaped).not.toContain('<script>');
    expect(escaped).not.toContain('<img');
    expect(escaped).toContain('&lt;script&gt;');
  });

  it('verifies semantic HTML landmarks, labels, and modal ARIA attributes in index.html', () => {
    const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    expect(doc.querySelector('main#main-content')).not.toBeNull();
    expect(doc.querySelector('nav[aria-label]')).not.toBeNull();
    expect(doc.querySelector('.skip-link')).not.toBeNull();

    const inputs = Array.from(doc.querySelectorAll('input:not([type="hidden"]), select, textarea'));
    for (const input of inputs) {
      const id = input.getAttribute('id');
      const hasForLabel = id ? doc.querySelector(`label[for="${id}"]`) !== null : false;
      const hasAria = Boolean(input.getAttribute('aria-label') || input.getAttribute('aria-labelledby'));
      expect(hasForLabel || hasAria).toBe(true);
    }

    const modals = Array.from(doc.querySelectorAll('.modal-overlay'));
    expect(modals.length).toBeGreaterThan(0);
    for (const modal of modals) {
      expect(['dialog', 'alertdialog']).toContain(modal.getAttribute('role'));
      expect(modal.getAttribute('aria-modal')).toBe('true');
    }
  });
});
