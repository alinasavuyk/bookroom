import { connectDB } from '@/lib/mongodb';
import RateLimit from '@/models/RateLimit';

// Атомарний лічильник спроб у часовому вікні, збережений у Mongo — на
// відміну від лічильника в пам'яті процесу, коректно працює і на serverless
// (Vercel), де різні виклики можуть потрапляти на різні інстанси без
// спільної пам'яті. Один findOneAndUpdate з pipeline-апдейтом атомарно і
// створює новий запис, і скидає вікно, якщо попереднє вже спливло.
export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  await connectDB();
  const now = new Date();

  const result = await RateLimit.findOneAndUpdate(
    { key },
    [
      {
        $set: {
          count: { $cond: [{ $lt: ['$expiresAt', now] }, 1, { $add: ['$count', 1] }] },
          expiresAt: { $cond: [{ $lt: ['$expiresAt', now] }, new Date(now.getTime() + windowMs), '$expiresAt'] },
        },
      },
    ],
    { upsert: true, new: true }
  );

  return result.count <= limit;
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  return forwardedFor?.split(',')[0]?.trim() || 'unknown';
}
