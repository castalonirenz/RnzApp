'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useExpenses } from '@/hooks/useExpenses';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Alert from '@/components/Alert';
import ReceiptAmountAssistant from '@/components/ReceiptAmountAssistant';
import { formatCurrency } from '@/utils/calculations';
import styles from '../../add/page.module.css';

const PERIOD_LABEL = {
  daily: 'Daily',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const toDateTimeLocal = (dateValue) => {
  if (!dateValue) return new Date().toISOString().slice(0, 16);
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 16);

  const offsetMinutes = parsed.getTimezoneOffset();
  return new Date(parsed.getTime() - offsetMinutes * 60000).toISOString().slice(0, 16);
};

export default function EditExpensePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, isAuthChecked } = useAuth();
  const {
    expenses,
    budgets,
    budgetApiAvailable,
    period,
    isLoading,
    error,
    fetchExpenses,
    fetchBudgets,
    fetchSummary,
    updateExpense,
  } = useExpenses();

  const expenseId = params?.id ? String(params.id) : '';
  const fromPath = searchParams.get('from');
  const returnPath =
    fromPath && fromPath.startsWith('/expenses') ? fromPath : '/expenses/list';
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [formDraft, setFormDraft] = useState({ expenseId: '', values: {} });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isAuthChecked) return;

    if (!token) {
      router.push('/login');
      return;
    }

    let mounted = true;

    const bootstrap = async () => {
      await Promise.allSettled([fetchExpenses(), fetchBudgets()]);
      if (mounted) {
        setIsBootstrapping(false);
      }
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [isAuthChecked, token, router, fetchExpenses, fetchBudgets]);

  const selectedExpense = useMemo(
    () => expenses.find((expense) => String(expense.id) === expenseId) || null,
    [expenses, expenseId]
  );

  const form = useMemo(() => {
    const base = selectedExpense
      ? {
          title: selectedExpense.title || '',
          amount: selectedExpense.amount != null ? String(selectedExpense.amount) : '',
          category: selectedExpense.category || '',
          notes: selectedExpense.notes || '',
          budget_id:
            selectedExpense.budget_id == null || selectedExpense.budget_id === ''
              ? ''
              : String(selectedExpense.budget_id),
          expense_date: toDateTimeLocal(selectedExpense.expense_date),
        }
      : {
          title: '',
          amount: '',
          category: '',
          notes: '',
          budget_id: '',
          expense_date: new Date().toISOString().slice(0, 16),
        };

    const draft = formDraft.expenseId === expenseId ? formDraft.values : {};
    return { ...base, ...draft };
  }, [selectedExpense, formDraft, expenseId]);

  const updateFormField = (field, value) => {
    setFormDraft((prev) => {
      const previousValues = prev.expenseId === expenseId ? prev.values : {};
      return {
        expenseId,
        values: { ...previousValues, [field]: value },
      };
    });
  };

  const handleAmountDetected = (amountText) => {
    updateFormField('amount', amountText);
    setFormError('');
  };

  const selectedBudget = useMemo(
    () => budgets.find((budget) => String(budget.id) === String(form.budget_id)) || null,
    [budgets, form.budget_id]
  );

  const selectedBudgetSnapshot = useMemo(() => {
    if (!selectedBudget) return null;

    const amountLimit = toNumber(selectedBudget.amount_limit, 0);
    const spent = selectedBudget.total_spent == null ? null : toNumber(selectedBudget.total_spent, 0);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.title || !form.amount || !form.expense_date) {
      setFormError('Title, amount, and date/time are required.');
      return;
    }

    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError('Amount must be a valid number greater than 0.');
      return;
    }

    if (!expenseId) {
      setFormError('Expense ID is missing.');
      return;
    }

    try {
      await updateExpense(expenseId, {
        title: form.title.trim(),
        amount,
        category: form.category.trim() || undefined,
        notes: form.notes.trim() || undefined,
        budget_id: form.budget_id ? form.budget_id : null,
        expense_date: new Date(form.expense_date).toISOString(),
      });

      await Promise.allSettled([
        fetchExpenses(),
        fetchSummary(period),
        fetchBudgets(),
      ]);

      router.push(returnPath);
    } catch {
      // handled by store
    }
  };

  if (!isAuthChecked) {
    return <div className={styles.container}>Loading edit expense page...</div>;
  }
  if (!token) return null;
  if (isBootstrapping) {
    return <div className={styles.container}>Loading edit expense page...</div>;
  }

  if (!selectedExpense) {
    return (
      <div className={styles.container}>
        <Alert type="error">Expense not found.</Alert>
        <Button variant="secondary" onClick={() => router.push(returnPath)}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Edit Expense</h1>
        <p>Update expense details and budget assignment.</p>
      </div>

      {(error || formError) && <Alert type="error">{formError || error}</Alert>}

      {!budgetApiAvailable && (
        <Alert type="warning">
          Budget API is not available yet. You can still save expense updates without a budget.
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
                onChange={(e) => updateFormField('title', e.target.value)}
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
                onChange={(e) => updateFormField('amount', e.target.value)}
                placeholder="0.00"
                required
              />
              <ReceiptAmountAssistant onAmountDetected={handleAmountDetected} />
              <Input
                label="Date & Time"
                type="datetime-local"
                name="expense_date"
                value={form.expense_date}
                onChange={(e) => updateFormField('expense_date', e.target.value)}
                required
              />
              <Input
                label="Category"
                name="category"
                value={form.category}
                onChange={(e) => updateFormField('category', e.target.value)}
                placeholder="Food, Bills, Travel"
              />
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Assign Budget (Optional)</label>
                <select
                  className={styles.selectInput}
                  value={form.budget_id}
                  onChange={(e) => updateFormField('budget_id', e.target.value)}
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
                onChange={(e) => updateFormField('notes', e.target.value)}
                placeholder="Optional"
              />

              <div className={styles.formActions}>
                <Button type="submit" variant="primary" disabled={isLoading}>
                  Update Expense
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isLoading}
                  onClick={() => router.push(returnPath)}
                >
                  Cancel
                </Button>
              </div>
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
