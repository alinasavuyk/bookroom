'use client';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { CommentDTO } from '@/types/models';
import { fetchComments, postComment } from '@/lib/api-client';
import Loader from '@/components/Loader';
import { useToast } from '@/components/ToastProvider';
import formStyles from '@/styles/Form.module.css';
import styles from './CommentsSection.module.css';

const commentSchema = Yup.object({
  text: Yup.string().trim().required('Напиши текст рецензії'),
  rating: Yup.number().min(1).max(5).required(),
});

export default function CommentsSection({ bookId }: { bookId: string }) {
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', bookId],
    queryFn: () => fetchComments(bookId),
  });

  const mutation = useMutation({
    mutationFn: (values: { text: string; rating: number }) => postComment(bookId, values.text, values.rating),
    onSuccess: (newComment) => {
      queryClient.setQueryData<CommentDTO[]>(['comments', bookId], (prev = []) => [
        {
          ...newComment,
          author: { _id: session!.user!.id, name: session!.user!.name ?? '', avatar: session!.user!.image ?? '' },
        },
        ...prev,
      ]);
      showToast('Рецензію додано!');
      formik.resetForm();
    },
    onError: (err: Error) => {
      showToast(err.message, 'error');
    },
  });

  const formik = useFormik({
    initialValues: { text: '', rating: 5 },
    validationSchema: commentSchema,
    onSubmit: (values) => mutation.mutate(values),
  });

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Рецензії</h2>

      {isLoading ? (
        <Loader />
      ) : comments.length > 0 ? (
        <ul className={styles.list}>
          {comments.map((comment) => (
            <li key={comment._id} className={styles.item}>
              <div className={styles.itemHeader}>
                <span className={styles.itemAuthor}>{comment.author?.name ?? 'Користувач'}</span>
                {comment.rating && <span className={styles.itemRating}>{'★'.repeat(comment.rating)}</span>}
              </div>
              <p className={styles.itemText}>{comment.text}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className={formStyles.footerText}>Поки що немає рецензій</p>
      )}

      {status === 'authenticated' && (
        <form onSubmit={formik.handleSubmit} noValidate className={styles.form}>
          <label className={formStyles.label}>
            <span className={formStyles.labelText}>Оцінка</span>
            <select
              name="rating"
              value={formik.values.rating}
              onChange={formik.handleChange}
              className={formStyles.field}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <label className={formStyles.label}>
            <span className={formStyles.labelText}>Рецензія</span>
            <textarea
              name="text"
              value={formik.values.text}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={formStyles.field}
              rows={3}
            />
            {formik.touched.text && formik.errors.text && (
              <p className={formStyles.errorText}>{formik.errors.text}</p>
            )}
          </label>
          <button type="submit" disabled={mutation.isPending} className={formStyles.submitButton}>
            {mutation.isPending ? 'Надсилання...' : 'Залишити рецензію'}
          </button>
        </form>
      )}
    </section>
  );
}
