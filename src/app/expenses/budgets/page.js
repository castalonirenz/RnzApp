'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useExpenses } from '@/hooks/useExpenses';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Alert from '@/components/Alert';
import { formatCurrency } from '@/utils/calculations';
import styles from './page.module.css';

const PERIOD_LABEL = {
  daily: 'Daily',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

const PERIOD_OPTIONS = ['daily', 'monthly', 'yearly'];

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const getPeriodWindow = (periodType, now = new Date()) => {
  const start = new Date(now);
  const end = new Date(now);

  if (periodType === 'yearly') {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
    end.setFullYear(start.getFullYear() + 1, 0, 1);
    end.setHours(0, 0, 0, 0);
    return { start, end };
  }

  if (periodType === 'monthly') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(start.getMonth() + 1, 1);
    end.setHours(0, 0, 0, 0);
    return { start, end };
  }

  start.setHours(0, 0, 0, 0);
  end.setDate(start.getDate() + 1);
  end.setHours(0, 0, 0, 0);
  return { start, end };
};

const getBoundaryDate = (value, type) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  if (typeof value === 'string' && value.length <= 10) {
    if (type === 'end') {
      parsed.setHours(23, 59, 59, 999);
    } else {
      parsed.setHours(0, 0, 0, 0);
    }
  }

  return parsed;
};

const isExpenseInsideBudgetWindow = (expenseDate, budget, now = new Date()) => {
  const date = new Date(expenseDate);
  if (Number.isNaN(date.getTime())) return false;

  const { start, end } = getPeriodWindow(budget.period_type || 'monthly', now);
  if (date < start || date >= end) return false;

  const startDate = getBoundaryDate(budget.start_date, 'start');
  if (startDate && date < startDate) return false;

  const endDate = getBoundaryDate(budget.end_date, 'end');
  if (endDate && date > endDate) return false;

  return true;
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export default function BudgetsPage() {
  const router = useRouter();
  const { token, isAuthChecked } = useAuth();
  const {
    expenses,
    budgets,
    budgetApiAvailable,
    isLoading,
    error,
    fetchExpenses,
    fetchBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
    exportBudgetReport,
  } = useExpenses();

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [budgetExportingKey, setBudgetExportingKey] = useState('');
  const [budgetActionKey, setBudgetActionKey] = useState('');
  const [editingBudgetId, setEditingBudgetId] = useState('');
  const [budgetForm, setBudgetForm] = useState({
    name: '',
    amount_limit: '',
    period_type: 'monthly',
  });

  useEffect(() => {
    if (!isAuthChecked) return;

    if (!token) {
      router.push('/login');
      return;
    }

    let mounted = true;
    const bootstrap = async () => {
      await Promise.allSettled([fetchBudgets(), fetchExpenses()]);
      if (mounted) {
        setIsBootstrapping(false);
      }
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [isAuthChecked, token, router, fetchBudgets, fetchExpenses]);

  const budgetSnapshots = useMemo(() => {
    const now = new Date();

    return budgets.map((budget) => {
      const amountLimit = toNumber(budget.amount_limit, 0);
      const linkedExpenses = expenses.filter(
        (expense) =>
          expense?.budget_id != null &&
          String(expense.budget_id) === String(budget.id) &&
          isExpenseInsideBudgetWindow(expense.expense_date, budget, now)
      );

      const fallbackSpent = linkedExpenses.reduce(
        (sum, expense) => sum + toNumber(expense.amount, 0),
        0
      );
      const spent = budget.total_spent == null ? fallbackSpent : toNumber(budget.total_spent, 0);
      const remaining =
        budget.remaining_balance == null
          ? amountLimit - spent
          : toNumber(budget.remaining_balance, amountLimit - spent);
      const progress = amountLimit > 0 ? Math.min((spent / amountLimit) * 100, 100) : 0;

      return {
        ...budget,
        spent,
        remaining,
        progress,
        amountLimit,
      };
    });
  }, [budgets, expenses]);

  const resetBudgetForm = () => {
    setBudgetForm({
      name: '',
      amount_limit: '',
      period_type: 'monthly',
    });
    setEditingBudgetId('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!budgetForm.name || !budgetForm.amount_limit || !budgetForm.period_type) {
      setFormError('Budget name, amount limit, and period are required.');
      return;
    }

    const amountLimit = Number(budgetForm.amount_limit);
    if (!Number.isFinite(amountLimit) || amountLimit <= 0) {
      setFormError('Amount limit must be a valid number greater than 0.');
      return;
    }

    try {
      const payload = {
        name: budgetForm.name.trim(),
        amount_limit: amountLimit,
        period_type: budgetForm.period_type,
      };

      if (editingBudgetId) {
        setBudgetActionKey(`${editingBudgetId}:update`);
        await updateBudget(editingBudgetId, payload);
        setSuccessMessage('Budget updated successfully.');
      } else {
        setBudgetActionKey('create');
        await createBudget(payload);
        setSuccessMessage('Budget saved successfully.');
      }

      await Promise.allSettled([fetchBudgets(), fetchExpenses()]);
      resetBudgetForm();
    } catch {
      // handled by store
    } finally {
      setBudgetActionKey('');
    }
  };

  const handleStartEdit = (budget) => {
    setFormError('');
    setSuccessMessage('');
    setEditingBudgetId(String(budget.id));
    setBudgetForm({
      name: budget.name || '',
      amount_limit: String(toNumber(budget.amount_limit, 0)),
      period_type: budget.period_type || 'monthly',
    });
  };

  const handleDeleteBudget = async (budget) => {
    const budgetId = String(budget.id);
    const confirmDelete = window.confirm(
      `Delete "${budget.name}" budget? Linked expenses will be detached automatically.`
    );
    if (!confirmDelete) return;

    setFormError('');
    setSuccessMessage('');
    setBudgetActionKey(`${budgetId}:delete`);

    try {
      await deleteBudget(budgetId);
      await Promise.allSettled([fetchBudgets(), fetchExpenses()]);
      if (editingBudgetId === budgetId) {
        resetBudgetForm();
      }
      setSuccessMessage('Budget deleted successfully.');
    } catch {
      // handled by store
    } finally {
      setBudgetActionKey('');
    }
  };

  const handleBudgetExport = async (budgetId, format) => {
    const exportKey = `${budgetId}:${format}`;
    setBudgetExportingKey(exportKey);

    try {
      const { blob, filename } = await exportBudgetReport(budgetId, format);
      const fallback = `budget-${budgetId}-${new Date().toISOString().slice(0, 10)}.${format}`;
      downloadBlob(blob, filename || fallback);
    } catch {
      // handled by store
    } finally {
      setBudgetExportingKey('');
    }
  };

  if (!isAuthChecked) {
    return <div className={styles.container}>Loading budget page...</div>;
  }
  if (!token) return null;
  if (isBootstrapping) {
    return <div className={styles.container}>Loading budget page...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Budget Management</h1>
        <p>Create, edit, or delete budgets while tracking usage.</p>
      </div>

      {(error || formError) && <Alert type="error">{formError || error}</Alert>}
      {successMessage && <Alert type="success">{successMessage}</Alert>}

      {!budgetApiAvailable && (
        <Alert type="warning">
          Budget API is not available yet. Please integrate `/budgets` endpoints first.
        </Alert>
      )}

      <div className="d-flex flex-wrap w-100">
        <div className="col-12 col-lg-5">
          <Card>
            <form className={styles.form} onSubmit={handleSubmit}>
              <Input
                label="Budget Name"
                name="budget_name"
                value={budgetForm.name}
                onChange={(e) => setBudgetForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Food Budget, Fuel Budget"
                required
              />
              <Input
                label="Amount Limit (PHP)"
                type="number"
                step="0.01"
                min="0.01"
                name="amount_limit"
                value={budgetForm.amount_limit}
                onChange={(e) =>
                  setBudgetForm((prev) => ({ ...prev, amount_limit: e.target.value }))
                }
                placeholder="5000.00"
                required
              />
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Period Type</label>
                <select
                  className={styles.selectInput}
                  value={budgetForm.period_type}
                  onChange={(e) =>
                    setBudgetForm((prev) => ({ ...prev, period_type: e.target.value }))
                  }
                >
                  {PERIOD_OPTIONS.map((periodType) => (
                    <option key={periodType} value={periodType}>
                      {PERIOD_LABEL[periodType]}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formActions}>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading || !budgetApiAvailable || budgetActionKey.endsWith(':delete')}
                >
                  {editingBudgetId ? 'Update Budget' : 'Save Budget'}
                </Button>
                {editingBudgetId && (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isLoading}
                    onClick={resetBudgetForm}
                  >
                    Cancel Edit
                  </Button>
                )}
              </div>
            </form>
          </Card>
        </div>

        <div className="col-12 col-lg-7">
          <Card>
            <h2>Budget List</h2>
            <div className={styles.budgetList}>
              {budgetSnapshots.length > 0 ? (
                budgetSnapshots.map((budget) => (
                  <div className={styles.budgetCard} key={budget.id}>
                    <div className={styles.budgetCardHeader}>
                      <div>
                        <h4>{budget.name}</h4>
                        <p>{PERIOD_LABEL[budget.period_type] || budget.period_type}</p>
                      </div>
                      <strong>{formatCurrency(budget.remaining)}</strong>
                    </div>
                    <div className={styles.budgetMeta}>
                      <span>Spent: {formatCurrency(budget.spent)}</span>
                      <span>Limit: {formatCurrency(budget.amountLimit)}</span>
                    </div>
                    <div className={styles.progressTrack}>
                      <div
                        className={styles.progressBar}
                        style={{
                          width: `${Math.max(0, budget.progress)}%`,
                          backgroundColor: budget.remaining < 0 ? '#dc2626' : '#0f766e',
                        }}
                      />
                    </div>
                    <div className={styles.cardActions}>
                      <Link href={`/expenses/budgets/${budget.id}`}>
                        <Button size="sm" variant="primary">
                          View Expenses
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleStartEdit(budget)}
                        disabled={
                          isLoading ||
                          budgetActionKey === `${budget.id}:delete` ||
                          budgetExportingKey.startsWith(`${budget.id}:`)
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteBudget(budget)}
                        disabled={isLoading || budgetActionKey === `${budget.id}:delete`}
                      >
                        {budgetActionKey === `${budget.id}:delete` ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                    <div className={styles.exportButtons}>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleBudgetExport(budget.id, 'csv')}
                        disabled={
                          budgetExportingKey === `${budget.id}:csv` ||
                          budgetActionKey === `${budget.id}:delete`
                        }
                      >
                        {budgetExportingKey === `${budget.id}:csv` ? 'Exporting...' : 'CSV'}
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleBudgetExport(budget.id, 'pdf')}
                        disabled={
                          budgetExportingKey === `${budget.id}:pdf` ||
                          budgetActionKey === `${budget.id}:delete`
                        }
                      >
                        {budgetExportingKey === `${budget.id}:pdf` ? 'Exporting...' : 'PDF'}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p>No budgets yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
