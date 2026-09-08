import { BookSummary, CommentDTO, MessageDTO, ConversationDTO } from '@/types/models';
import { CatalogFilterValues } from '@/components/CatalogFilters';

interface UserProfileResponse {
  name: string;
  bio: string;
  avatar: string;
  savedBooks: BookSummary[];
}

async function parseError(res: Response, fallback: string): Promise<never> {
  const data = await res.json().catch(() => ({}));
  throw new Error(data.error || fallback);
}

export async function fetchBooks(search: string, filters: CatalogFilterValues): Promise<BookSummary[]> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (filters.genres.length > 0) params.set('genre', filters.genres.join(','));
  if (filters.types.length > 0) params.set('type', filters.types.join(','));
  if (filters.minPrice) params.set('minPrice', filters.minPrice);
  if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
  const res = await fetch(`/api/books?${params.toString()}`);
  return res.json();
}

export async function fetchBooksByOwner(ownerId: string): Promise<BookSummary[]> {
  const res = await fetch(`/api/books?owner=${ownerId}`);
  return res.json();
}

export async function fetchUserProfile(userId: string): Promise<UserProfileResponse> {
  const res = await fetch(`/api/users/${userId}`);
  return res.json();
}

export async function fetchComments(bookId: string): Promise<CommentDTO[]> {
  const res = await fetch(`/api/comments?bookId=${bookId}`);
  return res.json();
}

export async function postComment(bookId: string, text: string, rating: number) {
  const res = await fetch('/api/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, rating, book: bookId }),
  });
  if (!res.ok) return parseError(res, 'Не вдалося додати рецензію');
  return res.json();
}

export async function toggleSavedBook(userId: string, bookId: string, save: boolean) {
  const res = await fetch(`/api/users/${userId}/saved-books`, {
    method: save ? 'POST' : 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookId }),
  });
  if (!res.ok) return parseError(res, 'Не вдалося зберегти книгу');
  return res.json();
}

export async function createBook(data: unknown) {
  const res = await fetch('/api/books', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) return parseError(res, 'Сталася помилка при додаванні книги.');
  return res.json();
}

export async function registerUser(data: { name: string; email: string; password: string }) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) return parseError(res, 'Сталася помилка. Спробуй ще раз.');
  return res.json();
}

export async function updateProfile(userId: string, data: { name: string; bio: string; avatar: string }) {
  const res = await fetch(`/api/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) return parseError(res, 'Сталася помилка при збереженні.');
  return res.json();
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const res = await fetch(`/api/users/${userId}/password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) return parseError(res, 'Не вдалося змінити пароль');
  return res.json();
}

export async function fetchConversations(): Promise<ConversationDTO[]> {
  const res = await fetch('/api/messages/conversations');
  return res.json();
}

export async function fetchUnreadCount(): Promise<{ count: number }> {
  const res = await fetch('/api/messages/unread-count');
  return res.json();
}

export async function fetchMessages(withUserId: string): Promise<MessageDTO[]> {
  const res = await fetch(`/api/messages?with=${withUserId}`);
  return res.json();
}

export async function sendMessage(receiver: string, text: string, book?: string) {
  const res = await fetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiver, text, book }),
  });
  if (!res.ok) return parseError(res, 'Не вдалося надіслати повідомлення');
  return res.json();
}
