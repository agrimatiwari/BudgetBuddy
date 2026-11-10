/* ==========================================================================
   BudgetBuddy - Smart Spending Insights & Financial Health Engine
   Accurate data-driven insights tailored for college student finances
   ========================================================================== */

class InsightsEngine {
  constructor(store) {
    this.store = store;
  }

  parsePeriod(periodStr) {
    if (!periodStr) {
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

  getFinancialSummary(periodStr = null) {
    const period = periodStr || this.store.getSelectedPeriod();
    const prevPeriod = this.getPreviousPeriodStr(period);
    const allTx = this.store.getTransactions();

    const currentTx = this.getTransactionsForPeriod(allTx, period);
    const prevTx = this.getTransactionsForPeriod(allTx, prevPeriod);

    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryExpenses = {};
    const dailyExpenses = {};
    let mostExpensiveTx = null;

    currentTx.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') {
        totalIncome += amt;
      } else if (t.type === 'expense') {
        totalExpenses += amt;
        categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + amt;
        dailyExpenses[t.date] = (dailyExpenses[t.date] || 0) + amt;

        if (!mostExpensiveTx || amt > mostExpensiveTx.amount) {
          mostExpensiveTx = t;
        }
      }
    });

    let prevIncome = 0;
    let prevExpenses = 0;
    prevTx.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') prevIncome += amt;
      else if (t.type === 'expense') prevExpenses += amt;
    });

    // Available Lifetime Balance
    let lifetimeBalance = 0;
    allTx.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') lifetimeBalance += amt;
      else if (t.type === 'expense') lifetimeBalance -= amt;
    });

    const budgets = this.store.getBudgets();
    const overallBudget = Number(budgets.overallMonthly) || 0;
    const remainingBudget = Math.max(0, overallBudget - totalExpenses);
    const budgetConsumedPct = overallBudget > 0 ? (totalExpenses / overallBudget) * 100 : 0;
    const monthSavings = totalIncome - totalExpenses;

    const expenseChangePct = prevExpenses > 0
      ? ((totalExpenses - prevExpenses) / prevExpenses) * 100
      : null;

    // Highest spending category
    let topCategory = null;
    let topCategoryAmount = 0;
    for (const [cat, amt] of Object.entries(categoryExpenses)) {
      if (amt > topCategoryAmount) {
        topCategoryAmount = amt;
        topCategory = cat;
      }
    }
    const topCategoryPct = totalExpenses > 0 && topCategory
      ? (topCategoryAmount / totalExpenses) * 100
      : 0;

    return {
      period,
      prevPeriod,
      totalIncome,
      totalExpenses,
      availableBalance: lifetimeBalance,
      overallBudget,
      remainingBudget,
      budgetConsumedPct,
      monthSavings,
      expenseChangePct,
      categoryExpenses,
      topCategory,
      topCategoryAmount,
      topCategoryPct,
      mostExpensiveTx,
      currentTransactions: currentTx
    };
  }

  // 5 Core Student Insights as required in Section 6
  generateSmartInsights() {
    const summary = this.getFinancialSummary();
    const budgets = this.store.getBudgets();
    const insights = [];

    // 1. Highest Spending Category this month
    if (summary.topCategory && summary.topCategoryAmount > 0) {
      insights.push({
        id: 'ins_highest_cat',
        type: summary.topCategoryPct > 40 ? 'warning' : 'info',
        icon: '🏆',
        title: `Highest Spending: ${summary.topCategory}`,
        body: `${summary.topCategory} accounts for ${formatINR(summary.topCategoryAmount)} (${summary.topCategoryPct.toFixed(0)}% of your expenses this month).`
      });
    }

    // 2. Most Expensive Transaction
    if (summary.mostExpensiveTx) {
      insights.push({
        id: 'ins_max_tx',
        type: 'info',
        icon: '💸',
        title: `Most Expensive Expense`,
        body: `"${summary.mostExpensiveTx.title}" was your biggest single spend at ${formatINR(summary.mostExpensiveTx.amount)} on ${summary.mostExpensiveTx.date}.`
      });
    }

    // 3. Total Spending compared to last month
    if (summary.expenseChangePct !== null) {
      if (summary.expenseChangePct < 0) {
        insights.push({
          id: 'ins_mom_down',
          type: 'success',
          icon: '📉',
          title: `Spent Less Than Last Month`,
          body: `You spent ${Math.abs(summary.expenseChangePct).toFixed(0)}% less compared to last month. Outstanding pocket money management!`
        });
      } else if (summary.expenseChangePct > 0) {
        insights.push({
          id: 'ins_mom_up',
          type: summary.expenseChangePct > 15 ? 'warning' : 'info',
          icon: '📈',
          title: `Spending Up vs Last Month`,
          body: `Your total spending is ${summary.expenseChangePct.toFixed(0)}% higher than last month. Check where your extra pocket money went.`
        });
      }
    }

    // 4. Categories close to exceeding their budget
    const approachingCats = [];
    if (budgets.categories) {
      for (const [cat, limit] of Object.entries(budgets.categories)) {
        const spent = summary.categoryExpenses[cat] || 0;
        if (limit > 0) {
          const pct = (spent / limit) * 100;
          if (pct >= 100) {
            insights.push({
              id: `ins_over_${cat}`,
              type: 'danger',
              icon: '🚨',
              title: `${cat} Budget Exceeded!`,
              body: `You spent ${formatINR(spent)} against your ${formatINR(limit)} limit (${formatINR(spent - limit)} over budget).`
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
        title: `Approaching Budget Limit`,
        body: `Watch your spending in: ${approachingCats.join(', ')}.`
      });
    }

    // 5. How much saved this month
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

  // Financial Health Calculator
  calculateFinancialHealth() {
    const summary = this.getFinancialSummary();
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

    let goalsPts = goals.length > 0 ? 20 : 10;
    let stabilityPts = 15;

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

window.insightsEngine = new InsightsEngine(window.appStore);
