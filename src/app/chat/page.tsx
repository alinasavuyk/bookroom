'use client';
import { useEffect, useState, Suspense } from 'react';
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
import { getLastDelivery, saveLastDelivery } from '@/lib/lastDelivery';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { useToast, onErrorToast } from '@/components/ToastProvider';
import Loader from '@/components/Loader';
import Modal from '@/components/Modal';
import DeliveryPicker from '@/components/DeliveryPicker';
import UserActionsMenu from '@/components/UserActionsMenu';
import ConversationList from '@/components/ConversationList';
import MessageThread from '@/components/MessageThread';
import MessageComposer from '@/components/MessageComposer';
import styles from './ChatPage.module.css';

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

  const { data: myProfile } = useQuery({
    queryKey: ['user', meId],
    queryFn: () => fetchUserProfile(meId!),
    enabled: !!meId,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedUserId],
    queryFn: () => fetchMessages(selectedUserId!),
    enabled: !!selectedUserId,
  });

  // Відкриття розмови позначає повідомлення прочитаними на сервері —
  // оновлюємо лічильник у навбарі одразу, не чекаючи наступного опитування
  useEffect(() => {
    if (selectedUserId) {
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    }
  }, [selectedUserId, messages, queryClient]);

  const mutation = useMutation({
    mutationFn: ({ text, image }: { text: string; image?: string }) =>
      sendMessage(selectedUserId!, text, bookParam, image),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: onErrorToast(showToast),
  });

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
    onError: onErrorToast(showToast),
  });

  const handleAcceptClick = (messageId: string) => {
    const last = getLastDelivery();
    setModalCity(last?.city ?? null);
    setModalWarehouse(last?.warehouse ?? null);
    setDeliveryModal({ messageId });
  };

  const handleDecline = (messageId: string) => offerMutation.mutate({ id: messageId, action: 'decline' });
  const handleCancel = (messageId: string) => offerMutation.mutate({ id: messageId, action: 'cancel' });

  const handleDeliverySubmit = () => {
    if (!deliveryModal || !modalCity || !modalWarehouse) return;
    offerMutation.mutate(
      {
        id: deliveryModal.messageId,
        action: 'accept',
        city: modalCity.name,
        warehouse: modalWarehouse.number,
      },
      { onSuccess: () => saveLastDelivery(modalCity, modalWarehouse) }
    );
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
    <div className={`${styles.page} chat-page-root`}>
      <h1 className={styles.heading}>Повідомлення</h1>

      <div className={styles.layout}>
        <ConversationList
          conversations={conversations}
          isLoading={conversationsLoading}
          selectedUserId={selectedUserId}
          onSelect={setSelectedUserId}
        />

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

                {meId && selectedUserId && (
                  <div className={styles.threadHeaderActions}>
                    <UserActionsMenu
                      myId={meId}
                      targetUserId={selectedUserId}
                      isBlocked={(myProfile?.blockedUsers ?? []).includes(selectedUserId)}
                    />
                  </div>
                )}
              </div>

              <MessageThread
                messages={messages}
                isLoading={messagesLoading}
                meId={meId}
                isResponding={offerMutation.isPending}
                onAccept={handleAcceptClick}
                onDecline={handleDecline}
                onCancel={handleCancel}
              />

              <MessageComposer sending={mutation.isPending} onSend={(payload) => mutation.mutateAsync(payload)} />
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
