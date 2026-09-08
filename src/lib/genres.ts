export const BOOK_GENRES = ['Фантастика', 'Детективи', 'Трилери', 'Пригоди', 'Фентезі', 'Інші'] as const;

export const OTHER_GENRE = 'Інші';

export const STANDARD_BOOK_GENRES = BOOK_GENRES.filter((genre) => genre !== OTHER_GENRE);
