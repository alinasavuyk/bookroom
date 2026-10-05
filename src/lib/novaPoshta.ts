const NOVA_POSHTA_URL = 'https://api.novaposhta.ua/v2.0/json/';

export interface NovaPoshtaCity {
  ref: string;
  name: string;
}

export interface NovaPoshtaWarehouse {
  ref: string;
  number: string;
  description: string;
}

async function callNovaPoshta<T>(calledMethod: string, methodProperties: Record<string, string>): Promise<T[]> {
  const res = await fetch(NOVA_POSHTA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: process.env.NOVA_POSHTA_API_KEY,
      modelName: 'Address',
      calledMethod,
      methodProperties,
    }),
  });

  if (!res.ok) throw new Error('Нова Пошта API недоступне');
  const data = await res.json();
  if (!data.success) throw new Error(data.errors?.[0] || 'Помилка Нової Пошти');
  return data.data as T[];
}

export async function searchCities(query: string): Promise<NovaPoshtaCity[]> {
  if (!query.trim()) return [];
  interface RawCity {
    Ref: string;
    Description: string;
  }
  const data = await callNovaPoshta<RawCity>('getCities', { FindByString: query, Limit: '15' });
  return data.map((c) => ({ ref: c.Ref, name: c.Description }));
}

export async function searchWarehouses(cityRef: string, query?: string): Promise<NovaPoshtaWarehouse[]> {
  if (!cityRef) return [];
  interface RawWarehouse {
    Ref: string;
    Number: string;
    Description: string;
  }
  const props: Record<string, string> = { CityRef: cityRef, Limit: '30' };
  if (query?.trim()) props.FindByString = query;
  const data = await callNovaPoshta<RawWarehouse>('getWarehouses', props);
  return data.map((w) => ({ ref: w.Ref, number: w.Number, description: w.Description }));
}
