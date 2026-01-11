import { CPView } from '@/component/ui/CPView';
import { CardsCountView } from '@/component/ui/CardsCountView';
import { LifeView } from '@/component/ui/LifeView';
import { colorTable } from '@/helper/color';
import { HandArea } from '../Hand';
import { GiCardDraw } from 'react-icons/gi';
import { useCardsDialog } from '@/hooks/cards-dialog';
import { MyTriggerZone } from '../MyTriggerZone';
import { useMyArea } from './hooks';
import { useCallback } from 'react';
import { MyTrash } from '../MyTrash';
import { LocalStorageHelper } from '@/service/local-storage';
import { ICard } from '@/submodule/suit/types';
import { useDeck, usePlayer } from '@/hooks/game/hooks';
import { PurpleGaugeView } from '@/component/ui/purpleGaugeView';
import { JokerArea } from '../JokerArea';

export const MyArea = () => {
  const { openCardsDialog } = useCardsDialog();
  const playerId = LocalStorageHelper.playerId();

  const deck = useDeck(playerId);
  const self = usePlayer(playerId);

  const handleDeckClick = useCallback(() => {
    openCardsDialog((deck ?? []) as ICard[], 'あなたのデッキ');
  }, [openCardsDialog, deck]);
  useMyArea();

  return (
    <div className="flex justify-center p-4 min-h-[250px]">
      <div className="flex items-end gap-8">
        {/* Left column: Deck & Trash */}
        <div className="flex flex-col gap-3">
          {deck && (
            <CardsCountView count={(deck ?? []).length}>
              <div
                className="flex justify-center items-center cursor-pointer w-full h-full"
                onClick={handleDeckClick}
              >
                {<GiCardDraw color="cyan" size={40} />}
              </div>
            </CardsCountView>
          )}
          <MyTrash />
        </div>

        {/* Middle column: CPView+PurpleGauge, MyTriggerZone, HandArea */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-2">
              {self?.cp && <CPView max={self.cp.max} current={self.cp.current} />}
              <PurpleGaugeView max={5} current={self?.purple} />
            </div>
            <MyTriggerZone />
          </div>
          <HandArea playerId={playerId} />
        </div>

        {/* Right column: Player Identity & JokerArea */}
        <div className="flex flex-col gap-3">
          <div className="player-identity">
            <div className="font-bold text-lg whitespace-nowrap text-ellipsis">
              {self?.name || ''}
            </div>
            <div className={`text-sm ${colorTable.ui.text.secondary}`}>あなた</div>
            <div className="flex flex-col gap-2">
              {self?.life && <LifeView current={self.life.current} max={self.life.max} />}
            </div>
          </div>
          <JokerArea />
        </div>
      </div>
    </div>
  );
};
