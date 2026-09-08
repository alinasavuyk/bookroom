import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Book from '@/models/Book';
import User from '@/models/User';
import BookCard from '@/components/BookCard';
import { BookSummary } from '@/types/models';
import styles from './HomePage.module.css';
import gridStyles from '@/styles/BookGrid.module.css';

// Сторінка залежить від БД і сесії користувача — не можна генерувати статично під час білда
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  await connectDB();
  const session = await getServerSession(authOptions);

  const [recentBooks, currentUser] = await Promise.all([
    Book.find({ status: 'available' }).sort({ createdAt: -1 }).limit(8).lean(),
    session?.user?.id ? User.findById(session.user.id).select('savedBooks').lean() : null,
  ]);

  const savedIds = new Set((currentUser?.savedBooks ?? []).map((id) => id.toString()));

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
        <div className={gridStyles.grid}>
          {recentBooks.map((book) => (
            <BookCard
              key={book._id.toString()}
              book={JSON.parse(JSON.stringify(book)) as BookSummary}
              initialSaved={savedIds.has(book._id.toString())}
            />
          ))}
        </div>
        {recentBooks.length === 0 && (
          <p className={gridStyles.empty}>Поки що немає доданих книг</p>
        )}
      </section>
    </div>
  );
}
