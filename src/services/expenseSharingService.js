import apiClient from '@/utils/api';

const baseUrl = '/expenses/shared';

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toParticipantNames = (participants) => {
  if (!Array.isArray(participants)) return [];
  return participants
    .map((participant) => {
      if (typeof participant === 'string') return participant.trim();
      if (participant && typeof participant === 'object') {
        return String(participant.name ?? participant.participant ?? '').trim();
      }
      return '';
    })
    .filter(Boolean);
};

const toParticipantShares = (expense, fallbackNames = []) => {
  const fromParticipantShares = Array.isArray(expense?.participant_shares)
    ? expense.participant_shares
        .map((item) => {
          const name = String(item?.name ?? item?.participant ?? '').trim();
          const amount = toNumber(item?.amount ?? item?.share_amount, NaN);
          if (!name || !Number.isFinite(amount)) return null;
          return { name, amount };
        })
        .filter(Boolean)
    : [];

  if (fromParticipantShares.length > 0) return fromParticipantShares;

  // Some backends may return participants as objects with share fields.
  if (Array.isArray(expense?.participants)) {
    const fromParticipantsObject = expense.participants
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const name = String(item?.name ?? item?.participant ?? '').trim();
        const amount = toNumber(item?.amount ?? item?.share_amount ?? item?.share, NaN);
        if (!name || !Number.isFinite(amount)) return null;
        return { name, amount };
      })
      .filter(Boolean);

    if (fromParticipantsObject.length > 0) return fromParticipantsObject;
  }

  // Fallback for equal split when only names are provided.
  const total = toNumber(expense?.amount, 0);
  const names = fallbackNames;
  if (!names.length) return [];
  const equalAmount = toNumber((total / names.length).toFixed(2), 0);
  return names.map((name) => ({ name, amount: equalAmount }));
};

const buildPayload = (expenseData = {}) => {
  const participants = Array.isArray(expenseData.participants)
    ? expenseData.participants.map((p) => String(p).trim()).filter(Boolean)
    : expenseData.participants?.split(',').map((p) => p.trim()).filter(Boolean) || [];

  const splitMode = expenseData.split_mode === 'custom' ? 'custom' : 'equal';

  const participantShares = Array.isArray(expenseData.participant_shares)
    ? expenseData.participant_shares
        .map((item) => ({
          name: String(item?.name ?? '').trim(),
          amount: toNumber(item?.amount, NaN),
        }))
        .filter((item) => item.name && Number.isFinite(item.amount))
    : [];

  return {
    title: expenseData.title,
    amount: toNumber(expenseData.amount, 0),
    description: expenseData.description || '',
    participants,
    split_mode: splitMode,
    participant_shares: participantShares,
  };
};

const normalizeSharedExpense = (expense) => ({
  ...expense,
  id: expense?.id ?? expense?._id,
  title: expense?.title ?? 'Shared Expense',
  amount: toNumber(expense?.amount, 0),
  description: expense?.description ?? '',
  participants: toParticipantNames(
    Array.isArray(expense?.participants)
      ? expense.participants
      : expense?.participants?.split(',').map((p) => p.trim()) || []
  ),
  split_mode: expense?.split_mode === 'custom' ? 'custom' : 'equal',
  participant_shares: toParticipantShares(
    expense,
    toParticipantNames(
      Array.isArray(expense?.participants)
        ? expense.participants
        : expense?.participants?.split(',').map((p) => p.trim()) || []
    )
  ),
  share_per_person: toNumber(
    expense?.share_per_person,
    toNumber(expense?.amount, 0) /
      Math.max(
        toParticipantNames(
          Array.isArray(expense?.participants)
            ? expense.participants
            : expense?.participants?.split(',').map((p) => p.trim()) || []
        ).length,
        1
      )
  ),
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
      const payload = buildPayload(expenseData);

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
      const payload = buildPayload(expenseData);

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
