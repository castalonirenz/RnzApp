# 💳 Payables Tracking Feature

## Overview

The Payables Tracking feature enables users to track all amounts they owe to others (payables/liabilities). Users can manually enter one-time or recurring monthly payables, set due dates, and monitor payment status. This feature provides a complete view of financial obligations and helps users stay on top of their liabilities.

---

## ✨ Features

* **Track All Payables** - Create and manage a comprehensive list of amounts owed
* **Monthly Recurring Payables** - Automatically repeat monthly payables each month
* **Manual Entry** - Easily add payables with descriptions, amounts, and due dates
* **Payment Status Tracking** - Mark payables as pending, partially paid, or fully paid
* **Due Date Alerts** - Track upcoming and overdue payables
* **Summary Dashboard** - View total payables, upcoming payments, and payment history
* **Payables History** - Maintain audit logs of all payments made
* **Search & Filter** - Filter payables by status, creditor, or date range
* **Export Reports** - Download payables summary as CSV/PDF

---

## 🧱 Data Structure

### Payables Table

```
id                    // Primary key
user_id              // Foreign key (Users table)
creditor_name        // Person/entity owed to
description          // Details about the payable
principal_amount     // Original amount owed
amount_paid          // Total amount paid so far
balance              // Remaining balance (principal_amount - amount_paid)
due_date             // Payment due date
is_recurring         // Boolean: true if monthly recurring
recurrence_end_date  // Optional: when recurring should stop
frequency            // "once" | "monthly" | "quarterly" | "yearly"
status               // "pending" | "partially_paid" | "completed"
created_at           // Timestamp
updated_at           // Timestamp
```

### Payable Payments Table (History)

```
id                   // Primary key
payable_id          // Foreign key (Payables table)
user_id             // Foreign key (Users table)
amount_paid         // Amount paid in this transaction
payment_date        // Date of payment
payment_method      // "cash" | "transfer" | "check" | "other"
notes               // Optional notes
created_at          // Timestamp
```

---

## 🔌 API Endpoints

### 1) Get All Payables

- **Method:** `GET`
- **Path:** `/api/payables`
- **Auth:** Yes (Bearer token required)
- **Query Params:**
  - `status` - Filter by status (pending, partially_paid, completed)
  - `creditor_name` - Filter by creditor name
  - `sort_by` - Sort by field (due_date, amount_paid, created_at)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Payables retrieved successfully",
  "data": {
    "payables": [
      {
        "id": "5f4d8c2a9e1b2c3d4e5f6g7h",
        "creditor_name": "Monthly Rent - Landlord ABC",
        "description": "Studio apartment rent",
        "principal_amount": 12000,
        "amount_paid": 0,
        "balance": 12000,
        "due_date": "2026-05-31",
        "is_recurring": true,
        "frequency": "monthly",
        "status": "pending",
        "created_at": "2026-04-29T08:00:00.000Z"
      }
    ],
    "summary": {
      "total_payables": 35000,
      "total_paid": 5000,
      "total_balance": 30000,
      "pending_count": 2,
      "completed_count": 1
    }
  }
}
```

---

### 2) Create New Payable

- **Method:** `POST`
- **Path:** `/api/payables`
- **Auth:** Yes

**Request Body:**

```json
{
  "creditor_name": "Electricity Company",
  "description": "Monthly electricity bill",
  "principal_amount": 2500,
  "due_date": "2026-05-15",
  "is_recurring": true,
  "frequency": "monthly",
  "recurrence_end_date": "2027-04-15"
}
```

**Validation Rules:**

- `creditor_name` required, max 100 characters
- `principal_amount` required, positive number
- `due_date` required, valid ISO date format
- `frequency` one of: "once", "monthly", "quarterly", "yearly"
- If `is_recurring` is true, `frequency` is required

**Success Response (201):**

```json
{
  "success": true,
  "message": "Payable created successfully",
  "data": {
    "payable": {
      "id": "6a5e9d3f1c2b4a7e8f9g0h1i",
      "creditor_name": "Electricity Company",
      "description": "Monthly electricity bill",
      "principal_amount": 2500,
      "amount_paid": 0,
      "balance": 2500,
      "due_date": "2026-05-15",
      "is_recurring": true,
      "frequency": "monthly",
      "status": "pending",
      "created_at": "2026-04-29T10:30:00.000Z"
    }
  }
}
```

---

### 3) Get Payable Details

- **Method:** `GET`
- **Path:** `/api/payables/{id}`
- **Auth:** Yes

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "payable": {
      "id": "5f4d8c2a9e1b2c3d4e5f6g7h",
      "creditor_name": "Monthly Rent",
      "principal_amount": 12000,
      "amount_paid": 12000,
      "balance": 0,
      "due_date": "2026-05-31",
      "status": "completed",
      "payments": [
        {
          "id": "7g6f5e4d3c2b1a0f9e8d7c6b",
          "amount_paid": 12000,
          "payment_date": "2026-05-25",
          "payment_method": "transfer",
          "notes": "Rent for May 2026"
        }
      ]
    }
  }
}
```

---

### 4) Update Payable

- **Method:** `PUT`
- **Path:** `/api/payables/{id}`
- **Auth:** Yes

**Request Body:**

```json
{
  "creditor_name": "Updated Creditor Name",
  "description": "Updated description",
  "due_date": "2026-06-15",
  "is_recurring": false
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Payable updated successfully",
  "data": { "payable": { } }
}
```

---

### 5) Record Payment

- **Method:** `POST`
- **Path:** `/api/payables/{id}/payment`
- **Auth:** Yes

**Request Body:**

```json
{
  "amount_paid": 6000,
  "payment_date": "2026-05-25",
  "payment_method": "transfer",
  "notes": "First installment for rent"
}
```

**Validation Rules:**

- `amount_paid` must not exceed remaining balance
- `payment_method` one of: "cash", "transfer", "check", "other"

**Success Response (200):**

```json
{
  "success": true,
  "message": "Payment recorded successfully",
  "data": {
    "payable": {
      "id": "5f4d8c2a9e1b2c3d4e5f6g7h",
      "creditor_name": "Monthly Rent",
      "principal_amount": 12000,
      "amount_paid": 6000,
      "balance": 6000,
      "status": "partially_paid"
    }
  }
}
```

---

### 6) Get Payment History

- **Method:** `GET`
- **Path:** `/api/payables/{id}/history`
- **Auth:** Yes

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "8h7g6f5e4d3c2b1a0f9e8d7c",
        "amount_paid": 6000,
        "payment_date": "2026-05-25",
        "payment_method": "transfer",
        "notes": "First installment",
        "created_at": "2026-05-25T14:30:00.000Z"
      }
    ]
  }
}
```

---

### 7) Delete Payable

- **Method:** `DELETE`
- **Path:** `/api/payables/{id}`
- **Auth:** Yes

**Rules:**

- Can only delete payables with `status: "pending"` and `amount_paid: 0`
- Completed payables are archived, not deleted

**Success Response (200):**

```json
{
  "success": true,
  "message": "Payable deleted successfully"
}
```

---

## 🎨 Frontend Integration

### Pages

```
/payables                 // Payables dashboard & list
/payables/add             // Add new payable form
/payables/[id]            // Payable details page
/payables/[id]/edit       // Edit payable form
/payables/[id]/payment    // Record payment modal
```

### Components

- **PayableCard** - Display individual payable summary
- **PayableForm** - Add/edit payable form with recurring options
- **PayableTable** - Tabular view of all payables with filters
- **PaymentHistory** - Show all payments for a payable
- **PayablesSummary** - Dashboard widget showing total amounts
- **PaymentModal** - Modal to record a payment

### Hooks

- `usePayables()` - Fetch and manage payables
- `usePayableForm()` - Handle form validation and submission
- `usePaymentHistory()` - Fetch payment history

---

## 📊 Dashboard Summary Widget

Display on main dashboard:

```
Total Payables:     PHP 35,000.00
Paid Amount:        PHP  5,000.00
Balance Remaining:  PHP 30,000.00

Upcoming Dues (Next 7 Days): 2
Overdue:                      0
Completed:                    1
```

---

## 🔄 Recurring Payables Logic

### Monthly Recurring

1. User creates payable with `is_recurring: true` and `frequency: "monthly"`
2. Original payable record is created with due_date = specified date
3. If `recurrence_end_date` is set, system creates instances up to that date
4. Each month on the same date, a new payable instance is auto-generated (if active)
5. User can update the specific instance without affecting future recurrences

### Example

```
User creates: "Monthly Rent - PHP 12,000"
- due_date: 2026-05-31
- frequency: monthly
- recurrence_end_date: 2027-04-30

System generates:
- May 2026: PHP 12,000 (due 2026-05-31)
- June 2026: PHP 12,000 (due 2026-06-30)
- July 2026: PHP 12,000 (due 2026-07-31)
... and so on until April 2027
```

---

## 💡 Usage Examples

### Example 1: Monthly Rent Payment

```json
{
  "creditor_name": "Juan Santos (Landlord)",
  "description": "Studio apartment rent - 3BR unit",
  "principal_amount": 15000,
  "due_date": "2026-05-31",
  "is_recurring": true,
  "frequency": "monthly",
  "recurrence_end_date": "2027-12-31"
}
```

### Example 2: Electricity Utility (Non-Recurring)

```json
{
  "creditor_name": "Meralco (Electricity)",
  "description": "May 2026 electricity bill",
  "principal_amount": 2500,
  "due_date": "2026-05-15",
  "is_recurring": false,
  "frequency": "once"
}
```

### Example 3: Installment Payment

```json
{
  "creditor_name": "ABC Electronics Store",
  "description": "Laptop - 6 month installment plan",
  "principal_amount": 60000,
  "due_date": "2026-06-15",
  "is_recurring": true,
  "frequency": "monthly",
  "recurrence_end_date": "2026-11-15"
}
```

---

## 🔐 Security & Permissions

- Users can only access their own payables
- Payments are immutable (audit trail)
- JWT authentication required for all endpoints
- Database constraints enforce user_id isolation

---

## 📝 Notes

- **Balance Calculation:** `balance = principal_amount - amount_paid`
- **Auto-status:** System automatically updates status based on amount_paid
  - `pending` → `partially_paid` (when amount_paid > 0 and < principal_amount)
  - `partially_paid` → `completed` (when amount_paid >= principal_amount)
- **Recurring Instances:** Each monthly instance is independent; can be edited/deleted individually
- **Alerts:** Consider frontend toast notifications for upcoming due dates (< 7 days)

---

## 🚀 Future Enhancements

- [ ] Email reminders for upcoming due dates
- [ ] SMS notifications for overdue payables
- [ ] Multi-currency support
- [ ] Bulk import from CSV/Excel
- [ ] Automatic payment scheduling
- [ ] Integration with payment gateways (GCash, PayMaya)
- [ ] Creditor management (save frequently paid creditors)
- [ ] Payables forecasting and cash flow analysis
