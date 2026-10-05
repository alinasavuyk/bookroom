'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { fetchUnreadCount } from '@/lib/api-client';
import UserBar from '@/components/UserBar';
import SellLink from '@/components/SellLink';
import CartWidget from '@/components/CartWidget';
import styles from './Navbar.module.css';

const GUEST_LINKS = [
  { href: '/catalog', label: 'Каталог' },
  { href: '/sell', label: 'Продати книгу' },
];

const AUTHED_LINKS = [
  { href: '/', label: 'Головна' },
  { href: '/catalog', label: 'Каталог' },
  { href: '/sell', label: 'Продати книгу' },
  { href: '/chat', label: 'Повідомлення' },
  { href: '/profile', label: 'Профіль' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession(); // status: 'loading' | 'authenticated' | 'unauthenticated'

  const { data: unread } = useQuery({
    queryKey: ['unread-count'],
    queryFn: fetchUnreadCount,
    enabled: status === 'authenticated',
    refetchInterval: 20000,
  });
  const unreadCount = unread?.count ?? 0;

  const links = status === 'authenticated' ? AUTHED_LINKS : GUEST_LINKS;

  const renderNavLink = (link: { href: string; label: string }) => {
    const label = (
      <>
        {link.label}
        {link.href === '/chat' && unreadCount > 0 && (
          <span className={styles.unreadBadge}>{unreadCount}</span>
        )}
      </>
    );

    if (link.href === '/sell') {
      return (
        <SellLink className={styles.navLink} onNavigate={() => setOpen(false)}>
          {label}
        </SellLink>
      );
    }

    return (
      <Link href={link.href} onClick={() => setOpen(false)} className={styles.navLink}>
        {label}
      </Link>
    );
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>Bookroom</Link>

        {/* Повне меню — лише на десктопі (1440px+) */}
        <div className={styles.desktopMenu}>
          <ul className={styles.navList}>
            {links.map((link) => (
              <li key={link.href}>{renderNavLink(link)}</li>
            ))}
          </ul>

          {/* Показуємо різне залежно від того, чи є сесія */}
          {status === 'authenticated' && session?.user ? (
            <div className={styles.sessionBlock}>
              <CartWidget />
              <UserBar name={session.user.name ?? ''} avatar={session.user.image} />
            </div>
          ) : (
            <div className={styles.sessionBlock}>
              <Link href="/auth/signin" className={styles.loginLink}>
                Увійти
              </Link>
              <Link href="/auth/register" className={styles.registerLink}>
                Реєстрація
              </Link>
            </div>
          )}
        </div>

        {/* Кошик і бургер — завжди видимі поза десктопним меню */}
        <div className={styles.mobileActions}>
          <CartWidget />
          <button
            className={styles.burgerButton}
            onClick={() => setOpen(!open)}
            aria-label="Відкрити меню"
          >
            ☰
            {unreadCount > 0 && <span className={styles.burgerBadge} />}
          </button>
        </div>
      </div>

      {/* Мобільне випадаюче меню */}
      {open && (
        <div className={styles.mobileMenu}>
          <ul className={styles.mobileNavList}>
            {links.map((link) => (
              <li key={link.href}>{renderNavLink(link)}</li>
            ))}
          </ul>

          {status === 'authenticated' && session?.user ? (
            <UserBar name={session.user.name ?? ''} avatar={session.user.image} onNavigate={() => setOpen(false)} />
          ) : (
            <>
              <Link href="/auth/signin" onClick={() => setOpen(false)} className={styles.loginLink}>
                Увійти
              </Link>
              <Link href="/auth/register" onClick={() => setOpen(false)} className={styles.registerLink}>
                Реєстрація
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
