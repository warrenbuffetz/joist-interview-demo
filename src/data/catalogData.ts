export interface CatalogItem {
  sku: string;
  name: string;
  aliases: string[];
  unitPrice: number;
  unit: string;
  category: string;
}

export const CatalogData: CatalogItem[] = [
  {
    sku: 'SKU-HVAC-1625',
    name: 'HVAC Filter 16x25',
    aliases: ['hvac filter', '16x25 filter', 'air filter 16 by 25', 'filter sixteen by twenty five'],
    unitPrice: 24.99,
    unit: 'each',
    category: 'HVAC',
  },
  {
    sku: 'SKU-PLUMB-CP34',
    name: 'Copper Pipe 3/4"',
    aliases: ['copper pipe', 'three quarter pipe', '3/4 pipe', '3/4 inch copper', 'copper tubing'],
    unitPrice: 8.49,
    unit: 'ft',
    category: 'Plumbing',
  },
  {
    sku: 'SKU-ELEC-GFCI',
    name: 'GFCI Outlet 20A',
    aliases: ['gfci outlet', 'gfci', 'ground fault outlet', '20 amp gfci'],
    unitPrice: 18.75,
    unit: 'each',
    category: 'Electrical',
  },
  {
    sku: 'SKU-ELEC-SMARTTH',
    name: 'Smart Thermostat',
    aliases: ['smart thermostat', 'wifi thermostat', 'programmable thermostat'],
    unitPrice: 149.99,
    unit: 'each',
    category: 'Electrical',
  },
  {
    sku: 'SKU-ELEC-WIRE18',
    name: 'Thermostat Wire 18/5',
    aliases: [
      'thermostat wire',
      'eighteen five wire',
      '18/5 wire',
      '18 5 thermostat wire',
      'five wire thermostat cable',
    ],
    unitPrice: 0.85,
    unit: 'ft',
    category: 'Electrical',
  },
  {
    sku: 'SKU-LABOR-STD',
    name: 'Standard Labor',
    aliases: ['labor', 'labour', 'hourly labor', 'service call', 'installation labor'],
    unitPrice: 95.0,
    unit: 'hr',
    category: 'Labor',
  },
  {
    sku: 'SKU-ROOF-SHNG',
    name: 'Architectural Shingles (bundle)',
    aliases: ['shingles', 'roof shingles', 'architectural shingles', 'shingle bundle'],
    unitPrice: 42.0,
    unit: 'bundle',
    category: 'Roofing',
  },
];

import { HAPPY_PATH_BILLING_OVERRIDE, HAPPY_PATH_TRANSCRIPT } from './happyPathScenario';

export const DEMO_TRANSCRIPTS = {
  verified: HAPPY_PATH_TRANSCRIPT,
  amber:
    'Replace copper pipe in the basement and add some miscellaneous fittings, maybe around fifty dollars worth.',
};

/** Quick-verified shortcut — flawless 100% high-confidence happy path. */
export const DEMO_BILLING_OVERRIDE = HAPPY_PATH_BILLING_OVERRIDE;
