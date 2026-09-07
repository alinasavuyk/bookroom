import styles from './ChatPage.module.css';

export default function ChatPage() {
  return (
    <div>
      <h1 className={styles.heading}>Повідомлення</h1>
      <p className={styles.text}>
        Тут буде список розмов і вікно чату.
        Використай <code>/api/messages</code> для отримання й надсилання повідомлень.
      </p>
    </div>
  );
}
