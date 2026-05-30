# My Borrower API

Node.js and Express backend for the My Borrower loan tracking application.

Detailed endpoint documentation: [API_README.md](./API_README.md)

## Stack

- Express
- MongoDB via `mongoose`
- JWT authentication
- MVC-style structure with controllers, models, routes, services, and middleware

## Project Structure

```text
src/
  config/
  controllers/
  middleware/
  models/
  routes/
  services/
  utils/
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
copy .env.example .env
```

3. Start the API:

```bash
npm run dev
```

The server defaults to `http://localhost:4000`.

## Main Endpoints

### Authentication

- `POST /api/register`
- `POST /api/login`
- `POST /api/logout`
- `GET /api/user`

### Loans

- `GET /api/loans` (optional `?status=pending|ongoing|completed`)
- `POST /api/loans`
- `GET /api/loans/:id`
- `PUT /api/loans/:id`
- `PATCH /api/loans/:id/status`
- `DELETE /api/loans/:id`

### Payments and History

- `POST /api/loans/:id/payments`
- `GET /api/loans/:id/history`

### Shared Expenses

- `GET /api/expenses/shared`
- `POST /api/expenses/shared` (`split_items` required)
- `GET /api/expenses/shared/:id`
- `PUT /api/expenses/shared/:id` (`split_items` required)
- `DELETE /api/expenses/shared/:id`
- `GET /api/expenses/shared/summary`
- `GET /api/expenses/shared/settlement`
- `GET /api/expenses/shared/export?format=csv|pdf`

## Notes

- Set `MONGO_URI` in `.env` to your local or hosted MongoDB connection string.
- `POST /api/logout` is stateless and expects the client to discard the JWT.
- Loan updates and payment writes are persisted in MongoDB collections.

## Vercel Deployment Notes

- This repo includes `api/index.js` as the Vercel serverless entrypoint and `vercel.json` routes all paths to it.
- In Vercel Project Settings -> Environment Variables, set:
  - `MONGO_URI`
  - `JWT_SECRET`
  - `JWT_EXPIRES_IN`
- For MongoDB Atlas, allow Vercel egress:
  - Atlas -> Network Access -> add `0.0.0.0/0` for development/testing, or configure a stricter production network setup.
- If your MongoDB password contains special characters, URL-encode it in `MONGO_URI`.
