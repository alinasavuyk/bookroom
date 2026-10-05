'use client';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import styles from './UserBar.module.css';

interface UserBarProps {
  name: string;
  avatar?: string | null;
  onNavigate?: () => void;
}

export default function UserBar({ name, avatar, onNavigate }: UserBarProps) {
  const handleSignOut = () => {
    onNavigate?.();
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className={styles.wrap}>
      {avatar ? (
        <Image src={avatar} alt={name} width={28} height={28} className={styles.avatar} />
      ) : (
        <span className={styles.avatarPlaceholder}>{name.charAt(0).toUpperCase()}</span>
      )}
      <span className={styles.name}>{name}</span>
      <button type="button" onClick={handleSignOut} className={styles.logout}>
        Вийти
      </button>
    </div>
  );
}
