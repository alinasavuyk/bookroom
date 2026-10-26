'use client';
import { ExchangeDTO } from '@/types/models';
import styles from '@/app/profile/ProfilePage.module.css';

const EXCHANGE_STATUS_LABEL: Record<ExchangeDTO['offerStatus'], string> = {
  pending: 'Очікує відповіді',
  accepted: 'Прийнято',
  declined: 'Відхилено',
  cancelled: 'Скасовано',
};

interface ExchangeRowProps {
  exchange: ExchangeDTO;
  meId: string;
  onCancel: (messageId: string) => void;
  isUpdating: boolean;
}

export default function ExchangeRow({ exchange, meId, onCancel, isUpdating }: ExchangeRowProps) {
  const isOfferer = exchange.sender._id === meId;
  const canCancel = exchange.offerStatus === 'pending' || exchange.offerStatus === 'accepted';
  const counterpart = isOfferer ? exchange.receiver : exchange.sender;
  const myDelivery = isOfferer
    ? { city: exchange.offererCity, warehouse: exchange.offererWarehouse }
    : { city: exchange.ownerCity, warehouse: exchange.ownerWarehouse };
  const theirDelivery = isOfferer
    ? { city: exchange.ownerCity, warehouse: exchange.ownerWarehouse }
    : { city: exchange.offererCity, warehouse: exchange.offererWarehouse };

  return (
    <li className={styles.orderCard}>
      <div className={styles.orderInfo}>
        <div className={styles.orderTitleRow}>
          <p className={styles.orderTitle}>
            {exchange.offeredBook?.title} ⇄ {exchange.book?.title}
          </p>
          <span className={`${styles.orderStatus} ${styles[`exchangeStatus_${exchange.offerStatus}`]}`}>
            {EXCHANGE_STATUS_LABEL[exchange.offerStatus]}
          </span>
        </div>
        <p className={styles.orderMeta}>
          {isOfferer ? 'Ти пропонувала обмін' : 'Тобі пропонували обмін'} · {counterpart.name}
        </p>
        {myDelivery.city && (
          <p className={styles.orderMeta}>
            Твоя доставка: {myDelivery.city}, відділення {myDelivery.warehouse}
          </p>
        )}
        {theirDelivery.city && (
          <p className={styles.orderMeta}>
            Доставка {counterpart.name}: {theirDelivery.city}, відділення {theirDelivery.warehouse}
          </p>
        )}
        <p className={styles.orderDate}>{new Date(exchange.createdAt).toLocaleDateString('uk-UA')}</p>
        {canCancel && (
          <div className={styles.orderActions}>
            <button
              type="button"
              onClick={() => onCancel(exchange._id)}
              disabled={isUpdating}
              className={styles.orderCancelButton}
            >
              Скасувати обмін
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
