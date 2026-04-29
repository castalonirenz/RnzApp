'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePayables } from '@/hooks/usePayables';
import { useToast } from '@/hooks/useToast';
import PaymentModal from '@/components/PaymentModal';
import styles from './page.module.css';

export default function PayablePaymentPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const payableId = params?.id ? String(params.id) : '';
  const { token, isAuthChecked } = useAuth();
  const { currentPayable, isLoading, fetchPayableById, recordPayment } = usePayables();

  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const closeModal = () => {
    router.push(`/payables/${payableId}`);
  };

  useEffect(() => {
    if (!isAuthChecked) return;
    if (!token) {
      router.push('/login');
      return;
    }

    let mounted = true;
    const bootstrap = async () => {
      try {
        await fetchPayableById(payableId);
      } finally {
        if (mounted) setIsBootstrapping(false);
      }
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [isAuthChecked, token, payableId, router, fetchPayableById]);

  const handleSubmit = async (payload) => {
    try {
      await recordPayment(payableId, payload);
      toast.success('Payment recorded successfully.');
      router.push(`/payables/${payableId}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to record payable payment.');
    }
  };

  if (!isAuthChecked) {
    return <div className={styles.container}>Loading payment page...</div>;
  }
  if (!token) return null;
  if (isBootstrapping) {
    return <div className={styles.container}>Loading payment page...</div>;
  }

  return (
    <div className={styles.container}>
      <PaymentModal
        payable={currentPayable}
        isOpen
        isLoading={isLoading}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
