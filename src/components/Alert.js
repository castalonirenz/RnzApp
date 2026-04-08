'use client';

import styles from './Alert.module.css';

export default function Alert({ type = 'info', children, onClose }) {
  const baseStyle = [
    styles.alert,
    styles[type],
  ].filter(Boolean).join(' ');

  return (
    <div className={baseStyle}>
      <div className={styles.content}>{children}</div>
      {onClose && (
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>
      )}
    </div>
  );
}
