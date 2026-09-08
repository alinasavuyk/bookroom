import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Профіль',
  description: 'Керуй своїм профілем, книгами на продаж і збереженими книгами',
};

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return children;
}
