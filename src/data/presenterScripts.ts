import type { ScenarioBillingOverride } from '../utils/scenarioBilling';
import {
  CREW_NLP_HAPPY_PATH_BILLING_OVERRIDE,
  CREW_NLP_HAPPY_PATH_TRANSCRIPT,
  HAPPY_PATH_BILLING_OVERRIDE,
  HAPPY_PATH_TRANSCRIPT,
} from './happyPathScenario';

export type ScriptOutcome = 'verified' | 'hitl';

export type { ScenarioBillingOverride };

export interface PresenterScript {
  id: string;
  title: string;
  tag: string;
  outcome: ScriptOutcome;
  /** What the presenter reads aloud into the mic */
  readAloud: string;
  /** How to deliver it — accent, pace, environment cues */
  deliveryNotes: string;
  /** What you say to the PM panel while this runs */
  presenterCue: string;
  /** Garbled transcript — what STT likely produces (accent, noise, slang) */
  simulateStt: string;
  /** Contractor-approved transcript after human review */
  hitlCorrected: string;
  /** Optional deterministic billing state for sandbox demos */
  billingOverride?: ScenarioBillingOverride;
}

export const PRESENTER_SCRIPTS: PresenterScript[] = [
  {
    id: 'clean-read',
    title: 'Script 1 — Flawless Thermostat Install',
    tag: 'Thermostat · wire · labor',
    outcome: 'verified',
    readAloud: HAPPY_PATH_TRANSCRIPT,
    deliveryNotes:
      'Speak clearly. This script demonstrates a flawless automation loop where every spoken entity maps perfectly to a high-confidence match in the company product catalog.',
    presenterCue:
      "This is the ideal happy path flow. Because the NLP model resolves all materials and durations with >90% confidence, the UI bypasses all warnings, labels line items seamlessly as 'Auto-filled', and clears the invoice directly for client delivery.",
    simulateStt: HAPPY_PATH_TRANSCRIPT,
    hitlCorrected: HAPPY_PATH_TRANSCRIPT,
    billingOverride: HAPPY_PATH_BILLING_OVERRIDE,
  },
  {
    id: 'crew-plural-nlp',
    title: 'Script 2 — Casual Crew & Duration',
    tag: 'Copper · crew · labor',
    outcome: 'verified',
    readAloud: CREW_NLP_HAPPY_PATH_TRANSCRIPT,
    deliveryNotes:
      "Speak conversationally at a normal pace. Emphasize 'me and a helper' naturally — the NLP model resolves casual crew plurals and duration phrases at high confidence without triggering review.",
    presenterCue:
      "This happy path proves conversational field speech still maps cleanly to catalog SKUs. 'Me and a helper' resolves to a 2-person crew, forty-five minutes bills as 0.75 hr on site, and every line item lands as Auto-filled — invoice is ready to send with no mediation step.",
    simulateStt: CREW_NLP_HAPPY_PATH_TRANSCRIPT,
    hitlCorrected: CREW_NLP_HAPPY_PATH_TRANSCRIPT,
    billingOverride: CREW_NLP_HAPPY_PATH_BILLING_OVERRIDE,
  },
  {
    id: 'accent-slang',
    title: 'Script 3 — Accent & Trade Slang',
    tag: 'HITL · accent',
    outcome: 'hitl',
    readAloud:
      "Right so I fitted two GFI's in the kitchen — y'know, ground-fault jobs — swapped the sixteen-by-twenty-five aircon filter, and charged one hour standard labour on the call-out.",
    deliveryNotes:
      'Use your natural accent. Say "GFI" instead of GFCI. Say "aircon" or "A/C filter." Drop the ends of words. This is how real contractors talk on site.',
    presenterCue:
      'STT often catches the gist but misses catalog precision. The system flags an Amber Alert — the contractor confirms SKUs before anything goes to the client.',
    simulateStt:
      "fitted two g f i's kitchen ground fault swap sixteen twenty five aircon filter one hour labour and some misc parts",
    hitlCorrected:
      'Install two GFCI outlets in the kitchen, replace the HVAC filter sixteen by twenty five, and bill one hour of standard labor.',
  },
  {
    id: 'noisy-van',
    title: 'Script 4 — Noisy Van / Low Audio',
    tag: 'HITL · environment',
    outcome: 'hitl',
    readAloud:
      '…(mumble) couple GFCI outlets kitchen …(engine noise)… HVAC filter sixteen twenty-five …hour labor.',
    deliveryNotes:
      'Speak quietly or partially off-mic. Cover the mic briefly mid-sentence. Leave words unfinished. Simulates a contractor dictating from a running work van.',
    presenterCue:
      'When audio is poor, STT drops words entirely. Joist never guesses — it surfaces gaps and waits for a human to fill them in.',
    simulateStt: 'couple outlets kitchen hvac filter hour labor and some miscellaneous stuff',
    hitlCorrected:
      'Install two GFCI outlets in the kitchen, replace the HVAC filter sixteen by twenty five, and bill one hour of standard labor.',
  },
  {
    id: 'vague-pricing',
    title: 'Script 5 — Vague On-Site Pricing',
    tag: 'HITL · pricing gap',
    outcome: 'hitl',
    readAloud:
      'Replace the copper pipe in the basement and add some miscellaneous fittings — maybe around fifty dollars worth of parts, I\'m not totally sure yet.',
    deliveryNotes:
      'Sound uncertain on the price. Say "maybe around fifty" and "not sure." This mirrors real field estimates before parts are counted.',
    presenterCue:
      'The handshake engine catches vague pricing language and blocks auto-send. The contractor taps Review & Correct and locks in catalog prices.',
    simulateStt:
      'replace copper pipe basement miscellaneous fittings maybe around fifty dollars not sure',
    hitlCorrected:
      'Replace ten feet of copper pipe three quarter inch in the basement and bill one hour of standard labor.',
  },
  {
    id: 'fast-walkthrough',
    title: 'Script 6 — Fast Walkthrough',
    tag: 'HITL · pace',
    outcome: 'hitl',
    readAloud:
      'Okay-quick-one: two-GFCI-kitchen-filter-sixteen-by-twenty-five-shingles-three-bundles-two-hours-labor-done.',
    deliveryNotes:
      'Read as one continuous rushed sentence with no pauses. Contractors often rattle off a job list before driving away.',
    presenterCue:
      'Rapid speech blurs item boundaries. Partial matches come through, but trust score drops — human review stitches the invoice together.',
    simulateStt:
      'quick two gfci kitchen filter sixteen twenty five shingles bundles two hours labor and misc supplies',
    hitlCorrected:
      'Install two GFCI outlets in the kitchen, replace the HVAC filter sixteen by twenty five, add three bundles of architectural shingles, and bill two hours of standard labor.',
  },
];
