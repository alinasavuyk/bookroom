import Link from 'next/link';
import Image from 'next/image';
import { BookSummary } from '@/types/models';
import { TbStarFilled, TbMessageCircle } from '@/lib/icons';
import SaveButton from '../SaveButton';
import styles from './BookCard.module.css';

interface BookCardProps {
  book: BookSummary;
  initialSaved?: boolean;
  onToggleSaved?: (bookId: string, saved: boolean) => void;
}

export default function BookCard({ book, initialSaved = false, onToggleSaved }: BookCardProps) {
  return (
    <Link href={`/book/${book._id}`} className={styles.card}>
      <div className={styles.coverWrap}>
        {book.coverImage ? (
          <Image
            src={book.coverImage}
            alt={book.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1440px) 33vw, 25vw"
            className={styles.cover}
          />
        ) : (
          <span className={styles.noCover}>Без обкладинки</span>
        )}
        <SaveButton
          bookId={book._id}
          initialSaved={initialSaved}
          onToggle={onToggleSaved}
          className={styles.saveButton}
        />
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>{book.title}</h3>
        {!!book.reviewCount && (
          <div className={styles.ratingRow}>
            <TbStarFilled className={styles.starIcon} />
            <span>{book.avgRating?.toFixed(1)}</span>
            <TbMessageCircle className={styles.commentIcon} />
            <span>{book.reviewCount}</span>
          </div>
        )}
        <p className={styles.author}>{book.author}</p>
        <p className={styles.price}>
          {book.price > 0 ? `${book.price} грн` : 'Обмін'}
        </p>
      </div>
    </Link>
  );
}
