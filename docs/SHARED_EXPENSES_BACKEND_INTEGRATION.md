# Expense Sharing Backend Integration Guide

## Overview

This document provides comprehensive guidelines for implementing the Expense Sharing feature backend. The frontend has been fully implemented with Next.js and is ready to connect to backend API endpoints.

## Table of Contents

1. [API Endpoints](#api-endpoints)
2. [Data Models](#data-models)
3. [API Request/Response Formats](#api-requestresponse-formats)
4. [Authentication](#authentication)
5. [Error Handling](#error-handling)
6. [Implementation Checklist](#implementation-checklist)

## API Endpoints

All endpoints are prefixed with `/api/expenses/shared`

### 1. Get All Shared Expenses

```
GET /api/expenses/shared
```

**Purpose:** Retrieve all shared expenses created by the authenticated user

**Query Parameters:**
- `limit` (optional): Number of expenses to return (default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `sort` (optional): Sort field (default: `-created_at`)

**Success Response (200):**
```json
{
  "status": "success",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "_id": "507f1f77bcf86cd799439011",
      "title": "Dinner",
      "amount": 2000,
      "description": "Team dinner at restaurant",
      "participants": ["John", "Jane", "Mike"],
      "share_per_person": 666.67,
      "created_by": "507f1f77bcf86cd799439012",
      "created_at": "2024-04-25T10:30:00Z",
      "updated_at": "2024-04-25T10:30:00Z"
    }
  ]
}
```

**Error Response (401, 500):**
```json
{
  "status": "error",
  "message": "Unauthorized" or "Internal Server Error"
}
```

---

### 2. Get Specific Shared Expense

```
GET /api/expenses/shared/{id}
```

**Purpose:** Retrieve a specific shared expense by ID

**URL Parameters:**
- `id` (required): Shared expense ID

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "_id": "507f1f77bcf86cd799439011",
    "title": "Dinner",
    "amount": 2000,
    "description": "Team dinner at restaurant",
    "participants": ["John", "Jane", "Mike"],
    "share_per_person": 666.67,
    "created_by": "507f1f77bcf86cd799439012",
    "created_at": "2024-04-25T10:30:00Z",
    "updated_at": "2024-04-25T10:30:00Z"
  }
}
```

**Error Response (404):**
```json
{
  "status": "error",
  "message": "Shared expense not found"
}
```

---

### 3. Create Shared Expense

```
POST /api/expenses/shared
Content-Type: application/json
Authorization: Bearer {token}
```

**Purpose:** Create a new shared expense

**Request Body:**
```json
{
  "title": "Dinner",
  "amount": 2000,
  "description": "Team dinner at restaurant",
  "participants": ["John", "Jane", "Mike"]
}
```

**Validation Rules:**
- `title`: Required, string, min 1 char, max 100 chars
- `amount`: Required, number, must be > 0
- `description`: Optional, string, max 500 chars
- `participants`: Required, array of strings, min 1 participant
  - Each participant: string, min 1 char, max 100 chars

**Success Response (201):**
```json
{
  "status": "success",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "_id": "507f1f77bcf86cd799439011",
    "title": "Dinner",
    "amount": 2000,
    "description": "Team dinner at restaurant",
    "participants": ["John", "Jane", "Mike"],
    "share_per_person": 666.67,
    "created_by": "507f1f77bcf86cd799439012",
    "created_at": "2024-04-25T10:30:00Z",
    "updated_at": "2024-04-25T10:30:00Z"
  }
}
```

**Error Response (400):**
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "title": "Title is required",
    "participants": "At least 1 participant required"
  }
}
```

---

### 4. Update Shared Expense

```
PUT /api/expenses/shared/{id}
Content-Type: application/json
Authorization: Bearer {token}
```

**Purpose:** Update an existing shared expense

**URL Parameters:**
- `id` (required): Shared expense ID

**Request Body:** Same as Create endpoint

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "_id": "507f1f77bcf86cd799439011",
    "title": "Dinner (Updated)",
    "amount": 2500,
    "description": "Team dinner at restaurant (updated)",
    "participants": ["John", "Jane", "Mike", "Sarah"],
    "share_per_person": 625,
    "created_by": "507f1f77bcf86cd799439012",
    "created_at": "2024-04-25T10:30:00Z",
    "updated_at": "2024-04-25T11:00:00Z"
  }
}
```

**Error Response (403):**
```json
{
  "status": "error",
  "message": "You don't have permission to update this expense"
}
```

---

### 5. Delete Shared Expense

```
DELETE /api/expenses/shared/{id}
Authorization: Bearer {token}
```

**Purpose:** Delete a shared expense

**URL Parameters:**
- `id` (required): Shared expense ID

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Expense deleted successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011"
  }
}
```

**Error Response (403):**
```json
{
  "status": "error",
  "message": "You don't have permission to delete this expense"
}
```

---

### 6. Get Shared Expense Summary

```
GET /api/expenses/shared/summary
Authorization: Bearer {token}
```

**Purpose:** Get summary statistics for all shared expenses

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "total_expenses": 5,
    "total_amount": 10500,
    "average_amount": 2100,
    "participant_summary": {
      "John": {
        "count": 3,
        "total_share": 5000
      },
      "Jane": {
        "count": 3,
        "total_share": 3000
      }
    }
  }
}
```

---

### 7. Get Settlement Report

```
GET /api/expenses/shared/settlement
Authorization: Bearer {token}
```

**Purpose:** Get a report of who owes whom based on shared expenses

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "settlements": [
      {
        "from": "John",
        "to": "You (Creator)",
        "amount": 1000,
        "expenses": [
          {
            "title": "Dinner",
            "share": 666.67
          }
        ]
      }
    ],
    "total_pending": 1000
  }
}
```

---

### 8. Export Shared Expenses

```
GET /api/expenses/shared/export?format=csv
Authorization: Bearer {token}
```

**Query Parameters:**
- `format` (required): `csv` or `pdf`

**Success Response (200):** File download with appropriate Content-Type header

**CSV Format Example:**
```
Title,Amount,Participants,Share Per Person,Date
Dinner,2000,"John, Jane, Mike",666.67,2024-04-25
```

**PDF Format:** Generated PDF report with expense details

---

## Data Models

### Shared Expense Schema

```
{
  _id: ObjectId (MongoDB ID),
  id: String (Alternate ID format),
  title: String (required, unique per user, max 100),
  amount: Number (required, > 0, decimal with 2 places),
  description: String (optional, max 500),
  participants: [String] (required, min 1, max 20),
  share_per_person: Number (calculated: amount / participants.length),
  created_by: ObjectId (reference to User, required),
  created_at: DateTime (required, indexed),
  updated_at: DateTime (required),
  deleted_at: DateTime (optional, for soft deletes)
}
```

### Database Indexes

```javascript
db.shared_expenses.createIndex({ created_by: 1, created_at: -1 });
db.shared_expenses.createIndex({ created_at: -1 });
db.shared_expenses.createIndex({ created_by: 1, deleted_at: 1 });
```

---

## API Request/Response Formats

### Standard Response Structure

**Success Response:**
```json
{
  "status": "success",
  "data": {},
  "message": "Optional message"
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Error description",
  "errors": {
    "field": "Field-specific error message"
  }
}
```

### Request Headers

All requests should include:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

### Response Headers

All responses should include:
```
Content-Type: application/json
X-Total-Count: {total_count} (for list endpoints)
```

---

## Authentication

### Requirements

- All endpoints (except list endpoints that may have public access) require Bearer token authentication
- Token should be sent in `Authorization` header as `Bearer {token}`
- Validate token on every request
- Return 401 Unauthorized if token is invalid or missing

### Authorization

- Users can only access their own shared expenses
- Users can only update/delete expenses they created
- Implement permission checks in all mutation endpoints

---

## Error Handling

### HTTP Status Codes

| Status | Scenario |
|--------|----------|
| 200 | Successful GET, PUT |
| 201 | Successful POST (Create) |
| 204 | Successful DELETE |
| 400 | Validation error |
| 401 | Authentication error |
| 403 | Authorization error |
| 404 | Resource not found |
| 500 | Server error |

### Error Response Examples

**Validation Error (400):**
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "amount": "Amount must be greater than 0",
    "participants": "At least 1 participant required"
  }
}
```

**Authentication Error (401):**
```json
{
  "status": "error",
  "message": "Unauthorized - Invalid token"
}
```

**Authorization Error (403):**
```json
{
  "status": "error",
  "message": "Forbidden - You don't have permission to access this resource"
}
```

---

## Implementation Checklist

- [ ] Create database schema for shared_expenses collection
- [ ] Create database indexes as specified
- [ ] Implement GET /api/expenses/shared (with pagination)
- [ ] Implement GET /api/expenses/shared/{id}
- [ ] Implement POST /api/expenses/shared with validation
- [ ] Implement PUT /api/expenses/shared/{id} with authorization checks
- [ ] Implement DELETE /api/expenses/shared/{id} with authorization checks
- [ ] Implement GET /api/expenses/shared/summary
- [ ] Implement GET /api/expenses/shared/settlement
- [ ] Implement GET /api/expenses/shared/export (CSV and PDF)
- [ ] Add authentication middleware (Bearer token validation)
- [ ] Add authorization middleware (ownership validation)
- [ ] Add input validation middleware
- [ ] Add error handling middleware
- [ ] Write unit tests for all endpoints
- [ ] Write integration tests
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Test with frontend application
- [ ] Deploy to staging environment
- [ ] Load testing
- [ ] Security audit

---

## Backend Tech Stack Recommendation

Based on the frontend architecture, consider:

- **Node.js** with Express.js or similar
- **MongoDB** for database
- **JWT** for authentication
- **Joi** or **Zod** for input validation
- **Jest** for testing
- **Multer** for file uploads (if needed for export)
- **PDFKit** or **pdfmake** for PDF generation

---

## Testing with Frontend

Once backend is ready:

1. Update `src/utils/api.js` base URL to point to your backend
2. Run `npm run dev` to start the frontend dev server
3. Test all CRUD operations
4. Test error handling
5. Test export functionality
6. Test with slow network (DevTools Network tab)

---

## Future Enhancements

- Settlement suggestions (recommend who should pay whom)
- Recurring shared expenses
- Groups/team management
- Payment tracking integration
- Push notifications
- Mobile app support
- AI-powered receipt parsing for automatic expense creation

---

## Support & Questions

Refer to the main [ExpenseSharing.md](./ExpenseSharing.md) for feature requirements and specifications.
