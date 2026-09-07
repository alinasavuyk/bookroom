'use client';
import { useState } from "react";
export default function SellPage() {
const [formData, setFormData] = useState({
  title: '',
  author: '',
  description: '',
  genre: 'Роман',
  price: 0,
  type: 'sale',
});
const [wantsSale, setWantsSale] = useState(false);
const [wantsExchange, setWantsExchange] = useState(false);
const [imageFile, setImageFile] =useState(null);
const [uploading, setUploading] =useState(false)

const getType = () => {
    if (wantsSale && wantsExchange) return 'both';
    if (wantsSale) return 'sale';
    if (wantsExchange) return 'exchange';
    return 'sale'; 
  };
  const uploadImage = async () => {
  const data = new FormData();
  data.append('file', imageFile);
  data.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: data }
  );
  const result = await res.json();
  return result.secure_url; // посилання на завантажене фото
};
const handleSubmit = async (e) => {
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
  <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 flex flex-col gap-4">
      <label className="block">
        <span className="mb-1 block">Назва книги</span>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="border p-2 w-full rounded"
          required
        />
      </label>

      <label className="block">
        <span className="mb-1 block">Автор</span>
        <input
          type="text"
          value={formData.author}
          onChange={(e) => setFormData({ ...formData, author: e.target.value })}
          className="border p-2 w-full rounded"
          required
        />
      </label>

      <label className="block">
        <span className="mb-1 block">Опис</span>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="border p-2 w-full rounded"
        />
      </label>

      <label className="block">
        <span className="mb-1 block">Жанр</span>
        <select
          value={formData.genre}
          onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
          className="border p-2 w-full rounded"
        >
          <option value="Фантастика">Фантастика</option>
          <option value="Роман">Роман</option>
          <option value="Наукова література">Наукова література</option>
          <option value="Дитяча">Дитяча</option>
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block">Ціна (грн)</span>
        <input
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
          className="border p-2 w-full rounded"
        />
      </label>
<label className="block">
  <span className="mb-1 block">Обкладинка книги</span>
  <input
    type="file"
    accept="image/*"
    onChange={(e) => setImageFile(e.target.files[0])}
    className="border p-2 w-full rounded"
  />
</label>
      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={wantsSale}
            onChange={(e) => setWantsSale(e.target.checked)}
          />
          Продаж
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={wantsExchange}
            onChange={(e) => setWantsExchange(e.target.checked)}
          />
          Обмін
        </label>
      </div>
      <button
  type="submit"
  disabled={uploading}
  className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
>
  {uploading ? 'Завантаження фото...' : 'Додати книгу'}
</button>
    </form>
  );
}