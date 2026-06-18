import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Search, ShieldCheck } from 'lucide-react';
import { CatalogData } from '../../data/catalogData';
import type { HandshakeResult, InvoiceLineItem } from '../../engine/handshakeEngine';
import {
  buildMediationLineItems,
  computeInvoiceTotals,
  type LaborSelection,
} from '../../utils/invoiceTotals';
import { isLaborSku } from '../../utils/laborTime';
import { MediationLineItemCard } from './mediation/MediationLineItemCard';

interface InvoiceMediationScreenProps {
  result: HandshakeResult;
  mode?: 'review' | 'modify';
  onConfirm: (lineItems: InvoiceLineItem[]) => void;
  onBack: () => void;
}

const DEFAULT_LABOR_MINUTES = 60;

function hoursToMinutes(hours: number): number {
  return Math.round(hours * 60);
}

function buildInitialPhysicalQty(result: HandshakeResult): Record<string, number> {
  const initial: Record<string, number> = {};
  result.lineItems.forEach((item) => {
    if (!isLaborSku(item.sku)) {
      initial[item.sku] = item.quantity;
    }
  });
  return initial;
}

function buildInitialLaborSelections(result: HandshakeResult): Record<string, LaborSelection> {
  const initial: Record<string, LaborSelection> = {};
  result.lineItems.forEach((item) => {
    if (isLaborSku(item.sku)) {
      initial[item.sku] = {
        minutes: item.durationMinutes ?? hoursToMinutes(item.quantity),
        crewSize: item.crewSize ?? 1,
      };
    }
  });
  return initial;
}

export function InvoiceMediationScreen({
  result,
  mode = 'review',
  onConfirm,
  onBack,
}: InvoiceMediationScreenProps) {
  const [search, setSearch] = useState('');
  const [physicalQty, setPhysicalQty] = useState<Record<string, number>>(() =>
    buildInitialPhysicalQty(result),
  );
  const [laborSelections, setLaborSelections] = useState<Record<string, LaborSelection>>(() =>
    buildInitialLaborSelections(result),
  );

  const filteredCatalog = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return CatalogData;
    return CatalogData.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q),
    );
  }, [search]);

  const selectedLineItems = useMemo(
    () => buildMediationLineItems(CatalogData, physicalQty, laborSelections),
    [physicalQty, laborSelections],
  );

  const totals = computeInvoiceTotals(selectedLineItems);
  const selectedCount = selectedLineItems.length;
  const isModify = mode === 'modify';

  const isItemOn = (sku: string) =>
    isLaborSku(sku) ? laborSelections[sku] != null : physicalQty[sku] != null;

  const toggleItem = (sku: string) => {
    if (isLaborSku(sku)) {
      setLaborSelections((prev) => {
        const next = { ...prev };
        if (next[sku] != null) {
          delete next[sku];
        } else {
          next[sku] = { minutes: DEFAULT_LABOR_MINUTES, crewSize: 1 };
        }
        return next;
      });
      return;
    }

    setPhysicalQty((prev) => {
      const next = { ...prev };
      if (next[sku] != null) {
        delete next[sku];
      } else {
        next[sku] = 1;
      }
      return next;
    });
  };

  const adjustQty = (sku: string, delta: number) => {
    setPhysicalQty((prev) => {
      const current = prev[sku] ?? 1;
      const nextQty = Math.max(1, Math.min(99, current + delta));
      return { ...prev, [sku]: nextQty };
    });
  };

  const removeItem = (sku: string) => {
    if (isLaborSku(sku)) {
      setLaborSelections((prev) => {
        const next = { ...prev };
        delete next[sku];
        return next;
      });
      return;
    }

    setPhysicalQty((prev) => {
      const next = { ...prev };
      delete next[sku];
      return next;
    });
  };

  const decreaseOrRemove = (sku: string) => {
    const current = physicalQty[sku] ?? 1;
    if (current <= 1) {
      removeItem(sku);
    } else {
      adjustQty(sku, -1);
    }
  };

  const updateLaborMinutes = (sku: string, minutes: number) => {
    setLaborSelections((prev) => ({
      ...prev,
      [sku]: { ...prev[sku], minutes },
    }));
  };

  const updateCrewSize = (sku: string, crewSize: number) => {
    setLaborSelections((prev) => ({
      ...prev,
      [sku]: { ...prev[sku], crewSize: Math.max(1, crewSize) },
    }));
  };

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <div className="shrink-0 border-b border-gray-100 bg-white px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="mb-2 text-[10px] font-medium text-indigo-600"
        >
          ← Back to draft
        </button>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-gray-900">
              {isModify ? 'Modify Line Items' : 'Review Line Items'}
            </p>
            <p className="mt-0.5 text-[9px] leading-snug text-gray-500">
              {isModify
                ? 'Adjust quantities or catalog lines before sending.'
                : 'Quickly confirm these details to finalize your invoice.'}
            </p>
          </div>
          {isModify ? (
            <div className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5">
              <CheckCircle2 className="h-3 w-3 text-emerald-700" />
              <span className="text-[9px] font-semibold text-emerald-800">OPTIONAL EDIT</span>
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5">
              <AlertTriangle className="h-3 w-3 text-amber-700" />
              <span className="text-[9px] font-semibold text-amber-800">REVIEW REQUIRED</span>
            </div>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {result.gaps.length > 0 && !isModify && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5">
            <div className="mb-1 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <p className="text-[10px] font-semibold text-amber-900">Trust gaps detected</p>
            </div>
            <ul className="space-y-1">
              {result.gaps.map((gap) => (
                <li key={gap.rawFragment} className="text-[9px] leading-relaxed text-amber-800">
                  · {gap.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search parts catalog…"
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-[10px] text-gray-800 outline-none ring-indigo-500 focus:ring-1"
          />
        </div>

        <p className="text-[9px] font-medium uppercase tracking-wider text-gray-400">
          Select accurate billing lines
        </p>

        <div className="space-y-2">
          {filteredCatalog.map((item) => {
            const isOn = isItemOn(item.sku);
            const wasVoiceMatch = result.lineItems.some((l) => l.sku === item.sku);
            const labor = laborSelections[item.sku];

            return (
              <MediationLineItemCard
                key={item.sku}
                item={item}
                isOn={isOn}
                quantity={physicalQty[item.sku] ?? 1}
                laborMinutes={labor?.minutes ?? DEFAULT_LABOR_MINUTES}
                crewSize={labor?.crewSize ?? 1}
                wasVoiceMatch={wasVoiceMatch}
                onToggle={() => toggleItem(item.sku)}
                onRemove={() => removeItem(item.sku)}
                onAdjustQty={(delta) => adjustQty(item.sku, delta)}
                onDecreaseOrRemove={() => decreaseOrRemove(item.sku)}
                onLaborMinutesChange={(minutes) => updateLaborMinutes(item.sku, minutes)}
                onCrewSizeChange={(crewSize) => updateCrewSize(item.sku, crewSize)}
              />
            );
          })}
        </div>
      </div>

      <div className="shrink-0 border-t border-gray-200 bg-white px-3 py-3">
        <div className="mb-2 flex items-center justify-between text-[10px]">
          <span className="text-gray-500">
            {selectedCount} line{selectedCount !== 1 ? 's' : ''} selected
          </span>
          <span className="font-bold text-gray-900">${totals.total.toFixed(2)}</span>
        </div>
        <button
          type="button"
          disabled={selectedCount === 0}
          onClick={() => onConfirm(selectedLineItems)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          {isModify ? 'Save Changes' : 'Confirm & Verify Invoice'}
        </button>
      </div>
    </div>
  );
}
