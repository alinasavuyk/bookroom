import Image from 'next/image';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import type { Metadata } from 'next';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Book from '@/models/Book';
import BookCard from '@/components/BookCard';
import { getRatingsMap } from '@/lib/ratings';
import { BookSummary } from '@/types/models';
import gridStyles from '@/styles/BookGrid.module.css';
import styles from './UserProfilePage.module.css';

const getUser = cache(async (id: string) => {
  await connectDB();
  try {
    return await User.findById(id).select('name avatar bio rating').lean();
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
  const user = await getUser(id);
  if (!user) return { title: 'Користувача не знайдено' };
  return { title: `${user.name} — Bookroom` };
}

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser(id);
  if (!user) notFound();

  const books = await Book.find({ owner: id }).sort({ createdAt: -1 }).lean();
  const ratingsMap = await getRatingsMap(books.map((b) => b._id));

  const booksWithRatings = books.map((b) => ({
    ...b,
    owner: { _id: String(user._id), name: user.name, avatar: user.avatar },
    avgRating: ratingsMap.get(b._id.toString())?.avgRating ?? 0,
    reviewCount: ratingsMap.get(b._id.toString())?.reviewCount ?? 0,
  }));

  const userData = JSON.parse(JSON.stringify({ ...user, books: booksWithRatings })) as {
    _id: string;
    name: string;
    avatar?: string;
    bio?: string;
    rating: number;
    books: BookSummary[];
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        {userData.avatar ? (
          <Image src={userData.avatar} alt={userData.name} width={72} height={72} className={styles.avatar} />
        ) : (
          <div className={styles.avatarPlaceholder}>{userData.name.charAt(0).toUpperCase()}</div>
        )}
        <div>
          <h1 className={styles.name}>{userData.name}</h1>
          {userData.bio && <p className={styles.bio}>{userData.bio}</p>}
        </div>
      </div>

      <h2 className={styles.booksHeading}>Книги</h2>

      {userData.books.length > 0 ? (
        <ul className={gridStyles.grid}>
          {userData.books.map((book) => (
            <li key={book._id}>
              <BookCard book={book} />
            </li>
          ))}
        </ul>
      ) : (
        <p className={gridStyles.empty}>Поки що немає оголошень</p>
      )}
    </div>
  );
}
