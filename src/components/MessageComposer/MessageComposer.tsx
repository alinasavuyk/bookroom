'use client';
import { useRef, useState, ChangeEvent, FormEvent } from 'react';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { useToast } from '@/components/ToastProvider';
import { TbPlus, TbMoodSmile, TbX } from '@/lib/icons';
import EmojiPicker from '@/components/EmojiPicker';
import styles from '@/app/chat/ChatPage.module.css';

interface MessageComposerProps {
  sending: boolean;
  onSend: (payload: { text: string; image?: string }) => Promise<unknown>;
}

// Повністю самодостатній композер: текст, фото й емодзі — весь стан живе тут,
// батько лише отримує готове { text, image } при відправці
export default function MessageComposer({ sending, onSend }: MessageComposerProps) {
  const { showToast } = useToast();
  const [text, setText] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ previewUrl: string; url: string | null } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const composerInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePickPhoto = () => fileInputRef.current?.click();

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Файл має бути зображенням', 'error');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPendingImage({ previewUrl, url: null });
    setUploadingImage(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setPendingImage({ previewUrl, url });
    } catch {
      showToast('Не вдалося завантажити фото', 'error');
      setPendingImage(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const removePendingImage = () => setPendingImage(null);

  const handleSend = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (uploadingImage) return;
    if (!text.trim() && !pendingImage?.url) return;

    try {
      await onSend({ text: text.trim(), image: pendingImage?.url ?? undefined });
      setText('');
      setPendingImage(null);
    } catch {
      // помилку вже показано тостом у батьківській мутації — текст і фото
      // лишаємо на місці, щоб можна було спробувати надіслати ще раз
    }
  };

  return (
    <>
      {pendingImage && (
        <div className={styles.imagePreviewRow}>
          <div className={styles.imagePreviewThumb}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pendingImage.previewUrl} alt="" />
            <button
              type="button"
              onClick={removePendingImage}
              className={styles.imagePreviewRemove}
              aria-label="Прибрати фото"
            >
              <TbX />
            </button>
          </div>
          <span className={styles.imagePreviewLabel}>
            {uploadingImage ? 'Завантаження...' : 'Фото додано'}
          </span>
        </div>
      )}

      <form onSubmit={handleSend} className={styles.composer}>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} hidden />
        <button
          type="button"
          onClick={handlePickPhoto}
          disabled={uploadingImage}
          className={styles.iconButton}
          aria-label="Додати фото"
        >
          <TbPlus />
        </button>
        <input
          ref={composerInputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Напиши повідомлення..."
          className={styles.composerInput}
        />
        <button
          type="button"
          onClick={() => setEmojiOpen((prev) => !prev)}
          className={`${styles.iconButton} ${emojiOpen ? styles.iconButtonActive : ''}`}
          aria-label="Смайлики"
        >
          <TbMoodSmile />
        </button>
        <button
          type="submit"
          disabled={sending || uploadingImage || (!text.trim() && !pendingImage?.url)}
          className={styles.sendButton}
        >
          Надіслати
        </button>
      </form>

      {emojiOpen && (
        <EmojiPicker
          onSelect={(emoji) => {
            setText((prev) => prev + emoji);
            setTimeout(() => {
              const input = composerInputRef.current;
              if (input) {
                input.focus();
                input.setSelectionRange(input.value.length, input.value.length);
              }
            }, 0);
          }}
        />
      )}
    </>
  );
}
