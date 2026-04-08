import apiClient from '@/utils/api';

const unwrapApiData = (payload) => {
  if (payload == null) return payload;

  // Common API envelope patterns:
  // { success: true, data: ... }, { data: { loans: [...] } }, { loans: [...] }
  return payload.data ?? payload.result ?? payload;
};

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeStatus = (status) => {
  return typeof status === 'string' ? status.toLowerCase() : status;
};

const toUiPercentRate = (apiRate) => {
  const n = toNumber(apiRate, 0);
  return n <= 1 ? n * 100 : n;
};

const toApiDecimalRate = (uiRate) => {
  const n = toNumber(uiRate, 0);
  return n > 1 ? n / 100 : n;
};

const toUiInterestPeriod = (interestType) => {
  return interestType === 'monthly' ? 'month' : (interestType || 'annum');
};

const toApiInterestType = (interestPeriod) => {
  return interestPeriod === 'month' ? 'monthly' : (interestPeriod || 'monthly');
};

const extractLoanList = (payload) => {
  const unwrapped = unwrapApiData(payload);

  if (Array.isArray(unwrapped)) return unwrapped;
  if (Array.isArray(unwrapped?.loans)) return unwrapped.loans;
  if (Array.isArray(unwrapped?.items)) return unwrapped.items;
  if (Array.isArray(unwrapped?.records)) return unwrapped.records;

  return [];
};

const normalizeLoanFromApi = (loan) => {
  if (!loan) return loan;

  const principal = toNumber(loan.principal, 0);
  const totalReceivable = toNumber(loan.total_receivable ?? loan.totalReceivable, 0);
  const totalPaid = toNumber(
    loan.total_payments ??
    loan.totalPayments ??
    loan.total_paid ??
    loan.totalPaid,
    0
  );
  const durationMonths = Math.trunc(toNumber(loan.duration_months ?? loan.durationMonths, 0));
  const interestRate = toUiPercentRate(loan.interest_rate ?? loan.interestRate);
  const interestPeriod = toUiInterestPeriod(loan.interest_period ?? loan.interestType);
  const status = normalizeStatus(loan.status);

  return {
    ...loan,
    id: loan.id ?? loan._id,
    userId: loan.userId ?? loan.user_id,
    borrower_name: loan.borrower_name ?? loan.borrowerName,
    principal,
    interest_rate: interestRate,
    interest_period: interestPeriod,
    duration_months: durationMonths,
    total_receivable: totalReceivable,
    total_payments: totalPaid,
    remaining_balance: toNumber(loan.remaining_balance ?? loan.remainingBalance, totalReceivable - totalPaid),
    status,
    created_at: loan.created_at ?? loan.createdAt,
  };
};

const mapLoanToApiPayload = (loanData) => ({
  // API_README.md contract
  borrowerName: loanData.borrower_name,
  principal: toNumber(loanData.principal, 0),
  interestRate: toApiDecimalRate(loanData.interest_rate),
  interestType: toApiInterestType(loanData.interest_period),
  durationMonths: loanData.duration_months,
});

const mapStatusToApi = (status) => {
  if (!status || typeof status !== 'string') return status;
  const normalized = status.toLowerCase();
  if (normalized === 'pending') return 'Pending';
  if (normalized === 'ongoing') return 'Ongoing';
  if (normalized === 'completed') return 'Completed';
  return status;
};

export const loanService = {
  getLoans: async () => {
    const response = await apiClient.get('/loans');
    const loans = extractLoanList(response.data);
    return loans.map(normalizeLoanFromApi);
  },

  getLoanById: async (id) => {
    const response = await apiClient.get(`/loans/${id}`);
    const payload = unwrapApiData(response.data);
    const loan = payload?.loan ?? payload;
    return normalizeLoanFromApi(loan);
  },

  createLoan: async (loanData) => {
    const payload = mapLoanToApiPayload(loanData);
    const response = await apiClient.post('/loans', payload);
    const data = unwrapApiData(response.data);
    const loan = data?.loan ?? data;
    return normalizeLoanFromApi(loan);
  },

  updateLoan: async (id, loanData) => {
    const payload = mapLoanToApiPayload(loanData);
    const response = await apiClient.put(`/loans/${id}`, payload);
    const data = unwrapApiData(response.data);
    const loan = data?.loan ?? data;
    return normalizeLoanFromApi(loan);
  },

  updateLoanStatus: async (id, status) => {
    const response = await apiClient.patch(`/loans/${id}/status`, {
      status: mapStatusToApi(status),
    });
    const data = unwrapApiData(response.data);
    const loan = data?.loan ?? data;
    return normalizeLoanFromApi(loan);
  },

  deleteLoan: async (id) => {
    const response = await apiClient.delete(`/loans/${id}`);
    return response.data;
  },

  addPayment: async (loanId, amount) => {
    const response = await apiClient.post(`/loans/${loanId}/payments`, { amount });
    const data = unwrapApiData(response.data);
    const loan = data?.loan ?? data;
    return normalizeLoanFromApi(loan);
  },

  getLoanHistory: async (loanId) => {
    const response = await apiClient.get(`/loans/${loanId}/history`);
    return response.data;
  },
};
