'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useLoans } from '@/hooks/useLoans';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Alert from '@/components/Alert';
import Badge from '@/components/Badge';
import {
  buildMonthlySchedule,
  calculateRemainingBalance,
  formatCurrency,
  formatDate,
  formatDateTime,
  getInterestPeriodLabel,
} from '@/utils/calculations';
import styles from './page.module.css';

const toDateTimeLocalValue = (value) => {
  const d = value ? new Date(value) : new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

export default function LoanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { token, isAuthChecked } = useAuth();
  const { currentLoan, isLoading, fetchLoanById, addPaymentWithDate, updateLoanStatus, fetchLoanHistory } = useLoans();
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDateTime, setPaymentDateTime] = useState(toDateTimeLocalValue());
  const [history, setHistory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    const loadHistory = async () => {
      if (!params.id || !token) return;
      try {
        const rows = await fetchLoanHistory(params.id);
        setHistory(Array.isArray(rows) ? rows : []);
      } catch {
        setHistory([]);
      }
    };

    loadHistory();
  }, [params.id, token, fetchLoanHistory, currentLoan?.total_payments, currentLoan?.status]);

  const schedule = useMemo(() => (currentLoan ? buildMonthlySchedule(currentLoan) : []), [currentLoan]);

  const handleAddPayment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!paymentAmount || Number.isNaN(Number(paymentAmount)) || parseFloat(paymentAmount) <= 0) {
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
      await addPaymentWithDate(currentLoan.id, amount, new Date(paymentDateTime).toISOString());
      setSuccess('Payment recorded successfully!');
      setPaymentAmount('');
      setPaymentDateTime(toDateTimeLocalValue());
      await fetchLoanById(params.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkOngoing = async () => {
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      await updateLoanStatus(currentLoan.id, 'ongoing');
      setSuccess('Loan status updated to Ongoing.');
      await fetchLoanById(params.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update loan status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadBreakdown = () => {
    if (!currentLoan) return;

    const rows = schedule.slice(0, 12);
    const width = 1000;
    const rowHeight = 42;
    const height = 220 + rows.length * rowHeight;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(`Loan Breakdown: ${currentLoan.borrower_name}`, 36, 50);

    ctx.font = '18px Arial';
    ctx.fillStyle = '#334155';
    ctx.fillText(`Total Due: ${formatCurrency(currentLoan.total_receivable)}`, 36, 86);
    ctx.fillText(`Duration: ${currentLoan.duration_months} months`, 36, 114);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('No.', 36, 162);
    ctx.fillText('Due Date', 120, 162);
    ctx.fillText('Amount', 450, 162);
    ctx.fillText('Remaining', 700, 162);

    rows.forEach((item, idx) => {
      const y = 196 + idx * rowHeight;
      ctx.fillStyle = idx % 2 === 0 ? '#e2e8f0' : '#f1f5f9';
      ctx.fillRect(24, y - 24, width - 48, rowHeight - 2);

      ctx.fillStyle = '#0f172a';
      ctx.font = '15px Arial';
      ctx.fillText(String(item.installmentNumber), 36, y);
      ctx.fillText(formatDate(item.dueDate), 120, y);
      ctx.fillText(formatCurrency(item.amount), 450, y);
      ctx.fillText(formatCurrency(item.remainingAfter), 700, y);
    });

    const link = document.createElement('a');
    link.download = `loan-breakdown-${currentLoan.borrower_name.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (!isAuthChecked || isLoading) {
    return (
      <div className={styles.container}>
        <p>Loading loan details...</p>
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

  const totalPaid = currentLoan.total_payments || 0;
  const remaining = calculateRemainingBalance(currentLoan.total_receivable, totalPaid);
  const paidPercentage = (totalPaid / currentLoan.total_receivable) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <Link href="/loans" className={styles.backLink}>Back to Loans</Link>
          <h1>{currentLoan.borrower_name}</h1>
          <div className={styles.headerMeta}>
            <Badge status={currentLoan.status}>{currentLoan.status}</Badge>
            {currentLoan.borrower_contact && <span>{currentLoan.borrower_contact}</span>}
            {currentLoan.borrower_address && <span>{currentLoan.borrower_address}</span>}
          </div>
        </div>
        {currentLoan.status === 'pending' && (
          <Link href={`/loans/${currentLoan.id}/edit`}>
            <Button variant="primary">Edit Loan</Button>
          </Link>
        )}
      </div>

      <div className={styles.grid}>
        <Card>
          <h2>Loan Details</h2>
          <div className={styles.details}>
            <div className={styles.detailRow}>
              <span className={styles.label}>Contact Number:</span>
              <span className={styles.value}>{currentLoan.borrower_contact || 'N/A'}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Address:</span>
              <span className={styles.value}>{currentLoan.borrower_address || 'N/A'}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Principal Amount:</span>
              <span className={styles.value}>{formatCurrency(currentLoan.principal)}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Interest Rate:</span>
              <span className={styles.value}>
                {currentLoan.interest_rate}% {getInterestPeriodLabel(currentLoan.interest_period)}
              </span>
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

        <Card>
          <h2>Payment Progress</h2>
          <div className={styles.progressSection}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${Math.min(paidPercentage, 100)}%` }} />
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

        <Card>
          <div className={styles.breakdownHeader}>
            <h2>Monthly Payment Breakdown</h2>
            <Button variant="secondary" onClick={handleDownloadBreakdown}>Download as Image</Button>
          </div>
          <div className={styles.breakdownTable}>
            <div className={styles.tableRowHead}>
              <span>#</span>
              <span>Due Date</span>
              <span>Amount</span>
              <span>Remaining</span>
            </div>
            {schedule.map((item) => (
              <div className={styles.tableRow} key={item.installmentNumber}>
                <span>{item.installmentNumber}</span>
                <span>{formatDate(item.dueDate)}</span>
                <span>{formatCurrency(item.amount)}</span>
                <span>{formatCurrency(item.remainingAfter)}</span>
              </div>
            ))}
          </div>
        </Card>

        {currentLoan.status === 'pending' && remaining > 0 && (
          <Card>
            <h2>Loan Not Started</h2>
            <p>Set this loan to Ongoing before recording repayments.</p>
            <Button variant="primary" size="lg" onClick={handleMarkOngoing} disabled={isSubmitting}>
              {isSubmitting ? 'Updating Status...' : 'Mark as Ongoing'}
            </Button>
          </Card>
        )}

        {currentLoan.status === 'ongoing' && remaining > 0 && (
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
              <Input
                label="Payment Date & Time"
                type="datetime-local"
                value={paymentDateTime}
                onChange={(e) => setPaymentDateTime(e.target.value)}
                required
              />
              <Button variant="success" size="lg" disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Processing...' : 'Record Payment'}
              </Button>
            </form>
          </Card>
        )}

        <Card>
          <h2>History / Audit Trail</h2>
          <div className={styles.auditList}>
            {history.length > 0 ? history.map((entry) => (
              <div className={styles.auditRow} key={entry.id}>
                <div>
                  <strong>{entry.action.replace('_', ' ')}</strong>
                  <p>{entry.details || 'No details'}</p>
                </div>
                <div className={styles.auditMeta}>
                  {entry.amount_paid ? <span>{formatCurrency(entry.amount_paid)}</span> : <span>-</span>}
                  <span>{formatDateTime(entry.created_at)}</span>
                </div>
              </div>
            )) : <p>No history yet.</p>}
          </div>
        </Card>

        {currentLoan.status !== 'ongoing' && currentLoan.status !== 'pending' && remaining > 0 && (
          <Card>
            <Alert type="error">Payments can only be recorded for ongoing loans.</Alert>
          </Card>
        )}

        {remaining <= 0 && (
          <Card>
            <div className={styles.completedMessage}>
              <h3>Loan Completed</h3>
              <p>This loan has been fully paid off.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
