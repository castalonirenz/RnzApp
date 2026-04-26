'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Alert from '@/components/Alert';
import Card from '@/components/Card';
import styles from './page.module.css';

function ResetPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const { resetPassword, isLoading, error } = useAuth();

  const [formData, setFormData] = useState({
    password: '',
    confirm_password: '',
  });
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!token) {
      setFormError('Reset token is missing. Please use the link from your email.');
      return;
    }

    if (!formData.password || !formData.confirm_password) {
      setFormError('Please fill in all fields.');
      return;
    }

    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setFormError('Passwords do not match.');
      return;
    }

    try {
      const response = await resetPassword({
        token,
        password: formData.password,
        confirm_password: formData.confirm_password,
      });

      setSuccessMessage(response?.message || 'Password has been reset successfully.');
      setTimeout(() => router.push('/login'), 1200);
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to reset password.');
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <h1>Reset Password</h1>
        <p className={styles.subtitle}>Set your new password to continue.</p>

        {(error || formError) && (
          <Alert type="error" onClose={() => setFormError('')}>
            {formError || error}
          </Alert>
        )}
        {successMessage && <Alert type="success">{successMessage}</Alert>}

        {!token && (
          <Alert type="warning">
            Reset token is missing. Open the reset link sent to your email.
          </Alert>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="New Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="********"
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            name="confirm_password"
            value={formData.confirm_password}
            onChange={handleChange}
            placeholder="********"
            required
          />

          <Button variant="primary" size="lg" disabled={isLoading || !token} type="submit">
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>

        <p className={styles.footer}>
          Back to <Link href="/login">Login</Link>
        </p>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className={styles.container}>Loading reset password page...</div>}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}

