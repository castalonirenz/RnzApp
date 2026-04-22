import apiClient from '@/utils/api';

const unwrap = (payload) => payload?.data ?? payload?.result ?? payload;

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
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

const normalizeExpense = (expense) => ({
  ...expense,
  id: expense?.id ?? expense?._id,
  title: expense?.title ?? expense?.name ?? expense?.category ?? 'Expense',
  amount: toNumber(expense?.amount, 0),
  category: expense?.category ?? null,
  notes: expense?.notes ?? null,
  expense_date: expense?.expense_date ?? expense?.date ?? expense?.created_at ?? null,
  budget_id: expense?.budget_id ?? expense?.budgetId ?? null,
});

const normalizeBudget = (budget) => ({
  ...budget,
  id: budget?.id ?? budget?._id,
  name: budget?.name ?? 'Untitled Budget',
  amount_limit: toNumber(budget?.amount_limit ?? budget?.limit, 0),
  period_type: budget?.period_type ?? budget?.period ?? 'monthly',
  start_date: budget?.start_date ?? budget?.startDate ?? null,
  end_date: budget?.end_date ?? budget?.endDate ?? null,
  total_spent: budget?.total_spent == null ? null : toNumber(budget?.total_spent, 0),
  remaining_balance:
    budget?.remaining_balance == null ? null : toNumber(budget?.remaining_balance, 0),
});

const normalizeSummary = (item) => ({
  period: item?.period ?? item?.label ?? '',
  total: toNumber(item?.total ?? item?.amount, 0),
});

const normalizeBudgetIdForApi = (value) => {
  if (value === null) return null;
  if (value == null) return undefined;

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  const text = String(value).trim();
  if (!text) return undefined;
  if (/^\d+$/.test(text)) return Number(text);
  return text;
};

const mapExpenseToApiPayload = (expense = {}) => {
  const payload = { ...expense };

  if ('budget_id' in payload) {
    const normalizedBudgetId = normalizeBudgetIdForApi(payload.budget_id);
    if (normalizedBudgetId == null) {
      delete payload.budget_id;
    } else {
      payload.budget_id = normalizedBudgetId;
    }
  }

  return payload;
};

const mapExpensePatchToApiPayload = (expense = {}) => {
  const payload = { ...expense };

  if ('budget_id' in payload) {
    const normalizedBudgetId = normalizeBudgetIdForApi(payload.budget_id);
    if (normalizedBudgetId === undefined) {
      delete payload.budget_id;
    } else {
      payload.budget_id = normalizedBudgetId;
    }
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  return payload;
};

const mapBudgetToApiPayload = (budget = {}) => ({
  name: budget.name,
  amount_limit: toNumber(budget.amount_limit, 0),
  period_type: budget.period_type || 'monthly',
});

const mapBudgetPatchToApiPayload = (budget = {}) => {
  const payload = { ...budget };

  if ('amount_limit' in payload) {
    payload.amount_limit = toNumber(payload.amount_limit, NaN);
    if (!Number.isFinite(payload.amount_limit)) {
      delete payload.amount_limit;
    }
  }

  if ('name' in payload && payload.name == null) {
    delete payload.name;
  }

  if ('period_type' in payload && !payload.period_type) {
    delete payload.period_type;
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  return payload;
};

const parseFilenameFromHeader = (contentDisposition) => {
  if (!contentDisposition) return null;

  const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1]).replace(/['"]/g, '');
  }

  const simpleMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  return simpleMatch?.[1] ? simpleMatch[1].replace(/['"]/g, '') : null;
};

export const expenseService = {
  getExpenses: async () => {
    const response = await apiClient.get('/expenses');
    return extractList(response.data, ['expenses', 'items']).map(normalizeExpense);
  },

  createExpense: async (expense) => {
    const response = await apiClient.post('/expenses', mapExpenseToApiPayload(expense));
    const payload = unwrap(response.data);
    const created = payload?.expense ?? payload;
    return normalizeExpense(created);
  },

  updateExpense: async (id, expense) => {
    const response = await apiClient.patch(`/expenses/${id}`, mapExpensePatchToApiPayload(expense));
    const payload = unwrap(response.data);
    const updated = payload?.expense ?? payload?.item ?? payload;

    if (updated && typeof updated === 'object' && !Array.isArray(updated)) {
      return normalizeExpense(updated);
    }

    return null;
  },

  deleteExpense: async (id) => {
    const response = await apiClient.delete(`/expenses/${id}`);
    return unwrap(response.data);
  },

  getSummary: async (period = 'daily') => {
    const response = await apiClient.get('/expenses/summary', {
      params: { period },
    });
    return extractList(response.data, ['summary', 'totals']).map(normalizeSummary);
  },

  getBudgets: async () => {
    const response = await apiClient.get('/budgets');
    return extractList(response.data, ['budgets', 'items']).map(normalizeBudget);
  },

  createBudget: async (budget) => {
    const response = await apiClient.post('/budgets', mapBudgetToApiPayload(budget));
    const payload = unwrap(response.data);
    const created = payload?.budget ?? payload;
    return normalizeBudget(created);
  },

  updateBudget: async (id, budget) => {
    const response = await apiClient.patch(`/budgets/${id}`, mapBudgetPatchToApiPayload(budget));
    const payload = unwrap(response.data);
    const updated = payload?.budget ?? payload?.item ?? payload;

    if (updated && typeof updated === 'object' && !Array.isArray(updated)) {
      return normalizeBudget(updated);
    }

    return null;
  },

  deleteBudget: async (id) => {
    const response = await apiClient.delete(`/budgets/${id}`);
    return unwrap(response?.data);
  },

  exportBudgetReport: async (budgetId, format = 'csv') => {
    const response = await apiClient.get(`/budgets/${budgetId}/export`, {
      params: { format },
      responseType: 'blob',
    });

    return {
      blob: response.data,
      filename: parseFilenameFromHeader(response.headers?.['content-disposition']),
    };
  },
};
