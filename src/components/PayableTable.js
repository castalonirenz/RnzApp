'use client';

import PayableCard from '@/components/PayableCard';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import { formatCurrency, formatDate } from '@/utils/calculations';
import styles from './PayableTable.module.css';

export default function PayableTable({
  payables = [],
  isLoading = false,
  onView,
  onEdit,
  onRecordPayment,
  onDelete,
}) {
  if (!payables.length) {
    return <p className={styles.empty}>No payables found.</p>;
  }

  return (
    <>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Creditor</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Principal</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payables.map((payable) => {
              const canDelete = payable?.status === 'pending' && Number(payable?.amount_paid || 0) <= 0;
              const statusForBadge =
                payable?.status !== 'completed' &&
                Number(payable?.balance || 0) > 0 &&
                new Date(payable?.due_date) < new Date()
                  ? 'overdue'
                  : payable?.status;

              return (
                <tr key={payable.id}>
                  <td>
                    <strong>{payable.creditor_name}</strong>
                    <p>{payable.description || '-'}</p>
                  </td>
                  <td>{payable.due_date ? formatDate(payable.due_date) : 'N/A'}</td>
                  <td>
                    <Badge status={statusForBadge}>
                      {statusForBadge?.replace('_', ' ') || 'pending'}
                    </Badge>
                  </td>
                  <td>{formatCurrency(payable.principal_amount || 0)}</td>
                  <td>{formatCurrency(payable.amount_paid || 0)}</td>
                  <td>{formatCurrency(payable.balance || 0)}</td>
                  <td>
                    <div className={styles.actions}>
                      <Button size="sm" variant="secondary" onClick={() => onView(payable.id)} disabled={isLoading}>
                        View
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => onEdit(payable.id)} disabled={isLoading}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => onRecordPayment(payable)}
                        disabled={isLoading || Number(payable.balance || 0) <= 0}
                      >
                        Pay
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => onDelete(payable)}
                        disabled={isLoading || !canDelete}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={styles.mobileList}>
        {payables.map((payable) => (
          <PayableCard
            key={payable.id}
            payable={payable}
            isLoading={isLoading}
            onView={() => onView(payable.id)}
            onEdit={() => onEdit(payable.id)}
            onRecordPayment={() => onRecordPayment(payable)}
            onDelete={() => onDelete(payable)}
          />
        ))}
      </div>
    </>
  );
}
