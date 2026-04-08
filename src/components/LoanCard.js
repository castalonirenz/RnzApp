'use client';

import styles from './LoanCard.module.css';
import Badge from './Badge';
import { formatCurrency, getInterestPeriodLabel } from '@/utils/calculations';

export default function LoanCard({ loan, onView, onEdit, onDelete }) {
  const totalPayments = loan.total_payments || 0;
  const remainingBalance = loan.total_receivable - totalPayments;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.borrowerName}>{loan.borrower_name}</h3>
          <p className={styles.date}>Created {new Date(loan.created_at).toLocaleDateString()}</p>
        </div>
        <Badge status={loan.status}>{loan.status}</Badge>
      </div>

      <div className={styles.details}>
        <div className={styles.detailRow}>
          <span className={styles.label}>Principal:</span>
          <span className={styles.value}>{formatCurrency(loan.principal)}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.label}>Interest Rate:</span>
          <span className={styles.value}>
            {loan.interest_rate}% {getInterestPeriodLabel(loan.interest_period)}
          </span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.label}>Duration:</span>
          <span className={styles.value}>{loan.duration_months} months</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.label}>Total Due:</span>
          <span className={styles.value}>{formatCurrency(loan.total_receivable)}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.label}>Paid:</span>
          <span className={styles.value}>{formatCurrency(totalPayments)}</span>
        </div>
        <div className={`${styles.detailRow} ${styles.balance}`}>
          <span className={styles.label}>Balance:</span>
          <span className={styles.value}>{formatCurrency(remainingBalance)}</span>
        </div>
      </div>

      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill}
          style={{ width: `${(totalPayments / loan.total_receivable) * 100}%` }}
        ></div>
      </div>
      <p className={styles.progressText}>
        {((totalPayments / loan.total_receivable) * 100).toFixed(1)}% paid
      </p>

      <div className={styles.actions}>
        <button className={styles.viewBtn} onClick={onView}>View Details</button>
        {loan.status === 'pending' && onEdit && (
          <button className={styles.editBtn} onClick={onEdit}>Edit</button>
        )}
        {onDelete && (
          <button className={styles.deleteBtn} onClick={onDelete}>Delete</button>
        )}
      </div>
    </div>
  );
}
