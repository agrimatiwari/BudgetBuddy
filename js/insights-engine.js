/* ==========================================================================
   BudgetBuddy - Smart Spending Insights & Financial Health Engine
   All financial totals and percentages computed with integer paise precision.
   ========================================================================== */

(function (global) {
  'use strict';

  const storeHelpers = typeof require !== 'undefined' ? require('./store.js') : global;
  const { toPaise, fromPaise, formatINR } = storeHelpers;

  class InsightsEngine {
    constructor(store) {
      this.store = store;
    }

    parsePeriod(periodStr) {
      if (!periodStr || !/^\d{4}-\d{2}$/.test(periodStr)) {
        const d = new Date();
        return { year: d.getFullYear(), month: d.getMonth() + 1 };
      }
      const [y, m] = periodStr.split('-').map(Number);
      return { year: y, month: m };
    }

    getPreviousPeriodStr(periodStr) {
      const { year, month } = this.parsePeriod(periodStr);
      const prevDate = new Date(year, month - 2, 1);
      const prevY = prevDate.getFullYear();
      const prevM = String(prevDate.getMonth() + 1).padStart(2, '0');
      return `${prevY}-${prevM}`;
    }

    getTransactionsForPeriod(transactions, periodStr) {
      return transactions.filter(t => t.date && t.date.startsWith(periodStr));
    }

    getWeeklySummary(referenceDateStr = null) {
      const ref = referenceDateStr ? new Date(`${referenceDateStr}T00:00:00Z`) : new Date();
      const endMs = Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate());
      const startMs = endMs - 6 * 24 * 60 * 60 * 1000;

      let incomePaise = 0;
      let expensePaise = 0;
      let count = 0;

      for (const t of this.store.getTransactions()) {
        if (!t.date) continue;
        const [y, m, d] = t.date.split('-').map(Number);
        const txMs = Date.UTC(y, m - 1, d);
        if (txMs >= startMs && txMs <= endMs) {
          count++;
          if (t.type === 'income') incomePaise += toPaise(t.amount);
          else if (t.type === 'expense') expensePaise += toPaise(t.amount);
        }
      }

      return {
        totalIncome: fromPaise(incomePaise),
        totalExpenses: fromPaise(expensePaise),
        netBalance: fromPaise(incomePaise - expensePaise),
        transactionCount: count
      };
    }

    getFinancialSummary(periodStr = null) {
      const period = periodStr || this.store.getSelectedPeriod();
      const prevPeriod = this.getPreviousPeriodStr(period);
      const allTx = this.store.getTransactions();

      const currentTx = this.getTransactionsForPeriod(allTx, period);
      const prevTx = this.getTransactionsForPeriod(allTx, prevPeriod);

      let totalIncomePaise = 0;
      let totalExpensesPaise = 0;
      const categoryExpensesPaise = {};
      const dailyExpensesPaise = {};
      let mostExpensiveTx = null;

      currentTx.forEach(t => {
        const amtPaise = toPaise(t.amount);
        if (t.type === 'income') {
          totalIncomePaise += amtPaise;
        } else if (t.type === 'expense') {
          totalExpensesPaise += amtPaise;
          categoryExpensesPaise[t.category] = (categoryExpensesPaise[t.category] || 0) + amtPaise;
          dailyExpensesPaise[t.date] = (dailyExpensesPaise[t.date] || 0) + amtPaise;

          if (!mostExpensiveTx || amtPaise > toPaise(mostExpensiveTx.amount)) {
            mostExpensiveTx = t;
          }
        }
      });

      let prevIncomePaise = 0;
      let prevExpensesPaise = 0;
      prevTx.forEach(t => {
        const amtPaise = toPaise(t.amount);
        if (t.type === 'income') prevIncomePaise += amtPaise;
        else if (t.type === 'expense') prevExpensesPaise += amtPaise;
      });

      let lifetimeBalancePaise = 0;
      allTx.forEach(t => {
        const amtPaise = toPaise(t.amount);
        if (t.type === 'income') lifetimeBalancePaise += amtPaise;
        else if (t.type === 'expense') lifetimeBalancePaise -= amtPaise;
      });

      const budgets = this.store.getBudgets(period);
      const overallBudgetPaise = toPaise(budgets.overallMonthly || 0);
      const remainingBudgetPaise = Math.max(0, overallBudgetPaise - totalExpensesPaise);
      const budgetConsumedPct = overallBudgetPaise > 0
        ? Number(((totalExpensesPaise / overallBudgetPaise) * 100).toFixed(2))
        : 0;

      const monthSavingsPaise = totalIncomePaise - totalExpensesPaise;

      const expenseChangePct = prevExpensesPaise > 0
        ? Number((((totalExpensesPaise - prevExpensesPaise) / prevExpensesPaise) * 100).toFixed(2))
        : null;

      const categoryExpenses = {};
      let topCategory = null;
      let topCategoryPaise = 0;

      for (const [cat, paise] of Object.entries(categoryExpensesPaise)) {
        categoryExpenses[cat] = fromPaise(paise);
        if (paise > topCategoryPaise) {
          topCategoryPaise = paise;
          topCategory = cat;
        }
      }

      const topCategoryAmount = fromPaise(topCategoryPaise);
      const topCategoryPct = totalExpensesPaise > 0 && topCategory
        ? Number(((topCategoryPaise / totalExpensesPaise) * 100).toFixed(2))
        : 0;

      return {
        period,
        prevPeriod,
        totalIncome: fromPaise(totalIncomePaise),
        totalExpenses: fromPaise(totalExpensesPaise),
        availableBalance: fromPaise(lifetimeBalancePaise),
        overallBudget: fromPaise(overallBudgetPaise),
        remainingBudget: fromPaise(remainingBudgetPaise),
        budgetConsumedPct,
        monthSavings: fromPaise(monthSavingsPaise),
        expenseChangePct,
        categoryExpenses,
        topCategory,
        topCategoryAmount,
        topCategoryPct,
        mostExpensiveTx,
        currentTransactions: currentTx
      };
    }

    generateSmartInsights(periodStr = null) {
      const summary = this.getFinancialSummary(periodStr);
      const budgets = this.store.getBudgets(summary.period);
      const insights = [];

      if (summary.topCategory && summary.topCategoryAmount > 0) {
        insights.push({
          id: 'ins_highest_cat',
          type: summary.topCategoryPct > 40 ? 'warning' : 'info',
          icon: '🏆',
          title: `Highest Spending: ${summary.topCategory}`,
          body: `${summary.topCategory} accounts for ${formatINR(summary.topCategoryAmount)} (${summary.topCategoryPct.toFixed(0)}% of your expenses this month).`
        });
      }

      if (summary.mostExpensiveTx) {
        insights.push({
          id: 'ins_max_tx',
          type: 'info',
          icon: '💸',
          title: 'Most Expensive Expense',
          body: `"${summary.mostExpensiveTx.title}" was your biggest single spend at ${formatINR(summary.mostExpensiveTx.amount)} on ${summary.mostExpensiveTx.date}.`
        });
      }

      if (summary.expenseChangePct !== null) {
        if (summary.expenseChangePct < 0) {
          insights.push({
            id: 'ins_mom_down',
            type: 'success',
            icon: '📉',
            title: 'Spent Less Than Last Month',
            body: `You spent ${Math.abs(summary.expenseChangePct).toFixed(0)}% less compared to last month. Outstanding pocket money management!`
          });
        } else if (summary.expenseChangePct > 0) {
          insights.push({
            id: 'ins_mom_up',
            type: summary.expenseChangePct > 15 ? 'warning' : 'info',
            icon: '📈',
            title: 'Spending Up vs Last Month',
            body: `Your total spending is ${summary.expenseChangePct.toFixed(0)}% higher than last month. Check where your extra pocket money went.`
          });
        }
      }

      const approachingCats = [];
      if (budgets.categories) {
        for (const [cat, limit] of Object.entries(budgets.categories)) {
          const spentPaise = toPaise(summary.categoryExpenses[cat] || 0);
          const limitPaise = toPaise(limit);
          if (limitPaise > 0) {
            const pct = (spentPaise / limitPaise) * 100;
            if (spentPaise > limitPaise) {
              insights.push({
                id: `ins_over_${cat}`,
                type: 'danger',
                icon: '🚨',
                title: `${cat} Budget Exceeded!`,
                body: `You spent ${formatINR(fromPaise(spentPaise))} against your ${formatINR(fromPaise(limitPaise))} limit (${formatINR(fromPaise(spentPaise - limitPaise))} over budget).`
              });
            } else if (pct >= 80) {
              approachingCats.push(`${cat} (${pct.toFixed(0)}% used)`);
            }
          }
        }
      }

      if (approachingCats.length > 0) {
        insights.push({
          id: 'ins_budget_close',
          type: 'warning',
          icon: '⚠️',
          title: 'Approaching Budget Limit',
          body: `Watch your spending in: ${approachingCats.join(', ')}.`
        });
      }

      if (summary.totalIncome > 0) {
        if (summary.monthSavings > 0) {
          insights.push({
            id: 'ins_savings_pos',
            type: 'success',
            icon: '💰',
            title: `Monthly Savings: ${formatINR(summary.monthSavings)}`,
            body: `You retained ${formatINR(summary.monthSavings)} (${((summary.monthSavings / summary.totalIncome) * 100).toFixed(0)}% of your pocket money/income) this month!`
          });
        } else if (summary.monthSavings < 0) {
          insights.push({
            id: 'ins_savings_neg',
            type: 'danger',
            icon: '⚠️',
            title: `Deficit this month: ${formatINR(Math.abs(summary.monthSavings))}`,
            body: `You spent ${formatINR(Math.abs(summary.monthSavings))} more than your received allowance this month.`
          });
        }
      }

      return insights;
    }

    calculateFinancialHealth(periodStr = null) {
      const summary = this.getFinancialSummary(periodStr);
      const goals = this.store.getSavingsGoals();

      let cashFlowPts = 0;
      if (summary.totalIncome > 0) {
        const rate = summary.monthSavings / summary.totalIncome;
        if (rate >= 0.20) cashFlowPts = 35;
        else if (rate >= 0.05) cashFlowPts = 25;
        else if (rate >= 0) cashFlowPts = 18;
        else cashFlowPts = 6;
      } else {
        cashFlowPts = 20;
      }

      let budgetPts = 0;
      if (summary.overallBudget > 0) {
        if (summary.budgetConsumedPct <= 80) budgetPts = 30;
        else if (summary.budgetConsumedPct <= 100) budgetPts = 20;
        else budgetPts = 6;
      } else {
        budgetPts = 15;
      }

      const goalsPts = goals.length > 0 ? 20 : 10;
      const stabilityPts = summary.currentTransactions.length > 0 ? 15 : 8;

      const totalScore = Math.min(100, Math.max(0, cashFlowPts + budgetPts + goalsPts + stabilityPts));

      let rating = 'Fair';
      let ratingColor = 'var(--color-highlight)';
      if (totalScore >= 75) {
        rating = 'Excellent';
        ratingColor = 'var(--color-success)';
      } else if (totalScore >= 60) {
        rating = 'Good';
        ratingColor = 'var(--color-primary)';
      } else if (totalScore < 45) {
        rating = 'Needs Care';
        ratingColor = 'var(--color-accent)';
      }

      return {
        score: Math.round(totalScore),
        rating,
        ratingColor,
        factors: [
          { title: 'Pocket Money Retention', score: cashFlowPts, max: 35 },
          { title: 'Budget Discipline', score: budgetPts, max: 30 },
          { title: 'Savings Goals Funding', score: goalsPts, max: 20 },
          { title: 'Daily Spending Stability', score: stabilityPts, max: 15 }
        ]
      };
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { InsightsEngine };
  }
  if (global) {
    global.InsightsEngine = InsightsEngine;
    if (typeof window !== 'undefined' && global.appStore) {
      global.insightsEngine = new InsightsEngine(global.appStore);
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
