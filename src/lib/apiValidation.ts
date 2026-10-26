import { NextResponse } from 'next/server';
import { ZodType } from 'zod';

type ParseResult<T> = { data: T; error?: undefined } | { data?: undefined; error: NextResponse };

// Спільний розбір і валідація тіла запиту через Zod-схему — замінює ручні
// перевірки полів (isNonEmpty тощо), розкидані по кожному роуту, одним
// викликом, який одразу дає й валідацію, і типізацію результату:
//   const body = await parseBody(request, createBookSchema);
//   if (body.error) return body.error;
//   const { title, author } = body.data;
export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<ParseResult<T>> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return { error: NextResponse.json({ error: 'Некоректний формат запиту' }, { status: 400 }) };
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? 'Некоректні дані';
    return { error: NextResponse.json({ error: message }, { status: 400 }) };
  }

  return { data: result.data };
}
