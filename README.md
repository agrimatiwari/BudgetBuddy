# BudgetBuddy – Smart Student Expense Tracker

**BudgetBuddy** is an accessible, thoroughly tested personal expense-tracking web application designed specifically for college students. It helps students manage pocket money, track daily expenses, monitor monthly category budgets, build savings, and understand spending habits with a clean, modern fintech interface.

---

## 🌟 Key Highlights & Features

### 1. Dashboard (Clean, Calm & Spacious)
- **Top Bar**: Personalized greeting, current date, selected month dropdown, and **+ Add Transaction** button.
- **Financial Overview**: Total Balance, Total Income, Total Expenses, and Remaining Budget calculated with integer-paise precision.
- **Spending Breakdown & Recent Transactions**: Accessible Chart.js doughnut chart with screen-reader summary and latest 5 student transactions.
- **Monthly Spending Trend & Budget Progress**: 5-month income vs. expenditure bar chart and progress bars with `role="progressbar"` semantics.

### 2. Transaction Management
- Search across titles, categories, and notes.
- Filter by **Type** (All, Expenses, Income), **Category**, and **Date Range** (All, This Month, Last Month, Custom).
- Sort by **Date** and **Amount**, with input validation and duplicate-submission protection.

### 3. Category-Wise Budget Management & History
- Set overall monthly limits and individual category limits.
- Historical monthly budgets are preserved separately per `YYYY-MM` period.
- Threshold alerts fire once per milestone at **50%**, **80%**, **100%**, and **over-limit (>100%)**, automatically reconciling when transactions are edited or deleted.

### 4. Smart Spending Insights & Financial Health
- Data-driven observations: highest spending category, most expensive transaction, month-over-month change, categories approaching budget limits, monthly savings retention, and a 0–100 Financial Health Score.

### 5. Savings Goals, Subscriptions & Spending Calendar
- Track savings goals with one-click `+₹100` / `+₹500` deposits and custom deposit/withdrawal modals.
- Track recurring student subscriptions (Spotify, YouTube Premium, Netflix, Google One) and monthly recurring totals.
- Interactive keyboard-accessible monthly calendar heatmap showing daily spend intensity.

### 6. Accessibility (WCAG 2.1 AA) & Data Backup
- Semantic landmarks, skip-to-content link, associated form labels, focus-trapped modals with `Escape` handling, and ARIA progress bars.
- WCAG AA contrast ratios (`>= 4.5:1`) across both **Light Mode** and **Dark Mode**.
- Full JSON export and strictly validated JSON backup import.

---

## 🛠️ Project Structure

```text
budgetbuddy/
├── index.html                   # Semantic single-page application shell & modals
├── package.json                 # Vitest & JSDOM test configuration
├── server.js                    # Zero-dependency Node.js local static server
├── README.md                    # Documentation, test guide & storage security notice
├── css/
│   ├── variables.css            # WCAG AA color tokens & typography variables
│   ├── base.css                 # Reset, focus rings, skip link & layout shell
│   ├── sidebar.css              # Collapsible sidebar navigation
│   ├── components.css           # Cards, tables, progress bars, modals & toasts
│   └── views.css                # View-specific responsive grids
├── js/
│   ├── store.js                 # Integer-paise Store, validation & persistence
│   ├── insights-engine.js       # Financial aggregation, weekly/monthly summaries & health
│   ├── chart-service.js         # Accessible Chart.js doughnut & trend renderers
│   ├── app.js                   # Hash router, modal focus manager & event controller
│   └── views/
│       ├── dashboard.js         # Dashboard view
│       ├── transactions.js      # Transactions table & multi-filter view
│       ├── budgets.js           # Category & overall budget management view
│       ├── analytics.js         # Smart spending insights & financial health view
│       ├── savings.js           # Savings goals tracker view
│       ├── subscriptions.js     # Recurring subscriptions view
│       ├── calendar.js          # Keyboard-accessible spending calendar view
│       └── settings.js          # Profile, theme switcher & JSON backup view
└── tests/
    └── budgetbuddy.test.js      # Automated Vitest & JSDOM verification suite
```

---

## 🚀 How to Run

### Option A: Node.js Server
```bash
node server.js
# Open http://localhost:3000
```

### Option B: Direct Browser Open
Open `index.html` directly in any modern browser.

---

## 🧪 Automated Testing & Verification

BudgetBuddy uses **Vitest** and **JSDOM** to test financial arithmetic (integer paise precision), transaction validation, category budget threshold alerts (`50%`, `80%`, `100%`, `>100%`), monthly budget history isolation, savings goals, LocalStorage corruption recovery, JSON import validation, XSS escaping, and WCAG accessibility markup.

```bash
npm install
npm test
```

---

## 🔒 Frontend Storage Security Limitations

- **Unencrypted Browser Storage**: BudgetBuddy is an offline-first client-side application using browser `localStorage`. Data is stored in plaintext within the local browser profile and is accessible to any script executing on the same origin or anyone with access to the unlocked device.
- **No Server Authentication or Cloud Sync**: Clearing browser site data erases stored records unless exported via **Settings → Export Backup (JSON)**. Never store passwords, bank account numbers, UPI PINs, or sensitive credentials in transaction notes.
