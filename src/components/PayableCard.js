'use client';

import Button from '@/components/Button';
import Badge from '@/components/Badge';
import { formatCurrency, formatDate } from '@/utils/calculations';
import styles from './PayableCard.module.css';

export default function PayableCard({
  payable,
  isLoading = false,
  onView,
  onEdit,
  onRecordPayment,
  onDelete,
}) {
  const canDelete = payable?.status === 'pending' && Number(payable?.amount_paid || 0) <= 0;
  const statusForBadge =
    payable?.status !== 'completed' && Number(payable?.balance || 0) > 0 && new Date(payable?.due_date) < new Date()
      ? 'overdue'
      : payable?.status;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h4>{payable.creditor_name}</h4>
          <p>{payable.description || 'No description provided'}</p>
        </div>
        <Badge status={statusForBadge}>{statusForBadge?.replace('_', ' ') || 'pending'}</Badge>
      </div>

      <div className={styles.meta}>
        <span>Due: {payable.due_date ? formatDate(payable.due_date) : 'N/A'}</span>
        <span>Frequency: {payable.frequency || 'once'}</span>
      </div>

      <div className={styles.amounts}>
        <span>Principal: {formatCurrency(payable.principal_amount || 0)}</span>
        <span>Paid: {formatCurrency(payable.amount_paid || 0)}</span>
        <strong>Balance: {formatCurrency(payable.balance || 0)}</strong>
      </div>

      <div className={styles.actions}>
        <Button size="sm" variant="secondary" onClick={onView} disabled={isLoading}>
          View
        </Button>
        <Button size="sm" variant="secondary" onClick={onEdit} disabled={isLoading}>
          Edit
        </Button>
        <Button
          size="sm"
          variant="primary"
          onClick={onRecordPayment}
          disabled={isLoading || Number(payable.balance || 0) <= 0}
        >
          Pay
        </Button>
        <Button size="sm" variant="danger" onClick={onDelete} disabled={isLoading || !canDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
}
