# Shared Expenses Backend Integration Guide

## Overview

The Shared Expense module now supports **dynamic splitting**:

- `equal` split: everyone pays the same amount
- `custom` split: each participant can pay a different amount (for example, one person only added water)

Frontend now sends split data using `split_mode` and `participant_shares`.  
Backend should validate and persist these fields.

Base route prefix: `/api/expenses/shared`

---

## Data Contract

### Shared Expense Object

```json
{
  "id": "507f1f77bcf86cd799439011",
  "title": "Dinner + Water",
  "amount": 2000,
  "description": "Restaurant bill",
  "participants": ["John", "Jane", "Mike"],
  "split_mode": "custom",
  "participant_shares": [
    { "name": "John", "amount": 900 },
    { "name": "Jane", "amount": 900 },
    { "name": "Mike", "amount": 200 }
  ],
  "share_per_person": 666.67,
  "created_by": "507f1f77bcf86cd799439012",
  "created_at": "2026-04-25T10:30:00Z",
  "updated_at": "2026-04-25T10:30:00Z"
}
```

Notes:

- `participants` remains an array of participant names.
- `split_mode` is `equal` or `custom`.
- `participant_shares` is always recommended in response.
- `share_per_person` can still be returned for compatibility:
  - For `equal`: `amount / participants.length`
  - For `custom`: optional (average), or keep computed for legacy clients.

---

## Endpoints

### 1) Get All Shared Expenses

`GET /api/expenses/shared`

Query params (optional): `limit`, `offset`, `sort`

Success `200`:

```json
{
  "status": "success",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "title": "Dinner + Water",
      "amount": 2000,
      "participants": ["John", "Jane", "Mike"],
      "split_mode": "custom",
      "participant_shares": [
        { "name": "John", "amount": 900 },
        { "name": "Jane", "amount": 900 },
        { "name": "Mike", "amount": 200 }
      ],
      "share_per_person": 666.67,
      "created_at": "2026-04-25T10:30:00Z"
    }
  ]
}
```

---

### 2) Get Shared Expense by ID

`GET /api/expenses/shared/{id}`

Success `200`: returns one shared expense object (same shape as above).

---

### 3) Create Shared Expense

`POST /api/expenses/shared`

Headers:

- `Authorization: Bearer <token>`
- `Content-Type: application/json`

#### Request body (equal split)

```json
{
  "title": "Dinner",
  "amount": 2000,
  "description": "Team dinner",
  "participants": ["John", "Jane", "Mike"],
  "split_mode": "equal",
  "participant_shares": [
    { "name": "John", "amount": 666.67 },
    { "name": "Jane", "amount": 666.67 },
    { "name": "Mike", "amount": 666.66 }
  ]
}
```

#### Request body (custom split)

```json
{
  "title": "Dinner + Water",
  "amount": 2000,
  "description": "Mike only had water",
  "participants": ["John", "Jane", "Mike"],
  "split_mode": "custom",
  "participant_shares": [
    { "name": "John", "amount": 900 },
    { "name": "Jane", "amount": 900 },
    { "name": "Mike", "amount": 200 }
  ]
}
```

#### Validation rules

- `title`: required, string, 1..100 chars
- `amount`: required, number > 0
- `description`: optional, max 500 chars
- `participants`: required, array of unique non-empty strings, min 1
- `split_mode`: required, enum: `equal | custom`
- `participant_shares`: required array for both modes (recommended)
  - each item: `{ name: string, amount: number >= 0 }`
  - names should match participants exactly
  - sum of all `participant_shares.amount` must equal `amount` (allow tiny tolerance, e.g. `0.01`)
- For `equal`:
  - backend may ignore incoming split amounts and recalculate equal values
- For `custom`:
  - backend must preserve provided participant amounts after validation

Success `201`: returns created shared expense object.

---

### 4) Update Shared Expense

`PUT /api/expenses/shared/{id}`

Body: same format as create.

Success `200`: returns updated shared expense object.

---

### 5) Delete Shared Expense

`DELETE /api/expenses/shared/{id}`

Success `200` (or `204`): deleted confirmation.

---

### 6) Summary

`GET /api/expenses/shared/summary`

Should include participant totals based on `participant_shares` (not just equal formula).

Example:

```json
{
  "status": "success",
  "data": {
    "total_expenses": 5,
    "total_amount": 10500,
    "participant_summary": {
      "John": { "count": 3, "total_share": 5000 },
      "Jane": { "count": 3, "total_share": 3000 },
      "Mike": { "count": 2, "total_share": 1200 }
    }
  }
}
```

---

### 7) Settlement Report

`GET /api/expenses/shared/settlement`

Compute settlements using `participant_shares` for each expense.

---

### 8) Export

`GET /api/expenses/shared/export?format=csv|pdf`

CSV/PDF should include split type and participant amounts.

Suggested CSV columns:

`Title,Amount,Split Mode,Participants,Participant Shares,Created At`

---

## Schema Recommendation

```js
{
  _id: ObjectId,
  title: String,
  amount: Number,
  description: String,
  participants: [String],
  split_mode: String, // 'equal' | 'custom'
  participant_shares: [
    {
      name: String,
      amount: Number
    }
  ],
  share_per_person: Number, // compatibility field
  created_by: ObjectId,
  created_at: Date,
  updated_at: Date,
  deleted_at: Date
}
```

Indexes:

```js
db.shared_expenses.createIndex({ created_by: 1, created_at: -1 });
db.shared_expenses.createIndex({ created_by: 1, deleted_at: 1 });
```

---

## Error Handling

Common statuses:

- `200` OK
- `201` Created
- `204` No Content (optional for delete)
- `400` Validation failure
- `401` Unauthorized
- `403` Forbidden
- `404` Not found
- `500` Server error

Validation error example:

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "participant_shares": "Sum of participant shares must equal amount"
  }
}
```

---

## Implementation Checklist

- [ ] Add `split_mode` and `participant_shares` to model/schema
- [ ] Validate equal/custom split logic
- [ ] Persist and return `participant_shares`
- [ ] Update summary and settlement calculations to use participant shares
- [ ] Update export output (CSV/PDF) to include split details
- [ ] Add automated tests for:
  - [ ] equal split create/update
  - [ ] custom split create/update
  - [ ] invalid sum rejection
  - [ ] missing participant share name rejection
  - [ ] participant mismatch rejection

---

## Migration Guide (Old -> New Contract)

This section helps backend teams migrate from the previous equal-only model to the new dynamic split contract.

### 1) Old vs New Payload

#### Old (equal-only)

```json
{
  "title": "Dinner",
  "amount": 2000,
  "description": "Team dinner",
  "participants": ["John", "Jane", "Mike"]
}
```

#### New (dynamic split)

```json
{
  "title": "Dinner + Water",
  "amount": 2000,
  "description": "Mike only had water",
  "participants": ["John", "Jane", "Mike"],
  "split_mode": "custom",
  "participant_shares": [
    { "name": "John", "amount": 900 },
    { "name": "Jane", "amount": 900 },
    { "name": "Mike", "amount": 200 }
  ]
}
```

### 2) Backward Compatibility Rules

Recommended server behavior while old clients still exist:

1. If `split_mode` is missing:
  - default to `equal`
2. If `participant_shares` is missing:
  - auto-generate equal shares from `participants` + `amount`
3. Always return normalized fields in response:
  - `split_mode`
  - `participant_shares`
  - `share_per_person` (for legacy UI compatibility)

### 3) Suggested Rollout Phases

1. **Phase A (compatible read/write)**
  - Add new DB fields (`split_mode`, `participant_shares`)
  - Accept both old and new request bodies
  - Return normalized new shape
2. **Phase B (frontend cutover)**
  - Deploy frontend that always sends `split_mode` + `participant_shares`
3. **Phase C (enforce strict validation)**
  - Require `split_mode` and `participant_shares`
  - Keep fallback only if you still support old app versions

### 4) Data Migration for Existing Records

For records created under old equal-only logic:

1. Set `split_mode = "equal"`
2. Build `participant_shares` by dividing amount equally
3. Keep `share_per_person` as equal share (or rounded value)

Pseudo-process:

```text
for each legacy expense:
  names = participants[]
  equal = amount / names.length
  split_mode = "equal"
  participant_shares = names.map(name => { name, amount: equal })
```

### 5) Validation Checklist During Migration

- [ ] `participants` contains unique, non-empty names
- [ ] `participant_shares` names exactly match `participants`
- [ ] sum(`participant_shares.amount`) equals `amount` (tolerance: `0.01`)
- [ ] no negative participant amount
- [ ] `split_mode` in `equal | custom`

### 6) API Versioning Recommendation (Optional)

If you prefer strict separation:

- Keep current path for old clients (`/api/expenses/shared`)
- Add versioned dynamic split endpoint (`/api/v2/expenses/shared`)
- Deprecate v1 after migration window
