'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import BookCard from '@/components/BookCard';
import Loader from '@/components/Loader';
import Pagination from '@/components/Pagination';
import CatalogFilters, { CatalogFilterValues, EMPTY_CATALOG_FILTERS } from '@/components/CatalogFilters';
import { fetchBooks, fetchUserProfile } from '@/lib/api-client';
import { TbChevronsDown } from '@/lib/icons';
import { BookSummary } from '@/types/models';
import styles from './CatalogPage.module.css';
import gridStyles from '@/styles/BookGrid.module.css';

export default function CatalogPage() {
  return (
    <Suspense fallback={<Loader />}>
      <CatalogPageContent />
    </Suspense>
  );
}

function CatalogPageContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(() => searchParams.get('search') ?? '');
  const [filters, setFilters] = useState<CatalogFilterValues>(() => {
    const type = searchParams.get('type');
    return type ? { ...EMPTY_CATALOG_FILTERS, types: type.split(',') } : EMPTY_CATALOG_FILTERS;
  });
  const [sort] = useState<'new' | 'rating'>(() =>
    searchParams.get('sort') === 'rating' ? 'rating' : 'new'
  );
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['books', search, filters, page, sort],
    queryFn: () => fetchBooks(search, filters, page, sort),
  });
  const books = data?.books ?? [];
  const totalPages = data?.totalPages ?? 1;

  // "Показати ще" довантажує наступну сторінку поверх поточної, не змінюючи
  // активну сторінку в пагінації — скидається при зміні пошуку/фільтрів/сторінки
  const [extraBooks, setExtraBooks] = useState<BookSummary[]>([]);
  const [extraPages, setExtraPages] = useState(0);

  useEffect(() => {
    setExtraBooks([]);
    setExtraPages(0);
  }, [search, filters, page, sort]);

  const showMoreMutation = useMutation({
    mutationFn: () => fetchBooks(search, filters, page + extraPages + 1, sort),
    onSuccess: (result) => {
      setExtraBooks((prev) => [...prev, ...result.books]);
      setExtraPages((prev) => prev + 1);
    },
  });

  const displayedBooks = [...books, ...extraBooks];
  const canShowMore = page + extraPages < totalPages;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleFiltersApply = (values: CatalogFilterValues) => {
    setFilters(values);
    setPage(1);
  };

  const { data: profile } = useQuery({
    queryKey: ['user', session?.user?.id],
    queryFn: () => fetchUserProfile(session!.user!.id),
    enabled: !!session?.user?.id,
  });

  const savedIds = new Set((profile?.savedBooks ?? []).map((b) => b._id));

  return (
    <div>
      <h1 className={styles.title}>Каталог книг</h1>

      <input
        type="text"
        placeholder="Пошук за назвою..."
        value={search}
        onChange={(e) => handleSearchChange(e.target.value)}
        className={styles.search}
      />

      <div className={styles.layout}>
        <CatalogFilters onApply={handleFiltersApply} initialValues={filters} />

        <div className={styles.results}>
          {isLoading ? (
            <Loader />
          ) : displayedBooks.length > 0 ? (
            <>
              <ul className={styles.grid}>
                {displayedBooks.map((book) => (
                  <li key={book._id}>
                    <BookCard book={book} initialSaved={savedIds.has(book._id)} />
                  </li>
                ))}
              </ul>

              {canShowMore && (
                <button
                  type="button"
                  onClick={() => showMoreMutation.mutate()}
                  disabled={showMoreMutation.isPending}
                  className={styles.showMoreButton}
                >
                  {showMoreMutation.isPending ? 'Завантаження...' : 'Показати ще'}
                  <TbChevronsDown />
                </button>
              )}

              <Pagination pageCount={totalPages} currentPage={page} onPageChange={setPage} />
            </>
          ) : (
            <p className={gridStyles.empty}>Нічого не знайдено</p>
          )}
        </div>
      </div>
    </div>
  );
}
