import type { ScenarioBillingOverride } from '../utils/scenarioBilling';

export const HAPPY_PATH_TRANSCRIPT =
  'Install a smart thermostat, add fifteen feet of thermostat wire, and log thirty minutes of standard labor.';

/** 100% high-confidence verified path — replaces draft lines entirely. */
export const HAPPY_PATH_BILLING_OVERRIDE: ScenarioBillingOverride = {
  lineItems: [
    {
      sku: 'SKU-ELEC-SMARTTH',
      quantity: 1,
      confidenceScore: 96,
      automationStatus: 'high',
    },
    {
      sku: 'SKU-ELEC-WIRE18',
      quantity: 15,
      confidenceScore: 95,
      automationStatus: 'high',
    },
    {
      sku: 'SKU-LABOR-STD',
      laborMinutes: 30,
      crewSize: 1,
      confidenceScore: 97,
      automationStatus: 'high',
    },
  ],
};

export const CREW_NLP_HAPPY_PATH_TRANSCRIPT =
  'Me and a helper spent forty five minutes replacing the copper pipe under the commercial sink.';

/** Script 2 — conversational crew + duration NLP, all lines auto-filled. */
export const CREW_NLP_HAPPY_PATH_BILLING_OVERRIDE: ScenarioBillingOverride = {
  lineItems: [
    {
      sku: 'SKU-PLUMB-CP34',
      quantity: 10,
      confidenceScore: 94,
      automationStatus: 'high',
    },
    {
      sku: 'SKU-LABOR-STD',
      laborMinutes: 45,
      crewSize: 2,
      confidenceScore: 96,
      automationStatus: 'high',
    },
  ],
};
