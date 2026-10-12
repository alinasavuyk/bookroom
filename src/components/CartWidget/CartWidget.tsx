'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TbShoppingCart, TbHeart, TbHeartFilled, TbTrash, TbX, TbCheck } from '@/lib/icons';
import {
  fetchUserProfile,
  toggleCartItem,
  toggleSavedBook,
  checkoutCart,
  NovaPoshtaCity,
  NovaPoshtaWarehouse,
} from '@/lib/api-client';
import { useToast } from '@/components/ToastProvider';
import Modal from '@/components/Modal';
import DeliveryPicker from '@/components/DeliveryPicker';
import styles from './CartWidget.module.css';

const PAYMENT_OPTIONS: { value: 'cash' | 'card' | 'cod'; label: string }[] = [
  { value: 'cash', label: 'Готівкою при отриманні' },
  { value: 'card', label: 'Переказ на карту' },
  { value: 'cod', label: 'Накладений платіж' },
];

export default function CartWidget() {
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState<NovaPoshtaCity | null>(null);
  const [warehouse, setWarehouse] = useState<NovaPoshtaWarehouse | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'cod'>('cash');
  const userId = session?.user?.id;

  const { data: profile } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUserProfile(userId!),
    enabled: !!userId,
  });

  const removeMutation = useMutation({
    mutationFn: (bookId: string) => toggleCartItem(userId!, bookId, false),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user', userId] }),
    onError: () => showToast('Не вдалося прибрати книгу з кошика', 'error'),
  });

  const saveMutation = useMutation({
    mutationFn: ({ bookId, save }: { bookId: string; save: boolean }) => toggleSavedBook(userId!, bookId, save),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user', userId] }),
    onError: () => showToast('Не вдалося зберегти книгу', 'error'),
  });

  const checkoutMutation = useMutation({
    mutationFn: () =>
      checkoutCart(userId!, { city: city!.name, warehouse: warehouse!.number, paymentMethod }),
    onSuccess: ({ ordered, unavailable }) => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      if (ordered.length > 0) {
        showToast(`Замовлення оформлено: ${ordered.join(', ')}`);
      }
      if (unavailable.length > 0) {
        showToast(`Уже недоступні: ${unavailable.join(', ')}`, 'error');
      }
      setOpen(false);
      setCity(null);
      setWarehouse(null);
      setPaymentMethod('cash');
    },
    onError: () => showToast('Не вдалося оформити замовлення', 'error'),
  });

  if (status !== 'authenticated') return null;

  const cart = profile?.cart ?? [];
  const savedBookIds = new Set((profile?.savedBooks ?? []).map((b) => b._id));
  const total = cart.reduce((sum, b) => sum + b.price, 0);
  const canCheckout = !!city && !!warehouse && !checkoutMutation.isPending;
  const handleClose = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={styles.button}
        aria-label="Кошик"
      >
        <TbShoppingCart />
        {cart.length > 0 && <span className={styles.badge}>{cart.length}</span>}
      </button>

      {open && (
        <Modal onClose={handleClose} className={styles.cartDialog}>
          <div className={styles.header}>
            <h2 className={styles.title}>Кошик товарів</h2>
            <button type="button" onClick={handleClose} className={styles.closeButton} aria-label="Закрити">
              <TbX />
            </button>
          </div>

          {cart.length === 0 ? (
            <p className={styles.empty}>Кошик порожній</p>
          ) : (
            <>
              <ul className={cart.length > 1 ? `${styles.list} ${styles.listScrollable}` : styles.list}>
                {cart.map((book) => {
                  const isAvailable = book.status === 'available';
                  const isSaved = savedBookIds.has(book._id);

                  return (
                    <li key={book._id} className={styles.item}>
                      {book.coverImage ? (
                        <Image
                          src={book.coverImage}
                          alt={book.title}
                          width={48}
                          height={68}
                          className={styles.cover}
                        />
                      ) : (
                        <div className={styles.coverPlaceholder} />
                      )}

                      <div className={styles.itemInfo}>
                        <p className={styles.itemTitle}>{book.title}</p>
                        <p className={styles.itemAuthor}>{book.author}</p>
                        <span
                          className={`${styles.statusBadge} ${
                            isAvailable ? styles.statusAvailable : styles.statusUnavailable
                          }`}
                        >
                          {isAvailable ? (
                            <>
                              <TbCheck /> Доступна
                            </>
                          ) : (
                            <>
                              <TbX /> Вже недоступна
                            </>
                          )}
                        </span>
                      </div>

                      <div className={styles.itemActions}>
                        <div className={styles.itemIcons}>
                          <button
                            type="button"
                            onClick={() => saveMutation.mutate({ bookId: book._id, save: !isSaved })}
                            disabled={saveMutation.isPending}
                            className={styles.iconButton}
                            aria-label={isSaved ? 'Прибрати зі збережених' : 'Зберегти книгу'}
                          >
                            {isSaved ? <TbHeartFilled /> : <TbHeart />}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeMutation.mutate(book._id)}
                            disabled={removeMutation.isPending}
                            className={styles.iconButton}
                            aria-label="Прибрати з кошика"
                          >
                            <TbTrash />
                          </button>
                        </div>
                        <div className={styles.itemBottom}>
                          <span className={styles.itemQty}>1 шт.</span>
                          <span className={styles.itemPrice}>{book.price} ₴</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className={styles.deliverySection}>
                <p className={styles.deliveryHeading}>Доставка Новою Поштою</p>

                <DeliveryPicker
                  city={city}
                  warehouse={warehouse}
                  onCityChange={(selected) => {
                    setCity(selected);
                    setWarehouse(null);
                  }}
                  onWarehouseChange={setWarehouse}
                />

                <p className={styles.fieldLabel}>Спосіб оплати</p>
                <div className={styles.paymentOptions}>
                  {PAYMENT_OPTIONS.map((opt) => (
                    <label key={opt.value} className={styles.paymentOption}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === opt.value}
                        onChange={() => setPaymentMethod(opt.value)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.totalRow}>
                <span>Разом</span>
                <span className={styles.totalPrice}>{total} ₴</span>
              </div>

              <div className={styles.footerActions}>
                <button type="button" onClick={handleClose} className={styles.continueButton}>
                  Продовжити покупки
                </button>
                <button
                  type="button"
                  onClick={() => checkoutMutation.mutate()}
                  disabled={!canCheckout}
                  className={styles.checkoutButton}
                >
                  {checkoutMutation.isPending ? 'Оформлення...' : 'Оформити замовлення'}
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
    </>
  );
}
