'use client';
import { useEffect } from 'react';
import { addRecentlyViewed } from '@/lib/recentlyViewed';

// Невидимий компонент — лише фіксує перегляд книги в localStorage
export default function RecentlyViewedTracker({ bookId }: { bookId: string }) {
  useEffect(() => {
    addRecentlyViewed(bookId);
  }, [bookId]);

  return null;
}
