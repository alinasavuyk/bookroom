'use client';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { createBook } from '@/lib/api-client';
import { useToast } from '@/components/ToastProvider';
import { useRequireAuth } from '@/lib/useRequireAuth';
import BookForm, { BookFormSubmitValues } from '@/components/BookForm';

export default function SellPage() {
  const status = useRequireAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const mutation = useMutation({ mutationFn: createBook });

  if (status !== 'authenticated') {
    return null;
  }

  const handleSubmit = async (values: BookFormSubmitValues) => {
    await mutation.mutateAsync(values);
    showToast('Книгу додано!');
    router.push('/profile');
  };

  return <BookForm title="Продати книгу" submitLabel="Додати книгу" submittingLabel="Додавання..." onSubmit={handleSubmit} />;
}
