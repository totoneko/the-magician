import master from '@/submodule/suit/catalog/catalog';
import { getColorCode } from '@/helper/color';
import { IAtom, ICard } from '@/submodule/suit/types';
import { useSystemContext } from '@/hooks/system/hooks';
import { useCallback, MouseEvent, useMemo } from 'react';
import { getImageUrl } from '@/helper/image';
import { useLongPress } from '@/hooks/use-long-press';

interface Props {
  card: IAtom;
  isSelecting?: boolean;
  isHighlighting?: boolean;
  onClick?: (e?: React.MouseEvent) => void;
  isMitigated?: boolean;
  isSmall?: boolean;
  isTiny?: boolean;
}

// Type guard to check if an IAtom is actually an ICard
function isICard(card: IAtom): card is ICard {
  return (
    'catalogId' in card &&
    typeof card.catalogId === 'string' &&
    'lv' in card &&
    typeof card.lv === 'number'
  );
}

export const CardView = ({
  card,
  isSelecting,
  isHighlighting,
  isSmall,
  isTiny,
  isMitigated = false,
  onClick,
}: Props) => {
  // Use the type guard to check if this is an ICard
  const cardAsICard = isICard(card) ? card : null;
  const catalog = cardAsICard ? master.get(cardAsICard.catalogId) : undefined;

  const sizeClass = isSmall ? 'w-19 h-26' : isTiny ? 'w-11 h-14' : 'w-28 h-39';

  const { setSelectedCard, setDetailCard, setDetailPosition } = useSystemContext();

  // Determine if we're in the DeckBuilder component by checking the URL
  const isInDeckBuilder =
    typeof window !== 'undefined' && window.location.pathname.includes('/builder');

  const handleCardClick = useCallback(() => {
    if (isICard(card)) {
      // In Game component, clicking sets both selectedCard and detailCard
      if (!isInDeckBuilder) {
        setSelectedCard(prev => {
          const newCard = prev?.catalogId === card.catalogId ? undefined : card;
          // Synchronize the detail card with the selected card in Game component
          if (newCard) {
            setDetailCard(newCard);
            // Set a default position for Game component
            setDetailPosition({ x: 100, y: 100 });
          } else {
            setDetailCard(undefined);
          }
          return newCard;
        });
      } else {
        // In DeckBuilder, just handle onClick as before (without showing details)
        setSelectedCard(prev => (prev?.catalogId === card.catalogId ? undefined : card));
      }
    }
  }, [card, setSelectedCard, setDetailCard, setDetailPosition, isInDeckBuilder]);

  const handleContextMenu = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      if (isICard(card)) {
        setDetailPosition({ x: e.clientX, y: e.clientY });
        setDetailCard(card);
      }
    },
    [card, setDetailCard, setDetailPosition]
  );

  // Long press handlers for touch devices
  const longPressHandlers = useLongPress({
    onLongPress: () => {
      if (isICard(card)) {
        setDetailCard(card);
        setDetailPosition({ x: 100, y: 100 });
      }
    },
    onShortPress: () => {
      // Short press should only trigger selection, not detail view
      if (isICard(card)) {
        if (!isInDeckBuilder) {
          setSelectedCard(prev => (prev?.catalogId === card.catalogId ? undefined : card));
        } else {
          setSelectedCard(prev => (prev?.catalogId === card.catalogId ? undefined : card));
        }
      }
      // Also call the onClick prop if provided (for CardsDialog, etc.)
      onClick?.();
    },
    delay: 150, // Match dnd-kit TouchSensor delay
    tolerance: 5, // Match dnd-kit TouchSensor tolerance
  });

  const reduced = useMemo(() => {
    return (
      (card as ICard).delta
        ?.map(delta => (delta.effect.type === 'cost' ? delta.effect.value : 0))
        .reduce((acc, current) => acc + current, 0) ?? 0
    );
  }, [card]);

  return (
    <>
      <div
        className={`${sizeClass} border-2 border-slate-600 rounded justify-center items-center text-slate-500 relative ${isSelecting ? 'animate-pulse-border' : ''} dnd-clickable`}
        style={{
          backgroundImage: cardAsICard?.catalogId
            ? `url(${getImageUrl(cardAsICard?.catalogId)})`
            : '',
          backgroundSize: 'cover',
        }}
        onClick={e => {
          // Only handle click if not being dragged and not on touch device
          if (!e.defaultPrevented && !('ontouchstart' in window)) {
            handleCardClick();
            onClick?.(e);
          }
        }}
        onContextMenu={handleContextMenu}
        {...longPressHandlers}
      >
        <div
          className={`w-full h-full rounded flex flex-col text-xs shadow-lg relative cursor-pointer`}
        >
          <div className="flex justify-between mb-1">
            {!isTiny && (
              <div className="border-3 border-gray-700 relative">
                {reduced !== 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      width: 25,
                      height: 25,
                      transform: 'translate(-50%, -50%)',
                      borderRadius: '50%',
                      boxShadow: `0 0 12px 6px ${
                        reduced > 0 ? 'rgba(255,0,0,0.7)' : 'rgba(0,128,255,0.7)'
                      }`,
                      pointerEvents: 'none',
                      zIndex: 2,
                    }}
                  />
                )}
                {catalog && (
                  <div
                    className={`w-5 h-5 flex items-center justify-center font-bold text-white ${catalog ? getColorCode(catalog.color) : ''}`}
                    style={{ position: 'relative', zIndex: 1 }}
                  >
                    {Math.max((catalog?.cost ?? 0) - (isMitigated ? 1 : 0) + reduced, 0)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="border-gray-700 absolute bottom-0 w-full">
          {catalog && catalog.type !== 'joker' && (
            <ul
              className={`w-full h-7 flex items-center justify-center font-bold text-white bg-gray-700`}
            >
              {cardAsICard && <li className="text-xs">{`Lv ${cardAsICard.lv}`}</li>}
              {catalog.bp && <li className="ml-2">{catalog.bp?.[(cardAsICard?.lv ?? 1) - 1]}</li>}
            </ul>
          )}
        </div>
        {isHighlighting && (
          <div className="absolute inset-0 border-1 border-gray-300 animate-pulse-border shadow-glow pointer-events-none" />
        )}

        {/* Deleted card indicators */}
        {'deleted' in card && typeof card.deleted === 'boolean' && card.deleted && (
          <>
            {/* First diagonal line */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: 0,
                right: 0,
                width: '100%',
                height: '100%',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 15,
                  width: '192px',
                  height: '3px',
                  backgroundColor: 'navy',
                  transformOrigin: 'top right',
                  transform: 'rotate(-55deg)',
                }}
              />
            </div>

            {/* Second diagonal line */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: 0,
                right: 0,
                width: '100%',
                height: '100%',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: -7,
                  width: '192px',
                  height: '3px',
                  backgroundColor: 'navy',
                  transformOrigin: 'top right',
                  transform: 'rotate(-55deg)',
                }}
              />
            </div>

            {/* Central DELETE box */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                style={{
                  width: '100%',
                  padding: '6px 0',
                  backgroundColor: 'navy',
                  color: 'white',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  letterSpacing: '1px',
                }}
              >
                DELETE
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};
