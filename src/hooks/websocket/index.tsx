'use client';

import { webSocketService } from '@/service/websocket';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { ErrorOverlayContext } from '@/hooks/error-overlay';

export type WebSocketContextType = {
  websocket: typeof webSocketService | undefined;
};

export const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const [websocket, setWebsocket] = useState<typeof webSocketService | undefined>(undefined);

  const errorOverlayContext = useContext(ErrorOverlayContext);

  useEffect(() => {
    setWebsocket(webSocketService);

    // エラーハンドラーを設定
    if (errorOverlayContext) {
      webSocketService.setErrorHandler((message, title, onConfirm) => {
        errorOverlayContext.showError(message, title, onConfirm);
      });

      webSocketService.setWarningHandler((message, title, onConfirm) => {
        errorOverlayContext.showWarning(message, title, onConfirm);
      });
    }
  }, [errorOverlayContext]);

  return <WebSocketContext.Provider value={{ websocket }}>{children}</WebSocketContext.Provider>;
};
