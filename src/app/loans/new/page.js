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
import { calculateTotalReceivable, formatCurrency } from '@/utils/calculations';
import styles from './page.module.css';

export default function NewLoanPage() {
  const router = useRouter();
  const { user, isAuthChecked } = useAuth();
  const { createLoan, isLoading, error } = useLoans();
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    borrower_name: '',
    principal: '',
    interest_rate: '',
    duration_months: '',
  });
  const [calculated, setCalculated] = useState(null);

  if (!isAuthChecked) {
    return (
      <div className={styles.container}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
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
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);

    // Auto-calculate total receivable
    if (updated.principal && updated.interest_rate && updated.duration_months) {
      const total = calculateTotalReceivable(
        parseFloat(updated.principal),
        parseFloat(updated.interest_rate),
        parseInt(updated.duration_months)
      );
      setCalculated(total);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.borrower_name || !formData.principal || !formData.interest_rate || !formData.duration_months) {
      setFormError('Please fill in all fields');
      return;
    }

    const principal = parseFloat(formData.principal);
    const rate = parseFloat(formData.interest_rate);
    const months = parseInt(formData.duration_months);

    if (principal <= 0 || rate < 0 || months <= 0) {
      setFormError('Please enter valid amounts');
      return;
    }

    try {
      const total = calculateTotalReceivable(principal, rate, months);
      await createLoan({
        borrower_name: formData.borrower_name,
        principal,
        interest_rate: rate,
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
      <Link href="/loans" className={styles.backLink}>← Back to Loans</Link>

      <Card className={styles.formCard}>
        <h1>Create New Loan</h1>
        <p className={styles.subtitle}>Enter loan details below</p>

        {(error || formError) && (
          <Alert type="error" onClose={() => setFormError('')}>
            {formError || error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
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
            label="Principal Amount ($)"
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
            label="Interest Rate (% per annum)"
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
                Formula: Principal + (Principal × Rate × Time)
              </p>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? 'Creating Loan...' : 'Create Loan'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
