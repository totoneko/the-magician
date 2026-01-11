'use client';

import { CardDetailWindow } from '@/component/ui/CardDetailWindow';
import { CardEffectDialog } from '@/component/ui/CardEffectDialog';
import { CardUsageEffect } from '@/component/ui/CardUsageEffect';
import { CPView } from '@/component/ui/CPView';
import { DebugDialog } from '@/component/ui/DebugDialog';
import { InterceptSelectionOverlay } from '@/component/ui/InterceptSelectionOverlay';
import { LifeView } from '@/component/ui/LifeView';
import { colorTable } from '@/helper/color';
import { useRule, usePlayers, usePlayer } from '@/hooks/game/hooks';
import { MyArea } from '../MyArea';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  CollisionDetection,
  rectIntersection,
  ClientRect,
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { useGameComponentHook } from './hook';
import { CardsDialog } from '../CardsDialog';
import { CardsCountView } from '@/component/ui/CardsCountView';
import { GiCardDraw } from 'react-icons/gi';
import { BsTrash3Fill } from 'react-icons/bs';
import { useCardsDialog } from '@/hooks/cards-dialog';
import { useSystemContext } from '@/hooks/system/hooks';
import { Field } from '../Field';
import { MyFieldWrapper } from '../MyFieldWrapper';
import { ICard } from '@/submodule/suit/types';
import { Timer } from '../Timer';
import { LocalStorageHelper } from '@/service/local-storage';
import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { UnitSelectionOverlay } from '@/component/ui/UnitSelectionOverlay';
import { webSocketService } from '@/service/websocket';
import { ChoicePanel } from '@/feature/ChoicePanel';
import { PurpleGaugeView } from '@/component/ui/purpleGaugeView';
import { CardView } from '@/component/ui/CardView';
import { JokerGauge } from '@/component/ui/JokerGauge';
import { Button } from '@/component/interface/button';
import { LoadingOverlay } from '@/component/ui/LoadingOverlay';
import { ErrorOverlay } from '@/component/ui/ErrorOverlay';
import { useErrorOverlay } from '@/hooks/error-overlay';
import { TurnChangeEffect } from '@/component/ui/TurnChangeEffect';

interface RoomProps {
  id: string;
}

export const Game = ({ id }: RoomProps) => {
  useGameComponentHook({ id });
  const { openCardsDialog } = useCardsDialog();
  const { cursorCollisionSize } = useSystemContext();
  const { state: errorState, hideOverlay } = useErrorOverlay();

  // 相手の切断状態を管理
  const [isWaitingReconnect, setIsWaitingReconnect] = useState(false);

  // Get current player ID
  const currentPlayerId = LocalStorageHelper.playerId();

  const rule = useRule();
  const playerIds = Object.keys(usePlayers() ?? {});
  const opponentId =
    useMemo(
      () => playerIds.find((id: string) => id !== currentPlayerId),
      [playerIds, currentPlayerId]
    ) ?? '';
  const opponent = usePlayer(opponentId);

  const sensors = useSensors(
    // Primary sensor for desktop and touch devices
    useSensor(PointerSensor),
    // Fallback sensor specifically for touch devices
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150, // Longer delay for touch to prevent conflicts
        tolerance: 5,
      },
    })
  );

  // Custom collision detection that uses mouse cursor position instead of entire draggable area
  const cursorCollisionDetection: CollisionDetection = ({
    active,
    droppableContainers,
    droppableRects,
    pointerCoordinates,
  }) => {
    if (!pointerCoordinates) {
      return [];
    }

    // Create a small rectangle around the cursor using the configurable size
    const cursorRect: ClientRect = {
      width: cursorCollisionSize * 2,
      height: cursorCollisionSize * 2,
      top: pointerCoordinates.y - cursorCollisionSize,
      left: pointerCoordinates.x - cursorCollisionSize,
      bottom: pointerCoordinates.y + cursorCollisionSize,
      right: pointerCoordinates.x + cursorCollisionSize,
    };

    // Use the rectIntersection algorithm with our custom cursor rectangle
    return rectIntersection({
      active,
      droppableContainers,
      droppableRects,
      collisionRect: cursorRect,
      pointerCoordinates,
    });
  };

  const screenRef = useRef<HTMLDivElement>(null);
  const handleFullScreen = useCallback(() => {
    screenRef.current?.requestFullscreen();
  }, []);

  const isMatching = useMemo(() => {
    return opponentId == '';
  }, [opponentId]);

  // 切断ハンドラーを設定
  useEffect(() => {
    webSocketService.setDisconnectHandler(isWaitingReconnect => {
      setIsWaitingReconnect(isWaitingReconnect);
    });
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={cursorCollisionDetection}
      modifiers={[restrictToWindowEdges]}
    >
      <div
        className={`flex h-screen ${colorTable.ui.background} ${colorTable.ui.text.primary} relative overflow-hidden select-none dnd-game-container`}
        ref={screenRef}
      >
        {/* カード詳細ウィンドウ */}
        <CardDetailWindow x={30} y={530} />

        {/* デバッグダイアログ */}
        {rule.debug?.enable && <DebugDialog />}

        {/* カード効果表示ダイアログ */}
        <CardEffectDialog />

        {/* カード使用エフェクト */}
        <CardUsageEffect />
        <TurnChangeEffect />

        {/* 選択オーバーレイ */}
        <InterceptSelectionOverlay />
        <UnitSelectionOverlay />
        <ChoicePanel />

        {/* ロード */}
        <LoadingOverlay
          isOpen={isMatching || isWaitingReconnect}
          message={isMatching ? '入室を待機中…' : '復帰を待機中…'}
          subMessage={
            isMatching ? `RoomID: ${id} | 対戦相手の入室を待っています` : '対戦相手が切断しました'
          }
        />

        {/* エラーオーバーレイ */}
        <ErrorOverlay
          isOpen={errorState.isOpen}
          type={errorState.type}
          title={errorState.title}
          message={errorState.message}
          confirmButtonText={errorState.confirmButtonText}
          onConfirm={() => {
            if (errorState.onConfirmCallback) {
              errorState.onConfirmCallback();
            }
            hideOverlay();
          }}
          autoClose={errorState.autoClose}
          autoCloseDelay={errorState.autoCloseDelay}
        />

        {/* メインゲームコンテナ */}
        <div className="flex flex-col w-full h-full xl:p-4">
          {/* 対戦相手エリア */}
          <div className={`flex-col xl:p-4 border-b ${colorTable.ui.border}`}>
            {/* 対戦相手情報 */}
            <div
              className={`flex items-center justify-between gap-3 xl:p-2 p-1 ${colorTable.ui.playerInfoBackground} rounded-lg mb-4`}
            >
              <div className="player-identity">
                <Button onClick={handleFullScreen} size="sm" className="py-2 my-1">
                  全画面にする
                </Button>
                <div className="font-bold text-lg whitespace-nowrap text-ellipsis">
                  {opponent?.name ?? '対戦相手 検索中…'}
                </div>
                {opponent?.life !== undefined && (
                  <LifeView current={opponent.life.current} max={opponent.life.max} />
                )}
              </div>
              {/* 対戦相手の手札エリア */}
              <div className="flex justify-center gap-2">
                {/* 対戦相手の手札は裏向きに表示 */}
                {opponent?.hand?.map(i => (
                  <div
                    key={`opponent-card-${i?.id}`}
                    className={`w-8 h-12 ${colorTable.ui.opponentCardBackground} rounded flex justify-center items-center shadow-md ${colorTable.symbols.mana} text-2xl`}
                  />
                ))}
              </div>
              <div className="flex flex-col gap-1 justify-end">
                <div className="flex gap-1">
                  {[...Array(rule.player.max.trigger)].map((_, index) => {
                    const card = opponent?.trigger[index];
                    return card ? (
                      <div
                        className="w-10 h-13.5 border-1 border-white rounded-sm bg-gray-800"
                        style={{
                          backgroundImage: `url('/image/card/back/${'color' in card ? card.color : 'none'}.png')`,
                          backgroundSize: 'cover',
                        }}
                        key={index}
                      />
                    ) : (
                      <div
                        className="w-10 h-13.5 border-1 border-white rounded-sm bg-gray-800"
                        key={index}
                      />
                    );
                  })}
                  <div className="flex gap-1 mx-2">
                    {opponent?.joker.card.map(joker => (
                      <div key={joker.id} className="relative pointer-events-none">
                        {joker.isAvailable ? (
                          <CardView card={joker} isTiny />
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-black opacity-50 z-10" />
                            <CardView card={joker} isTiny />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <JokerGauge percentage={opponent?.joker.gauge || 0} />
              </div>
              <div className="flex gap-4">
                {opponent?.deck && (
                  <CardsCountView count={opponent.deck.length}>
                    <div
                      className="flex justify-center items-center cursor-pointer w-full h-full"
                      onClick={() => {
                        openCardsDialog(opponent.deck as ICard[], '対戦相手のデッキ');
                      }}
                    >
                      {<GiCardDraw color="cyan" size={40} />}
                    </div>
                  </CardsCountView>
                )}
                {opponent?.trash && (
                  <CardsCountView count={opponent.trash.length}>
                    <div
                      className="flex justify-center items-center cursor-pointer w-full h-full"
                      onClick={() => {
                        openCardsDialog(state => {
                          const trash = (state.players?.[opponentId]?.trash ?? []) as ICard[];
                          const deleted = (state.players?.[opponentId]?.delete ?? []) as ICard[];
                          return [
                            ...[...trash].reverse(),
                            ...deleted.map(card => ({ ...card, deleted: true })),
                          ]; // 最新の捨札カードが上に表示されるよう逆順に
                        }, '対戦相手の捨札');
                      }}
                    >
                      {<BsTrash3Fill color="yellowgreen" size={32} />}
                    </div>
                  </CardsCountView>
                )}
              </div>
              <div className="flex flex-col gap-4">
                {opponent?.cp !== undefined && (
                  <CPView current={opponent.cp.current} max={opponent.cp.max} />
                )}
                <PurpleGaugeView max={5} current={opponent?.purple} />
              </div>
            </div>
          </div>

          {/* フィールドエリア */}
          <div
            className={`relative flex flex-col p-x-6 ${colorTable.ui.fieldBackground} rounded-lg my-4`}
          >
            {/* 対戦相手のフィールド */}
            <Field playerId={opponentId} isOwnField={false} />
            <div className={`border-b border-dashed ${colorTable.ui.borderDashed} h-1`} />
            {/* 自分のフィールド */}
            <MyFieldWrapper>
              <Field playerId={LocalStorageHelper.playerId()} isOwnField={true} />
            </MyFieldWrapper>
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
              <Timer />
            </div>
          </div>

          {/* 自分のエリア */}
          <MyArea />

          {/* カード一覧 */}
          <CardsDialog />
        </div>
      </div>
    </DndContext>
  );
};
