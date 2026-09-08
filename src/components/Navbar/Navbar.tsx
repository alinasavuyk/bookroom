'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import styles from './Navbar.module.css';

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
    <nav className={styles.nav}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>Bookroom</Link>

        {/* Меню для планшета й десктопу */}
        <div className={styles.desktopMenu}>
          <ul className={styles.navList}>
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={styles.navLink}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Показуємо різне залежно від того, чи є сесія */}
          {status === 'authenticated' ? (
            <div className={styles.sessionBlock}>
              <span className={styles.userName}>{session?.user?.name}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className={styles.textButton}
              >
                Вийти
              </button>
            </div>
          ) : (
            <div className={styles.sessionBlock}>
              <Link href="/auth/signin" className={styles.navLink}>
                Увійти
              </Link>
              <Link href="/auth/register" className={styles.registerLink}>
                Реєстрація
              </Link>
            </div>
          )}
        </div>

        {/* Кнопка "бургер" для мобільних */}
        <button
          className={styles.burgerButton}
          onClick={() => setOpen(!open)}
          aria-label="Відкрити меню"
        >
          ☰
        </button>
      </div>

      {/* Мобільне випадаюче меню */}
      {open && (
        <div className={styles.mobileMenu}>
          <ul className={styles.mobileNavList}>
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} onClick={() => setOpen(false)} className={styles.navLink}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {status === 'authenticated' ? (
            <>
              <span className={styles.userName}>{session?.user?.name}</span>
              <button
                onClick={() => {
                  setOpen(false);
                  signOut({ callbackUrl: '/' });
                }}
                className={styles.mobileTextButton}
              >
                Вийти
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/signin" onClick={() => setOpen(false)} className={styles.navLink}>
                Увійти
              </Link>
              <Link href="/auth/register" onClick={() => setOpen(false)} className={styles.navLink}>
                Реєстрація
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
