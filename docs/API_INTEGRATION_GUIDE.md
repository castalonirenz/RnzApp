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
  "password": "secret123"
}
```

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
