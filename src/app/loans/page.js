'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useLoans } from '@/hooks/useLoans';
import { useToast } from '@/hooks/useToast';
import Button from '@/components/Button';
import LoanCard from '@/components/LoanCard';
import styles from './page.module.css';

const LOANS_PER_PAGE = 6;

export default function LoansPage() {
  const router = useRouter();
  const toast = useToast();
  const { token, isAuthChecked } = useAuth();
  const { loans, isLoading, fetchLoans, setCurrentLoan, deleteLoan } = useLoans();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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

  const filteredLoans = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return loans;

    return loans.filter((loan) => {
      return [
        loan.borrower_name,
        loan.borrower_contact,
        loan.borrower_address,
        loan.status,
        String(loan.principal ?? ''),
        String(loan.total_receivable ?? ''),
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(keyword));
    });
  }, [loans, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredLoans.length / LOANS_PER_PAGE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedLoans = useMemo(() => {
    const start = (currentPageSafe - 1) * LOANS_PER_PAGE;
    return filteredLoans.slice(start, start + LOANS_PER_PAGE);
  }, [filteredLoans, currentPageSafe]);

  const handleDelete = async (id, status) => {
    if (status !== 'pending' && status !== 'completed') {
      toast.warning('Only pending or completed loans can be deleted.');
      return;
    }

    if (confirm('Are you sure you want to delete this loan? This action cannot be undone.')) {
      try {
        await deleteLoan(id);
        toast.success('Loan deleted successfully.');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete loan');
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

  if (!token) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>My Lending</h1>
          <p className={styles.resultCount}>
            Showing {filteredLoans.length} of {loans.length} loans
          </p>
        </div>
        <div className={styles.headerActions}>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search borrower, status, amount..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          <Link href="/loans/new">
            <Button variant="primary">Record New Loan</Button>
          </Link>
        </div>
      </div>

      {loans && loans.length > 0 ? (
        filteredLoans.length > 0 ? (
        <div className={styles.loansGrid}>
          {paginatedLoans.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              onView={() => {
                setCurrentLoan(loan);
                router.push(`/loans/${loan.id}`);
              }}
              onEdit={() => router.push(`/loans/${loan.id}/edit`)}
              onDelete={() => handleDelete(loan.id, loan.status)}
            />
          ))}
        </div>
        ) : (
          <div className={styles.emptyState}>
            <h2>No matching loans</h2>
            <p>Try another search term.</p>
          </div>
        )
      ) : (
        <div className={styles.emptyState}>
          <h2>No loans yet</h2>
          <p>Record your first lending transaction to start tracking.</p>
          <Link href="/loans/new">
            <Button variant="primary" size="lg">Record Your First Loan</Button>
          </Link>
        </div>
      )}

      {filteredLoans.length > LOANS_PER_PAGE && (
        <div className={styles.pagination}>
          <Button
            variant="secondary"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPageSafe === 1}
          >
            Previous
          </Button>
          <span className={styles.pageLabel}>
            Page {currentPageSafe} of {totalPages}
          </span>
          <Button
            variant="secondary"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPageSafe === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
