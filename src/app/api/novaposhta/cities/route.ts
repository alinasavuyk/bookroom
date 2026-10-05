import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { searchCities } from '@/lib/novaPoshta';

// GET /api/novaposhta/cities?q=<пошук> — підказки міст для доставки (лише для залогінених)
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Потрібно увійти в акаунт' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? '';

  try {
    const cities = await searchCities(q);
    return NextResponse.json(cities);
  } catch {
    return NextResponse.json({ error: 'Не вдалося отримати список міст' }, { status: 502 });
  }
}
