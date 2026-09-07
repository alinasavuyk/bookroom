'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession(); // status: 'loading' | 'authenticated' | 'unauthenticated'

  const links = [
    { href: '/', label: 'Головна' },
    { href: '/catalog', label: 'Каталог' },
    { href: '/sell', label: 'Продати книгу' },
    { href: '/chat', label: 'Повідомлення' },
    { href: '/profile', label: 'Профіль' },
  ];

  return (
    <nav className="bg-brand-purple text-white">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="text-xl font-semibold">Bookroom</Link>

        {/* Меню для планшета й десктопу */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-brand-purpleSoft transition-colors">
              {link.label}
            </Link>
          ))}

          {/* Показуємо різне залежно від того, чи є сесія */}
          {status === 'authenticated' ? (
            <div className="flex items-center gap-3">
              <span className="text-brand-purpleSoft">{session.user.name}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="hover:text-brand-purpleSoft transition-colors"
              >
                Вийти
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/auth/signin" className="hover:text-brand-purpleSoft transition-colors">
                Увійти
              </Link>
              <Link
                href="/auth/register"
                className="bg-white text-brand-purple px-3 py-1 rounded-lg font-medium hover:bg-brand-purpleSoft transition-colors"
              >
                Реєстрація
              </Link>
            </div>
          )}
        </div>

        {/* Кнопка "бургер" для мобільних */}
        <button
          className="md:hidden text-2xl"
          onClick={() => setOpen(!open)}
          aria-label="Відкрити меню"
        >
          ☰
        </button>
      </div>

      {/* Мобільне випадаюче меню */}
      {open && (
        <div className="md:hidden flex flex-col bg-brand-purple px-4 pb-4 gap-3">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}

          {status === 'authenticated' ? (
            <>
              <span className="text-brand-purpleSoft">{session.user.name}</span>
              <button
                onClick={() => {
                  setOpen(false);
                  signOut({ callbackUrl: '/' });
                }}
                className="text-left"
              >
                Вийти
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/signin" onClick={() => setOpen(false)}>Увійти</Link>
              <Link href="/auth/register" onClick={() => setOpen(false)}>Реєстрація</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
