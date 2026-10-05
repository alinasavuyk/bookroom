'use client';
import { useState, useEffect, useRef } from 'react';
import styles from './SearchSelect.module.css';

interface SearchSelectProps<T> {
  placeholder: string;
  value: T | null;
  onChange: (value: T) => void;
  search: (query: string) => Promise<T[]>;
  getLabel: (item: T) => string;
  getKey: (item: T) => string;
  disabled?: boolean;
}

// Поле пошуку з випадним списком і дебаунсом — спільне для вибору міста
// й відділення Нової Пошти при оформленні замовлення
export default function SearchSelect<T>({
  placeholder,
  value,
  onChange,
  search,
  getLabel,
  getKey,
  disabled,
}: SearchSelectProps<T>) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(() => {
      search(query)
        .then(setResults)
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, open, search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: T) => {
    onChange(item);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <input
        type="text"
        value={open ? query : value ? getLabel(value) : query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        className={styles.input}
      />
      {open && query.trim().length >= 2 && (
        <ul className={styles.dropdown}>
          {loading ? (
            <li className={styles.message}>Пошук...</li>
          ) : results.length === 0 ? (
            <li className={styles.message}>Нічого не знайдено</li>
          ) : (
            results.map((item) => (
              <li key={getKey(item)}>
                <button type="button" onClick={() => handleSelect(item)} className={styles.option}>
                  {getLabel(item)}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
