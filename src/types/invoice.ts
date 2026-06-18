/** Catalog-backed line item kinds rendered with different card layouts. */
export type LineItemType = 'physical' | 'labor';

export interface PhysicalLineItemSelection {
  type: 'physical';
  sku: string;
  quantity: number;
}

export interface LaborLineItemSelection {
  type: 'labor';
  sku: string;
  /** Duration stored as whole minutes to avoid float drift. */
  minutes: number;
  crewSize: number;
}

export type MediationLineSelection = PhysicalLineItemSelection | LaborLineItemSelection;

export interface InvoiceSummary {
  lineCount: number;
  subtotal: number;
  tax: number;
  total: number;
}
