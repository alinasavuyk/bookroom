'use client';
import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import BookCard from '@/components/BookCard';
import { BookSummary } from '@/types/models';
import { TbChevronLeft, TbChevronRight } from '@/lib/icons';
import styles from './BookCarousel.module.css';

interface BookCarouselProps {
  books: BookSummary[];
  savedIds: Set<string>;
  badge?: string;
}

export default function BookCarousel({ books, savedIds, badge }: BookCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start' });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  if (books.length === 0) return null;

  return (
    <div className={styles.wrap}>
      <div className={styles.viewport} ref={emblaRef}>
        <ul className={styles.container}>
          {books.map((book) => (
            <li className={styles.slide} key={book._id}>
              {badge && <span className={styles.badge}>{badge}</span>}
              <BookCard book={book} initialSaved={savedIds.has(book._id)} />
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        className={`${styles.arrow} ${styles.arrowPrev}`}
        onClick={() => emblaApi?.scrollPrev()}
        disabled={!canScrollPrev}
        aria-label="Попередні книги"
      >
        <TbChevronLeft />
      </button>
      <button
        type="button"
        className={`${styles.arrow} ${styles.arrowNext}`}
        onClick={() => emblaApi?.scrollNext()}
        disabled={!canScrollNext}
        aria-label="Наступні книги"
      >
        <TbChevronRight />
      </button>
    </div>
  );
}
