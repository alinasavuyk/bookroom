'use client';
import { useEffect, useState } from 'react';
import BookCard from '@/components/BookCard';
import { BookSummary } from '@/types/models';

export default function CatalogPage() {
  const [books, setBooks] = useState<BookSummary[]>([]);
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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Каталог книг</h1>

      {/* Фільтри: стовпчиком на телефоні, в ряд на планшеті+ */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Пошук за назвою..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-3 py-2 flex-1"
        />
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="">Усі жанри</option>
          <option value="Фантастика">Фантастика</option>
          <option value="Роман">Роман</option>
          <option value="Наукова література">Наукова література</option>
          <option value="Дитяча">Дитяча</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-10">Завантаження...</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {books.map((book) => (
            <BookCard key={book._id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
