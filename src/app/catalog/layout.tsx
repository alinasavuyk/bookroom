import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Каталог книг',
  description: 'Шукай книги на продаж чи обмін за жанром, типом і ціною',
};

export default function CatalogLayout({ children }: { children: ReactNode }) {
  return children;
}
