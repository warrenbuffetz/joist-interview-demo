import { useEffect, useState } from 'react';
import { Check, Minus, Plus, Trash2 } from 'lucide-react';
import type { CatalogItem } from '../../../data/catalogData';
import {
  adjustMinutes,
  displayHoursToMinutes,
  minutesToDisplayHours,
  MINUTES_PER_QUARTER_HOUR,
} from '../../../utils/laborTime';
import { DurationQuickPills } from './DurationQuickPills';

interface LaborLineItemCardProps {
  item: CatalogItem;
  isOn: boolean;
  minutes: number;
  crewSize: number;
  wasVoiceMatch: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onMinutesChange: (minutes: number) => void;
  onCrewSizeChange: (crewSize: number) => void;
}

export function LaborLineItemCard({
  item,
  isOn,
  minutes,
  crewSize,
  wasVoiceMatch,
  onToggle,
  onRemove,
  onMinutesChange,
  onCrewSizeChange,
}: LaborLineItemCardProps) {
  const [isDurationFocused, setIsDurationFocused] = useState(false);
  const [draftHours, setDraftHours] = useState(minutesToDisplayHours(minutes));

  useEffect(() => {
    if (!isDurationFocused) {
      setDraftHours(minutesToDisplayHours(minutes));
    }
  }, [minutes, isDurationFocused]);

  const commitDraft = () => {
    const nextMinutes = displayHoursToMinutes(draftHours);
    onMinutesChange(nextMinutes);
    setDraftHours(minutesToDisplayHours(nextMinutes));
  };

  const adjustDuration = (deltaMinutes: number) => {
    const nextMinutes = adjustMinutes(minutes, deltaMinutes);
    onMinutesChange(nextMinutes);
    setDraftHours(minutesToDisplayHours(nextMinutes));
  };

  const decrementCrew = () => {
    if (crewSize > 1) onCrewSizeChange(crewSize - 1);
  };

  const incrementCrew = () => {
    onCrewSizeChange(Math.min(crewSize + 1, 99));
  };

  return (
    <div
      className={`rounded-xl border p-2.5 transition ${
        isOn ? 'border-indigo-200 bg-indigo-50/50 shadow-sm' : 'border-gray-100 bg-white'
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={onToggle}
          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
            isOn ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 bg-white'
          }`}
          aria-label={isOn ? `Deselect ${item.name}` : `Select ${item.name}`}
        >
          {isOn && <Check className="h-2.5 w-2.5" />}
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold text-gray-900">{item.name}</p>
          <p className="text-[9px] text-gray-400">{item.sku}</p>
          <p className="mt-0.5 text-[9px] text-gray-500">
            Rate: ${item.unitPrice.toFixed(2)}/hr
          </p>
          {wasVoiceMatch && isOn && (
            <span className="mt-0.5 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[8px] font-medium text-amber-800">
              Voice match — confirm duration
            </span>
          )}

          {isOn && (
            <button
              type="button"
              onClick={onRemove}
              className="mt-1 flex items-center gap-0.5 text-[9px] font-medium text-red-500 hover:text-red-600"
              aria-label={`Delete ${item.name}`}
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          )}
        </div>
      </div>

      {isOn && (
        <div className="mt-3 space-y-2 border-t border-indigo-100/80 pt-2.5 pl-6">
          <div className="relative flex items-center justify-between gap-3">
            <span className="text-[9px] text-gray-500">Duration</span>
            <div className="relative flex items-center gap-1">
              <div className="flex items-center rounded-lg border border-gray-200 bg-white">
                <input
                  type="text"
                  inputMode="decimal"
                  value={draftHours}
                  onChange={(e) => setDraftHours(e.target.value)}
                  onFocus={() => setIsDurationFocused(true)}
                  onBlur={() => {
                    setIsDurationFocused(false);
                    commitDraft();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                  }}
                  className="w-12 border-0 bg-transparent px-1.5 py-1 text-right text-[10px] font-semibold text-gray-900 outline-none"
                  aria-label="Labor duration in hours"
                />
                <span className="pr-1.5 text-[9px] text-gray-400">hr</span>
              </div>
              <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
                <button
                  type="button"
                  onClick={() => adjustDuration(MINUTES_PER_QUARTER_HOUR)}
                  className="flex h-4 w-5 items-center justify-center border-b border-gray-100 text-gray-600 hover:bg-gray-50"
                  aria-label="Increase duration"
                >
                  <Plus className="h-2.5 w-2.5" />
                </button>
                <button
                  type="button"
                  onClick={() => adjustDuration(-MINUTES_PER_QUARTER_HOUR)}
                  className="flex h-4 w-5 items-center justify-center text-gray-600 hover:bg-gray-50"
                  aria-label="Decrease duration"
                >
                  <Minus className="h-2.5 w-2.5" />
                </button>
              </div>
              {isDurationFocused && <DurationQuickPills onAdjust={adjustDuration} />}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-[9px] text-gray-500">Crew Size</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={decrementCrew}
                disabled={crewSize <= 1}
                className="flex h-6 w-6 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Decrease crew size"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-6 text-center text-[10px] font-semibold text-gray-900">
                {crewSize}
              </span>
              <button
                type="button"
                onClick={incrementCrew}
                className="flex h-6 w-6 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                aria-label="Increase crew size"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
