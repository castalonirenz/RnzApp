# Budget Monitoring API Integration Guide

This document defines the API contract needed by the updated Expense Tracker UI (`/expenses`) for the Budget Monitoring feature.

Base URL (local): `http://localhost:4000/api`  
Auth header (required for all endpoints below):

```http
Authorization: Bearer <token>
```

## 1) Data Contracts

### Budget Object

```json
{
  "id": 1,
  "user_id": 10,
  "name": "Food Budget",
  "amount_limit": 5000,
  "period_type": "monthly",
  "start_date": "2026-04-01T00:00:00.000Z",
  "end_date": null,
  "total_spent": 1250,
  "remaining_balance": 3750,
  "created_at": "2026-04-22T02:15:00.000Z",
  "updated_at": "2026-04-22T02:15:00.000Z"
}
```

Notes:
- `period_type` must be one of: `daily`, `monthly`, `yearly`.
- `total_spent` and `remaining_balance` are strongly recommended (frontend can compute fallback, but server values are preferred).

### Expense Object (Updated)

```json
{
  "id": 88,
  "user_id": 10,
  "title": "Lunch",
  "amount": 250,
  "category": "Food",
  "notes": "Office meal",
  "expense_date": "2026-04-22T03:30:00.000Z",
  "budget_id": 1,
  "created_at": "2026-04-22T03:31:00.000Z",
  "updated_at": "2026-04-22T03:31:00.000Z"
}
```

Notes:
- `budget_id` is optional (`null` or omitted means unassigned expense).

## 2) Endpoints

### `GET /budgets`
Returns all budgets of the authenticated user.

Example response:

```json
[
  {
    "id": 1,
    "name": "Food Budget",
    "amount_limit": 5000,
    "period_type": "monthly",
    "total_spent": 1250,
    "remaining_balance": 3750
  }
]
```

### `POST /budgets`
Creates a new budget.

Request:

```json
{
  "name": "Food Budget",
  "amount_limit": 5000,
  "period_type": "monthly"
}
```

Validation:
- `name` required
- `amount_limit` must be a number greater than `0`
- `period_type` must be `daily|monthly|yearly`

Response: created budget object.

### `PATCH /budgets/:id`
Partially updates a budget.

Path params:
- `id` (required): budget id

Request (all fields optional, but at least one is required):

```json
{
  "name": "Essentials Budget",
  "amount_limit": 6000,
  "period_type": "monthly",
  "start_date": "2026-04-01T00:00:00.000Z",
  "end_date": null
}
```

Behavior:
- Supports partial updates for `name`, `amount_limit`, `period_type`, `start_date`, `end_date`.
- If update would make linked budget expenses fall outside the resulting budget window, backend returns `409`.

### `DELETE /budgets/:id`
Deletes a budget.

Behavior:
- Linked expenses are preserved.
- Linked expenses are automatically detached from the deleted budget (`budget_id` becomes `null`).
- Returns `204 No Content` on success.

### `POST /expenses` (Budget-aware)
Creates an expense and optionally attaches it to a budget.

Request:

```json
{
  "title": "Lunch",
  "amount": 250,
  "category": "Food",
  "notes": "Office meal",
  "expense_date": "2026-04-22T03:30:00.000Z",
  "budget_id": 1
}
```

Behavior expected by frontend:
- If `budget_id` is provided, backend validates ownership and valid period window.
- Expense is linked to that budget.
- Budget calculations (`total_spent`, `remaining_balance`) are updated/consistent on next `GET /budgets`.

### `PATCH /expenses/:id` (Partial update, Budget-aware)
Updates one or more expense fields.

Path params:
- `id` (required): expense id

Request (all fields optional, but at least one must be provided):

```json
{
  "title": "Lunch with team",
  "amount": 300,
  "category": "Food",
  "notes": "Client meeting",
  "expense_date": "2026-04-22T05:00:00.000Z",
  "budget_id": "6805b6a4ad7469ff73766f2a"
}
```

Behavior expected by frontend:
- Supports partial updates (`PATCH`) to `title`, `amount`, `category`, `notes`, `expense_date`, and `budget_id`.
- `budget_id: null` detaches the expense from a budget.
- If final `budget_id` is set, backend validates ownership and period-window compatibility against final `expense_date`.
- Returns updated expense object.

### `GET /budgets/:id/export?format=csv|pdf`
Exports a single budget report.

Query:
- `format=csv` or `format=pdf` (required)

Response:
- Binary file stream (`text/csv` or `application/pdf`)
- Include `Content-Disposition` with filename (recommended), e.g.

```http
Content-Disposition: attachment; filename="budget-1-2026-04-22.csv"
```

## 3) Error Responses (Recommended)

Use consistent JSON errors:

```json
{
  "message": "Budget not found"
}
```

Suggested status codes:
- `400` invalid payload
- `401` unauthorized
- `403` forbidden (resource not owned by user)
- `404` not found
- `409` business rule conflict (example: expense date outside budget period)
- `500` server error

## 4) Frontend Compatibility Notes

The current frontend accepts either direct arrays or wrapped responses:
- `[...]`
- `{ "data": [...] }`
- `{ "budgets": [...] }`
- `{ "expenses": [...] }`

For create endpoints, frontend accepts either:
- created object directly
- `{ "data": createdObject }`
- `{ "budget": createdObject }` for budgets
- `{ "expense": createdObject }` for expenses
