import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { filterCatalogItems } from '../utils/catalogSummary';

interface CatalogBrowseModalProps {
  open: boolean;
  onClose: () => void;
}

export function CatalogBrowseModal({ open, onClose }: CatalogBrowseModalProps) {
  const [search, setSearch] = useState('');

  const filteredCatalog = useMemo(() => filterCatalogItems(search), [search]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="catalog-browse-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(80vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface-raised shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-surface-border px-4 py-3">
          <div>
            <h3 id="catalog-browse-title" className="text-sm font-semibold text-white">
              Parts Catalog
            </h3>
            <p className="mt-0.5 text-[11px] text-surface-muted">
              Search by name, SKU, or trade category
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-surface-muted transition hover:bg-surface-border hover:text-white"
            aria-label="Close catalog browser"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="border-b border-surface-border px-4 py-2">
          <div className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface/50 px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-surface-muted" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. roofing, electrical, pex…"
              className="w-full bg-transparent text-xs text-white placeholder:text-surface-muted/60 focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto px-2 py-2">
          {filteredCatalog.length === 0 ? (
            <li className="px-2 py-8 text-center text-xs text-surface-muted">
              No items match your search
            </li>
          ) : (
            filteredCatalog.map((item) => (
              <li
                key={item.sku}
                className="rounded-lg px-2 py-2 transition hover:bg-surface-border/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-white/90">{item.name}</p>
                    <p className="text-[10px] text-surface-muted">
                      {item.sku} · {item.category}
                    </p>
                  </div>
                  <p className="shrink-0 text-[10px] font-medium text-indigo-300">
                    ${item.unitPrice.toFixed(2)}/{item.unit}
                  </p>
                </div>
              </li>
            ))
          )}
        </ul>

        <footer className="border-t border-surface-border px-4 py-3">
          <p className="text-center text-[10px] leading-relaxed text-surface-muted">
            Speak these items naturally, or add them during invoice review
          </p>
        </footer>
      </div>
    </div>
  );
}
