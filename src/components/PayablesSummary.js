'use client';

import Card from '@/components/Card';
import { formatCurrency } from '@/utils/calculations';
import styles from './PayablesSummary.module.css';

export default function PayablesSummary({ summary }) {
  return (
    <div className={styles.grid}>
      <Card className={styles.summaryCard}>
        <p>Total Payables</p>
        <strong>{formatCurrency(summary?.total_payables || 0)}</strong>
      </Card>
      <Card className={styles.summaryCard}>
        <p>Paid Amount</p>
        <strong>{formatCurrency(summary?.total_paid || 0)}</strong>
      </Card>
      <Card className={styles.summaryCard}>
        <p>Balance Remaining</p>
        <strong>{formatCurrency(summary?.total_balance || 0)}</strong>
      </Card>
      <Card className={styles.summaryCard}>
        <p>Upcoming (7 Days)</p>
        <strong>{summary?.upcoming_due_count || 0}</strong>
      </Card>
      <Card className={styles.summaryCard}>
        <p>Overdue</p>
        <strong>{summary?.overdue_count || 0}</strong>
      </Card>
      <Card className={styles.summaryCard}>
        <p>Completed</p>
        <strong>{summary?.completed_count || 0}</strong>
      </Card>
    </div>
  );
}
