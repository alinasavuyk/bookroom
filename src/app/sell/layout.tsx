import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Продати книгу',
  description: 'Додай книгу на продаж або обмін іншим читачам',
};

export default function SellLayout({ children }: { children: ReactNode }) {
  return children;
}
