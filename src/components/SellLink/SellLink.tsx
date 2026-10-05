'use client';
import { useState, MouseEvent, ReactNode } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Modal from '@/components/Modal';
import styles from './SellLink.module.css';

interface SellLinkProps {
  className?: string;
  children: ReactNode;
  onNavigate?: () => void;
}

// Спільна логіка для будь-якого посилання на "Продати книгу": гостю замість
// переходу на форму (з якої його все одно відкине) одразу пропонує
// зареєструватись або увійти
export default function SellLink({ className, children, onNavigate }: SellLinkProps) {
  const { status } = useSession();
  const [showModal, setShowModal] = useState(false);

  const handleClick = (e: MouseEvent) => {
    if (status !== 'authenticated') {
      e.preventDefault();
      setShowModal(true);
    } else {
      onNavigate?.();
    }
  };

  return (
    <>
      <Link href="/sell" onClick={handleClick} className={className}>
        {children}
      </Link>

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <h2 className={styles.modalTitle}>Потрібно увійти</h2>
          <p className={styles.modalText}>
            Щоб продати книгу, зареєструйся або увійди в акаунт.
          </p>
          <div className={styles.modalActions}>
            <Link
              href="/auth/register"
              onClick={() => setShowModal(false)}
              className={styles.modalPrimaryButton}
            >
              Зареєструватися
            </Link>
            <Link
              href="/auth/signin"
              onClick={() => setShowModal(false)}
              className={styles.modalSecondaryButton}
            >
              Увійти
            </Link>
          </div>
        </Modal>
      )}
    </>
  );
}
