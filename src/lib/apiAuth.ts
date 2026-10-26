import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

type AuthSuccess = { userId: string; error?: undefined };
type AuthFailure = { userId?: undefined; error: NextResponse };
export type AuthResult = AuthSuccess | AuthFailure;

// Спільна перевірка "користувач залогінений" — замінює повторювану пару
// `const session = await auth(); if (!session?.user?.id) return 401` в
// кожному роуті. Використання:
//   const auth = await requireAuth();
//   if (auth.error) return auth.error;
//   const { userId } = auth;
export async function requireAuth(): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Потрібно увійти в акаунт' }, { status: 401 }) };
  }
  return { userId: session.user.id };
}

// Те саме, але додатково вимагає, щоб залогінений користувач був саме тим
// :id з параметрів маршруту (кошик, збережені книги, блокування, пароль тощо)
export async function requireSelf(
  id: string,
  message = 'Немає доступу до цього профілю'
): Promise<AuthResult> {
  const result = await requireAuth();
  if (result.error) return result;

  if (result.userId !== id) {
    return { error: NextResponse.json({ error: message }, { status: 403 }) };
  }
  return result;
}
