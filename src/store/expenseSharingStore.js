import { create } from 'zustand';
import { expenseSharingService } from '@/services/expenseSharingService';

export const useExpenseSharingStore = create((set, get) => ({
  // State
  sharedExpenses: [],
  summary: null,
  settlementReport: null,
  isLoading: false,
  error: null,

  // Clear error
  clearError: () => set({ error: null }),

  // Set error
  setError: (error) => set({ error }),

  /**
   * Fetch all shared expenses
   */
  fetchSharedExpenses: async () => {
    set({ isLoading: true, error: null });
    try {
      const sharedExpenses = await expenseSharingService.getSharedExpenses();
      set({ sharedExpenses, isLoading: false });
      return sharedExpenses;
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || 'Failed to fetch shared expenses';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Fetch a specific shared expense
   */
  fetchSharedExpenseById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const expense = await expenseSharingService.getSharedExpenseById(id);
      set({ isLoading: false });
      return expense;
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || `Failed to fetch shared expense ${id}`;
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Create a new shared expense
   */
  createSharedExpense: async (expenseData) => {
    set({ isLoading: true, error: null });
    try {
      const newExpense = await expenseSharingService.createSharedExpense(
        expenseData
      );

      // Update the list optimistically
      set((state) => ({
        sharedExpenses: [newExpense, ...state.sharedExpenses],
        isLoading: false,
      }));

      return newExpense;
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || 'Failed to create shared expense';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Update an existing shared expense
   */
  updateSharedExpense: async (id, expenseData) => {
    set({ isLoading: true, error: null });
    try {
      const updatedExpense = await expenseSharingService.updateSharedExpense(
        id,
        expenseData
      );

      // Update the list optimistically
      set((state) => ({
        sharedExpenses: state.sharedExpenses.map((exp) =>
          exp.id === id ? updatedExpense : exp
        ),
        isLoading: false,
      }));

      return updatedExpense;
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || 'Failed to update shared expense';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Delete a shared expense
   */
  deleteSharedExpense: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await expenseSharingService.deleteSharedExpense(id);

      // Update the list optimistically
      set((state) => ({
        sharedExpenses: state.sharedExpenses.filter((exp) => exp.id !== id),
        isLoading: false,
      }));

      return { success: true, id };
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || 'Failed to delete shared expense';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Fetch shared expense summary
   */
  fetchSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const summary = await expenseSharingService.getSharedExpenseSummary();
      set({ summary, isLoading: false });
      return summary;
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        'Failed to fetch shared expense summary';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Fetch settlement report
   */
  fetchSettlementReport: async () => {
    set({ isLoading: true, error: null });
    try {
      const settlementReport = await expenseSharingService.getSettlementReport();
      set({ settlementReport, isLoading: false });
      return settlementReport;
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || 'Failed to fetch settlement report';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Export shared expenses
   */
  exportExpenses: async (format = 'csv') => {
    set({ isLoading: true, error: null });
    try {
      const data = await expenseSharingService.exportSharedExpenses(format);
      set({ isLoading: false });

      // Trigger download
      if (format === 'pdf') {
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `shared-expenses-${Date.now()}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      } else {
        const link = document.createElement('a');
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', `shared-expenses-${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      }

      return { success: true, format };
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || `Failed to export as ${format}`;
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
}));
