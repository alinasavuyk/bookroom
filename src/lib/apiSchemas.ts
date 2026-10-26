import { z } from 'zod';

// Схеми валідації тіла запиту для API-роутів. Винесені в окремий файл, а не
// в самі route.ts, бо Next.js App Router дозволяє в route.ts експортувати
// лише HTTP-методи (GET/POST/...) і кілька спеціальних імен — довільний
// export const ламає типізацію маршруту.

export const createBookSchema = z
  .object({
    title: z.string().trim().min(1, 'Заповни назву й автора книги'),
    author: z.string().trim().min(1, 'Заповни назву й автора книги'),
    description: z.string().optional().default(''),
    genres: z.array(z.string()).min(1, 'Обери хоча б один жанр'),
    type: z.enum(['sale', 'exchange', 'both']).optional().default('sale'),
    price: z.number().optional().default(0),
    images: z.array(z.string()).optional().default([]),
    coverImage: z.string().optional().default(''),
  })
  .refine((data) => !(data.type === 'sale' || data.type === 'both') || data.price > 0, {
    message: 'Вкажи ціну для продажу книги',
    path: ['price'],
  });

// Allow-list через .partial() — Zod відкидає будь-які поля, яких немає в
// схемі (status, views тощо), тож редагувати можна лише ці; валідація й
// обмеження дозволених полів робляться одним описом замість ручного циклу
export const updateBookSchema = z
  .object({
    title: z.string().trim().min(1),
    author: z.string().trim().min(1),
    description: z.string(),
    genres: z.array(z.string()).min(1),
    price: z.number(),
    type: z.enum(['sale', 'exchange', 'both']),
    images: z.array(z.string()),
    coverImage: z.string(),
  })
  .partial();

export const sendMessageSchema = z
  .object({
    receiver: z.string().min(1, 'Заповни текст повідомлення'),
    text: z.string().optional().default(''),
    image: z.string().optional(),
    book: z.string().optional(),
    offeredBook: z.string().optional(),
    offererCity: z.string().optional(),
    offererWarehouse: z.string().optional(),
  })
  .refine((d) => d.text.trim().length > 0 || !!d.image?.trim(), {
    message: 'Заповни текст повідомлення',
    path: ['text'],
  })
  .refine((d) => !d.offeredBook || (!!d.offererCity && !!d.offererWarehouse), {
    message: 'Вкажи місто й відділення для доставки',
    path: ['offererCity'],
  });

export const respondToOfferSchema = z.object({
  action: z.enum(['accept', 'decline', 'cancel'], { message: 'Невідома дія' }),
  city: z.string().optional(),
  warehouse: z.string().optional(),
});

export const orderActionSchema = z.object({
  action: z.enum(['confirm', 'cancel'], { message: 'Невідома дія' }),
});

export const checkoutSchema = z.object({
  city: z.string().min(1, 'Вкажи місто, відділення й спосіб оплати'),
  warehouse: z.string().min(1, 'Вкажи місто, відділення й спосіб оплати'),
  paymentMethod: z.enum(['cash', 'card', 'cod'], { message: 'Вкажи місто, відділення й спосіб оплати' }),
});

// Allow-list через .partial() — пароль, пошта, рейтинг, збережені книги,
// кошик і блокування мають власні захищені роути й редагуватись тут не можуть
export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1, "Ім'я не може бути порожнім"),
    bio: z.string(),
    avatar: z.string(),
  })
  .partial();

export const bookIdSchema = z.object({ bookId: z.string().min(1, 'Не вказано книгу') });

export const userIdBodySchema = z.object({ userId: z.string().min(1, 'Не вказано користувача') });

export const changePasswordSchema = z.object({
  currentPassword: z.string().trim().min(1, 'Перевір правильність заповнення полів'),
  newPassword: z.string().trim().min(6, 'Перевір правильність заповнення полів'),
});

export const createCommentSchema = z.object({
  text: z.string().trim().min(1, 'Заповни текст рецензії'),
  book: z.string().min(1, 'Заповни текст рецензії'),
  rating: z.number().min(1, 'Оцінка має бути від 1 до 5').max(5, 'Оцінка має бути від 1 до 5').optional(),
});

export const createReportSchema = z.object({
  reportedUserId: z.string().min(1, 'Опиши причину скарги'),
  reason: z.string().trim().min(1, 'Опиши причину скарги'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Перевір правильність заповнення полів'),
  email: z.string().trim().email('Перевір правильність заповнення полів'),
  password: z.string().trim().min(6, 'Перевір правильність заповнення полів'),
});
