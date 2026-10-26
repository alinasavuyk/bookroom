import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { parseBody } from './apiValidation';

const schema = z.object({
  name: z.string().trim().min(1, "Ім'я не може бути порожнім"),
  age: z.number().optional(),
});

function jsonRequest(body: unknown) {
  return new Request('http://localhost/api/test', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('parseBody', () => {
  it('повертає розпарсені дані для валідного тіла', async () => {
    const result = await parseBody(jsonRequest({ name: 'Олена', age: 30 }), schema);
    expect(result.error).toBeUndefined();
    expect(result.data).toEqual({ name: 'Олена', age: 30 });
  });

  it('повертає помилку 400 для невалідного JSON', async () => {
    const request = new Request('http://localhost/api/test', { method: 'POST', body: '{not json' });
    const result = await parseBody(request, schema);
    expect(result.data).toBeUndefined();
    expect(result.error?.status).toBe(400);
  });

  it('повертає повідомлення зі схеми для невалідних даних', async () => {
    const result = await parseBody(jsonRequest({ name: '' }), schema);
    expect(result.error?.status).toBe(400);
    const body = await result.error?.json();
    expect(body.error).toBe("Ім'я не може бути порожнім");
  });

  it('повертає помилку, якщо обов’язкове поле відсутнє', async () => {
    const result = await parseBody(jsonRequest({}), schema);
    expect(result.error?.status).toBe(400);
  });
});
