# Technical Specifications: My Borrower (Node.js API Version)

## 1. Overview

**My Borrower** is a financial tracking application that enables users to manage personal loans, calculate interest, and monitor repayment progress. The backend is built using Node.js and Express, providing a secure, lightweight, and maintainable RESTful API.

---

## 2. System Architecture

### 2.1 Frontend

* Built with React or Next.js
* Communicates with backend via REST API
* Handles UI rendering and client-side validation

### 2.2 Backend (Node.js API)

* Framework: Node.js with Express
* API-only architecture
* Responsibilities:

  * Business logic
  * Loan lifecycle
  * Interest calculations
  * Authentication

### 2.3 Database

* SQLite (local development) or PostgreSQL/MySQL for production
* Uses foreign keys and transactions

---

## 3. API Design

### 3.1 Authentication

```
POST   /api/register
POST   /api/login
POST   /api/logout
GET    /api/user
```

### 3.2 Loans

```
GET    /api/loans
POST   /api/loans
GET    /api/loans/{id}
PUT    /api/loans/{id}
PATCH  /api/loans/{id}/status
DELETE /api/loans/{id}
```

### 3.3 Payments & History

```
POST   /api/loans/{id}/payments
GET    /api/loans/{id}/history
```

---

## 4. Core Features

### 4.1 Loan Management

* Principal
* Interest Rate
* Duration (months)
* Total Receivable (computed)

Formula:
Total = P + (P × r × t)

### 4.2 Loan Status

* Pending (editable)
* Ongoing (locked)
* Completed (closed)

Rules:

* No backward transitions
* Core fields locked when Ongoing

### 4.3 Payments & History

* Track payments with date, amount, balance
* Immutable audit logs

### 4.4 Account Management

* JWT/Sanctum authentication
* User dashboard summary

---

## 5. Data Schema

### Users

* id
* email
* password
* created_at

### Loans

* id
* user_id
* borrower_name
* principal
* interest_rate
* duration_months
* total_receivable
* status
* created_at

### Payments

* id
* loan_id
* amount
* created_at

### History

* id
* loan_id
* action
* amount_paid
* balance_after
* created_at

---

## 6. Business Logic

### Immutability

* Only Pending loans can be edited

### Balance Calculation

remaining = total_receivable - total_payments

### Auto Complete

* Status becomes Completed when balance <= 0

### Transactions

* Use DB transactions for payments and updates

---

## 7. Non-Functional Requirements

### Security

* HTTPS
* Hashed passwords
* Input validation

### Precision

* Use DECIMAL for currency

### Performance

* Indexed queries
* Eager loading

### Usability

* Dashboard shows total outstanding balance

---

## 8. Project Structure

```
app/
 ├── Models/
 ├── Http/
 ├── Services/
 ├── Policies/
```

---

## 9. Future Enhancements

* Notifications
* Reports export
* Multi-currency
* WebSockets support
