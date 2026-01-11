import { useRef, useCallback, TouchEvent } from 'react';

interface LongPressOptions {
  onLongPress: () => void;
  onShortPress?: () => void;
  delay?: number; // Default: 150ms (to match dnd-kit TouchSensor)
  tolerance?: number; // Default: 5px (to match dnd-kit TouchSensor)
}

interface LongPressHandlers {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
}

export const useLongPress = ({
  onLongPress,
  onShortPress,
  delay = 150,
  tolerance = 5,
}: LongPressOptions): LongPressHandlers => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const longPressTriggeredRef = useRef(false);
  const movedRef = useRef(false); // Track if touch moved beyond tolerance

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      // Prevent default context menu on long press
      e.preventDefault();

      const touch = e.touches[0];
      startPosRef.current = { x: touch.clientX, y: touch.clientY };
      longPressTriggeredRef.current = false;
      movedRef.current = false; // Reset moved flag

      // Start timer for long press
      timerRef.current = setTimeout(() => {
        longPressTriggeredRef.current = true;
        onLongPress();
      }, delay);
    },
    [delay, onLongPress]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!startPosRef.current) return;

      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - startPosRef.current.x);
      const deltaY = Math.abs(touch.clientY - startPosRef.current.y);

      // If movement exceeds tolerance, mark as moved and cancel long press
      if (deltaX > tolerance || deltaY > tolerance) {
        movedRef.current = true; // Mark that touch moved significantly
        clearTimer();
      }
    },
    [tolerance, clearTimer]
  );

  const handleTouchEnd = useCallback(() => {
    clearTimer();

    // Only trigger short press if:
    // 1. Long press was not triggered
    // 2. Touch did not move beyond tolerance (not a scroll)
    // 3. We have a short press handler
    if (!longPressTriggeredRef.current && !movedRef.current && onShortPress) {
      onShortPress();
    }

    // Reset all refs
    startPosRef.current = null;
    movedRef.current = false;
  }, [clearTimer, onShortPress]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
};
