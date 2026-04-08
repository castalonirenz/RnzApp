# My Borrower API Endpoint Docs

Base URL (local): `http://localhost:4000`  
API Prefix: `/api`
Database: MongoDB (ObjectId-based IDs)

## Authentication

For protected routes, send this header:

```http
Authorization: Bearer <jwt_token>
```

## Response Format

Success response pattern:

```json
{
  "success": true,
  "message": "Optional message",
  "data": {}
}
```

Error response pattern:

```json
{
  "success": false,
  "message": "Error message",
  "details": []
}
```

`details` appears on validation errors (`422`).

## Auth Endpoints

### 1) Register

- Method: `POST`
- Path: `/api/register`
- Auth: No

Request body:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Validation:
- `email` must be a valid email
- `password` minimum length is 6

Success (`201`):

```json
{
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "user": {
      "id": "67f4f24f5df4d2166d3e89a1",
      "email": "user@example.com",
      "created_at": "2026-04-08T10:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

### 2) Login

- Method: `POST`
- Path: `/api/login`
- Auth: No

Request body:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Success (`200`):

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": "67f4f24f5df4d2166d3e89a1",
      "email": "user@example.com",
      "created_at": "2026-04-08T10:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

### 3) Logout

- Method: `POST`
- Path: `/api/logout`
- Auth: Yes

Success (`200`):

```json
{
  "success": true,
  "message": "Logout successful. Remove the token on the client side."
}
```

### 4) Get Current User + Dashboard

- Method: `GET`
- Path: `/api/user`
- Auth: Yes

Success (`200`):

```json
{
  "success": true,
  "data": {
    "id": "67f4f24f5df4d2166d3e89a1",
    "email": "user@example.com",
    "created_at": "2026-04-08T10:00:00.000Z",
    "dashboard": {
      "totalLoans": 2,
      "pendingLoans": 1,
      "ongoingLoans": 1,
      "completedLoans": 0,
      "totalReceivable": "12000.00",
      "totalPaid": "2000.00",
      "outstandingBalance": "10000.00"
    }
  }
}
```

## Loan Endpoints

Interest calculation behavior:
- `interestType: "monthly"` uses `Total = P + (P * r * durationMonths)`
- `interestType: "annum"` uses `Total = P + (P * r * (durationMonths / 12))`

### 5) List Loans

- Method: `GET`
- Path: `/api/loans`
- Auth: Yes

Success (`200`):

```json
{
  "success": true,
  "data": [
    {
      "id": "67f4f2815df4d2166d3e89a5",
      "userId": "67f4f24f5df4d2166d3e89a1",
      "borrowerName": "John Doe",
      "principal": "10000.00",
      "interestRate": "0.05",
      "interestType": "monthly",
      "durationMonths": 12,
      "totalReceivable": "16000.00",
      "totalPaid": "2000.00",
      "remainingBalance": "14000.00",
      "status": "Ongoing",
      "createdAt": "2026-04-08T10:00:00.000Z"
    }
  ]
}
```

### 6) Create Loan

- Method: `POST`
- Path: `/api/loans`
- Auth: Yes

Request body:

```json
{
  "borrowerName": "John Doe",
  "principal": 10000,
  "interestRate": 0.05,
  "interestType": "monthly",
  "durationMonths": 12
}
```

Validation:
- `borrowerName` required
- `principal` must be greater than 0
- `interestRate` must be 0 or greater
- `interestType` must be `monthly` or `annum` (optional, defaults to `monthly`)
- `durationMonths` must be a positive integer

Success (`201`):

```json
{
  "success": true,
  "message": "Loan created successfully.",
  "data": {
    "id": "67f4f2815df4d2166d3e89a5",
    "userId": "67f4f24f5df4d2166d3e89a1",
    "borrowerName": "John Doe",
    "principal": "10000.00",
    "interestRate": "0.05",
    "interestType": "monthly",
    "durationMonths": 12,
    "totalReceivable": "16000.00",
    "totalPaid": "0.00",
    "remainingBalance": "16000.00",
    "status": "Pending",
    "createdAt": "2026-04-08T10:00:00.000Z"
  }
}
```

### 7) Get Loan By ID

- Method: `GET`
- Path: `/api/loans/:id`
- Auth: Yes

Path params:
- `id`: valid MongoDB ObjectId

Success (`200`):

```json
{
  "success": true,
  "data": {
    "id": "67f4f2815df4d2166d3e89a5",
    "userId": "67f4f24f5df4d2166d3e89a1",
    "borrowerName": "John Doe",
    "principal": "10000.00",
    "interestRate": "0.05",
    "interestType": "monthly",
    "durationMonths": 12,
    "totalReceivable": "16000.00",
    "totalPaid": "2000.00",
    "remainingBalance": "14000.00",
    "status": "Ongoing",
    "createdAt": "2026-04-08T10:00:00.000Z"
  }
}
```

### 8) Update Loan

- Method: `PUT`
- Path: `/api/loans/:id`
- Auth: Yes

Rules:
- Only `Pending` loans can be edited

Request body:

```json
{
  "borrowerName": "John Doe Updated",
  "principal": 12000,
  "interestRate": 0.05,
  "interestType": "annum",
  "durationMonths": 10
}
```

Success (`200`):

```json
{
  "success": true,
  "message": "Loan updated successfully.",
  "data": {
    "id": "67f4f2815df4d2166d3e89a5",
    "userId": "67f4f24f5df4d2166d3e89a1",
    "borrowerName": "John Doe Updated",
    "principal": "12000.00",
    "interestRate": "0.05",
    "interestType": "annum",
    "durationMonths": 10,
    "totalReceivable": "18000.00",
    "totalPaid": "0.00",
    "remainingBalance": "18000.00",
    "status": "Pending",
    "createdAt": "2026-04-08T10:00:00.000Z"
  }
}
```

### 9) Update Loan Status

- Method: `PATCH`
- Path: `/api/loans/:id/status`
- Auth: Yes

Request body:

```json
{
  "status": "Ongoing"
}
```

Allowed statuses:
- `Pending`
- `Ongoing`
- `Completed`

Rules:
- Cannot move backwards (for example `Completed` -> `Ongoing`)

Success (`200`):

```json
{
  "success": true,
  "message": "Loan status updated successfully.",
  "data": {
    "id": "67f4f2815df4d2166d3e89a5",
    "userId": "67f4f24f5df4d2166d3e89a1",
    "borrowerName": "John Doe Updated",
    "principal": "12000.00",
    "interestRate": "0.05",
    "interestType": "annum",
    "durationMonths": 10,
    "totalReceivable": "18000.00",
    "totalPaid": "0.00",
    "remainingBalance": "18000.00",
    "status": "Ongoing"
  }
}
```

### 10) Delete Loan

- Method: `DELETE`
- Path: `/api/loans/:id`
- Auth: Yes

Rules:
- Only `Pending` loans can be deleted

Success (`204`):
- No response body

### 11) Add Payment

- Method: `POST`
- Path: `/api/loans/:id/payments`
- Auth: Yes

Request body:

```json
{
  "amount": 2000
}
```

Rules:
- Loan must be `Ongoing`
- Payment amount must be greater than 0
- If balance is `<= 0`, loan auto-updates to `Completed`

Success (`201`):

```json
{
  "success": true,
  "message": "Payment recorded successfully.",
  "data": {
    "payment": {
      "id": "67f4f2c65df4d2166d3e89ad",
      "loan_id": "67f4f2815df4d2166d3e89a5",
      "amount": "2000.00",
      "created_at": "2026-04-08T10:00:00.000Z"
    },
    "loan": {
      "id": "67f4f2815df4d2166d3e89a5",
      "userId": "67f4f24f5df4d2166d3e89a1",
      "borrowerName": "John Doe",
      "principal": "10000.00",
      "interestRate": "0.05",
      "interestType": "monthly",
      "durationMonths": 12,
      "totalReceivable": "16000.00",
      "totalPaid": "2000.00",
      "status": "Ongoing",
      "remainingBalance": "14000.00"
    }
  }
}
```

### 12) Get Loan History

- Method: `GET`
- Path: `/api/loans/:id/history`
- Auth: Yes

Success (`200`):

```json
{
  "success": true,
  "data": {
    "loan": {},
    "payments": [],
    "history": []
  }
}
```

## Health Endpoint

### 13) API Health

- Method: `GET`
- Path: `/health`
- Auth: No

Success (`200`):

```json
{
  "success": true,
  "message": "My Borrower API is running."
}
```

## Common Status Codes

- `200` OK
- `201` Created
- `204` No Content
- `401` Unauthorized
- `404` Not Found
- `409` Conflict
- `422` Validation/Business Rule Error
- `500` Internal Server Error
