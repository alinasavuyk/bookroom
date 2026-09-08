'use client';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Спільний патерн захисту приватних сторінок: редіректить на /auth/signin,
// якщо користувач не залогінений. Повертає статус сесії для показу лоадера.
export function useRequireAuth() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  return status;
}
