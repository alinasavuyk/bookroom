'use client';
import { MouseEvent, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TbShoppingCart, TbShoppingCartFilled } from '@/lib/icons';
import { fetchUserProfile, toggleCartItem } from '@/lib/api-client';
import { useToast } from '@/components/ToastProvider';
import styles from './CartButton.module.css';

interface CartButtonProps {
  bookId: string;
  ownerId?: string;
  className?: string;
  children?: ReactNode;
}

// Стан "у кошику чи ні" бере зі спільного кешу React Query (той самий
// ключ, що й у CartWidget), тому іконка й лічильник у навбарі завжди
// синхронні — без прокидання пропсів через усі місця, де є BookCard
export default function CartButton({ bookId, ownerId, className, children }: CartButtonProps) {
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  const { data: profile } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUserProfile(userId!),
    enabled: !!userId,
  });

  const mutation = useMutation({
    mutationFn: (next: boolean) => toggleCartItem(userId!, bookId, next),
  });

  if (status !== 'authenticated' || (ownerId && ownerId === userId)) return null;

  const inCart = !!profile?.cart.some((b) => b._id === bookId);

  const toggle = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!userId || mutation.isPending) return;

    const next = !inCart;
    mutation.mutate(next, {
      onSuccess: () => {
        showToast(next ? 'Додано в кошик' : 'Прибрано з кошика');
        queryClient.invalidateQueries({ queryKey: ['user', userId] });
      },
      onError: () => showToast('Не вдалося оновити кошик', 'error'),
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={mutation.isPending}
      className={className ?? styles.button}
      aria-label={inCart ? 'Прибрати з кошика' : 'Додати в кошик'}
    >
      {inCart ? <TbShoppingCartFilled /> : <TbShoppingCart />}
      {children}
    </button>
  );
}
