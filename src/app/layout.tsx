import './globals.css';
import styles from './RootLayout.module.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { PT_Serif } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthProvider from '@/components/AuthProvider';
import ToastProvider from '@/components/ToastProvider';
import QueryProvider from '@/components/QueryProvider';

const ptSerif = PT_Serif({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
});

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
    <html lang="uk" className={ptSerif.variable}>
      <body>
        <QueryProvider>
          <AuthProvider>
            <ToastProvider>
              <Navbar />
              <main className={styles.main}>{children}</main>
              <Footer />
            </ToastProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
