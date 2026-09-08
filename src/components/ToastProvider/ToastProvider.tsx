'use client';
import { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react';
import styles from './ToastProvider.module.css';

type ToastType = 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast має використовуватись всередині ToastProvider');
  return ctx;
}

const DISPLAY_MS = 4000;

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, DISPLAY_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ul className={styles.stack}>
        {toasts.map((toast) => (
          <li
            key={toast.id}
            className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : ''}`}
            role="status"
          >
            {toast.message}
          </li>
        ))}
      </ul>
    </ToastContext.Provider>
  );
}
