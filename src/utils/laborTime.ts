export const LABOR_SKU = 'SKU-LABOR-STD';
export const MINUTES_PER_QUARTER_HOUR = 15;

export function isLaborSku(sku: string): boolean {
  return sku === LABOR_SKU;
}

export function minutesToDisplayHours(minutes: number): string {
  return (minutes / 60).toFixed(2);
}

export function displayHoursToMinutes(value: string): number {
  const parsed = parseFloat(value);
  if (Number.isNaN(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 60);
}

export function clampMinutes(minutes: number, min = 0, max = 24 * 60): number {
  return Math.max(min, Math.min(max, minutes));
}

export function adjustMinutes(minutes: number, deltaMinutes: number): number {
  return clampMinutes(minutes + deltaMinutes, 0);
}

export function computeLaborLineTotal(
  unitPrice: number,
  minutes: number,
  crewSize: number,
): number {
  const durationHours = minutes / 60;
  return Math.round(durationHours * crewSize * unitPrice * 100) / 100;
}
