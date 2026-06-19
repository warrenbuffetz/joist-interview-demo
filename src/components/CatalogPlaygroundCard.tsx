import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Package } from 'lucide-react';
import {
  CATALOG_EXAMPLE_PHRASES,
  getCatalogTotalCount,
  getCategoryCounts,
  getTradeCount,
} from '../utils/catalogSummary';
import { CatalogBrowseModal } from './CatalogBrowseModal';

const COLLAPSED_STORAGE_KEY = 'joist-catalog-card-collapsed';

interface CatalogPlaygroundCardProps {
  onTryPhrase: (phrase: string) => void;
  disabled?: boolean;
}

export function CatalogPlaygroundCard({ onTryPhrase, disabled = false }: CatalogPlaygroundCardProps) {
  const [sectionOpen, setSectionOpen] = useState(true);
  const [browseOpen, setBrowseOpen] = useState(false);

  const totalCount = getCatalogTotalCount();
  const tradeCount = getTradeCount();
  const categoryCounts = getCategoryCounts();
  const examplePhrases = CATALOG_EXAMPLE_PHRASES.slice(0, 3);

  useEffect(() => {
    try {
      const collapsed = localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true';
      setSectionOpen(!collapsed);
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleSection = () => {
    setSectionOpen((open) => {
      const next = !open;
      try {
        localStorage.setItem(COLLAPSED_STORAGE_KEY, next ? 'false' : 'true');
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  return (
    <>
      <div className="mb-4 shrink-0 overflow-hidden rounded-xl border border-indigo-500/30 bg-indigo-500/10 shadow-sm">
        <button
          type="button"
          onClick={toggleSection}
          className="flex w-full items-center justify-between gap-2 p-3 text-left transition hover:bg-indigo-500/10"
          aria-expanded={sectionOpen}
        >
          <div className="flex min-w-0 items-center gap-2">
            <Package className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Parts Playground
              </p>
              <p className="mt-0.5 truncate text-[10px] text-surface-muted">
                {sectionOpen
                  ? `${totalCount} contractor SKUs — mix trades to build any invoice`
                  : `Tap to expand · ${totalCount} SKUs across ${tradeCount} trades`}
              </p>
            </div>
          </div>
          {sectionOpen ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-surface-muted" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-surface-muted" />
          )}
        </button>

        {sectionOpen && (
          <div className="space-y-3 border-t border-indigo-500/20 px-3 pb-3 pt-2">
            <p className="text-[10px] text-surface-muted">
              {totalCount} SKUs · {tradeCount} trades
            </p>

            <div className="flex flex-wrap gap-1.5">
              {categoryCounts.map(({ category, count }) => (
                <span
                  key={category}
                  className="rounded-full border border-surface-border bg-surface-raised/60 px-2 py-0.5 text-[10px] text-surface-muted"
                >
                  {category} {count}
                </span>
              ))}
            </div>

            <div>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-surface-muted">
                Try saying
              </p>
              <div className="flex flex-wrap gap-1.5">
                {examplePhrases.map((phrase) => (
                  <button
                    key={phrase}
                    type="button"
                    disabled={disabled}
                    onClick={() => onTryPhrase(phrase)}
                    className="rounded-lg border border-indigo-500/25 bg-indigo-500/10 px-2 py-1 text-[10px] font-medium text-indigo-300 transition hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    &ldquo;{phrase}&rdquo;
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setBrowseOpen(true)}
              className="w-full rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs font-medium text-indigo-300 transition hover:bg-indigo-500/20"
            >
              Browse catalog
            </button>
          </div>
        )}
      </div>

      <CatalogBrowseModal open={browseOpen} onClose={() => setBrowseOpen(false)} />
    </>
  );
}
