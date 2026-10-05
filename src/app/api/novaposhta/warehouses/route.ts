import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { searchWarehouses } from '@/lib/novaPoshta';

// GET /api/novaposhta/warehouses?cityRef=<ref>&q=<пошук> — відділення в обраному місті (лише для залогінених)
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Потрібно увійти в акаунт' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cityRef = searchParams.get('cityRef');
  const q = searchParams.get('q') ?? undefined;

  if (!cityRef) {
    return NextResponse.json({ error: 'Не вказано місто' }, { status: 400 });
  }

  try {
    const warehouses = await searchWarehouses(cityRef, q);
    return NextResponse.json(warehouses);
  } catch {
    return NextResponse.json({ error: 'Не вдалося отримати список відділень' }, { status: 502 });
  }
}
