import { MINUTES_PER_QUARTER_HOUR } from '../../../utils/laborTime';

interface DurationQuickPillsProps {
  onAdjust: (deltaMinutes: number) => void;
}

const PILLS = [
  { label: '+15 min', delta: MINUTES_PER_QUARTER_HOUR },
  { label: '+30 min', delta: MINUTES_PER_QUARTER_HOUR * 2 },
  { label: '+1 hr', delta: 60 },
  { label: '-15 min', delta: -MINUTES_PER_QUARTER_HOUR },
] as const;

export function DurationQuickPills({ onAdjust }: DurationQuickPillsProps) {
  return (
    <div className="absolute left-0 right-0 top-full z-10 mt-1 flex flex-wrap gap-1 rounded-lg border border-indigo-100 bg-white p-1.5 shadow-md shadow-gray-200/80">
      {PILLS.map((pill) => (
        <button
          key={pill.label}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onAdjust(pill.delta)}
          className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-[9px] font-medium text-indigo-700 transition hover:bg-indigo-100"
        >
          {pill.label}
        </button>
      ))}
    </div>
  );
}
