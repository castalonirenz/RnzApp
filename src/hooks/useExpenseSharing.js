import { useExpenseSharingStore } from '@/store/expenseSharingStore';

export const useExpenseSharing = () => {
  const {
    sharedExpenses,
    summary,
    settlementReport,
    isLoading,
    error,
    clearError,
    setError,
    fetchSharedExpenses,
    fetchSharedExpenseById,
    createSharedExpense,
    updateSharedExpense,
    deleteSharedExpense,
    fetchSummary,
    fetchSettlementReport,
    exportExpenses,
  } = useExpenseSharingStore();

  return {
    sharedExpenses,
    summary,
    settlementReport,
    isLoading,
    error,
    clearError,
    setError,
    fetchSharedExpenses,
    fetchSharedExpenseById,
    createSharedExpense,
    updateSharedExpense,
    deleteSharedExpense,
    fetchSummary,
    fetchSettlementReport,
    exportExpenses,
  };
};
