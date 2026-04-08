'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useLoans } from '@/hooks/useLoans';
import Button from '@/components/Button';
import LoanCard from '@/components/LoanCard';
import Alert from '@/components/Alert';
import styles from './page.module.css';

export default function LoansPage() {
  const router = useRouter();
  const { user, isAuthChecked } = useAuth();
  const { loans, isLoading, error, fetchLoans, setCurrentLoan } = useLoans();

  useEffect(() => {
    if (!isAuthChecked) {
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    fetchLoans();
  }, [isAuthChecked, user, router, fetchLoans]);

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this loan? This action cannot be undone.')) {
      try {
        await useLoans.getState().deleteLoan(id);
        alert('Loan deleted successfully');
      } catch (err) {
        alert('Failed to delete loan');
      }
    }
  };

  if (!isAuthChecked || isLoading) {
    return (
      <div className={styles.container}>
        <p>Loading loans...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>My Loans</h1>
        <Link href="/loans/new">
          <Button variant="primary">Add New Loan</Button>
        </Link>
      </div>

      {error && (
        <Alert type="error" onClose={() => {}}>
          {error}
        </Alert>
      )}

      {loans && loans.length > 0 ? (
        <div className={styles.loansGrid}>
          {loans.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              onView={() => {
                setCurrentLoan(loan);
                router.push(`/loans/${loan.id}`);
              }}
              onEdit={() => router.push(`/loans/${loan.id}/edit`)}
              onDelete={() => handleDelete(loan.id)}
            />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h2>No loans yet</h2>
          <p>Create your first loan to start tracking.</p>
          <Link href="/loans/new">
            <Button variant="primary" size="lg">Create Your First Loan</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
