'use client';
import { useState, useEffect, ChangeEvent, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import BookCard from '@/components/BookCard';
import Loader from '@/components/Loader';
import Modal from '@/components/Modal';
import PasswordInput from '@/components/PasswordInput';
import Tabs from '@/components/Tabs';
import { OrderDTO } from '@/types/models';
import {
  fetchUserProfile,
  fetchBooksByOwner,
  updateProfile,
  changePassword,
  fetchOrders,
  updateOrderStatus,
} from '@/lib/api-client';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { useToast } from '@/components/ToastProvider';
import formStyles from '@/styles/Form.module.css';
import gridStyles from '@/styles/BookGrid.module.css';
import styles from './ProfilePage.module.css';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 МБ

// Однонаправлена залежність від newPassword — інакше Yup ловить циклічну
// залежність, якщо поля посилаються одне на одного через .when()
const profileSchema = Yup.object({
  name: Yup.string().trim().required("Вкажи ім'я"),
  bio: Yup.string(),
  newPassword: Yup.string().min(6, 'Новий пароль має містити щонайменше 6 символів'),
  currentPassword: Yup.string().when('newPassword', {
    is: (newPassword: string) => !!newPassword,
    then: (schema) => schema.required('Введи поточний пароль'),
  }),
  confirmPassword: Yup.string().when('newPassword', {
    is: (newPassword: string) => !!newPassword,
    then: (schema) =>
      schema.oneOf([Yup.ref('newPassword')], 'Паролі не збігаються').required('Підтвердь новий пароль'),
  }),
});

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

function OrderRow({
  order,
  counterpart,
  counterpartLabel,
  role,
  onConfirm,
  onCancel,
  isUpdating,
}: {
  order: OrderDTO;
  counterpart: OrderDTO['buyer'];
  counterpartLabel: string;
  role: 'buyer' | 'seller';
  onConfirm: (orderId: string) => void;
  onCancel: (orderId: string) => void;
  isUpdating: boolean;
}) {
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

  const { data: myPurchases = [] } = useQuery({
    queryKey: ['orders', 'buyer', userId],
    queryFn: () => fetchOrders('buyer'),
    enabled: !!userId,
  });

  const { data: receivedOrders = [] } = useQuery({
    queryKey: ['orders', 'seller', userId],
    queryFn: () => fetchOrders('seller'),
    enabled: !!userId,
  });

  const orderMutation = useMutation({
    mutationFn: ({ orderId, action }: { orderId: string; action: 'confirm' | 'cancel' }) =>
      updateOrderStatus(orderId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'buyer', userId] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'seller', userId] });
    },
    onError: (err: Error) => showToast(err.message, 'error'),
  });

  const handleConfirmOrder = (orderId: string) => orderMutation.mutate({ orderId, action: 'confirm' });
  const handleCancelOrder = (orderId: string) => orderMutation.mutate({ orderId, action: 'cancel' });

  const [editing, setEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState('');
  const [message, setMessage] = useState('');

  const updateProfileMutation = useMutation({
    mutationFn: (data: { name: string; bio: string; avatar: string }) => updateProfile(userId!, data),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      changePassword(userId!, data.currentPassword, data.newPassword),
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: profile?.name ?? '',
      bio: profile?.bio ?? '',
      avatar: profile?.avatar ?? '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: profileSchema,
    onSubmit: async (values) => {
      setMessage('');
      if (!userId) return;

      let avatarUrl = values.avatar;
      if (avatarFile) {
        const data = new FormData();
        data.append('file', avatarFile);
        data.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET as string);
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          { method: 'POST', body: data }
        );
        const result = await res.json();
        avatarUrl = result.secure_url;
      }

      try {
        await updateProfileMutation.mutateAsync({ name: values.name, bio: values.bio, avatar: avatarUrl });

        if (values.newPassword) {
          await changePasswordMutation.mutateAsync({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
          });
        }

        queryClient.invalidateQueries({ queryKey: ['user', userId] });
        setAvatarFile(null);
        setEditing(false);
        showToast('Профіль збережено!');
      } catch (err) {
        setMessage(err instanceof Error ? err.message : 'Сталася помилка при збереженні.');
      }
    },
  });

  const startEditing = () => {
    formik.resetForm();
    setAvatarFile(null);
    setAvatarError('');
    setMessage('');
    setEditing(true);
  };

  const dismissWelcome = () => setShowWelcome(false);

  const handleFillNow = () => {
    setShowWelcome(false);
    startEditing();
  };

  const cancelEditing = () => {
    formik.resetForm();
    setAvatarFile(null);
    setAvatarError('');
    setEditing(false);
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      if (!file.type.startsWith('image/')) {
        setAvatarError('Файл має бути зображенням');
        return;
      }
      if (file.size > MAX_AVATAR_SIZE) {
        setAvatarError('Розмір файлу не більше 5 МБ');
        return;
      }
    }
    setAvatarError('');
    setAvatarFile(file);
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

      {message && <p className={styles.message}>{message}</p>}

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
            <button type="button" onClick={startEditing} className={styles.editButton}>
              Редагувати профіль
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={formik.handleSubmit} noValidate className={`${formStyles.form} ${formStyles.formNarrow}`}>
          <h1 className={formStyles.title}>Редагування профілю</h1>

          <div className={styles.avatarRow}>
            {avatarFile ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={URL.createObjectURL(avatarFile)} alt="" className={styles.avatarPreview} />
            ) : formik.values.avatar ? (
              <Image
                src={formik.values.avatar}
                alt={formik.values.name}
                width={64}
                height={64}
                className={styles.avatarPreview}
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {formik.values.name.charAt(0).toUpperCase() || '?'}
              </div>
            )}
            <div>
              <input type="file" accept="image/*" onChange={handleAvatarChange} className={formStyles.field} />
              {avatarError && <p className={formStyles.errorText}>{avatarError}</p>}
            </div>
          </div>

          <label className={formStyles.label}>
            <span className={formStyles.labelText}>Ім&apos;я</span>
            <input
              type="text"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={formStyles.field}
            />
            {formik.touched.name && formik.errors.name && (
              <p className={formStyles.errorText}>{formik.errors.name}</p>
            )}
          </label>

          <label className={formStyles.label}>
            <span className={formStyles.labelText}>Про себе</span>
            <textarea
              name="bio"
              value={formik.values.bio}
              onChange={formik.handleChange}
              className={formStyles.field}
              rows={4}
            />
          </label>

          <div className={styles.passwordSection}>
            <p className={styles.passwordTitle}>Змінити пароль (необов&apos;язково)</p>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>Поточний пароль</span>
              <PasswordInput
                name="currentPassword"
                value={formik.values.currentPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={formStyles.field}
              />
              {formik.touched.currentPassword && formik.errors.currentPassword && (
                <p className={formStyles.errorText}>{formik.errors.currentPassword}</p>
              )}
            </label>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>Новий пароль</span>
              <PasswordInput
                name="newPassword"
                value={formik.values.newPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={formStyles.field}
              />
              {formik.touched.newPassword && formik.errors.newPassword && (
                <p className={formStyles.errorText}>{formik.errors.newPassword}</p>
              )}
            </label>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>Підтвердіть новий пароль</span>
              <PasswordInput
                name="confirmPassword"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={formStyles.field}
              />
              {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                <p className={formStyles.errorText}>{formik.errors.confirmPassword}</p>
              )}
            </label>
          </div>

          <div className={styles.actionsRow}>
            <button type="submit" disabled={formik.isSubmitting} className={formStyles.submitButton}>
              {formik.isSubmitting ? 'Збереження...' : 'Зберегти'}
            </button>
            <button type="button" onClick={cancelEditing} className={styles.cancelButton}>
              Скасувати
            </button>
          </div>
        </form>
      )}

      <div className={styles.tabsWrap}>
      <Tabs
        tabs={[
          {
            key: 'myBooks',
            label: 'Мої книги',
            content:
              myBooks.length > 0 ? (
                <ul className={gridStyles.grid}>
                  {myBooks.map((book) => (
                    <li key={book._id}>
                      <BookCard book={book} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={gridStyles.empty}>Ти ще не додала жодної книги</p>
              ),
          },
          {
            key: 'saved',
            label: 'Збережені книги',
            content:
              profile.savedBooks.length > 0 ? (
                <ul className={gridStyles.grid}>
                  {profile.savedBooks.map((book) => (
                    <li key={book._id}>
                      <BookCard
                        book={book}
                        initialSaved
                        onToggleSaved={(bookId, saved) => {
                          if (!saved && userId) {
                            queryClient.setQueryData<typeof profile>(['user', userId], (prev) =>
                              prev
                                ? { ...prev, savedBooks: prev.savedBooks.filter((b) => b._id !== bookId) }
                                : prev
                            );
                          }
                        }}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={gridStyles.empty}>Немає збережених книг</p>
              ),
          },
          {
            key: 'purchases',
            label: 'Мої покупки',
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
            label: 'Отримані замовлення',
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
        ]}
      />
      </div>
    </div>
  );
}
