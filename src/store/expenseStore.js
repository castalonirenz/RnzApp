import { create } from 'zustand';
import { expenseService } from '@/services/expenseService';

export const useExpenseStore = create((set, get) => ({
  expenses: [],
  summary: [],
  period: 'daily',
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
