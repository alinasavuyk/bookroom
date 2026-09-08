'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import styles from './ErrorPage.module.css';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Щось пішло не так</h1>
      <p className={styles.text}>Сталася непередбачена помилка. Спробуй ще раз.</p>
      <div className={styles.actions}>
        <button type="button" onClick={() => reset()} className={styles.button}>
          Спробувати ще раз
        </button>
        <Link href="/" className={styles.link}>
          На головну
        </Link>
      </div>
    </div>
  );
}
