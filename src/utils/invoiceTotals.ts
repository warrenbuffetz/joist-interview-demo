import type { InvoiceLineItem } from '../engine/handshakeEngine';

const TAX_RATE = 0.0825;

export function computeInvoiceTotals(lineItems: InvoiceLineItem[]) {
  const subtotal = lineItems.reduce(
    (sum, item) => sum + Math.round(item.quantity * item.unitPrice * 100) / 100,
    0,
  );
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  return { subtotal, tax, total };
}

export function lineItemFromCatalog(
  item: {
    sku: string;
    name: string;
    unitPrice: number;
    unit: string;
  },
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
  };
}
