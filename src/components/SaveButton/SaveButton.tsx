'use client';
import { useState, MouseEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation } from '@tanstack/react-query';
import { TbHeart, TbHeartFilled } from '@/lib/icons';
import { toggleSavedBook } from '@/lib/api-client';
import { useToast } from '@/components/ToastProvider';
import styles from './SaveButton.module.css';

interface SaveButtonProps {
  bookId: string;
  initialSaved?: boolean;
  onToggle?: (bookId: string, saved: boolean) => void;
  className?: string;
}

export default function SaveButton({ bookId, initialSaved = false, onToggle, className }: SaveButtonProps) {
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const [saved, setSaved] = useState(initialSaved);

  const mutation = useMutation({
    mutationFn: (nextSaved: boolean) => toggleSavedBook(session!.user!.id, bookId, nextSaved),
  });

  if (status !== 'authenticated') return null;

  const toggle = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session?.user?.id || mutation.isPending) return;

    const nextSaved = !saved;
    setSaved(nextSaved);

    mutation.mutate(nextSaved, {
      onSuccess: () => {
        showToast(nextSaved ? 'Додано в обране' : 'Прибрано з обраного');
        onToggle?.(bookId, nextSaved);
      },
      onError: () => {
        setSaved(!nextSaved);
        showToast('Не вдалося зберегти книгу', 'error');
      },
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={mutation.isPending}
      className={`${styles.button} ${className ?? ''}`}
      aria-label={saved ? 'Прибрати зі збережених' : 'Зберегти книгу'}
    >
      {saved ? <TbHeartFilled /> : <TbHeart />}
    </button>
  );
}
