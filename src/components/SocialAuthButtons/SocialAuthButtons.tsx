'use client';
import { signIn } from 'next-auth/react';
import { TbBrandGoogle } from '@/lib/icons';
import styles from './SocialAuthButtons.module.css';

export default function SocialAuthButtons() {
  return (
    <div className={styles.wrap}>
      <div className={styles.divider}>
        <span>або</span>
      </div>
      <button
        type="button"
        onClick={() => signIn('google', { callbackUrl: '/' })}
        className={styles.button}
      >
        <TbBrandGoogle />
        Продовжити з Google
      </button>
    </div>
  );
}
