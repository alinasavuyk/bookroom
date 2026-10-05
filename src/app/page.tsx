import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Book from '@/models/Book';
import User from '@/models/User';
import BookCarousel from '@/components/BookCarousel';
import HeroSearch from '@/components/HeroSearch';
import { getRatingsMap } from '@/lib/ratings';
import { BookSummary } from '@/types/models';
import styles from './HomePage.module.css';

// Сторінка залежить від БД і сесії користувача — не можна генерувати статично під час білда
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Головна',
  description: 'Знаходь книги на продаж чи обмін від інших читачів на Bookroom',
};

export default async function HomePage() {
  await connectDB();
  const session = await auth();

  const [availableBooks, currentUser] = await Promise.all([
    Book.find({ status: 'available' }).populate('owner', 'name avatar').sort({ createdAt: -1 }).lean(),
    session?.user?.id ? User.findById(session.user.id).select('savedBooks').lean() : null,
  ]);

  const savedIds = new Set((currentUser?.savedBooks ?? []).map((id) => id.toString()));
  const ratingsMap = await getRatingsMap(availableBooks.map((b) => b._id));

  const withRatings = availableBooks.map((b) => {
    const rating = ratingsMap.get(b._id.toString());
    return {
      ...(JSON.parse(JSON.stringify(b)) as BookSummary),
      avgRating: rating?.avgRating ?? 0,
      reviewCount: rating?.reviewCount ?? 0,
    };
  });

  const recentBooks = withRatings.slice(0, 10);
  const exchangeBooks = withRatings.filter((b) => b.type === 'exchange' || b.type === 'both').slice(0, 10);
  const topRatedBooks = [...withRatings].sort((a, b) => b.avgRating - a.avgRating).slice(0, 10);

  return (
    <div>
      <section id="hero" className={styles.hero}>
        <HeroSearch />

        <h1 className={styles.title}>
          Ласкаво просимо до Bookroom
        </h1>
        <p className={styles.subtitle}>
          Діліться книгами, читайте рецензії інших і знаходьте нових друзів-читачів
        </p>
        <div className={styles.heroActions}>
          <Link href="/catalog" className={styles.ctaButton}>
            Переглянути каталог
          </Link>
          <Link href="/sell" className={styles.ctaButtonSecondary}>
            Продати книгу
          </Link>
        </div>
      </section>

      <section id="new" className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Новинки</h2>
          <Link href="/catalog?sort=new" className={styles.viewAllLink}>
            Показати всі →
          </Link>
        </div>
        {recentBooks.length > 0 ? (
          <BookCarousel books={recentBooks} savedIds={savedIds} badge="Новинка" />
        ) : (
          <p className={styles.empty}>Поки що немає доданих книг</p>
        )}
      </section>

      <section id="exchange" className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Обмін</h2>
          <Link href="/catalog?type=exchange,both" className={styles.viewAllLink}>
            Показати всі →
          </Link>
        </div>
        {exchangeBooks.length > 0 ? (
          <BookCarousel books={exchangeBooks} savedIds={savedIds} />
        ) : (
          <p className={styles.empty}>Поки що немає книг на обмін</p>
        )}
      </section>

      <section id="rating" className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Топ рейтингу</h2>
          <Link href="/catalog?sort=rating" className={styles.viewAllLink}>
            Показати всі →
          </Link>
        </div>
        {topRatedBooks.length > 0 ? (
          <BookCarousel books={topRatedBooks} savedIds={savedIds} />
        ) : (
          <p className={styles.empty}>Поки що немає доданих книг</p>
        )}
      </section>
    </div>
  );
}
