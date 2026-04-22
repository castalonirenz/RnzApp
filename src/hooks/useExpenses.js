import { useExpenseStore } from '@/store/expenseStore';

export const useExpenses = () => {
  const {
    expenses,
    summary,
    budgets,
    period,
    budgetApiAvailable,
    isLoading,
    error,
    setPeriod,
    fetchExpenses,
    fetchSummary,
    fetchBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
    exportBudgetReport,
    createExpense,
    updateExpense,
    deleteExpense,
  } = useExpenseStore();

  return {
    expenses,
    summary,
    budgets,
    period,
    budgetApiAvailable,
    isLoading,
    error,
    setPeriod,
    fetchExpenses,
    fetchSummary,
    fetchBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
    exportBudgetReport,
    createExpense,
    updateExpense,
    deleteExpense,
  };
};
