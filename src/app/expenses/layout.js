'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './layout.module.css';

const NAV_ITEMS = [
  { href: '/expenses', label: 'Overview' },
  { href: '/expenses/list', label: 'Expense List' },
  { href: '/expenses/add', label: 'Add Expense' },
  { href: '/expenses/budgets', label: 'Budget' },
];

const isItemActive = (pathname, href) => {
  if (href === '/expenses') return pathname === '/expenses';
  return pathname === href || pathname.startsWith(`${href}/`);
};

export default function ExpensesLayout({ children }) {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const activeLabel = useMemo(() => {
    const activeItem = NAV_ITEMS.find((item) => isItemActive(pathname, item.href));
    return activeItem?.label || 'Expenses';
  }, [pathname]);

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h3>Expense Menu</h3>
          <p>Track, budget, and export</p>
        </div>
        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${isItemActive(pathname, item.href) ? styles.navLinkActive : ''}`}
              onClick={() => setIsDrawerOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <section className={styles.content}>
        <div className={styles.mobileBar}>
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open expense menu"
          >
            Menu
          </button>
          <span className={styles.mobileTitle}>{activeLabel}</span>
        </div>

        {isDrawerOpen && (
          <>
            <button
              type="button"
              className={styles.overlay}
              onClick={() => setIsDrawerOpen(false)}
              aria-label="Close expense menu"
            />
            <aside className={styles.drawer}>
              <div className={styles.drawerHeader}>
                <h3>Expense Menu</h3>
                <button
                  type="button"
                  className={styles.closeButton}
                  onClick={() => setIsDrawerOpen(false)}
                  aria-label="Close expense menu"
                >
                  Close
                </button>
              </div>
              <nav className={styles.drawerNav}>
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.navLink} ${isItemActive(pathname, item.href) ? styles.navLinkActive : ''}`}
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </aside>
          </>
        )}

        <div className={styles.page}>{children}</div>
      </section>
    </div>
  );
}
