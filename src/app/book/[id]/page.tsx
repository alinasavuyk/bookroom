import styles from './BookIdPage.module.css';

export default function BookPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1 className={styles.heading}>Сторінка книги</h1>
      <p className={styles.text}>
        Тут буде опис книги, фото, коментарі та кнопка &quot;купити/обміняти&quot;.
        ID книги: <code>{params.id}</code>. Дані бери з <code>GET /api/books/{'{id}'}</code> і{' '}
        <code>GET /api/comments?bookId={'{id}'}</code>.
      </p>
    </div>
  );
}
