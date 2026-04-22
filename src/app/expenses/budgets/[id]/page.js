'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useExpenses } from '@/hooks/useExpenses';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import { formatCurrency, formatDateTime } from '@/utils/calculations';
import styles from '../../page.module.css';

const PERIOD_LABEL = {
  daily: 'Daily',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export default function BudgetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token, isAuthChecked } = useAuth();
  const {
    budgets,
    expenses,
    isLoading,
    error,
    fetchBudgets,
    fetchExpenses,
  } = useExpenses();

  const budgetId = params?.id ? String(params.id) : '';
  const [isBootstrapping, setIsBootstrapping] = useState(true);

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

  const selectedBudget = useMemo(
    () => budgets.find((budget) => String(budget.id) === budgetId) || null,
    [budgets, budgetId]
  );

  const budgetExpenses = useMemo(
    () =>
      [...expenses]
        .filter(
          (expense) =>
            expense?.budget_id != null && String(expense.budget_id) === budgetId
        )
        .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()),
    [expenses, budgetId]
  );

  const budgetSpent = useMemo(() => {
    if (selectedBudget?.total_spent != null) {
      return toNumber(selectedBudget.total_spent, 0);
    }

    return budgetExpenses.reduce((sum, expense) => sum + toNumber(expense.amount, 0), 0);
  }, [selectedBudget, budgetExpenses]);

  const budgetLimit = toNumber(selectedBudget?.amount_limit, 0);
  const budgetRemaining =
    selectedBudget?.remaining_balance == null
      ? budgetLimit - budgetSpent
      : toNumber(selectedBudget.remaining_balance, budgetLimit - budgetSpent);

  if (!isAuthChecked) {
    return <div className={styles.container}>Loading budget details...</div>;
  }
  if (!token) return null;
  if (isBootstrapping) {
    return <div className={styles.container}>Loading budget details...</div>;
  }

  if (!selectedBudget) {
    return (
      <div className={styles.container}>
        <Alert type="error">Budget not found.</Alert>
        <Link href="/expenses/budgets">
          <Button variant="secondary">Back to Budgets</Button>
        </Link>
      </div>
    );
  }

  const returnPath = `/expenses/budgets/${budgetId}`;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>{selectedBudget.name}</h1>
        <p>
          {PERIOD_LABEL[selectedBudget.period_type] || selectedBudget.period_type} budget details
        </p>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <div className={styles.quickActions}>
        <Link href="/expenses/budgets">
          <Button variant="secondary">Back to Budgets</Button>
        </Link>
        <Link href="/expenses/list">
          <Button variant="secondary">All Expenses</Button>
        </Link>
      </div>

      <Card>
        <div className={styles.summaryHeader}>
          <h2>Budget Snapshot</h2>
          <div className={styles.budgetTotals}>
            <span>Limit: {formatCurrency(budgetLimit)}</span>
            <span>Spent: {formatCurrency(budgetSpent)}</span>
            <strong>Remaining: {formatCurrency(budgetRemaining)}</strong>
          </div>
        </div>
      </Card>

      <Card>
        <h2>Expenses Under This Budget</h2>
        <p className={styles.resultCount}>Total linked expenses: {budgetExpenses.length}</p>
        <div className={`${styles.maxHeight} overflow-y-auto`}>
          <div className={styles.expenseList}>
            {budgetExpenses.length > 0 ? (
              budgetExpenses.map((expense) => (
                <div className={styles.expenseRow} key={expense.id}>
                  <div>
                    <h4>{expense.title}</h4>
                    <p>
                      {formatDateTime(expense.expense_date)}
                      {expense.category ? ` - ${expense.category}` : ''}
                    </p>
                    {expense.notes ? <p>Notes: {expense.notes}</p> : null}
                  </div>
                  <div className={styles.expenseMeta}>
                    <strong>{formatCurrency(expense.amount)}</strong>
                    <div className={styles.expenseActions}>
                      <Link
                        href={`/expenses/${expense.id}/edit?from=${encodeURIComponent(returnPath)}`}
                      >
                        <Button variant="secondary" size="sm" disabled={isLoading}>
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>No expenses linked to this budget yet.</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
