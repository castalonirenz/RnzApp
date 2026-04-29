'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useExpenseSharing } from '@/hooks/useExpenseSharing';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import SharedExpenseForm from '@/components/SharedExpenseForm';
import styles from './page.module.css';

export default function AddSharedExpensePage() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { isLoading, createSharedExpense } = useExpenseSharing();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleSubmit = async (formData) => {
    try {
      await createSharedExpense(formData);
      toast.success('Shared expense created successfully.');
      router.push('/expenses/shared');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create shared expense');
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
            Add a shared expense and choose equal or custom split among participants.
          </p>

          <SharedExpenseForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </main>
    </div>
  );
}
