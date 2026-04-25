export const receiptService = {
  extractAmountFromImage: async (file) => {
    const formData = new FormData();
    formData.append('receipt', file);

    const response = await fetch('/api/receipts/extract-amount', {
      method: 'POST',
      body: formData,
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = payload?.message || 'Receipt extraction failed.';
      const details = payload?.details ? ` ${payload.details}` : '';
      throw new Error(`${message}${details}`);
    }

    return {
      amount: payload?.amount ?? null,
      currency: payload?.currency || 'UNKNOWN',
      note: payload?.note || '',
      model: payload?.model || '',
    };
  },
};
