'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import styles from './Header.module.css';

export default function Header() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActiveRoute = (href) => {
    if (!pathname) return false;
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
      router.replace('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>$</span>
          <span className={styles.logoText}>My Personal Tracker</span>
        </Link>

        <button
          type="button"
          className={styles.menuToggle}
          aria-expanded={isOpen}
          aria-label="Toggle navigation menu"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {isOpen ? 'Close' : 'Menu'}
        </button>

        {token ? (
          <nav className={`${styles.nav} ${isOpen ? styles.navOpen : ''}`}>
            <ul className={styles.navList}>
              <li>
                <Link
                  href="/dashboard"
                  className={`${styles.navLink} ${isActiveRoute('/dashboard') ? styles.navLinkActive : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/loans"
                  className={`${styles.navLink} ${isActiveRoute('/loans') ? styles.navLinkActive : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  My Lending
                </Link>
              </li>
              <li>
                <Link
                  href="/expenses"
                  className={`${styles.navLink} ${isActiveRoute('/expenses') ? styles.navLinkActive : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  Expenses
                </Link>
              </li>
              <li>
                <Link
                  href="/expenses/shared"
                  className={`${styles.navLink} ${isActiveRoute('/expenses/shared') ? styles.navLinkActive : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  Shared Expenses
                </Link>
              </li>
              <li className={styles.userMenu}>
                <span className={styles.userName}>{user?.name || user?.email || 'My Account'}</span>
                <button onClick={handleLogout} className={styles.logoutBtn}>
                  Logout
                </button>
              </li>
            </ul>
          </nav>
        ) : (
          <nav className={`${styles.nav} ${isOpen ? styles.navOpen : ''}`}>
            <ul className={styles.navList}>
              <li>
                <Link
                  href="/login"
                  className={`${styles.navLink} ${isActiveRoute('/login') ? styles.navLinkActive : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className={`${styles.navLink} ${styles.registerLink} ${isActiveRoute('/register') ? styles.navLinkActive : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  Register
                </Link>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
