'use client';
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleBlockedUser, reportUser } from '@/lib/api-client';
import { useToast, onErrorToast } from '@/components/ToastProvider';
import Modal from '@/components/Modal';
import { TbDotsVertical, TbFlag, TbUserX } from '@/lib/icons';
import styles from './UserActionsMenu.module.css';

interface UserActionsMenuProps {
  myId: string;
  targetUserId: string;
  isBlocked: boolean;
}

export default function UserActionsMenu({ myId, targetUserId, isBlocked }: UserActionsMenuProps) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const blockMutation = useMutation({
    mutationFn: (block: boolean) => toggleBlockedUser(myId, targetUserId, block),
    onSuccess: (_, block) => {
      queryClient.invalidateQueries({ queryKey: ['user', myId] });
      showToast(block ? 'Користувача заблоковано' : 'Користувача розблоковано');
    },
    onError: onErrorToast(showToast, 'Не вдалося оновити блокування'),
  });

  const reportMutation = useMutation({
    mutationFn: () => reportUser(targetUserId, reason),
    onSuccess: () => {
      showToast('Скаргу надіслано');
      setReportOpen(false);
      setReason('');
    },
    onError: onErrorToast(showToast),
  });

  if (myId === targetUserId) return null;

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={styles.triggerButton}
        aria-label="Дії з користувачем"
      >
        <TbDotsVertical />
      </button>

      {open && (
        <ul className={styles.menu}>
          <li>
            <button
              type="button"
              onClick={() => {
                setReportOpen(true);
                setOpen(false);
              }}
              className={styles.menuItem}
            >
              <TbFlag /> Поскаржитись
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => {
                blockMutation.mutate(!isBlocked);
                setOpen(false);
              }}
              disabled={blockMutation.isPending}
              className={styles.menuItem}
            >
              <TbUserX /> {isBlocked ? 'Розблокувати' : 'Заблокувати'}
            </button>
          </li>
        </ul>
      )}

      {reportOpen && (
        <Modal onClose={() => setReportOpen(false)}>
          <h2 className={styles.modalTitle}>Поскаржитись на користувача</h2>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Опиши причину скарги..."
            className={styles.reasonField}
            rows={4}
          />
          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={() => reportMutation.mutate()}
              disabled={!reason.trim() || reportMutation.isPending}
              className={styles.submitButton}
            >
              {reportMutation.isPending ? 'Надсилання...' : 'Надіслати скаргу'}
            </button>
            <button type="button" onClick={() => setReportOpen(false)} className={styles.cancelButton}>
              Скасувати
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
