import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  FileText,
} from 'lucide-react';
import type { HandshakeResult, InvoiceLineItem } from '../engine/handshakeEngine';
import {
  computeInvoiceAggregateStatus,
  getUserVerifiedBannerConfig,
  getInvoiceBannerConfig,
  getInvoiceHeaderBadgeConfig,
  resolveAutomationStatus,
} from '../types/automationStatus';
import { PhoneChrome } from './phone/PhoneChrome';
import { InvoiceMediationScreen } from './phone/InvoiceMediationScreen';
import { InvoiceSuccessScreen } from './phone/InvoiceSuccessScreen';
import {
  applyHumanVerificationToLineItems,
  computeInvoiceTotals,
  formatLineItemCalculation,
  TAX_LABEL,
} from '../utils/invoiceTotals';
import { invoiceHasUserModifications } from '../utils/mediationBaseline';
import { LineItemAutomationPill } from './phone/mediation/LineItemAutomationPill';

type PhoneView = 'invoice' | 'mediation' | 'success';

interface SmartphonePreviewProps {
  result: HandshakeResult | null;
  workflowStage: 'idle' | 'listening' | 'drafting' | 'complete';
  onReset: () => void;
}

function InvoiceStatusBadge({
  aggregateStatus,
  isHandshakeVerified,
}: {
  aggregateStatus: ReturnType<typeof computeInvoiceAggregateStatus>;
  isHandshakeVerified: boolean;
}) {
  const config = getInvoiceHeaderBadgeConfig(aggregateStatus, isHandshakeVerified);

  const Icon = isHandshakeVerified && aggregateStatus === 'ready' ? CheckCircle2 : AlertTriangle;

  return (
    <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${config.className}`}>
      <Icon className={`h-3 w-3 ${config.iconClassName}`} />
      <span className={`text-[10px] font-semibold ${config.iconClassName}`}>{config.label}</span>
    </div>
  );
}

function AppHeader({
  aggregateStatus,
  isHandshakeVerified,
  showStatusBadge = true,
}: {
  aggregateStatus: ReturnType<typeof computeInvoiceAggregateStatus>;
  isHandshakeVerified: boolean;
  showStatusBadge?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
          <FileText className="h-3.5 w-3.5 text-white" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-900">Joist Invoice</p>
          <p className="text-[9px] text-gray-400">Autonomous Assistant</p>
        </div>
      </div>
      {showStatusBadge && (
        <InvoiceStatusBadge
          aggregateStatus={aggregateStatus}
          isHandshakeVerified={isHandshakeVerified}
        />
      )}
    </div>
  );
}

export function SmartphonePreview({ result, workflowStage, onReset }: SmartphonePreviewProps) {
  const [phoneView, setPhoneView] = useState<PhoneView>('invoice');
  const [mediationMode, setMediationMode] = useState<'review' | 'modify'>('review');
  const [resolvedResult, setResolvedResult] = useState<HandshakeResult | null>(null);
  const [sentMeta, setSentMeta] = useState({ total: 0, lineCount: 0, invoiceNumber: 'INV-000000' });

  const isLoading = !result && (workflowStage === 'listening' || workflowStage === 'drafting');

  useEffect(() => {
    if (result) {
      setPhoneView('invoice');
      setResolvedResult(null);
    }
  }, [result?.transcript, result?.status]);

  const displayResult = resolvedResult ?? result;
  const handshakeStatus = displayResult?.status ?? 'idle';
  const isHandshakeVerified = handshakeStatus === 'verified';
  const isHandshakeAmber = handshakeStatus === 'amber_alert' && !resolvedResult;

  const aggregateStatus = displayResult
    ? computeInvoiceAggregateStatus(displayResult.lineItems)
    : 'ready';

  const isInvoiceReady = isHandshakeVerified && aggregateStatus === 'ready';
  const isUserVerifiedDraft =
    isInvoiceReady &&
    invoiceHasUserModifications(
      displayResult?.lineItems ?? [],
      displayResult?.isHumanVerified,
    );
  const needsLineReview =
    aggregateStatus === 'critical_review' || aggregateStatus === 'warning_review';

  const reviewBanner = needsLineReview ? getInvoiceBannerConfig(aggregateStatus) : null;
  const readyBanner = isInvoiceReady
    ? isUserVerifiedDraft
      ? getUserVerifiedBannerConfig()
      : getInvoiceBannerConfig('ready')
    : null;

  const borderGlow = isInvoiceReady
    ? 'shadow-glow border-trust-verified/40'
    : aggregateStatus === 'critical_review'
      ? 'border-red-300/60 shadow-[0_0_24px_rgba(239,68,68,0.15)]'
      : needsLineReview || isHandshakeAmber
        ? 'shadow-glow-amber border-trust-amber/40'
        : phoneView === 'success'
          ? 'shadow-glow border-trust-verified/40'
          : 'border-surface-border';

  const draftTitle = isInvoiceReady
    ? isUserVerifiedDraft
      ? 'User Verified Draft'
      : 'Verified Draft'
    : 'Draft Under Review';

  const handleMediationConfirm = (lineItems: InvoiceLineItem[]) => {
    const base = displayResult ?? result;
    if (!base) return;
    const isReviewConfirm = mediationMode === 'review';
    const finalizedLineItems = isReviewConfirm
      ? applyHumanVerificationToLineItems(lineItems)
      : lineItems;
    const hasManualModifications = invoiceHasUserModifications(
      finalizedLineItems,
      isReviewConfirm,
    );
    const { subtotal, tax, total } = computeInvoiceTotals(finalizedLineItems);
    const verified: HandshakeResult = {
      ...base,
      status: 'verified',
      lineItems: finalizedLineItems,
      gaps: [],
      subtotal,
      tax,
      total,
      trustScore: 1,
      isHumanVerified: hasManualModifications,
    };
    setResolvedResult(verified);
    setPhoneView('invoice');
  };

  const openMediation = (mode: 'review' | 'modify') => {
    setMediationMode(mode);
    setPhoneView('mediation');
  };

  const handleSend = () => {
    if (!displayResult || !isInvoiceReady) return;
    setSentMeta({
      total: displayResult.total,
      lineCount: displayResult.lineItems.length,
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    });
    setPhoneView('success');
  };

  const handlePrimaryVerifiedAction = () => {
    if (isInvoiceReady) {
      handleSend();
      return;
    }
    openMediation(needsLineReview ? 'review' : 'modify');
  };

  return (
    <div className="flex h-full flex-col">
      <header className="mb-4">
        <div className="mb-1 flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-surface-muted" />
          <span className="text-xs font-semibold uppercase tracking-widest text-surface-muted">
            Column 3
          </span>
        </div>
        <h2 className="text-xl font-semibold tracking-tight">Smartphone Preview</h2>
        <p className="mt-1 text-sm text-surface-muted">
          Client-facing invoice — rendered from trust-validated data.
        </p>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center py-4">
        <PhoneChrome
          borderGlow={borderGlow}
          headerRight={
            phoneView === 'invoice' && displayResult ? (
              <AppHeader
                aggregateStatus={aggregateStatus}
                isHandshakeVerified={isHandshakeVerified}
              />
            ) : phoneView === 'mediation' ? undefined : phoneView === 'success' ? undefined : (
              <AppHeader
                aggregateStatus="ready"
                isHandshakeVerified={false}
                showStatusBadge={false}
              />
            )
          }
        >
          {isLoading && (
            <div className="flex flex-col items-center justify-center bg-gray-50 px-4 py-16">
              <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
              <p className="text-xs font-medium text-gray-600">
                {workflowStage === 'listening' ? 'Listening…' : 'Drafting Invoice…'}
              </p>
            </div>
          )}

          {!result && !isLoading && phoneView === 'invoice' && (
            <div className="flex flex-col items-center justify-center bg-gray-50 px-4 py-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-200">
                <MicPlaceholder />
              </div>
              <p className="text-xs font-medium text-gray-500">Awaiting voice input</p>
              <p className="mt-1 text-[10px] text-gray-400">Invoice will draft automatically</p>
            </div>
          )}

          {phoneView === 'mediation' && displayResult && (
            <InvoiceMediationScreen
              result={displayResult}
              mode={mediationMode}
              onConfirm={handleMediationConfirm}
              onBack={() => setPhoneView('invoice')}
            />
          )}

          {phoneView === 'success' && (
            <InvoiceSuccessScreen
              total={sentMeta.total}
              invoiceNumber={sentMeta.invoiceNumber}
              clientName="Sarah M. — Kitchen Remodel"
              lineCount={sentMeta.lineCount}
              onDone={() => {
                setPhoneView('invoice');
                setResolvedResult(null);
                onReset();
              }}
            />
          )}

          {phoneView === 'invoice' && displayResult && (
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4">
              {isHandshakeAmber && (
                <div className="mb-3 rounded-xl border border-trust-amber/40 bg-amber-50 p-2.5">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-[10px] font-semibold text-amber-800">
                        Amber Alert — Manual Review
                      </p>
                      <p className="mt-0.5 text-[9px] text-amber-700">
                        {displayResult.gaps[0]?.message ?? 'Trust gaps detected in voice input.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {reviewBanner && isHandshakeVerified && (
                <div className={`mb-3 rounded-xl border p-2.5 ${reviewBanner.className}`}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-3.5 w-3.5 ${reviewBanner.iconClassName}`} />
                    <p className={`text-[10px] font-semibold ${reviewBanner.iconClassName}`}>
                      {reviewBanner.title}
                    </p>
                  </div>
                </div>
              )}

              {readyBanner && (
                <div className={`mb-3 rounded-xl border p-2.5 ${readyBanner.className}`}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`h-3.5 w-3.5 ${readyBanner.iconClassName}`} />
                    <p className={`text-[10px] font-semibold ${readyBanner.iconClassName}`}>
                      {readyBanner.title}
                    </p>
                  </div>
                </div>
              )}

              <p className="mb-1 text-[10px] font-medium text-gray-400">INVOICE #JOIST-2026</p>
              <p className="mb-3 text-sm font-bold text-gray-900">{draftTitle}</p>

              <div className="max-h-[140px] space-y-2 overflow-y-auto">
                {displayResult.lineItems.length > 0 ? (
                  displayResult.lineItems.map((item) => (
                    <div key={item.sku} className="rounded-lg bg-white p-2.5 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[10px] font-semibold text-gray-800">
                            {item.name}
                          </p>
                          <p className="text-[9px] text-gray-400">{item.sku}</p>
                          <LineItemAutomationPill status={resolveAutomationStatus(item)} />
                        </div>
                        <p className="shrink-0 text-[10px] font-bold text-gray-900">
                          ${item.lineTotal.toFixed(2)}
                        </p>
                      </div>
                      <p className="mt-1 text-[9px] text-gray-400">
                        {formatLineItemCalculation(item)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg bg-white p-3 text-center shadow-sm">
                    <p className="text-[10px] text-gray-400">No catalog matches found</p>
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-white p-3 shadow-sm">
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>Subtotal</span>
                  <span>${displayResult.subtotal.toFixed(2)}</span>
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-gray-500">
                  <span>{TAX_LABEL}</span>
                  <span>${displayResult.tax.toFixed(2)}</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-gray-100 pt-2">
                  <span className="text-xs font-bold text-gray-900">Total</span>
                  <span
                    className={`text-xs font-bold ${
                      isInvoiceReady
                        ? 'text-green-600'
                        : aggregateStatus === 'critical_review'
                          ? 'text-red-600'
                          : needsLineReview || isHandshakeAmber
                            ? 'text-amber-600'
                            : 'text-gray-900'
                    }`}
                  >
                    ${displayResult.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {isHandshakeVerified ? (
                <div className="mt-3 space-y-2">
                  <button
                    type="button"
                    onClick={handlePrimaryVerifiedAction}
                    className={`w-full rounded-xl py-2.5 text-xs font-semibold text-white transition active:scale-[0.98] ${
                      isInvoiceReady
                        ? 'bg-green-500 hover:bg-green-600'
                        : aggregateStatus === 'critical_review'
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-amber-500 hover:bg-amber-600'
                    }`}
                  >
                    {isInvoiceReady ? 'Send to Client' : 'Verify & Send'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openMediation('modify')}
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
                  >
                    Modify line items
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={isHandshakeAmber ? () => openMediation('review') : handleSend}
                  className={`mt-3 w-full rounded-xl py-2.5 text-xs font-semibold text-white transition active:scale-[0.98] ${
                    isHandshakeAmber ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600'
                  }`}
                >
                  {isHandshakeAmber ? 'Review & Correct' : 'Preview'}
                </button>
              )}
            </div>
          )}
        </PhoneChrome>
      </div>
    </div>
  );
}

function MicPlaceholder() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6 text-gray-400"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}
