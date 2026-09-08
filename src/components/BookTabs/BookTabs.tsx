'use client';
import { useState, ReactNode } from 'react';
import styles from './BookTabs.module.css';

interface BookTabsProps {
  overview: ReactNode;
  reviews: ReactNode;
}

export default function BookTabs({ overview, reviews }: BookTabsProps) {
  const [tab, setTab] = useState<'overview' | 'reviews'>('overview');

  return (
    <div>
      <div className={styles.tabs}>
        <button
          type="button"
          onClick={() => setTab('overview')}
          className={tab === 'overview' ? styles.tabActive : styles.tab}
        >
          Опис
        </button>
        <button
          type="button"
          onClick={() => setTab('reviews')}
          className={tab === 'reviews' ? styles.tabActive : styles.tab}
        >
          Рецензії
        </button>
      </div>
      <div>{tab === 'overview' ? overview : reviews}</div>
    </div>
  );
}
