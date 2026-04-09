'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import { useAuthStore } from '@/store/authStore';
import { useLoanStore } from '@/store/loanStore';
import { useExpenseStore } from '@/store/expenseStore';
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
  }, [pathname]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="My Borrower - Track and manage your loans" />
        <meta name="theme-color" content="#1e293b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MyBorrower" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <title>My Borrower - Loan Management</title>
      </head>
      <body>
        <Header />
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
