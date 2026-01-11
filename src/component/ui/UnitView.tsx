import React, { useRef, useEffect } from 'react';
import { IUnit } from '@/submodule/suit/types';
import { useDroppable } from '@dnd-kit/core';

import { BPView } from './BPView';
import { UnitIconView } from './UnitIconView';
import { UnitActivatedView } from './UnitActivatedView';
import { UnitActionButtons } from './UnitActionButtons';
import { UnitSelectionButton } from './UnitSelectionButton';
import { UnitIconEffect } from './UnitIconEffect';
import { SelectEffect } from './SelectEffect';
import { OverclockEffect } from './OverclockEffect';
import { MultipleStatusChange } from './StatusChangeEffect';
import { BattleIconsView } from './BattleIconsView';
import { CountersView } from './CountersView';
import { useUnitPosition } from '@/hooks/unit-position';
import { useUnitSelection } from '@/hooks/unit-selection';
import { useSystemContext } from '@/hooks/system/hooks';
import { useUnitAttackAnimationStyle, useBPViewAnimationStyle } from '@/hooks/attack-animation';
import { useSelectEffect } from '@/hooks/select-effect';
import { useOverclockEffect } from '@/hooks/overclock-effect';
import { useStatusChange } from '@/hooks/status-change';
import master from '@/submodule/suit/catalog/catalog';
import { getImageUrl } from '@/helper/image';
import { useLongPress } from '@/hooks/use-long-press';

interface UnitViewProps {
  unit: IUnit;
  backImage?: string;
  isOwnUnit?: boolean;
}

const UnitViewComponent = ({ unit, isOwnUnit = false }: UnitViewProps) => {
  const { setActiveUnit, candidate, animationUnit, setAnimationUnit, activeUnit } =
    useUnitSelection();
  const { setSelectedCard, setDetailCard, setDetailPosition, operable, activeCard } =
    useSystemContext();
  const unitRef = useRef<HTMLDivElement>(null);
  const { registerUnitRef } = useUnitPosition();
  const { targetUnitIds, removeTargetUnit } = useSelectEffect();

  // ユニットの位置情報をコンテキストに登録
  useEffect(() => {
    registerUnitRef(unit.id, unitRef as React.RefObject<HTMLDivElement>);
  }, [unit.id, registerUnitRef]);

  const color: string =
    {
      1: 'orangered',
      2: 'gold',
      3: 'royalblue',
      4: 'mediumseagreen',
      5: 'darkviolet',
    }[master.get(unit.catalogId)?.color ?? 0] ?? '';

  // Check if the dragged card is an evolution card and can evolve this unit
  const draggableType = activeCard?.data.current?.type;
  const draggableMaster = draggableType ? master.get(draggableType) : undefined;
  const unitMaster = master.get(unit.catalogId);

  // Evolution conditions
  const isEvolutionCard = draggableMaster?.type === 'advanced_unit';
  const isSameColor = draggableMaster?.color === unitMaster?.color;
  const hasVirusSpecies = unitMaster?.species?.includes('ウィルス') || false;
  const hasEvolutionBan =
    unit.delta?.some(delta => 'name' in delta.effect && delta.effect.name === '進化禁止') || false;

  // Check if unit can be evolved
  const canEvolve =
    isOwnUnit && isEvolutionCard && isSameColor && !hasVirusSpecies && !hasEvolutionBan;

  // Set up droppable
  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id: `unit-${unit.id}`,
    data: {
      type: 'unit',
      unitId: unit.id,
      accepts: ['card'],
    },
    disabled: !isOwnUnit || !operable || !canEvolve,
  });

  // Handle unit click to show action buttons (desktop only)
  const handleUnitClick = (e: React.MouseEvent) => {
    // Prevent event if drag is in progress
    if (e.defaultPrevented) return;

    if (isOwnUnit && !candidate && operable) {
      setActiveUnit(prev => (prev?.id !== unit.id ? unit : undefined));
    }
    setSelectedCard(prev => (prev?.catalogId === unit.catalogId ? undefined : unit));
    // Desktop: clicking shows detail card
    setDetailCard(prev => (prev?.catalogId === unit.catalogId ? undefined : unit));
  };

  // Long press handlers for touch devices
  const longPressHandlers = useLongPress({
    onLongPress: () => {
      // Long press shows detail card
      setDetailCard(unit);
      setDetailPosition({ x: 100, y: 100 });
    },
    onShortPress: () => {
      // Short press only handles action buttons and selection, no detail card
      if (isOwnUnit && !candidate && operable) {
        setActiveUnit(prev => (prev?.id !== unit.id ? unit : undefined));
      }
      setSelectedCard(prev => (prev?.catalogId === unit.catalogId ? undefined : unit));
    },
    delay: 150, // Match dnd-kit TouchSensor delay
    tolerance: 5, // Match dnd-kit TouchSensor tolerance
  });

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32 unit-wrapper">
        {/* COPY banner for copy units */}
        {unit.isCopy && (
          <div className="absolute inset-0 z-1 pointer-events-none flex items-center justify-center">
            <div className="copy-banner">COPY</div>
          </div>
        )}
        {/* Action buttons (Attack/Withdrawal/Boot) - only shown for own units */}
        {isOwnUnit && activeUnit === unit && !candidate && (
          <div className="absolute inset-0 z-20 pointer-events-auto">
            <UnitActionButtons
              unit={unit}
              unitRef={unitRef}
              canAttack={unit.active}
              canBoot={unit.hasBootAbility === true ? (unit.isBooted ? false : true) : undefined}
              canWithdraw={true}
            />
          </div>
        )}
        <div
          ref={node => {
            unitRef.current = node;
            setDroppableRef(node);
          }}
          className="absolute inset-0 z-0 dnd-droppable"
          onClick={e => {
            // Only handle click on desktop (non-touch devices)
            if (!('ontouchstart' in window)) {
              handleUnitClick(e);
            }
          }}
          {...longPressHandlers}
          style={useUnitAttackAnimationStyle(unit.id)}
        >
          {/* Animation effect layers (highest z-index) */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            {/* 既存の効果発動アニメーション（長方形パターン） - unit-selection/context由来 */}
            <UnitIconEffect
              show={animationUnit === unit.id}
              onComplete={() => setAnimationUnit(undefined)}
            />

            {/* 新しい選択エフェクト（円形拡散） - select-effect/context由来 */}
            {targetUnitIds.includes(unit.id) && (
              <SelectEffect
                unitId={unit.id}
                onComplete={() => {
                  // 完了ハンドラでこのアニメーション対象のIDをリセット
                  removeTargetUnit(unit.id);
                }}
              />
            )}

            {/* オーバークロックエフェクト - overclock-effect/context由来 */}
            {useOverclockEffect().activeUnits.includes(unit.id) && (
              <OverclockEffect
                unitId={unit.id}
                onComplete={() => {
                  /* 完了ハンドラは内部でコンテキストをリセット */
                }}
              />
            )}

            {/* ステータス変更エフェクト - status-change/context由来 */}
            {useStatusChange()
              .getStatusChangesForUnit(unit.id)
              .map(statusItem => (
                <MultipleStatusChange
                  key={statusItem.id}
                  unitId={unit.id}
                  changes={statusItem.changes}
                  statusChangeId={statusItem.id}
                />
              ))}
          </div>

          {/* Position components to layer correctly */}
          <div className="absolute inset-0 z-1">
            <UnitIconView color={color} image={getImageUrl(unit.catalogId)} reversed={false} />
          </div>
          <div className="absolute inset-0 z-0">
            <UnitActivatedView color={color} active={unit.active} />
          </div>

          {/* Selection button (Select/Target/Block) - can be shown for any unit */}
          <UnitSelectionButton unitId={unit.id} />

          {/* 進化ユニットを ドラッグして上に重ねている間のみ表示させる */}
          {activeCard && isOver && canEvolve && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                className="absolute border-2 rounded-lg w-4/5 h-4/5 animate-field-highlight"
                style={{ borderColor: 'rgba(255, 255, 255, 0.6)' }}
              />
            </div>
          )}
        </div>
      </div>
      <div className="-mt-8" style={useBPViewAnimationStyle(unit.id)}>
        {unit.delta && <BattleIconsView delta={unit.delta} />}
        <BPView
          bp={unit.bp}
          diff={
            unit.delta
              ?.map(delta => {
                if (delta.effect.type === 'bp') return delta.effect.diff;
                if (delta.effect.type === 'damage') return -delta.effect.value;
                return 0;
              })
              .reduce((acc, current) => (acc += current), 0) ?? 0
          }
          lv={unit.lv}
        />
        <CountersView delta={unit.delta} />
      </div>
    </div>
  );
};

// CSS for the copy banner animation
const copyBannerStyle = `
  @keyframes copyPulse {
    0% { opacity: 0.6; }
    50% { opacity: 0.9; }
    100% { opacity: 0.6; }
  }
  
  .copy-banner {
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    font-weight: bold;
    padding: 2px 8px;
    width: 80%;
    text-align: center;
    font-size: 1rem;
    letter-spacing: 1px;
    animation: copyPulse 3s ease-in-out infinite;
    z-index: 30;
  }
`;

export const UnitView = React.memo(UnitViewComponent);

// Add the CSS to the document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = copyBannerStyle;
  document.head.appendChild(style);
}
