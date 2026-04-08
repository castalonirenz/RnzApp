'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Alert from '@/components/Alert';
import Card from '@/components/Card';
import styles from './page.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error } = useAuth();
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || !formData.email || !formData.password || !formData.password_confirmation) {
      setFormError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      setFormError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    try {
      await register(formData);
      router.push('/dashboard');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <h1>Create an Account</h1>
        <p className={styles.subtitle}>Join My Borrower to start managing your loans</p>

        {(error || formError) && (
          <Alert type="error" onClose={() => setFormError('')}>
            {formError || error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Full Name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            required
          />

          <Input
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            name="password_confirmation"
            value={formData.password_confirmation}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />

          <Button
            variant="primary"
            size="lg"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className={styles.footer}>
          Already have an account?{' '}
          <Link href="/login">Login here</Link>
        </p>
      </Card>
    </div>
  );
}
