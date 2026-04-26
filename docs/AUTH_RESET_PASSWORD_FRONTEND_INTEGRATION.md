# Auth + Password Reset Frontend Integration

This guide documents the updated auth contract:

- Standard registration payload (`confirm_password` required)
- Forgot password via email
- Reset password with token
- Consistent success responses include `status: "success"`

Base URL: `http://localhost:4000/api`

## Response Format

### Success JSON

```json
{
  "success": true,
  "status": "success",
  "message": "Optional message",
  "data": {}
}
```

### Error JSON

```json
{
  "success": false,
  "status": "error",
  "message": "Error message",
  "details": []
}
```

---

## 1) Register (Standard)

### Endpoint

`POST /api/register`

### Request

```json
{
  "name": "Juan Dela Cruz",
  "email": "juan@example.com",
  "password": "secret123",
  "confirm_password": "secret123"
}
```

### Rules

- `name` required
- valid `email`
- `password` minimum 8 characters
- `confirm_password` required and must match `password`

### Success (`201`)

```json
{
  "success": true,
  "status": "success",
  "message": "User registered successfully.",
  "data": {
    "user": {
      "id": "680d7b8b8f889f4b2f0dff89",
      "name": "Juan Dela Cruz",
      "email": "juan@example.com",
      "created_at": "2026-04-26T10:15:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

---

## 2) Forgot Password (Email)

### Endpoint

`POST /api/forgot-password`

### Request

```json
{
  "email": "juan@example.com"
}
```

### Success (`200`)

```json
{
  "success": true,
  "status": "success",
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

Notes:

- This message is intentionally generic for security.
- Existing users are unchanged in DB and can reset password through this flow.

---

## 3) Reset Password

### Endpoint

`POST /api/reset-password`

### Request

```json
{
  "token": "token_from_email",
  "password": "newSecret123",
  "confirm_password": "newSecret123"
}
```

### Rules

- `token` required
- `password` minimum 8 characters
- `confirm_password` required and must match `password`

### Success (`200`)

```json
{
  "success": true,
  "status": "success",
  "message": "Password has been reset successfully."
}
```

---

## Frontend Flow (Recommended)

1. User clicks `Forgot password` on login screen.
2. Frontend submits email to `POST /api/forgot-password`.
3. Show neutral confirmation message.
4. User opens reset link from email.
5. Reset screen reads `token` query param from URL.
6. Frontend submits `token`, `password`, `confirm_password` to `POST /api/reset-password`.
7. On success, redirect user to login and show success toast.

---

## Email/Environment Requirements

Set in backend `.env`:

```env
PASSWORD_RESET_TOKEN_EXPIRES_MINUTES=30
FRONTEND_RESET_PASSWORD_URL=http://localhost:3000/reset-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-pass
SMTP_FROM="My Borrower <no-reply@myborrower.app>"
```

If SMTP is not configured, backend logs the reset link in server logs for development.
