import { useEffect } from 'react';
import styles from './ExpenseDetailModal.module.css';
import Button from './Button';

export default function ExpenseDetailModal({ expense, isOpen, onClose, onEdit, onDelete }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !expense) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this expense?')) {
      onDelete(expense.id);
      onClose();
    }
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{expense.title}</h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <div className={styles.field}>
              <label>Total Amount</label>
              <p className={styles.amount}>{formatCurrency(expense.amount)}</p>
            </div>
          </div>

          {expense.description && (
            <div className={styles.section}>
              <div className={styles.field}>
                <label>Description</label>
                <p className={styles.description}>{expense.description}</p>
              </div>
            </div>
          )}

          <div className={styles.section}>
            <div className={styles.field}>
              <label>Share Per Person</label>
              <p className={styles.share}>{formatCurrency(expense.share_per_person)}</p>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.field}>
              <label>Participants ({expense.participants.length})</label>
              <div className={styles.participantsList}>
                {expense.participants.map((participant, idx) => (
                  <div key={idx} className={styles.participantItem}>
                    <span className={styles.participantName}>{participant}</span>
                    <span className={styles.participantShare}>
                      {formatCurrency(expense.share_per_person)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.field}>
              <label>Date</label>
              <p className={styles.date}>
                {expense.created_at
                  ? new Date(expense.created_at).toLocaleDateString('en-PH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <Button variant="danger" onClick={handleDelete} className={styles.deleteBtn}>
            Delete Expense
          </Button>
          {onEdit && (
            <Button
              variant="primary"
              onClick={() => {
                onEdit(expense.id);
                onClose();
              }}
            >
              Edit Expense
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
