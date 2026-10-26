'use client';
import { useEffect, useRef } from 'react';
import { MessageDTO } from '@/types/models';
import Loader from '@/components/Loader';
import MessageBubble from '@/components/MessageBubble';
import styles from '@/app/chat/ChatPage.module.css';

interface MessageThreadProps {
  messages: MessageDTO[];
  isLoading: boolean;
  meId?: string;
  isResponding: boolean;
  onAccept: (messageId: string) => void;
  onDecline: (messageId: string) => void;
  onCancel: (messageId: string) => void;
}

export default function MessageThread({
  messages,
  isLoading,
  meId,
  isResponding,
  onAccept,
  onDecline,
  onCancel,
}: MessageThreadProps) {
  const endRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <ul className={styles.messageList}>
      {messages.map((message) => (
        <MessageBubble
          key={message._id}
          message={message}
          isMine={message.sender === meId}
          isResponding={isResponding}
          onAccept={onAccept}
          onDecline={onDecline}
          onCancel={onCancel}
        />
      ))}
      <li ref={endRef} />
    </ul>
  );
}
