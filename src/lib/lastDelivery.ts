import { NovaPoshtaCity, NovaPoshtaWarehouse } from './api-client';

const STORAGE_KEY = 'bookroom:lastDelivery';

interface LastDelivery {
  city: NovaPoshtaCity;
  warehouse: NovaPoshtaWarehouse;
}

// Запам'ятовуємо останні місто й відділення Нової Пошти в localStorage, щоб
// не вводити їх заново при кожному оформленні покупки чи обміну на цьому ж
// пристрої — не критичні дані, тож без синхронізації між пристроями досить
export function getLastDelivery(): LastDelivery | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLastDelivery(city: NovaPoshtaCity, warehouse: NovaPoshtaWarehouse): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ city, warehouse }));
  } catch {
    // приватний режим браузера чи вимкнений storage — просто не запам'ятовуємо
  }
}
