import { useState } from 'react';
import styles from './SharedExpenseForm.module.css';
import Button from './Button';
import Input from './Input';
import { useToast } from '@/hooks/useToast';

const parseParticipants = (raw = '') =>
  String(raw)
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const initialParticipantText = (initialData) => {
  if (Array.isArray(initialData?.participants)) {
    return initialData.participants
      .map((p) => (typeof p === 'string' ? p : p?.name))
      .filter(Boolean)
      .join(', ');
  }
  return initialData?.participants || '';
};

const initialSplitMode = (initialData) => {
  if (initialData?.split_mode === 'custom' || initialData?.splitMode === 'custom') return 'custom';
  if (Array.isArray(initialData?.participant_shares) && initialData.participant_shares.length > 0) {
    return 'custom';
  }
  return 'equal';
};

const initialCustomAmounts = (initialData) => {
  const fromParticipantShares = Array.isArray(initialData?.participant_shares)
    ? initialData.participant_shares
    : [];

  if (fromParticipantShares.length > 0) {
    return fromParticipantShares.reduce((acc, item) => {
      const name = String(item?.name ?? item?.participant ?? '').trim();
      const amount = toNumber(item?.amount ?? item?.share_amount, NaN);
      if (name && Number.isFinite(amount)) acc[name] = amount;
      return acc;
    }, {});
  }

  if (Array.isArray(initialData?.participants)) {
    return initialData.participants.reduce((acc, item) => {
      if (item && typeof item === 'object') {
        const name = String(item?.name ?? item?.participant ?? '').trim();
        const amount = toNumber(item?.amount ?? item?.share_amount ?? item?.share, NaN);
        if (name && Number.isFinite(amount)) acc[name] = amount;
      }
      return acc;
    }, {});
  }

  return {};
};

export default function SharedExpenseForm({
  initialData = null,
  onSubmit,
  isLoading = false,
}) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    amount: initialData?.amount || '',
    description: initialData?.description || '',
    participants: initialParticipantText(initialData),
  });

  const [splitMode, setSplitMode] = useState(initialSplitMode(initialData));
  const [customAmounts, setCustomAmounts] = useState(initialCustomAmounts(initialData));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'participants') {
      const participants = parseParticipants(value);
      setCustomAmounts((prev) => {
        const next = {};
        participants.forEach((participant) => {
          next[participant] = prev[participant] ?? 0;
        });
        return next;
      });
    }
  };

  const handleCustomAmountChange = (participant, rawAmount) => {
    setCustomAmounts((prev) => ({
      ...prev,
      [participant]: rawAmount === '' ? 0 : toNumber(rawAmount, 0),
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      return 'Expense title is required.';
    }

    if (!formData.amount || toNumber(formData.amount, 0) <= 0) {
      return 'Amount must be greater than 0.';
    }

    const participants = parseParticipants(formData.participants);
    if (participants.length === 0) {
      return 'At least one participant is required.';
    }

    if (splitMode === 'custom') {
      let customTotal = 0;
      for (const participant of participants) {
        const amount = toNumber(customAmounts[participant], 0);
        if (amount < 0) {
          return `${participant} amount cannot be negative.`;
        }
        customTotal += amount;
      }

      const totalAmount = toNumber(formData.amount, 0);
      const tolerance = 0.01;
      if (Math.abs(customTotal - totalAmount) > tolerance) {
        return (
          `Custom amounts total (PHP ${customTotal.toFixed(2)}) must equal total amount (PHP ${totalAmount.toFixed(2)})`
        );
      }
    }

    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    const participants = parseParticipants(formData.participants);
    const totalAmount = toNumber(formData.amount, 0);
    const equalAmount = participants.length > 0 ? totalAmount / participants.length : 0;

    const participantShares =
      splitMode === 'custom'
        ? participants.map((name) => ({
            name,
            amount: toNumber(customAmounts[name], 0),
          }))
        : participants.map((name) => ({
            name,
            amount: Number(equalAmount.toFixed(2)),
          }));

    const payload = {
      title: formData.title.trim(),
      amount: totalAmount,
      description: formData.description.trim(),
      participants,
      split_mode: splitMode,
      participant_shares: participantShares,
    };

    onSubmit(payload);
  };

  const participantList = parseParticipants(formData.participants);
  const sharePerPerson =
    participantList.length > 0
      ? (toNumber(formData.amount, 0) / participantList.length).toFixed(2)
      : '0.00';

  const customTotal = participantList.reduce(
    (sum, participant) => sum + toNumber(customAmounts[participant], 0),
    0
  );
  const customRemaining = toNumber(formData.amount, 0) - customTotal;

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label htmlFor="title">Expense Title *</label>
        <Input
          id="title"
          name="title"
          type="text"
          placeholder="e.g., Dinner, Groceries, Hotel..."
          value={formData.title}
          onChange={handleChange}
          disabled={isLoading}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="amount">Total Amount *</label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={formData.amount}
          onChange={handleChange}
          disabled={isLoading}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          placeholder="Add notes about this expense (optional)"
          value={formData.description}
          onChange={handleChange}
          disabled={isLoading}
          className={styles.textarea}
          rows="3"
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="participants">Participants *</label>
        <Input
          id="participants"
          name="participants"
          type="text"
          placeholder="Enter names separated by commas (e.g., John, Jane, Mike)"
          value={formData.participants}
          onChange={handleChange}
          disabled={isLoading}
        />
        <small className={styles.hint}>Enter participant names separated by commas</small>
      </div>

      <div className={styles.formGroup}>
        <label>Split Type *</label>
        <div className={styles.splitModeRow}>
          <label className={styles.splitModeOption}>
            <input
              type="radio"
              name="split_mode"
              value="equal"
              checked={splitMode === 'equal'}
              onChange={() => setSplitMode('equal')}
              disabled={isLoading}
            />
            <span>Equal Split</span>
          </label>
          <label className={styles.splitModeOption}>
            <input
              type="radio"
              name="split_mode"
              value="custom"
              checked={splitMode === 'custom'}
              onChange={() => setSplitMode('custom')}
              disabled={isLoading}
            />
            <span>Custom Split</span>
          </label>
        </div>
        <small className={styles.hint}>
          Equal: everyone pays the same. Custom: set a specific amount per participant.
        </small>
      </div>

      {splitMode === 'custom' && participantList.length > 0 && (
        <div className={styles.customSplitBox}>
          <p className={styles.customSplitTitle}>Custom Amounts Per Participant</p>
          <div className={styles.customSplitGrid}>
            {participantList.map((participant) => (
              <div key={participant} className={styles.customSplitRow}>
                <span className={styles.customSplitName}>{participant}</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={String(customAmounts[participant] ?? '')}
                  onChange={(e) => handleCustomAmountChange(participant, e.target.value)}
                  disabled={isLoading}
                  placeholder="0.00"
                />
              </div>
            ))}
          </div>
          <div className={styles.customSplitSummary}>
            <p>
              Assigned Total: <strong>PHP {customTotal.toFixed(2)}</strong>
            </p>
            <p>
              Remaining:{' '}
              <strong className={customRemaining === 0 ? styles.okValue : styles.warnValue}>
                PHP {customRemaining.toFixed(2)}
              </strong>
            </p>
          </div>
        </div>
      )}

      {participantList.length > 0 && (
        <div className={styles.preview}>
          <div className={styles.previewItem}>
            <span className={styles.previewLabel}>Number of participants:</span>
            <span className={styles.previewValue}>{participantList.length}</span>
          </div>
          <div className={styles.previewItem}>
            <span className={styles.previewLabel}>
              {splitMode === 'equal' ? 'Share per person:' : 'Average share per person:'}
            </span>
            <span className={styles.previewValue}>PHP {sharePerPerson}</span>
          </div>
          <div className={styles.participantsList}>
            <p className={styles.participantsTitle}>Participants:</p>
            <ul className={styles.list}>
              {participantList.map((participant, index) => (
                <li key={index}>{participant}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <Button type="submit" disabled={isLoading} variant="primary" className={styles.submitBtn}>
        {isLoading ? 'Processing...' : initialData ? 'Update Expense' : 'Create Expense'}
      </Button>
    </form>
  );
}
