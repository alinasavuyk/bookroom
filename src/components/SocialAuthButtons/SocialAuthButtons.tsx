'use client';
import { signIn } from 'next-auth/react';
import { TbBrandGoogle } from '@/lib/icons';
import styles from './SocialAuthButtons.module.css';

interface SocialAuthButtonsProps {
  mode: 'signin' | 'register';
}

export default function SocialAuthButtons({ mode }: SocialAuthButtonsProps) {
  const handleGoogle = () => {
    // Короткоживучий cookie передає серверу, чи це був саме "вхід" —
    // щоб не створювати акаунт автоматично, якщо його ще нема
    document.cookie = `google-auth-intent=${mode}; path=/; max-age=300; samesite=lax`;
    signIn('google', { callbackUrl: '/profile' });
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.divider}>
        <span>або</span>
      </div>
      <button type="button" onClick={handleGoogle} className={styles.button}>
        <TbBrandGoogle />
        Продовжити з Google
      </button>
    </div>
  );
}
