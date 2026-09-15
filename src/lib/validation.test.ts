import { describe, it, expect } from 'vitest';
import { isValidEmail, isValidPassword, isNonEmpty } from './validation';

describe('isValidEmail', () => {
  it('приймає коректний email', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
  });

  it('відхиляє email без @', () => {
    expect(isValidEmail('testexample.com')).toBe(false);
  });

  it('відхиляє email без домену', () => {
    expect(isValidEmail('test@')).toBe(false);
  });

  it('ігнорує пробіли навколо', () => {
    expect(isValidEmail('  test@example.com  ')).toBe(true);
  });
});

describe('isValidPassword', () => {
  it('приймає пароль від 6 символів', () => {
    expect(isValidPassword('123456')).toBe(true);
  });

  it('відхиляє короткий пароль', () => {
    expect(isValidPassword('12345')).toBe(false);
  });

  it('не рахує пробіли як символи пароля', () => {
    expect(isValidPassword('      ')).toBe(false);
  });
});

describe('isNonEmpty', () => {
  it('відхиляє порожній рядок', () => {
    expect(isNonEmpty('')).toBe(false);
  });

  it('відхиляє рядок лише з пробілів', () => {
    expect(isNonEmpty('   ')).toBe(false);
  });

  it('приймає непорожній текст', () => {
    expect(isNonEmpty('текст')).toBe(true);
  });
});
