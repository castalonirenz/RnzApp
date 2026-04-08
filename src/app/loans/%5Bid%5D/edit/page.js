'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useLoans } from '@/hooks/useLoans';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Card from '@/components/Card';
import Alert from '@/components/Alert';
import { calculateTotalReceivable, formatCurrency } from '@/utils/calculations';
import styles from './page.module.css';

export default function EditLoanPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthChecked } = useAuth();
  const { currentLoan, isLoading, fetchLoanById, updateLoan } = useLoans();
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    borrower_name: '',
    principal: '',
    interest_rate: '',
    duration_months: '',
  });
  const [calculated, setCalculated] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthChecked) {
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    if (params.id) {
      fetchLoanById(params.id);
    }
  }, [isAuthChecked, params.id, user, router, fetchLoanById]);

  useEffect(() => {
    if (currentLoan) {
      if (currentLoan.status !== 'pending') {
        setFormError('Only pending loans can be edited');
        return;
      }

      setFormData({
        borrower_name: currentLoan.borrower_name,
        principal: currentLoan.principal.toString(),
        interest_rate: currentLoan.interest_rate.toString(),
        duration_months: currentLoan.duration_months.toString(),
      });

      const total = calculateTotalReceivable(
        currentLoan.principal,
        currentLoan.interest_rate,
        currentLoan.duration_months
      );
      setCalculated(total);
    }
  }, [currentLoan]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);

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

    setIsSubmitting(true);
    try {
      const total = calculateTotalReceivable(principal, rate, months);
      await updateLoan(params.id, {
        borrower_name: formData.borrower_name,
        principal,
        interest_rate: rate,
        duration_months: months,
        total_receivable: total,
      });
      router.push(`/loans/${params.id}`);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update loan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthChecked || isLoading) {
    return (
      <div className={styles.container}>
        <p>Loading loan...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!currentLoan) {
    return (
      <div className={styles.container}>
        <Alert type="error">Loan not found</Alert>
        <Link href="/loans">
          <Button variant="secondary">Back to Loans</Button>
        </Link>
      </div>
    );
  }

  if (currentLoan.status !== 'pending') {
    return (
      <div className={styles.container}>
        <Alert type="error">Only pending loans can be edited. This loan is {currentLoan.status}.</Alert>
        <Link href={`/loans/${params.id}`}>
          <Button variant="secondary">Back to Loan</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link href={`/loans/${params.id}`} className={styles.backLink}>← Back to Loan</Link>

      <Card className={styles.formCard}>
        <h1>Edit Loan</h1>
        <p className={styles.subtitle}>Update loan details below</p>

        {formError && (
          <Alert type="error" onClose={() => setFormError('')}>
            {formError}
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
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Updating Loan...' : 'Update Loan'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
