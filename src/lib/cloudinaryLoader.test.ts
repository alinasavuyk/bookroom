import { describe, it, expect } from 'vitest';
import cloudinaryLoader from './cloudinaryLoader';

describe('cloudinaryLoader', () => {
  it('додає трансформації (формат, якість, ширину) до Cloudinary URL', () => {
    const url = cloudinaryLoader({
      src: 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg',
      width: 400,
    });
    expect(url).toBe('https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_400/v1/sample.jpg');
  });

  it('використовує задану якість замість "auto"', () => {
    const url = cloudinaryLoader({
      src: 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg',
      width: 400,
      quality: 80,
    });
    expect(url).toContain('q_80');
  });

  it('не чіпає URL не з Cloudinary', () => {
    const src = 'https://example.com/avatar.png';
    expect(cloudinaryLoader({ src, width: 200 })).toBe(src);
  });
});
