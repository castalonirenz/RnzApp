import { useCallback } from 'react';
import { useToastStore } from '@/store/toastStore';

export const useToast = () => {
  const showToast = useToastStore((state) => state.showToast);

  const toast = useCallback(
    (message, options = {}) => showToast({ message, ...options }),
    [showToast]
  );

  const success = useCallback(
    (message, options = {}) => showToast({ message, type: 'success', ...options }),
    [showToast]
  );

  const error = useCallback(
    (message, options = {}) => showToast({ message, type: 'error', ...options }),
    [showToast]
  );

  const warning = useCallback(
    (message, options = {}) => showToast({ message, type: 'warning', ...options }),
    [showToast]
  );

  const info = useCallback(
    (message, options = {}) => showToast({ message, type: 'info', ...options }),
    [showToast]
  );

  return {
    toast,
    success,
    error,
    warning,
    info,
  };
};
