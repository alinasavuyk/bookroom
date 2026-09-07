'use client';
import { useState, FormEvent, ChangeEvent } from 'react';
import formStyles from '@/styles/Form.module.css';

interface BookFormData {
  title: string;
  author: string;
  description: string;
  genre: string;
  price: number;
  type: string;
}

export default function SellPage() {
  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    author: '',
    description: '',
    genre: 'Роман',
    price: 0,
    type: 'sale',
  });
  const [wantsSale, setWantsSale] = useState(false);
  const [wantsExchange, setWantsExchange] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const getType = () => {
    if (wantsSale && wantsExchange) return 'both';
    if (wantsSale) return 'sale';
    if (wantsExchange) return 'exchange';
    return 'sale';
  };

  const uploadImage = async (): Promise<string> => {
    const data = new FormData();
    data.append('file', imageFile as File);
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

    if (!wantsSale && !wantsExchange) {
      alert('Оберіть хоча б один варіант: продаж або обмін');
      return;
    }

    let coverImageUrl = '';
    if (imageFile) {
      setUploading(true);
      coverImageUrl = await uploadImage();
      setUploading(false);
    }

    const finalData = {
      ...formData,
      type: getType(),
      coverImage: coverImageUrl,
    };

    const res = await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalData),
    });

    if (res.ok) {
      alert(`Книгу "${formData.title}" успішно додано!`);
    } else {
      alert('Сталася помилка при додаванні книги.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`${formStyles.form} ${formStyles.formWide}`}>
      <label className={formStyles.label}>
        <span className={formStyles.labelText}>Назва книги</span>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className={formStyles.field}
          required
        />
      </label>

      <label className={formStyles.label}>
        <span className={formStyles.labelText}>Автор</span>
        <input
          type="text"
          value={formData.author}
          onChange={(e) => setFormData({ ...formData, author: e.target.value })}
          className={formStyles.field}
          required
        />
      </label>

      <label className={formStyles.label}>
        <span className={formStyles.labelText}>Опис</span>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className={formStyles.field}
        />
      </label>

      <label className={formStyles.label}>
        <span className={formStyles.labelText}>Жанр</span>
        <select
          value={formData.genre}
          onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
          className={formStyles.field}
        >
          <option value="Фантастика">Фантастика</option>
          <option value="Роман">Роман</option>
          <option value="Наукова література">Наукова література</option>
          <option value="Дитяча">Дитяча</option>
        </select>
      </label>

      <label className={formStyles.label}>
        <span className={formStyles.labelText}>Ціна (грн)</span>
        <input
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
          className={formStyles.field}
        />
      </label>
      <label className={formStyles.label}>
        <span className={formStyles.labelText}>Обкладинка книги</span>
        <input
          type="file"
          accept="image/*"
          onChange={(e: ChangeEvent<HTMLInputElement>) => setImageFile(e.target.files?.[0] ?? null)}
          className={formStyles.field}
        />
      </label>
      <div className={formStyles.checkboxRow}>
        <label className={formStyles.checkboxLabel}>
          <input
            type="checkbox"
            checked={wantsSale}
            onChange={(e) => setWantsSale(e.target.checked)}
          />
          Продаж
        </label>

        <label className={formStyles.checkboxLabel}>
          <input
            type="checkbox"
            checked={wantsExchange}
            onChange={(e) => setWantsExchange(e.target.checked)}
          />
          Обмін
        </label>
      </div>
      <button type="submit" disabled={uploading} className={formStyles.submitButton}>
        {uploading ? 'Завантаження фото...' : 'Додати книгу'}
      </button>
    </form>
  );
}
