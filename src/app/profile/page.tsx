'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import BookCard from '@/components/BookCard';
import Loader from '@/components/Loader';
import Modal from '@/components/Modal';
import PaginatedBookGrid from '@/components/PaginatedBookGrid';
import ProfileEditForm from '@/components/ProfileEditForm';
import OrderRow from '@/components/OrderRow';
import ExchangeRow from '@/components/ExchangeRow';
import Tabs from '@/components/Tabs';
import {
  fetchUserProfile,
  fetchBooksByOwner,
  fetchOrders,
  updateOrderStatus,
  fetchExchanges,
  respondToExchangeOffer,
} from '@/lib/api-client';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { useToast, onErrorToast } from '@/components/ToastProvider';
import formStyles from '@/styles/Form.module.css';
import gridStyles from '@/styles/BookGrid.module.css';
import styles from './ProfilePage.module.css';

export default function ProfilePage() {
  return (
    <Suspense fallback={<Loader />}>
      <ProfilePageContent />
    </Suspense>
  );
}

function ProfilePageContent() {
  const { data: session } = useSession();
  const status = useRequireAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = session?.user?.id;

  const [showWelcome, setShowWelcome] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const hasNewGoogleUserCookie = document.cookie.includes('google-new-user=1');
    if (searchParams.get('welcome') === '1' || hasNewGoogleUserCookie) {
      setShowWelcome(true);
      if (hasNewGoogleUserCookie) {
        document.cookie = 'google-new-user=; path=/; max-age=0';
      }
      router.replace('/profile');
    }
  }, [searchParams, router]);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUserProfile(userId!),
    enabled: !!userId,
  });

  const { data: myBooks = [] } = useQuery({
    queryKey: ['books', 'owner', userId],
    queryFn: () => fetchBooksByOwner(userId!),
    enabled: !!userId,
  });

  const { data: myPurchasesAll = [] } = useQuery({
    queryKey: ['orders', 'buyer', userId],
    queryFn: () => fetchOrders('buyer'),
    enabled: !!userId,
  });
  const myPurchases = myPurchasesAll.filter((order) => order.status !== 'cancelled');

  const { data: receivedOrdersAll = [] } = useQuery({
    queryKey: ['orders', 'seller', userId],
    queryFn: () => fetchOrders('seller'),
    enabled: !!userId,
  });
  const receivedOrders = receivedOrdersAll.filter((order) => order.status !== 'cancelled');

  const { data: exchangesAll = [] } = useQuery({
    queryKey: ['exchanges', userId],
    queryFn: fetchExchanges,
    enabled: !!userId,
  });
  const exchanges = exchangesAll.filter(
    (exchange) => exchange.offerStatus === 'pending' || exchange.offerStatus === 'accepted'
  );

  const orderMutation = useMutation({
    mutationFn: ({ orderId, action }: { orderId: string; action: 'confirm' | 'cancel' }) =>
      updateOrderStatus(orderId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'buyer', userId] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'seller', userId] });
    },
    onError: onErrorToast(showToast),
  });

  const handleConfirmOrder = (orderId: string) => orderMutation.mutate({ orderId, action: 'confirm' });
  const handleCancelOrder = (orderId: string) => orderMutation.mutate({ orderId, action: 'cancel' });

  const exchangeMutation = useMutation({
    mutationFn: (messageId: string) => respondToExchangeOffer(messageId, 'cancel'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchanges', userId] });
    },
    onError: onErrorToast(showToast),
  });

  const handleCancelExchange = (messageId: string) => exchangeMutation.mutate(messageId);

  const dismissWelcome = () => setShowWelcome(false);

  const handleFillNow = () => {
    setShowWelcome(false);
    setEditing(true);
  };

  if (status === 'loading' || profileLoading) {
    return <Loader />;
  }

  if (status !== 'authenticated' || !profile) {
    return null;
  }

  return (
    <div>
      {showWelcome && (
        <Modal onClose={dismissWelcome}>
          <h2 className={styles.welcomeTitle}>Ласкаво просимо до Bookroom!</h2>
          <p className={styles.welcomeText}>
            Хочеш одразу додати фото й розповісти про себе, чи зробиш це пізніше?
          </p>
          <div className={styles.welcomeActions}>
            <button type="button" onClick={handleFillNow} className={formStyles.submitButton}>
              Заповнити зараз
            </button>
            <button type="button" onClick={dismissWelcome} className={styles.cancelButton}>
              Пізніше
            </button>
          </div>
        </Modal>
      )}

      {!editing ? (
        <div className={styles.header}>
          {profile.avatar ? (
            <Image
              src={profile.avatar}
              alt={profile.name}
              width={96}
              height={96}
              className={styles.avatarLarge}
            />
          ) : (
            <div className={styles.avatarPlaceholder}>{profile.name.charAt(0).toUpperCase() || '?'}</div>
          )}
          <div>
            <h1 className={styles.name}>{profile.name}</h1>
            {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
            <button type="button" onClick={() => setEditing(true)} className={styles.editButton}>
              Редагувати профіль
            </button>
          </div>
        </div>
      ) : (
        <ProfileEditForm
          userId={userId!}
          profile={{ name: profile.name, bio: profile.bio, avatar: profile.avatar }}
          onCancel={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      )}

      <div className={styles.tabsWrap}>
        <Tabs
          tabs={[
            {
              key: 'myBooks',
              label: (
                <>
                  Мої книги <span className={styles.tabCount}>{myBooks.length}</span>
                </>
              ),
              content: (
                <PaginatedBookGrid
                  items={myBooks}
                  emptyText="Ти ще не додала жодної книги"
                  getKey={(book) => book._id}
                  renderItem={(book) => <BookCard book={book} />}
                />
              ),
            },
            {
              key: 'saved',
              label: (
                <>
                  Збережені книги <span className={styles.tabCount}>{profile.savedBooks.length}</span>
                </>
              ),
              content: (
                <PaginatedBookGrid
                  items={profile.savedBooks}
                  emptyText="Немає збережених книг"
                  getKey={(book) => book._id}
                  renderItem={(book) => (
                    <BookCard
                      book={book}
                      initialSaved
                      onToggleSaved={(bookId, saved) => {
                        if (!saved && userId) {
                          queryClient.setQueryData<typeof profile>(['user', userId], (prev) =>
                            prev ? { ...prev, savedBooks: prev.savedBooks.filter((b) => b._id !== bookId) } : prev
                          );
                        }
                      }}
                    />
                  )}
                />
              ),
            },
            {
              key: 'purchases',
              label: (
                <>
                  Мої покупки <span className={styles.tabCount}>{myPurchases.length}</span>
                </>
              ),
              content:
                myPurchases.length > 0 ? (
                  <ul className={styles.orderList}>
                    {myPurchases.map((order) => (
                      <OrderRow
                        key={order._id}
                        order={order}
                        counterpart={order.seller}
                        counterpartLabel="Продавець"
                        role="buyer"
                        onConfirm={handleConfirmOrder}
                        onCancel={handleCancelOrder}
                        isUpdating={orderMutation.isPending}
                      />
                    ))}
                  </ul>
                ) : (
                  <p className={gridStyles.empty}>Ти ще нічого не замовляла</p>
                ),
            },
            {
              key: 'received',
              label: (
                <>
                  Отримані замовлення <span className={styles.tabCount}>{receivedOrders.length}</span>
                </>
              ),
              content:
                receivedOrders.length > 0 ? (
                  <ul className={styles.orderList}>
                    {receivedOrders.map((order) => (
                      <OrderRow
                        key={order._id}
                        order={order}
                        counterpart={order.buyer}
                        counterpartLabel="Покупець"
                        role="seller"
                        onConfirm={handleConfirmOrder}
                        onCancel={handleCancelOrder}
                        isUpdating={orderMutation.isPending}
                      />
                    ))}
                  </ul>
                ) : (
                  <p className={gridStyles.empty}>Поки що немає замовлень на твої книги</p>
                ),
            },
            {
              key: 'exchanges',
              label: (
                <>
                  Мої обміни <span className={styles.tabCount}>{exchanges.length}</span>
                </>
              ),
              content:
                exchanges.length > 0 ? (
                  <ul className={styles.orderList}>
                    {exchanges.map((exchange) => (
                      <ExchangeRow
                        key={exchange._id}
                        exchange={exchange}
                        meId={userId ?? ''}
                        onCancel={handleCancelExchange}
                        isUpdating={exchangeMutation.isPending}
                      />
                    ))}
                  </ul>
                ) : (
                  <p className={gridStyles.empty}>Поки що немає пропозицій обміну</p>
                ),
            },
          ]}
        />
      </div>
    </div>
  );
}
