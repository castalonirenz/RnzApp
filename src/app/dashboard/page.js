'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useLoans } from '@/hooks/useLoans';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Alert from '@/components/Alert';
import { formatCurrency } from '@/utils/calculations';
import styles from './page.module.css';

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isAuthChecked } = useAuth();
  const { loans, isLoading, fetchLoans } = useLoans();
  const [stats, setStats] = useState({
    totalLoans: 0,
    totalOriginally: 0,
    totalPaid: 0,
    totalOutstanding: 0,
  });

  useEffect(() => {
    if (!isAuthChecked) {
      return;
    }

    if (!token) {
      router.push('/login');
      return;
    }

    fetchLoans();
  }, [isAuthChecked, token, router, fetchLoans]);

  useEffect(() => {
    if (loans && loans.length > 0) {
      const stats = loans.reduce(
        (acc, loan) => {
          const totalPayments = loan.total_payments || 0;
          return {
            totalLoans: acc.totalLoans + 1,
            totalOriginally: acc.totalOriginally + loan.principal,
            totalPaid: acc.totalPaid + totalPayments,
            totalOutstanding: acc.totalOutstanding + (loan.total_receivable - totalPayments),
          };
        },
        { totalLoans: 0, totalOriginally: 0, totalPaid: 0, totalOutstanding: 0 }
      );
      setStats(stats);
    }
  }, [loans]);

  if (!isAuthChecked || isLoading) {
    return (
      <div className={styles.container}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.name || user?.email}</p>
      </div>

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.stat}>
            <h4>📊 Total Loans</h4>
            <p className={styles.statValue}>{stats.totalLoans}</p>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.stat}>
            <h4>💰 Total Lent</h4>
            <p className={styles.statValue}>{formatCurrency(stats.totalOriginally)}</p>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.stat}>
            <h4>✅ Total Paid</h4>
            <p className={styles.statValue}>{formatCurrency(stats.totalPaid)}</p>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.stat}>
            <h4>⚠️ Outstanding</h4>
            <p className={styles.statValue}>{formatCurrency(stats.totalOutstanding)}</p>
          </div>
        </Card>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Loans You Lent</h2>
          <Link href="/loans/new">
            <Button variant="primary">Record New Loan</Button>
          </Link>
        </div>

        {loans && loans.length > 0 ? (
          <div className={styles.loansList}>
            {loans.slice(0, 3).map((loan) => (
              <Card key={loan.id}>
                <div className={styles.loanRow}>
                  <div className={styles.loanInfo}>
                    <h4>{loan.borrower_name}</h4>
                    <p>{loan.status.toUpperCase()}</p>
                  </div>
                  <div className={styles.loanAmount}>
                    <p className={styles.label}>Total Due</p>
                    <p>{formatCurrency(loan.total_receivable)}</p>
                  </div>
                  <div className={styles.loanAmount}>
                    <p className={styles.label}>Outstanding</p>
                    <p>{formatCurrency(loan.total_receivable - (loan.total_payments || 0))}</p>
                  </div>
                  <Link href={`/loans/${loan.id}`}>
                    <Button variant="secondary" size="sm">View</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className={styles.emptyState}>
              <h3>No loans yet</h3>
              <p>Record your first lending entry to get started.</p>
              <Link href="/loans/new">
                <Button variant="primary">Record Loan</Button>
              </Link>
            </div>
          </Card>
        )}

        {loans && loans.length > 3 && (
          <Link href="/loans">
            <Button variant="secondary" size="lg">View All Loans</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
