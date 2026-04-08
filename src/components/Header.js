'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import styles from './Header.module.css';

export default function Header() {
  const { user, token, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>💰</span>
          <span className={styles.logoText}>My Lending Tracker</span>
        </Link>

        {token ? (
          <nav className={styles.nav}>
            <ul className={styles.navList}>
              <li><Link href="/dashboard" className={styles.navLink}>Dashboard</Link></li>
              <li><Link href="/loans" className={styles.navLink}>My Lending</Link></li>
              <li className={styles.userMenu}>
                <span className={styles.userName}>{user?.name || user?.email || 'My Account'}</span>
                <button onClick={handleLogout} className={styles.logoutBtn}>
                  Logout
                </button>
              </li>
            </ul>
          </nav>
        ) : (
          <nav className={styles.nav}>
            <ul className={styles.navList}>
              <li><Link href="/login" className={styles.navLink}>Login</Link></li>
              <li><Link href="/register" className={styles.navLink + ' ' + styles.registerLink}>Register</Link></li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
