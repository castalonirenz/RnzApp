'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useExpenseSharing } from '@/hooks/useExpenseSharing';
import { useAuth } from '@/hooks/useAuth';
import SharedExpenseForm from '@/components/SharedExpenseForm';
import Alert from '@/components/Alert';
import styles from './page.module.css';

export default function AddSharedExpensePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isLoading, error, createSharedExpense } = useExpenseSharing();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleSubmit = async (formData) => {
    try {
      await createSharedExpense(formData);
      router.push('/expenses/shared');
    } catch (err) {
      console.error('Failed to create shared expense:', err);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.content}>
          <h1>Create New Shared Expense</h1>
          <p className={styles.description}>
            Add a new shared expense and split it equally among participants.
          </p>

          {error && <Alert type="error" message={error} />}

          <SharedExpenseForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </main>
    </div>
  );
}
