'use client';
import { useState, ChangeEvent } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { isNonEmpty } from '@/lib/validation';
import { BOOK_GENRES, STANDARD_BOOK_GENRES, OTHER_GENRE } from '@/lib/genres';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { TbX } from '@/lib/icons';
import formStyles from '@/styles/Form.module.css';
import styles from './BookForm.module.css';

export interface BookFormSubmitValues {
  title: string;
  author: string;
  description: string;
  price: number;
  genres: string[];
  type: 'sale' | 'exchange' | 'both';
  images: string[];
  coverImage: string;
}

export interface BookFormInitialValues {
  title?: string;
  author?: string;
  description?: string;
  price?: number;
  genres?: string[];
  type?: 'sale' | 'exchange' | 'both';
  images?: string[];
}

interface BookFormProps {
  title: string;
  initialValues?: BookFormInitialValues;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (values: BookFormSubmitValues) => Promise<void>;
}

const bookFormSchema = Yup.object({
  title: Yup.string().trim().required('Вкажи назву книги'),
  author: Yup.string().trim().required('Вкажи автора'),
  genres: Yup.array().of(Yup.string()).min(1, 'Обери хоча б один жанр'),
});

export default function BookForm({ title, initialValues, submitLabel, submittingLabel, onSubmit }: BookFormProps) {
  const initialStandardGenres = (initialValues?.genres ?? []).filter((g) =>
    (STANDARD_BOOK_GENRES as readonly string[]).includes(g)
  );
  const initialCustomGenre = (initialValues?.genres ?? []).find(
    (g) => !(STANDARD_BOOK_GENRES as readonly string[]).includes(g)
  );

  const [customGenre, setCustomGenre] = useState(initialCustomGenre ?? '');
  const [wantsSale, setWantsSale] = useState(
    initialValues?.type === 'sale' || initialValues?.type === 'both'
  );
  const [wantsExchange, setWantsExchange] = useState(
    initialValues?.type === 'exchange' || initialValues?.type === 'both'
  );
  const [existingImages, setExistingImages] = useState<string[]>(initialValues?.images ?? []);
  const [imageFiles, setImageFiles] = useState<{ file: File; previewUrl: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formik = useFormik({
    initialValues: {
      title: initialValues?.title ?? '',
      author: initialValues?.author ?? '',
      description: initialValues?.description ?? '',
      price: initialValues?.price ?? 0,
      genres: initialCustomGenre ? [...initialStandardGenres, OTHER_GENRE] : initialStandardGenres,
    },
    validationSchema: bookFormSchema,
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

      let newImageUrls: string[] = [];
      if (imageFiles.length > 0) {
        setUploading(true);
        try {
          newImageUrls = await Promise.all(imageFiles.map(({ file }) => uploadImageToCloudinary(file)));
        } catch {
          setUploading(false);
          setError('Не вдалося завантажити фото');
          return;
        }
        setUploading(false);
      }

      const images = [...existingImages, ...newImageUrls];

      setSubmitting(true);
      try {
        await onSubmit({
          ...values,
          genres: finalGenres,
          type: getType(),
          images,
          coverImage: images[0] ?? '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Сталася помилка при збереженні.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const toggleGenre = (genre: string) => {
    const genres = formik.values.genres.includes(genre)
      ? formik.values.genres.filter((g) => g !== genre)
      : [...formik.values.genres, genre];
    formik.setFieldValue('genres', genres);
  };

  const showCustomGenreField = formik.values.genres.includes(OTHER_GENRE);
  const busy = formik.isSubmitting || uploading || submitting;

  return (
    <form onSubmit={formik.handleSubmit} noValidate className={`${formStyles.form} ${formStyles.formWide}`}>
      <h1 className={formStyles.title}>{title}</h1>

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

      {(existingImages.length > 0 || imageFiles.length > 0) && (
        <ul className={styles.imagePreviewList}>
          {existingImages.map((url, index) => (
            <li key={url} className={styles.imagePreviewItem}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className={styles.imagePreviewThumb} />
              <button
                type="button"
                onClick={() => removeExistingImage(index)}
                className={styles.imagePreviewRemove}
                aria-label="Прибрати фото"
              >
                <TbX />
              </button>
              {index === 0 && <span className={styles.imagePreviewBadge}>Обкладинка</span>}
            </li>
          ))}
          {imageFiles.map(({ previewUrl }, index) => (
            <li key={previewUrl} className={styles.imagePreviewItem}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="" className={styles.imagePreviewThumb} />
              <button
                type="button"
                onClick={() => removeNewImage(index)}
                className={styles.imagePreviewRemove}
                aria-label="Прибрати фото"
              >
                <TbX />
              </button>
              {existingImages.length === 0 && index === 0 && (
                <span className={styles.imagePreviewBadge}>Обкладинка</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <ul className={formStyles.checkboxRow}>
        <li>
          <label className={formStyles.checkboxLabel}>
            <input type="checkbox" checked={wantsSale} onChange={(e) => setWantsSale(e.target.checked)} />
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

      <button type="submit" disabled={busy} className={formStyles.submitButton}>
        {uploading ? 'Завантаження фото...' : busy ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}
