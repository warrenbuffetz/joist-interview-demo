import { describe, it, expect } from 'vitest';
import { runHandshakeEngine, type HandshakeResult } from './handshakeEngine';
import {
  HAPPY_PATH_TRANSCRIPT,
  HAPPY_PATH_BILLING_OVERRIDE,
} from '../data/happyPathScenario';

const THERMOSTAT_SKU = 'SKU-ELEC-SMARTTH';
const WIRE_SKU = 'SKU-ELEC-WIRE18';
const LABOR_SKU = 'SKU-LABOR-STD';

const findLine = (result: HandshakeResult, sku: string) =>
  result.lineItems.find((line) => line.sku === sku);

/**
 * Parse the `qty:`/`duration:` value out of a `[MATCH]` log so we can prove the log and the
 * final line item (which the smartphone preview renders) share one source of truth.
 */
function matchLogQuantities(result: HandshakeResult): Map<string, number> {
  const byline = new Map<string, number>();
  for (const log of result.logs) {
    const m = log.message.match(/^\[MATCH\] (\S+) ←.*\(qty: ([\d.]+)/);
    if (m) byline.set(m[1], Number(m[2]));
  }
  return byline;
}

describe('runHandshakeEngine — thermostat scenarios', () => {
  describe('Scenario A: clean verified thermostat (with billing override)', () => {
    const result = runHandshakeEngine(
      HAPPY_PATH_TRANSCRIPT,
      'scenario',
      HAPPY_PATH_BILLING_OVERRIDE,
    );

    it('attributes quantities to the correct lines', () => {
      expect(findLine(result, THERMOSTAT_SKU)?.quantity).toBe(1);
      expect(findLine(result, WIRE_SKU)?.quantity).toBe(15);
      const labor = findLine(result, LABOR_SKU);
      expect(labor?.durationMinutes).toBe(30);
      expect(labor?.quantity).toBe(0.5);
    });

    it('raises no unusual_quantity gap and is verified', () => {
      expect(result.gaps.some((g) => g.type === 'unusual_quantity')).toBe(false);
      expect(result.status).toBe('verified');
    });

    it('logs the thermostat [MATCH] with qty 1 (log matches preview)', () => {
      const thermostatLog = result.logs.find(
        (log) => log.message.includes('[MATCH]') && log.message.includes(THERMOSTAT_SKU),
      );
      expect(thermostatLog?.message).toContain('qty: 1');
    });
  });

  describe('Scenario B: quantity attribution failure (raw parse)', () => {
    const result = runHandshakeEngine(HAPPY_PATH_TRANSCRIPT, 'voice');

    it('mis-attributes qty 15 to the high-value thermostat', () => {
      expect(findLine(result, THERMOSTAT_SKU)?.quantity).toBe(15);
    });

    it('flags an unusual_quantity gap and is NOT verified', () => {
      expect(result.gaps.some((g) => g.type === 'unusual_quantity')).toBe(true);
      expect(result.status).toBe('amber_alert');
    });

    it('downgrades the flagged line so the preview shows Review Quantities', () => {
      expect(findLine(result, THERMOSTAT_SKU)?.automationStatus).toBe('medium');
    });

    it('surfaces unusual_quantity in the trust logs', () => {
      expect(result.logs.some((log) => log.message.includes('unusual_quantity'))).toBe(true);
    });
  });

  describe('parity invariant: every [MATCH] qty equals the final line quantity', () => {
    const scenarios: Array<[string, HandshakeResult]> = [
      [
        'override',
        runHandshakeEngine(HAPPY_PATH_TRANSCRIPT, 'scenario', HAPPY_PATH_BILLING_OVERRIDE),
      ],
      ['raw', runHandshakeEngine(HAPPY_PATH_TRANSCRIPT, 'voice')],
    ];

    it.each(scenarios)('%s scenario logs agree with final line items', (_label, result) => {
      const logged = matchLogQuantities(result);
      expect(logged.size).toBeGreaterThan(0);
      for (const [sku, qty] of logged) {
        expect(findLine(result, sku)?.quantity).toBe(qty);
      }
    });
  });
});
