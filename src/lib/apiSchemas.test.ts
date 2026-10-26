import { describe, it, expect } from 'vitest';
import {
  createBookSchema,
  updateBookSchema,
  sendMessageSchema,
  respondToOfferSchema,
  checkoutSchema,
  updateProfileSchema,
  changePasswordSchema,
  createCommentSchema,
  registerSchema,
} from './apiSchemas';

describe('createBookSchema', () => {
  const base = { title: 'Кобзар', author: 'Шевченко', genres: ['Поезія'] };

  it('приймає книгу на продаж з ціною', () => {
    const result = createBookSchema.safeParse({ ...base, type: 'sale', price: 100 });
    expect(result.success).toBe(true);
  });

  it('відхиляє продаж без ціни', () => {
    const result = createBookSchema.safeParse({ ...base, type: 'sale', price: 0 });
    expect(result.success).toBe(false);
  });

  it('дозволяє обмін без ціни', () => {
    const result = createBookSchema.safeParse({ ...base, type: 'exchange' });
    expect(result.success).toBe(true);
  });

  it('відхиляє книгу без жанрів', () => {
    const result = createBookSchema.safeParse({ title: 'Т', author: 'А', genres: [] });
    expect(result.success).toBe(false);
  });

  it('тип за замовчуванням sale вимагає ціну', () => {
    const result = createBookSchema.safeParse(base);
    expect(result.success).toBe(false);
  });
});

describe('updateBookSchema', () => {
  it('приймає частковий набір полів (allow-list)', () => {
    const result = updateBookSchema.safeParse({ title: 'Нова назва' });
    expect(result.success).toBe(true);
  });

  it('відкидає поля поза схемою (status, views тощо)', () => {
    const result = updateBookSchema.safeParse({ title: 'Нова назва', status: 'sold' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('status');
    }
  });

  it('приймає порожній об’єкт', () => {
    expect(updateBookSchema.safeParse({}).success).toBe(true);
  });
});

describe('sendMessageSchema', () => {
  it('вимагає текст або зображення', () => {
    const result = sendMessageSchema.safeParse({ receiver: 'u1' });
    expect(result.success).toBe(false);
  });

  it('приймає повідомлення лише із зображенням', () => {
    const result = sendMessageSchema.safeParse({ receiver: 'u1', image: 'img.jpg' });
    expect(result.success).toBe(true);
  });

  it('вимагає місто й відділення для пропозиції обміну', () => {
    const result = sendMessageSchema.safeParse({ receiver: 'u1', text: 'Привіт', offeredBook: 'b1' });
    expect(result.success).toBe(false);
  });

  it('приймає пропозицію обміну з повними даними доставки', () => {
    const result = sendMessageSchema.safeParse({
      receiver: 'u1',
      text: 'Привіт',
      offeredBook: 'b1',
      offererCity: 'Київ',
      offererWarehouse: '1',
    });
    expect(result.success).toBe(true);
  });
});

describe('respondToOfferSchema', () => {
  it('приймає відомі дії', () => {
    expect(respondToOfferSchema.safeParse({ action: 'accept' }).success).toBe(true);
  });

  it('відхиляє невідому дію', () => {
    expect(respondToOfferSchema.safeParse({ action: 'delete' }).success).toBe(false);
  });
});

describe('checkoutSchema', () => {
  it('приймає повні дані доставки й оплати', () => {
    const result = checkoutSchema.safeParse({ city: 'Київ', warehouse: '1', paymentMethod: 'cash' });
    expect(result.success).toBe(true);
  });

  it('відхиляє невідомий спосіб оплати', () => {
    const result = checkoutSchema.safeParse({ city: 'Київ', warehouse: '1', paymentMethod: 'crypto' });
    expect(result.success).toBe(false);
  });

  it('відхиляє відсутнє місто', () => {
    const result = checkoutSchema.safeParse({ warehouse: '1', paymentMethod: 'cash' });
    expect(result.success).toBe(false);
  });
});

describe('updateProfileSchema', () => {
  it('приймає часткове оновлення', () => {
    expect(updateProfileSchema.safeParse({ bio: 'Нова біографія' }).success).toBe(true);
  });

  it('відхиляє порожнє ім’я', () => {
    expect(updateProfileSchema.safeParse({ name: '' }).success).toBe(false);
  });

  it('відкидає захищені поля (email, password тощо)', () => {
    const result = updateProfileSchema.safeParse({ name: 'Олена', password: 'hacked' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('password');
    }
  });
});

describe('changePasswordSchema', () => {
  it('приймає валідну зміну пароля', () => {
    const result = changePasswordSchema.safeParse({ currentPassword: 'old123', newPassword: 'new123' });
    expect(result.success).toBe(true);
  });

  it('відхиляє короткий новий пароль', () => {
    const result = changePasswordSchema.safeParse({ currentPassword: 'old123', newPassword: '123' });
    expect(result.success).toBe(false);
  });
});

describe('createCommentSchema', () => {
  it('приймає рецензію з оцінкою', () => {
    const result = createCommentSchema.safeParse({ text: 'Чудова книга', book: 'b1', rating: 5 });
    expect(result.success).toBe(true);
  });

  it('дозволяє рецензію без оцінки', () => {
    expect(createCommentSchema.safeParse({ text: 'Чудова книга', book: 'b1' }).success).toBe(true);
  });

  it('відхиляє оцінку поза діапазоном 1-5', () => {
    const result = createCommentSchema.safeParse({ text: 'Текст', book: 'b1', rating: 6 });
    expect(result.success).toBe(false);
  });

  it('відхиляє порожній текст', () => {
    expect(createCommentSchema.safeParse({ text: '  ', book: 'b1' }).success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('приймає валідну реєстрацію', () => {
    const result = registerSchema.safeParse({ name: 'Олена', email: 'test@example.com', password: '123456' });
    expect(result.success).toBe(true);
  });

  it('відхиляє некоректний email', () => {
    const result = registerSchema.safeParse({ name: 'Олена', email: 'not-an-email', password: '123456' });
    expect(result.success).toBe(false);
  });

  it('відхиляє короткий пароль', () => {
    const result = registerSchema.safeParse({ name: 'Олена', email: 'test@example.com', password: '123' });
    expect(result.success).toBe(false);
  });
});
