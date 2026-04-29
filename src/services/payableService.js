import apiClient from '@/utils/api';

const DEFAULT_SUMMARY = {
  total_payables: 0,
  total_paid: 0,
  total_balance: 0,
  pending_count: 0,
  completed_count: 0,
};

const unwrap = (payload) => payload?.data ?? payload?.result ?? payload;

const toNumber = (value, fallback = 0) => {
  if (typeof value === 'string') {
    const normalized = value.replace(/,/g, '').trim();
    const number = Number(normalized);
    return Number.isFinite(number) ? number : fallback;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const normalizeStatus = (value, principal, paid) => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (normalized) return normalized;

  if (paid <= 0) return 'pending';
  if (paid >= principal) return 'completed';
  return 'partially_paid';
};

const normalizeFrequency = (value, isRecurring = false) => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';

  if (['once', 'monthly', 'quarterly', 'yearly'].includes(normalized)) {
    return normalized;
  }

  return isRecurring ? 'monthly' : 'once';
};

const normalizePaymentMethod = (value) => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (['cash', 'transfer', 'check', 'other'].includes(normalized)) return normalized;
  return 'other';
};

const normalizePayment = (payment) => ({
  ...payment,
  id: payment?.id ?? payment?._id,
  payable_id: payment?.payable_id ?? payment?.payableId,
  amount_paid: toNumber(payment?.amount_paid ?? payment?.amountPaid ?? payment?.amount, 0),
  payment_date:
    payment?.payment_date ??
    payment?.paymentDate ??
    payment?.paid_at ??
    payment?.paidAt ??
    payment?.created_at ??
    payment?.createdAt ??
    null,
  payment_method: normalizePaymentMethod(payment?.payment_method ?? payment?.paymentMethod),
  notes: payment?.notes ?? '',
  created_at: payment?.created_at ?? payment?.createdAt ?? null,
});

const normalizePayable = (payable) => {
  const principal = toNumber(payable?.principal_amount ?? payable?.principalAmount ?? payable?.amount, 0);
  const amountPaid = toNumber(payable?.amount_paid ?? payable?.amountPaid ?? payable?.paid_amount, 0);
  const balance =
    payable?.balance == null
      ? Math.max(principal - amountPaid, 0)
      : toNumber(payable?.balance, Math.max(principal - amountPaid, 0));
  const isRecurring = Boolean(payable?.is_recurring ?? payable?.isRecurring);

  return {
    ...payable,
    id: payable?.id ?? payable?._id,
    creditor_name: payable?.creditor_name ?? payable?.creditorName ?? 'Unknown Creditor',
    description: payable?.description ?? '',
    principal_amount: principal,
    amount_paid: amountPaid,
    balance,
    due_date: payable?.due_date ?? payable?.dueDate ?? null,
    is_recurring: isRecurring,
    recurrence_end_date: payable?.recurrence_end_date ?? payable?.recurrenceEndDate ?? null,
    frequency: normalizeFrequency(payable?.frequency, isRecurring),
    status: normalizeStatus(payable?.status, principal, amountPaid),
    created_at: payable?.created_at ?? payable?.createdAt ?? null,
    updated_at: payable?.updated_at ?? payable?.updatedAt ?? null,
    payments: Array.isArray(payable?.payments) ? payable.payments.map(normalizePayment) : [],
  };
};

const extractList = (payload, keys = []) => {
  const unwrapped = unwrap(payload);
  if (Array.isArray(unwrapped)) return unwrapped;

  for (const key of keys) {
    if (Array.isArray(unwrapped?.[key])) {
      return unwrapped[key];
    }
  }

  return [];
};

const normalizeSummary = (summary = {}) => ({
  total_payables: toNumber(summary?.total_payables, 0),
  total_paid: toNumber(summary?.total_paid, 0),
  total_balance: toNumber(summary?.total_balance, 0),
  pending_count: toNumber(summary?.pending_count, 0),
  completed_count: toNumber(summary?.completed_count, 0),
});

const mapPayableToApiPayload = (payable = {}) => {
  const principalAmount = toNumber(payable.principal_amount, NaN);
  const payload = {
    creditor_name: payable.creditor_name?.trim(),
    description: payable.description?.trim() || '',
    principal_amount: Number.isFinite(principalAmount) ? principalAmount : undefined,
    due_date: payable.due_date || undefined,
    is_recurring: Boolean(payable.is_recurring),
    frequency: normalizeFrequency(payable.frequency, Boolean(payable.is_recurring)),
    recurrence_end_date: payable.recurrence_end_date || undefined,
  };

  if (!payload.is_recurring) {
    payload.frequency = 'once';
    delete payload.recurrence_end_date;
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  return payload;
};

const mapPayablePatchToApiPayload = (payable = {}) => {
  const payload = { ...payable };

  if ('creditor_name' in payload && typeof payload.creditor_name === 'string') {
    payload.creditor_name = payload.creditor_name.trim();
  }

  if ('description' in payload && typeof payload.description === 'string') {
    payload.description = payload.description.trim();
  }

  if ('principal_amount' in payload) {
    const normalized = toNumber(payload.principal_amount, NaN);
    if (Number.isFinite(normalized)) {
      payload.principal_amount = normalized;
    } else {
      delete payload.principal_amount;
    }
  }

  if ('is_recurring' in payload) {
    payload.is_recurring = Boolean(payload.is_recurring);
    if (!payload.is_recurring) {
      payload.frequency = 'once';
      payload.recurrence_end_date = null;
    }
  }

  if ('frequency' in payload) {
    const isRecurring = 'is_recurring' in payload ? payload.is_recurring : true;
    payload.frequency = normalizeFrequency(payload.frequency, isRecurring);
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  return payload;
};

const mapPaymentToApiPayload = (payment = {}) => {
  const amountPaid = toNumber(payment.amount_paid, NaN);
  const payload = {
    amount_paid: Number.isFinite(amountPaid) ? amountPaid : undefined,
    payment_date: payment.payment_date || undefined,
    payment_method: normalizePaymentMethod(payment.payment_method),
    notes: typeof payment.notes === 'string' ? payment.notes.trim() : '',
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  return payload;
};

export const payableService = {
  getPayables: async (filters = {}) => {
    const params = {};

    if (filters?.status && filters.status !== 'all') {
      params.status = filters.status;
    }
    if (filters?.creditor_name) {
      params.creditor_name = filters.creditor_name;
    }
    if (filters?.sort_by) {
      params.sort_by = filters.sort_by;
    }

    const response = await apiClient.get('/payables', { params });
    const payload = unwrap(response.data);

    const payables = extractList(payload, ['payables', 'items', 'records']).map(normalizePayable);
    const summary = payload?.summary
      ? normalizeSummary(payload.summary)
      : {
          ...DEFAULT_SUMMARY,
          total_payables: payables.reduce((sum, item) => sum + item.principal_amount, 0),
          total_paid: payables.reduce((sum, item) => sum + item.amount_paid, 0),
          total_balance: payables.reduce((sum, item) => sum + item.balance, 0),
          pending_count: payables.filter((item) => item.status === 'pending').length,
          completed_count: payables.filter((item) => item.status === 'completed').length,
        };

    return { payables, summary };
  },

  getPayableById: async (id) => {
    const response = await apiClient.get(`/payables/${id}`);
    const payload = unwrap(response.data);
    const payable = payload?.payable ?? payload?.item ?? payload;
    return normalizePayable(payable);
  },

  createPayable: async (payable) => {
    const response = await apiClient.post('/payables', mapPayableToApiPayload(payable));
    const payload = unwrap(response.data);
    const created = payload?.payable ?? payload?.item ?? payload;
    return normalizePayable(created);
  },

  updatePayable: async (id, payable) => {
    const response = await apiClient.put(`/payables/${id}`, mapPayablePatchToApiPayload(payable));
    const payload = unwrap(response.data);
    const updated = payload?.payable ?? payload?.item ?? payload;
    return normalizePayable(updated);
  },

  recordPayment: async (id, payment) => {
    const response = await apiClient.post(`/payables/${id}/payment`, mapPaymentToApiPayload(payment));
    const payload = unwrap(response.data);
    const updated = payload?.payable ?? payload?.item ?? payload;
    return normalizePayable(updated);
  },

  getPaymentHistory: async (id) => {
    const response = await apiClient.get(`/payables/${id}/history`);
    const payload = unwrap(response.data);
    return extractList(payload, ['payments', 'history', 'items', 'records'])
      .map(normalizePayment)
      .sort((a, b) => new Date(b.payment_date || 0).getTime() - new Date(a.payment_date || 0).getTime());
  },

  deletePayable: async (id) => {
    const response = await apiClient.delete(`/payables/${id}`);
    return unwrap(response.data);
  },
};
