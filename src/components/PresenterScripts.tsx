import { useState } from 'react';
import { BookOpen, Mic, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { PRESENTER_SCRIPTS, type PresenterScript } from '../data/presenterScripts';

interface PresenterScriptsProps {
  onSimulateStt: (transcript: string) => void;
  onApplyCorrection: (transcript: string) => void;
  isListening: boolean;
}

function OutcomeBadge({ script }: { script: PresenterScript }) {
  if (script.outcome === 'verified') {
    return (
      <span className="rounded-full border border-trust-verified/30 bg-trust-verified/10 px-2 py-0.5 text-[10px] font-medium text-trust-verified">
        ✓ Verified path
      </span>
    );
  }
  return (
    <span className="rounded-full border border-trust-amber/30 bg-trust-amber/10 px-2 py-0.5 text-[10px] font-medium text-trust-amber">
      ⚠ HITL path
    </span>
  );
}

export function PresenterScripts({
  onSimulateStt,
  onApplyCorrection,
  isListening,
}: PresenterScriptsProps) {
  const [expandedId, setExpandedId] = useState<string>(PRESENTER_SCRIPTS[0].id);

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? '' : id));
  };

  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center gap-2">
        <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
          Presenter Scripts
        </p>
      </div>
      <p className="text-[11px] leading-relaxed text-surface-muted">
        Tap the mic and read aloud — or simulate what STT heard, then apply the human correction.
      </p>

      <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
        {PRESENTER_SCRIPTS.map((script) => {
          const isOpen = expandedId === script.id;
          return (
            <div
              key={script.id}
              className="overflow-hidden rounded-xl border border-surface-border bg-surface-raised/40"
            >
              <button
                type="button"
                onClick={() => toggle(script.id)}
                className="flex w-full items-start justify-between gap-2 p-3 text-left transition hover:bg-surface-raised/60"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold text-white/90">{script.title}</span>
                    <span className="rounded bg-surface-border px-1.5 py-0.5 text-[9px] text-surface-muted">
                      {script.tag}
                    </span>
                  </div>
                  <OutcomeBadge script={script} />
                </div>
                {isOpen ? (
                  <ChevronUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-surface-muted" />
                ) : (
                  <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-surface-muted" />
                )}
              </button>

              {isOpen && (
                <div className="space-y-3 border-t border-surface-border px-3 pb-3 pt-2">
                  <div>
                    <p className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-surface-muted">
                      <Mic className="h-3 w-3" />
                      Read aloud {isListening ? '(listening…)' : '(tap mic above first)'}
                    </p>
                    <p className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-2.5 text-xs leading-relaxed text-white/90">
                      "{script.readAloud}"
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-surface-muted">
                      Delivery notes
                    </p>
                    <p className="text-[11px] leading-relaxed text-surface-muted">
                      {script.deliveryNotes}
                    </p>
                  </div>

                  <div className="rounded-lg border border-surface-border bg-[#0d0e10]/60 p-2.5">
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-surface-muted">
                      Say to the panel
                    </p>
                    <p className="text-[11px] italic leading-relaxed text-white/70">
                      {script.presenterCue}
                    </p>
                  </div>

                  {script.outcome === 'hitl' && (
                    <div>
                      <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-trust-amber">
                        What STT likely heard
                      </p>
                      <p className="rounded-lg border border-trust-amber/20 bg-trust-amber/5 p-2 text-[11px] leading-relaxed text-trust-amber/90">
                        "{script.simulateStt}"
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    {script.outcome === 'hitl' && (
                      <button
                        type="button"
                        onClick={() => onSimulateStt(script.simulateStt)}
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-trust-amber/30 bg-trust-amber/10 px-3 py-2 text-[11px] font-medium text-trust-amber transition hover:bg-trust-amber/20"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        Step 1 — Simulate what STT heard
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        onApplyCorrection(
                          script.outcome === 'verified'
                            ? script.hitlCorrected
                            : script.hitlCorrected,
                        )
                      }
                      className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-medium transition ${
                        script.outcome === 'verified'
                          ? 'border border-trust-verified/30 bg-trust-verified/10 text-trust-verified hover:bg-trust-verified/20'
                          : 'border border-trust-verified/30 bg-trust-verified/10 text-trust-verified hover:bg-trust-verified/20'
                      }`}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {script.outcome === 'hitl'
                        ? 'Step 2 — Apply human correction'
                        : 'Run verified scenario'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
