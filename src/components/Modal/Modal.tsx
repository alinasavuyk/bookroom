'use client';
import { ReactNode, useEffect, useState, MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export default function Modal({ onClose, children, className }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const stopPropagation = (e: MouseEvent<HTMLDivElement>) => e.stopPropagation();

  // Рендеримо через портал у document.body — інакше, якщо модалку відкрити
  // з кнопки всередині каруселі (embla ставить transform на свій контейнер
  // для анімації), position: fixed бекдропу прив'яжеться до цього
  // трансформованого предка замість усього екрана
  if (!mounted) return null;

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={`${styles.dialog} ${className ?? ''}`}
        role="dialog"
        aria-modal="true"
        onClick={stopPropagation}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
