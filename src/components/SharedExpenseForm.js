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

const parseSplitItems = (raw = '') =>
  String(raw)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const emptyItemEntry = () => ({ item: '', amount: 0 });

const normalizeItemizedEntries = (source, fallbackAmount = 0) => {
  const sourceEntries =
    source?.itemized_items ??
    source?.itemizedItems ??
    source?.items ??
    null;

  if (Array.isArray(sourceEntries) && sourceEntries.length > 0) {
    const entries = sourceEntries
      .map((entry) => {
        if (typeof entry === 'string') {
          return { item: entry.trim(), amount: 0 };
        }

        return {
          item: String(entry?.item ?? entry?.name ?? entry?.description ?? '').trim(),
          amount: toNumber(entry?.amount ?? entry?.price, 0),
        };
      })
      .filter((entry) => entry.item || entry.amount > 0);

    if (entries.length > 0) return entries;
  }

  const itemNames = parseSplitItems(
    source?.item ?? source?.split_item ?? source?.splitItem ?? source?.description ?? ''
  );

  if (itemNames.length === 0) return [emptyItemEntry()];

  return itemNames.map((item, index) => ({
    item,
    amount: index === 0 ? toNumber(fallbackAmount, 0) : 0,
  }));
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

const initialSplitItemsText = (initialData) => {
  if (Array.isArray(initialData?.split_items)) {
    return initialData.split_items.filter(Boolean).join(', ');
  }

  if (Array.isArray(initialData?.splitItems)) {
    return initialData.splitItems.filter(Boolean).join(', ');
  }

  return initialData?.split_items || initialData?.splitItems || '';
};

const initialSplitMode = (initialData) => {
  const rawMode = initialData?.split_mode ?? initialData?.splitMode;
  if (rawMode === 'custom') return 'custom';
  if (rawMode === 'equal') return 'equal';

  if (Array.isArray(initialData?.participant_shares) && initialData.participant_shares.length > 0) {
    return 'custom';
  }
  return 'equal';
};

const initialCustomSplits = (initialData) => {
  const fromParticipantShares = Array.isArray(initialData?.participant_shares)
    ? initialData.participant_shares
    : [];
  const splitItems = Array.isArray(initialData?.split_items) ? initialData.split_items : [];

  if (fromParticipantShares.length > 0) {
    return fromParticipantShares.reduce((acc, share, index) => {
      const name = String(share?.name ?? share?.participant ?? '').trim();
      const entries = normalizeItemizedEntries(
        {
          ...share,
          item: share?.item ?? share?.split_item ?? share?.splitItem ?? splitItems[index] ?? '',
        },
        share?.amount ?? share?.share_amount
      );
      if (name && entries.length > 0) acc[name] = { entries };
      return acc;
    }, {});
  }

  if (Array.isArray(initialData?.participants)) {
    return initialData.participants.reduce((acc, participant, index) => {
      if (participant && typeof participant === 'object') {
        const name = String(participant?.name ?? participant?.participant ?? '').trim();
        const entries = normalizeItemizedEntries(
          {
            ...participant,
            item: participant?.item ?? participant?.split_item ?? participant?.splitItem ?? splitItems[index] ?? '',
          },
          participant?.amount ?? participant?.share_amount ?? participant?.share
        );
        if (name && entries.length > 0) acc[name] = { entries };
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
    split_items: initialSplitItemsText(initialData),
    participants: initialParticipantText(initialData),
  });

  const [splitMode, setSplitMode] = useState(initialSplitMode(initialData));
  const [customSplits, setCustomSplits] = useState(initialCustomSplits(initialData));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'participants') {
      const participants = parseParticipants(value);
      setCustomSplits((prev) => {
        const next = {};
        participants.forEach((participant) => {
          next[participant] = prev[participant] ?? { entries: [emptyItemEntry()] };
        });
        return next;
      });
    }
  };

  const handleCustomEntryChange = (participant, entryIndex, field, value) => {
    setCustomSplits((prev) => ({
      ...prev,
      [participant]: {
        entries: (prev[participant]?.entries ?? [emptyItemEntry()]).map((entry, index) =>
          index === entryIndex
            ? {
                ...entry,
                [field]: field === 'amount' ? (value === '' ? 0 : toNumber(value, 0)) : value,
              }
            : entry
        ),
      },
    }));
  };

  const handleAddCustomEntry = (participant) => {
    setCustomSplits((prev) => ({
      ...prev,
      [participant]: {
        entries: [...(prev[participant]?.entries ?? [emptyItemEntry()]), emptyItemEntry()],
      },
    }));
  };

  const handleRemoveCustomEntry = (participant, entryIndex) => {
    setCustomSplits((prev) => {
      const entries = prev[participant]?.entries ?? [emptyItemEntry()];
      const nextEntries = entries.filter((_, index) => index !== entryIndex);

      return {
        ...prev,
        [participant]: {
          entries: nextEntries.length > 0 ? nextEntries : [emptyItemEntry()],
        },
      };
    });
  };

  const getCustomEntries = (participant) => {
    const entries = customSplits[participant]?.entries;
    return Array.isArray(entries) && entries.length > 0 ? entries : [emptyItemEntry()];
  };

  const getCustomParticipantTotal = (participant) => {
    return getCustomEntries(participant).reduce(
      (sum, entry) => sum + toNumber(entry.amount, 0),
      0
    );
  };

  const buildCustomParticipantShares = (participants) => {
    return participants.map((name) => {
      const entries = getCustomEntries(name)
        .map((entry) => ({
          name: String(entry.item ?? entry.name ?? '').trim(),
          amount: toNumber(entry.amount, 0),
        }))
        .filter((entry) => entry.name || entry.amount > 0);
      const amount = entries.reduce((sum, entry) => sum + entry.amount, 0);

      return {
        name,
        amount,
        items: entries,
      };
    });
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
        const entries = getCustomEntries(participant);
        const hasEntry = entries.some((entry) => String(entry.item ?? '').trim() || toNumber(entry.amount, 0) > 0);
        if (!hasEntry) {
          return `${participant} needs at least one item and amount.`;
        }

        for (const entry of entries) {
          const item = String(entry.item ?? '').trim();
          const amount = toNumber(entry.amount, 0);

          if (!item && amount > 0) {
            return `${participant} has an amount without an item.`;
          }
          if (item && amount <= 0) {
            return `${participant} item "${item}" needs an amount greater than 0.`;
          }
          if (amount < 0) {
            return `${participant} item amount cannot be negative.`;
          }
          customTotal += amount;
        }
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

    const payload = {
      title: formData.title.trim(),
      amount: totalAmount,
      description: formData.description.trim(),
      participants,
      split_mode: splitMode,
    };

    if (splitMode === 'custom') {
      payload.participant_shares = buildCustomParticipantShares(participants);
      return onSubmit(payload);
    }

    const splitItems = parseSplitItems(formData.split_items);
    if (splitItems.length > 0) {
      payload.split_items = splitItems;
    }

    onSubmit(payload);
  };

  const participantList = parseParticipants(formData.participants);
  const sharePerPerson =
    participantList.length > 0
      ? (toNumber(formData.amount, 0) / participantList.length).toFixed(2)
      : '0.00';

  const customTotal = participantList.reduce(
    (sum, participant) => sum + getCustomParticipantTotal(participant),
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

      {splitMode === 'equal' && (
        <div className={styles.formGroup}>
          <label htmlFor="split_items">Split Items</label>
          <Input
            id="split_items"
            name="split_items"
            type="text"
            placeholder="Enter item names separated by commas (e.g., Dinner mains, Bottled water)"
            value={formData.split_items}
            onChange={handleChange}
            disabled={isLoading}
          />
          <small className={styles.hint}>Optional item names for equal split compatibility</small>
        </div>
      )}

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
          <p className={styles.customSplitTitle}>Custom Itemized Split Per Participant</p>
          <div className={styles.customSplitGrid}>
            {participantList.map((participant) => (
              <div key={participant} className={styles.customSplitParticipant}>
                <div className={styles.customSplitHeader}>
                  <span className={styles.customSplitName}>{participant}</span>
                  <span className={styles.customSplitSubtotal}>
                    PHP {getCustomParticipantTotal(participant).toFixed(2)}
                  </span>
                </div>
                {getCustomEntries(participant).map((entry, entryIndex) => (
                  <div key={`${participant}-${entryIndex}`} className={styles.customSplitRow}>
                    <Input
                      type="text"
                      value={String(entry.item ?? '')}
                      onChange={(e) =>
                        handleCustomEntryChange(participant, entryIndex, 'item', e.target.value)
                      }
                      disabled={isLoading}
                      placeholder="Item"
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={String(entry.amount ?? '')}
                      onChange={(e) =>
                        handleCustomEntryChange(participant, entryIndex, 'amount', e.target.value)
                      }
                      disabled={isLoading}
                      placeholder="0.00"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRemoveCustomEntry(participant, entryIndex)}
                      disabled={isLoading || getCustomEntries(participant).length === 1}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleAddCustomEntry(participant)}
                  disabled={isLoading}
                >
                  Add Item
                </Button>
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
