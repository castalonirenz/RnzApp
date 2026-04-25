import apiClient from '@/utils/api';

const baseUrl = '/expenses/shared';

const normalizeSharedExpense = (expense) => ({
  ...expense,
  id: expense?.id ?? expense?._id,
  title: expense?.title ?? 'Shared Expense',
  amount: Number(expense?.amount) || 0,
  description: expense?.description ?? '',
  participants: Array.isArray(expense?.participants)
    ? expense.participants
    : expense?.participants?.split(',').map((p) => p.trim()) || [],
  share_per_person: Number(expense?.share_per_person) || 0,
  created_by: expense?.created_by ?? null,
  created_at: expense?.created_at ?? expense?.date ?? null,
  updated_at: expense?.updated_at ?? null,
});

export const expenseSharingService = {
  /**
   * Get all shared expenses for the current user
   */
  getSharedExpenses: async () => {
    try {
      const response = await apiClient.get(baseUrl);
      const expenses = Array.isArray(response?.data)
        ? response.data
        : response?.data?.data || response?.data?.result || [];
      return expenses.map(normalizeSharedExpense);
    } catch (error) {
      console.error('Failed to fetch shared expenses:', error);
      throw error;
    }
  },

  /**
   * Get a specific shared expense by ID
   */
  getSharedExpenseById: async (id) => {
    try {
      const response = await apiClient.get(`${baseUrl}/${id}`);
      const expense = response?.data?.data ?? response?.data;
      return normalizeSharedExpense(expense);
    } catch (error) {
      console.error(`Failed to fetch shared expense ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new shared expense
   * @param {Object} expenseData - { title, amount, description, participants }
   * participants can be an array or comma-separated string
   */
  createSharedExpense: async (expenseData) => {
    try {
      const payload = {
        title: expenseData.title,
        amount: Number(expenseData.amount),
        description: expenseData.description || '',
        participants: Array.isArray(expenseData.participants)
          ? expenseData.participants
          : expenseData.participants?.split(',').map((p) => p.trim()) || [],
      };

      const response = await apiClient.post(baseUrl, payload);
      const expense = response?.data?.data ?? response?.data;
      return normalizeSharedExpense(expense);
    } catch (error) {
      console.error('Failed to create shared expense:', error);
      throw error;
    }
  },

  /**
   * Update an existing shared expense
   */
  updateSharedExpense: async (id, expenseData) => {
    try {
      const payload = {
        title: expenseData.title,
        amount: Number(expenseData.amount),
        description: expenseData.description || '',
        participants: Array.isArray(expenseData.participants)
          ? expenseData.participants
          : expenseData.participants?.split(',').map((p) => p.trim()) || [],
      };

      const response = await apiClient.put(`${baseUrl}/${id}`, payload);
      const expense = response?.data?.data ?? response?.data;
      return normalizeSharedExpense(expense);
    } catch (error) {
      console.error(`Failed to update shared expense ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a shared expense
   */
  deleteSharedExpense: async (id) => {
    try {
      await apiClient.delete(`${baseUrl}/${id}`);
      return { success: true, id };
    } catch (error) {
      console.error(`Failed to delete shared expense ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get expense summary (total, breakdown by participant)
   */
  getSharedExpenseSummary: async () => {
    try {
      const response = await apiClient.get(`${baseUrl}/summary`);
      return response?.data?.data ?? response?.data;
    } catch (error) {
      console.error('Failed to fetch shared expense summary:', error);
      throw error;
    }
  },

  /**
   * Export shared expenses to CSV or PDF
   * @param {string} format - 'csv' or 'pdf'
   */
  exportSharedExpenses: async (format = 'csv') => {
    try {
      const response = await apiClient.get(`${baseUrl}/export`, {
        params: { format },
        responseType: format === 'pdf' ? 'blob' : 'text',
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to export shared expenses as ${format}:`, error);
      throw error;
    }
  },

  /**
   * Get settlement report (who owes who)
   */
  getSettlementReport: async () => {
    try {
      const response = await apiClient.get(`${baseUrl}/settlement`);
      return response?.data?.data ?? response?.data;
    } catch (error) {
      console.error('Failed to fetch settlement report:', error);
      throw error;
    }
  },
};
