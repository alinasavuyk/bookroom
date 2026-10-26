'use client';
import { useState, ChangeEvent } from 'react';
import Image from 'next/image';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProfile, changePassword } from '@/lib/api-client';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { useToast } from '@/components/ToastProvider';
import PasswordInput from '@/components/PasswordInput';
import formStyles from '@/styles/Form.module.css';
import styles from '@/app/profile/ProfilePage.module.css';

const MAX_AVATAR_SIZE = 10 * 1024 * 1024; // 10 МБ — фото з телефону часто важать 5-8 МБ

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

interface ProfileEditFormProps {
  userId: string;
  profile: { name: string; bio: string; avatar: string };
  onCancel: () => void;
  onSaved: () => void;
}

export default function ProfileEditForm({ userId, profile, onCancel, onSaved }: ProfileEditFormProps) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState('');
  const [message, setMessage] = useState('');

  const updateProfileMutation = useMutation({
    mutationFn: (data: { name: string; bio: string; avatar: string }) => updateProfile(userId, data),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      changePassword(userId, data.currentPassword, data.newPassword),
  });

  const formik = useFormik({
    initialValues: {
      name: profile.name,
      bio: profile.bio,
      avatar: profile.avatar,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: profileSchema,
    onSubmit: async (values) => {
      setMessage('');

      try {
        let avatarUrl = values.avatar;
        if (avatarFile) {
          avatarUrl = await uploadImageToCloudinary(avatarFile);
        }

        await updateProfileMutation.mutateAsync({ name: values.name, bio: values.bio, avatar: avatarUrl });

        if (values.newPassword) {
          await changePasswordMutation.mutateAsync({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
          });
        }

        queryClient.invalidateQueries({ queryKey: ['user', userId] });
        showToast('Профіль збережено!');
        onSaved();
      } catch (err) {
        setMessage(err instanceof Error ? err.message : 'Сталася помилка при збереженні.');
      }
    },
  });

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      // file.type іноді порожній на деяких мобільних (камера/галерея не завжди
      // проставляють MIME-тип) — тоді довіряємо вибору через accept="image/*"
      // замість хибно блокувати валідне фото
      if (file.type && !file.type.startsWith('image/')) {
        const errorMessage = 'Файл має бути зображенням';
        setAvatarError(errorMessage);
        showToast(errorMessage, 'error');
        return;
      }
      if (file.size > MAX_AVATAR_SIZE) {
        const errorMessage = 'Розмір файлу не більше 10 МБ';
        setAvatarError(errorMessage);
        showToast(errorMessage, 'error');
        return;
      }
    }
    setAvatarError('');
    setAvatarFile(file);
  };

  return (
    <>
      {message && <p className={styles.message}>{message}</p>}

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
            <div className={styles.avatarPlaceholder}>{formik.values.name.charAt(0).toUpperCase() || '?'}</div>
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
          <button type="button" onClick={onCancel} className={styles.cancelButton}>
            Скасувати
          </button>
        </div>
      </form>
    </>
  );
}
