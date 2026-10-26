'use client';
import Image from 'next/image';
import { ConversationDTO } from '@/types/models';
import Loader from '@/components/Loader';
import styles from '@/app/chat/ChatPage.module.css';

interface ConversationListProps {
  conversations: ConversationDTO[];
  isLoading: boolean;
  selectedUserId: string | null;
  onSelect: (userId: string) => void;
}

export default function ConversationList({
  conversations,
  isLoading,
  selectedUserId,
  onSelect,
}: ConversationListProps) {
  return (
    <div className={`${styles.listPane} ${selectedUserId ? styles.hiddenOnMobile : ''}`}>
      {isLoading ? (
        <Loader />
      ) : conversations.length === 0 ? (
        <p className={styles.listEmpty}>Поки що немає розмов</p>
      ) : (
        <ul className={styles.conversationList}>
          {conversations.map((conversation) => (
            <li key={conversation.userId}>
              <button
                type="button"
                onClick={() => onSelect(conversation.userId)}
                className={`${styles.conversationButton} ${
                  conversation.userId === selectedUserId ? styles.conversationButtonActive : ''
                }`}
              >
                {conversation.avatar ? (
                  <Image
                    src={conversation.avatar}
                    alt={conversation.name}
                    width={40}
                    height={40}
                    className={styles.avatar}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {conversation.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className={styles.conversationInfo}>
                  <div className={styles.conversationName}>
                    {conversation.name}
                    {conversation.unreadCount > 0 && (
                      <span className={styles.unreadBadge}>{conversation.unreadCount}</span>
                    )}
                  </div>
                  <p className={styles.conversationLastMessage}>{conversation.lastMessage}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
