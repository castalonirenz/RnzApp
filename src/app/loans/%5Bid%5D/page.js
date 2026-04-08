'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useLoans } from '@/hooks/useLoans';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Alert from '@/components/Alert';
import Badge from '@/components/Badge';
import { formatCurrency, formatDate, calculateRemainingBalance } from '@/utils/calculations';
import styles from './page.module.css';

export default function LoanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthChecked } = useAuth();
  const { currentLoan, isLoading, fetchLoanById, addPayment } = useLoans();
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const handleAddPayment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!paymentAmount || isNaN(paymentAmount) || parseFloat(paymentAmount) <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    const amount = parseFloat(paymentAmount);
    const remaining = calculateRemainingBalance(
      currentLoan.total_receivable,
      currentLoan.total_payments || 0
    );

    if (amount > remaining) {
      setError(`Payment amount cannot exceed remaining balance of ${formatCurrency(remaining)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await addPayment(currentLoan.id, amount);
      setSuccess('Payment recorded successfully!');
      setPaymentAmount('');
      await fetchLoanById(params.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthChecked || isLoading) {
    return (
      <div className={styles.container}>
        <p>Loading loan details...</p>
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

  const totalPaid = currentLoan.total_payments || 0;
  const remaining = calculateRemainingBalance(currentLoan.total_receivable, totalPaid);
  const paidPercentage = (totalPaid / currentLoan.total_receivable) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <Link href="/loans" className={styles.backLink}>← Back to Loans</Link>
          <h1>{currentLoan.borrower_name}</h1>
          <Badge status={currentLoan.status}>{currentLoan.status}</Badge>
        </div>
        {currentLoan.status === 'pending' && (
          <Link href={`/loans/${currentLoan.id}/edit`}>
            <Button variant="primary">Edit Loan</Button>
          </Link>
        )}
      </div>

      <div className={styles.grid}>
        {/* Loan Details */}
        <Card>
          <h2>Loan Details</h2>
          <div className={styles.details}>
            <div className={styles.detailRow}>
              <span className={styles.label}>Principal Amount:</span>
              <span className={styles.value}>{formatCurrency(currentLoan.principal)}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Interest Rate:</span>
              <span className={styles.value}>{currentLoan.interest_rate}% per annum</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Duration:</span>
              <span className={styles.value}>{currentLoan.duration_months} months</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Total Amount Due:</span>
              <span className={styles.value}>{formatCurrency(currentLoan.total_receivable)}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Created:</span>
              <span className={styles.value}>{formatDate(currentLoan.created_at)}</span>
            </div>
          </div>
        </Card>

        {/* Payment Progress */}
        <Card>
          <h2>Payment Progress</h2>
          <div className={styles.progressSection}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${Math.min(paidPercentage, 100)}%` }}
              ></div>
            </div>
            <p className={styles.progressText}>{paidPercentage.toFixed(1)}% Complete</p>

            <div className={styles.balanceInfo}>
              <div className={styles.balanceItem}>
                <span className={styles.balanceLabel}>Total Paid:</span>
                <span className={styles.balanceValue}>{formatCurrency(totalPaid)}</span>
              </div>
              <div className={styles.balanceItem}>
                <span className={styles.balanceLabel}>Outstanding Balance:</span>
                <span className={styles.balanceValue}>{formatCurrency(remaining)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Add Payment */}
        {remaining > 0 && (
          <Card>
            <h2>Record Payment</h2>
            {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

            <form onSubmit={handleAddPayment} className={styles.paymentForm}>
              <Input
                label="Payment Amount"
                type="number"
                step="0.01"
                min="0"
                max={remaining}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                required
              />
              <Button
                variant="success"
                size="lg"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? 'Processing...' : 'Record Payment'}
              </Button>
            </form>
          </Card>
        )}

        {remaining <= 0 && (
          <Card>
            <div className={styles.completedMessage}>
              <h3>✅ Loan Completed</h3>
              <p>This loan has been fully paid off.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
