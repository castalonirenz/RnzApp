'use client';

import Header from '@/components/Header';
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="My Borrower - Track and manage your loans" />
        <title>My Borrower - Loan Management</title>
      </head>
      <body>
        <Header />
        <main className="main-content">
          {children}
        </main>
        <footer className="footer">
          <p>&copy; 2026 My Borrower. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
