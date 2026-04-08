import apiClient from '@/utils/api';

export const loanService = {
  getLoans: async () => {
    const response = await apiClient.get('/loans');
    return response.data;
  },

  getLoanById: async (id) => {
    const response = await apiClient.get(`/loans/${id}`);
    return response.data;
  },

  createLoan: async (loanData) => {
    const response = await apiClient.post('/loans', loanData);
    return response.data;
  },

  updateLoan: async (id, loanData) => {
    const response = await apiClient.put(`/loans/${id}`, loanData);
    return response.data;
  },

  updateLoanStatus: async (id, status) => {
    const response = await apiClient.patch(`/loans/${id}/status`, { status });
    return response.data;
  },

  deleteLoan: async (id) => {
    const response = await apiClient.delete(`/loans/${id}`);
    return response.data;
  },

  addPayment: async (loanId, amount) => {
    const response = await apiClient.post(`/loans/${loanId}/payments`, { amount });
    return response.data;
  },

  getLoanHistory: async (loanId) => {
    const response = await apiClient.get(`/loans/${loanId}/history`);
    return response.data;
  },
};
