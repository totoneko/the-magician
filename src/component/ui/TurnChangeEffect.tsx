'use client';

import { useTurnChangeEffect } from '@/hooks/turn-change-effect';

export const TurnChangeEffect = () => {
  const { state } = useTurnChangeEffect();
  const { isVisible, turn } = state;

  if (!isVisible) {
    return null;
  }

  const turnText = turn === 'first' ? '先行' : '後攻';
  const circleColorClass = turn === 'first' ? 'border-blue-500' : 'border-orange-500';

  return (
    <div
      className="fixed inset-0 w-screen h-screen flex items-center justify-center z-50 pointer-events-none"
      style={{ animation: 'fadeIn 0.1s forwards' }}
    >
      {/* Expanding Circle */}
      <div
        className={`absolute rounded-full border-8 opacity-80 h-[30vh] w-[30vh] ${circleColorClass}`}
        style={{ animation: 'expand 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards' }}
      ></div>

      {/* Text Container */}
      <div
        className="relative w-full h-48 flex flex-col items-center justify-center"
        style={{ animation: 'textFadeIn 0.3s 0.2s forwards', opacity: 0 }}
      >
        {/* Fading Black Band */}
        <div className="absolute w-full h-full bg-gradient-to-r from-transparent via-black/80 to-transparent z-0"></div>

        {/* Centered Text */}
        <div className="relative z-10 text-center text-white font-bold drop-shadow-md">
          <span className="text-6xl tracking-widest">TURN CHANGE</span>
          <span className="block text-2xl mt-2">{turnText}</span>
        </div>
      </div>
    </div>
  );
};
