const STORAGE_KEY = 'bookroom:recentlyViewed';
const MAX_ITEMS = 10;

// Нещодавно переглянуті книги зберігаються в localStorage (найновіша — перша),
// без прив'язки до акаунта — працює однаково для гостя й залогіненого
export function getRecentlyViewedIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(bookId: string): void {
  try {
    const withoutCurrent = getRecentlyViewedIds().filter((id) => id !== bookId);
    const updated = [bookId, ...withoutCurrent].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // приватний режим браузера чи вимкнений storage — просто не запам'ятовуємо
  }
}
