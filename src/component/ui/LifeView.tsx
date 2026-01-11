import { colorTable } from '@/helper/color';

interface LifeViewProps {
  current: number;
  max: number;
}

export const LifeView = ({ current, max }: LifeViewProps) => {
  return (
    <div className="flex items-center justify-end gap-1">
      <div className="flex min-w-[100px] justify-end">
        {Array.from({ length: max }).map((_, i) => (
          <svg
            key={`life-${i}`}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            className="inline-block"
          >
            <path
              d="M12 2 L20.5 7 L20.5 17 L12 22 L3.5 17 L3.5 7 Z"
              fill="currentColor"
              className={i < current ? colorTable.symbols.life : 'text-gray-600'}
            />
          </svg>
        ))}
      </div>
      <span className="w-10 text-right">
        {current}/{max}
      </span>
    </div>
  );
};
