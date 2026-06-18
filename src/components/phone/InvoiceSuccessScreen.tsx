import { CheckCircle2, Clock, Mail, MessageSquare, ArrowRight } from 'lucide-react';

interface InvoiceSuccessScreenProps {
  total: number;
  invoiceNumber: string;
  clientName: string;
  lineCount: number;
  onDone: () => void;
}

export function InvoiceSuccessScreen({
  total,
  invoiceNumber,
  clientName,
  lineCount,
  onDone,
}: InvoiceSuccessScreenProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-white">
      {/* Distinct status header — separated from content card */}
      <div className="relative mb-6 shrink-0 overflow-hidden bg-gradient-to-b from-emerald-500 to-emerald-600 px-5 pb-8 pt-8 text-white">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
        <div className="absolute -left-4 top-12 h-16 w-16 rounded-full bg-white/5" />

        <div className="relative flex flex-col items-center text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg shadow-emerald-900/20">
            <CheckCircle2 className="h-9 w-9 text-emerald-500" strokeWidth={2.5} />
          </div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-emerald-100">
            Invoice delivered
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight">${total.toFixed(2)}</p>
          <p className="mt-2 text-[11px] leading-relaxed text-emerald-100">
            sent to {clientName}
          </p>
        </div>
      </div>

      {/* Content body — consistent top padding & vertical rhythm */}
      <div className="flex min-w-0 flex-1 flex-col space-y-5 px-4 pb-6 pt-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 pt-6 shadow-lg shadow-gray-200/60">
          <div className="mb-5 flex items-center justify-between gap-2">
            <p className="min-w-0 truncate text-[10px] font-semibold text-gray-900">{invoiceNumber}</p>
            <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-semibold text-emerald-700">
              Awaiting payment
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-medium text-gray-900">Invoice sent</p>
                <p className="mt-1 text-[9px] text-gray-400">Just now · {lineCount} line items</p>
              </div>
            </div>

            <div className="ml-3.5 border-l-2 border-dashed border-gray-200 pl-6">
              <div className="flex items-center gap-3 py-1">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100">
                  <Mail className="h-3 w-3 text-gray-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-600">Email + SMS payment link</p>
                  <p className="mt-1 break-words text-[9px] text-gray-400">
                    sarah.m@email.com · (555) 0142
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 opacity-60">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100">
                <Clock className="h-3 w-3 text-gray-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Payment expected</p>
                <p className="mt-1 text-[9px] text-gray-400">Net 15 · typical 3–5 days</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 p-4">
          <div className="flex items-start gap-2.5">
            <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-gray-800">
                You're all set — back to the job
              </p>
              <p className="mt-1.5 break-words text-[9px] leading-relaxed text-gray-500">
                We'll notify you the moment your client opens the invoice or submits payment.
                Funds deposit to your Joist wallet.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onDone}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gray-900 py-3 text-xs font-semibold text-white transition hover:bg-gray-800"
        >
          Done
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
