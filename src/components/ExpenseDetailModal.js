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

  const participantNames = Array.isArray(expense.participants)
    ? expense.participants
        .map((participant) => (typeof participant === 'string' ? participant : participant?.name))
        .filter(Boolean)
    : [];
  const splitItems = Array.isArray(expense.split_items)
    ? expense.split_items.filter(Boolean)
    : [];

  const participantShareMap = Array.isArray(expense.participant_shares)
    ? expense.participant_shares.reduce((acc, item) => {
        const name = String(item?.name ?? '').trim();
        const amount = Number(item?.amount);
        const itemizedItems = item?.itemized_items ?? item?.itemizedItems;
        const items =
          Array.isArray(itemizedItems) && itemizedItems.length > 0
            ? itemizedItems
                .map((entry) => ({
                  item: String(entry?.item ?? entry?.name ?? entry?.description ?? '').trim(),
                  amount: Number(entry?.amount ?? entry?.price ?? 0),
                }))
                .filter((entry) => entry.item || Number(entry.amount) > 0)
            : (Array.isArray(item?.items)
                ? item.items
                    .map((entry) => ({
                      item:
                        typeof entry === 'string'
                          ? entry.trim()
                          : String(entry?.name ?? entry?.item ?? entry?.description ?? '').trim(),
                      amount: Number(entry?.amount ?? entry?.price ?? 0),
                    }))
                    .filter((entry) => entry.item || Number(entry.amount) > 0)
                : String(item?.item ?? item?.split_item ?? item?.splitItem ?? '')
                    .split(',')
                    .map((value) => value.trim())
                    .filter(Boolean)
                    .map((value, index) => ({
                      item: value,
                      amount: index === 0 ? amount : 0,
                    })));
        if (name && Number.isFinite(amount)) {
          acc[name] = {
            amount,
            items,
          };
        }
        return acc;
      }, {})
    : {};

  const resolveParticipantShare = (name) => {
    if (Number.isFinite(participantShareMap[name]?.amount)) return participantShareMap[name].amount;
    return expense.share_per_person;
  };

  const participantItemizedSplits = [
    ...participantNames,
    ...Object.keys(participantShareMap).filter((name) => !participantNames.includes(name)),
  ]
    .map((name) => ({
      name,
      amount: resolveParticipantShare(name),
      items: participantShareMap[name]?.items ?? [],
    }))
    .filter((share) => share.items.length > 0);
  const hasParticipantItems = participantItemizedSplits.length > 0;
  const participantItemizedSplitMap = participantItemizedSplits.reduce((acc, share) => {
    acc[share.name] = share.items;
    return acc;
  }, {});

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

          {splitItems.length > 0 && !hasParticipantItems && (
            <div className={styles.section}>
              <div className={styles.field}>
                <label>Split Items</label>
                <div className={styles.itemList}>
                  {splitItems.map((item, index) => (
                    <span key={`${item}-${index}`} className={styles.itemBadge}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className={styles.section}>
            <div className={styles.field}>
              <label>{expense.split_mode === 'custom' ? 'Split Mode' : 'Share Per Person'}</label>
              <p className={styles.share}>
                {expense.split_mode === 'custom'
                  ? 'Custom per participant'
                  : formatCurrency(expense.share_per_person)}
              </p>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.field}>
              <label>Participants ({participantNames.length})</label>
              <div className={styles.participantsList}>
                {participantNames.map((participant, idx) => (
                  <div key={idx} className={styles.participantItem}>
                    <div className={styles.participantHeader}>
                      <span className={styles.participantName}>{participant}</span>
                      <span className={styles.participantShare}>
                        {formatCurrency(resolveParticipantShare(participant))}
                      </span>
                    </div>

                    {participantItemizedSplitMap[participant]?.length > 0 && (
                      <div className={styles.itemizedRows}>
                        {participantItemizedSplitMap[participant].map((entry, itemIndex) => (
                          <div
                            key={`${participant}-${entry.item}-${itemIndex}`}
                            className={styles.itemizedRow}
                          >
                            <span className={styles.itemizedItemName}>
                              {entry.item || 'Item'}
                            </span>
                            <span className={styles.itemizedItemAmount}>
                              {formatCurrency(entry.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
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
