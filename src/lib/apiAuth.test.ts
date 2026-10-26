import { describe, it, expect, vi, type Mock } from 'vitest';
import { auth } from '@/lib/auth';
import { requireAuth, requireSelf } from './apiAuth';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));

// auth() у NextAuth v5 — перевантажена функція (режими middleware/no-args),
// тож просто кастуємо до Mock замість vi.mocked, щоб уникнути конфлікту типів
// перевантажень при mockResolvedValue
const mockAuth = auth as unknown as Mock;

describe('requireAuth', () => {
  it('повертає помилку 401, якщо немає сесії', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await requireAuth();
    expect(result.userId).toBeUndefined();
    expect(result.error?.status).toBe(401);
  });

  it('повертає помилку 401, якщо в сесії немає user.id', async () => {
    mockAuth.mockResolvedValue({ user: {} } as never);
    const result = await requireAuth();
    expect(result.error?.status).toBe(401);
  });

  it('повертає userId, якщо сесія валідна', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never);
    const result = await requireAuth();
    expect(result.error).toBeUndefined();
    expect(result.userId).toBe('user-1');
  });
});

describe('requireSelf', () => {
  it('повертає помилку 401, якщо немає сесії', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await requireSelf('user-1');
    expect(result.error?.status).toBe(401);
  });

  it('повертає помилку 403, якщо залогінений не той, кого запитують', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never);
    const result = await requireSelf('user-2');
    expect(result.error?.status).toBe(403);
  });

  it('дозволяє власний кастомний текст помилки 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never);
    const result = await requireSelf('user-2', 'Немає доступу до цього кошика');
    const body = await result.error?.json();
    expect(body.error).toBe('Немає доступу до цього кошика');
  });

  it('повертає userId, якщо запитує сам себе', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never);
    const result = await requireSelf('user-1');
    expect(result.error).toBeUndefined();
    expect(result.userId).toBe('user-1');
  });
});
