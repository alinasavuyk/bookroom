'use client';
import { useState } from 'react';
import { BOOK_GENRES } from '@/lib/genres';
import styles from './CatalogFilters.module.css';

const GENRES = BOOK_GENRES;
const TYPES: { value: string; label: string }[] = [
  { value: 'sale', label: 'Продаж' },
  { value: 'exchange', label: 'Обмін' },
  { value: 'both', label: 'Продаж або обмін' },
];

export interface CatalogFilterValues {
  genres: string[];
  types: string[];
  minPrice: string;
  maxPrice: string;
}

export const EMPTY_CATALOG_FILTERS: CatalogFilterValues = {
  genres: [],
  types: [],
  minPrice: '',
  maxPrice: '',
};

type SectionKey = 'genre' | 'type' | 'price';

export default function CatalogFilters({ onApply }: { onApply: (filters: CatalogFilterValues) => void }) {
  const [draft, setDraft] = useState<CatalogFilterValues>(EMPTY_CATALOG_FILTERS);
  const [openSection, setOpenSection] = useState<SectionKey | null>('genre');

  const toggleSection = (key: SectionKey) => {
    setOpenSection((prev) => (prev === key ? null : key));
  };

  const toggleValue = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.section}>
        <button type="button" className={styles.sectionHeader} onClick={() => toggleSection('genre')}>
          Жанр
          <span className={styles.chevron}>{openSection === 'genre' ? '▲' : '▼'}</span>
        </button>
        {openSection === 'genre' && (
          <ul className={styles.sectionBody}>
            {GENRES.map((genre) => (
              <li key={genre}>
                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={draft.genres.includes(genre)}
                    onChange={() => setDraft({ ...draft, genres: toggleValue(draft.genres, genre) })}
                  />
                  {genre}
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.section}>
        <button type="button" className={styles.sectionHeader} onClick={() => toggleSection('type')}>
          Тип оголошення
          <span className={styles.chevron}>{openSection === 'type' ? '▲' : '▼'}</span>
        </button>
        {openSection === 'type' && (
          <ul className={styles.sectionBody}>
            {TYPES.map((t) => (
              <li key={t.value}>
                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={draft.types.includes(t.value)}
                    onChange={() => setDraft({ ...draft, types: toggleValue(draft.types, t.value) })}
                  />
                  {t.label}
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.section}>
        <button type="button" className={styles.sectionHeader} onClick={() => toggleSection('price')}>
          Ціна
          <span className={styles.chevron}>{openSection === 'price' ? '▲' : '▼'}</span>
        </button>
        {openSection === 'price' && (
          <div className={styles.sectionBody}>
            <div className={styles.priceRow}>
              <input
                type="number"
                placeholder="Від"
                value={draft.minPrice}
                onChange={(e) => setDraft({ ...draft, minPrice: e.target.value })}
                className={styles.priceInput}
              />
              <input
                type="number"
                placeholder="До"
                value={draft.maxPrice}
                onChange={(e) => setDraft({ ...draft, maxPrice: e.target.value })}
                className={styles.priceInput}
              />
            </div>
          </div>
        )}
      </div>

      <button type="button" className={styles.applyButton} onClick={() => onApply(draft)}>
        Застосувати
      </button>
    </aside>
  );
}
