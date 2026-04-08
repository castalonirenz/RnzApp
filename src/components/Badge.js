'use client';

import styles from './Badge.module.css';

export default function Badge({ children, status = 'default' }) {
  const getClass = () => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return styles.pending;
      case 'ongoing':
        return styles.ongoing;
      case 'completed':
        return styles.completed;
      default:
        return styles.default;
    }
  };

  return <span className={`${styles.badge} ${getClass()}`}>{children}</span>;
}
