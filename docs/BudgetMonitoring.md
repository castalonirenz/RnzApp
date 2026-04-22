# 📊 Budget Monitoring Feature

## Overview

This feature introduces a flexible budgeting system that allows users to create and manage multiple budgets on a **daily, monthly, or yearly basis**. Expenses are automatically deducted from the assigned budget, enabling real-time tracking and better financial control.

---

## ✨ Features

* Create multiple budgets
* Set budget periods: **Daily, Monthly, Yearly**
* Automatic expense deduction via API
* Dynamic budget tracking (no manual resets required)
* Downloadable budget reports (CSV/PDF)
* Real-time remaining balance updates

---

## 🧱 Data Structure

### Budgets Table

```
id
user_id
name
amount_limit
period_type   // "daily" | "monthly" | "yearly"
start_date
end_date      // optional
created_at
```

### Expenses Table

```
id
user_id
budget_id     // nullable
amount
category
date
created_at
```

---

## 🔌 API Endpoints

### Create Budget

**POST** `/budgets`

#### Request Body

```json
{
  "name": "Food Budget",
  "amount_limit": 5000,
  "period_type": "monthly"
}
```

---

### Add Expense (Auto Deduction)

**POST** `/expenses`

#### Request Body

```json
{
  "budget_id": 1,
  "amount": 250,
  "category": "Food"
}
```

#### Behavior

* Links expense to a budget
* Automatically deducts from the budget
* Updates remaining balance dynamically

---

### Export Budget রিপোর্ট

**GET** `/budgets/:id/export`

#### Supported Formats

* CSV
* PDF

#### Sample Output

```
Date | Expense | Amount | Remaining Budget
```

---

## 🔁 Budget Calculation Logic

Budgets are calculated dynamically based on their period type:

* **Daily** → Valid for the current day
* **Monthly** → Valid for the current month
* **Yearly** → Valid for the current year

### Remaining Budget Formula

```js
remaining = budget.amount_limit - total_expenses_within_period
```

---

## 🧠 Sample Logic (Pseudo-code)

```js
function getRemainingBudget(budgetId) {
  const budget = getBudget(budgetId);

  const expenses = getExpenses({
    budget_id: budgetId,
    date_range: getPeriodRange(budget.period_type)
  });

  const totalSpent = sum(expenses.amount);

  return budget.amount_limit - totalSpent;
}
```

---

## 🖥️ Frontend UI

### Budget Creation

* Input: Budget Name
* Input: Amount
* Dropdown: Daily / Monthly / Yearly

### Dashboard

Each budget displays:

* Name
* Period type
* Remaining balance
* Progress bar (spent vs limit)

---

## ⚙️ System Flow

1. User creates a budget
2. User adds expenses
3. Backend:

   * Validates budget period
   * Calculates total spent
   * Returns updated remaining balance
4. Frontend updates UI in real-time

---

## 🚀 Future Enhancements

* Budget alerts (e.g., 80% usage warning)
* Category-based budgets
* Multi-currency support
* Scheduled resets (cron jobs if needed)
* Smart budget suggestions

---

## ✅ Summary

This feature transforms basic expense tracking into a **dynamic, multi-budget monitoring system** with automated calculations and export capabilities, giving users better visibility and control over their finances.
