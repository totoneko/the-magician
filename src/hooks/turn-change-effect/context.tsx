'use client';

import {
  createContext,
  ReactNode,
  useReducer,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from 'react';

export type TurnType = 'first' | 'second';

export interface TurnChangeEffectParams {
  turn: TurnType;
}

export interface TurnChangeEffectState {
  isVisible: boolean;
  turn: TurnType;
}

export type TurnChangeEffectAction =
  | { type: 'SHOW_EFFECT'; params: TurnChangeEffectParams }
  | { type: 'HIDE_EFFECT' };

export type TurnChangeEffectContextType = {
  state: TurnChangeEffectState;
  showTurnChangeEffect: (params: TurnChangeEffectParams) => Promise<void>;
};

export const TurnChangeEffectContext = createContext<TurnChangeEffectContextType | undefined>(
  undefined
);

const initialState: TurnChangeEffectState = {
  isVisible: false,
  turn: 'first',
};

function turnChangeEffectReducer(
  state: TurnChangeEffectState,
  action: TurnChangeEffectAction
): TurnChangeEffectState {
  switch (action.type) {
    case 'SHOW_EFFECT':
      return {
        ...state,
        isVisible: true,
        turn: action.params.turn,
      };
    case 'HIDE_EFFECT':
      return {
        ...state,
        isVisible: false,
      };
    default:
      return state;
  }
}

export const TurnChangeEffectProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(turnChangeEffectReducer, initialState);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTurnChangeEffect = useCallback(
    (params: TurnChangeEffectParams): Promise<void> => {
      dispatch({ type: 'SHOW_EFFECT', params });

      return new Promise(resolve => {
        timeoutRef.current = setTimeout(() => {
          dispatch({ type: 'HIDE_EFFECT' });
          resolve();
        }, 1800); // 1.8秒後にエフェクトを非表示にする
      });
    },
    [dispatch]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const contextValue = useMemo(
    () => ({ state, showTurnChangeEffect }),
    [state, showTurnChangeEffect]
  );

  return (
    <TurnChangeEffectContext.Provider value={contextValue}>
      {children}
    </TurnChangeEffectContext.Provider>
  );
};
