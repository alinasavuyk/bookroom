'use client';
import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerUser } from '@/lib/api-client';
import PasswordInput from '@/components/PasswordInput';
import SocialAuthButtons from '@/components/SocialAuthButtons';
import formStyles from '@/styles/Form.module.css';

const registerSchema = Yup.object({
  name: Yup.string().trim().required("Вкажи ім'я"),
  email: Yup.string().trim().email('Введи коректний email').required('Введи коректний email'),
  password: Yup.string().trim().min(6, 'Пароль має містити щонайменше 6 символів').required('Введи пароль'),
});

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  const formik = useFormik({
    initialValues: { name: '', email: '', password: '' },
    validationSchema: registerSchema,
    onSubmit: async (values) => {
      setError('');
      try {
        await registerUser(values);

        const signInResult = await signIn('credentials', {
          email: values.email,
          password: values.password,
          redirect: false,
        });

        if (signInResult?.error) {
          router.push('/auth/signin');
        } else {
          router.push('/profile');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Сталася помилка. Спробуй ще раз.');
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} noValidate className={`${formStyles.form} ${formStyles.formNarrow}`}>
      <h1 className={formStyles.title}>Реєстрація</h1>

      {error && <p className={formStyles.errorText}>{error}</p>}

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
        <span className={formStyles.labelText}>Email</span>
        <input
          type="email"
          name="email"
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={formStyles.field}
        />
        {formik.touched.email && formik.errors.email && (
          <p className={formStyles.errorText}>{formik.errors.email}</p>
        )}
      </label>

      <label className={formStyles.label}>
        <span className={formStyles.labelText}>Пароль</span>
        <PasswordInput
          name="password"
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={formStyles.field}
        />
        {formik.touched.password && formik.errors.password && (
          <p className={formStyles.errorText}>{formik.errors.password}</p>
        )}
      </label>

      <button type="submit" disabled={formik.isSubmitting} className={formStyles.submitButton}>
        {formik.isSubmitting ? 'Реєстрація...' : 'Зареєструватись'}
      </button>

      <SocialAuthButtons />

      <p className={formStyles.footerText}>
        Вже маєш акаунт?{' '}
        <Link href="/auth/signin" className={formStyles.link}>
          Увійти
        </Link>
      </p>
    </form>
  );
}
