'use client';
import ReactPaginate from 'react-paginate';
import styles from './Pagination.module.css';

interface PaginationProps {
  pageCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ pageCount, currentPage, onPageChange }: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <ReactPaginate
      forcePage={currentPage - 1}
      pageCount={pageCount}
      onPageChange={({ selected }) => onPageChange(selected + 1)}
      previousLabel="←"
      nextLabel="→"
      breakLabel="…"
      containerClassName={styles.pagination}
      pageLinkClassName={styles.pageLink}
      previousLinkClassName={styles.pageLink}
      nextLinkClassName={styles.pageLink}
      breakLinkClassName={styles.pageLink}
      activeLinkClassName={styles.active}
      disabledLinkClassName={styles.disabled}
    />
  );
}
