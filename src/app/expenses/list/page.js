'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useExpenses } from '@/hooks/useExpenses';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import { formatCurrency, formatDateTime } from '@/utils/calculations';
import styles from '../page.module.css';

const EXPENSES_PER_PAGE = 6;

export default function ExpenseListPage() {
  const router = useRouter();
  const { token, isAuthChecked } = useAuth();
  const {
    expenses,
    budgets,
    isLoading,
    error,
    fetchExpenses,
    fetchBudgets,
    deleteExpense,
  } = useExpenses();

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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

  const budgetNameById = useMemo(() => {
    return budgets.reduce((acc, budget) => {
      if (budget?.id != null) {
        acc[String(budget.id)] = budget.name;
      }
      return acc;
    }, {});
  }, [budgets]);

  const filteredExpenses = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return expenses;

    return expenses.filter((expense) =>
      [
        expense.title,
        expense.category,
        expense.notes,
        expense.expense_date,
        budgetNameById[String(expense.budget_id)],
        String(expense.amount ?? ''),
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(keyword))
    );
  }, [expenses, searchTerm, budgetNameById]);

  const sortedFilteredExpenses = useMemo(
    () =>
      [...filteredExpenses].sort(
        (a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()
      ),
    [filteredExpenses]
  );

  const totalPages = Math.max(1, Math.ceil(sortedFilteredExpenses.length / EXPENSES_PER_PAGE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedExpenses = useMemo(() => {
    const start = (currentPageSafe - 1) * EXPENSES_PER_PAGE;
    return sortedFilteredExpenses.slice(start, start + EXPENSES_PER_PAGE);
  }, [sortedFilteredExpenses, currentPageSafe]);

  const handleDelete = async (id) => {
    try {
      await deleteExpense(id);
      await fetchBudgets();
    } catch {
      // handled by store
    }
  };

  if (!isAuthChecked) {
    return <div className={styles.container}>Loading expense list...</div>;
  }
  if (!token) return null;
  if (isBootstrapping) {
    return <div className={styles.container}>Loading expense list...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Expense List</h1>
        <p>Review, search, and delete saved expenses.</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <div className={styles.quickActions}>
        <Link href="/expenses/add">
          <Button variant="primary">Go To Add Expense</Button>
        </Link>
        <Link href="/expenses">
          <Button variant="secondary">Go To Overview</Button>
        </Link>
      </div>

      <Card>
        <h2>Expense History</h2>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Search title, category, notes, budget..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
        <p className={styles.resultCount}>
          Showing {sortedFilteredExpenses.length} of {expenses.length} expenses
        </p>
        <div className={`${styles.maxHeight} overflow-y-auto`}>
          <div className={styles.expenseList}>
            {paginatedExpenses.length > 0 ? (
              paginatedExpenses.map((expense) => (
                <div className={styles.expenseRow} key={expense.id}>
                  <div>
                    <h4>{expense.title}</h4>
                    <p>
                      {formatDateTime(expense.expense_date)}
                      {expense.category ? ` - ${expense.category}` : ''}
                    </p>
                    {expense.budget_id != null && (
                      <span className={styles.budgetTag}>
                        Budget: {budgetNameById[String(expense.budget_id)] || `#${expense.budget_id}`}
                      </span>
                    )}
                  </div>
                  <div className={styles.expenseMeta}>
                    <strong>{formatCurrency(expense.amount)}</strong>
                    <div className={styles.expenseActions}>
                      <Link href={`/expenses/${expense.id}/edit`}>
                        <Button variant="secondary" size="sm" disabled={isLoading}>
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(expense.id)}
                        disabled={isLoading}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>{expenses.length > 0 ? 'No matching expenses found.' : 'No expenses yet.'}</p>
            )}
          </div>
        </div>
        {sortedFilteredExpenses.length > EXPENSES_PER_PAGE && (
          <div className={styles.pagination}>
            <Button
              variant="secondary"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPageSafe === 1}
            >
              Previous
            </Button>
            <span className={styles.pageLabel}>
              Page {currentPageSafe} of {totalPages}
            </span>
            <Button
              variant="secondary"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPageSafe === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
