'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '@/hooks/useAuth';
import { useExpenses } from '@/hooks/useExpenses';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import { formatCurrency } from '@/utils/calculations';
import styles from './page.module.css';

const PERIOD_LABEL = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const getPeriodKey = (dateValue, period) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';

  if (period === 'yearly') return String(date.getFullYear());
  if (period === 'weekly') {
    const weekStart = new Date(date);
    const dayOfWeek = weekStart.getDay();
    const daysFromMonday = (dayOfWeek + 6) % 7;
    weekStart.setDate(weekStart.getDate() - daysFromMonday);
    return weekStart.toISOString().slice(0, 10);
  }
  const month = String(date.getMonth() + 1).padStart(2, '0');
  if (period === 'monthly') return `${date.getFullYear()}-${month}`;
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const escapeCsv = (value) => {
  if (value == null) return '';
  const text = String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const getPeriodWindow = (periodType, now = new Date()) => {
  const start = new Date(now);
  const end = new Date(now);

  if (periodType === 'yearly') {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
    end.setFullYear(start.getFullYear() + 1, 0, 1);
    end.setHours(0, 0, 0, 0);
    return { start, end };
  }

  if (periodType === 'monthly') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(start.getMonth() + 1, 1);
    end.setHours(0, 0, 0, 0);
    return { start, end };
  }

  if (periodType === 'weekly') {
    const dayOfWeek = start.getDay();
    const daysFromMonday = (dayOfWeek + 6) % 7;
    start.setDate(start.getDate() - daysFromMonday);
    start.setHours(0, 0, 0, 0);
    end.setTime(start.getTime());
    end.setDate(start.getDate() + 7);
    end.setHours(0, 0, 0, 0);
    return { start, end };
  }

  start.setHours(0, 0, 0, 0);
  end.setDate(start.getDate() + 1);
  end.setHours(0, 0, 0, 0);
  return { start, end };
};

const getBoundaryDate = (value, type) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  if (typeof value === 'string' && value.length <= 10) {
    if (type === 'end') {
      parsed.setHours(23, 59, 59, 999);
    } else {
      parsed.setHours(0, 0, 0, 0);
    }
  }

  return parsed;
};

const isExpenseInsideBudgetWindow = (expenseDate, budget, now = new Date()) => {
  const date = new Date(expenseDate);
  if (Number.isNaN(date.getTime())) return false;

  const { start, end } = getPeriodWindow(budget.period_type || 'monthly', now);
  if (date < start || date >= end) return false;

  const startDate = getBoundaryDate(budget.start_date, 'start');
  if (startDate && date < startDate) return false;

  const endDate = getBoundaryDate(budget.end_date, 'end');
  if (endDate && date > endDate) return false;

  return true;
};

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

export default function ExpensesPage() {
  const router = useRouter();
  const { token, isAuthChecked } = useAuth();
  const {
    expenses,
    summary,
    budgets,
    period,
    budgetApiAvailable,
    error,
    setPeriod,
    fetchExpenses,
    fetchSummary,
    fetchBudgets,
    exportBudgetReport,
  } = useExpenses();

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [budgetExportingKey, setBudgetExportingKey] = useState('');
  const initialPeriodRef = useRef(period);

  useEffect(() => {
    if (!isAuthChecked) return;

    if (!token) {
      router.push('/login');
      return;
    }

    let mounted = true;

    const bootstrap = async () => {
      await Promise.allSettled([
        fetchExpenses(),
        fetchSummary(initialPeriodRef.current),
        fetchBudgets(),
      ]);

      if (mounted) {
        setIsBootstrapping(false);
      }
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [isAuthChecked, token, router, fetchExpenses, fetchSummary, fetchBudgets]);

  const budgetNameById = useMemo(() => {
    return budgets.reduce((acc, budget) => {
      if (budget?.id != null) {
        acc[String(budget.id)] = budget.name;
      }
      return acc;
    }, {});
  }, [budgets]);

  const totalExpense = useMemo(
    () => expenses.reduce((acc, item) => acc + toNumber(item.amount, 0), 0),
    [expenses]
  );

  const budgetSnapshots = useMemo(() => {
    const now = new Date();

    return budgets.map((budget) => {
      const amountLimit = toNumber(budget.amount_limit, 0);
      const linkedExpenses = expenses.filter(
        (expense) =>
          expense?.budget_id != null &&
          String(expense.budget_id) === String(budget.id) &&
          isExpenseInsideBudgetWindow(expense.expense_date, budget, now)
      );

      const fallbackSpent = linkedExpenses.reduce(
        (sum, expense) => sum + toNumber(expense.amount, 0),
        0
      );

      const spent = budget.total_spent == null ? fallbackSpent : toNumber(budget.total_spent, 0);
      const remaining =
        budget.remaining_balance == null
          ? amountLimit - spent
          : toNumber(budget.remaining_balance, amountLimit - spent);
      const progress = amountLimit > 0 ? Math.min((spent / amountLimit) * 100, 100) : 0;

      return {
        ...budget,
        spent,
        remaining,
        progress,
        amountLimit,
      };
    });
  }, [budgets, expenses]);

  const totalBudgetLimit = useMemo(
    () => budgetSnapshots.reduce((sum, budget) => sum + toNumber(budget.amountLimit, 0), 0),
    [budgetSnapshots]
  );

  const totalBudgetRemaining = useMemo(
    () => budgetSnapshots.reduce((sum, budget) => sum + toNumber(budget.remaining, 0), 0),
    [budgetSnapshots]
  );

  const detailedRows = useMemo(
    () =>
      [...expenses]
        .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime())
        .map((expense) => ({
          ...expense,
          periodKey: getPeriodKey(expense.expense_date, period),
          budgetName: budgetNameById[String(expense.budget_id)] || '',
        })),
    [expenses, period, budgetNameById]
  );

  const handlePeriodChange = async (nextPeriod) => {
    setPeriod(nextPeriod);
    await fetchSummary(nextPeriod);
  };

  const handleBudgetExport = async (budgetId, format) => {
    const exportKey = `${budgetId}:${format}`;
    setBudgetExportingKey(exportKey);

    try {
      const { blob, filename } = await exportBudgetReport(budgetId, format);
      const fallback = `budget-${budgetId}-${new Date().toISOString().slice(0, 10)}.${format}`;
      downloadBlob(blob, filename || fallback);
    } catch {
      // handled by store
    } finally {
      setBudgetExportingKey('');
    }
  };

  const handleDownloadExcel = () => {
    const lines = [];
    lines.push(escapeCsv(`Expense Report (${PERIOD_LABEL[period] || 'Daily'})`));
    lines.push(`${escapeCsv('Generated At')},${escapeCsv(new Date().toISOString())}`);
    lines.push('');
    lines.push(`${escapeCsv('Summary Period')},${escapeCsv('Total (PHP)')}`);
    summary.forEach((item) => {
      lines.push(`${escapeCsv(item.period)},${escapeCsv(Number(item.total || 0).toFixed(2))}`);
    });
    lines.push('');
    lines.push(
      [
        'Date & Time',
        'Title',
        'Category',
        'Budget',
        'Amount (PHP)',
        `${PERIOD_LABEL[period] || 'Daily'} Bucket`,
        'Notes',
      ].map(escapeCsv).join(',')
    );
    detailedRows.forEach((row) => {
      lines.push(
        [
          row.expense_date,
          row.title,
          row.category || '',
          row.budgetName || '',
          Number(row.amount || 0).toFixed(2),
          row.periodKey,
          row.notes || '',
        ].map(escapeCsv).join(',')
      );
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const filename = `expenses-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadBlob(blob, filename);
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    const reportTitle = `Expense Report - ${PERIOD_LABEL[period] || 'Daily'} View`;
    const generatedAt = new Date().toLocaleString();

    doc.setFontSize(16);
    doc.text(reportTitle, 14, 16);
    doc.setFontSize(10);
    doc.text(`Generated at: ${generatedAt}`, 14, 22);
    doc.text(`Total Expense: ${Number(totalExpense || 0).toFixed(2)} PHP`, 14, 27);

    autoTable(doc, {
      startY: 33,
      head: [['Summary Period', 'Total (PHP)']],
      body: summary.map((item) => [item.period, Number(item.total || 0).toFixed(2)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    const detailStartY = (doc.lastAutoTable?.finalY || 33) + 8;
    autoTable(doc, {
      startY: detailStartY,
      head: [['Date & Time', 'Title', 'Category', 'Budget', 'Amount', 'Bucket']],
      body: detailedRows.map((row) => [
        new Date(row.expense_date).toLocaleString(),
        row.title,
        row.category || '-',
        row.budgetName || '-',
        Number(row.amount || 0).toFixed(2),
        row.periodKey || '-',
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 118, 110] },
    });

    doc.save(`expenses-${period}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (!isAuthChecked) {
    return <div className={styles.container}>Loading expenses...</div>;
  }
  if (!token) return null;
  if (isBootstrapping) {
    return <div className={styles.container}>Loading expenses...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Expense Overview</h1>
        <p>Monitor budget usage, summary trends, and expense records</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {!budgetApiAvailable && (
        <Alert type="warning">
          Budget API is not available yet. Frontend is ready, but backend still needs
          `/budgets` and `/budgets/:id/export`.
        </Alert>
      )}

      <div className={styles.quickActions}>
        <Link href="/expenses/add">
          <Button variant="primary">Go To Add Expense</Button>
        </Link>
        <Link href="/expenses/list">
          <Button variant="secondary">Go To Expense List</Button>
        </Link>
        <Link href="/expenses/budgets">
          <Button variant="secondary">Go To Create Budget</Button>
        </Link>
      </div>

      <div className="d-flex flex-wrap w-100">
        <div className="col-12 col-xl-5">
          <Card className={styles.totalCard}>
            <h3>Total Expense</h3>
            <p className={styles.total}>{formatCurrency(totalExpense)}</p>
          </Card>

          <Card>
            <div className={styles.summaryHeader}>
              <h2>Budget Monitoring</h2>
              <div className={styles.budgetTotals}>
                <span>Total Limit: {formatCurrency(totalBudgetLimit)}</span>
                <strong>Remaining: {formatCurrency(totalBudgetRemaining)}</strong>
              </div>
            </div>

            <div className={styles.budgetList}>
              {budgetSnapshots.length > 0 ? (
                budgetSnapshots.map((budget) => (
                  <div className={styles.budgetCard} key={budget.id}>
                    <div className={styles.budgetCardHeader}>
                      <div>
                        <h4>{budget.name}</h4>
                        <p>{PERIOD_LABEL[budget.period_type] || budget.period_type}</p>
                      </div>
                      <strong>{formatCurrency(budget.remaining)}</strong>
                    </div>
                    <div className={styles.budgetMeta}>
                      <span>Spent: {formatCurrency(budget.spent)}</span>
                      <span>Limit: {formatCurrency(budget.amountLimit)}</span>
                    </div>
                    <div className={styles.progressTrack}>
                      <div
                        className={styles.progressBar}
                        style={{
                          width: `${Math.max(0, budget.progress)}%`,
                          backgroundColor: budget.remaining < 0 ? '#dc2626' : '#0f766e',
                        }}
                      />
                    </div>
                    <div className={styles.exportButtons}>

                        <Link href={`/expenses/budgets/${budget.id}`}>
                        <Button size="sm" variant="primary">
                          View Expenses
                        </Button>
                      </Link>
                      
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleBudgetExport(budget.id, 'csv')}
                        disabled={budgetExportingKey === `${budget.id}:csv`}
                      >
                        {budgetExportingKey === `${budget.id}:csv` ? 'Exporting...' : 'CSV'}
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleBudgetExport(budget.id, 'pdf')}
                        disabled={budgetExportingKey === `${budget.id}:pdf`}
                      >
                        {budgetExportingKey === `${budget.id}:pdf` ? 'Exporting...' : 'PDF'}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p>No budgets yet. Open Create Budget from the menu to add one.</p>
              )}
            </div>
          </Card>
        </div>

        <div className="col-12 col-xl-7">
          <Card>
            <div className={styles.summaryHeader}>
              <h2>Dynamic Summary</h2>
              <div className={styles.summaryActions}>
                <div className={styles.filters}>
                  <Button
                    variant={period === 'daily' ? 'primary' : 'secondary'}
                    onClick={() => handlePeriodChange('daily')}
                  >
                    Daily
                  </Button>
                  <Button
                    variant={period === 'monthly' ? 'primary' : 'secondary'}
                    onClick={() => handlePeriodChange('monthly')}
                  >
                    Monthly
                  </Button>
                  <Button
                    variant={period === 'yearly' ? 'primary' : 'secondary'}
                    onClick={() => handlePeriodChange('yearly')}
                  >
                    Yearly
                  </Button>
                </div>
                <div className={styles.exportButtons}>
                  <Button variant="secondary" onClick={handleDownloadExcel}>
                    Download Excel
                  </Button>
                  <Button variant="primary" onClick={handleDownloadPdf}>
                    Download PDF
                  </Button>
                </div>
              </div>
            </div>
            <div className={styles.summaryList}>
              {summary.length > 0 ? (
                summary.map((item) => (
                  <div className={styles.summaryRow} key={item.period}>
                    <span>{item.period}</span>
                    <strong>{formatCurrency(item.total)}</strong>
                  </div>
                ))
              ) : (
                <p>No summary yet.</p>
              )}
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
