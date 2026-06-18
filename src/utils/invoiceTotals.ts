import type { CatalogItem } from '../data/catalogData';
import type { InvoiceLineItem } from '../engine/handshakeEngine';
import { computeLaborLineTotal, isLaborSku, minutesToDisplayHours } from './laborTime';
import { computeTax, computeTotalWithTax } from './tax';

export { TAX_RATE, TAX_LABEL } from './tax';

export interface LaborSelection {
  minutes: number;
  crewSize: number;
}

export function computeInvoiceTotals(lineItems: InvoiceLineItem[]) {
  const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const tax = computeTax(subtotal);
  const total = computeTotalWithTax(subtotal);
  return { subtotal, tax, total };
}

export function lineItemFromCatalog(
  item: Pick<CatalogItem, 'sku' | 'name' | 'unitPrice' | 'unit'>,
  quantity = 1,
): InvoiceLineItem {
  const lineTotal = Math.round(quantity * item.unitPrice * 100) / 100;
  return {
    sku: item.sku,
    name: item.name,
    quantity,
    unitPrice: item.unitPrice,
    unit: item.unit,
    lineTotal,
    confidence: 1,
    matchedFrom: 'manual selection',
    itemType: 'physical',
  };
}

export function lineItemFromLabor(
  item: Pick<CatalogItem, 'sku' | 'name' | 'unitPrice' | 'unit'>,
  minutes: number,
  crewSize: number,
): InvoiceLineItem {
  const durationHours = minutes / 60;
  const lineTotal = computeLaborLineTotal(item.unitPrice, minutes, crewSize);
  return {
    sku: item.sku,
    name: item.name,
    quantity: durationHours,
    unitPrice: item.unitPrice,
    unit: item.unit,
    lineTotal,
    confidence: 1,
    matchedFrom: 'manual selection',
    itemType: 'labor',
    durationMinutes: minutes,
    crewSize,
  };
}

export function buildMediationLineItems(
  catalog: CatalogItem[],
  physicalQty: Record<string, number>,
  laborSelections: Record<string, LaborSelection>,
): InvoiceLineItem[] {
  const items: InvoiceLineItem[] = [];

  for (const item of catalog) {
    if (isLaborSku(item.sku)) {
      const selection = laborSelections[item.sku];
      if (selection) {
        items.push(lineItemFromLabor(item, selection.minutes, selection.crewSize));
      }
      continue;
    }

    const quantity = physicalQty[item.sku];
    if (quantity != null) {
      items.push(lineItemFromCatalog(item, quantity));
    }
  }

  return items;
}

/** Human-readable qty/rate breakdown for invoice line rows. */
export function formatLineItemCalculation(item: InvoiceLineItem): string {
  const rate = `$${item.unitPrice.toFixed(2)}`;

  if (item.itemType === 'labor' || isLaborSku(item.sku)) {
    const hours =
      item.durationMinutes != null
        ? minutesToDisplayHours(item.durationMinutes)
        : item.quantity.toFixed(2);
    const crew = item.crewSize ?? 1;

    if (crew > 1) {
      return `${hours} hr on site · ${crew}-person crew @ ${rate}/hr`;
    }
    return `${hours} hr @ ${rate}/hr`;
  }

  return `${item.quantity} ${item.unit} × ${rate}`;
}
