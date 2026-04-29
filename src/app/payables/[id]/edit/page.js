'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { usePayables } from '@/hooks/usePayables';
import { useToast } from '@/hooks/useToast';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import PayableForm from '@/components/PayableForm';
import styles from '../../form.module.css';

export default function EditPayablePage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const payableId = params?.id ? String(params.id) : '';
  const { token, isAuthChecked } = useAuth();
  const {
    isLoading,
    payableApiAvailable,
    currentPayable,
    fetchPayableById,
    updatePayable,
  } = usePayables();

  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    if (!isAuthChecked) return;

    if (!token) {
      router.push('/login');
      return;
    }

    let mounted = true;
    const bootstrap = async () => {
      try {
        await fetchPayableById(payableId);
      } finally {
        if (mounted) {
          setIsBootstrapping(false);
        }
      }
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [isAuthChecked, token, payableId, router, fetchPayableById]);

  const handleSubmit = async (payload) => {
    try {
      const updated = await updatePayable(payableId, payload);
      toast.success('Payable updated successfully.');
      router.push(`/payables/${updated.id || payableId}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update payable.');
    }
  };

  if (!isAuthChecked) {
    return <div className={styles.container}>Loading edit payable page...</div>;
  }
  if (!token) return null;
  if (isBootstrapping) {
    return <div className={styles.container}>Loading edit payable page...</div>;
  }

  if (!currentPayable) {
    return (
      <div className={styles.container}>
        <Alert type="error">Payable not found.</Alert>
        <Link href="/payables">
          <Button variant="secondary">Back to Payables</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link href={`/payables/${payableId}`} className={styles.backLink}>
        Back to Payable Details
      </Link>

      <Card className={styles.formCard}>
        <h1>Edit Payable</h1>
        <p className={styles.subtitle}>Update creditor details, amount, due date, and recurrence.</p>

        {!payableApiAvailable && (
          <Alert type="warning">
            Payables API is not available yet. Please integrate `/payables` endpoints first.
          </Alert>
        )}

        <PayableForm
          initialData={currentPayable}
          isLoading={isLoading}
          submitLabel="Update Payable"
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/payables/${payableId}`)}
        />
      </Card>

      <div className={styles.footerAction}>
        <Button
          variant="secondary"
          onClick={() => router.push(`/payables/${payableId}`)}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
