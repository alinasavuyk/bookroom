'use client';
import Link from 'next/link';
import { useState, MouseEvent } from 'react';
import { useSession } from 'next-auth/react';
import { BookSummary } from '@/types/models';
import { TbHeart, TbHeartFilled } from '@/lib/icons';
import styles from './BookCard.module.css';

interface BookCardProps {
  book: BookSummary;
  initialSaved?: boolean;
  onToggleSaved?: (bookId: string, saved: boolean) => void;
}

export default function BookCard({ book, initialSaved = false, onToggleSaved }: BookCardProps) {
  const { data: session, status } = useSession();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);

  const toggleSaved = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session?.user?.id || pending) return;

    const nextSaved = !saved;
    setSaved(nextSaved);
    setPending(true);

    await fetch(`/api/users/${session.user.id}/saved-books`, {
      method: nextSaved ? 'POST' : 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId: book._id }),
    });

    setPending(false);
    onToggleSaved?.(book._id, nextSaved);
  };

  return (
    <Link href={`/book/${book._id}`} className={styles.card}>
      <div className={styles.coverWrap}>
        {book.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={book.coverImage} alt={book.title} className={styles.cover} />
        ) : (
          <span className={styles.noCover}>Без обкладинки</span>
        )}
        {status === 'authenticated' && (
          <button
            type="button"
            onClick={toggleSaved}
            disabled={pending}
            className={styles.saveButton}
            aria-label={saved ? 'Прибрати зі збережених' : 'Зберегти книгу'}
          >
            {saved ? <TbHeartFilled /> : <TbHeart />}
          </button>
        )}
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>{book.title}</h3>
        <p className={styles.author}>{book.author}</p>
        <p className={styles.price}>
          {book.price > 0 ? `${book.price} грн` : 'Обмін'}
        </p>
      </div>
    </Link>
  );
}
