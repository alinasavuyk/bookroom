'use client';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchBookById, updateBook } from '@/lib/api-client';
import { useToast } from '@/components/ToastProvider';
import { useRequireAuth } from '@/lib/useRequireAuth';
import Loader from '@/components/Loader';
import BookForm, { BookFormSubmitValues } from '@/components/BookForm';

export default function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const status = useRequireAuth();
  const { data: session } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const { data: book, isLoading } = useQuery({
    queryKey: ['book', id],
    queryFn: () => fetchBookById(id),
    enabled: status === 'authenticated',
  });

  const mutation = useMutation({ mutationFn: (values: BookFormSubmitValues) => updateBook(id, values) });

  if (status === 'loading' || isLoading) {
    return <Loader />;
  }

  if (status !== 'authenticated' || !book) {
    return null;
  }

  if (book.owner._id !== session?.user?.id) {
    router.replace(`/book/${id}`);
    return null;
  }

  const handleSubmit = async (values: BookFormSubmitValues) => {
    await mutation.mutateAsync(values);
    showToast('Зміни збережено!');
    router.push(`/book/${id}`);
  };

  return (
    <BookForm
      title="Редагувати книгу"
      submitLabel="Зберегти зміни"
      submittingLabel="Збереження..."
      initialValues={{
        title: book.title,
        author: book.author,
        description: book.description,
        price: book.price,
        genres: book.genres,
        type: book.type,
        images: book.images ?? (book.coverImage ? [book.coverImage] : []),
      }}
      onSubmit={handleSubmit}
    />
  );
}
