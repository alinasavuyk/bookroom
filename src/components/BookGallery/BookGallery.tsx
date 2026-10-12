'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';
import SaveButton from '@/components/SaveButton';
import { TbZoomIn } from '@/lib/icons';
import styles from './BookGallery.module.css';

// Орієнтовні пропорції обкладинки книги — PhotoSwipe використовує їх лише для
// розрахунку анімації відкриття, реальний розмір підхоплюється з завантаженого фото
const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 1600;

interface BookGalleryProps {
  bookId: string;
  images: string[];
  title: string;
}

export default function BookGallery({ bookId, images, title }: BookGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const lightboxRef = useRef<PhotoSwipeLightbox | null>(null);
  const activeImage = images[activeIndex];

  useEffect(() => {
    if (images.length === 0) return;

    const lightbox = new PhotoSwipeLightbox({
      dataSource: images.map((src) => ({ src, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, alt: title })),
      pswpModule: () => import('photoswipe'),
      bgOpacity: 0.9,
      showHideAnimationType: 'zoom',
    });
    lightbox.init();
    lightboxRef.current = lightbox;

    return () => {
      lightbox.destroy();
      lightboxRef.current = null;
    };
  }, [images, title]);

  const openLightbox = () => lightboxRef.current?.loadAndOpen(activeIndex);

  return (
    <div className={styles.wrap}>
      <div className={styles.coverWrap}>
        {activeImage ? (
          <button type="button" onClick={openLightbox} className={styles.coverButton} aria-label="Переглянути фото">
            <Image src={activeImage} alt={title} fill sizes="14rem" className={styles.cover} />
            <span className={styles.zoomHint}>
              <TbZoomIn />
            </span>
          </button>
        ) : (
          <span className={styles.noCover}>Без обкладинки</span>
        )}
        <SaveButton bookId={bookId} className={styles.saveButton} />
      </div>

      {images.length > 1 && (
        <ul className={styles.thumbnails}>
          {images.map((image, index) => (
            <li key={image + index}>
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`${styles.thumbButton} ${index === activeIndex ? styles.thumbButtonActive : ''}`}
                aria-label={`Фото ${index + 1}`}
              >
                <Image src={image} alt="" width={44} height={58} className={styles.thumbImage} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
