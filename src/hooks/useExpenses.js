import { useExpenseStore } from '@/store/expenseStore';

export const useExpenses = () => {
  const {
    expenses,
    summary,
    period,
    isLoading,
    error,
    setPeriod,
    fetchExpenses,
    fetchSummary,
    createExpense,
    deleteExpense,
  } = useExpenseStore();

  return {
    expenses,
    summary,
    period,
    isLoading,
    error,
    setPeriod,
    fetchExpenses,
    fetchSummary,
    createExpense,
    deleteExpense,
  };
};
