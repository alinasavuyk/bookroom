import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

// Якщо RESEND_API_KEY не налаштовано (локально чи ще не доданий на Vercel) —
// просто пропускаємо надсилання замість падіння запиту, що його викликав
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY не налаштовано — лист "${subject}" до ${to} не надіслано`);
    return;
  }

  try {
    await resend.emails.send({
      from: 'Bookroom <onboarding@resend.dev>',
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('[email] не вдалося надіслати лист:', err);
  }
}
