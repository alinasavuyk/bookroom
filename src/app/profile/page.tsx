'use client';
import { useEffect, useState, FormEvent, ChangeEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import BookCard from '@/components/BookCard';
import { BookSummary } from '@/types/models';
import { isValidPassword, isNonEmpty } from '@/lib/validation';
import PasswordInput from '@/components/PasswordInput';
import formStyles from '@/styles/Form.module.css';
import gridStyles from '@/styles/BookGrid.module.css';
import styles from './ProfilePage.module.css';

interface ProfileData {
  name: string;
  bio: string;
  avatar: string;
}

interface FieldErrors {
  name?: string;
  avatar?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 МБ

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData>({ name: '', bio: '', avatar: '' });
  const [myBooks, setMyBooks] = useState<BookSummary[]>([]);
  const [savedBooks, setSavedBooks] = useState<BookSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<ProfileData>({ name: '', bio: '', avatar: '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (!session?.user?.id) return;

    Promise.all([
      fetch(`/api/users/${session.user.id}`).then((res) => res.json()),
      fetch(`/api/books?owner=${session.user.id}`).then((res) => res.json()),
    ]).then(([userData, ownedBooks]) => {
      const loaded = { name: userData.name ?? '', bio: userData.bio ?? '', avatar: userData.avatar ?? '' };
      setProfile(loaded);
      setEditData(loaded);
      setMyBooks(ownedBooks);
      setSavedBooks(userData.savedBooks ?? []);
      setLoading(false);
    });
  }, [session]);

  const startEditing = () => {
    setEditData(profile);
    setAvatarFile(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setFieldErrors({});
    setMessage('');
    setEditing(true);
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};

    if (!isNonEmpty(editData.name)) errors.name = "Вкажи ім'я";

    if (avatarFile) {
      if (!avatarFile.type.startsWith('image/')) {
        errors.avatar = 'Файл має бути зображенням';
      } else if (avatarFile.size > MAX_AVATAR_SIZE) {
        errors.avatar = 'Розмір файлу не більше 5 МБ';
      }
    }

    if (currentPassword || newPassword || confirmPassword) {
      if (!isNonEmpty(currentPassword)) errors.currentPassword = 'Введи поточний пароль';
      if (!isValidPassword(newPassword)) errors.newPassword = 'Новий пароль має містити щонайменше 6 символів';
      if (newPassword !== confirmPassword) errors.confirmPassword = 'Паролі не збігаються';
    }

    return errors;
  };

  const uploadAvatar = async (): Promise<string> => {
    const data = new FormData();
    data.append('file', avatarFile as File);
    data.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET as string);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: data }
    );
    const result = await res.json();
    return result.secure_url; // посилання на завантажене фото
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    setMessage('');

    let avatarUrl = editData.avatar;
    if (avatarFile) {
      avatarUrl = await uploadAvatar();
    }

    const profileRes = await fetch(`/api/users/${session.user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editData.name, bio: editData.bio, avatar: avatarUrl }),
    });

    let passwordOk = true;
    if (newPassword) {
      const passRes = await fetch(`/api/users/${session.user.id}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      passwordOk = passRes.ok;
      if (!passwordOk) {
        const passData = await passRes.json();
        setMessage(passData.error || 'Не вдалося змінити пароль');
      }
    }

    setSaving(false);

    if (!profileRes.ok) {
      setMessage('Сталася помилка при збереженні.');
      return;
    }

    const updatedProfile = { name: editData.name, bio: editData.bio, avatar: avatarUrl };
    setProfile(updatedProfile);

    if (passwordOk) {
      setAvatarFile(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setEditing(false);
      setMessage('Профіль збережено!');
    }
  };

  if (status === 'loading' || loading) {
    return <p className={formStyles.footerText}>Завантаження...</p>;
  }

  if (status !== 'authenticated') {
    return null;
  }

  return (
    <div>
      {message && <p className={styles.message}>{message}</p>}

      {!editing ? (
        <div className={styles.header}>
          {profile.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar} alt={profile.name} className={styles.avatarLarge} />
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
        <form onSubmit={handleSubmit} noValidate className={`${formStyles.form} ${formStyles.formNarrow}`}>
          <h1 className={formStyles.title}>Редагування профілю</h1>

          <div className={styles.avatarRow}>
            {editData.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={editData.avatar} alt={editData.name} className={styles.avatarPreview} />
            ) : (
              <div className={styles.avatarPlaceholder}>{editData.name.charAt(0).toUpperCase() || '?'}</div>
            )}
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={(e: ChangeEvent<HTMLInputElement>) => setAvatarFile(e.target.files?.[0] ?? null)}
                className={formStyles.field}
              />
              {fieldErrors.avatar && <p className={formStyles.errorText}>{fieldErrors.avatar}</p>}
            </div>
          </div>

          <label className={formStyles.label}>
            <span className={formStyles.labelText}>Ім&apos;я</span>
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className={formStyles.field}
            />
            {fieldErrors.name && <p className={formStyles.errorText}>{fieldErrors.name}</p>}
          </label>

          <label className={formStyles.label}>
            <span className={formStyles.labelText}>Про себе</span>
            <textarea
              value={editData.bio}
              onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
              className={formStyles.field}
              rows={4}
            />
          </label>

          <div className={styles.passwordSection}>
            <p className={styles.passwordTitle}>Змінити пароль (необов&apos;язково)</p>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>Поточний пароль</span>
              <PasswordInput
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={formStyles.field}
              />
              {fieldErrors.currentPassword && <p className={formStyles.errorText}>{fieldErrors.currentPassword}</p>}
            </label>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>Новий пароль</span>
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={formStyles.field}
              />
              {fieldErrors.newPassword && <p className={formStyles.errorText}>{fieldErrors.newPassword}</p>}
            </label>
            <label className={formStyles.label}>
              <span className={formStyles.labelText}>Підтвердіть новий пароль</span>
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={formStyles.field}
              />
              {fieldErrors.confirmPassword && <p className={formStyles.errorText}>{fieldErrors.confirmPassword}</p>}
            </label>
          </div>

          <div className={styles.actionsRow}>
            <button type="submit" disabled={saving} className={formStyles.submitButton}>
              {saving ? 'Збереження...' : 'Зберегти'}
            </button>
            <button type="button" onClick={() => setEditing(false)} className={styles.cancelButton}>
              Скасувати
            </button>
          </div>
        </form>
      )}

      <section>
        <h2 className={styles.sectionHeading}>Мої книги</h2>
        {myBooks.length > 0 ? (
          <div className={gridStyles.grid}>
            {myBooks.map((book) => (
              <BookCard key={book._id} book={book} />
            ))}
          </div>
        ) : (
          <p className={gridStyles.empty}>Ти ще не додала жодної книги</p>
        )}
      </section>

      <section>
        <h2 className={styles.sectionHeading}>Збережені книги</h2>
        {savedBooks.length > 0 ? (
          <div className={gridStyles.grid}>
            {savedBooks.map((book) => (
              <BookCard
                key={book._id}
                book={book}
                initialSaved
                onToggleSaved={(bookId, saved) => {
                  if (!saved) setSavedBooks((prev) => prev.filter((b) => b._id !== bookId));
                }}
              />
            ))}
          </div>
        ) : (
          <p className={gridStyles.empty}>Немає збережених книг</p>
        )}
      </section>
    </div>
  );
}
