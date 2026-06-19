import type { HandshakeResult, InvoiceLineItem } from '../engine/handshakeEngine';
import type { LaborSelection } from './invoiceTotals';
import { isLaborSku } from './laborTime';

function hoursToMinutes(hours: number): number {
  return Math.round(hours * 60);
}

export function buildInitialPhysicalQty(result: HandshakeResult): Record<string, number> {
  const initial: Record<string, number> = {};
  result.lineItems.forEach((item) => {
    if (!isLaborSku(item.sku)) {
      initial[item.sku] = item.quantity;
    }
  });
  return initial;
}

export function buildInitialLaborSelections(
  result: HandshakeResult,
): Record<string, LaborSelection> {
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

/** SKUs whose qty, duration, crew, or presence changed vs the AI draft baseline. */
export function getEditedSkusFromBaseline(
  result: HandshakeResult,
  physicalQty: Record<string, number>,
  laborSelections: Record<string, LaborSelection>,
): Set<string> {
  const edited = new Set<string>();
  const initialPhysical = buildInitialPhysicalQty(result);
  const initialLabor = buildInitialLaborSelections(result);

  const allSkus = new Set([
    ...Object.keys(initialPhysical),
    ...Object.keys(initialLabor),
    ...Object.keys(physicalQty),
    ...Object.keys(laborSelections),
  ]);

  for (const sku of allSkus) {
    if (isLaborSku(sku)) {
      const current = laborSelections[sku];
      const initial = initialLabor[sku];
      if (Boolean(current) !== Boolean(initial)) {
        edited.add(sku);
        continue;
      }
      if (
        current &&
        initial &&
        (current.minutes !== initial.minutes || current.crewSize !== initial.crewSize)
      ) {
        edited.add(sku);
      }
      continue;
    }

    const currentQty = physicalQty[sku];
    const initialQty = initialPhysical[sku];
    if (currentQty != null && initialQty == null) {
      edited.add(sku);
    } else if (currentQty == null && initialQty != null) {
      edited.add(sku);
    } else if (currentQty != null && initialQty != null && currentQty !== initialQty) {
      edited.add(sku);
    }
  }

  return edited;
}

export function applyEditedFlagsToLineItems(
  lineItems: InvoiceLineItem[],
  editedSkus: Set<string>,
): InvoiceLineItem[] {
  return lineItems.map((item) => {
    if (!editedSkus.has(item.sku)) return item;
    return {
      ...item,
      automationStatus: 'user_verified',
      isHumanEdited: true,
    };
  });
}

export function invoiceHasUserModifications(
  lineItems: InvoiceLineItem[],
  isHumanVerified?: boolean,
): boolean {
  return isHumanVerified === true || lineItems.some((item) => item.isHumanEdited === true);
}
