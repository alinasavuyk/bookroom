interface CloudinaryLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

// Замість того, щоб Vercel сам стискав зображення (обмежена квота на безкоштовному
// плані), просимо Cloudinary віддати вже оптимізовану версію: сучасний формат
// (f_auto → WebP/AVIF), автоматична якість (q_auto) і потрібна ширина.
export default function cloudinaryLoader({ src, width, quality }: CloudinaryLoaderProps): string {
  if (!src.includes('res.cloudinary.com')) return src;

  const transforms = `f_auto,q_${quality ?? 'auto'},w_${width}`;
  return src.replace('/upload/', `/upload/${transforms}/`);
}
