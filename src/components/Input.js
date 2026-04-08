'use client';

import styles from './Input.module.css';

export default function Input({ label, error, ...props }) {
  return (
    <div className={styles.container}>
      {label && <label className={styles.label}>{label}</label>}
      <input className={`${styles.input} ${error ? styles.error : ''}`} {...props} />
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
}
