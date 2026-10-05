import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          Bookroom
        </Link>
        <p className={styles.tagline}>Книжкова спільнота для обміну та продажу книг</p>
      </div>

      <p className={styles.copyright}>© {year} Bookroom</p>
    </footer>
  );
}
