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
  // UI always captures rates as percentages (e.g. 5, 0.79), while
  // API expects decimal form (e.g. 0.05, 0.0079).
  return n / 100;
};

const toUiInterestPeriod = (interestType) => {
  return interestType === 'monthly' ? 'month' : (interestType || 'annum');
};

const toApiInterestType = (interestPeriod) => {
  return interestPeriod === 'month' ? 'month' : (interestPeriod || 'annum');
};

const extractLoanList = (payload) => {
  const unwrapped = unwrapApiData(payload);

  if (Array.isArray(unwrapped)) return unwrapped;
  if (Array.isArray(unwrapped?.loans)) return unwrapped.loans;
  if (Array.isArray(unwrapped?.items)) return unwrapped.items;
  if (Array.isArray(unwrapped?.records)) return unwrapped.records;

  return [];
};

const extractHistoryList = (payload) => {
  const unwrapped = unwrapApiData(payload);

  if (Array.isArray(unwrapped)) return unwrapped;
  if (Array.isArray(unwrapped?.history)) return unwrapped.history;
  if (Array.isArray(unwrapped?.items)) return unwrapped.items;
  if (Array.isArray(unwrapped?.records)) return unwrapped.records;
  if (Array.isArray(unwrapped?.payments)) {
    return unwrapped.payments.map((payment) => ({
      ...payment,
      action: payment.action || 'payment',
      details: payment.details || 'Payment recorded',
      amount_paid: payment.amount_paid ?? payment.amountPaid ?? payment.amount,
      created_at: payment.created_at ?? payment.createdAt ?? payment.paid_at ?? payment.paidAt,
    }));
  }

  return [];
};

const normalizeHistoryEntry = (entry, index) => ({
  ...entry,
  id: entry.id ?? entry._id ?? `${entry.created_at ?? entry.createdAt ?? 'history'}-${index}`,
  action: (entry.action ?? entry.type ?? 'payment').toString().toLowerCase(),
  details: entry.details ?? entry.note ?? entry.description ?? '',
  amount_paid:
    entry.amount_paid ??
    entry.amountPaid ??
    entry.payment_amount ??
    entry.paymentAmount ??
    entry.amount ??
    null,
  balance_after: entry.balance_after ?? entry.balanceAfter ?? null,
  created_at:
    entry.created_at ??
    entry.createdAt ??
    entry.paid_at ??
    entry.paidAt ??
    entry.date ??
    null,
});

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
    borrower_contact:
      loan.borrower_contact ??
      loan.borrowerContact ??
      loan.borrower_phone ??
      loan.borrowerPhone ??
      loan.contact_number ??
      loan.contactNumber ??
      loan.phone_number ??
      loan.phoneNumber ??
      loan.phone ??
      loan.contact ??
      loan.borrower?.contact ??
      loan.borrower?.contact_number ??
      loan.borrower?.contactNumber ??
      loan.borrower?.phone ??
      '',
    borrower_address:
      loan.borrower_address ??
      loan.borrowerAddress ??
      loan.address ??
      loan.location ??
      loan.borrower?.address ??
      '',
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
  // Primary (camelCase) contract
  borrowerName: loanData.borrower_name,
  borrowerContact: loanData.borrower_contact || null,
  borrowerAddress: loanData.borrower_address || null,
  borrowerPhone: loanData.borrower_contact || null,
  borrower_phone: loanData.borrower_contact || null,
  contactNumber: loanData.borrower_contact || null,
  contact_number: loanData.borrower_contact || null,
  phoneNumber: loanData.borrower_contact || null,
  phone_number: loanData.borrower_contact || null,
  phone: loanData.borrower_contact || null,
  contact: loanData.borrower_contact || null,
  address: loanData.borrower_address || null,
  principal: toNumber(loanData.principal, 0),
  interestRate: toApiDecimalRate(loanData.interest_rate),
  interestType: loanData.interest_period === 'month' ? 'monthly' : (loanData.interest_period || 'annum'),
  durationMonths: Math.trunc(toNumber(loanData.duration_months, 0)),
  totalReceivable: toNumber(loanData.total_receivable, 0),

  // Compatibility (snake_case) contract
  borrower_name: loanData.borrower_name,
  borrower_contact: loanData.borrower_contact || null,
  borrower_address: loanData.borrower_address || null,
  interest_rate: toApiDecimalRate(loanData.interest_rate),
  interest_period: toApiInterestType(loanData.interest_period),
  duration_months: Math.trunc(toNumber(loanData.duration_months, 0)),
  total_receivable: toNumber(loanData.total_receivable, 0),
});

const mapStatusToApi = (status) => {
  if (!status || typeof status !== 'string') return status;
  const normalized = status.toLowerCase();
  if (normalized === 'pending') return 'pending';
  if (normalized === 'ongoing') return 'ongoing';
  if (normalized === 'completed') return 'completed';
  return normalized;
};

export const loanService = {
  getLoans: async (filters = {}) => {
    const params = {};
    const status = mapStatusToApi(filters.status);

    if (status && status !== 'all') {
      params.status = status;
    }

    const response = await apiClient.get('/loans', { params });
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

  updateLoanStatus: async (id, status, releaseDate) => {
    const response = await apiClient.patch(`/loans/${id}/status`, {
      status: mapStatusToApi(status),
      releaseDate: releaseDate
    });
    const data = unwrapApiData(response.data);
    const loan = data?.loan ?? data;
    return normalizeLoanFromApi(loan);
  },

  deleteLoan: async (id) => {
    const response = await apiClient.delete(`/loans/${id}`);
    return response.data;
  },

  addPayment: async (loanId, amount, paidAt) => {
    const response = await apiClient.post(`/loans/${loanId}/payments`, {
      amount,
      paid_at: paidAt || undefined,
    });
    const data = unwrapApiData(response.data);
    const loan = data?.loan ?? data;
    return normalizeLoanFromApi(loan);
  },

  getLoanHistory: async (loanId) => {
    const response = await apiClient.get(`/loans/${loanId}/history`);
    const rows = extractHistoryList(response.data);
    return rows
      .map(normalizeHistoryEntry)
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  },
};
