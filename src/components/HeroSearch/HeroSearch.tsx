'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { TbSearch } from '@/lib/icons';
import styles from './HeroSearch.module.css';

export default function HeroSearch() {
  const [value, setValue] = useState('');
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (value.trim()) params.set('search', value.trim());
    router.push(`/catalog${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <TbSearch className={styles.icon} />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Пошук книг, авторів, жанрів..."
        className={styles.input}
      />
    </form>
  );
}
