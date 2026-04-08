const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const DATABASE_FILE = process.env.DATABASE_FILE || path.join(__dirname, 'database.sqlite');

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const db = new sqlite3.Database(DATABASE_FILE, (err) => {
  if (err) {
    console.error('Failed to open database:', err.message);
    process.exit(1);
  }
});

const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) {
    if (err) return reject(err);
    resolve({ id: this.lastID, changes: this.changes });
  });
});

const get = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) return reject(err);
    resolve(row);
  });
});

const all = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) return reject(err);
    resolve(rows);
  });
});

const now = () => new Date().toISOString();

const initializeDatabase = async () => {
  await run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TEXT NOT NULL
  );`);

  await run(`CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    borrower_name TEXT NOT NULL,
    principal REAL NOT NULL,
    interest_rate REAL NOT NULL,
    interest_period TEXT NOT NULL DEFAULT 'annum',
    duration_months INTEGER NOT NULL,
    total_receivable REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    total_payments REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );`);

  await run(`CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (loan_id) REFERENCES loans(id)
  );`);

  await run(`CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    amount_paid REAL,
    balance_after REAL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (loan_id) REFERENCES loans(id)
  );`);

  const loanColumns = await all('PRAGMA table_info(loans)');
  const hasInterestPeriod = loanColumns.some((column) => column.name === 'interest_period');
  if (!hasInterestPeriod) {
    await run("ALTER TABLE loans ADD COLUMN interest_period TEXT NOT NULL DEFAULT 'annum'");
  }
};

const createToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
};

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await get('SELECT id, name, email, created_at FROM users WHERE id = ?', [payload.id]);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  try {
    const existing = await get('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashed = bcrypt.hashSync(password, 10);
    const result = await run(
      'INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, ?)',
      [name, email.toLowerCase(), hashed, now()]
    );

    const user = {
      id: result.id,
      name,
      email: email.toLowerCase(),
      created_at: now(),
    };

    const token = createToken(user);

    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = createToken(user);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, created_at: user.created_at } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed' });
  }
});

app.post('/api/logout', authenticate, (req, res) => {
  res.json({ message: 'Logout successful' });
});

app.get('/api/user', authenticate, (req, res) => {
  res.json(req.user);
});

app.get('/api/loans', authenticate, async (req, res) => {
  try {
    const loans = await all(
      'SELECT * FROM loans WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(loans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch loans' });
  }
});

app.post('/api/loans', authenticate, async (req, res) => {
  const {
    borrower_name,
    principal,
    interest_rate,
    interest_period = 'annum',
    duration_months,
    total_receivable,
  } = req.body;

  if (
    !borrower_name ||
    principal == null ||
    interest_rate == null ||
    duration_months == null ||
    total_receivable == null
  ) {
    return res.status(400).json({ message: 'All loan fields are required' });
  }
  if (!['annum', 'month'].includes(interest_period)) {
    return res.status(400).json({ message: 'Invalid interest period' });
  }

  try {
    const result = await run(
      'INSERT INTO loans (user_id, borrower_name, principal, interest_rate, interest_period, duration_months, total_receivable, status, total_payments, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, borrower_name, principal, interest_rate, interest_period, duration_months, total_receivable, 'pending', 0, now()]
    );
    const loan = await get('SELECT * FROM loans WHERE id = ?', [result.id]);
    res.json(loan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create loan' });
  }
});

const getLoanById = async (id, userId) => {
  return await get('SELECT * FROM loans WHERE id = ? AND user_id = ?', [id, userId]);
};

app.get('/api/loans/:id', authenticate, async (req, res) => {
  try {
    const loan = await getLoanById(req.params.id, req.user.id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }
    res.json(loan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to retrieve loan' });
  }
});

app.put('/api/loans/:id', authenticate, async (req, res) => {
  const {
    borrower_name,
    principal,
    interest_rate,
    interest_period = 'annum',
    duration_months,
    total_receivable,
  } = req.body;

  if (
    !borrower_name ||
    principal == null ||
    interest_rate == null ||
    duration_months == null ||
    total_receivable == null
  ) {
    return res.status(400).json({ message: 'All loan fields are required' });
  }
  if (!['annum', 'month'].includes(interest_period)) {
    return res.status(400).json({ message: 'Invalid interest period' });
  }

  try {
    const loan = await getLoanById(req.params.id, req.user.id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }
    if (loan.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending loans can be edited' });
    }

    await run(
      'UPDATE loans SET borrower_name = ?, principal = ?, interest_rate = ?, interest_period = ?, duration_months = ?, total_receivable = ? WHERE id = ?',
      [borrower_name, principal, interest_rate, interest_period, duration_months, total_receivable, req.params.id]
    );

    const updated = await getLoanById(req.params.id, req.user.id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update loan' });
  }
});

app.patch('/api/loans/:id/status', authenticate, async (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ message: 'Status value is required' });
  }

  try {
    const loan = await getLoanById(req.params.id, req.user.id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const allowed = ['pending', 'ongoing', 'completed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid loan status' });
    }

    const order = { pending: 1, ongoing: 2, completed: 3 };
    if (order[status] < order[loan.status]) {
      return res.status(400).json({ message: 'Cannot transition loan status backwards' });
    }

    await run('UPDATE loans SET status = ? WHERE id = ?', [status, req.params.id]);
    const updated = await getLoanById(req.params.id, req.user.id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update loan status' });
  }
});

app.delete('/api/loans/:id', authenticate, async (req, res) => {
  try {
    const loan = await getLoanById(req.params.id, req.user.id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    await run('DELETE FROM payments WHERE loan_id = ?', [req.params.id]);
    await run('DELETE FROM history WHERE loan_id = ?', [req.params.id]);
    await run('DELETE FROM loans WHERE id = ?', [req.params.id]);

    res.json({ message: 'Loan deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete loan' });
  }
});

app.post('/api/loans/:id/payments', authenticate, async (req, res) => {
  const { amount } = req.body;
  if (amount == null || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ message: 'Valid payment amount is required' });
  }

  try {
    const loan = await getLoanById(req.params.id, req.user.id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const remaining = loan.total_receivable - loan.total_payments;
    if (amount > remaining) {
      return res.status(400).json({ message: 'Payment exceeds remaining balance' });
    }

    await run('INSERT INTO payments (loan_id, amount, created_at) VALUES (?, ?, ?)', [req.params.id, amount, now()]);
    const totalPayments = loan.total_payments + amount;
    let status = loan.status;
    if (totalPayments >= loan.total_receivable) {
      status = 'completed';
    } else if (loan.status === 'pending') {
      status = 'ongoing';
    }
    const balanceAfter = loan.total_receivable - totalPayments;

    await run('UPDATE loans SET total_payments = ?, status = ? WHERE id = ?', [totalPayments, status, req.params.id]);
    await run('INSERT INTO history (loan_id, action, amount_paid, balance_after, created_at) VALUES (?, ?, ?, ?, ?)',
      [req.params.id, 'payment', amount, balanceAfter, now()]
    );

    const updatedLoan = await getLoanById(req.params.id, req.user.id);
    res.json(updatedLoan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add payment' });
  }
});

app.get('/api/loans/:id/history', authenticate, async (req, res) => {
  try {
    const loan = await getLoanById(req.params.id, req.user.id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }
    const history = await all('SELECT * FROM history WHERE loan_id = ? ORDER BY created_at DESC', [req.params.id]);
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch loan history' });
  }
});

initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Node API server listening on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});
