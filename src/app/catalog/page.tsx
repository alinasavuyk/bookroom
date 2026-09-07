'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import BookCard from '@/components/BookCard';
import { BookSummary } from '@/types/models';
import styles from './CatalogPage.module.css';
import gridStyles from '@/styles/BookGrid.module.css';

export default function CatalogPage() {
  const { data: session } = useSession();
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (genre) params.set('genre', genre);

    setLoading(true);
    fetch(`/api/books?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setBooks(data))
      .finally(() => setLoading(false));
  }, [search, genre]);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/users/${session.user.id}`)
      .then((res) => res.json())
      .then((data) => setSavedIds(new Set((data.savedBooks ?? []).map((b: { _id: string }) => b._id))));
  }, [session]);

  return (
    <div>
      <h1 className={styles.title}>Каталог книг</h1>

      {/* Фільтри: стовпчиком на телефоні, в ряд на планшеті+ */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Пошук за назвою..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.search}
        />
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className={styles.select}
        >
          <option value="">Усі жанри</option>
          <option value="Фантастика">Фантастика</option>
          <option value="Роман">Роман</option>
          <option value="Наукова література">Наукова література</option>
          <option value="Дитяча">Дитяча</option>
        </select>
      </div>

      {loading ? (
        <p className={styles.loading}>Завантаження...</p>
      ) : (
        <div className={gridStyles.grid}>
          {books.map((book) => (
            <BookCard key={book._id} book={book} initialSaved={savedIds.has(book._id)} />
          ))}
        </div>
      )}
    </div>
  );
}
