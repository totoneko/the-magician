'use client';

import { useState, useEffect } from 'react';
import { colorTable } from '@/helper/color';
import { useWebSocketGame } from '@/hooks/game';
import { useSoundV2 } from '@/hooks/soundV2/hooks';
import { useSystemContext } from '@/hooks/system/hooks';
import { useAttackAnimation } from '@/hooks/attack-animation';
import { useUnitSelection } from '@/hooks/unit-selection';
import { useSelectEffect } from '@/hooks/select-effect';
import { useOverclockEffect } from '@/hooks/overclock-effect';
import { useStatusChange } from '@/hooks/status-change';
import { LocalStorageHelper } from '@/service/local-storage';
import { Button } from '../interface/button';
import master from '@/submodule/suit/catalog/catalog';

export const DebugDialog = () => {
  const { send } = useWebSocketGame();
  const { play, setVolume, getVolume, bgm, stopBgm, isPlaying } = useSoundV2();
  const { cursorCollisionSize, setCursorCollisionSize, setOperable } = useSystemContext();
  const { state: attackState, proceedToPreparation } = useAttackAnimation();
  const { setAnimationUnit } = useUnitSelection(); // 既存の効果発動アニメーション用
  const { addTargetUnit } = useSelectEffect(); // 選択エフェクト用
  const { addOverclockUnit, removeOverclockUnit } = useOverclockEffect(); // オーバークロック用
  const { addStatusChange } = useStatusChange(); // ステータス変更用
  const [bgmVolume, setBgmVolume] = useState(getVolume());
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const [hide, setHide] = useState(false);
  const [targetX, setTargetX] = useState('0');
  const [targetY, setTargetY] = useState('0');

  // Check and update BGM playing status
  useEffect(() => {
    const checkBgmStatus = () => {
      const playing = isPlaying();
      setIsBgmPlaying(playing);
    };

    // Check initially
    checkBgmStatus();

    // Set up periodic checking
    const intervalId = setInterval(checkBgmStatus, 1000);

    return () => clearInterval(intervalId);
  }, [isPlaying]);

  const [debugDriveId, setDebugDriveId] = useState('');
  const [debugMakeId, setDebugMakeId] = useState('');

  const handleDrawButtonClick = () => {
    play('draw');
    send({
      action: {
        handler: 'core',
        type: 'debug',
      },
      payload: {
        type: 'DebugDraw',
        player: LocalStorageHelper.playerId(),
      },
    });
  };

  const handleDebugDriveButtonClick = () => {
    const card =
      master.get(debugDriveId) ||
      master.values().find(catalog => catalog.name.includes(debugDriveId));
    if (card) {
      debugDrive(card.id);
    }
  };

  const debugDrive = (targetUnitId: string) => {
    send({
      action: {
        handler: 'core',
        type: 'debug',
      },
      payload: {
        type: 'DebugDrive',
        player: LocalStorageHelper.playerId(),
        catalogId: targetUnitId,
      },
    });
  };

  const handleDebugMakeButtonClick = () => {
    const card =
      master.get(debugMakeId) ||
      master.values().find(catalog => catalog.name.includes(debugMakeId));
    if (card) {
      debugMake(card.id);
    }
  };

  const debugMake = (targetCardId: string) => {
    send({
      action: {
        handler: 'core',
        type: 'debug',
      },
      payload: {
        type: 'DebugMake',
        player: LocalStorageHelper.playerId(),
        catalogId: targetCardId,
      },
    });
  };

  // カーソル周辺のヒットエリアサイズを増減する
  const increaseCursorSize = () => {
    setCursorCollisionSize(prev => Math.min(prev + 2, 20));
  };

  const decreaseCursorSize = () => {
    setCursorCollisionSize(prev => Math.max(prev - 2, 1));
  };

  // BGMのボリュームを調整する
  const increaseVolume = () => {
    const newVolume = Math.min(bgmVolume + 0.1, 1);
    setBgmVolume(newVolume);
    setVolume(newVolume);
  };

  const decreaseVolume = () => {
    const newVolume = Math.max(bgmVolume - 0.1, 0);
    setBgmVolume(newVolume);
    setVolume(newVolume);
  };

  // BGMの再生/停止を切り替える
  const toggleBgm = async () => {
    if (isBgmPlaying) {
      stopBgm();
      setIsBgmPlaying(false);
    } else {
      // Start BGM playback
      await bgm();
      console.log('BGM playback started');
      setIsBgmPlaying(true);
    }
    setHide(true);
  };

  return (
    !hide && (
      <div
        className={`absolute top-4 left-4 z-50 p-3 rounded-lg shadow-lg ${colorTable.ui.playerInfoBackground} border ${colorTable.ui.border}`}
      >
        <div className="flex flex-col">
          <div className={`text-sm font-bold mb-2 ${colorTable.ui.text.primary}`}>
            Debug Console
          </div>
          <div className="flex flex-col gap-2">
            {/* DebugDrive送信UI */}
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={debugDriveId}
                onChange={e => setDebugDriveId(e.target.value)}
                className="w-32 px-2 py-1 bg-slate-700 rounded text-white"
                placeholder="IDかカード名を入力…"
              />
              <button
                onClick={handleDebugDriveButtonClick}
                className={`px-3 py-1 rounded ${colorTable.ui.border} bg-blue-600 hover:bg-blue-500 transition-colors`}
              >
                DebugDrive送信
              </button>
            </div>

            {/* DebugMake送信UI */}
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={debugMakeId}
                onChange={e => setDebugMakeId(e.target.value)}
                className="w-32 px-2 py-1 bg-slate-700 rounded text-white"
                placeholder="IDかカード名を入力…"
              />
              <button
                onClick={handleDebugMakeButtonClick}
                className={`px-3 py-1 rounded ${colorTable.ui.border} bg-purple-600 hover:bg-purple-500 transition-colors`}
              >
                DebugMake送信
              </button>
            </div>
            <details>
              <div
                className={`flex flex-col justify-center border-t ${colorTable.ui.border} pt-2 mt-2 gap-1`}
              >
                <p className="text-center font-bold">汎用ユニット召喚</p>
                <div className={`flex flex-col border-t ${colorTable.ui.border} pt-1`}>
                  <p className="text-center text-xs">特殊召喚</p>
                  <div className="flex gap-2">
                    <Button className="bg-green-500 w-1/2" onClick={() => debugDrive('2-0-324')}>
                      デッキから
                    </Button>
                    <Button className="w-1/2" onClick={() => debugDrive('2-1-115')}>
                      捨札から
                    </Button>
                  </div>
                </div>
                <div className={`flex flex-col border-t ${colorTable.ui.border} pt-1`}>
                  <p className="text-center text-xs">基本BP</p>
                  <div className="flex gap-2">
                    <Button className="bg-green-500 w-1/2" onClick={() => debugDrive('2-0-119')}>
                      下げる
                    </Button>
                    <Button className="w-1/2" onClick={() => debugDrive('2-3-018')}>
                      上げる
                    </Button>
                  </div>
                </div>
                <div className={`flex flex-col border-t ${colorTable.ui.border} pt-1`}>
                  <p className="text-center text-xs">BP</p>
                  <div className="flex gap-2">
                    <Button className="bg-green-500 w-1/2" onClick={() => debugDrive('PR-083')}>
                      下げる
                    </Button>
                    <Button className="w-1/2" onClick={() => debugDrive('2-1-020')}>
                      上げる
                    </Button>
                  </div>
                </div>
              </div>
            </details>
            <div className={`border-t ${colorTable.ui.border} pt-2 mt-2`}></div>
            <button
              onClick={handleDrawButtonClick}
              className={`px-3 py-1 rounded ${colorTable.ui.border} bg-slate-600 hover:bg-slate-500 transition-colors`}
            >
              Draw
            </button>
            <button
              onClick={() => setOperable(true)}
              className={`px-3 py-1 rounded ${colorTable.ui.border} bg-slate-600 hover:bg-slate-500 transition-colors`}
            >
              操作権を得る
            </button>

            {/* カーソル判定サイズコントロール */}
            <details>
              <summary>UI調整</summary>
              <div className="mt-2 border-t pt-2 border-gray-700">
                <div className="text-sm mb-1">カーソル判定サイズ: {cursorCollisionSize}px</div>
                <div className="flex gap-2">
                  <button
                    onClick={decreaseCursorSize}
                    className={`px-3 py-1 rounded ${colorTable.ui.border} bg-slate-600 hover:bg-slate-500 transition-colors`}
                  >
                    -
                  </button>
                  <button
                    onClick={increaseCursorSize}
                    className={`px-3 py-1 rounded ${colorTable.ui.border} bg-slate-600 hover:bg-slate-500 transition-colors`}
                  >
                    +
                  </button>
                </div>
                {/* Attack Animation Debug Controls */}
                <div className="mt-2 border-t pt-2 border-gray-700">
                  <div className="text-sm mb-1">アタックアニメーション: {attackState.phase}</div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2 items-center">
                      <label className="text-sm whitespace-nowrap">
                        ターゲット座標 (絶対座標):
                      </label>
                      <input
                        type="number"
                        value={targetX}
                        onChange={e => setTargetX(e.target.value)}
                        className="w-16 px-2 py-1 bg-slate-700 rounded text-white"
                        placeholder="X"
                      />
                      <input
                        type="number"
                        value={targetY}
                        onChange={e => setTargetY(e.target.value)}
                        className="w-16 px-2 py-1 bg-slate-700 rounded text-white"
                        placeholder="Y"
                      />
                    </div>

                    {attackState.phase === 'declaration' && (
                      <button
                        onClick={() =>
                          proceedToPreparation({ x: Number(targetX), y: Number(targetY) })
                        }
                        className={`px-3 py-1 rounded ${colorTable.ui.border} bg-green-600 hover:bg-green-500 transition-colors`}
                      >
                        続行
                      </button>
                    )}
                  </div>
                </div>

                {/* Animation Effects Debug Controls */}
                <div className="mt-2 border-t pt-2 border-gray-700">
                  <div className="text-sm mb-1">アニメーションエフェクト</div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="ユニットID"
                        id="animationUnitId"
                        className="w-28 px-2 py-1 bg-slate-700 rounded text-white"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          const unitId = (
                            document.getElementById('animationUnitId') as HTMLInputElement
                          ).value;
                          if (unitId) setAnimationUnit(unitId);
                        }}
                        className={`px-3 py-1 rounded ${colorTable.ui.border} bg-gray-600 hover:bg-gray-500 transition-colors`}
                      >
                        既存エフェクト
                      </button>

                      <button
                        onClick={() => {
                          const unitId = (
                            document.getElementById('animationUnitId') as HTMLInputElement
                          ).value;
                          if (unitId) addTargetUnit(unitId);
                        }}
                        className={`px-3 py-1 rounded ${colorTable.ui.border} bg-blue-600 hover:bg-blue-500 transition-colors`}
                      >
                        選択エフェクト
                      </button>

                      <button
                        onClick={() => {
                          const unitId = (
                            document.getElementById('animationUnitId') as HTMLInputElement
                          ).value;
                          if (!unitId) return;

                          // オーバークロックエフェクトを5秒間表示
                          addOverclockUnit(unitId);

                          // 5秒後に自動的に削除
                          setTimeout(() => {
                            removeOverclockUnit(unitId);
                          }, 5000);
                        }}
                        className={`px-3 py-1 rounded ${colorTable.ui.border} bg-yellow-600 hover:bg-yellow-500 transition-colors`}
                      >
                        OC表現
                      </button>

                      <button
                        onClick={() => {
                          const unitId = (
                            document.getElementById('animationUnitId') as HTMLInputElement
                          ).value;
                          if (!unitId) return;

                          // ランダムなステータス効果を生成
                          const changes = [
                            // { type: 'damage' as const, value: (-Math.floor(Math.random() * 10) - 1) * 1000 },
                            // { type: 'bp' as const, value: Math.floor(Math.random() * 5) + 1 },
                            { type: 'level' as const, value: 1 },
                          ];

                          // ステータス変更をコンテキストに追加
                          addStatusChange({
                            unitId,
                            changes,
                          });

                          // 注: StatusChangeEffectコンポーネントが自動的にコンテキストから削除
                        }}
                        className={`px-3 py-1 rounded ${colorTable.ui.border} bg-green-600 hover:bg-green-500 transition-colors`}
                      >
                        ステータス変化
                      </button>

                      <button
                        onClick={() => {
                          // 全てのエフェクトを同時に表示するテスト
                          const unitId = (
                            document.getElementById('animationUnitId') as HTMLInputElement
                          ).value;
                          if (!unitId) return;

                          // オーバークロックエフェクト
                          addOverclockUnit(unitId);

                          // ステータス変更
                          addStatusChange({
                            unitId,
                            changes: [
                              { type: 'damage' as const, value: -5 },
                              { type: 'bp' as const, value: 3 },
                            ],
                          });

                          // 5秒後に自動的に削除
                          setTimeout(() => {
                            removeOverclockUnit(unitId);
                          }, 5000);
                        }}
                        className={`px-3 py-1 rounded ${colorTable.ui.border} bg-purple-600 hover:bg-purple-500 transition-colors`}
                      >
                        複合エフェクト
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </details>

            {/* BGMボリュームコントロール */}
            <div className="mt-2 border-t pt-2 border-gray-700">
              <div className="text-sm mb-1">BGMボリューム: {Math.round(bgmVolume * 100)}%</div>
              <div className="flex gap-2">
                <button
                  onClick={decreaseVolume}
                  className={`px-3 py-1 rounded ${colorTable.ui.border} bg-slate-600 hover:bg-slate-500 transition-colors`}
                >
                  -
                </button>
                <button
                  onClick={increaseVolume}
                  className={`px-3 py-1 rounded ${colorTable.ui.border} bg-slate-600 hover:bg-slate-500 transition-colors`}
                >
                  +
                </button>
                <button
                  onClick={toggleBgm}
                  className={`px-3 py-1 rounded ${colorTable.ui.border} ${
                    isBgmPlaying ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'
                  } transition-colors`}
                >
                  {isBgmPlaying ? '停止' : '再生'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  );
};
