'use client';
import { MessageDTO } from '@/types/models';
import styles from '@/app/chat/ChatPage.module.css';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
}

const OFFER_STATUS_LABEL: Record<string, string> = {
  accepted: 'Прийнято',
  cancelled: 'Скасовано',
  declined: 'Відхилено',
};

interface MessageBubbleProps {
  message: MessageDTO;
  isMine: boolean;
  isResponding: boolean;
  onAccept: (messageId: string) => void;
  onDecline: (messageId: string) => void;
  onCancel: (messageId: string) => void;
}

export default function MessageBubble({
  message,
  isMine,
  isResponding,
  onAccept,
  onDecline,
  onCancel,
}: MessageBubbleProps) {
  const isOffer = !!message.offeredBook;
  const canRespond = isOffer && !isMine && message.offerStatus === 'pending';
  const canCancel = isOffer && (message.offerStatus === 'pending' || message.offerStatus === 'accepted');

  return (
    <li className={`${styles.messageBubbleRow} ${isMine ? styles.messageBubbleRowMine : ''}`}>
      <div className={`${styles.messageBubble} ${isMine ? styles.messageBubbleMine : ''}`}>
        {message.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={message.image}
            alt=""
            className={styles.messageImage}
            style={message.text ? { marginBottom: '0.35rem' } : undefined}
          />
        )}
        {message.text}

        {isOffer && (
          <div className={styles.offerCard}>
            <p className={styles.offerLine}>
              {message.offeredBook?.title} → {message.book?.title}
            </p>
            {message.offerStatus && message.offerStatus !== 'pending' && (
              <span className={styles.offerStatus}>{OFFER_STATUS_LABEL[message.offerStatus]}</span>
            )}

            {message.ownerCity && (
              <p className={styles.offerDelivery}>
                Власник: {message.ownerCity}, відділення {message.ownerWarehouse}
              </p>
            )}
            {message.offererCity && (
              <p className={styles.offerDelivery}>
                Пропонував обмін: {message.offererCity}, відділення {message.offererWarehouse}
              </p>
            )}

            {(canRespond || canCancel) && (
              <div className={styles.offerActions}>
                {canRespond && (
                  <>
                    <button
                      type="button"
                      onClick={() => onAccept(message._id)}
                      disabled={isResponding}
                      className={styles.offerAccept}
                    >
                      Прийняти
                    </button>
                    <button
                      type="button"
                      onClick={() => onDecline(message._id)}
                      disabled={isResponding}
                      className={styles.offerDecline}
                    >
                      Відхилити
                    </button>
                  </>
                )}
                {canCancel && (
                  <button
                    type="button"
                    onClick={() => onCancel(message._id)}
                    disabled={isResponding}
                    className={styles.offerDecline}
                  >
                    Скасувати обмін
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <span className={styles.messageTime}>{formatTime(message.createdAt)}</span>
      </div>
    </li>
  );
}
