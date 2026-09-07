'use client';
import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isValidEmail, isNonEmpty } from '@/lib/validation';
import PasswordInput from '@/components/PasswordInput';
import formStyles from '@/styles/Form.module.css';

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function SignInPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!isValidEmail(formData.email)) errors.email = 'Введи коректний email';
    if (!isNonEmpty(formData.password)) errors.password = 'Введи пароль';
    return errors;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);

    const result = await signIn('credentials', {
      email: formData.email,
      password: formData.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Невірний email або пароль.');
    } else {
      router.push('/');
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className={`${formStyles.form} ${formStyles.formNarrow}`}>
      <h1 className={formStyles.title}>Вхід</h1>

      {error && <p className={formStyles.errorText}>{error}</p>}

      <label className={formStyles.label}>
        <span className={formStyles.labelText}>Email</span>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className={formStyles.field}
        />
        {fieldErrors.email && <p className={formStyles.errorText}>{fieldErrors.email}</p>}
      </label>

      <label className={formStyles.label}>
        <span className={formStyles.labelText}>Пароль</span>
        <PasswordInput
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className={formStyles.field}
        />
        {fieldErrors.password && <p className={formStyles.errorText}>{fieldErrors.password}</p>}
      </label>

      <button type="submit" disabled={loading} className={formStyles.submitButton}>
        {loading ? 'Входимо...' : 'Увійти'}
      </button>

      <p className={formStyles.footerText}>
        Немає акаунту?{' '}
        <Link href="/auth/register" className={formStyles.link}>
          Зареєструватись
        </Link>
      </p>
    </form>
  );
}
