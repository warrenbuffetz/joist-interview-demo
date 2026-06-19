export type AutomationStatus = 'high' | 'medium' | 'low' | 'user_verified';

export interface AutomationStatusSource {
  automationStatus?: AutomationStatus;
  confidenceScore?: number;
  /** Legacy engine field — 0 to 1 */
  confidence?: number;
}

export function automationStatusFromScore(score: number): AutomationStatus {
  if (score > 90) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}

export function resolveAutomationStatus(source: AutomationStatusSource): AutomationStatus {
  if (source.automationStatus) return source.automationStatus;
  const score =
    source.confidenceScore ??
    (source.confidence != null ? Math.round(source.confidence * 100) : 100);
  return automationStatusFromScore(score);
}

export function needsUserReview(status: AutomationStatus): boolean {
  return status === 'medium' || status === 'low';
}

/** Aggregate invoice readiness derived from child line-item automation states. */
export type InvoiceAggregateStatus = 'critical_review' | 'warning_review' | 'ready';

export function computeInvoiceAggregateStatus(
  lineItems: Array<AutomationStatusSource>,
): InvoiceAggregateStatus {
  if (lineItems.length === 0) return 'critical_review';

  const statuses = lineItems.map(resolveAutomationStatus);
  if (statuses.some((status) => status === 'low')) return 'critical_review';
  if (statuses.some((status) => status === 'medium')) return 'warning_review';
  return 'ready';
}

export interface InvoiceBannerConfig {
  className: string;
  iconClassName: string;
  title: string;
}

export function getInvoiceBannerConfig(
  aggregateStatus: InvoiceAggregateStatus,
): InvoiceBannerConfig | null {
  switch (aggregateStatus) {
    case 'ready':
      return {
        className: 'border-green-200 bg-green-50',
        iconClassName: 'text-green-600',
        title: 'Catalog Verified — Ready to Send',
      };
    case 'warning_review':
      return {
        className: 'border-amber-200 bg-amber-50',
        iconClassName: 'text-amber-600',
        title: 'Review Quantities Before Sending',
      };
    case 'critical_review':
      return {
        className: 'border-red-200 bg-red-50',
        iconClassName: 'text-red-600',
        title: 'Discrepancies Detected — Verification Needed',
      };
  }
}

export function getUserVerifiedBannerConfig(): InvoiceBannerConfig {
  return {
    className: 'border-green-200 bg-green-50',
    iconClassName: 'text-green-600',
    title: 'User Verified — Ready to Send',
  };
}

/** @deprecated Use getUserVerifiedBannerConfig */
export const getHumanVerifiedBannerConfig = getUserVerifiedBannerConfig;

export interface InvoiceHeaderBadgeConfig {
  label: string;
  className: string;
  iconClassName: string;
}

export function getInvoiceHeaderBadgeConfig(
  aggregateStatus: InvoiceAggregateStatus,
  isHandshakeVerified: boolean,
): InvoiceHeaderBadgeConfig {
  if (isHandshakeVerified && aggregateStatus === 'ready') {
    return {
      label: 'VERIFIED',
      className: 'bg-trust-verified/20',
      iconClassName: 'text-trust-verified',
    };
  }

  if (aggregateStatus === 'critical_review') {
    return {
      label: 'REVIEW REQUIRED',
      className: 'bg-red-100',
      iconClassName: 'text-red-700',
    };
  }

  return {
    label: 'REVIEW REQUIRED',
    className: 'bg-trust-amber/20',
    iconClassName: 'text-trust-amber',
  };
}

export interface AutomationPillConfig {
  label: string;
  className: string;
}

export function getAutomationPillConfig(status: AutomationStatus): AutomationPillConfig | null {
  switch (status) {
    case 'high':
      return {
        label: 'Auto-filled',
        className:
          'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400',
      };
    case 'medium':
      return {
        label: 'Review Quantities',
        className:
          'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
      };
    case 'low':
      return {
        label: 'Needs Verification',
        className: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
      };
    case 'user_verified':
      return null;
  }
}
