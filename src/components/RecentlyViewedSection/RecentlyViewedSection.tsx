'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import BookCarousel from '@/components/BookCarousel';
import { fetchBooksByIds } from '@/lib/api-client';
import { getRecentlyViewedIds } from '@/lib/recentlyViewed';
import styles from './RecentlyViewedSection.module.css';

interface RecentlyViewedSectionProps {
  savedIds: Set<string>;
}

// Клієнтський компонент: читає нещодавно переглянуті книги з localStorage,
// тому не може бути частиною серверної головної сторінки
export default function RecentlyViewedSection({ savedIds }: RecentlyViewedSectionProps) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(getRecentlyViewedIds());
  }, []);

  const { data } = useQuery({
    queryKey: ['books', 'recently-viewed', ids],
    queryFn: () => fetchBooksByIds(ids),
    enabled: ids.length > 0,
  });

  if (ids.length === 0 || !data || data.length === 0) return null;

  const books = [...data].sort((a, b) => ids.indexOf(a._id) - ids.indexOf(b._id));

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Нещодавно переглянуті</h2>
      <BookCarousel books={books} savedIds={savedIds} />
    </section>
  );
}
