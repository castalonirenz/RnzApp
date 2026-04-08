import { useEffect } from 'react';
import { useLoanStore } from '@/store/loanStore';

export const useLoans = () => {
  const { 
    loans, 
    currentLoan, 
    isLoading, 
    error, 
    fetchLoans, 
    fetchLoanById,
    createLoan,
    updateLoan,
    updateLoanStatus,
    deleteLoan,
    addPayment,
    setCurrentLoan,
  } = useLoanStore();

  return {
    loans,
    currentLoan,
    isLoading,
    error,
    fetchLoans,
    fetchLoanById,
    createLoan,
    updateLoan,
    updateLoanStatus,
    deleteLoan,
    addPayment,
    setCurrentLoan,
  };
};
