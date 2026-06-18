export type ScriptOutcome = 'verified' | 'hitl';

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
}

export const PRESENTER_SCRIPTS: PresenterScript[] = [
  {
    id: 'clean-read',
    title: 'Script 1 — Clean Job-Site Read',
    tag: 'Happy path',
    outcome: 'verified',
    readAloud:
      'Install two GFCI outlets in the kitchen, replace the HVAC filter sixteen by twenty five, and bill one hour of standard labor.',
    deliveryNotes:
      'Speak clearly at a normal pace. Pause briefly between each line item. Face the phone or mic directly.',
    presenterCue:
      'This is the ideal flow — voice maps cleanly to verified catalog SKUs and the invoice is ready to send.',
    simulateStt:
      'Install two GFCI outlets in the kitchen, replace the HVAC filter sixteen by twenty five, and bill one hour of standard labor.',
    hitlCorrected:
      'Install two GFCI outlets in the kitchen, replace the HVAC filter sixteen by twenty five, and bill one hour of standard labor.',
  },
  {
    id: 'accent-slang',
    title: 'Script 2 — Accent & Trade Slang',
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
    title: 'Script 3 — Noisy Van / Low Audio',
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
    title: 'Script 4 — Vague On-Site Pricing',
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
    title: 'Script 5 — Fast Walkthrough',
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
