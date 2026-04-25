'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useExpenseSharing } from '@/hooks/useExpenseSharing';
import { useAuth } from '@/hooks/useAuth';
import SharedExpenseTable from '@/components/SharedExpenseTable';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import Link from 'next/link';
import styles from './page.module.css';

export default function SharedExpensesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    sharedExpenses,
    isLoading,
    error,
    fetchSharedExpenses,
    deleteSharedExpense,
    exportExpenses,
  } = useExpenseSharing();

  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchSharedExpenses();
  }, [user, router, fetchSharedExpenses]);

  const handleEdit = (id) => {
    router.push(`/expenses/shared/${id}/edit`);
  };

  const handleDelete = async (id) => {
    try {
      setDeleteError(null);
      setDeleteSuccess(null);
      await deleteSharedExpense(id);
      setDeleteSuccess('Expense deleted successfully');
      setTimeout(() => setDeleteSuccess(null), 3000);
    } catch (err) {
      setDeleteError(err?.response?.data?.message || 'Failed to delete expense');
    }
  };

  const handleExport = async (format) => {
    try {
      await exportExpenses(format);
    } catch (err) {
      setDeleteError(err?.response?.data?.message || `Failed to export as ${format}`);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1>Shared Expenses</h1>
          <Link href="/expenses/shared/add">
            <Button variant="primary">+ Add Shared Expense</Button>
          </Link>
        </div>

        {error && <Alert type="error" message={error} />}
        {deleteError && <Alert type="error" message={deleteError} />}
        {deleteSuccess && <Alert type="success" message={deleteSuccess} />}

        <SharedExpenseTable
          expenses={sharedExpenses}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onExport={handleExport}
          isLoading={isLoading}
        />

        {sharedExpenses.length > 0 && (
          <div className={styles.summary}>
            <h2>Quick Summary</h2>
            <div className={styles.summaryCards}>
              <div className={styles.card}>
                <span className={styles.label}>Total Expenses</span>
                <span className={styles.value}>{sharedExpenses.length}</span>
              </div>
              <div className={styles.card}>
                <span className={styles.label}>Total Amount</span>
                <span className={styles.value}>
                  ₱
                  {sharedExpenses
                    .reduce((sum, exp) => sum + exp.amount, 0)
                    .toFixed(2)}
                </span>
              </div>
              <div className={styles.card}>
                <span className={styles.label}>Average Per Expense</span>
                <span className={styles.value}>
                  ₱
                  {(
                    sharedExpenses.reduce((sum, exp) => sum + exp.amount, 0) /
                    sharedExpenses.length
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
