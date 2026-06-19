import { CatalogData } from '../data/catalogData';
import type { CatalogItem } from '../data/catalogTypes';

export interface CategoryCount {
  category: string;
  count: number;
}

/** Curated demo phrases that map cleanly to catalog SKUs. */
export const CATALOG_EXAMPLE_PHRASES = [
  'install a dishwasher',
  'ten feet of pex pipe',
  'ice and water shield',
  'forty gallon water heater',
  'replace the sixteen by twenty five hvac filter',
  'one hour standard labor',
] as const;

export function getCatalogTotalCount(): number {
  return CatalogData.length;
}

export function getCategoryCounts(): CategoryCount[] {
  const counts = new Map<string, number>();
  for (const item of CatalogData) {
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

export function getTradeCount(): number {
  return getCategoryCounts().length;
}

export function filterCatalogItems(search: string): CatalogItem[] {
  const q = search.toLowerCase().trim();
  const list = q
    ? CatalogData.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q),
      )
    : CatalogData;
  return [...list].sort(
    (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
  );
}
