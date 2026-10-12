'use client';
import { useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation } from '@tanstack/react-query';
import { isNonEmpty } from '@/lib/validation';
import { BOOK_GENRES, OTHER_GENRE } from '@/lib/genres';
import { createBook } from '@/lib/api-client';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { TbX } from '@/lib/icons';
import { useToast } from '@/components/ToastProvider';
import { useRequireAuth } from '@/lib/useRequireAuth';
import formStyles from '@/styles/Form.module.css';
import styles from './SellPage.module.css';

const sellSchema = Yup.object({
  title: Yup.string().trim().required('Вкажи назву книги'),
  author: Yup.string().trim().required('Вкажи автора'),
  genres: Yup.array().of(Yup.string()).min(1, 'Обери хоча б один жанр'),
});

export default function SellPage() {
  const status = useRequireAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [customGenre, setCustomGenre] = useState('');
  const [wantsSale, setWantsSale] = useState(false);
  const [wantsExchange, setWantsExchange] = useState(false);
  const [imageFiles, setImageFiles] = useState<{ file: File; previewUrl: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: createBook,
  });

  const getType = () => {
    if (wantsSale && wantsExchange) return 'both';
    if (wantsSale) return 'sale';
    if (wantsExchange) return 'exchange';
    return 'sale';
  };

  const handleImagesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    const withPreviews = files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setImageFiles((prev) => [...prev, ...withPreviews]);
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formik = useFormik({
    initialValues: {
      title: '',
      author: '',
      description: '',
      price: 0,
      genres: [] as string[],
    },
    validationSchema: sellSchema,
    onSubmit: async (values) => {
      setError('');

      const showCustomGenreField = values.genres.includes(OTHER_GENRE);
      const finalGenres = values.genres.filter((g) => g !== OTHER_GENRE);
      if (showCustomGenreField && isNonEmpty(customGenre)) {
        finalGenres.push(customGenre.trim());
      }

      if (finalGenres.length === 0) {
        formik.setFieldError('genres', 'Обери хоча б один жанр');
        return;
      }

      if (!wantsSale && !wantsExchange) {
        setError('Оберіть хоча б один варіант: продаж або обмін');
        return;
      }

      if (wantsSale && (!values.price || values.price <= 0)) {
        setError('Вкажи ціну для продажу книги');
        return;
      }

      let images: string[] = [];
      if (imageFiles.length > 0) {
        setUploading(true);
        try {
          images = await Promise.all(imageFiles.map(({ file }) => uploadImageToCloudinary(file)));
        } catch {
          setUploading(false);
          setError('Не вдалося завантажити фото');
          return;
        }
        setUploading(false);
      }

      mutation.mutate(
        { ...values, genres: finalGenres, type: getType(), images, coverImage: images[0] ?? '' },
        {
          onSuccess: () => {
            showToast('Книгу додано!');
            router.push('/profile');
          },
          onError: (err: Error) => setError(err.message),
        }
      );
    },
  });

  const toggleGenre = (genre: string) => {
    const genres = formik.values.genres.includes(genre)
      ? formik.values.genres.filter((g) => g !== genre)
      : [...formik.values.genres, genre];
    formik.setFieldValue('genres', genres);
  };

  const showCustomGenreField = formik.values.genres.includes(OTHER_GENRE);
  const submitting = formik.isSubmitting || uploading || mutation.isPending;

  if (status !== 'authenticated') {
    return null;
  }

  return (
    <form onSubmit={formik.handleSubmit} noValidate className={`${formStyles.form} ${formStyles.formWide}`}>
      <h1 className={formStyles.title}>Продати книгу</h1>

      {error && <p className={formStyles.errorText}>{error}</p>}

      <label className={formStyles.label}>
        <span className={formStyles.labelText}>Назва книги</span>
        <input
          type="text"
          name="title"
          value={formik.values.title}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={formStyles.field}
        />
        {formik.touched.title && formik.errors.title && (
          <p className={formStyles.errorText}>{formik.errors.title}</p>
        )}
      </label>

      <label className={formStyles.label}>
        <span className={formStyles.labelText}>Автор</span>
        <input
          type="text"
          name="author"
          value={formik.values.author}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={formStyles.field}
        />
        {formik.touched.author && formik.errors.author && (
          <p className={formStyles.errorText}>{formik.errors.author}</p>
        )}
      </label>

      <label className={formStyles.label}>
        <span className={formStyles.labelText}>Опис</span>
        <textarea
          name="description"
          value={formik.values.description}
          onChange={formik.handleChange}
          className={formStyles.field}
        />
      </label>

      <div className={formStyles.label}>
        <span className={formStyles.labelText}>Жанри (можна кілька)</span>
        <ul className={formStyles.checkboxColumn}>
          {BOOK_GENRES.map((genre) => (
            <li key={genre}>
              <label className={formStyles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formik.values.genres.includes(genre)}
                  onChange={() => toggleGenre(genre)}
                />
                {genre}
              </label>
            </li>
          ))}
        </ul>
        {showCustomGenreField && (
          <input
            type="text"
            placeholder="Свій жанр"
            value={customGenre}
            onChange={(e) => setCustomGenre(e.target.value)}
            className={formStyles.field}
            style={{ marginTop: '0.5rem' }}
          />
        )}
        {typeof formik.errors.genres === 'string' && (
          <p className={formStyles.errorText}>{formik.errors.genres}</p>
        )}
      </div>

      <label className={formStyles.label}>
        <span className={formStyles.labelText}>Ціна (грн)</span>
        <input
          type="number"
          name="price"
          value={formik.values.price}
          onChange={formik.handleChange}
          className={formStyles.field}
        />
      </label>
      <label className={formStyles.label}>
        <span className={formStyles.labelText}>Фото книги (можна кілька, перше стане обкладинкою)</span>
        <input type="file" accept="image/*" multiple onChange={handleImagesChange} className={formStyles.field} />
      </label>

      {imageFiles.length > 0 && (
        <ul className={styles.imagePreviewList}>
          {imageFiles.map(({ previewUrl }, index) => (
            <li key={previewUrl} className={styles.imagePreviewItem}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="" className={styles.imagePreviewThumb} />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className={styles.imagePreviewRemove}
                aria-label="Прибрати фото"
              >
                <TbX />
              </button>
              {index === 0 && <span className={styles.imagePreviewBadge}>Обкладинка</span>}
            </li>
          ))}
        </ul>
      )}
      <ul className={formStyles.checkboxRow}>
        <li>
          <label className={formStyles.checkboxLabel}>
            <input
              type="checkbox"
              checked={wantsSale}
              onChange={(e) => setWantsSale(e.target.checked)}
            />
            Продаж
          </label>
        </li>

        <li>
          <label className={formStyles.checkboxLabel}>
            <input
              type="checkbox"
              checked={wantsExchange}
              onChange={(e) => setWantsExchange(e.target.checked)}
            />
            Обмін
          </label>
        </li>
      </ul>
      <button type="submit" disabled={submitting} className={formStyles.submitButton}>
        {uploading ? 'Завантаження фото...' : submitting ? 'Додавання...' : 'Додати книгу'}
      </button>
    </form>
  );
}
