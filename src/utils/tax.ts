/** Ontario harmonized sales tax (HST) — 13% (5% federal GST + 8% provincial). */
export const TAX_RATE = 0.13;

export const TAX_LABEL = 'HST (13%)';

export function computeTax(subtotal: number): number {
  return Math.round(subtotal * TAX_RATE * 100) / 100;
}

export function computeTotalWithTax(subtotal: number): number {
  return Math.round((subtotal + computeTax(subtotal)) * 100) / 100;
}
