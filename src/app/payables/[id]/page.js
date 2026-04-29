'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { usePayables } from '@/hooks/usePayables';
import { useToast } from '@/hooks/useToast';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import Alert from '@/components/Alert';
import PaymentHistory from '@/components/PaymentHistory';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/calculations';
import styles from './page.module.css';

export default function PayableDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const payableId = params?.id ? String(params.id) : '';
  const { token, isAuthChecked } = useAuth();
  const {
    currentPayable,
    paymentHistory,
    isLoading,
    fetchPayableById,
    fetchPaymentHistory,
    deletePayable,
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
        await Promise.allSettled([fetchPayableById(payableId), fetchPaymentHistory(payableId)]);
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
  }, [isAuthChecked, token, payableId, router, fetchPayableById, fetchPaymentHistory]);

  const statusForBadge = useMemo(() => {
    if (!currentPayable) return 'pending';

    const dueDate = new Date(currentPayable.due_date);
    const isOverdue =
      currentPayable.status !== 'completed' &&
      Number(currentPayable.balance || 0) > 0 &&
      !Number.isNaN(dueDate.getTime()) &&
      dueDate < new Date();

    return isOverdue ? 'overdue' : currentPayable.status;
  }, [currentPayable]);

  const handleDelete = async () => {
    if (!currentPayable) return;
    const canDelete =
      currentPayable.status === 'pending' && Number(currentPayable.amount_paid || 0) <= 0;

    if (!canDelete) {
      toast.warning('Only pending payables with no payment can be deleted.');
      return;
    }

    const confirmed = window.confirm(
      `Delete payable for "${currentPayable.creditor_name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deletePayable(payableId);
      toast.success('Payable deleted successfully.');
      router.push('/payables');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete payable.');
    }
  };

  if (!isAuthChecked) {
    return <div className={styles.container}>Loading payable details...</div>;
  }
  if (!token) return null;
  if (isBootstrapping) {
    return <div className={styles.container}>Loading payable details...</div>;
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
      <div className={styles.header}>
        <div>
          <Link href="/payables" className={styles.backLink}>
            Back to Payables
          </Link>
          <h1>{currentPayable.creditor_name}</h1>
          <p>{currentPayable.description || 'No description provided.'}</p>
        </div>
        <Badge status={statusForBadge}>{statusForBadge.replace(/_/g, ' ')}</Badge>
      </div>

      <div className={styles.actions}>
        <Link href={`/payables/${payableId}/payment`}>
          <Button variant="primary" disabled={isLoading || Number(currentPayable.balance || 0) <= 0}>
            Record Payment
          </Button>
        </Link>
        <Link href={`/payables/${payableId}/edit`}>
          <Button variant="secondary" disabled={isLoading}>
            Edit
          </Button>
        </Link>
        <Button variant="danger" onClick={handleDelete} disabled={isLoading}>
          Delete
        </Button>
      </div>

      <Card>
        <h2>Payable Details</h2>
        <div className={styles.detailsGrid}>
          <div>
            <span>Principal Amount</span>
            <strong>{formatCurrency(currentPayable.principal_amount || 0)}</strong>
          </div>
          <div>
            <span>Amount Paid</span>
            <strong>{formatCurrency(currentPayable.amount_paid || 0)}</strong>
          </div>
          <div>
            <span>Remaining Balance</span>
            <strong>{formatCurrency(currentPayable.balance || 0)}</strong>
          </div>
          <div>
            <span>Due Date</span>
            <strong>{currentPayable.due_date ? formatDate(currentPayable.due_date) : 'N/A'}</strong>
          </div>
          <div>
            <span>Frequency</span>
            <strong>{currentPayable.frequency || 'once'}</strong>
          </div>
          <div>
            <span>Recurring</span>
            <strong>{currentPayable.is_recurring ? 'Yes' : 'No'}</strong>
          </div>
          <div>
            <span>Recurrence End</span>
            <strong>
              {currentPayable.recurrence_end_date
                ? formatDate(currentPayable.recurrence_end_date)
                : 'Not set'}
            </strong>
          </div>
          <div>
            <span>Created</span>
            <strong>{formatDateTime(currentPayable.created_at)}</strong>
          </div>
          <div>
            <span>Last Updated</span>
            <strong>{formatDateTime(currentPayable.updated_at || currentPayable.created_at)}</strong>
          </div>
        </div>
      </Card>

      <Card>
        <h2>Payment History</h2>
        <PaymentHistory payments={paymentHistory} />
      </Card>
    </div>
  );
}
