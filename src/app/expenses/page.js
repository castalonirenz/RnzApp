'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useExpenses } from '@/hooks/useExpenses';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Alert from '@/components/Alert';
import { formatCurrency, formatDateTime } from '@/utils/calculations';
import styles from './page.module.css';

export default function ExpensesPage() {
  const router = useRouter();
  const { token, isAuthChecked } = useAuth();
  const {
    expenses,
    summary,
    period,
    isLoading,
    error,
    setPeriod,
    fetchExpenses,
    fetchSummary,
    createExpense,
    deleteExpense,
  } = useExpenses();
  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: '',
    notes: '',
    expense_date: new Date().toISOString().slice(0, 16),
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isAuthChecked) return;
    if (!token) {
      router.push('/login');
      return;
    }

    fetchExpenses();
    fetchSummary(period);
  }, [isAuthChecked, token, router, fetchExpenses, fetchSummary, period]);

  const totalExpense = useMemo(
    () => expenses.reduce((acc, item) => acc + Number(item.amount || 0), 0),
    [expenses]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.title || !form.amount || !form.expense_date) {
      setFormError('Title, amount, and date/time are required');
      return;
    }

    try {
      await createExpense({
        ...form,
        amount: Number(form.amount),
        expense_date: new Date(form.expense_date).toISOString(),
      });
      await fetchSummary(period);
      setForm({
        title: '',
        amount: '',
        category: '',
        notes: '',
        expense_date: new Date().toISOString().slice(0, 16),
      });
    } catch {
      // handled by store
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteExpense(id);
      await fetchSummary(period);
    } catch {
      // handled by store
    }
  };

  const handlePeriodChange = async (nextPeriod) => {
    setPeriod(nextPeriod);
    await fetchSummary(nextPeriod);
  };

  if (!isAuthChecked || isLoading) {
    return <div className={styles.container}>Loading expenses...</div>;
  }
  if (!token) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Expense Tracker</h1>
        <p>Daily expense monitoring with dynamic totals</p>
      </div>

      <Card className={styles.totalCard}>
        <h3>Total Expense</h3>
        <p className={styles.total}>{formatCurrency(totalExpense)}</p>
      </Card>

      <Card>
        <h2>Add Expense</h2>
        {(error || formError) && <Alert type="error">{formError || error}</Alert>}
        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            label="Title"
            name="title"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Transportation, lunch, etc."
            required
          />
          <Input
            label="Amount (PHP)"
            type="number"
            step="0.01"
            min="0.01"
            name="amount"
            value={form.amount}
            onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
            placeholder="0.00"
            required
          />
          <Input
            label="Date & Time"
            type="datetime-local"
            name="expense_date"
            value={form.expense_date}
            onChange={(e) => setForm((prev) => ({ ...prev, expense_date: e.target.value }))}
            required
          />
          <Input
            label="Category"
            name="category"
            value={form.category}
            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            placeholder="Food, Bills, Travel"
          />
          <Input
            label="Notes"
            name="notes"
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Optional"
          />
          <Button type="submit" variant="primary">Save Expense</Button>
        </form>
      </Card>

      <Card>
        <div className={styles.summaryHeader}>
          <h2>Dynamic Summary</h2>
          <div className={styles.filters}>
            <Button variant={period === 'daily' ? 'primary' : 'secondary'} onClick={() => handlePeriodChange('daily')}>Daily</Button>
            <Button variant={period === 'monthly' ? 'primary' : 'secondary'} onClick={() => handlePeriodChange('monthly')}>Monthly</Button>
            <Button variant={period === 'yearly' ? 'primary' : 'secondary'} onClick={() => handlePeriodChange('yearly')}>Yearly</Button>
          </div>
        </div>
        <div className={styles.summaryList}>
          {summary.length > 0 ? summary.map((item) => (
            <div className={styles.summaryRow} key={item.period}>
              <span>{item.period}</span>
              <strong>{formatCurrency(item.total)}</strong>
            </div>
          )) : <p>No summary yet.</p>}
        </div>
      </Card>

      <Card>
        <h2>Expense History</h2>
        <div className={styles.expenseList}>
          {expenses.length > 0 ? expenses.map((expense) => (
            <div className={styles.expenseRow} key={expense.id}>
              <div>
                <h4>{expense.title}</h4>
                <p>{formatDateTime(expense.expense_date)} {expense.category ? `• ${expense.category}` : ''}</p>
              </div>
              <div className={styles.expenseMeta}>
                <strong>{formatCurrency(expense.amount)}</strong>
                <Button variant="danger" size="sm" onClick={() => handleDelete(expense.id)}>Delete</Button>
              </div>
            </div>
          )) : <p>No expenses yet.</p>}
        </div>
      </Card>
    </div>
  );
}
