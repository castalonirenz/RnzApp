'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Alert from '@/components/Alert';
import Card from '@/components/Card';
import styles from './page.module.css';

export default function ForgotPasswordPage() {
  const { forgotPassword, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!email.trim()) {
      setFormError('Email is required.');
      return;
    }

    try {
      const response = await forgotPassword(email.trim());
      setSuccessMessage(
        response?.message ||
          'If an account with that email exists, a password reset link has been sent.'
      );
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to request reset link.');
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <h1>Forgot Password</h1>
        <p className={styles.subtitle}>
          Enter your email and we&apos;ll send reset instructions.
        </p>

        {(error || formError) && (
          <Alert type="error" onClose={() => setFormError('')}>
            {formError || error}
          </Alert>
        )}

        {successMessage && <Alert type="success">{successMessage}</Alert>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Email Address"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />

          <Button variant="primary" size="lg" disabled={isLoading} type="submit">
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>

        <p className={styles.footer}>
          Remembered your password? <Link href="/login">Back to login</Link>
        </p>
      </Card>
    </div>
  );
}

