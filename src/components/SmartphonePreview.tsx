import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  FileText,
  Wifi,
  Battery,
  Signal,
} from 'lucide-react';
import type { HandshakeResult, TrustStatus } from '../engine/handshakeEngine';

interface SmartphonePreviewProps {
  result: HandshakeResult | null;
  workflowStage: 'idle' | 'listening' | 'drafting' | 'complete';
}

function StatusBadge({ status }: { status: TrustStatus }) {
  if (status === 'verified') {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-1 rounded-full bg-trust-verified/20 px-2 py-0.5"
      >
        <CheckCircle2 className="h-3 w-3 text-trust-verified" />
        <span className="text-[10px] font-semibold text-trust-verified">VERIFIED</span>
      </motion.div>
    );
  }

  if (status === 'amber_alert') {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-1 rounded-full bg-trust-amber/20 px-2 py-0.5"
      >
        <AlertTriangle className="h-3 w-3 text-trust-amber" />
        <span className="text-[10px] font-semibold text-trust-amber">REVIEW</span>
      </motion.div>
    );
  }

  return null;
}

export function SmartphonePreview({ result, workflowStage }: SmartphonePreviewProps) {
  const status = result?.status ?? 'idle';
  const isVerified = status === 'verified';
  const isAmber = status === 'amber_alert';

  const borderGlow = isVerified
    ? 'shadow-glow border-trust-verified/40'
    : isAmber
      ? 'shadow-glow-amber border-trust-amber/40'
      : 'border-surface-border';

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

      <div className="flex flex-1 items-center justify-center">
        {/* Phone frame */}
        <motion.div
          className={`relative w-[280px] rounded-[2.5rem] border-[3px] bg-[#0a0a0c] p-3 transition-shadow duration-500 ${borderGlow}`}
          animate={
            workflowStage === 'listening'
              ? { scale: [1, 1.01, 1] }
              : workflowStage === 'drafting'
                ? { scale: [1, 1.02, 1] }
                : { scale: 1 }
          }
          transition={
            workflowStage === 'listening' || workflowStage === 'drafting'
              ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.3 }
          }
        >
          {/* Notch */}
          <div className="absolute left-1/2 top-3 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />

          {/* Screen */}
          <div className="overflow-hidden rounded-[2rem] bg-white">
            {/* Status bar */}
            <div className="flex items-center justify-between bg-gray-50 px-5 pb-1 pt-8 text-[10px] text-gray-600">
              <span className="font-medium">9:41</span>
              <div className="flex items-center gap-1">
                <Signal className="h-3 w-3" />
                <Wifi className="h-3 w-3" />
                <Battery className="h-3 w-3" />
              </div>
            </div>

            {/* App header */}
            <div className="border-b border-gray-100 bg-white px-4 py-3">
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
                {result && <StatusBadge status={result.status} />}
              </div>
            </div>

            {/* Invoice body */}
            <div className="min-h-[380px] bg-gray-50 p-4">
              <AnimatePresence mode="wait">
                {workflowStage === 'idle' && !result && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex h-full flex-col items-center justify-center py-16 text-center"
                  >
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-200">
                      <MicPlaceholder />
                    </div>
                    <p className="text-xs font-medium text-gray-500">Awaiting voice input</p>
                    <p className="mt-1 text-[10px] text-gray-400">
                      Invoice will draft automatically
                    </p>
                  </motion.div>
                )}

                {(workflowStage === 'listening' || workflowStage === 'drafting') && !result && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex h-full flex-col items-center justify-center py-16"
                  >
                    <motion.div
                      className="mb-4 h-10 w-10 rounded-full border-2 border-indigo-200 border-t-indigo-600"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <p className="text-xs font-medium text-gray-600">
                      {workflowStage === 'listening' ? 'Listening…' : 'Drafting Invoice…'}
                    </p>
                  </motion.div>
                )}

                {result && (
                  <motion.div
                    key="invoice"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  >
                    {/* Amber alert banner */}
                    {isAmber && (
                      <div className="mb-3 overflow-hidden rounded-xl border border-trust-amber/40 bg-amber-50 p-2.5">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                          <div>
                            <p className="text-[10px] font-semibold text-amber-800">
                              Amber Alert — Manual Review
                            </p>
                            <p className="mt-0.5 text-[9px] text-amber-700">
                              {result.gaps[0]?.message ?? 'Trust gaps detected in voice input.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Verified banner */}
                    {isVerified && (
                      <div className="mb-3 overflow-hidden rounded-xl border border-green-200 bg-green-50 p-2.5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          <p className="text-[10px] font-semibold text-green-800">
                            Catalog Verified — Ready to Send
                          </p>
                        </div>
                      </div>
                    )}

                    <p className="mb-1 text-[10px] font-medium text-gray-400">INVOICE #JOIST-2026</p>
                    <p className="mb-3 text-sm font-bold text-gray-900">
                      {isVerified ? 'Verified Draft' : isAmber ? 'Draft — Needs Review' : 'Draft'}
                    </p>

                    {/* Line items */}
                    <div className="mb-3 space-y-2">
                      {result.lineItems.length > 0 ? (
                        result.lineItems.map((item, i) => (
                          <motion.div
                            key={item.sku}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="rounded-lg bg-white p-2.5 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-[10px] font-semibold text-gray-800">
                                  {item.name}
                                </p>
                                <p className="text-[9px] text-gray-400">{item.sku}</p>
                              </div>
                              <p className="shrink-0 text-[10px] font-bold text-gray-900">
                                ${item.lineTotal.toFixed(2)}
                              </p>
                            </div>
                            <p className="mt-1 text-[9px] text-gray-400">
                              {item.quantity} {item.unit} × ${item.unitPrice.toFixed(2)}
                            </p>
                          </motion.div>
                        ))
                      ) : (
                        <div className="rounded-lg bg-white p-3 text-center shadow-sm">
                          <p className="text-[10px] text-gray-400">No catalog matches found</p>
                        </div>
                      )}
                    </div>

                    {/* Totals */}
                    <div className="rounded-xl bg-white p-3 shadow-sm">
                      <div className="flex justify-between text-[10px] text-gray-500">
                        <span>Subtotal</span>
                        <span>${result.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="mt-1 flex justify-between text-[10px] text-gray-500">
                        <span>Tax (8.25%)</span>
                        <span>${result.tax.toFixed(2)}</span>
                      </div>
                      <div className="mt-2 flex justify-between border-t border-gray-100 pt-2">
                        <span className="text-xs font-bold text-gray-900">Total</span>
                        <span
                          className={`text-xs font-bold ${isVerified ? 'text-green-600' : isAmber ? 'text-amber-600' : 'text-gray-900'}`}
                        >
                          ${result.total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Trust score */}
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm">
                      <span className="text-[9px] text-gray-400">Trust Score</span>
                      <span
                        className={`text-[10px] font-bold ${isVerified ? 'text-green-600' : isAmber ? 'text-amber-600' : 'text-gray-600'}`}
                      >
                        {(result.trustScore * 100).toFixed(0)}%
                      </span>
                    </div>

                    {/* CTA */}
                    <motion.button
                      type="button"
                      className={`mt-3 w-full rounded-xl py-2.5 text-xs font-semibold text-white ${
                        isVerified
                          ? 'bg-green-500'
                          : isAmber
                            ? 'bg-amber-500'
                            : 'bg-indigo-600'
                      }`}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isVerified ? 'Send to Client' : isAmber ? 'Review & Correct' : 'Preview'}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Home indicator */}
            <div className="flex justify-center bg-gray-50 py-2">
              <div className="h-1 w-24 rounded-full bg-gray-300" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function MicPlaceholder() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-gray-400" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}
