import { create } from 'zustand';
import { payableService } from '@/services/payableService';

const DEFAULT_SUMMARY = {
  total_payables: 0,
  total_paid: 0,
  total_balance: 0,
  pending_count: 0,
  completed_count: 0,
  upcoming_due_count: 0,
  overdue_count: 0,
};

const isPayableApiUnavailable = (error) => {
  const status = error?.response?.status;
  return status === 404 || status === 405 || status === 501;
};

const normalizeDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const summarizePayables = (payables) => ({
  total_payables: payables.reduce((sum, item) => sum + Number(item.principal_amount || 0), 0),
  total_paid: payables.reduce((sum, item) => sum + Number(item.amount_paid || 0), 0),
  total_balance: payables.reduce((sum, item) => sum + Number(item.balance || 0), 0),
  pending_count: payables.filter((item) => item.status === 'pending').length,
  completed_count: payables.filter((item) => item.status === 'completed').length,
});

const enrichSummary = (summary, payables) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const next7Days = new Date(now);
  next7Days.setDate(next7Days.getDate() + 7);

  const dueItems = payables.filter((item) => item.status !== 'completed');

  const upcoming = dueItems.filter((item) => {
    const dueDate = normalizeDate(item.due_date);
    return dueDate && dueDate >= now && dueDate <= next7Days;
  }).length;

  const overdue = dueItems.filter((item) => {
    const dueDate = normalizeDate(item.due_date);
    return dueDate && dueDate < now;
  }).length;

  const computedSummary = summarizePayables(payables);

  return {
    ...DEFAULT_SUMMARY,
    ...computedSummary,
    ...summary,
    upcoming_due_count: upcoming,
    overdue_count: overdue,
  };
};

export const usePayableStore = create((set, get) => ({
  payables: [],
  summary: DEFAULT_SUMMARY,
  currentPayable: null,
  paymentHistory: [],
  filters: {
    status: 'all',
    creditor_name: '',
    sort_by: 'due_date',
  },
  payableApiAvailable: true,
  isLoading: false,
  error: null,

  setError: (error) => set({ error }),
  setFilters: (filters) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...filters,
      },
    })),
  clearCurrentPayable: () => set({ currentPayable: null, paymentHistory: [] }),

  fetchPayables: async (filters = {}) => {
    set({ isLoading: true, error: null });
    const mergedFilters = { ...get().filters, ...filters };

    try {
      const { payables, summary } = await payableService.getPayables(mergedFilters);
      set({
        payables,
        summary: enrichSummary(summary, payables),
        filters: mergedFilters,
        payableApiAvailable: true,
        isLoading: false,
      });
      return payables;
    } catch (error) {
      if (isPayableApiUnavailable(error)) {
        set({
          payables: [],
          summary: DEFAULT_SUMMARY,
          payableApiAvailable: false,
          isLoading: false,
        });
        return [];
      }

      set({
        error: error?.response?.data?.message || 'Failed to fetch payables',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchPayableById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const payable = await payableService.getPayableById(id);
      set({
        currentPayable: payable,
        paymentHistory: Array.isArray(payable.payments) ? payable.payments : [],
        isLoading: false,
      });
      return payable;
    } catch (error) {
      set({
        error: error?.response?.data?.message || 'Failed to fetch payable details',
        isLoading: false,
      });
      throw error;
    }
  },

  createPayable: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const created = await payableService.createPayable(payload);
      const nextPayables = [created, ...get().payables];
      set({
        payables: nextPayables,
        summary: enrichSummary(null, nextPayables),
        isLoading: false,
      });
      return created;
    } catch (error) {
      set({
        error: error?.response?.data?.message || 'Failed to create payable',
        isLoading: false,
      });
      throw error;
    }
  },

  updatePayable: async (id, payload) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await payableService.updatePayable(id, payload);
      const nextPayables = get().payables.map((item) =>
        String(item.id) === String(id) ? updated : item
      );
      set({
        payables: nextPayables,
        currentPayable:
          get().currentPayable && String(get().currentPayable.id) === String(id)
            ? updated
            : get().currentPayable,
        summary: enrichSummary(null, nextPayables),
        isLoading: false,
      });
      return updated;
    } catch (error) {
      set({
        error: error?.response?.data?.message || 'Failed to update payable',
        isLoading: false,
      });
      throw error;
    }
  },

  recordPayment: async (id, payload) => {
    set({ isLoading: true, error: null });
    try {
      const updatedPayable = await payableService.recordPayment(id, payload);
      const nextPayables = get().payables.map((item) =>
        String(item.id) === String(id) ? updatedPayable : item
      );
      const nextHistory = await payableService.getPaymentHistory(id);

      set({
        payables: nextPayables,
        currentPayable:
          get().currentPayable && String(get().currentPayable.id) === String(id)
            ? updatedPayable
            : get().currentPayable,
        paymentHistory: nextHistory,
        summary: enrichSummary(null, nextPayables),
        isLoading: false,
      });
      return updatedPayable;
    } catch (error) {
      set({
        error: error?.response?.data?.message || 'Failed to record payable payment',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchPaymentHistory: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const payments = await payableService.getPaymentHistory(id);
      set({ paymentHistory: payments, isLoading: false });
      return payments;
    } catch (error) {
      set({
        error: error?.response?.data?.message || 'Failed to fetch payment history',
        isLoading: false,
      });
      throw error;
    }
  },

  deletePayable: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await payableService.deletePayable(id);
      const nextPayables = get().payables.filter((item) => String(item.id) !== String(id));

      set({
        payables: nextPayables,
        currentPayable:
          get().currentPayable && String(get().currentPayable.id) === String(id)
            ? null
            : get().currentPayable,
        paymentHistory:
          get().currentPayable && String(get().currentPayable.id) === String(id)
            ? []
            : get().paymentHistory,
        summary: enrichSummary(null, nextPayables),
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error?.response?.data?.message || 'Failed to delete payable',
        isLoading: false,
      });
      throw error;
    }
  },
}));
