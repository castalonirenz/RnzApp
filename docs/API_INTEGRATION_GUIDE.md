# API Integration Guide (Frontend + Backend)

This document reflects the current Express + SQLite backend in this repository.

Base URL (local): `http://localhost:4000/api`

Auth header for protected routes:

```http
Authorization: Bearer <token>
```

## Auth

### `POST /register`
Body:

```json
{
  "name": "Juan Dela Cruz",
  "email": "juan@example.com",
  "password": "secret123",
  "confirm_password": "secret123"
}
```

- Password minimum length: 8 characters.
- `confirm_password` must match `password`.

### `POST /login`
Body:

```json
{
  "email": "juan@example.com",
  "password": "secret123"
}
```

### `POST /logout`
Protected.

### `GET /user`
Protected.

### `POST /forgot-password`
Body:

```json
{
  "email": "juan@example.com"
}
```

- Always returns success message even if email does not exist (security-safe behavior).
- If `AUTH_FORGOT_PASSWORD_VERBOSE=true`, response also includes delivery debug data:
  - `data.email_sent`
  - `data.delivery_method`
  - `data.reason` (if failed)
  - `data.reset_link` and `data.reset_token` (dev troubleshooting fallback)

### `POST /reset-password`
Body:

```json
{
  "token": "reset_token_from_email",
  "password": "newSecret123",
  "confirm_password": "newSecret123"
}
```

- Password minimum length: 8 characters.
- `confirm_password` must match `password`.

## Loans

### Loan object

```json
{
  "id": 1,
  "user_id": 1,
  "borrower_name": "Maria Santos",
  "borrower_contact": "09171234567",
  "borrower_address": "Quezon City",
  "principal": 10000,
  "interest_rate": 0.05,
  "interest_period": "month",
  "duration_months": 12,
  "total_receivable": 16000,
  "status": "ongoing",
  "total_payments": 3000,
  "created_at": "2026-04-08T13:00:00.000Z"
}
```

### `GET /loans`
Protected. Returns all user loans.

Optional query parameters:
- `status`: filter loans by status. Accepted values are `pending`, `ongoing`, and `completed`.

Examples:
- `GET /loans?status=pending`
- `GET /loans?status=ongoing`
- `GET /loans?status=completed`

### `POST /loans`
Protected.
Body:

```json
{
  "borrower_name": "Maria Santos",
  "borrower_contact": "09171234567",
  "borrower_address": "Quezon City",
  "principal": 10000,
  "interest_rate": 0.05,
  "interest_period": "month",
  "duration_months": 12,
  "total_receivable": 16000
}
```

### `GET /loans/:id`
Protected.

### `PUT /loans/:id`
Protected. Same body as create. Only `pending` loans can be edited.

### `PATCH /loans/:id/status`
Protected.
Body:

```json
{
  "status": "ongoing"
}
```

Allowed values: `pending`, `ongoing`, `completed`.

### `DELETE /loans/:id`
Protected.

### `POST /loans/:id/payments`
Protected.
Body:

```json
{
  "amount": 1500,
  "paid_at": "2026-04-08T14:30:00.000Z"
}
```

- `paid_at` is optional. If omitted, server uses current timestamp.

### `GET /loans/:id/history`
Protected.
Returns audit entries:

```json
[
  {
    "id": 9,
    "loan_id": 1,
    "action": "payment",
    "details": "Payment recorded at 2026-04-08T14:30:00.000Z",
    "amount_paid": 1500,
    "balance_after": 12500,
    "created_at": "2026-04-08T14:31:12.000Z"
  }
]
```

## Expenses

### Expense object

```json
{
  "id": 1,
  "user_id": 1,
  "title": "Transportation",
  "amount": 120.5,
  "category": "Travel",
  "notes": "Taxi",
  "expense_date": "2026-04-08T07:10:00.000Z",
  "created_at": "2026-04-08T07:10:10.000Z",
  "updated_at": "2026-04-08T07:10:10.000Z"
}
```

### `GET /expenses`
Protected. Returns all expenses (newest first).

### `POST /expenses`
Protected.
Body:

```json
{
  "title": "Transportation",
  "amount": 120.5,
  "category": "Travel",
  "notes": "Taxi",
  "expense_date": "2026-04-08T07:10:00.000Z"
}
```

### `PATCH /expenses/:id`
Protected. Updates one or more expense fields.
Body (partial):

```json
{
  "title": "Transportation Updated",
  "amount": 150.75,
  "category": "Travel",
  "notes": "Ride share",
  "expense_date": "2026-04-08T09:00:00.000Z",
  "budget_id": "6805b6a4ad7469ff73766f2a"
}
```

- At least one updatable field is required.
- `budget_id: null` removes the budget association.

### `DELETE /expenses/:id`
Protected.

### `GET /expenses/summary?period=daily|monthly|yearly`
Protected.
Returns grouped totals:

```json
[
  { "period": "2026-04", "total": 5300.75 }
]
```

## Shared Expenses

### Shared expense object

```json
{
  "id": "507f1f77bcf86cd799439011",
  "title": "Dinner + Water",
  "amount": 1800,
  "description": "Mike only had water",
  "split_items": ["Bottled water", "Rice", "Softdrinks"],
  "participants": ["Jane", "John"],
  "split_mode": "custom",
  "participant_shares": [
    {
      "name": "Jane",
      "amount": 850,
      "items": [
        { "name": "Bottled water", "amount": 550 },
        { "name": "Rice", "amount": 300 }
      ]
    },
    {
      "name": "John",
      "amount": 950,
      "items": [{ "name": "Softdrinks", "amount": 950 }]
    }
  ],
  "share_per_person": 900,
  "created_at": "2026-04-25T10:30:00.000Z",
  "updated_at": "2026-04-25T10:30:00.000Z"
}
```

### `GET /expenses/shared`
Protected. Returns shared expenses.

`GET /expenses/shared/:id` returns `participant_shares[].items`; frontend should use those rows for the shared expense details view and to prefill the edit shared expense form.

### `POST /expenses/shared`
Protected.

Equal split body:

```json
{
  "title": "Dinner",
  "amount": 2000,
  "description": "Team dinner",
  "participants": ["John", "Jane", "Mike"],
  "split_mode": "equal"
}
```

Custom split body:

```json
{
  "title": "Dinner + Water",
  "amount": 1800,
  "description": "Custom itemized dinner",
  "participants": ["Jane", "John"],
  "split_mode": "custom",
  "participant_shares": [
    {
      "name": "Jane",
      "items": [
        { "name": "Bottled water", "amount": 550 },
        { "name": "Rice", "amount": 300 }
      ]
    },
    {
      "name": "John",
      "items": [{ "name": "Softdrinks", "amount": 950 }]
    }
  ]
}
```

- `split_items` is optional for new itemized custom forms and is derived from `participant_shares[].items[].name` when omitted.
- For `custom`, `participant_shares` is required, each participant has `items`, and all item amounts must total `amount`.
- For `equal`, the backend calculates equal `participant_shares`.

### `PUT /expenses/shared/:id`
Protected. Same body as create. For custom itemized edits, send the complete updated `participant_shares` array with all item rows under each participant.

### Other shared expense routes

- `GET /expenses/shared/:id`
- `DELETE /expenses/shared/:id`
- `GET /expenses/shared/summary`
- `GET /expenses/shared/settlement`
- `GET /expenses/shared/export?format=csv|pdf`

## Budgets

### Budget object

```json
{
  "id": 1,
  "user_id": 1,
  "name": "Food Budget",
  "amount_limit": 5000,
  "period_type": "monthly",
  "start_date": "2026-04-01T00:00:00.000Z",
  "end_date": null,
  "total_spent": 1200,
  "remaining_balance": 3800,
  "created_at": "2026-04-08T07:10:10.000Z",
  "updated_at": "2026-04-08T07:10:10.000Z"
}
```

### `GET /budgets`
Protected. Returns user budgets.

### `POST /budgets`
Protected.
Body:

```json
{
  "name": "Food Budget",
  "amount_limit": 5000,
  "period_type": "monthly"
}
```

### `PATCH /budgets/:id`
Protected. Updates one or more budget fields.
Body (partial):

```json
{
  "name": "Food Budget Updated",
  "amount_limit": 6000,
  "period_type": "monthly",
  "start_date": "2026-04-01T00:00:00.000Z",
  "end_date": null
}
```

- At least one updatable field is required.
- If the new budget window excludes linked expenses, API returns `409`.

### `DELETE /budgets/:id`
Protected.

- Detaches linked expenses (`budget_id = null`) before deleting the budget.
- Returns `204` on success.

### `GET /budgets/:id/export?format=csv|pdf`
Protected. Exports budget report file.
