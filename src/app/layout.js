'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import LoginWalkthroughModal from '@/components/LoginWalkthroughModal';
import ToastContainer from '@/components/ToastContainer';
import { useAuthStore } from '@/store/authStore';
import { useLoanStore } from '@/store/loanStore';
import { useExpenseStore } from '@/store/expenseStore';
import { usePayableStore } from '@/store/payableStore';
import './globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap/dist/js/bootstrap.bundle.min.js';
export default function RootLayout({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }
  }, []);

  useEffect(() => {
    useAuthStore.getState().setError(null);
    useLoanStore.getState().setError(null);
    useExpenseStore.getState().setError(null);
    usePayableStore.getState().setError(null);
  }, [pathname]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="RNZ - Manage lending, expenses, and shared costs" />
        <meta name="theme-color" content="#1e293b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="RNZ" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon/rnz_favicon_32x32.png" />
        <link rel="icon" type="image/png" sizes="64x64" href="/icon/rnz_favicon_64x64.png" />
        <link rel="icon" type="image/svg+xml" href="/icon/rnz_favicon.svg" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon/rnz_favicon_180x180.png" />
        <title>RNZ</title>
      </head>
      <body>
        <Header />
        <LoginWalkthroughModal />
        <ToastContainer />
        <main className="main-content">
          {children}
        </main>
        <footer className="footer">
          <p>&copy; 2026 Renz Castaloni. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
