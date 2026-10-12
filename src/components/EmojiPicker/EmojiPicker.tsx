'use client';
import styles from './EmojiPicker.module.css';

const EMOJIS = [
  '😀', '😁', '😂', '🤣', '😊', '😍', '😘', '😉', '😎', '🤔',
  '😢', '😭', '😡', '😱', '🥳', '😴', '🙄', '😅', '🤗', '🤩',
  '👍', '👎', '👏', '🙏', '🤝', '💪', '✌️', '🤞', '👋', '🫶',
  '❤️', '💔', '💕', '🔥', '⭐', '✨', '🎉', '🎁', '📚', '📖',
  '☕', '🍵', '🌸', '🌿', '🐱', '🐶', '😇', '🤭', '😏', '🥺',
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export default function EmojiPicker({ onSelect }: EmojiPickerProps) {
  return (
    <div className={styles.panel}>
      {EMOJIS.map((emoji) => (
        <button key={emoji} type="button" onClick={() => onSelect(emoji)} className={styles.emojiButton}>
          {emoji}
        </button>
      ))}
    </div>
  );
}
