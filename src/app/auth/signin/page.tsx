'use client';
import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PasswordInput from '@/components/PasswordInput';
import SocialAuthButtons from '@/components/SocialAuthButtons';
import formStyles from '@/styles/Form.module.css';

const signInSchema = Yup.object({
  email: Yup.string().trim().email('Введи коректний email').required('Введи коректний email'),
  password: Yup.string().trim().required('Введи пароль'),
});

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: signInSchema,
    onSubmit: async (values) => {
      setError('');

      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Невірний email або пароль.');
      } else {
        router.push('/');
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} noValidate className={`${formStyles.form} ${formStyles.formNarrow}`}>
      <h1 className={formStyles.title}>Вхід</h1>

      {error && <p className={formStyles.errorText}>{error}</p>}

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
        {formik.isSubmitting ? 'Входимо...' : 'Увійти'}
      </button>

      <SocialAuthButtons />

      <p className={formStyles.footerText}>
        Немає акаунту?{' '}
        <Link href="/auth/register" className={formStyles.link}>
          Зареєструватись
        </Link>
      </p>
    </form>
  );
}
