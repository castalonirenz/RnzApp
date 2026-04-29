'use client';

import { formatCurrency, formatDateTime } from '@/utils/calculations';
import styles from './PaymentHistory.module.css';

export default function PaymentHistory({ payments = [] }) {
  if (!payments.length) {
    return <p className={styles.empty}>No payments recorded yet.</p>;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td>{formatDateTime(payment.payment_date || payment.created_at)}</td>
              <td>{formatCurrency(payment.amount_paid || 0)}</td>
              <td>{payment.payment_method || 'other'}</td>
              <td>{payment.notes || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
