import { usePayableStore } from '@/store/payableStore';

export const usePayables = () => {
  const {
    payables,
    summary,
    currentPayable,
    paymentHistory,
    filters,
    payableApiAvailable,
    isLoading,
    error,
    setError,
    setFilters,
    clearCurrentPayable,
    fetchPayables,
    fetchPayableById,
    createPayable,
    updatePayable,
    recordPayment,
    fetchPaymentHistory,
    deletePayable,
  } = usePayableStore();

  return {
    payables,
    summary,
    currentPayable,
    paymentHistory,
    filters,
    payableApiAvailable,
    isLoading,
    error,
    setError,
    setFilters,
    clearCurrentPayable,
    fetchPayables,
    fetchPayableById,
    createPayable,
    updatePayable,
    recordPayment,
    fetchPaymentHistory,
    deletePayable,
  };
};
