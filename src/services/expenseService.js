import apiClient from '@/utils/api';

const unwrap = (payload) => payload?.data ?? payload;

export const expenseService = {
  getExpenses: async () => {
    const response = await apiClient.get('/expenses');
    const data = unwrap(response.data);
    return Array.isArray(data) ? data : [];
  },

  createExpense: async (expense) => {
    const response = await apiClient.post('/expenses', expense);
    return unwrap(response.data);
  },

  deleteExpense: async (id) => {
    const response = await apiClient.delete(`/expenses/${id}`);
    return unwrap(response.data);
  },

  getSummary: async (period = 'daily') => {
    const response = await apiClient.get('/expenses/summary', {
      params: { period },
    });
    const data = unwrap(response.data);
    return Array.isArray(data) ? data : [];
  },
};
