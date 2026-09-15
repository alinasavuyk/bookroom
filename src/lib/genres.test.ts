import { describe, it, expect } from 'vitest';
import { BOOK_GENRES, OTHER_GENRE, STANDARD_BOOK_GENRES } from './genres';

describe('genres', () => {
  it('повний список містить "Інші"', () => {
    expect(BOOK_GENRES).toContain(OTHER_GENRE);
  });

  it('STANDARD_BOOK_GENRES не містить "Інші"', () => {
    expect(STANDARD_BOOK_GENRES).not.toContain(OTHER_GENRE);
  });

  it('STANDARD_BOOK_GENRES — це всі жанри, крім "Інші"', () => {
    expect(STANDARD_BOOK_GENRES.length).toBe(BOOK_GENRES.length - 1);
  });
});
