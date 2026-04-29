'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { usePayables } from '@/hooks/usePayables';
import { useToast } from '@/hooks/useToast';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import PayableForm from '@/components/PayableForm';
import styles from '../form.module.css';

export default function AddPayablePage() {
  const router = useRouter();
  const toast = useToast();
  const { token, isAuthChecked } = useAuth();
  const { isLoading, payableApiAvailable, createPayable } = usePayables();

  useEffect(() => {
    if (!isAuthChecked) return;

    if (!token) {
      router.push('/login');
      return;
    }
  }, [isAuthChecked, token, router]);

  const handleSubmit = async (payload) => {
    try {
      const created = await createPayable(payload);
      toast.success('Payable created successfully.');
      router.push(`/payables/${created.id}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to create payable.');
    }
  };

  if (!isAuthChecked) {
    return <div className={styles.container}>Loading add payable page...</div>;
  }
  if (!token) return null;

  return (
    <div className={styles.container}>
      <Link href="/payables" className={styles.backLink}>
        Back to Payables
      </Link>

      <Card className={styles.formCard}>
        <h1>Add Payable</h1>
        <p className={styles.subtitle}>Create a new payable and set its due date and recurrence.</p>

        {!payableApiAvailable && (
          <Alert type="warning">
            Payables API is not available yet. Please integrate `/payables` endpoints first.
          </Alert>
        )}

        <PayableForm
          isLoading={isLoading}
          submitLabel="Save Payable"
          onSubmit={handleSubmit}
          onCancel={() => router.push('/payables')}
        />
      </Card>

      <div className={styles.footerAction}>
        <Button
          variant="secondary"
          onClick={() => router.push('/payables')}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
