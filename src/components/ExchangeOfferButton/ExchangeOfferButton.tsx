'use client';
import { useState, MouseEvent, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { TbArrowsExchange } from '@/lib/icons';
import { fetchBooksByOwner, sendExchangeOffer } from '@/lib/api-client';
import { useToast } from '@/components/ToastProvider';
import Modal from '@/components/Modal';
import { BookOwner } from '@/types/models';
import styles from './ExchangeOfferButton.module.css';

interface ExchangeOfferButtonProps {
  bookId: string;
  bookTitle: string;
  owner?: BookOwner;
  className?: string;
  children?: ReactNode;
}

export default function ExchangeOfferButton({
  bookId,
  bookTitle,
  owner,
  className,
  children,
}: ExchangeOfferButtonProps) {
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const myId = session?.user?.id;

  const { data: myBooks = [], isLoading } = useQuery({
    queryKey: ['books', 'owner', myId],
    queryFn: () => fetchBooksByOwner(myId!),
    enabled: open && !!myId,
  });

  const mutation = useMutation({
    mutationFn: (offeredBook: { _id: string; title: string }) =>
      sendExchangeOffer(owner!._id, bookId, offeredBook._id, offeredBook.title, bookTitle),
  });

  if (status !== 'authenticated' || !owner || owner._id === myId) return null;

  const availableBooks = myBooks.filter((b) => b.status === 'available');

  const openModal = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(null);
    setOpen(true);
  };

  const handleSend = () => {
    const chosen = availableBooks.find((b) => b._id === selectedId);
    if (!chosen) return;

    mutation.mutate(
      { _id: chosen._id, title: chosen.title },
      {
        onSuccess: () => {
          showToast('Пропозицію обміну надіслано');
          setOpen(false);
        },
        onError: () => showToast('Не вдалося надіслати пропозицію', 'error'),
      }
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={className ?? styles.button}
        aria-label="Запропонувати обмін"
      >
        <TbArrowsExchange />
        {children}
      </button>

      {open && (
        <Modal onClose={() => setOpen(false)}>
          <h2 className={styles.title}>Запропонувати обмін</h2>
          <p className={styles.text}>Обери свою книгу, яку пропонуєш натомість за «{bookTitle}»:</p>

          {isLoading ? (
            <p className={styles.empty}>Завантаження...</p>
          ) : availableBooks.length === 0 ? (
            <p className={styles.empty}>У тебе немає книг, доступних для обміну. Спочатку додай книгу.</p>
          ) : (
            <ul className={styles.list}>
              {availableBooks.map((b) => (
                <li key={b._id}>
                  <label className={styles.option}>
                    <input
                      type="radio"
                      name="offeredBook"
                      checked={selectedId === b._id}
                      onChange={() => setSelectedId(b._id)}
                    />
                    {b.title}
                  </label>
                </li>
              ))}
            </ul>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleSend}
              disabled={!selectedId || mutation.isPending}
              className={styles.primaryButton}
            >
              Надіслати пропозицію
            </button>
            <button type="button" onClick={() => setOpen(false)} className={styles.secondaryButton}>
              Скасувати
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
