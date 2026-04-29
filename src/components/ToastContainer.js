'use client';

import { useToastStore } from '@/store/toastStore';
import styles from './ToastContainer.module.css';

const TOAST_LABEL = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
};

export default function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  if (!toasts.length) return null;

  return (
    <div className={styles.viewport} aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div key={toast.id} className={`${styles.toast} ${styles[toast.type] || styles.info}`}>
          <div className={styles.body}>
            <strong>{TOAST_LABEL[toast.type] || 'Notice'}</strong>
            <p>{toast.message}</p>
          </div>
          <button
            type="button"
            className={styles.close}
            onClick={() => removeToast(toast.id)}
            aria-label="Dismiss notification"
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
}
