'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/component/interface/button';

interface LoadingOverlayProps {
  // モーダルの表示・非表示
  isOpen: boolean;
  // 表示するメインメッセージ
  message?: string;
  // サブメッセージ（オプション）
  subMessage?: string;
  // 終了ボタンの表示・非表示
  showExitButton?: boolean;
  // 終了ボタンのテキスト
  exitButtonText?: string;
  // カスタム終了処理（デフォルトは/entranceへリダイレクト）
  onExit?: () => void;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isOpen,
  message = '読み込み中...',
  subMessage,
  showExitButton = true,
  exitButtonText = '終了',
  onExit,
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

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      router.push('/entrance');
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="bg-transparent backdrop:bg-black/70 backdrop:backdrop-blur-sm max-w-md w-full p-0 rounded-lg overflow-visible fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 m-0"
    >
      <div className="bg-slate-800 rounded-lg shadow-2xl p-8 border-2 border-slate-600">
        {/* メインメッセージ */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">{message}</h2>
          {subMessage && <p className="text-slate-300 text-sm">{subMessage}</p>}
        </div>

        {/* 無限プログレスバー */}
        <div className="mb-8">
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-progress"
              style={{
                width: '40%',
              }}
            />
          </div>
        </div>

        {/* 終了ボタン */}
        {showExitButton && (
          <div className="flex justify-center">
            <Button onClick={handleExit} variant="secondary" size="md" className="min-w-32">
              {exitButtonText}
            </Button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(350%);
          }
        }

        :global(.animate-progress) {
          animation: progress 1.5s ease-in-out infinite;
        }
      `}</style>
    </dialog>
  );
};
