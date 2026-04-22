'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import styles from './Header.module.css';

export default function Header() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

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
          <span className={styles.logoText}>My Lending Tracker</span>
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
              <li><Link href="/dashboard" className={styles.navLink} onClick={() => setIsOpen(false)}>Dashboard</Link></li>
              <li><Link href="/loans" className={styles.navLink} onClick={() => setIsOpen(false)}>My Lending</Link></li>
              <li><Link href="/expenses" className={styles.navLink} onClick={() => setIsOpen(false)}>Expenses</Link></li>
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
              <li><Link href="/login" className={styles.navLink} onClick={() => setIsOpen(false)}>Login</Link></li>
              <li><Link href="/register" className={`${styles.navLink} ${styles.registerLink}`} onClick={() => setIsOpen(false)}>Register</Link></li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
