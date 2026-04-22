import { create } from 'zustand';
import { expenseService } from '@/services/expenseService';

const isBudgetApiUnavailable = (error) => {
  const status = error?.response?.status;
  return status === 404 || status === 405 || status === 501;
};

export const useExpenseStore = create((set, get) => ({
  expenses: [],
  summary: [],
  budgets: [],
  period: 'daily',
  budgetApiAvailable: true,
  isLoading: false,
  error: null,

  setPeriod: (period) => set({ period }),
  setError: (error) => set({ error }),

  fetchExpenses: async () => {
    set({ isLoading: true, error: null });
    try {
      const expenses = await expenseService.getExpenses();
      set({ expenses, isLoading: false });
      return expenses;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch expenses',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchSummary: async (period) => {
    set({ isLoading: true, error: null });
    try {
      const summary = await expenseService.getSummary(period || get().period);
      set({ summary, isLoading: false, period: period || get().period });
      return summary;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch expense summary',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchBudgets: async () => {
    set({ isLoading: true, error: null });
    try {
      const budgets = await expenseService.getBudgets();
      set({ budgets, budgetApiAvailable: true, isLoading: false });
      return budgets;
    } catch (error) {
      if (isBudgetApiUnavailable(error)) {
        set({ budgets: [], budgetApiAvailable: false, isLoading: false });
        return [];
      }

      set({
        error: error.response?.data?.message || 'Failed to fetch budgets',
        isLoading: false,
      });
      throw error;
    }
  },

  createBudget: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const created = await expenseService.createBudget(payload);
      set({ budgets: [created, ...get().budgets], budgetApiAvailable: true, isLoading: false });
      return created;
    } catch (error) {
      if (isBudgetApiUnavailable(error)) {
        set({
          budgetApiAvailable: false,
          error: 'Budget API is not available yet. Please integrate /budgets endpoints.',
          isLoading: false,
        });
      } else {
        set({
          error: error.response?.data?.message || 'Failed to create budget',
          isLoading: false,
        });
      }
      throw error;
    }
  },

  updateBudget: async (id, payload) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await expenseService.updateBudget(id, payload);
      const currentBudgets = get().budgets;
      const existing = currentBudgets.find((budget) => String(budget.id) === String(id));
      const merged = updated ?? { ...existing, ...payload, id: existing?.id ?? id };

      const hasExisting = currentBudgets.some((budget) => String(budget.id) === String(id));
      const nextBudgets = hasExisting
        ? currentBudgets.map((budget) =>
            String(budget.id) === String(id) ? { ...budget, ...merged } : budget
          )
        : [merged, ...currentBudgets];

      set({ budgets: nextBudgets, isLoading: false });
      return merged;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to update budget',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteBudget: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await expenseService.deleteBudget(id);
      const stringId = String(id);
      set({
        budgets: get().budgets.filter((budget) => String(budget.id) !== stringId),
        expenses: get().expenses.map((expense) =>
          String(expense.budget_id) === stringId ? { ...expense, budget_id: null } : expense
        ),
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to delete budget',
        isLoading: false,
      });
      throw error;
    }
  },

  exportBudgetReport: async (budgetId, format = 'csv') => {
    set({ error: null });
    try {
      return await expenseService.exportBudgetReport(budgetId, format);
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to export budget report',
      });
      throw error;
    }
  },

  createExpense: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const created = await expenseService.createExpense(payload);
      set({ expenses: [created, ...get().expenses], isLoading: false });
      return created;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to create expense',
        isLoading: false,
      });
      throw error;
    }
  },

  updateExpense: async (id, payload) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await expenseService.updateExpense(id, payload);
      const currentExpenses = get().expenses;
      const existing = currentExpenses.find((expense) => String(expense.id) === String(id));
      const merged = updated ?? { ...existing, ...payload, id: existing?.id ?? id };

      const hasExisting = currentExpenses.some((expense) => String(expense.id) === String(id));
      const nextExpenses = hasExisting
        ? currentExpenses.map((expense) =>
            String(expense.id) === String(id) ? { ...expense, ...merged } : expense
          )
        : [merged, ...currentExpenses];

      set({ expenses: nextExpenses, isLoading: false });
      return merged;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to update expense',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteExpense: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await expenseService.deleteExpense(id);
      set({ expenses: get().expenses.filter((expense) => expense.id !== id), isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to delete expense',
        isLoading: false,
      });
      throw error;
    }
  },
}));
