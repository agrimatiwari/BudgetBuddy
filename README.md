# BudgetBuddy – Smart Student Expense Tracker

**BudgetBuddy** is a personal expense-tracking web application designed specifically for college students. It helps students manage their pocket money, track daily expenses, monitor category budgets, build savings, and understand their spending habits with a clean, modern, and uncluttered fintech interface.

---

## 🌟 Key Highlights & Features

### 1. Dashboard (Clean, Calm & Spacious)
- **Top Bar**: Personalized greeting (*"Good afternoon, Rahul! 👋"*), current date, selected month dropdown, and a prominent **+ Add Transaction** button.
- **Financial Overview (Only 4 Summary Cards)**:
  1. 💳 **Total Balance** – Current available savings and cash reserve.
  2. 📈 **Total Income** – Pocket money and earnings received during the selected month.
  3. 📉 **Total Expenses** – Total spent during the selected month.
  4. 🎯 **Remaining Budget** – Safe amount remaining from the monthly budget cap.
- **Main Dashboard Layout (Two-Column)**:
  - **Left Section – Spending Breakdown**: Simple Chart.js doughnut chart showing expenses by category with a compact legend displaying category names, percentages, and amounts in Indian Rupees (`₹`).
  - **Right Section – Recent Transactions**: The latest five student transactions showing item name, category, date, and amount (green for income, contrasting coral for expenses) with a "View All" link.
- **Bottom Section**:
  - **Monthly Spending Trend Chart**: Compact, clear bar chart tracking monthly income vs. expenditure.
  - **Monthly Budget Progress**: Clean progress bar of the overall monthly limit alongside key category meters.

*No unnecessary widgets, no corporate clutter, and no repeated information on the dashboard.*

---

### 2. Transaction Management
- Dedicated transactions page with search across titles and notes.
- Multi-filtering by **Type** (All, Expenses, Income), **Category**, and **Date Range** (All, This Month, Last Month, Custom).
- Sorting by **Date** (Newest / Oldest) and **Amount** (High to Low / Low to High).
- Summary bar displaying matching transaction count, total inflow, and total outflow.
- Clean modal for adding, editing, and deleting transactions with Indian student payment modes (UPI, Cash, Debit Card, Net Banking).

---

### 3. Budget Management
- Set an overall monthly spending limit (e.g. ₹10,500).
- Set individual monthly category budgets:
  - Food & Dining: ₹3,000
  - Transportation: ₹1,000
  - Academics: ₹1,500
  - Entertainment: ₹1,000
  - Shopping: ₹1,500
  - Hostel & Living: ₹1,200
  - Personal Care: ₹800
  - Other: ₹500
- Visual consumption progress bars for each category.
- Color-coded alerts for categories approaching limits (≥ 80%) or exceeded (≥ 100%).

---

### 4. Smart Spending Insights
Dedicated analytics page featuring 5 core student insights:
1. **Highest spending category** this month (with amount and percentage).
2. **Most expensive transaction** of the month.
3. **Total spending compared to last month** (percentage change).
4. **Categories close to exceeding their budget**.
5. **How much you saved** this month (savings retention).
- **Financial Health Score (0–100)** with transparent student factors.

---

### 5. Savings Goals
- Set and track student goals:
  - 🎧 *New Noise ANC Headphones* – ₹3,000
  - 🏖️ *Semester Goa Trip* – ₹5,000
  - 💻 *Laptop Upgrade Fund* – ₹50,000
  - 🛡️ *Emergency Pocket Buffer* – ₹2,000
- Progress bars and days remaining countdown.
- One-click quick deposit (+₹100, +₹500) or custom add/withdraw funds.

---

### 6. Subscription Tracker
- Track recurring student plans:
  - *Spotify Student* (₹59/month)
  - *YouTube Premium Student* (₹79/month)
  - *Netflix Mobile* (₹149/month)
  - *Google One 100GB* (₹130/month)
- Monthly subscription commitment calculation in ₹.
- Real-time days-until-renewal countdowns (*"Due in 4d"*, *"Due Today"*).

---

### 7. Spending Calendar
- Monthly interactive calendar showing daily expenditure in ₹.
- Subtle color indicators for spending intensity (Low, Moderate, High Spend).
- Click any date to view all transactions recorded on that day or quickly log an expense.

---

### 8. Settings & Privacy
- Customize student display name.
- Complete **Light Theme** (`#F7F8FA`) and **Dark Theme** (`#14171D`) with seamless toggle.
- 100% private, offline **LocalStorage** persistence.
- Export and import data as JSON.
- Reset to realistic college student sample data anytime.

---

## 🎨 Color Palette

| Token | Light Mode | Dark Mode | Role |
|---|---|---|---|
| Primary | `#287C72` | `#69B6A5` | Brand, Hostel, Progress |
| Secondary | `#8174C8` | `#A99BE8` | Academics, Balance card |
| Accent | `#E98778` | `#E98791` | Food & Dining, Expenses |
| Highlight | `#E8B75D` | `#E8B75D` | Shopping, Warnings |
| Success | `#48A878` | `#59C58E` | Income, Personal Care |
| Blue | `#729BC4` | `#86AEDB` | Transportation, Budget remaining |
| Background | `#F7F8FA` | `#14171D` | Main canvas |
| Cards | `#FFFFFF` | `#202630` | Card surfaces |
| Text Primary | `#252A31` | `#F1F3F5` | Headings & amounts |
| Text Secondary | `#858B96` | `#A0A8B4` | Subtitles & metadata |

---

## 📁 File Structure

```text
expensify/
├── index.html                   # Clean SPA markup & accessible modals
├── server.js                    # Local static server
├── README.md                    # Documentation
├── css/
│   ├── variables.css            # Light & Dark color tokens, radii, shadows
│   ├── base.css                 # Reset, typography, app shell, sticky header
│   ├── sidebar.css              # 8-section clean sidebar navigation
│   ├── components.css           # 4 summary cards, tables, buttons, modals, toasts
│   └── views.css                # Spacious layouts for Dashboard, Budgets, Calendar, etc.
└── js/
    ├── store.js                 # LocalStorage persistence, student sample data & formatINR
    ├── insights-engine.js       # 5 core student insights & health calculation
    ├── chart-service.js         # Chart.js instances adapted for INR & themes
    ├── app.js                   # Client-side router, modals, clock & controller
    └── views/
        ├── dashboard.js         # Minimal 4-card + 2-column + bottom layout
        ├── transactions.js      # Ledger with search, filters & CRUD
        ├── budgets.js           # Monthly budget targets & progress
        ├── analytics.js         # Smart spending insights page
        ├── savings.js           # Student savings goals & deposits
        ├── subscriptions.js     # Recurring student plans
        ├── calendar.js          # Monthly daily spending calendar
        └── settings.js          # Profile, theme & JSON backup/restore
```

---

## 🚀 How to Run Locally

```powershell
cd C:\Users\HP\.gemini\antigravity\scratch\expensify
node server.js
```

Open your browser at **[http://localhost:3000](http://localhost:3000)**.
