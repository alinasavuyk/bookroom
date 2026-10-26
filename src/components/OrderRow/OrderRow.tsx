'use client';
import Image from 'next/image';
import { OrderDTO } from '@/types/models';
import styles from '@/app/profile/ProfilePage.module.css';

const PAYMENT_LABEL: Record<OrderDTO['paymentMethod'], string> = {
  cash: 'Готівкою при отриманні',
  card: 'Переказ на карту',
  cod: 'Накладений платіж',
};

const ORDER_STATUS_LABEL: Record<OrderDTO['status'], string> = {
  active: 'Очікує підтвердження',
  confirmed: 'Підтверджено',
  cancelled: 'Скасовано',
};

interface OrderRowProps {
  order: OrderDTO;
  counterpart: OrderDTO['buyer'];
  counterpartLabel: string;
  role: 'buyer' | 'seller';
  onConfirm: (orderId: string) => void;
  onCancel: (orderId: string) => void;
  isUpdating: boolean;
}

export default function OrderRow({
  order,
  counterpart,
  counterpartLabel,
  role,
  onConfirm,
  onCancel,
  isUpdating,
}: OrderRowProps) {
  return (
    <li className={styles.orderCard}>
      {order.bookCoverImage ? (
        <Image
          src={order.bookCoverImage}
          alt={order.bookTitle}
          width={48}
          height={68}
          className={styles.orderCover}
        />
      ) : (
        <div className={styles.orderCoverPlaceholder} />
      )}
      <div className={styles.orderInfo}>
        <div className={styles.orderTitleRow}>
          <p className={styles.orderTitle}>{order.bookTitle}</p>
          <span className={`${styles.orderStatus} ${styles[`orderStatus_${order.status}`]}`}>
            {ORDER_STATUS_LABEL[order.status]}
          </span>
        </div>
        {order.bookAuthor && <p className={styles.orderAuthor}>{order.bookAuthor}</p>}
        <p className={styles.orderMeta}>
          {order.price} ₴ · {counterpartLabel}: {counterpart.name}
        </p>
        <p className={styles.orderMeta}>
          Нова Пошта, {order.city}, відділення {order.warehouse}
        </p>
        <p className={styles.orderMeta}>{PAYMENT_LABEL[order.paymentMethod]}</p>
        <p className={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString('uk-UA')}</p>

        {order.status !== 'cancelled' && (
          <div className={styles.orderActions}>
            {role === 'seller' && order.status === 'active' && (
              <button
                type="button"
                onClick={() => onConfirm(order._id)}
                disabled={isUpdating}
                className={styles.orderConfirmButton}
              >
                Підтвердити
              </button>
            )}
            <button
              type="button"
              onClick={() => onCancel(order._id)}
              disabled={isUpdating}
              className={styles.orderCancelButton}
            >
              Скасувати замовлення
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
