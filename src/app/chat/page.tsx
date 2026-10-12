'use client';
import { useEffect, useRef, useState, ChangeEvent, FormEvent, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchConversations,
  fetchMessages,
  fetchUserProfile,
  sendMessage,
  respondToExchangeOffer,
  NovaPoshtaCity,
  NovaPoshtaWarehouse,
} from '@/lib/api-client';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { TbPlus, TbMoodSmile, TbX } from '@/lib/icons';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { useToast } from '@/components/ToastProvider';
import Loader from '@/components/Loader';
import Modal from '@/components/Modal';
import DeliveryPicker from '@/components/DeliveryPicker';
import EmojiPicker from '@/components/EmojiPicker';
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
  const composerInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [emojiOpen, setEmojiOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ previewUrl: string; url: string | null } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [deliveryModal, setDeliveryModal] = useState<{ messageId: string } | null>(null);
  const [modalCity, setModalCity] = useState<NovaPoshtaCity | null>(null);
  const [modalWarehouse, setModalWarehouse] = useState<NovaPoshtaWarehouse | null>(null);

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
    mutationFn: ({ text: value, image }: { text: string; image?: string }) =>
      sendMessage(selectedUserId!, value, bookParam, image),
    onSuccess: () => {
      setText('');
      setPendingImage(null);
      queryClient.invalidateQueries({ queryKey: ['messages', selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (err: Error) => showToast(err.message, 'error'),
  });

  const handleSend = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUserId || uploadingImage) return;
    if (!text.trim() && !pendingImage?.url) return;
    mutation.mutate({ text: text.trim(), image: pendingImage?.url ?? undefined });
  };

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

  const closeDeliveryModal = () => {
    setDeliveryModal(null);
    setModalCity(null);
    setModalWarehouse(null);
  };

  const offerMutation = useMutation({
    mutationFn: ({
      id,
      action,
      city,
      warehouse,
    }: {
      id: string;
      action: 'accept' | 'decline' | 'cancel';
      city?: string;
      warehouse?: string;
    }) => respondToExchangeOffer(id, action, city && warehouse ? { city, warehouse } : undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      closeDeliveryModal();
    },
    onError: (err: Error) => showToast(err.message, 'error'),
  });

  const handleDecline = (messageId: string) => offerMutation.mutate({ id: messageId, action: 'decline' });
  const handleCancel = (messageId: string) => offerMutation.mutate({ id: messageId, action: 'cancel' });

  const handleDeliverySubmit = () => {
    if (!deliveryModal || !modalCity || !modalWarehouse) return;
    offerMutation.mutate({
      id: deliveryModal.messageId,
      action: 'accept',
      city: modalCity.name,
      warehouse: modalWarehouse.number,
    });
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
                    const isOffer = !!message.offeredBook;
                    const canRespond = isOffer && !isMine && message.offerStatus === 'pending';
                    const canCancel =
                      isOffer && (message.offerStatus === 'pending' || message.offerStatus === 'accepted');

                    return (
                      <li
                        key={message._id}
                        className={`${styles.messageBubbleRow} ${isMine ? styles.messageBubbleRowMine : ''}`}
                      >
                        <div className={`${styles.messageBubble} ${isMine ? styles.messageBubbleMine : ''}`}>
                          {message.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={message.image}
                              alt=""
                              className={styles.messageImage}
                              style={message.text ? { marginBottom: '0.35rem' } : undefined}
                            />
                          )}
                          {message.text}

                          {isOffer && (
                            <div className={styles.offerCard}>
                              <p className={styles.offerLine}>
                                {message.offeredBook?.title} → {message.book?.title}
                              </p>
                              {message.offerStatus && message.offerStatus !== 'pending' && (
                                <span className={styles.offerStatus}>
                                  {message.offerStatus === 'accepted'
                                    ? 'Прийнято'
                                    : message.offerStatus === 'cancelled'
                                      ? 'Скасовано'
                                      : 'Відхилено'}
                                </span>
                              )}

                              {message.ownerCity && (
                                <p className={styles.offerDelivery}>
                                  Власник: {message.ownerCity}, відділення {message.ownerWarehouse}
                                </p>
                              )}
                              {message.offererCity && (
                                <p className={styles.offerDelivery}>
                                  Пропонував обмін: {message.offererCity}, відділення {message.offererWarehouse}
                                </p>
                              )}

                              {(canRespond || canCancel) && (
                                <div className={styles.offerActions}>
                                  {canRespond && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => setDeliveryModal({ messageId: message._id })}
                                        disabled={offerMutation.isPending}
                                        className={styles.offerAccept}
                                      >
                                        Прийняти
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDecline(message._id)}
                                        disabled={offerMutation.isPending}
                                        className={styles.offerDecline}
                                      >
                                        Відхилити
                                      </button>
                                    </>
                                  )}
                                  {canCancel && (
                                    <button
                                      type="button"
                                      onClick={() => handleCancel(message._id)}
                                      disabled={offerMutation.isPending}
                                      className={styles.offerDecline}
                                    >
                                      Скасувати обмін
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          <span className={styles.messageTime}>{formatTime(message.createdAt)}</span>
                        </div>
                      </li>
                    );
                  })}
                  <li ref={messagesEndRef} />
                </ul>
              )}

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
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  hidden
                />
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
                  disabled={mutation.isPending || uploadingImage || (!text.trim() && !pendingImage?.url)}
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
          )}
        </div>
      </div>

      {deliveryModal && (
        <Modal onClose={closeDeliveryModal}>
          <h2 className={styles.deliveryModalTitle}>Прийняти обмін</h2>
          <p className={styles.deliveryModalText}>
            Вкажи місто й відділення Нової Пошти, куди надсилати тобі книгу.
          </p>

          <div className={styles.deliveryModalFields}>
            <DeliveryPicker
              city={modalCity}
              warehouse={modalWarehouse}
              onCityChange={(selected) => {
                setModalCity(selected);
                setModalWarehouse(null);
              }}
              onWarehouseChange={setModalWarehouse}
            />
          </div>

          <div className={styles.deliveryModalActions}>
            <button
              type="button"
              onClick={handleDeliverySubmit}
              disabled={!modalCity || !modalWarehouse || offerMutation.isPending}
              className={styles.offerAccept}
            >
              {offerMutation.isPending ? 'Збереження...' : 'Підтвердити'}
            </button>
            <button type="button" onClick={closeDeliveryModal} className={styles.offerDecline}>
              Скасувати
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
