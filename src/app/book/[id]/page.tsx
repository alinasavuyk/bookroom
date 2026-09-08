import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Book from '@/models/Book';
import Comment from '@/models/Comment';
import CommentsSection from '@/components/CommentsSection';
import SaveButton from '@/components/SaveButton';
import BookTabs from '@/components/BookTabs';
import { BookDetail } from '@/types/models';
import styles from './BookIdPage.module.css';

// cache() дедуплікує запит між generateMetadata і самим компонентом сторінки
const getBook = cache(async (id: string) => {
  await connectDB();
  try {
    return await Book.findById(id).populate('owner', 'name avatar rating').lean();
  } catch {
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) return { title: 'Книгу не знайдено' };

  const bookData = JSON.parse(JSON.stringify(book)) as BookDetail;
  const description = bookData.description || `${bookData.title} від ${bookData.author} на Bookroom`;

  return {
    title: `${bookData.title} — ${bookData.author}`,
    description,
    openGraph: {
      title: bookData.title,
      description,
      images: bookData.coverImage ? [{ url: bookData.coverImage }] : [],
    },
  };
}

const STATUS_LABEL: Record<BookDetail['status'], string> = {
  available: 'В наявності',
  reserved: 'Зарезервовано',
  sold: 'Продано',
};

const TYPE_LABEL: Record<BookDetail['type'], string> = {
  sale: 'Продаж',
  exchange: 'Тільки обмін',
  both: 'Продаж або обмін',
};

function renderStars(average: number) {
  const filled = Math.round(average);
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const book = await getBook(id);
  if (!book) notFound();

  const bookData = JSON.parse(JSON.stringify(book)) as BookDetail;
  const isOwner = session?.user?.id === bookData.owner._id;

  const ratingDocs = await Comment.find({ book: id }).select('rating').lean();
  const ratings = ratingDocs.map((c) => c.rating).filter((r): r is number => typeof r === 'number');
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  const reviewCount = ratingDocs.length;

  const overview = (
    <div className={styles.overview}>
      <div className={styles.coverWrap}>
        {bookData.coverImage ? (
          <Image
            src={bookData.coverImage}
            alt={bookData.title}
            fill
            sizes="14rem"
            className={styles.cover}
          />
        ) : (
          <span className={styles.noCover}>Без обкладинки</span>
        )}
        <SaveButton bookId={bookData._id} className={styles.saveButton} />
      </div>

      <div className={styles.meta}>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Автор</span>
          <span className={styles.metaValue}>{bookData.author}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Жанри</span>
          <span className={styles.metaValue}>{(bookData.genres ?? []).join(', ') || 'Не вказано'}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Формат</span>
          <span className={styles.metaValue}>{TYPE_LABEL[bookData.type]}</span>
        </div>

        {bookData.description && (
          <>
            <p className={styles.descriptionHeading}>Опис</p>
            <p className={styles.description}>{bookData.description}</p>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>{bookData.title}</h1>
        <span className={styles.statusBadge}>{STATUS_LABEL[bookData.status]}</span>
      </div>

      <div className={styles.ratingRow}>
        <span className={styles.stars}>{renderStars(avgRating)}</span>
        <span className={styles.reviewCount}>
          {reviewCount} {reviewCount === 1 ? 'рецензія' : 'рецензій'}
        </span>
      </div>

      <div className={styles.layout}>
        <div className={styles.main}>
          <BookTabs overview={overview} reviews={<CommentsSection bookId={bookData._id} />} />
        </div>

        <aside className={styles.sidebar}>
          <p className={styles.price}>{bookData.price > 0 ? `${bookData.price} грн` : 'Обмін'}</p>
          <p className={styles.availability}>{STATUS_LABEL[bookData.status]}</p>

          {!isOwner && (
            <Link href="/chat" className={styles.ctaButton}>
              Написати власнику
            </Link>
          )}

          <div className={styles.ownerCard}>
            {bookData.owner.avatar ? (
              <Image
                src={bookData.owner.avatar}
                alt={bookData.owner.name}
                width={36}
                height={36}
                className={styles.ownerAvatar}
              />
            ) : (
              <div className={styles.ownerAvatarPlaceholder}>
                {bookData.owner.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span>{bookData.owner.name}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
