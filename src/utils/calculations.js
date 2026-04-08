// Calculate total receivable based on principal, interest rate, and duration
export const calculateTotalReceivable = (
  principal,
  interestRate,
  durationMonths,
  interestPeriod = 'month'
) => {
  const rate = interestRate / 100;

  // Per-annum: simple interest prorated by months.
  // Per-month: simple interest multiplied by number of months.
  const interest =
    interestPeriod === 'month' || interestPeriod === 'monthly'
      ? principal * rate * durationMonths
      : principal * rate * (durationMonths / 12);

  const total = principal + interest;
  return parseFloat(total.toFixed(2));
};

// Calculate remaining balance
export const calculateRemainingBalance = (totalReceivable, totalPayments) => {
  return parseFloat((totalReceivable - totalPayments).toFixed(2));
};

// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
};

export const getInterestPeriodLabel = (interestPeriod) => {
  return interestPeriod === 'month' || interestPeriod === 'monthly' ? 'per month' : 'per annum';
};

// Format date
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const buildMonthlySchedule = (loan) => {
  const duration = Number(loan?.duration_months || 0);
  const total = Number(loan?.total_receivable || 0);
  const startDate = new Date(loan?.created_at || Date.now());
  if (!duration || !total) {
    return [];
  }

  let installment = Number((total / duration).toFixed(2));
  const schedule = [];
  let runningTotal = 0;

  for (let i = 1; i <= duration; i += 1) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    if (i === duration) {
      installment = Number((total - runningTotal).toFixed(2));
    }

    runningTotal += installment;
    schedule.push({
      installmentNumber: i,
      dueDate: dueDate.toISOString(),
      amount: installment,
      remainingAfter: Number(Math.max(total - runningTotal, 0).toFixed(2)),
    });
  }

  return schedule;
};

// Get loan status color for UI
export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return '#fbbf24';
    case 'ongoing':
      return '#3b82f6';
    case 'completed':
      return '#10b981';
    default:
      return '#6b7280';
  }
};

// Get loan status badge
export const getStatusBadge = (status) => {
  const baseStyle = 'px-3 py-1 rounded-full text-sm font-medium';
  switch (status?.toLowerCase()) {
    case 'pending':
      return `${baseStyle} bg-yellow-100 text-yellow-800`;
    case 'ongoing':
      return `${baseStyle} bg-blue-100 text-blue-800`;
    case 'completed':
      return `${baseStyle} bg-green-100 text-green-800`;
    default:
      return `${baseStyle} bg-gray-100 text-gray-800`;
  }
};
