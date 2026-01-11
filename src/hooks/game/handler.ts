import { ICard, IUnit, Message } from '@/submodule/suit/types';
import { useCardEffectDialog } from '@/hooks/card-effect-dialog';
import { useWebSocketGame } from './websocket';
import { useCardsDialog } from '../cards-dialog';
import { useInterceptUsage } from '../intercept-usage';
import { useSoundV2 } from '../soundV2';
import { SelectionMode, useUnitSelection } from '../unit-selection';
import { useSystemContext } from '../system/hooks';
import { useCardUsageEffect } from '../card-usage-effect';
import { LocalStorageHelper } from '@/service/local-storage';
import { useTimer as useGameTimer } from '@/feature/Timer/hooks';
import { GameState, useGameStore } from './context';
import { useMulligan, useTimer as useMulliganTimer } from '../mulligan/context';

import { useAttackAnimation } from '../attack-animation';

import { useChoicePanel } from '@/feature/ChoicePanel/context';
import { useStatusChange } from '../status-change';
import { useUnitPosition } from '../unit-position';
import { useSelectEffect } from '../select-effect';
import { useTurnChangeEffect } from '../turn-change-effect';

export const useHandler = () => {
  const { getUnitCenterPosition: getUnitPosition } = useUnitPosition();
  const { setShowMulligan } = useMulligan();
  const { startTimer, isTimerRunning } = useMulliganTimer();
  const { sync } = useGameStore();
  const { continueGame, choose } = useWebSocketGame();
  const { showDialog } = useCardEffectDialog();
  const { setAvailableUnits, setCandidate, setAnimationUnit, setHandleSelected } =
    useUnitSelection();
  const { openCardsSelector } = useCardsDialog();
  const { setAvailableIntercepts } = useInterceptUsage();
  const { showCardUsageEffect } = useCardUsageEffect();
  const { play } = useSoundV2();
  const { setOperable } = useSystemContext();
  const { pauseTimer, resumeTimer } = useGameTimer();
  const { closeCardsDialog } = useCardsDialog();
  const { startAttackDeclaration, startBlockDeclaration, proceedToPreparation, cancelLaunch } =
    useAttackAnimation();
  const { setOptions, clear, setOnSelectCallback } = useChoicePanel();
  const { addStatusChange } = useStatusChange();
  const { addTargetUnit } = useSelectEffect();
  const { showTurnChangeEffect } = useTurnChangeEffect();

  // 選択肢選択をPromiseで待つ
  const handleOptionSelection = (): Promise<string | null> => {
    return new Promise(resolve => {
      setOnSelectCallback(resolve);
    });
  };

  // ユニット座標取得関数 - UnitPositionContextから取得
  const getUnitCenterPosition = (unitId: string): { x: number; y: number } | undefined => {
    return getUnitPosition(unitId);
  };

  // 画面中央座標取得
  const getScreenCenterX = () => window.innerWidth / 2;

  const handle = async (message: Message) => {
    const { payload } = message;

    // 標準のメッセージ型の処理
    switch (payload.type) {
      case 'MulliganStart': {
        // Always show the UI when receiving a MulliganStart message
        setShowMulligan(true);

        // Only start a fresh 10-second timer if no timer is already running
        // This ensures the timer continues running even after pressing "はい"
        if (!isTimerRunning()) {
          console.log('Starting a new 10-second timer');
          startTimer(10);
        } else {
          console.log('Timer already running, not resetting');
        }
        break;
      }

      case 'Sync': {
        const game: GameState = {
          ...payload.body,
        };
        sync(game);
        break;
      }

      // カード効果表示
      case 'DisplayEffect': {
        play('effect');
        setAnimationUnit(payload.unitId);
        await showDialog(payload.title, payload.message);
        continueGame({ promptId: payload.promptId });
        break;
      }

      // カード効果選択
      case 'Choices': {
        const { choices } = payload;

        switch (choices.type) {
          case 'option': {
            closeCardsDialog();
            setOptions(
              choices.items.map((item: { id: string; description: string }) => ({
                id: item.id,
                label: item.description,
                enabled: true,
              })),
              10, // 10秒制限
              payload.player,
              choices.title,
              payload.promptId
            );
            play('choices');

            // 選択肢選択を受け付け
            const selectedId = await handleOptionSelection();
            if (selectedId) {
              play('select');
              choose({ promptId: payload.promptId, choice: [selectedId] });
            } else {
              // タイムアウトや未選択時
              choose({ promptId: payload.promptId, choice: [] });
            }
            clear();
            break;
          }

          case 'card': {
            if (payload.player !== LocalStorageHelper.playerId()) return;
            closeCardsDialog();
            const response = await openCardsSelector(choices.items, choices.title, choices.count, {
              timeLimit: 10,
            });
            choose({ promptId: payload.promptId, choice: response });
            break;
          }

          case 'intercept': {
            if (payload.player !== LocalStorageHelper.playerId()) return;
            closeCardsDialog();
            const selectedCard = await handleInterceptSelection(choices.items);
            choose({
              promptId: payload.promptId,
              choice: selectedCard ? [selectedCard.id] : [],
            });
            break;
          }

          case 'unit': {
            if (payload.player !== LocalStorageHelper.playerId()) return;
            closeCardsDialog();
            const selectedUnit = await handleUnitSelection(
              choices.items,
              choices.title,
              'target',
              choices.isCancelable
            );
            choose({
              promptId: payload.promptId,
              choice: selectedUnit ? [selectedUnit] : undefined,
            });
            break;
          }

          case 'block': {
            if (payload.player !== LocalStorageHelper.playerId()) return;
            closeCardsDialog();
            const selectedUnit = await handleUnitSelection(
              choices.items,
              choices.title,
              'block',
              choices.isCancelable
            );
            choose({
              promptId: payload.promptId,
              choice: selectedUnit ? [selectedUnit] : undefined,
            });
            break;
          }
        }

        break;
      }

      // 選択肢即時終了
      case 'Selected': {
        clear();
        break;
      }

      // エフェクト通知
      case 'SoundEffect': {
        console.log('handling %s', payload.soundId);
        play(payload.soundId);
        break;
      }

      // ヴィジュアルエフェクト通知
      case 'VisualEffect': {
        const body = payload.body;
        switch (body.effect) {
          case 'attack': {
            // アタック宣言アニメ（declarationフェーズ）
            const attackerId = body.attackerId;
            const attackerPos = attackerId
              ? getUnitCenterPosition(attackerId)
              : { x: getScreenCenterX(), y: 0 };
            const isPlayerUnit =
              !!attackerId && attackerId.startsWith(LocalStorageHelper.playerId());
            startAttackDeclaration(
              attackerId,
              isPlayerUnit,
              attackerPos || { x: getScreenCenterX(), y: 0 }
            );
            break;
          }
          case 'block': {
            // ブロック宣言アニメ - Blockerユニットを拡大表示
            const blockerId = body.blockerId;
            if (blockerId) {
              startBlockDeclaration(blockerId);
              // BLOCK表示エフェクトを追加
              addStatusChange({
                unitId: blockerId,
                changes: [{ type: 'block', value: 0 }],
              });
            }
            break;
          }
          case 'launch': {
            const blockerId = body.blockerId;
            const attackerId = body.attackerId || '';
            let targetPosition: { x: number; y: number };

            if (blockerId) {
              // blockerユニットの座標 - 直接攻撃ではなくユニットへの攻撃
              const blockerPos = getUnitCenterPosition(blockerId);
              targetPosition = blockerPos || { x: getScreenCenterX(), y: 0 };
            } else {
              // blockerIdがundefined: プレイヤー直接攻撃
              // UnitView の isOwnUnit 判定を再現
              const screenWidth = window.innerWidth;
              const screenHeight = window.innerHeight;

              // GameState.players から自分の field を参照し、attackerId が含まれていれば isOwnUnit
              // useGameStore.getState() で最新の GameState を取得
              const gameState = useGameStore.getState();
              const playerId = LocalStorageHelper.playerId();
              const myField: IUnit[] = gameState.players?.[playerId]?.field ?? [];
              const isOwnUnit = myField.some((unit: IUnit) => unit.id === attackerId);

              if (isOwnUnit) {
                // isOwnUnit: 仮値 y: 30
                targetPosition = { x: screenWidth / 2, y: 100 };
              } else {
                // !isOwnUnit: 現状の値
                targetPosition = { x: screenWidth / 2, y: screenHeight - 300 };
              }
            }
            proceedToPreparation(targetPosition);
            break;
          }
          case 'status': {
            addStatusChange({
              unitId: body.unitId,
              changes: [{ type: body.type, value: body.value }],
            });
            break;
          }
          case 'drive': {
            // type guard
            if ('type' in body && 'player' in body && 'image' in body) {
              const position =
                body.type === 'UNIT'
                  ? body.player === LocalStorageHelper.playerId()
                    ? 'right'
                    : 'left'
                  : 'center';
              showCardUsageEffect({
                image: body.image,
                type: body.type,
                position,
              });
            }
            break;
          }
          case 'launch-cancel': {
            // 攻撃アニメーションをキャンセルして元の位置に戻す
            cancelLaunch();
            break;
          }
          case 'select': {
            // 円形拡散選択エフェクトを発動
            addTargetUnit(body.unitId);
            break;
          }
        }
        break;
      }
      case 'TurnChange': {
        const isMyTurn = payload.player === LocalStorageHelper.playerId();
        play('turnchange');
        showTurnChangeEffect({ turn: payload.isFirst ? 'first' : 'second' });
        if (!isMyTurn) setOperable(false);
        break;
      }

      // 操作権限
      case 'Operation': {
        switch (payload.action) {
          case 'defrost':
            resumeTimer();
            setOperable(true);
            break;
          case 'freeze':
            pauseTimer();
            setOperable(false);
            break;
        }
        break;
      }
    }
  };

  // Handle intercept selection by returning a Promise that resolves with the selected card or null
  const handleInterceptSelection = (intercepts: ICard[]): Promise<ICard | null> => {
    return new Promise(resolve => {
      // Setup handler functions that resolve the promise
      const handleActivate = (card: ICard) => {
        resolve(card);
      };

      const handleCancel = () => {
        resolve(null);
      };

      // Set available intercepts and provide the handlers
      setAvailableIntercepts(intercepts, undefined, handleActivate, handleCancel);
    });
  };

  const handleUnitSelection = (
    units: IUnit[],
    title?: string,
    mode: SelectionMode = 'target',
    isCancelable: boolean = false
  ): Promise<IUnit['id'] | undefined> => {
    return new Promise(resolve => {
      // Setup handler functions that resolve the promise
      const handleSelect = (unit?: IUnit['id']) => {
        resolve(unit);
        setCandidate(undefined);
        setHandleSelected(undefined);
      };

      setAvailableUnits(units, handleSelect, mode, title, isCancelable);
    });
  };

  return {
    handle,
    showDialog,
    handleInterceptSelection,
    handleUnitSelection,
  };
};
