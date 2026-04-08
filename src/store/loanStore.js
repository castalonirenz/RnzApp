import { create } from 'zustand';
import { loanService } from '@/services/loanService';

export const useLoanStore = create((set, get) => ({
  loans: [],
  currentLoan: null,
  isLoading: false,
  error: null,

  setLoans: (loans) => set({ loans }),
  setCurrentLoan: (loan) => set({ currentLoan: loan }),
  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),

  fetchLoans: async () => {
    set({ isLoading: true, error: null });
    try {
      const loans = await loanService.getLoans();
      set({ loans, isLoading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch loans',
        isLoading: false 
      });
    }
  },

  fetchLoanById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const loan = await loanService.getLoanById(id);
      set({ currentLoan: loan, isLoading: false });
      return loan;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch loan',
        isLoading: false 
      });
    }
  },

  createLoan: async (loanData) => {
    set({ isLoading: true, error: null });
    try {
      const newLoan = await loanService.createLoan(loanData);
      const loans = get().loans;
      set({ loans: [...loans, newLoan], isLoading: false });
      return newLoan;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to create loan',
        isLoading: false 
      });
      throw error;
    }
  },

  updateLoan: async (id, loanData) => {
    set({ isLoading: true, error: null });
    try {
      const updatedLoan = await loanService.updateLoan(id, loanData);
      const loans = get().loans.map(l => l.id === id ? updatedLoan : l);
      set({ loans, currentLoan: updatedLoan, isLoading: false });
      return updatedLoan;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to update loan',
        isLoading: false 
      });
      throw error;
    }
  },

  deleteLoan: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await loanService.deleteLoan(id);
      const loans = get().loans.filter(l => l.id !== id);
      set({ loans, currentLoan: null, isLoading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to delete loan',
        isLoading: false 
      });
      throw error;
    }
  },

  addPayment: async (loanId, amount) => {
    set({ isLoading: true, error: null });
    try {
      const updatedLoan = await loanService.addPayment(loanId, amount);
      const loans = get().loans.map(l => l.id === loanId ? updatedLoan : l);
      set({ loans, currentLoan: updatedLoan, isLoading: false });
      return updatedLoan;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to add payment',
        isLoading: false 
      });
      throw error;
    }
  },
}));
