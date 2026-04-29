'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '@/hooks/useAuth';
import { usePayables } from '@/hooks/usePayables';
import { useToast } from '@/hooks/useToast';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import PayablesSummary from '@/components/PayablesSummary';
import PayableTable from '@/components/PayableTable';
import PaymentModal from '@/components/PaymentModal';
import { formatCurrency, formatDate } from '@/utils/calculations';
import styles from './page.module.css';

const SORT_OPTIONS = ['due_date', 'amount_paid', 'created_at'];
const MONTH_OPTIONS = [
  { value: 0, label: 'January' },
  { value: 1, label: 'February' },
  { value: 2, label: 'March' },
  { value: 3, label: 'April' },
  { value: 4, label: 'May' },
  { value: 5, label: 'June' },
  { value: 6, label: 'July' },
  { value: 7, label: 'August' },
  { value: 8, label: 'September' },
  { value: 9, label: 'October' },
  { value: 10, label: 'November' },
  { value: 11, label: 'December' },
];

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const escapeCsv = (value) => {
  if (value == null) return '';
  const text = String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const toStatusLabel = (status) =>
  status ? status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) : 'Pending';

const computeSummaryFromPayables = (items = []) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const next7Days = new Date(now);
  next7Days.setDate(next7Days.getDate() + 7);

  const totalPayables = items.reduce((sum, item) => sum + Number(item.principal_amount || 0), 0);
  const totalPaid = items.reduce((sum, item) => sum + Number(item.amount_paid || 0), 0);
  const totalBalance = items.reduce((sum, item) => sum + Number(item.balance || 0), 0);
  const pendingCount = items.filter((item) => item.status === 'pending').length;
  const completedCount = items.filter((item) => item.status === 'completed').length;

  const dueItems = items.filter((item) => item.status !== 'completed');
  const upcoming = dueItems.filter((item) => {
    const due = new Date(item.due_date);
    return !Number.isNaN(due.getTime()) && due >= now && due <= next7Days;
  }).length;
  const overdue = dueItems.filter((item) => {
    const due = new Date(item.due_date);
    return !Number.isNaN(due.getTime()) && due < now;
  }).length;

  return {
    total_payables: totalPayables,
    total_paid: totalPaid,
    total_balance: totalBalance,
    pending_count: pendingCount,
    completed_count: completedCount,
    upcoming_due_count: upcoming,
    overdue_count: overdue,
  };
};

export default function PayablesPage() {
  const initialDate = useMemo(() => new Date(), []);
  const currentMonth = initialDate.getMonth();
  const currentYear = initialDate.getFullYear();
  const router = useRouter();
  const toast = useToast();
  const { token, isAuthChecked } = useAuth();
  const {
    payables,
    summary,
    payableApiAvailable,
    isLoading,
    fetchPayables,
    recordPayment,
    deletePayable,
  } = usePayables();

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [checkBy, setCheckBy] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [statusFilter, setStatusFilter] = useState('all');
  const [creditorFilter, setCreditorFilter] = useState('');
  const [sortBy, setSortBy] = useState('due_date');
  const [paymentTarget, setPaymentTarget] = useState(null);

  const activeFilters = useMemo(
    () => ({
      status: statusFilter,
      creditor_name: creditorFilter.trim(),
      sort_by: sortBy,
    }),
    [statusFilter, creditorFilter, sortBy]
  );

  const yearOptions = useMemo(() => {
    const dueYears = payables
      .map((item) => new Date(item.due_date))
      .filter((date) => !Number.isNaN(date.getTime()))
      .map((date) => date.getFullYear());

    const uniqueYears = Array.from(new Set([...dueYears, currentYear]));
    return uniqueYears.sort((a, b) => b - a);
  }, [payables, currentYear]);

  const displayedPayables = useMemo(() => {
    if (checkBy === 'all') return payables;

    return payables.filter((item) => {
      const due = new Date(item.due_date);
      if (Number.isNaN(due.getTime())) return false;

      if (checkBy === 'yearly') {
        return due.getFullYear() === selectedYear;
      }

      return due.getFullYear() === selectedYear && due.getMonth() === selectedMonth;
    });
  }, [payables, checkBy, selectedYear, selectedMonth]);

  const displayedSummary = useMemo(() => {
    if (checkBy === 'all') return summary;
    return computeSummaryFromPayables(displayedPayables);
  }, [summary, displayedPayables, checkBy]);

  useEffect(() => {
    if (!isAuthChecked) return;

    if (!token) {
      router.push('/login');
      return;
    }

    let mounted = true;
    const bootstrap = async () => {
      await Promise.allSettled([
        fetchPayables({
          status: 'all',
          creditor_name: '',
          sort_by: 'due_date',
        }),
      ]);
      if (mounted) {
        setIsBootstrapping(false);
      }
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [isAuthChecked, token, router, fetchPayables]);

  const handleApplyFilters = async (e) => {
    e.preventDefault();
    await fetchPayables(activeFilters);
  };

  const handleResetFilters = async () => {
    setStatusFilter('all');
    setCreditorFilter('');
    setSortBy('due_date');
    setCheckBy('all');
    setSelectedMonth(currentMonth);
    setSelectedYear(currentYear);
    await fetchPayables({
      status: 'all',
      creditor_name: '',
      sort_by: 'due_date',
    });
  };

  const checkByLabel = useMemo(() => {
    if (checkBy === 'yearly') return `year ${selectedYear}`;
    if (checkBy === 'monthly') {
      const monthLabel = MONTH_OPTIONS.find((month) => month.value === selectedMonth)?.label;
      return `${monthLabel} ${selectedYear}`;
    }
    return 'all periods';
  }, [checkBy, selectedMonth, selectedYear]);

  const handleDelete = async (payable) => {
    const canDelete = payable?.status === 'pending' && Number(payable?.amount_paid || 0) <= 0;
    if (!canDelete) {
      toast.warning('Only pending payables with no payment can be deleted.');
      return;
    }

    const confirmed = window.confirm(
      `Delete payable for "${payable.creditor_name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deletePayable(payable.id);
      await fetchPayables(activeFilters);
      toast.success('Payable deleted successfully.');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete payable.');
    }
  };

  const handlePaymentSubmit = async (payload) => {
    if (!paymentTarget?.id) return;

    try {
      await recordPayment(paymentTarget.id, payload);
      await fetchPayables(activeFilters);
      toast.success('Payment recorded successfully.');
      setPaymentTarget(null);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to record payable payment.');
    }
  };

  const handleExportCsv = () => {
    const lines = [];
    lines.push(escapeCsv('Payables Summary Report'));
    lines.push(`${escapeCsv('Generated At')},${escapeCsv(new Date().toISOString())}`);
    lines.push('');
    lines.push(`${escapeCsv('Total Payables')},${escapeCsv(displayedSummary.total_payables.toFixed(2))}`);
    lines.push(`${escapeCsv('Total Paid')},${escapeCsv(displayedSummary.total_paid.toFixed(2))}`);
    lines.push(`${escapeCsv('Total Balance')},${escapeCsv(displayedSummary.total_balance.toFixed(2))}`);
    lines.push('');
    lines.push(
      [
        'Creditor',
        'Description',
        'Status',
        'Principal',
        'Paid',
        'Balance',
        'Due Date',
        'Frequency',
      ]
        .map(escapeCsv)
        .join(',')
    );

    displayedPayables.forEach((item) => {
      lines.push(
        [
          item.creditor_name,
          item.description || '',
          toStatusLabel(item.status),
          Number(item.principal_amount || 0).toFixed(2),
          Number(item.amount_paid || 0).toFixed(2),
          Number(item.balance || 0).toFixed(2),
          item.due_date ? formatDate(item.due_date) : '',
          item.frequency || 'once',
        ]
          .map(escapeCsv)
          .join(',')
      );
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `payables-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Payables Summary Report', 14, 16);
    doc.setFontSize(10);
    doc.text(`Generated at: ${new Date().toLocaleString()}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [['Metric', 'Value']],
      body: [
        ['Total Payables', formatCurrency(displayedSummary.total_payables)],
        ['Total Paid', formatCurrency(displayedSummary.total_paid)],
        ['Total Balance', formatCurrency(displayedSummary.total_balance)],
        ['Upcoming (7 Days)', String(displayedSummary.upcoming_due_count || 0)],
        ['Overdue', String(displayedSummary.overdue_count || 0)],
        ['Completed', String(displayedSummary.completed_count || 0)],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    autoTable(doc, {
      startY: (doc.lastAutoTable?.finalY || 32) + 8,
      head: [['Creditor', 'Status', 'Principal', 'Paid', 'Balance', 'Due Date']],
      body: displayedPayables.map((item) => [
        item.creditor_name,
        toStatusLabel(item.status),
        formatCurrency(item.principal_amount || 0),
        formatCurrency(item.amount_paid || 0),
        formatCurrency(item.balance || 0),
        item.due_date ? formatDate(item.due_date) : '-',
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 118, 110] },
    });

    doc.save(`payables-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (!isAuthChecked) {
    return <div className={styles.container}>Loading payables page...</div>;
  }
  if (!token) return null;
  if (isBootstrapping) {
    return <div className={styles.container}>Loading payables page...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Payables Tracking</h1>
        <p>Track all liabilities, due dates, and payments in one place.</p>
      </div>

      {!payableApiAvailable && (
        <Alert type="warning">
          Payables API is not available yet. Please integrate `/payables` endpoints first.
        </Alert>
      )}

      <PayablesSummary summary={displayedSummary} />

      <Card>
        <div className={styles.toolbar}>
          <form className={styles.filters} onSubmit={handleApplyFilters}>
            <select
              className={styles.selectInput}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="completed">Completed</option>
            </select>

            <select
              className={styles.selectInput}
              value={checkBy}
              onChange={(e) => setCheckBy(e.target.value)}
            >
              <option value="all">Check: All</option>
              <option value="monthly">Check: Monthly</option>
              <option value="yearly">Check: Yearly</option>
            </select>

            {checkBy === 'monthly' && (
              <select
                className={styles.selectInput}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {MONTH_OPTIONS.map((month) => (
                  <option key={month.value} value={month.value}>
                    Month: {month.label}
                  </option>
                ))}
              </select>
            )}

            {checkBy !== 'all' && (
              <select
                className={styles.selectInput}
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    Year: {year}
                  </option>
                ))}
              </select>
            )}

            <input
              type="text"
              className={styles.textInput}
              value={creditorFilter}
              onChange={(e) => setCreditorFilter(e.target.value)}
              placeholder="Filter by creditor..."
            />

            <select
              className={styles.selectInput}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  Sort: {option.replace('_', ' ')}
                </option>
              ))}
            </select>

            <Button type="submit" variant="primary" disabled={isLoading || !payableApiAvailable}>
              Apply
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleResetFilters}
              disabled={isLoading}
            >
              Reset
            </Button>
          </form>

          <div className={styles.actions}>
            <Button variant="secondary" onClick={handleExportCsv} disabled={!displayedPayables.length}>
              Export CSV
            </Button>
            <Button variant="secondary" onClick={handleExportPdf} disabled={!displayedPayables.length}>
              Export PDF
            </Button>
            <Link href="/payables/add">
              <Button variant="primary">Add Payable</Button>
            </Link>
          </div>
        </div>

        <div className={styles.resultMeta}>
          Showing {displayedPayables.length} of {payables.length} payable
          {payables.length === 1 ? '' : 's'} ({checkByLabel})
        </div>

        <PayableTable
          payables={displayedPayables}
          isLoading={isLoading}
          onView={(id) => router.push(`/payables/${id}`)}
          onEdit={(id) => router.push(`/payables/${id}/edit`)}
          onRecordPayment={(payable) => setPaymentTarget(payable)}
          onDelete={handleDelete}
        />
      </Card>

      <PaymentModal
        payable={paymentTarget}
        isOpen={Boolean(paymentTarget)}
        isLoading={isLoading}
        onClose={() => setPaymentTarget(null)}
        onSubmit={handlePaymentSubmit}
      />
    </div>
  );
}
