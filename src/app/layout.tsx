import './globals.css';
import styles from './RootLayout.module.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import AuthProvider from '@/components/AuthProvider';
import ToastProvider from '@/components/ToastProvider';
import QueryProvider from '@/components/QueryProvider';

export const metadata: Metadata = {
  title: {
    default: 'Bookroom — книжкова спільнота',
    template: '%s — Bookroom',
  },
  description: 'Діліться, обмінюйте та продавайте книги з іншими читачами',
  openGraph: {
    siteName: 'Bookroom',
    title: 'Bookroom — книжкова спільнота',
    description: 'Діліться, обмінюйте та продавайте книги з іншими читачами',
    type: 'website',
    locale: 'uk_UA',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uk">
      <body>
        <QueryProvider>
          <AuthProvider>
            <ToastProvider>
              <Navbar />
              <main className={styles.main}>{children}</main>
            </ToastProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
