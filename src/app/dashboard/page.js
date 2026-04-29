'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useLoans } from '@/hooks/useLoans';
import { usePayables } from '@/hooks/usePayables';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Alert from '@/components/Alert';
import Badge from '@/components/Badge';
import { formatCurrency } from '@/utils/calculations';
import styles from './page.module.css';

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isAuthChecked } = useAuth();
  const { loans, isLoading, fetchLoans } = useLoans();
  const { summary: payableSummary, payableApiAvailable, fetchPayables } = usePayables();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isAuthChecked) {
      return;
    }

    if (!token) {
      router.push('/login');
      return;
    }

    Promise.allSettled([fetchLoans(), fetchPayables()]);
  }, [isAuthChecked, token, router, fetchLoans, fetchPayables]);

  const stats = useMemo(() => {
    if (!loans || loans.length === 0) {
      return { totalLoans: 0, totalOriginally: 0, totalPaid: 0, totalOutstanding: 0 };
    }

    return loans.reduce(
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
  }, [loans]);

  const filteredLoans = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return loans;

    return loans.filter((loan) =>
      [
        loan.borrower_name,
        loan.borrower_contact,
        loan.borrower_address,
        loan.status,
        String(loan.total_receivable ?? ''),
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(keyword))
    );
  }, [loans, searchTerm]);

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
          <div className={styles.sectionTitle}>
            <h2>Loans You Lent</h2>
            <p className={styles.resultCount}>
              Showing {filteredLoans.length} of {loans.length} loans
            </p>
          </div>
          <div className={styles.headerActions}>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search loans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Link href="/expenses">
              <Button variant="secondary">Expenses</Button>
            </Link>
            <Link href="/payables">
              <Button variant="secondary">Payables</Button>
            </Link>
            <Link href="/loans/new">
              <Button variant="primary">Record New Loan</Button>
            </Link>
          </div>
        </div>

        {loans && loans.length > 0 ? (
          filteredLoans.length > 0 ? (
          <div className={styles.loansList}>
            {filteredLoans.slice(0, 3).map((loan) => (
              <Card key={loan.id}>
                <div className={styles.loanRow}>
                  <div className={styles.loanInfo}>
                    <h4>{loan.borrower_name}</h4>
                    <div className='d-flex align-items-center justify-content-center w-100'>
                         <Badge status={loan.status}>{loan.status}</Badge>
                    </div>
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
                <h3>No matching loans</h3>
                <p>Try a different search keyword.</p>
              </div>
            </Card>
          )
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

        {filteredLoans && filteredLoans.length > 3 && (
          <Link href="/loans">
            <Button variant="secondary" size="lg">View All Loans</Button>
          </Link>
        )}
      </div>

      {payableApiAvailable && (
        <Card className={styles.payablesWidget}>
          <div className={styles.payablesHeader}>
            <h3>Payables Snapshot</h3>
            <Link href="/payables">
              <Button variant="secondary" size="sm">Open Payables</Button>
            </Link>
          </div>
          <div className={styles.payablesGrid}>
            <div>
              <span>Total Payables</span>
              <strong>{formatCurrency(payableSummary.total_payables || 0)}</strong>
            </div>
            <div>
              <span>Paid Amount</span>
              <strong>{formatCurrency(payableSummary.total_paid || 0)}</strong>
            </div>
            <div>
              <span>Balance Remaining</span>
              <strong>{formatCurrency(payableSummary.total_balance || 0)}</strong>
            </div>
            <div>
              <span>Upcoming Dues (7 Days)</span>
              <strong>{payableSummary.upcoming_due_count || 0}</strong>
            </div>
            <div>
              <span>Overdue</span>
              <strong>{payableSummary.overdue_count || 0}</strong>
            </div>
            <div>
              <span>Completed</span>
              <strong>{payableSummary.completed_count || 0}</strong>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
