'use client';

import styles from './Badge.module.css';

export default function Badge({ children, status = 'default' }) {
  const getClass = () => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return styles.pending;
      case 'ongoing':
        return styles.ongoing;
      case 'partially_paid':
      case 'partial':
        return styles.partiallyPaid;
      case 'overdue':
        return styles.overdue;
      case 'completed':
        return styles.completed;
      default:
        return styles.default;
    }
  };

  return <span className={`${styles.badge} ${getClass()}`}>{children}</span>;
}
