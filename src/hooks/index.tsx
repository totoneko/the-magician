import { ReactNode } from 'react';
import { WebSocketProvider } from './websocket';
import { SystemContextProvider } from './system';
import { AttackAnimationProvider } from './attack-animation';
import { SoundManagerV2Provider } from './soundV2';
import { ErrorOverlayProvider } from './error-overlay';

interface Props {
  children: ReactNode;
}

export const GlobalContextProvider = ({ children }: Props) => {
  return (
    <ErrorOverlayProvider>
      <WebSocketProvider>
        <SystemContextProvider>
          <AttackAnimationProvider>
            <SoundManagerV2Provider>{children}</SoundManagerV2Provider>
          </AttackAnimationProvider>
        </SystemContextProvider>
      </WebSocketProvider>
    </ErrorOverlayProvider>
  );
};
