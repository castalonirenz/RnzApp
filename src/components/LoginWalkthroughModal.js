'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/Button';
import styles from './LoginWalkthroughModal.module.css';

const buildSessionKey = (token) => {
  if (!token) return '';
  const tail = token.slice(-16);
  return `rnz_walkthrough_seen_${tail}`;
};

const WALKTHROUGH_ITEMS = [
  {
    title: 'Dashboard',
    detail: 'View totals, outstanding balances, and quick snapshots of your activity.',
  },
  {
    title: 'My Lending',
    detail: 'Create loans, track statuses, and record payments with history.',
  },
  {
    title: 'Expenses',
    detail: 'Add expenses, assign budgets, and monitor usage against limits.',
  },
  {
    title: 'Shared Expenses',
    detail: 'Split costs with participants and export reports when needed.',
  }
  ,
  // {
  //   title: 'Receipt Amount Assist',
  //   detail: 'Upload a receipt image and auto-fill expense amount using local Ollama.',
  // },
];

export default function LoginWalkthroughModal() {
  const { token, isAuthChecked } = useAuth();
  const [dismissedKey, setDismissedKey] = useState('');

  const sessionKey = useMemo(() => buildSessionKey(token), [token]);

  const isOpen = useMemo(() => {
    if (!isAuthChecked || !token || !sessionKey || dismissedKey === sessionKey) {
      return false;
    }
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(sessionKey) !== '1';
  }, [isAuthChecked, token, sessionKey, dismissedKey]);

  const handleClose = () => {
    if (sessionKey && typeof window !== 'undefined') {
      sessionStorage.setItem(sessionKey, '1');
    }
    setDismissedKey(sessionKey);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={handleClose}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="walkthrough-title" onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 id="walkthrough-title">Welcome to RNZ</h2>
          <p>This quick guide appears once each login session.</p>
        </div>

        <div className={styles.body}>
          {WALKTHROUGH_ITEMS.map((item) => (
            <div className={styles.item} key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <Button type="button" variant="primary" onClick={handleClose}>
            Got It
          </Button>
        </div>
      </div>
    </div>
  );
}
