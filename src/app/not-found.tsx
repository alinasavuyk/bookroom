import Link from 'next/link';
import styles from './NotFoundPage.module.css';

export default function NotFound() {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>404</h1>
      <p className={styles.text}>Сторінку не знайдено.</p>
      <Link href="/" className={styles.link}>
        На головну
      </Link>
    </div>
  );
}
