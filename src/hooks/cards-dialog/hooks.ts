'use client';

import { useContext } from 'react';
import { CardsDialogContext, CardsDialogContextType } from './context';
import { ICard } from '@/submodule/suit/types';
import { useSoundV2 } from '../soundV2/hooks';
import { useGameStore } from '@/hooks/game';

// Define the GameState type based on what we've seen in the code
type GameState = ReturnType<typeof useGameStore.getState>;

export const useCardsDialog = (): CardsDialogContextType & {
  openCardsDialog: (
    cardsOrSelector: ICard[] | ((state: GameState) => ICard[]),
    title: string
  ) => void;
  openCardsSelector: (
    cards: ICard[],
    title: string,
    count: number,
    options?: { timeLimit?: number }
  ) => Promise<string[]>;
  closeCardsDialog: () => void;
  confirmSelection: (result?: string[]) => void;
} => {
  const context = useContext(CardsDialogContext);
  if (context === undefined) {
    throw new Error('useCardsDialog must be used within a CardsDialogProvider');
  }

  const { play } = useSoundV2();

  // Function to open cards dialog with the provided cards or selector and title (viewer mode)
  const openCardsDialog = (
    cardsOrSelector: ICard[] | ((state: GameState) => ICard[]),
    title: string
  ) => {
    // Clean up any existing subscription
    if (context.cleanupFunction) {
      context.cleanupFunction();
      context.setCleanupFunction(null);
    }

    context.setSelection([]);
    context.setResolvePromise(null);

    if (typeof cardsOrSelector === 'function') {
      // It's a selector function - set up subscription
      const initialCards = cardsOrSelector(useGameStore.getState());
      context.setCards(initialCards);

      // Subscribe to the store and update cards when state changes
      const unsubscribe = useGameStore.subscribe(state => {
        // Get the cards from the selector and update state if they have changed
        const updatedCards = cardsOrSelector(state);
        context.setCards(updatedCards);
      });

      // Save the unsubscribe function for cleanup
      context.setCleanupFunction(() => unsubscribe);
    } else {
      // It's a direct array of cards
      context.setCards(cardsOrSelector);
    }

    context.setDialogTitle(title);
    context.setIsSelector(false);
    context.setCount(0);
    context.setTimeLimit(null);
    play('open'); // Play the open sound effect
  };

  // Function to open cards selector and return a Promise that resolves with selected card IDs
  const openCardsSelector = (
    cards: ICard[],
    title: string,
    count: number,
    options?: { timeLimit?: number }
  ): Promise<string[]> => {
    // 既存のダイアログが開いている場合、先にクリーンアップ
    // （closeCardsDialogとの連続呼び出しでバッチ処理されても正しく動作するよう明示的に処理）
    if (context.resolvePromise) {
      context.resolvePromise([]);
    }
    context.setResolvePromise(null);
    context.setTimeLimit(null);

    context.setSelection([]);
    context.setCards(cards);
    context.setDialogTitle(title);
    context.setIsSelector(true);
    context.setCount(count);
    context.setTimeLimit(options?.timeLimit || null);
    play('open'); // Play the open sound effect

    return new Promise<string[]>(resolve => {
      context.setResolvePromise(() => resolve);
    });
  };

  // Function to confirm the current selection and resolve the promise
  const confirmSelection = (result?: string[]) => {
    if (context.resolvePromise) {
      context.resolvePromise(result ?? [...context.selection]);
      context.setResolvePromise(null);
    }
    // resolvePromiseがnullでもダイアログを閉じる（バッチ処理で状態が不整合になった場合の対応）
    if (context.cards !== undefined) {
      context.setCards(undefined);
      context.setSelection([]);
    }
  };

  // Function to close the dialog by clearing the cards array
  const closeCardsDialog = () => {
    // If there's an active promise and we're in selector mode, resolve with empty array
    if (context.resolvePromise && context.isSelector) {
      context.resolvePromise([]);
      context.setResolvePromise(null);
    }

    // Clean up any active subscription
    if (context.cleanupFunction) {
      context.cleanupFunction();
      context.setCleanupFunction(null);
    }

    if (context.cards?.length !== undefined) play('close');

    context.setCards(undefined);
    context.setSelection([]);
  };

  return {
    ...context,
    openCardsDialog,
    openCardsSelector,
    closeCardsDialog,
    confirmSelection,
  };
};
