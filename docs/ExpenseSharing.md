# Shared Expense Tracking Feature

## Overview

Shared Expense Tracking lets users create, edit, and manage expenses shared by multiple people.
Participants are free-text names (no account needed), and splits can be:

- **Equal split**: everyone pays the same
- **Custom split**: each person pays a different amount

This is useful when one person consumes less (for example, only added water to the receipt).

---

## Features

### Expense Management

- Create expense (title, amount, description, participants)
- Edit expense details
- Delete expense

### Participant Tagging (Free Text)

- Enter names manually (for example: `John, Jane, Mike`)
- No predefined user list required

### Dynamic Split Options

- Equal split (auto-divide amount by participant count)
- Custom split (manual amount per participant)
- Frontend validates custom sum equals total amount

### Table View

Each expense row includes:

- Expense Title
- Total Amount
- Participants
- Share column (`equal amount` or `Custom`)
- Date
- Actions (View/Edit/Delete)

### Downloadable Report

- Export CSV
- Export PDF
- Includes split details per participant

---

## Use Cases

### Equal Split Example

- Title: `Dinner`
- Total: `PHP 2000`
- Participants: `John, Jane, Mike`
- Result: `PHP 666.67` each

### Custom Split Example

- Title: `Dinner + Water`
- Total: `PHP 2000`
- Participants: `John, Jane, Mike`
- Custom shares:
  - John: `PHP 900`
  - Jane: `PHP 900`
  - Mike: `PHP 200`

---

## API Notes

Backend integration details are documented in:

- [SHARED_EXPENSES_BACKEND_INTEGRATION.md](./SHARED_EXPENSES_BACKEND_INTEGRATION.md)

Key fields expected by frontend:

- `split_mode`: `equal` or `custom`
- `participant_shares`: array of `{ name, amount }`

