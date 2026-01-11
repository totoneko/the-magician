import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTimer } from './hooks';
import { useGameStore, useWebSocketGame } from '@/hooks/game';
import { useSystemContext } from '@/hooks/system/hooks';
import { LocalStorageHelper } from '@/service/local-storage';

const getRemainTime = (
  startDate: Date | null,
  initialTime: number,
  isRunning: boolean,
  pauseRemain: number | null
) => {
  if (!isRunning) {
    // 一時停止中
    if (pauseRemain !== null) return pauseRemain;
    if (!startDate) return initialTime;
    // 例外ケース
    return 0;
  }
  if (!startDate) return initialTime;
  const elapsed = (Date.now() - startDate.getTime()) / 1000;
  return Math.max(0, initialTime - elapsed);
};

const CircularTimer = () => {
  const { startDate, initialTime, isRunning } = useTimer();
  const { operable, setOperable } = useSystemContext();
  const { game, players } = useGameStore();

  const turnPlayer = useMemo(
    () => Object.keys(players ?? {})?.[(game.turn - 1) % 2],
    [game, players]
  );
  const isMyTurn = LocalStorageHelper.playerId() === turnPlayer;

  // 一時停止時の残り秒数を保持
  const [pauseRemain, setPauseRemain] = useState<number | null>(null);

  // isRunningやstartDateの変化でpauseRemainをリセット
  useEffect(() => {
    if (isRunning) {
      setPauseRemain(null);
    } else if (startDate) {
      // 一時停止時に残り秒数を記録
      const elapsed = (Date.now() - startDate.getTime()) / 1000;
      setPauseRemain(Math.max(0, initialTime - elapsed));
    } else {
      setPauseRemain(initialTime);
    }
  }, [isRunning, startDate, initialTime]);

  // 残り秒数をローカルstateで管理（アニメーション用）
  const [remain, setRemain] = useState(initialTime);

  // requestAnimationFrameで残り秒数を更新
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    let mounted = true;
    const update = () => {
      if (!mounted) return;
      const t = getRemainTime(startDate, initialTime, isRunning, pauseRemain);
      setRemain(t);
      if (isRunning && t > 0) {
        rafRef.current = requestAnimationFrame(update);
      }
    };
    if (isRunning) {
      rafRef.current = requestAnimationFrame(update);
    } else {
      setRemain(getRemainTime(startDate, initialTime, isRunning, pauseRemain));
    }
    return () => {
      mounted = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isRunning, startDate, initialTime, pauseRemain]);

  // 残り時間の割合を計算
  const timeRatio = remain / initialTime;

  // 残り時間に応じた色を決定
  const getColor = () => {
    if (timeRatio > 0.6) return '#22c55e'; // 緑
    if (timeRatio > 0.3) return '#eab308'; // 黄色
    return '#ef4444'; // 赤
  };

  // SVGの円のパラメータ
  const radius = 80;
  const strokeWidth = 10;
  const center = 100;
  const circumference = 2 * Math.PI * radius;

  // 残り時間に応じたストロークの長さを計算
  const strokeDashoffset = circumference * (timeRatio - 1);

  // 円弧の開始位置を12時の位置にするための回転
  const rotation = 270;

  // 分と秒とミリ秒の表示形式
  const minutes = Math.floor(remain / 60);
  const seconds = Math.floor(remain % 60);
  const deciseconds = Math.floor((remain % 1) * 10);
  const timeDisplay = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}.${deciseconds}`;

  const { send } = useWebSocketGame();
  const turnEnd = useCallback(() => {
    send({
      action: {
        handler: 'core',
        type: 'event',
      },
      payload: {
        type: 'TurnEnd',
      },
    });
    setOperable(false);
  }, [send, setOperable]);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-52 h-52">
        {/* バックグラウンドサークル */}
        <svg className="w-full h-full" viewBox="0 0 200 200">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          {/* タイマーサークル - 時計回りに減少 */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke={getColor()}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(${rotation} ${center} ${center})`}
            strokeLinecap="butt"
          />
        </svg>

        {/* 中央の時間表示 */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="text-sm">{`ラウンド ${game.round}`}</div>
          <div className="text-3xl font-bold">{timeDisplay}</div>
          <button
            onClick={turnEnd}
            className="bg-blue-500 bg-lime-600 hover:bg-lime-500 text-white font-medium py-2 px-4 rounded shadow w-30 disabled:bg-lime-700"
            disabled={!operable}
          >
            {isMyTurn ? 'ターン終了' : <span className="text-xs">対戦相手行動中</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

// 使用例
export const Timer = () => {
  return (
    <div className="flex items-center justify-end h-full mr-4">
      <CircularTimer />
    </div>
  );
};
