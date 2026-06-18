import { CatalogData } from '../data/catalogData';
import type { HandshakeResult, InvoiceLineItem } from '../engine/handshakeEngine';
import { lineItemFromCatalog, lineItemFromLabor } from './invoiceTotals';
import { LABOR_SKU } from './laborTime';
import { computeTax, computeTotalWithTax } from './tax';

export interface ScenarioBillingOverride {
  materials?: Array<{ sku: string; quantity: number }>;
  labor?: { minutes: number; crewSize: number };
}

export function applyScenarioBilling(
  result: HandshakeResult,
  override: ScenarioBillingOverride,
): HandshakeResult {
  const lineItems: InvoiceLineItem[] = [...result.lineItems];

  for (const material of override.materials ?? []) {
    const catalogItem = CatalogData.find((item) => item.sku === material.sku);
    if (!catalogItem) continue;

    const nextLine = lineItemFromCatalog(catalogItem, material.quantity);
    const existingIndex = lineItems.findIndex((line) => line.sku === material.sku);
    if (existingIndex >= 0) {
      lineItems[existingIndex] = {
        ...nextLine,
        confidence: lineItems[existingIndex].confidence,
        matchedFrom: lineItems[existingIndex].matchedFrom,
      };
    } else {
      lineItems.push(nextLine);
    }
  }

  if (override.labor) {
    const laborCatalog = CatalogData.find((item) => item.sku === LABOR_SKU);
    if (laborCatalog) {
      const laborLine = lineItemFromLabor(
        laborCatalog,
        override.labor.minutes,
        override.labor.crewSize,
      );
      const existingIndex = lineItems.findIndex((line) => line.sku === LABOR_SKU);
      if (existingIndex >= 0) {
        lineItems[existingIndex] = laborLine;
      } else {
        lineItems.push(laborLine);
      }
    }
  }

  const subtotal = Math.round(lineItems.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100;
  const tax = computeTax(subtotal);
  const total = computeTotalWithTax(subtotal);

  return {
    ...result,
    status: 'verified',
    lineItems,
    gaps: [],
    subtotal,
    tax,
    total,
    trustScore: 1,
  };
}
