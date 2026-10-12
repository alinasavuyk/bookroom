'use client';
import { useEffect, useState, ReactNode } from 'react';
import Pagination from '@/components/Pagination';
import { TbChevronsDown } from '@/lib/icons';
import gridStyles from '@/styles/BookGrid.module.css';

const PAGE_SIZE = 12;

interface PaginatedBookGridProps<T> {
  items: T[];
  emptyText: string;
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
}

export default function PaginatedBookGrid<T>({
  items,
  emptyText,
  getKey,
  renderItem,
}: PaginatedBookGridProps<T>) {
  const [page, setPage] = useState(1);
  const [extraPages, setExtraPages] = useState(0);

  useEffect(() => {
    setPage(1);
    setExtraPages(0);
  }, [items.length]);

  if (items.length === 0) {
    return <p className={gridStyles.empty}>{emptyText}</p>;
  }

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const displayed = items.slice((page - 1) * PAGE_SIZE, (page + extraPages) * PAGE_SIZE);
  const canShowMore = page + extraPages < totalPages;

  const handlePageChange = (next: number) => {
    setPage(next);
    setExtraPages(0);
  };

  return (
    <>
      <ul className={gridStyles.grid}>
        {displayed.map((item) => (
          <li key={getKey(item)}>{renderItem(item)}</li>
        ))}
      </ul>

      {canShowMore && (
        <button
          type="button"
          onClick={() => setExtraPages((prev) => prev + 1)}
          className={gridStyles.showMoreButton}
        >
          Показати ще
          <TbChevronsDown />
        </button>
      )}

      <Pagination pageCount={totalPages} currentPage={page} onPageChange={handlePageChange} />
    </>
  );
}
