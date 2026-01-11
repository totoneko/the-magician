'use client';

import { createContext, ReactNode, useReducer, useMemo } from 'react';

type ErrorType = 'error' | 'warning' | 'info' | 'success';

// Define the state interface for the error overlay
export interface ErrorOverlayState {
  isOpen: boolean;
  type: ErrorType;
  title?: string;
  message: string;
  confirmButtonText?: string;
  autoClose?: boolean;
  autoCloseDelay?: number;
  onConfirmCallback?: () => void;
}

// Define the action types for the reducer
export type ErrorOverlayAction =
  | {
      type: 'SHOW_OVERLAY';
      overlayType: ErrorType;
      title?: string;
      message: string;
      confirmButtonText?: string;
      autoClose?: boolean;
      autoCloseDelay?: number;
      onConfirmCallback?: () => void;
    }
  | { type: 'HIDE_OVERLAY' };

// Define the context type
export type ErrorOverlayContextType = {
  state: ErrorOverlayState;
  showError: (message: string, title?: string, onConfirm?: () => void) => void;
  showWarning: (message: string, title?: string, onConfirm?: () => void) => void;
  showInfo: (message: string, title?: string, onConfirm?: () => void) => void;
  showSuccess: (message: string, title?: string, onConfirm?: () => void) => void;
  hideOverlay: () => void;
};

// Create the context
export const ErrorOverlayContext = createContext<ErrorOverlayContextType | undefined>(undefined);

// Initial state
const initialState: ErrorOverlayState = {
  isOpen: false,
  type: 'error',
  message: '',
  title: undefined,
  confirmButtonText: 'OK',
  autoClose: false,
  autoCloseDelay: 3000,
  onConfirmCallback: undefined,
};

// Reducer function
function errorOverlayReducer(
  state: ErrorOverlayState,
  action: ErrorOverlayAction
): ErrorOverlayState {
  switch (action.type) {
    case 'SHOW_OVERLAY':
      return {
        ...state,
        isOpen: true,
        type: action.overlayType,
        title: action.title,
        message: action.message,
        confirmButtonText: action.confirmButtonText || 'OK',
        autoClose: action.autoClose || false,
        autoCloseDelay: action.autoCloseDelay || 3000,
        onConfirmCallback: action.onConfirmCallback,
      };
    case 'HIDE_OVERLAY':
      return {
        ...state,
        isOpen: false,
      };
    default:
      return state;
  }
}

// Provider component
export const ErrorOverlayProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(errorOverlayReducer, initialState);

  // Action creators
  const showError = (message: string, title?: string, onConfirm?: () => void) => {
    dispatch({
      type: 'SHOW_OVERLAY',
      overlayType: 'error',
      title,
      message,
      onConfirmCallback: onConfirm,
    });
  };

  const showWarning = (message: string, title?: string, onConfirm?: () => void) => {
    dispatch({
      type: 'SHOW_OVERLAY',
      overlayType: 'warning',
      title,
      message,
      onConfirmCallback: onConfirm,
    });
  };

  const showInfo = (message: string, title?: string, onConfirm?: () => void) => {
    dispatch({
      type: 'SHOW_OVERLAY',
      overlayType: 'info',
      title,
      message,
      onConfirmCallback: onConfirm,
    });
  };

  const showSuccess = (message: string, title?: string, onConfirm?: () => void) => {
    dispatch({
      type: 'SHOW_OVERLAY',
      overlayType: 'success',
      title,
      message,
      autoClose: true,
      autoCloseDelay: 3000,
      onConfirmCallback: onConfirm,
    });
  };

  const hideOverlay = () => {
    dispatch({ type: 'HIDE_OVERLAY' });
  };

  // Memoized context value
  const contextValue = useMemo(
    () => ({ state, showError, showWarning, showInfo, showSuccess, hideOverlay }),
    [state]
  );

  return (
    <ErrorOverlayContext.Provider value={contextValue}>{children}</ErrorOverlayContext.Provider>
  );
};
