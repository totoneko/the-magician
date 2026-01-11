'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Button } from '@/component/interface/button';
import { FiAlertCircle, FiAlertTriangle, FiInfo, FiCheckCircle } from 'react-icons/fi';
import { ErrorCode, ErrorMessage } from '@/submodule/suit/constant';
import { useRouter } from 'next/navigation';

type ErrorType = 'error' | 'warning' | 'info' | 'success';

interface ErrorOverlayProps {
  isOpen: boolean;
  type?: ErrorType;
  title?: string;
  message: string;
  confirmButtonText?: string;
  onConfirm?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export const ErrorOverlay: React.FC<ErrorOverlayProps> = ({
  isOpen,
  type = 'error',
  title,
  message,
  confirmButtonText = 'OK',
  onConfirm,
  autoClose = false,
  autoCloseDelay = 3000,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  // モーダルの開閉制御
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleConfirm = useCallback(() => {
    if (message === ErrorMessage[ErrorCode.ROOM_NOT_FOUND]) {
      router.push('/entrance');
    } else if (onConfirm) {
      onConfirm();
    }
  }, [message, onConfirm, router]);

  // 自動閉じる機能
  useEffect(() => {
    if (!autoClose || !isOpen) return;

    const timer = setTimeout(() => {
      handleConfirm();
    }, autoCloseDelay);

    return () => clearTimeout(timer);
  }, [autoClose, isOpen, autoCloseDelay, handleConfirm]);

  // ESCキーでの閉じるを防ぐ
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      handleConfirm();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => {
      dialog.removeEventListener('cancel', handleCancel);
    };
  }, [handleConfirm]);

  // タイプに応じたスタイルとアイコン
  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return {
          icon: <FiAlertCircle className="w-16 h-16 text-red-500" />,
          borderColor: 'border-red-500',
          titleColor: 'text-red-400',
          bgGradient: 'from-red-900/20 to-transparent',
        };
      case 'warning':
        return {
          icon: <FiAlertTriangle className="w-16 h-16 text-yellow-500" />,
          borderColor: 'border-yellow-500',
          titleColor: 'text-yellow-400',
          bgGradient: 'from-yellow-900/20 to-transparent',
        };
      case 'info':
        return {
          icon: <FiInfo className="w-16 h-16 text-blue-500" />,
          borderColor: 'border-blue-500',
          titleColor: 'text-blue-400',
          bgGradient: 'from-blue-900/20 to-transparent',
        };
      case 'success':
        return {
          icon: <FiCheckCircle className="w-16 h-16 text-green-500" />,
          borderColor: 'border-green-500',
          titleColor: 'text-green-400',
          bgGradient: 'from-green-900/20 to-transparent',
        };
    }
  };

  const styles = getTypeStyles();
  const displayTitle = title || getDefaultTitle(type);

  return (
    <dialog
      ref={dialogRef}
      className="bg-transparent backdrop:bg-black/80 backdrop:backdrop-blur-sm max-w-md w-full p-0 rounded-lg overflow-visible fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 m-0"
    >
      <div
        className={`bg-slate-800 rounded-lg shadow-2xl p-8 border-2 ${styles.borderColor} bg-gradient-to-b ${styles.bgGradient}`}
      >
        {/* アイコン */}
        <div className="flex justify-center mb-4">{styles.icon}</div>

        {/* タイトル */}
        <div className="text-center mb-4">
          <h2 className={`text-2xl font-bold ${styles.titleColor}`}>{displayTitle}</h2>
        </div>

        {/* メッセージ */}
        <div className="text-center mb-8">
          <p className="text-slate-200 text-base whitespace-pre-line">{message}</p>
        </div>

        {/* 確認ボタン */}
        <div className="flex justify-center">
          <Button onClick={handleConfirm} variant="primary" size="md" className="min-w-32">
            {confirmButtonText}
          </Button>
        </div>
      </div>
    </dialog>
  );
};

function getDefaultTitle(type: ErrorType): string {
  switch (type) {
    case 'error':
      return 'エラー';
    case 'warning':
      return '警告';
    case 'info':
      return '情報';
    case 'success':
      return '成功';
  }
}
