import { useState } from 'react';
import Link from 'next/link';
import styles from './SharedExpenseTable.module.css';
import Badge from './Badge';
import Button from './Button';
import Tooltip from './Tooltip';
import ExpenseDetailModal from './ExpenseDetailModal';

export default function SharedExpenseTable({
  expenses = [],
  onEdit,
  onDelete,
  isLoading = false,
  onExport,
}) {
  const [selectedExpense, setSelectedExpense] = useState(null);
  const getParticipantNames = (expense) => {
    if (!Array.isArray(expense?.participants)) return [];
    return expense.participants
      .map((participant) => (typeof participant === 'string' ? participant : participant?.name))
      .filter(Boolean);
  };

  if (expenses.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No shared expenses yet. Create one to get started!</p>
        <Link href="/expenses/shared/add">
          <Button variant="primary">Create First Expense</Button>
        </Link>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Shared Expenses</h2>
        {expenses.length > 0 && (
          <div className={styles.actionButtons}>
            {onExport && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => onExport('csv')}
                  disabled={isLoading}
                  size="sm"
                >
                  Export CSV
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => onExport('pdf')}
                  disabled={isLoading}
                  size="sm"
                >
                  Export PDF
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Total Amount</th>
              <th>Participants</th>
              <th>Share Per Person</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id} className={styles.tableRow}>
                <td className={styles.titleCell}>
                  <div className={styles.titleContent}>
                    <span className={styles.title}>{expense.title}</span>
                    {expense.description && (
                      <span className={styles.description}>{expense.description}</span>
                    )}
                  </div>
                </td>
                <td className={styles.amountCell}>
                  <span className={styles.amount}>
                    {formatCurrency(expense.amount)}
                  </span>
                </td>
                <td className={styles.participantsCell}>
                  {(() => {
                    const participantNames = getParticipantNames(expense);
                    return (
                  <Tooltip
                    content={participantNames.join(', ')}
                  >
                    <div className={styles.participantsList}>
                      {participantNames.slice(0, 2).map((participant, idx) => (
                        <Badge key={idx} variant="info">
                          {participant}
                        </Badge>
                      ))}
                      {participantNames.length > 2 && (
                        <Badge 
                          variant="info"
                          className={styles.moreParticipants}
                          onClick={() => setSelectedExpense(expense)}
                        >
                          +{participantNames.length - 2}
                        </Badge>
                      )}
                    </div>
                  </Tooltip>
                    );
                  })()}
                </td>
                <td className={styles.shareCell}>
                  <span className={styles.share}>
                    {expense.split_mode === 'custom'
                      ? 'Custom'
                      : formatCurrency(expense.share_per_person)}
                  </span>
                </td>
                <td className={styles.dateCell}>
                  {expense.created_at
                    ? new Date(expense.created_at).toLocaleDateString('en-PH')
                    : 'N/A'}
                </td>
                <td className={styles.actionsCell}>
                  <div className={styles.actions}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedExpense(expense)}
                      disabled={isLoading}
                    >
                      View Details
                    </Button>
                    {onEdit && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onEdit(expense.id)}
                        disabled={isLoading}
                      >
                        Edit
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          if (
                            confirm(
                              'Are you sure you want to delete this expense?'
                            )
                          ) {
                            onDelete(expense.id);
                          }
                        }}
                        disabled={isLoading}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ExpenseDetailModal
        expense={selectedExpense}
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}
