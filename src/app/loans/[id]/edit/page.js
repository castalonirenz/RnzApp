'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useLoans } from '@/hooks/useLoans';
import { useToast } from '@/hooks/useToast';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Card from '@/components/Card';
import Alert from '@/components/Alert';
import { calculateTotalReceivable, formatCurrency, getInterestPeriodLabel } from '@/utils/calculations';
import styles from './page.module.css';

export default function EditLoanPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const { token, isAuthChecked } = useAuth();
  const { currentLoan, isLoading, fetchLoanById, updateLoan } = useLoans();
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    borrower_name: '',
    borrower_contact: '',
    borrower_address: '',
    principal: '',
    interest_rate: '',
    interest_period: 'month',
    duration_months: '',
  });
  const [calculated, setCalculated] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthChecked) return;
    if (!token) {
      router.push('/login');
      return;
    }
    if (params.id) {
      fetchLoanById(params.id);
    }
  }, [isAuthChecked, params.id, token, router, fetchLoanById]);

  useEffect(() => {
    if (!currentLoan) return;
    if (currentLoan.status !== 'pending' && currentLoan.status !== 'ongoing') {
      setFormError('Only pending or ongoing loans can be edited');
      return;
    }

    setFormData({
      borrower_name: currentLoan.borrower_name,
      borrower_contact:
        currentLoan.borrower_contact ??
        currentLoan.borrowerContact ??
        currentLoan.contact_number ??
        currentLoan.contactNumber ??
        currentLoan.phone ??
        '',
      borrower_address:
        currentLoan.borrower_address ??
        currentLoan.borrowerAddress ??
        currentLoan.address ??
        currentLoan.location ??
        '',
      principal: currentLoan.principal.toString(),
      interest_rate: currentLoan.interest_rate.toString(),
      interest_period: currentLoan.interest_period || 'month',
      duration_months: currentLoan.duration_months.toString(),
    });

    const total = calculateTotalReceivable(
      currentLoan.principal,
      currentLoan.interest_rate,
      currentLoan.duration_months,
      currentLoan.interest_period || 'month'
    );
    setCalculated(total);
  }, [currentLoan]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
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

    if (!formData.borrower_name || !formData.principal || !formData.interest_rate || !formData.duration_months) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const principal = parseFloat(formData.principal);
    const rate = parseFloat(formData.interest_rate);
    const months = parseInt(formData.duration_months, 10);

    if (principal <= 0 || rate < 0 || months <= 0) {
      toast.error('Please enter valid amounts.');
      return;
    }

    setIsSubmitting(true);
    try {
      const total = calculateTotalReceivable(principal, rate, months, formData.interest_period);
      await updateLoan(params.id, {
        borrower_name: formData.borrower_name,
        borrower_contact: formData.borrower_contact,
        borrower_address: formData.borrower_address,
        principal,
        interest_rate: rate,
        interest_period: formData.interest_period,
        duration_months: months,
        total_receivable: total,
      });
      toast.success('Loan updated successfully.');
      router.push(`/loans/${params.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update loan');
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

  if (!token) return null;

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

  if (currentLoan.status !== 'pending' && currentLoan.status !== 'ongoing') {
    return (
      <div className={styles.container}>
        <Alert type="error">Only pending or ongoing loans can be edited. This loan is {currentLoan.status}.</Alert>
        <Link href={`/loans/${params.id}`}>
          <Button variant="secondary">Back to Loan</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link href={`/loans/${params.id}`} className={styles.backLink}>Back to Loan</Link>

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

          <Button variant="primary" size="lg" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Updating Loan...' : 'Update Loan'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
