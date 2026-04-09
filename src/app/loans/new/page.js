'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useLoans } from '@/hooks/useLoans';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Card from '@/components/Card';
import Alert from '@/components/Alert';
import { calculateTotalReceivable, formatCurrency, getInterestPeriodLabel } from '@/utils/calculations';
import styles from './page.module.css';

export default function NewLoanPage() {
  const router = useRouter();
  const { token, isAuthChecked } = useAuth();
  const { createLoan, isLoading, error } = useLoans();
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    borrower_name: '',
    borrower_contact: '',
    borrower_address: '',
    principal: '',
    interest_rate: '',
    interest_period: 'month',
    duration_months: '',
    accepted_terms: false,
  });
  const [calculated, setCalculated] = useState(null);
  const [showTerms, setShowTerms] = useState(false);

  if (!isAuthChecked) {
    return (
      <div className={styles.container}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className={styles.container}>
        <Alert type="error">You must be logged in to create a loan.</Alert>
        <Link href="/login">
          <Button variant="secondary">Go to Login</Button>
        </Link>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const updated = { ...formData, [name]: type === 'checkbox' ? checked : value };
    setFormData(updated);

    if (updated.principal && updated.interest_rate && updated.duration_months) {
      const total = calculateTotalReceivable(
        parseFloat(updated.principal),
        parseFloat(updated.interest_rate),
        parseInt(updated.duration_months, 10),
        updated.interest_period
      );
      setCalculated(total);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.borrower_name || !formData.principal || !formData.interest_rate || !formData.duration_months) {
      setFormError('Please fill in all required fields');
      return;
    }

    const principal = parseFloat(formData.principal);
    const rate = parseFloat(formData.interest_rate);
    const months = parseInt(formData.duration_months, 10);

    if (principal <= 0 || rate < 0 || months <= 0) {
      setFormError('Please enter valid amounts');
      return;
    }

    if (!formData.accepted_terms) {
      setFormError('You must accept the Terms, Conditions, and Data Privacy Notice before creating a loan.');
      return;
    }

    try {
      const total = calculateTotalReceivable(principal, rate, months, formData.interest_period);
      await createLoan({
        borrower_name: formData.borrower_name,
        borrower_contact: formData.borrower_contact,
        borrower_address: formData.borrower_address,
        principal,
        interest_rate: rate,
        interest_period: formData.interest_period,
        duration_months: months,
        total_receivable: total,
      });
      router.push('/loans');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create loan');
    }
  };

  return (
    <div className={styles.container}>
      <Link href="/loans" className={styles.backLink}>Back to Loans</Link>

      <Card className={styles.formCard}>
        <h1>Create New Loan</h1>
        <p className={styles.subtitle}>Enter loan details below</p>

        {(error || formError) && (
          <Alert type="error" onClose={() => setFormError('')}>
            {formError || error}
          </Alert>
        )}

        <form 
          onSubmit={handleSubmit}
          className={styles.form}>
          <Input
            label="Borrower Name"
            type="text"
            name="borrower_name"
            value={formData.borrower_name}
            onChange={handleChange}
            placeholder="Enter borrower's name"
            required
          />

          <Input
            label="Contact Number"
            type="text"
            name="borrower_contact"
            value={formData.borrower_contact}
            onChange={handleChange}
            placeholder="09xxxxxxxxx"
          />

          <Input
            label="Address"
            type="text"
            name="borrower_address"
            value={formData.borrower_address}
            onChange={handleChange}
            placeholder="Borrower address"
          />

          <Input
            label="Principal Amount (PHP)"
            type="number"
            step="0.01"
            min="0"
            name="principal"
            value={formData.principal}
            onChange={handleChange}
            placeholder="0.00"
            required
          />

          <Input
            label={`Interest Rate (% ${getInterestPeriodLabel(formData.interest_period)})`}
            type="number"
            step="0.01"
            min="0"
            max="100"
            name="interest_rate"
            value={formData.interest_rate}
            onChange={handleChange}
            placeholder="0.00"
            required
          />

          <div className={styles.formGroup}>
            <label htmlFor="interest_period" className={styles.formLabel}>Interest Type</label>
            <select
              id="interest_period"
              name="interest_period"
              value={formData.interest_period}
              onChange={handleChange}
              className={styles.select}
              required
            >
              <option value="annum">Per annum</option>
              <option value="month">Per month</option>
            </select>
          </div>

          <Input
            label="Duration (months)"
            type="number"
            min="1"
            name="duration_months"
            value={formData.duration_months}
            onChange={handleChange}
            placeholder="12"
            required
          />

          {calculated && (
            <div className={styles.calculation}>
              <h3>Total Amount Due</h3>
              <p className={styles.totalReceivable}>{formatCurrency(calculated)}</p>
              <p className={styles.calculationNote}>
                Interest type: {getInterestPeriodLabel(formData.interest_period)}
              </p>
            </div>
          )}

          <div className={styles.consentBox}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="accepted_terms"
                checked={formData.accepted_terms}
                onChange={handleChange}
              />
              <span>
                I confirm I have lawful authority and consent to process borrower data and I agree to the Terms,
                Conditions, and Data Privacy Notice (PH).
              </span>
            </label>
            <button
              type="button"
              className={styles.termsLinkBtn}
              onClick={() => setShowTerms(true)}
            >
              View Terms & Data Privacy
            </button>
          </div>

          <Button
            type="submit"
            variant="primary" size="lg" disabled={isLoading} >
            {isLoading ? 'Creating Loan...' : 'Create Loan'}
          </Button>
        </form>
      </Card>

      {showTerms && (
        <div className={styles.modalBackdrop} onClick={() => setShowTerms(false)}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="terms-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3 id="terms-title">Terms & Conditions + Data Privacy Notice (PH)</h3>
              <button type="button" className={styles.closeModalBtn} onClick={() => setShowTerms(false)}>
                x
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>
                This app collects borrower name, contact number, address, and loan/payment details for loan management.
                By proceeding, you confirm you are authorized to collect and process this data.
              </p>
              <p>
                Data processing is aligned with Republic Act No. 10173 (Data Privacy Act of 2012), including
                transparency, legitimate purpose, and proportionality principles.
              </p>
              <p>
                You must inform borrowers about processing purpose and respect applicable data subject rights
                (e.g., access, correction, and erasure requests where applicable).
              </p>
              <p>
                Keep borrower data secure, limit access, and retain data only as long as necessary for lawful
                lending and record-keeping purposes.
              </p>
              <p>
                References:
                {' '}
                <a href="https://lawphil.net/statutes/repacts/ra2012/ra_10173_2012.html" target="_blank" rel="noreferrer">
                  RA 10173 (LawPhil)
                </a>
                {' '}|{' '}
                <a href="https://privacy.gov.ph/data-subject-rights/" target="_blank" rel="noreferrer">
                  NPC Data Subject Rights
                </a>
              </p>
            </div>
            <div className={styles.modalFooter}>
              <Button type="button" variant="secondary" onClick={() => setShowTerms(false)}>
                Close
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, accepted_terms: true }));
                  setShowTerms(false);
                }}
              >
                I Understand and Agree
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
