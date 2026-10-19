import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Book from '@/models/Book';
import Comment from '@/models/Comment';
import User from '@/models/User';
import CommentsSection from '@/components/CommentsSection';
import BookGallery from '@/components/BookGallery';
import BookCard from '@/components/BookCard';
import CartButton from '@/components/CartButton';
import ExchangeOfferButton from '@/components/ExchangeOfferButton';
import BookTabs from '@/components/BookTabs';
import RecentlyViewedTracker from '@/components/RecentlyViewedTracker';
import { getRatingsMap } from '@/lib/ratings';
import { TbEye, TbHeart } from '@/lib/icons';
import { BookDetail, BookSummary } from '@/types/models';
import styles from './BookIdPage.module.css';
import gridStyles from '@/styles/BookGrid.module.css';

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
      images:
        bookData.images && bookData.images.length > 0
          ? bookData.images.map((url) => ({ url }))
          : bookData.coverImage
            ? [{ url: bookData.coverImage }]
            : [],
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
  const session = await auth();
  const book = await getBook(id);
  if (!book) notFound();

  const bookData = JSON.parse(JSON.stringify(book)) as BookDetail;
  const isOwner = session?.user?.id === bookData.owner._id;

  // Рахуємо перегляди лише чужі — власник, що відкриває своє оголошення,
  // не повинен накручувати собі статистику
  let savesCount = 0;
  if (!isOwner) {
    await Book.findByIdAndUpdate(id, { $inc: { views: 1 } });
  } else {
    savesCount = await User.countDocuments({ savedBooks: id });
  }

  const canBuy =
    !isOwner &&
    bookData.status === 'available' &&
    (bookData.type === 'sale' || bookData.type === 'both') &&
    bookData.price > 0;
  const canExchange = !isOwner && bookData.status === 'available';

  const ratingDocs = await Comment.find({ book: id }).select('rating').lean();
  const ratings = ratingDocs.map((c) => c.rating).filter((r): r is number => typeof r === 'number');
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  const reviewCount = ratingDocs.length;

  // "Схожі книги" — інші доступні книги з хоча б одним спільним жанром
  const similarBooksRaw = await Book.find({
    _id: { $ne: id },
    genres: { $in: bookData.genres },
    status: 'available',
  })
    .populate('owner', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(4)
    .lean();
  const similarRatingsMap = await getRatingsMap(similarBooksRaw.map((b) => b._id));
  const similarBooks = JSON.parse(
    JSON.stringify(
      similarBooksRaw.map((b) => ({
        ...b,
        avgRating: similarRatingsMap.get(b._id.toString())?.avgRating ?? 0,
        reviewCount: similarRatingsMap.get(b._id.toString())?.reviewCount ?? 0,
      }))
    )
  ) as BookSummary[];

  const galleryImages =
    bookData.images && bookData.images.length > 0
      ? bookData.images
      : bookData.coverImage
        ? [bookData.coverImage]
        : [];

  const overview = (
    <div className={styles.overview}>
      <div className={styles.overviewTop}>
        <BookGallery bookId={bookData._id} images={galleryImages} title={bookData.title} />

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
        </div>
      </div>

      {bookData.description && (
        <div>
          <p className={styles.descriptionHeading}>Опис</p>
          <p className={styles.description}>{bookData.description}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.page}>
      <RecentlyViewedTracker bookId={bookData._id} />

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
          <p className={styles.price}>{bookData.price > 0 ? `${bookData.price} ₴` : 'Обмін'}</p>
          <p className={styles.availability}>{STATUS_LABEL[bookData.status]}</p>

          {canBuy && (
            <CartButton bookId={bookData._id} ownerId={bookData.owner._id} className={styles.ctaButton}>
              Додати в кошик
            </CartButton>
          )}

          {canExchange && (
            <ExchangeOfferButton
              bookId={bookData._id}
              bookTitle={bookData.title}
              owner={bookData.owner}
              className={styles.ctaButtonOutline}
            >
              Запропонувати обмін
            </ExchangeOfferButton>
          )}

          {!isOwner && (
            <Link
              href={`/chat?with=${bookData.owner._id}&book=${bookData._id}`}
              className={styles.ctaButtonOutline}
            >
              Написати власнику
            </Link>
          )}

          {isOwner && (
            <>
              <Link href={`/book/${bookData._id}/edit`} className={styles.ctaButtonOutline}>
                Редагувати оголошення
              </Link>

              <div className={styles.statsRow}>
                <span className={styles.statItem}>
                  <TbEye /> {bookData.views ?? 0} переглядів
                </span>
                <span className={styles.statItem}>
                  <TbHeart /> {savesCount} збережень
                </span>
              </div>
            </>
          )}

          <Link href={`/users/${bookData.owner._id}`} className={styles.ownerCard}>
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
          </Link>
        </aside>
      </div>

      {similarBooks.length > 0 && (
        <div className={styles.similarSection}>
          <h2 className={styles.similarHeading}>Схожі книги</h2>
          <ul className={gridStyles.grid}>
            {similarBooks.map((book) => (
              <li key={book._id}>
                <BookCard book={book} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
