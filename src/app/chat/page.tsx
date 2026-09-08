'use client';
import { useEffect, useRef, useState, FormEvent, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchConversations, fetchMessages, fetchUserProfile, sendMessage } from '@/lib/api-client';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { useToast } from '@/components/ToastProvider';
import Loader from '@/components/Loader';
import styles from './ChatPage.module.css';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPage() {
  return (
    <Suspense fallback={<Loader />}>
      <ChatPageContent />
    </Suspense>
  );
}

function ChatPageContent() {
  const status = useRequireAuth();
  const { data: session } = useSession();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  const meId = session?.user?.id;
  const bookParam = searchParams.get('book') ?? undefined;

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const withParam = searchParams.get('with');
    if (withParam) setSelectedUserId(withParam);
  }, [searchParams]);

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
    enabled: !!meId,
  });

  const { data: selectedUser } = useQuery({
    queryKey: ['user', selectedUserId],
    queryFn: () => fetchUserProfile(selectedUserId!),
    enabled: !!selectedUserId,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedUserId],
    queryFn: () => fetchMessages(selectedUserId!),
    enabled: !!selectedUserId,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  // Відкриття розмови позначає повідомлення прочитаними на сервері —
  // оновлюємо лічильник у навбарі одразу, не чекаючи наступного опитування
  useEffect(() => {
    if (selectedUserId) {
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    }
  }, [selectedUserId, messages, queryClient]);

  const mutation = useMutation({
    mutationFn: (value: string) => sendMessage(selectedUserId!, value, bookParam),
    onSuccess: () => {
      setText('');
      queryClient.invalidateQueries({ queryKey: ['messages', selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (err: Error) => showToast(err.message, 'error'),
  });

  const handleSend = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text.trim() || !selectedUserId) return;
    mutation.mutate(text.trim());
  };

  const activeConversation = conversations.find((c) => c.userId === selectedUserId);
  const headerName = activeConversation?.name ?? selectedUser?.name ?? '';
  const headerAvatar = activeConversation?.avatar ?? selectedUser?.avatar ?? '';

  if (status === 'loading') {
    return <Loader />;
  }

  if (status !== 'authenticated') {
    return null;
  }

  return (
    <div>
      <h1 className={styles.heading}>Повідомлення</h1>

      <div className={styles.layout}>
        <div className={`${styles.listPane} ${selectedUserId ? styles.hiddenOnMobile : ''}`}>
          {conversationsLoading ? (
            <Loader />
          ) : conversations.length === 0 ? (
            <p className={styles.listEmpty}>Поки що немає розмов</p>
          ) : (
            <ul className={styles.conversationList}>
              {conversations.map((conversation) => (
                <li key={conversation.userId}>
                  <button
                    type="button"
                    onClick={() => setSelectedUserId(conversation.userId)}
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

        <div className={`${styles.threadPane} ${selectedUserId ? styles.visibleOnMobile : ''}`}>
          {!selectedUserId ? (
            <p className={styles.threadEmpty}>Обери розмову зі списку</p>
          ) : (
            <>
              <div className={styles.threadHeader}>
                <button
                  type="button"
                  onClick={() => setSelectedUserId(null)}
                  className={styles.backButton}
                  aria-label="Назад до списку розмов"
                >
                  ←
                </button>
                {headerAvatar ? (
                  <Image src={headerAvatar} alt={headerName} width={32} height={32} className={styles.avatar} />
                ) : (
                  <div className={styles.avatarPlaceholder}>{headerName.charAt(0).toUpperCase()}</div>
                )}
                <span className={styles.threadHeaderName}>{headerName}</span>
              </div>

              {messagesLoading ? (
                <Loader />
              ) : (
                <ul className={styles.messageList}>
                  {messages.map((message) => {
                    const isMine = message.sender === meId;
                    return (
                      <li
                        key={message._id}
                        className={`${styles.messageBubbleRow} ${isMine ? styles.messageBubbleRowMine : ''}`}
                      >
                        <div className={`${styles.messageBubble} ${isMine ? styles.messageBubbleMine : ''}`}>
                          {message.text}
                          <span className={styles.messageTime}>{formatTime(message.createdAt)}</span>
                        </div>
                      </li>
                    );
                  })}
                  <li ref={messagesEndRef} />
                </ul>
              )}

              <form onSubmit={handleSend} className={styles.composer}>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Напиши повідомлення..."
                  className={styles.composerInput}
                />
                <button type="submit" disabled={mutation.isPending || !text.trim()} className={styles.sendButton}>
                  Надіслати
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
