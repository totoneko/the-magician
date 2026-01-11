import { HandView } from '@/component/ui/HandView';
import { MulliganView } from '@/component/ui/MulliganView';
import { useRule, useHand } from '@/hooks/game/hooks';
import { useMemo } from 'react';
import { ICard } from '@/submodule/suit/types';

interface HandAreaProps {
  playerId: string;
}

export const HandArea = ({ playerId }: HandAreaProps) => {
  const rule = useRule();
  const hand = (useHand(playerId) ?? []) as ICard[];

  // Calculate the width needed for all placeholder slots
  // w-28 = 7rem = 112px, gap-2 = 0.5rem = 8px
  const containerWidth = useMemo(() => {
    const cardWidth = 112; // Tailwind w-28 = 7rem = 112px
    const gapWidth = 8; // Tailwind gap-2 = 0.5rem = 8px
    const totalWidth = cardWidth * rule.player.max.hand + gapWidth * (rule.player.max.hand - 1);
    return totalWidth;
  }, [rule.player.max.hand]);

  return (
    <div className="relative" style={{ width: `${containerWidth}px` }}>
      {/* Mulligan UI */}
      <MulliganView />
      {/* Placeholders - always display for all slots - left aligned */}
      <div className="flex justify-start gap-2 absolute inset-0 pointer-events-none">
        {[...Array(rule.player.max.hand)].map((_, index) => (
          <div
            className="w-28 h-39 border-1 border-white border-opacity-20 rounded-sm bg-gray-800 bg-opacity-20"
            key={`placeholder-${index}`}
          />
        ))}
      </div>

      {/* Actual cards - left aligned */}
      <div className="flex justify-start gap-2 relative">
        {hand.map(card => (
          <HandView key={`hand-card-${card.id}`} card={card} />
        ))}
      </div>
    </div>
  );
};
