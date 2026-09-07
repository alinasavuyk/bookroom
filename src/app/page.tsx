import { connectDB } from '@/lib/mongodb';
import Book from '@/models/Book';
import BookCard from '@/components/BookCard';
import { BookSummary } from '@/types/models';

export default async function HomePage() {
  await connectDB();
  const recentBooks = await Book.find({ status: 'available' })
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();

  return (
    <div>
      <section className="text-center py-10">
        <h1 className="text-3xl md:text-4xl font-bold text-brand-purple">
          Ласкаво просимо до Bookroom
        </h1>
        <p className="mt-2 text-gray-600 max-w-xl mx-auto">
          Діліться книгами, читайте рецензії інших і знаходьте нових друзів-читачів
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Нещодавно додані книги</h2>
        {/* Адаптивна сітка: 2 колонки на телефоні, 3 на планшеті, 4 на десктопі */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {recentBooks.map((book) => (
            <BookCard key={book._id.toString()} book={JSON.parse(JSON.stringify(book)) as BookSummary} />
          ))}
        </div>
        {recentBooks.length === 0 && (
          <p className="text-gray-400 text-center py-10">Поки що немає доданих книг</p>
        )}
      </section>
    </div>
  );
}
