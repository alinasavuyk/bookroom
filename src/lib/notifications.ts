import { Types } from 'mongoose';
import Message, { IMessage } from '@/models/Message';
import User from '@/models/User';
import { sendEmail } from './email';

type IdLike = string | Types.ObjectId;

type MessageInput = Omit<Partial<IMessage>, 'sender' | 'receiver' | 'book' | 'offeredBook'> & {
  sender: IdLike;
  receiver: IdLike;
  book?: IdLike;
  offeredBook?: IdLike;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function notifyReceiver(receiverId: IMessage['receiver'], text?: string) {
  const receiver = await User.findById(receiverId).select('email name');
  if (!receiver?.email) return;

  const siteUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  const trimmedText = text?.trim();

  await sendEmail({
    to: receiver.email,
    subject: 'Нове повідомлення на Bookroom',
    html: `
      <p>Привіт, ${escapeHtml(receiver.name)}!</p>
      <p>У тебе нове повідомлення на Bookroom${trimmedText ? ':' : '.'}</p>
      ${trimmedText ? `<p style="padding:0.75rem 1rem;background:#f3f4f6;border-radius:0.5rem;">${escapeHtml(trimmedText)}</p>` : ''}
      <p><a href="${siteUrl}/chat">Переглянути в чаті →</a></p>
    `,
  });
}

// Єдина точка створення Message — крім запису в БД, завжди намагається
// надіслати отримувачу email-сповіщення (якщо в нього є пошта і Resend
// налаштовано). Помилка надсилання листа ніколи не повинна зривати запит,
// який створив повідомлення, тому вона лише логується.
export async function createMessageAndNotify(data: MessageInput) {
  const message = await Message.create(data);
  notifyReceiver(message.receiver, message.text).catch((err) =>
    console.error('[email] не вдалося надіслати сповіщення:', err)
  );
  return message;
}
