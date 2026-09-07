'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await res.json();

    if (res.ok) {
      router.push('/auth/signin');
    } else {
      setError(data.error || 'Сталася помилка. Спробуй ще раз.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto p-4 flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-center">Реєстрація</h1>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <label className="block">
        <span className="mb-1 block">Ім&apos;я</span>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="border p-2 w-full rounded"
          required
        />
      </label>

      <label className="block">
        <span className="mb-1 block">Email</span>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="border p-2 w-full rounded"
          required
        />
      </label>

      <label className="block">
        <span className="mb-1 block">Пароль</span>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="border p-2 w-full rounded"
          required
          minLength={6}
        />
      </label>

      <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
        Зареєструватись
      </button>

      <p className="text-center text-sm text-gray-500">
        Вже маєш акаунт?{' '}
        <Link href="/auth/signin" className="text-brand-purple underline">
          Увійти
        </Link>
      </p>
    </form>
  );
}
