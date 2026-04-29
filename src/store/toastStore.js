import { create } from 'zustand';

const DEFAULT_DURATION = 3500;

const makeToastId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const useToastStore = create((set, get) => ({
  toasts: [],

  showToast: ({ type = 'info', message = '', duration = DEFAULT_DURATION } = {}) => {
    if (!message) return '';

    const id = makeToastId();
    const toast = { id, type, message };

    set((state) => ({
      toasts: [...state.toasts, toast],
    }));

    if (duration > 0 && typeof window !== 'undefined') {
      window.setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }

    return id;
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),

  clearToasts: () => set({ toasts: [] }),
}));
