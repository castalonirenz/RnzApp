'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useExpenseSharing } from '@/hooks/useExpenseSharing';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import SharedExpenseForm from '@/components/SharedExpenseForm';
import Alert from '@/components/Alert';
import styles from './page.module.css';

export default function EditSharedExpensePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const toast = useToast();
  const { user } = useAuth();
  const { isLoading, fetchSharedExpenseById, updateSharedExpense } =
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
      toast.success('Shared expense updated successfully.');
      router.push('/expenses/shared');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update shared expense');
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

          <SharedExpenseForm
            initialData={expense}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </main>
    </div>
  );
}
