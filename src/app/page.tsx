import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Book from '@/models/Book';
import User from '@/models/User';
import BookCard from '@/components/BookCard';
import { getRatingsMap } from '@/lib/ratings';
import { BookSummary } from '@/types/models';
import styles from './HomePage.module.css';
import gridStyles from '@/styles/BookGrid.module.css';

// Сторінка залежить від БД і сесії користувача — не можна генерувати статично під час білда
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Головна',
  description: 'Знаходь книги на продаж чи обмін від інших читачів на Bookroom',
};

export default async function HomePage() {
  await connectDB();
  const session = await getServerSession(authOptions);

  const [recentBooks, currentUser] = await Promise.all([
    Book.find({ status: 'available' }).sort({ createdAt: -1 }).limit(8).lean(),
    session?.user?.id ? User.findById(session.user.id).select('savedBooks').lean() : null,
  ]);

  const savedIds = new Set((currentUser?.savedBooks ?? []).map((id) => id.toString()));
  const ratingsMap = await getRatingsMap(recentBooks.map((b) => b._id));

  return (
    <div>
      <section className={styles.hero}>
        <h1 className={styles.title}>
          Ласкаво просимо до Bookroom
        </h1>
        <p className={styles.subtitle}>
          Діліться книгами, читайте рецензії інших і знаходьте нових друзів-читачів
        </p>
      </section>

      <section>
        <h2 className={styles.sectionTitle}>Нещодавно додані книги</h2>
        <ul className={gridStyles.grid}>
          {recentBooks.map((book) => {
            const rating = ratingsMap.get(book._id.toString());
            return (
              <li key={book._id.toString()}>
                <BookCard
                  book={{
                    ...(JSON.parse(JSON.stringify(book)) as BookSummary),
                    avgRating: rating?.avgRating ?? 0,
                    reviewCount: rating?.reviewCount ?? 0,
                  }}
                  initialSaved={savedIds.has(book._id.toString())}
                />
              </li>
            );
          })}
        </ul>
        {recentBooks.length === 0 && (
          <p className={gridStyles.empty}>Поки що немає доданих книг</p>
        )}
      </section>
    </div>
  );
}
