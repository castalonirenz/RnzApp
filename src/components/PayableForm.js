'use client';

import { useMemo, useState } from 'react';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { useToast } from '@/hooks/useToast';
import styles from './PayableForm.module.css';

const FREQUENCY_OPTIONS = ['once', 'monthly', 'quarterly', 'yearly'];

const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export default function PayableForm({
  initialData = null,
  isLoading = false,
  submitLabel = 'Save Payable',
  onSubmit,
  onCancel,
}) {
  const toast = useToast();
  const [form, setForm] = useState({
    creditor_name: initialData?.creditor_name || '',
    description: initialData?.description || '',
    principal_amount:
      initialData?.principal_amount != null ? String(initialData.principal_amount) : '',
    due_date: toDateInput(initialData?.due_date),
    is_recurring: Boolean(initialData?.is_recurring),
    frequency: initialData?.frequency || (initialData?.is_recurring ? 'monthly' : 'once'),
    recurrence_end_date: toDateInput(initialData?.recurrence_end_date),
  });

  const payloadPreview = useMemo(() => {
    const principalAmount = toNumber(form.principal_amount, 0);
    const recurringEnd = form.recurrence_end_date ? new Date(form.recurrence_end_date) : null;
    const dueDate = form.due_date ? new Date(form.due_date) : null;

    return {
      principalAmount,
      dueDate,
      recurringEnd,
    };
  }, [form.principal_amount, form.due_date, form.recurrence_end_date]);

  const handleChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const validate = () => {
    if (!form.creditor_name.trim()) {
      return 'Creditor name is required.';
    }

    if (payloadPreview.principalAmount <= 0) {
      return 'Principal amount must be greater than 0.';
    }

    if (!form.due_date || !payloadPreview.dueDate || Number.isNaN(payloadPreview.dueDate.getTime())) {
      return 'A valid due date is required.';
    }

    if (form.is_recurring) {
      if (!FREQUENCY_OPTIONS.includes(form.frequency) || form.frequency === 'once') {
        return 'Recurring payables require monthly, quarterly, or yearly frequency.';
      }

      if (form.recurrence_end_date) {
        if (!payloadPreview.recurringEnd || Number.isNaN(payloadPreview.recurringEnd.getTime())) {
          return 'Recurrence end date is invalid.';
        }
        if (payloadPreview.recurringEnd < payloadPreview.dueDate) {
          return 'Recurrence end date must be after the due date.';
        }
      }
    }

    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationMessage = validate();
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    onSubmit({
      creditor_name: form.creditor_name.trim(),
      description: form.description.trim(),
      principal_amount: toNumber(form.principal_amount, 0),
      due_date: form.due_date,
      is_recurring: form.is_recurring,
      frequency: form.is_recurring ? form.frequency : 'once',
      recurrence_end_date: form.is_recurring ? form.recurrence_end_date || null : null,
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <Input
        label="Creditor Name"
        name="creditor_name"
        value={form.creditor_name}
        onChange={(e) => handleChange('creditor_name', e.target.value)}
        placeholder="Landlord, Utility Company, Supplier"
        required
      />

      <Input
        label="Description"
        name="description"
        value={form.description}
        onChange={(e) => handleChange('description', e.target.value)}
        placeholder="Optional details"
      />

      <Input
        label="Principal Amount (PHP)"
        type="number"
        step="0.01"
        min="0.01"
        name="principal_amount"
        value={form.principal_amount}
        onChange={(e) => handleChange('principal_amount', e.target.value)}
        placeholder="0.00"
        required
      />

      <Input
        label="Due Date"
        type="date"
        name="due_date"
        value={form.due_date}
        onChange={(e) => handleChange('due_date', e.target.value)}
        required
      />

      <div className={styles.checkboxRow}>
        <input
          id="is_recurring"
          type="checkbox"
          checked={form.is_recurring}
          onChange={(e) => {
            const checked = e.target.checked;
            setForm((prev) => ({
              ...prev,
              is_recurring: checked,
              frequency: checked ? (prev.frequency === 'once' ? 'monthly' : prev.frequency) : 'once',
              recurrence_end_date: checked ? prev.recurrence_end_date : '',
            }));
          }}
        />
        <label htmlFor="is_recurring">Recurring payable</label>
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel}>Frequency</label>
        <select
          className={styles.selectInput}
          value={form.frequency}
          onChange={(e) => handleChange('frequency', e.target.value)}
          disabled={!form.is_recurring}
        >
          {FREQUENCY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {form.is_recurring && (
        <Input
          label="Recurrence End Date (Optional)"
          type="date"
          name="recurrence_end_date"
          value={form.recurrence_end_date}
          onChange={(e) => handleChange('recurrence_end_date', e.target.value)}
        />
      )}

      <div className={styles.actions}>
        <Button type="submit" variant="primary" disabled={isLoading}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" disabled={isLoading} onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
