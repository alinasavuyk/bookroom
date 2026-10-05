'use client';
import { useState, useCallback } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TbShoppingCart } from '@/lib/icons';
import {
  fetchUserProfile,
  toggleCartItem,
  checkoutCart,
  searchCities,
  searchWarehouses,
  NovaPoshtaCity,
  NovaPoshtaWarehouse,
} from '@/lib/api-client';
import { useToast } from '@/components/ToastProvider';
import Modal from '@/components/Modal';
import SearchSelect from '@/components/SearchSelect';
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

  const searchWarehousesForCity = useCallback(
    (query: string) => (city ? searchWarehouses(city.ref, query) : Promise.resolve([])),
    [city]
  );

  if (status !== 'authenticated') return null;

  const cart = profile?.cart ?? [];
  const total = cart.reduce((sum, b) => sum + b.price, 0);
  const canCheckout = !!city && !!warehouse && !checkoutMutation.isPending;

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
        <Modal onClose={() => setOpen(false)}>
          <h2 className={styles.title}>Кошик</h2>

          {cart.length === 0 ? (
            <p className={styles.empty}>Кошик порожній</p>
          ) : (
            <>
              <ul className={styles.list}>
                {cart.map((book) => (
                  <li key={book._id} className={styles.item}>
                    {book.coverImage ? (
                      <Image
                        src={book.coverImage}
                        alt={book.title}
                        width={40}
                        height={56}
                        className={styles.cover}
                      />
                    ) : (
                      <div className={styles.coverPlaceholder} />
                    )}
                    <div className={styles.itemInfo}>
                      <p className={styles.itemTitle}>{book.title}</p>
                      <p className={styles.itemPrice}>{book.price} ₴</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMutation.mutate(book._id)}
                      disabled={removeMutation.isPending}
                      className={styles.removeButton}
                      aria-label="Прибрати з кошика"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>

              <div className={styles.totalRow}>
                <span>Разом</span>
                <span className={styles.totalPrice}>{total} ₴</span>
              </div>

              <div className={styles.deliverySection}>
                <p className={styles.deliveryHeading}>Доставка Новою Поштою</p>

                <label className={styles.fieldLabel}>
                  Місто
                  <SearchSelect
                    placeholder="Почни вводити назву міста..."
                    value={city}
                    onChange={(selected) => {
                      setCity(selected);
                      setWarehouse(null);
                    }}
                    search={searchCities}
                    getLabel={(c) => c.name}
                    getKey={(c) => c.ref}
                  />
                </label>

                <label className={styles.fieldLabel}>
                  Відділення
                  <SearchSelect
                    placeholder={city ? 'Почни вводити номер чи адресу...' : 'Спершу обери місто'}
                    value={warehouse}
                    onChange={setWarehouse}
                    search={searchWarehousesForCity}
                    getLabel={(w) => w.description}
                    getKey={(w) => w.ref}
                    disabled={!city}
                  />
                </label>

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

              <button
                type="button"
                onClick={() => checkoutMutation.mutate()}
                disabled={!canCheckout}
                className={styles.checkoutButton}
              >
                {checkoutMutation.isPending ? 'Оформлення...' : 'Оформити замовлення'}
              </button>
            </>
          )}
        </Modal>
      )}
    </>
  );
}
