'use client';

import { useMemo, useState } from 'react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { formatCurrency } from '@/utils/calculations';
import { useToast } from '@/hooks/useToast';
import styles from './PaymentModal.module.css';

const toDateInput = (value) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
};

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export default function PaymentModal({
  payable,
  isOpen,
  isLoading = false,
  onClose,
  onSubmit,
}) {
  const toast = useToast();
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentDate, setPaymentDate] = useState(toDateInput());
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');

  const remaining = useMemo(() => toNumber(payable?.balance, 0), [payable?.balance]);

  if (!isOpen || !payable) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = toNumber(amountPaid, NaN);
    const date = new Date(paymentDate);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Payment amount must be greater than 0.');
      return;
    }

    if (amount > remaining) {
      toast.error(`Payment amount cannot exceed remaining balance of ${formatCurrency(remaining)}.`);
      return;
    }

    if (Number.isNaN(date.getTime())) {
      toast.error('Payment date is invalid.');
      return;
    }

    onSubmit({
      amount_paid: amount,
      payment_date: paymentDate,
      payment_method: paymentMethod,
      notes,
    });
  };

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <h3 id="payment-modal-title">Record Payment</h3>
            <p>{payable.creditor_name}</p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close payment modal"
            disabled={isLoading}
          >
            x
          </button>
        </div>

        <div className={styles.balanceBox}>
          <span>Remaining Balance</span>
          <strong>{formatCurrency(remaining)}</strong>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            label="Amount Paid (PHP)"
            type="number"
            step="0.01"
            min="0.01"
            max={remaining}
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
            required
          />

          <Input
            label="Payment Date"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
          />

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Payment Method</label>
            <select
              className={styles.selectInput}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="cash">Cash</option>
              <option value="transfer">Transfer</option>
              <option value="check">Check</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Notes</label>
            <textarea
              className={styles.textarea}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
            />
          </div>

          <div className={styles.actions}>
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Payment'}
            </Button>
            <Button type="button" variant="secondary" disabled={isLoading} onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
