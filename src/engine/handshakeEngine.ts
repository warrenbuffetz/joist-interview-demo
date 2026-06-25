import { CatalogData, type CatalogItem } from '../data/catalogData';
import { MATERIAL_DEFAULT_QUANTITIES } from '../data/materialDefaults';
import type { LineItemType } from '../types/invoice';
import type { AutomationStatus } from '../types/automationStatus';
import { automationStatusFromScore, computeInvoiceAggregateStatus } from '../types/automationStatus';
import { computeLaborLineTotal, isLaborSku, LABOR_SKU } from '../utils/laborTime';
import { computeTax, computeTotalWithTax } from '../utils/tax';
import { resolveScenarioLineItems, type ScenarioBillingOverride } from '../utils/scenarioBilling';

/** Heuristic thresholds for flagging implausible quantities on high-value SKUs. */
const HIGH_VALUE_USD = 100;
const MAX_TYPICAL_EACH_QTY = 3;

export type TrustStatus = 'idle' | 'processing' | 'verified' | 'amber_alert';

export type InputSource = 'voice' | 'text' | 'scenario';

const SOURCE_LABEL: Record<InputSource, string> = {
  voice: 'Voice Capture',
  text: 'Text Note',
  scenario: 'Demo Scenario',
};

export interface InvoiceLineItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  lineTotal: number;
  confidence: number;
  matchedFrom: string;
  itemType?: LineItemType;
  /** Labor only — duration in whole minutes. */
  durationMinutes?: number;
  /** Labor only — crew multiplier (min 1). */
  crewSize?: number;
  confidenceScore?: number;
  automationStatus?: AutomationStatus;
  /** Telemetry — true when a contractor manually adjusted this line. */
  isHumanEdited?: boolean;
}

export interface TrustGap {
  type: 'missing_price' | 'ambiguous_item' | 'unmatched_item' | 'unusual_quantity';
  message: string;
  rawFragment: string;
}

export interface HandshakeLogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'success' | 'warn' | 'error';
  phase: 'intake' | 'normalize' | 'catalog' | 'pricing' | 'trust' | 'complete';
  message: string;
}

export interface HandshakeResult {
  status: TrustStatus;
  transcript: string;
  lineItems: InvoiceLineItem[];
  gaps: TrustGap[];
  logs: HandshakeLogEntry[];
  subtotal: number;
  tax: number;
  total: number;
  trustScore: number;
  /** Set after amber/HITL mediation confirm — invoice elevated by contractor review. */
  isHumanVerified?: boolean;
}

let logCounter = 0;

function createLog(
  level: HandshakeLogEntry['level'],
  phase: HandshakeLogEntry['phase'],
  message: string,
): HandshakeLogEntry {
  return {
    id: `log-${Date.now()}-${++logCounter}`,
    timestamp: Date.now(),
    level,
    phase,
    message,
  };
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s/.']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isDurationContext(text: string, matchIndex: number): boolean {
  const window = text.slice(matchIndex, matchIndex + 20).toLowerCase();
  return /\s*(minutes?|mins?|hours?|hrs?)\b/.test(window);
}

function extractDurationMinutes(transcript: string): number | null {
  const normalized = normalizeText(transcript);

  const compoundMinutes: Record<string, number> = {
    'forty five': 45,
    'fifty five': 55,
    'thirty five': 35,
    'twenty five': 25,
    'sixty five': 65,
    'seventy five': 75,
    'ninety five': 95,
    fifteen: 15,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
  };

  for (const [phrase, minutes] of Object.entries(compoundMinutes)) {
    if (normalized.includes(`${phrase} minutes`) || normalized.includes(`${phrase} minute`)) {
      return minutes;
    }
  }

  const digitMatch = normalized.match(/\b(\d+)\s*(minutes?|mins?)\b/);
  if (digitMatch) return parseInt(digitMatch[1], 10);

  const hourMatch = normalized.match(
    /\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s*(hours?|hrs?)\b/,
  );
  if (hourMatch) {
    const wordToNum: Record<string, number> = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
    };
    const raw = hourMatch[1];
    const hours = wordToNum[raw] ?? parseInt(raw, 10);
    if (!Number.isNaN(hours) && hours > 0) return hours * 60;
  }

  return null;
}

function extractCrewSize(transcript: string): number | null {
  const normalized = normalizeText(transcript);

  if (/\bme and a helper\b/.test(normalized) || /\bme and an helper\b/.test(normalized)) {
    return 2;
  }
  if (/\bboth of us\b/.test(normalized) || /\bthe two of us\b/.test(normalized)) {
    return 2;
  }
  if (/\bme and two helpers\b/.test(normalized)) {
    return 3;
  }

  return null;
}

function hasExplicitMaterialQuantity(transcript: string, unit: string): boolean {
  const unitPattern =
    unit === 'ft' ? /\b\d+\s*(ft|feet|foot)\b/i : new RegExp(`\\b\\d+\\s*${unit}s?\\b`, 'i');
  return unitPattern.test(transcript);
}

function applyMaterialDefaults(transcript: string, lineItems: InvoiceLineItem[]): InvoiceLineItem[] {
  return lineItems.map((line) => {
    const defaultQty = MATERIAL_DEFAULT_QUANTITIES[line.sku];
    if (!defaultQty) return line;

    const catalogItem = CatalogData.find((item) => item.sku === line.sku);
    if (!catalogItem) return line;

    if (hasExplicitMaterialQuantity(transcript, catalogItem.unit)) {
      return line;
    }

    const quantity = defaultQty;
    const lineTotal = Math.round(quantity * line.unitPrice * 100) / 100;
    return { ...line, quantity, lineTotal };
  });
}

function attachAutomation(line: InvoiceLineItem): InvoiceLineItem {
  const confidenceScore = line.confidenceScore ?? Math.round(line.confidence * 100);
  return {
    ...line,
    confidenceScore,
    automationStatus: line.automationStatus ?? automationStatusFromScore(confidenceScore),
  };
}

function upsertLaborLine(
  lineItems: InvoiceLineItem[],
  minutes: number,
  crewSize: number,
  matchedFrom: string,
): InvoiceLineItem[] {
  const laborCatalog = CatalogData.find((item) => item.sku === LABOR_SKU);
  if (!laborCatalog) return lineItems;

  const durationHours = minutes / 60;
  const lineTotal = computeLaborLineTotal(laborCatalog.unitPrice, minutes, crewSize);
  const laborLine: InvoiceLineItem = {
    sku: laborCatalog.sku,
    name: laborCatalog.name,
    quantity: durationHours,
    unitPrice: laborCatalog.unitPrice,
    unit: laborCatalog.unit,
    lineTotal,
    confidence: 0.96,
    matchedFrom,
    itemType: 'labor',
    durationMinutes: minutes,
    crewSize,
  };

  const withoutLabor = lineItems.filter((line) => line.sku !== LABOR_SKU);
  return [...withoutLabor, laborLine];
}

function extractQuantity(text: string, itemName: string): number {
  const patterns = [
    /(\d+)\s*(hours?|hrs?|hr)\b/i,
    /(\d+)\s*(units?|each|pieces?|outlets?|filters?|bundles?|ft|feet|foot)\b/i,
    /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|twenty|thirty|forty|fifty)\s*(ft|feet|foot)?\b/i,
    /\b(\d+)\b/,
  ];

  const wordToNum: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
  };

  const itemIndex = text.toLowerCase().indexOf(itemName.toLowerCase().slice(0, 8));
  const searchWindow = itemIndex >= 0 ? text.slice(Math.max(0, itemIndex - 30), itemIndex + 40) : text;

  for (const pattern of patterns) {
    const match = searchWindow.match(pattern);
    if (match) {
      const matchIndex = searchWindow.indexOf(match[0]);
      if (matchIndex >= 0 && isDurationContext(searchWindow, matchIndex)) {
        continue;
      }
      const raw = match[1].toLowerCase();
      const num = wordToNum[raw] ?? parseInt(raw, 10);
      if (!isNaN(num) && num > 0) return num;
    }
  }

  return 1;
}

function collectCatalogMatches(
  transcript: string,
): Array<{ item: CatalogItem; alias: string; confidence: number }> {
  const normalized = normalizeText(transcript);
  const hits: Array<{ item: CatalogItem; alias: string; confidence: number }> = [];

  for (const item of CatalogData) {
    for (const alias of item.aliases) {
      const normalizedAlias = normalizeText(alias);
      if (normalized.includes(normalizedAlias)) {
        const confidence = Math.min(
          0.98,
          0.72 + normalizedAlias.length / Math.max(normalized.length, 1),
        );
        hits.push({ item, alias, confidence });
      }
    }
  }

  return hits.sort(
    (a, b) => b.alias.length - a.alias.length || b.confidence - a.confidence,
  );
}

function matchCatalogItem(transcript: string): { item: CatalogItem; alias: string; confidence: number } | null {
  const hits = collectCatalogMatches(transcript);
  return hits[0] ?? null;
}

function findAllMatches(transcript: string): Array<{ item: CatalogItem; alias: string; confidence: number }> {
  const hits = collectCatalogMatches(transcript);
  const usedSkus = new Set<string>();
  const matches: Array<{ item: CatalogItem; alias: string; confidence: number }> = [];

  for (const hit of hits) {
    if (usedSkus.has(hit.item.sku)) continue;
    matches.push(hit);
    usedSkus.add(hit.item.sku);
  }

  return matches.sort((a, b) => b.confidence - a.confidence);
}

function detectGaps(transcript: string, matchedItems: InvoiceLineItem[]): TrustGap[] {
  const gaps: TrustGap[] = [];
  const normalized = normalizeText(transcript);

  const vaguePricePatterns = [
    /around\s+\$?\d+/i,
    /maybe\s+\$?\d+/i,
    /approximately\s+\$?\d+/i,
    /some\s+miscellaneous/i,
    /miscellaneous\s+fit/i,
    /not\s+sure\s+(about|of)\s+(the\s+)?price/i,
  ];

  for (const pattern of vaguePricePatterns) {
    const match = transcript.match(pattern);
    if (match) {
      gaps.push({
        type: 'missing_price',
        message: 'Vague or unverified pricing detected — requires manual confirmation.',
        rawFragment: match[0],
      });
    }
  }

  if (matchedItems.length === 0) {
    gaps.push({
      type: 'unmatched_item',
      message: 'No catalog SKU could be confidently matched from transcript.',
      rawFragment: transcript.slice(0, 80),
    });
  }

  const unmatchedKeywords = ['fitting', 'misc', 'supplies', 'parts', 'materials'];
  for (const keyword of unmatchedKeywords) {
    if (normalized.includes(keyword)) {
      const alreadyFlagged = gaps.some((g) => g.rawFragment.toLowerCase().includes(keyword));
      if (!alreadyFlagged) {
        gaps.push({
          type: 'ambiguous_item',
          message: `Ambiguous item "${keyword}" — not in verified catalog.`,
          rawFragment: keyword,
        });
      }
    }
  }

  // Unusual quantity for high-value, single-unit SKUs (e.g. 15 smart thermostats).
  for (const line of matchedItems) {
    if (line.itemType === 'labor' || isLaborSku(line.sku)) continue;
    if (
      line.unit === 'each' &&
      line.unitPrice >= HIGH_VALUE_USD &&
      line.quantity > MAX_TYPICAL_EACH_QTY
    ) {
      gaps.push({
        type: 'unusual_quantity',
        message: `Unusual quantity for ${line.name} (${line.quantity}) — confirm before sending.`,
        rawFragment: line.sku,
      });
    }
  }

  return gaps;
}

/**
 * Project Handshake — Trust Framework Engine
 *
 * Processes a voice transcript through a multi-phase trust pipeline:
 * 1. Intake & normalize
 * 2. Catalog SKU matching
 * 3. Pricing validation
 * 4. Trust scoring & gap detection
 */
export function runHandshakeEngine(
  transcript: string,
  source: InputSource = 'voice',
  billingOverride?: ScenarioBillingOverride,
): HandshakeResult {
  logCounter = 0;
  const logs: HandshakeLogEntry[] = [];

  logs.push(createLog('info', 'intake', `[INPUT] Source: ${SOURCE_LABEL[source]}`));
  logs.push(
    createLog(
      'info',
      'intake',
      `[INPUT] Raw note: "${transcript.slice(0, 80)}${transcript.length > 80 ? '…' : ''}"`,
    ),
  );
  logs.push(createLog('info', 'intake', `[INTAKE] Received ${SOURCE_LABEL[source].toLowerCase()} (${transcript.length} chars)`));
  logs.push(createLog('info', 'normalize', `[NORMALIZE] Tokenizing and normalizing speech patterns…`));

  const normalized = normalizeText(transcript);
  logs.push(createLog('success', 'normalize', `[NORMALIZE] Clean transcript: "${normalized.slice(0, 60)}${normalized.length > 60 ? '…' : ''}"`));

  logs.push(createLog('info', 'catalog', `[CATALOG] Querying Joist Parts Catalog (${CatalogData.length} SKUs)…`));

  const catalogMatches = findAllMatches(transcript);
  let lineItems: InvoiceLineItem[] = catalogMatches.map(({ item, alias, confidence }) => {
    const quantity = extractQuantity(transcript, alias);
    const lineTotal = Math.round(quantity * item.unitPrice * 100) / 100;
    return {
      sku: item.sku,
      name: item.name,
      quantity,
      unitPrice: item.unitPrice,
      unit: item.unit,
      lineTotal,
      confidence,
      matchedFrom: alias,
    };
  });

  if (catalogMatches.length === 0) {
    const singleMatch = matchCatalogItem(transcript);
    if (singleMatch) {
      const { item, alias, confidence } = singleMatch;
      const quantity = extractQuantity(transcript, alias);
      lineItems.push({
        sku: item.sku,
        name: item.name,
        quantity,
        unitPrice: item.unitPrice,
        unit: item.unit,
        lineTotal: Math.round(quantity * item.unitPrice * 100) / 100,
        confidence,
        matchedFrom: alias,
      });
    } else if (lineItems.length === 0) {
      logs.push(createLog('warn', 'catalog', `[CATALOG] No confident SKU match found`));
    }
  }

  lineItems = applyMaterialDefaults(transcript, lineItems);

  const durationMinutes = extractDurationMinutes(transcript);
  const inferredCrewSize = extractCrewSize(transcript);

  if (durationMinutes != null) {
    const crewSize = inferredCrewSize ?? 1;
    if (inferredCrewSize != null) {
      logs.push(
        createLog(
          'success',
          'normalize',
          `[NLP] Crew attribution: "me and a helper" → crewSize: ${crewSize}`,
        ),
      );
    }
    logs.push(
      createLog(
        'success',
        'normalize',
        `[NLP] Duration extract: ${durationMinutes} minutes → ${(durationMinutes / 60).toFixed(2)} hr`,
      ),
    );
    lineItems = upsertLaborLine(
      lineItems,
      durationMinutes,
      crewSize,
      inferredCrewSize != null ? 'crew plural attribution' : 'duration attribution',
    );
  }

  // Fold any demo billing override in BEFORE finalization so gaps, trust, status, and
  // every [MATCH]/[GAP]/[TRUST] log are derived from the same final line items the
  // smartphone preview renders.
  if (billingOverride) {
    lineItems = resolveScenarioLineItems(lineItems, billingOverride);
  }

  return finalizeHandshakeResult(transcript, lineItems, logs);
}

/**
 * Finalize a draft invoice into the canonical {@link HandshakeResult}. This is the single
 * source of truth: trust gaps, [MATCH]/[GAP]/[TRUST] logs, totals, and the unified trust
 * status are ALL derived from `rawLineItems` (the final line items), so the trust log in
 * Column 2 and the smartphone preview in Column 3 can never disagree.
 */
function finalizeHandshakeResult(
  transcript: string,
  rawLineItems: InvoiceLineItem[],
  logs: HandshakeLogEntry[],
): HandshakeResult {
  const gaps = detectGaps(transcript, rawLineItems);
  const flaggedSkus = new Set(
    gaps.filter((gap) => gap.type === 'unusual_quantity').map((gap) => gap.rawFragment),
  );

  const lineItems: InvoiceLineItem[] = rawLineItems.map((line) => {
    const withAutomation = attachAutomation(line);
    // A flagged line must read "Review Quantities" in the preview to match the amber banner.
    return flaggedSkus.has(line.sku)
      ? { ...withAutomation, automationStatus: 'medium' as AutomationStatus }
      : withAutomation;
  });

  for (const line of lineItems) {
    if (line.itemType === 'labor' || isLaborSku(line.sku)) {
      const minutes = line.durationMinutes ?? Math.round(line.quantity * 60);
      logs.push(
        createLog(
          'success',
          'catalog',
          `[MATCH] ${line.sku} ← labor attribution (duration: ${minutes}m, crew: ${line.crewSize ?? 1}, conf: ${(line.confidence * 100).toFixed(0)}%)`,
        ),
      );
    } else {
      logs.push(
        createLog(
          'success',
          'catalog',
          `[MATCH] ${line.sku} ← "${line.matchedFrom}" (qty: ${line.quantity}, conf: ${(line.confidence * 100).toFixed(0)}%)`,
        ),
      );
    }
  }

  logs.push(createLog('info', 'pricing', `[PRICING] Validating line-item pricing against catalog…`));

  for (const gap of gaps) {
    logs.push(createLog('warn', 'pricing', `[GAP] ${gap.type}: ${gap.message}`));
  }

  const subtotal = Math.round(lineItems.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100;
  const tax = computeTax(subtotal);
  const total = computeTotalWithTax(subtotal);

  logs.push(createLog('info', 'trust', `[TRUST] Computing handshake trust score…`));

  const avgConfidence =
    lineItems.length > 0 ? lineItems.reduce((s, i) => s + i.confidence, 0) / lineItems.length : 0;
  const gapPenalty = gaps.length * 0.15;
  const trustScore = Math.max(0, Math.min(1, avgConfidence - gapPenalty));

  // Unified status: amber if there are gaps OR no items OR any line still needs review.
  // This is the SAME signal the preview uses (computeInvoiceAggregateStatus), so the
  // [TRUST] log and the preview badge always agree.
  const aggregate = computeInvoiceAggregateStatus(lineItems);
  const needsReview = gaps.length > 0 || lineItems.length === 0 || aggregate !== 'ready';
  const status: TrustStatus = needsReview ? 'amber_alert' : 'verified';

  if (status === 'amber_alert') {
    logs.push(
      createLog(
        'warn',
        'trust',
        `[TRUST] Score: ${(trustScore * 100).toFixed(0)}% — AMBER ALERT: Manual review required`,
      ),
    );
    logs.push(
      createLog(
        'warn',
        'complete',
        gaps.length > 0
          ? `[COMPLETE] Invoice drafted with ${gaps.length} trust gap(s)`
          : `[COMPLETE] Invoice drafted — line items flagged for review`,
      ),
    );
  } else {
    logs.push(
      createLog('success', 'trust', `[TRUST] Score: ${(trustScore * 100).toFixed(0)}% — VERIFIED ✓`),
    );
    logs.push(createLog('success', 'complete', `[COMPLETE] Invoice ready for client delivery`));
  }

  return {
    status,
    transcript,
    lineItems,
    gaps,
    logs,
    subtotal,
    tax,
    total,
    trustScore,
  };
}

export function resetHandshakeLogs(): void {
  logCounter = 0;
}
