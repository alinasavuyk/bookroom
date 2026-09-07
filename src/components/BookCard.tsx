import Link from 'next/link';
import { BookSummary } from '@/types/models';

export default function BookCard({ book }: { book: BookSummary }) {
  return (
    <Link
      href={`/book/${book._id}`}
      className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center">
        {book.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-400 text-sm">Без обкладинки</span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium truncate">{book.title}</h3>
        <p className="text-sm text-gray-500 truncate">{book.author}</p>
        <p className="mt-1 text-brand-purple font-semibold">
          {book.price > 0 ? `${book.price} грн` : 'Обмін'}
        </p>
      </div>
    </Link>
  );
}
