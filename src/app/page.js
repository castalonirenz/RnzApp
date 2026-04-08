'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/Button';
import Card from '@/components/Card';
import styles from './page.module.css';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className={styles.hero}>
      <div className={styles.heroContent}>
        <h1 className={styles.title}>Welcome to My Borrower</h1>
        <p className={styles.subtitle}>
          Manage your loans and track payments with ease
        </p>

        {user ? (
          <div className={styles.actions}>
            <Link href="/dashboard">
              <Button variant="primary" size="lg">
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/loans">
              <Button variant="secondary" size="lg">
                View My Loans
              </Button>
            </Link>
          </div>
        ) : (
          <div className={styles.actions}>
            <Link href="/register">
              <Button variant="primary" size="lg">
                Get Started
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg">
                Login
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className={styles.features}>
        <h2>Why Choose My Borrower?</h2>
        <div className={styles.featureGrid}>
          <Card>
            <div className={styles.featureCard}>
              <span className={styles.featureIcon}>📊</span>
              <h3>Easy Tracking</h3>
              <p>Keep track of all your loans in one place with clear payment progress.</p>
            </div>
          </Card>

          <Card>
            <div className={styles.featureCard}>
              <span className={styles.featureIcon}>💰</span>
              <h3>Interest Calculation</h3>
              <p>Automatic interest calculation and remaining balance tracking.</p>
            </div>
          </Card>

          <Card>
            <div className={styles.featureCard}>
              <span className={styles.featureIcon}>📱</span>
              <h3>Mobile Friendly</h3>
              <p>Access your loans from any device with our responsive design.</p>
            </div>
          </Card>

          <Card>
            <div className={styles.featureCard}>
              <span className={styles.featureIcon}>🔒</span>
              <h3>Secure</h3>
              <p>Your data is encrypted and stored securely with industry-standard protection.</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
