import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import AuthProvider from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'Bookroom — книжкова спільнота',
  description: 'Діліться, обмінюйте та продавайте книги з іншими читачами',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uk">
      <body>
        <AuthProvider>
          <Navbar />
          <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
