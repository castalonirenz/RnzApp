'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useExpenseSharing } from '@/hooks/useExpenseSharing';
import { useAuth } from '@/hooks/useAuth';
import SharedExpenseForm from '@/components/SharedExpenseForm';
import Alert from '@/components/Alert';
import styles from './page.module.css';

export default function EditSharedExpensePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const { user } = useAuth();
  const { isLoading, error, fetchSharedExpenseById, updateSharedExpense } =
    useExpenseSharing();
  const [expense, setExpense] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const loadExpense = async () => {
      try {
        const data = await fetchSharedExpenseById(id);
        setExpense(data);
      } catch (err) {
        setLoadError(
          err?.response?.data?.message || 'Failed to load expense'
        );
      }
    };

    loadExpense();
  }, [id, user, router, fetchSharedExpenseById]);

  const handleSubmit = async (formData) => {
    try {
      await updateSharedExpense(id, formData);
      router.push('/expenses/shared');
    } catch (err) {
      console.error('Failed to update shared expense:', err);
    }
  };

  if (!user) {
    return null;
  }

  if (loadError) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <Alert type="error" message={loadError} />
        </main>
      </div>
    );
  }

  if (!expense && isLoading) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <p>Loading...</p>
        </main>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <Alert type="error" message="Expense not found" />
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.content}>
          <h1>Edit Shared Expense</h1>
          <p className={styles.description}>
            Update details and adjust equal/custom split amounts.
          </p>

          {error && <Alert type="error" message={error} />}

          <SharedExpenseForm
            initialData={expense}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </main>
    </div>
  );
}
