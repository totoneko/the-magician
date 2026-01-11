'use client';

import { useContext } from 'react';
import { TurnChangeEffectContext, TurnChangeEffectContextType } from './context';

export const useTurnChangeEffect = (): TurnChangeEffectContextType => {
  const context = useContext(TurnChangeEffectContext);

  if (context === undefined) {
    throw new Error('useTurnChangeEffect must be used within a TurnChangeEffectProvider');
  }

  return context;
};
