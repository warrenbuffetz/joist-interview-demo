import { Check, Minus, Plus, Trash2 } from 'lucide-react';
import type { CatalogItem } from '../../../data/catalogData';
import type { AutomationStatus } from '../../../types/automationStatus';
import { LineItemAutomationPill } from './LineItemAutomationPill';

interface PhysicalLineItemCardProps {
  item: CatalogItem;
  isOn: boolean;
  quantity: number;
  automationStatus: AutomationStatus;
  onToggle: () => void;
  onRemove: () => void;
  onAdjustQty: (delta: number) => void;
  onDecreaseOrRemove: () => void;
  onUserVerify: () => void;
}

const stepperButtonClass =
  'flex h-6 w-6 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50';

export function PhysicalLineItemCard({
  item,
  isOn,
  quantity,
  automationStatus,
  onToggle,
  onRemove,
  onAdjustQty,
  onDecreaseOrRemove,
  onUserVerify,
}: PhysicalLineItemCardProps) {
  const handleAdjust = (delta: number) => {
    onUserVerify();
    onAdjustQty(delta);
  };

  const handleDecreaseOrRemove = () => {
    onUserVerify();
    onDecreaseOrRemove();
  };

  return (
    <div
      className={`relative rounded-xl border p-2.5 transition ${
        isOn ? 'border-indigo-200 bg-indigo-50/50 shadow-sm' : 'border-gray-100 bg-white'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`absolute left-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded border transition ${
          isOn ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 bg-white'
        }`}
        aria-label={isOn ? `Deselect ${item.name}` : `Select ${item.name}`}
      >
        {isOn && <Check className="h-2.5 w-2.5" />}
      </button>

      {isOn && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-2.5 top-2.5 flex items-center gap-0.5 text-[9px] font-medium text-red-500 hover:text-red-600"
          aria-label={`Delete ${item.name}`}
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </button>
      )}

      <div className={`min-w-0 pl-6 ${isOn ? 'pr-14' : ''}`}>
        <p className="truncate text-[10px] font-semibold text-gray-900">{item.name}</p>
        <p className="text-[9px] text-gray-400">
          {item.sku} · ${item.unitPrice.toFixed(2)}/{item.unit}
        </p>
        {isOn && <LineItemAutomationPill status={automationStatus} />}
      </div>

      {isOn && (
        <div className="mt-2 flex items-center justify-between pl-6">
          <span className="text-[9px] text-gray-500">Quantity</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDecreaseOrRemove}
              className={`flex h-6 w-6 items-center justify-center rounded-lg border bg-white ${
                quantity === 1
                  ? 'border-red-200 text-red-500 hover:bg-red-50'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              aria-label={quantity === 1 ? `Remove ${item.name}` : 'Decrease quantity'}
            >
              {quantity === 1 ? (
                <Trash2 className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
            </button>
            <span className="w-6 text-center text-[10px] font-semibold text-gray-900">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => handleAdjust(1)}
              className={stepperButtonClass}
              aria-label="Increase quantity"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
