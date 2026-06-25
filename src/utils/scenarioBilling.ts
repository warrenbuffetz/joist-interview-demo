import { CatalogData } from '../data/catalogData';
import type { InvoiceLineItem } from '../engine/handshakeEngine';
import { lineItemFromCatalog, lineItemFromLabor } from './invoiceTotals';
import { isLaborSku, LABOR_SKU } from './laborTime';

import type { AutomationStatus } from '../types/automationStatus';
import { automationStatusFromScore } from '../types/automationStatus';

export interface LineItemAutomationOverride {
  confidenceScore?: number;
  automationStatus?: AutomationStatus;
}

export interface ScenarioLineItemSpec {
  sku: string;
  quantity?: number;
  laborMinutes?: number;
  crewSize?: number;
  confidenceScore?: number;
  automationStatus?: AutomationStatus;
}

export interface ScenarioBillingOverride {
  /** Replaces the entire draft with only these catalog lines (clears prior matches). */
  lineItems?: ScenarioLineItemSpec[];
  materials?: Array<{ sku: string; quantity: number }>;
  labor?: { minutes: number; crewSize: number };
  lineItemAutomation?: Record<string, LineItemAutomationOverride>;
}

function applyLineItemAutomation(
  lineItems: InvoiceLineItem[],
  overrides?: Record<string, LineItemAutomationOverride>,
): InvoiceLineItem[] {
  if (!overrides) return lineItems;

  return lineItems.map((line) => {
    const override = overrides[line.sku];
    if (!override) return line;

    const confidenceScore =
      override.confidenceScore ??
      (override.automationStatus
        ? undefined
        : (line.confidenceScore ?? Math.round(line.confidence * 100)));

    const automationStatus =
      override.automationStatus ??
      (confidenceScore != null ? automationStatusFromScore(confidenceScore) : line.automationStatus);

    return {
      ...line,
      confidenceScore: confidenceScore ?? line.confidenceScore,
      automationStatus,
      confidence:
        confidenceScore != null
          ? confidenceScore / 100
          : line.confidence,
    };
  });
}

function buildLineFromSpec(spec: ScenarioLineItemSpec): InvoiceLineItem | null {
  const catalogItem = CatalogData.find((item) => item.sku === spec.sku);
  if (!catalogItem) return null;

  const confidenceScore = spec.confidenceScore ?? 96;
  const automationStatus = spec.automationStatus ?? automationStatusFromScore(confidenceScore);

  if (isLaborSku(spec.sku)) {
    return {
      ...lineItemFromLabor(catalogItem, spec.laborMinutes ?? 60, spec.crewSize ?? 1),
      confidence: confidenceScore / 100,
      confidenceScore,
      automationStatus,
      matchedFrom: 'voice match',
    };
  }

  return {
    ...lineItemFromCatalog(catalogItem, spec.quantity ?? 1),
    confidence: confidenceScore / 100,
    confidenceScore,
    automationStatus,
    matchedFrom: 'voice match',
  };
}

function buildCanonicalLineItems(specs: ScenarioLineItemSpec[]): InvoiceLineItem[] {
  return specs
    .map(buildLineFromSpec)
    .filter((line): line is InvoiceLineItem => line != null);
}

/**
 * Pure transform: applies a demo billing override to draft line items and returns the
 * final canonical line items. Trust gaps, status, totals, and logs are computed downstream
 * by the engine's finalize step so the trust log and preview share one source of truth.
 */
export function resolveScenarioLineItems(
  draftLineItems: InvoiceLineItem[],
  override: ScenarioBillingOverride,
): InvoiceLineItem[] {
  let lineItems: InvoiceLineItem[] = override.lineItems
    ? buildCanonicalLineItems(override.lineItems)
    : [...draftLineItems];

  if (!override.lineItems) {
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
  }

  return applyLineItemAutomation(lineItems, override.lineItemAutomation);
}
