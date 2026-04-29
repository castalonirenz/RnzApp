'use client';

import { useEffect, useMemo, useState } from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useExpenses } from '@/hooks/useExpenses';
import { useToast } from '@/hooks/useToast';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Alert from '@/components/Alert';
import ReceiptAmountAssistant from '@/components/ReceiptAmountAssistant';
import { formatCurrency } from '@/utils/calculations';
import styles from './page.module.css';

const PERIOD_LABEL = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const toDateTimeLocal = (date = new Date()) => {
  const offsetMinutes = date.getTimezoneOffset();
  return new Date(date.getTime() - offsetMinutes * 60000).toISOString().slice(0, 19);
};

function AddExpensePageContent() {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const preselectedBudgetId = searchParams.get('budget_id') || searchParams.get('budgetId') || '';
  const { token, isAuthChecked } = useAuth();
  const {
    budgets,
    budgetApiAvailable,
    period,
    isLoading,
    fetchBudgets,
    fetchExpenses,
    fetchSummary,
    createExpense,
  } = useExpenses();

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: '',
    notes: '',
    budget_id: preselectedBudgetId,
    expense_date: toDateTimeLocal(),
  });

  const handleAmountDetected = (amountText) => {
    setForm((prev) => ({ ...prev, amount: amountText }));
  };

  const selectedBudget = useMemo(
    () => budgets.find((budget) => String(budget.id) === String(form.budget_id)) || null,
    [budgets, form.budget_id]
  );

  console.log('Selected budget for debugging:', selectedBudget);

  const selectedBudgetSnapshot = useMemo(() => {
    if (!selectedBudget) return null;

    const amountLimit = toNumber(selectedBudget.amount_limit, 0);
    const spent =
      selectedBudget.total_spent == null ? null : toNumber(selectedBudget.total_spent, 0);
    const remainingFromApi =
      selectedBudget.remaining_balance == null
        ? null
        : toNumber(selectedBudget.remaining_balance, amountLimit);

    const currentRemaining =
      remainingFromApi == null ? amountLimit - (spent == null ? 0 : spent) : remainingFromApi;

    const draftAmount = toNumber(form.amount, 0);
    const hasDraftAmount = draftAmount > 0;
    const projectedRemaining = hasDraftAmount ? currentRemaining - draftAmount : currentRemaining;

    return {
      amountLimit,
      currentRemaining,
      projectedRemaining,
      hasDraftAmount,
    };
  }, [selectedBudget, form.amount]);

  useEffect(() => {
    if (!isAuthChecked) return;

    if (!token) {
      router.push('/login');
      return;
    }

    let mounted = true;
    const bootstrap = async () => {
      await Promise.allSettled([fetchBudgets()]);
      if (mounted) {
        setIsBootstrapping(false);
      }
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [isAuthChecked, token, router, fetchBudgets]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.amount || !form.expense_date) {
      toast.error('Title, amount, and date/time are required.');
      return;
    }

    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Amount must be a valid number greater than 0.');
      return;
    }

    const parsedExpenseDate = new Date(form.expense_date);
    if (Number.isNaN(parsedExpenseDate.getTime())) {
      toast.error('Please provide a valid date and time.');
      return;
    }

    try {
      await createExpense({
        title: form.title.trim(),
        amount,
        category: form.category.trim() || undefined,
        notes: form.notes.trim() || undefined,
        budget_id: form.budget_id ? form.budget_id : undefined,
        expense_date: parsedExpenseDate.toISOString(),
      });

      await Promise.allSettled([
        fetchExpenses(),
        fetchSummary(period),
        fetchBudgets(),
      ]);

      setForm({
        title: '',
        amount: '',
        category: '',
        notes: '',
        budget_id: preselectedBudgetId || '',
        expense_date: toDateTimeLocal(),
      });
      toast.success('Expense saved successfully.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save expense.');
    }
  };

  if (!isAuthChecked) {
    return <div className={styles.container}>Loading add expense page...</div>;
  }
  if (!token) return null;
  if (isBootstrapping) {
    return <div className={styles.container}>Loading add expense page...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Add Expense</h1>
        <p>Record a new expense and optionally assign it to a budget.</p>
      </div>

      {!budgetApiAvailable && (
        <Alert type="warning">
          Budget API is not available yet. You can still save expenses without a budget.
        </Alert>
      )}

      <div className="d-flex flex-wrap w-100">
        <div className="col-12 col-lg-7">
          <Card>
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
              {/* <ReceiptAmountAssistant onAmountDetected={handleAmountDetected} /> */}
              <Input
                label="Date & Time"
                type="datetime-local"
                step="1"
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
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Assign Budget (Optional)</label>
                <select
                  className={styles.selectInput}
                  value={form.budget_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, budget_id: e.target.value }))}
                  disabled={!budgetApiAvailable || budgets.length === 0}
                >
                  <option value="">No Budget</option>
                  {budgets.map((budget) => (
                    <option key={budget.id} value={budget.id}>
                      {budget.name} ({PERIOD_LABEL[budget.period_type] || budget.period_type})
                    </option>
                  ))}
                </select>
                {selectedBudgetSnapshot && (
                  <div className={styles.budgetHint}>
                    <p>
                      Budget Limit: <strong>{formatCurrency(selectedBudgetSnapshot.amountLimit)}</strong>
                    </p>
                    <p>
                      Remaining Balance:{' '}
                      <strong>{formatCurrency(selectedBudgetSnapshot.currentRemaining)}</strong>
                    </p>
                    {selectedBudgetSnapshot.hasDraftAmount && (
                      <p className={styles.projectedText}>
                        After this expense:{' '}
                        <strong
                          className={
                            selectedBudgetSnapshot.projectedRemaining < 0
                              ? styles.balanceNegative
                              : styles.balancePositive
                          }
                        >
                          {formatCurrency(selectedBudgetSnapshot.projectedRemaining)}
                        </strong>
                      </p>
                    )}
                  </div>
                )}
              </div>
              <Input
                label="Notes"
                name="notes"
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional"
              />
              <Button type="submit" variant="primary" disabled={isLoading}>
                Save Expense
              </Button>
            </form>
          </Card>
        </div>

        <div className="col-12 col-lg-5">
          <Card>
            <h3>Available Budgets</h3>
            {budgets.length > 0 ? (
              <div className={styles.budgetList}>
                {budgets.map((budget) => (
                  <div className={styles.budgetRow} key={budget.id}>
                    <strong>{budget.name}</strong>
                    <span>{PERIOD_LABEL[budget.period_type] || budget.period_type}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No budgets yet. Open Create Budget from the menu.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AddExpensePage() {
  return (
    <Suspense fallback={<div className={styles.container}>Loading add expense page...</div>}>
      <AddExpensePageContent />
    </Suspense>
  );
}
