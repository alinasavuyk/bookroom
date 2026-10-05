import Link from 'next/link';
import Image from 'next/image';
import { BookSummary } from '@/types/models';
import { TbStarFilled, TbMessageCircle } from '@/lib/icons';
import SaveButton from '../SaveButton';
import CartButton from '../CartButton';
import ExchangeOfferButton from '../ExchangeOfferButton';
import styles from './BookCard.module.css';

interface BookCardProps {
  book: BookSummary;
  initialSaved?: boolean;
  onToggleSaved?: (bookId: string, saved: boolean) => void;
}

export default function BookCard({ book, initialSaved = false, onToggleSaved }: BookCardProps) {
  const canBuy = book.status === 'available' && (book.type === 'sale' || book.type === 'both');
  const canExchange = book.status === 'available' && (book.type === 'exchange' || book.type === 'both');

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
        <div className={styles.actionStack}>
          <SaveButton bookId={book._id} initialSaved={initialSaved} onToggle={onToggleSaved} />
          {canBuy && <CartButton bookId={book._id} ownerId={book.owner?._id} />}
          {canExchange && (
            <ExchangeOfferButton bookId={book._id} bookTitle={book.title} owner={book.owner} />
          )}
        </div>
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
        {book.price > 0 ? (
          <p className={styles.price}>{book.price} ₴</p>
        ) : (
          <span className={styles.exchangeBadge}>Доступно до обміну</span>
        )}
      </div>
    </Link>
  );
}
