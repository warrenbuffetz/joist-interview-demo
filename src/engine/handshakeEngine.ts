import { CatalogData, type CatalogItem } from '../data/catalogData';

export type TrustStatus = 'idle' | 'processing' | 'verified' | 'amber_alert';

export interface InvoiceLineItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  lineTotal: number;
  confidence: number;
  matchedFrom: string;
}

export interface TrustGap {
  type: 'missing_price' | 'ambiguous_item' | 'unmatched_item';
  message: string;
  rawFragment: string;
}

export interface HandshakeLogEntry {
  id: string;
  timestamp: Date;
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
}

let logCounter = 0;

function createLog(
  level: HandshakeLogEntry['level'],
  phase: HandshakeLogEntry['phase'],
  message: string,
): HandshakeLogEntry {
  return {
    id: `log-${Date.now()}-${++logCounter}`,
    timestamp: new Date(),
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

function extractQuantity(text: string, itemName: string): number {
  const patterns = [
    /(\d+)\s*(hours?|hrs?|hr)\b/i,
    /(\d+)\s*(units?|each|pieces?|outlets?|filters?|bundles?|ft|feet)\b/i,
    /\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/i,
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
  };

  const itemIndex = text.toLowerCase().indexOf(itemName.toLowerCase().slice(0, 8));
  const searchWindow = itemIndex >= 0 ? text.slice(Math.max(0, itemIndex - 30), itemIndex + 40) : text;

  for (const pattern of patterns) {
    const match = searchWindow.match(pattern);
    if (match) {
      const raw = match[1].toLowerCase();
      const num = wordToNum[raw] ?? parseInt(raw, 10);
      if (!isNaN(num) && num > 0) return num;
    }
  }

  return 1;
}

function matchCatalogItem(transcript: string): { item: CatalogItem; alias: string; confidence: number } | null {
  const normalized = normalizeText(transcript);
  let bestMatch: { item: CatalogItem; alias: string; confidence: number } | null = null;

  for (const item of CatalogData) {
    for (const alias of item.aliases) {
      const normalizedAlias = normalizeText(alias);
      if (normalized.includes(normalizedAlias)) {
        const confidence = Math.min(0.98, 0.7 + normalizedAlias.length / normalized.length);
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { item, alias, confidence };
        }
      }
    }
  }

  return bestMatch;
}

function findAllMatches(transcript: string): Array<{ item: CatalogItem; alias: string; confidence: number }> {
  const normalized = normalizeText(transcript);
  const matches: Array<{ item: CatalogItem; alias: string; confidence: number }> = [];
  const usedSkus = new Set<string>();

  for (const item of CatalogData) {
    for (const alias of item.aliases) {
      const normalizedAlias = normalizeText(alias);
      if (normalized.includes(normalizedAlias) && !usedSkus.has(item.sku)) {
        const confidence = Math.min(0.98, 0.72 + normalizedAlias.length / Math.max(normalized.length, 1));
        matches.push({ item, alias, confidence });
        usedSkus.add(item.sku);
        break;
      }
    }
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
export function runHandshakeEngine(transcript: string): HandshakeResult {
  logCounter = 0;
  const logs: HandshakeLogEntry[] = [];

  logs.push(createLog('info', 'intake', `[INTAKE] Received voice transcript (${transcript.length} chars)`));
  logs.push(createLog('info', 'normalize', `[NORMALIZE] Tokenizing and normalizing speech patterns…`));

  const normalized = normalizeText(transcript);
  logs.push(createLog('success', 'normalize', `[NORMALIZE] Clean transcript: "${normalized.slice(0, 60)}${normalized.length > 60 ? '…' : ''}"`));

  logs.push(createLog('info', 'catalog', `[CATALOG] Querying Joist Parts Catalog (${CatalogData.length} SKUs)…`));

  const catalogMatches = findAllMatches(transcript);
  const lineItems: InvoiceLineItem[] = catalogMatches.map(({ item, alias, confidence }) => {
    const quantity = extractQuantity(transcript, alias);
    const lineTotal = Math.round(quantity * item.unitPrice * 100) / 100;
    logs.push(
      createLog(
        'success',
        'catalog',
        `[MATCH] ${item.sku} ← "${alias}" (qty: ${quantity}, conf: ${(confidence * 100).toFixed(0)}%)`,
      ),
    );
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
    } else {
      logs.push(createLog('warn', 'catalog', `[CATALOG] No confident SKU match found`));
    }
  }

  logs.push(createLog('info', 'pricing', `[PRICING] Validating line-item pricing against catalog…`));

  const gaps = detectGaps(transcript, lineItems);

  for (const gap of gaps) {
    logs.push(createLog('warn', 'pricing', `[GAP] ${gap.type}: ${gap.message}`));
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const tax = Math.round(subtotal * 0.0825 * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  logs.push(createLog('info', 'trust', `[TRUST] Computing handshake trust score…`));

  const avgConfidence =
    lineItems.length > 0 ? lineItems.reduce((s, i) => s + i.confidence, 0) / lineItems.length : 0;
  const gapPenalty = gaps.length * 0.15;
  const trustScore = Math.max(0, Math.min(1, avgConfidence - gapPenalty));

  let status: TrustStatus;

  if (gaps.length > 0 || lineItems.length === 0) {
    status = 'amber_alert';
    logs.push(
      createLog(
        'warn',
        'trust',
        `[TRUST] Score: ${(trustScore * 100).toFixed(0)}% — AMBER ALERT: Manual review required`,
      ),
    );
    logs.push(createLog('warn', 'complete', `[COMPLETE] Invoice drafted with ${gaps.length} trust gap(s)`));
  } else {
    status = 'verified';
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
