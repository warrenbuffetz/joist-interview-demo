import { useMemo, useState } from 'react';
import { AlertTriangle, Check, CheckCircle2, Minus, Plus, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { CatalogData } from '../../data/catalogData';
import type { HandshakeResult, InvoiceLineItem } from '../../engine/handshakeEngine';
import { computeInvoiceTotals, lineItemFromCatalog } from '../../utils/invoiceTotals';

interface InvoiceMediationScreenProps {
  result: HandshakeResult;
  mode?: 'review' | 'modify';
  onConfirm: (lineItems: InvoiceLineItem[]) => void;
  onBack: () => void;
}

export function InvoiceMediationScreen({
  result,
  mode = 'review',
  onConfirm,
  onBack,
}: InvoiceMediationScreenProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    result.lineItems.forEach((item) => {
      initial[item.sku] = item.quantity;
    });
    return initial;
  });

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

  const selectedLineItems = useMemo(() => {
    return CatalogData.filter((item) => selected[item.sku] != null).map((item) =>
      lineItemFromCatalog(item, selected[item.sku]),
    );
  }, [selected]);

  const totals = computeInvoiceTotals(selectedLineItems);
  const selectedCount = Object.keys(selected).length;

  const toggleItem = (sku: string) => {
    setSelected((prev) => {
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
    setSelected((prev) => {
      const current = prev[sku] ?? 1;
      const nextQty = Math.max(1, Math.min(99, current + delta));
      return { ...prev, [sku]: nextQty };
    });
  };

  const removeItem = (sku: string) => {
    setSelected((prev) => {
      const next = { ...prev };
      delete next[sku];
      return next;
    });
  };

  const decreaseOrRemove = (sku: string) => {
    const current = selected[sku] ?? 1;
    if (current <= 1) {
      removeItem(sku);
    } else {
      adjustQty(sku, -1);
    }
  };

  const isModify = mode === 'modify';

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
            const isOn = selected[item.sku] != null;
            const wasVoiceMatch = result.lineItems.some((l) => l.sku === item.sku);
            const qty = selected[item.sku] ?? 1;

            return (
              <div
                key={item.sku}
                className={`rounded-xl border p-2.5 transition ${
                  isOn
                    ? 'border-indigo-200 bg-indigo-50/50 shadow-sm'
                    : 'border-gray-100 bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleItem(item.sku)}
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                      isOn
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-gray-300 bg-white'
                    }`}
                    aria-label={isOn ? `Deselect ${item.name}` : `Select ${item.name}`}
                  >
                    {isOn && <Check className="h-2.5 w-2.5" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-semibold text-gray-900">{item.name}</p>
                    <p className="text-[9px] text-gray-400">
                      {item.sku} · ${item.unitPrice.toFixed(2)}/{item.unit}
                    </p>
                    {wasVoiceMatch && isOn && (
                      <span className="mt-0.5 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[8px] font-medium text-amber-800">
                        Voice match — confirm qty
                      </span>
                    )}
                  </div>

                  {isOn && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.sku)}
                      className="flex shrink-0 items-center gap-0.5 text-[9px] font-medium text-red-500 hover:text-red-600"
                      aria-label={`Delete ${item.name}`}
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  )}
                </div>

                {isOn && (
                  <div className="mt-2 flex items-center justify-between pl-6">
                    <span className="text-[9px] text-gray-500">Quantity</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => decreaseOrRemove(item.sku)}
                        className={`flex h-6 w-6 items-center justify-center rounded-lg border bg-white ${
                          qty === 1
                            ? 'border-red-200 text-red-500 hover:bg-red-50'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                        aria-label={qty === 1 ? `Remove ${item.name}` : 'Decrease quantity'}
                      >
                        {qty === 1 ? (
                          <Trash2 className="h-3 w-3" />
                        ) : (
                          <Minus className="h-3 w-3" />
                        )}
                      </button>
                      <span className="w-6 text-center text-[10px] font-semibold text-gray-900">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => adjustQty(item.sku, 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
