export type { CatalogItem } from './catalogTypes';
export { CONTRACTOR_CATALOG_ITEMS as CatalogData } from './contractorCatalog';

import { HAPPY_PATH_BILLING_OVERRIDE, HAPPY_PATH_TRANSCRIPT } from './happyPathScenario';

export const DEMO_TRANSCRIPTS = {
  verified: HAPPY_PATH_TRANSCRIPT,
  amber:
    'Replace copper pipe in the basement and add some miscellaneous fittings, maybe around fifty dollars worth.',
};

/** Quick-verified shortcut — flawless 100% high-confidence happy path. */
export const DEMO_BILLING_OVERRIDE = HAPPY_PATH_BILLING_OVERRIDE;
