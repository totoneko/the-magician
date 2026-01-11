import { ReactNode, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSystemContext } from '@/hooks/system/hooks';
import catalog from '@/submodule/suit/catalog/catalog';
import { LocalStorageHelper } from '@/service/local-storage';
import { useField, useRule } from '@/hooks/game/hooks';

interface MyFieldWrapperProps {
  children: ReactNode;
}

export const MyFieldWrapper = ({ children }: MyFieldWrapperProps) => {
  const { activeCard } = useSystemContext();
  const playerId = LocalStorageHelper.playerId();
  const field = useField(playerId)?.length ?? 0;
  const rule = useRule();
  const disabled = useMemo(() => {
    switch (catalog.get(activeCard?.data.current?.type)?.type) {
      case 'joker':
        return false;
      case 'unit':
        return field >= rule.player.max.field;
      default:
        return true;
    }
  }, [activeCard, field, rule.player.max.field]);

  const { isOver, setNodeRef } = useDroppable({
    id: 'field',
    data: {
      type: 'field',
      accepts: ['card'],
    },
    disabled,
  });

  return (
    <div ref={setNodeRef} className="relative dnd-droppable">
      {/* Field content */}
      {children}

      {/* Field highlight animation when card is dragged over */}
      {activeCard && isOver && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div
            className="absolute border-2 rounded-lg w-4/5 h-4/5 animate-field-highlight"
            style={{ borderColor: 'rgba(255, 255, 255, 0.6)' }}
          />
        </div>
      )}
    </div>
  );
};
