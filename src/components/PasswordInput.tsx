'use client';
import { useState, InputHTMLAttributes } from 'react';
import { TbEye, TbEyeOff } from '@/lib/icons';
import styles from './PasswordInput.module.css';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export default function PasswordInput({ className, style, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.wrapper}>
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={className}
        style={{ paddingRight: '2.75rem', ...style }}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className={styles.toggle}
        aria-label={visible ? 'Приховати пароль' : 'Показати пароль'}
        tabIndex={-1}
      >
        {visible ? <TbEyeOff /> : <TbEye />}
      </button>
    </div>
  );
}
