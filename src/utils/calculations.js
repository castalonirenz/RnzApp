// Calculate total receivable based on principal, interest rate, and duration
export const calculateTotalReceivable = (principal, interestRate, durationMonths) => {
  const rate = interestRate / 100;
  const time = durationMonths / 12;
  const total = principal + (principal * rate * time);
  return parseFloat(total.toFixed(2));
};

// Calculate remaining balance
export const calculateRemainingBalance = (totalReceivable, totalPayments) => {
  return parseFloat((totalReceivable - totalPayments).toFixed(2));
};

// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Format date
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
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
