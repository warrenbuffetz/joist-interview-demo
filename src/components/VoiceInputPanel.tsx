import { Mic, MicOff, RotateCcw, Sparkles, AlertCircle } from 'lucide-react';
import type { TranscriptionStatus } from '../hooks/useSpeechToText';
import { PresenterScripts } from './PresenterScripts';

const STATUS_LABELS: Record<TranscriptionStatus, string> = {
  idle: 'Ready to capture',
  listening: 'Listening…',
  transcribing: 'Transcribing…',
  mapping: 'Mapping to Catalog…',
  error: 'Error',
  unsupported: 'Browser not supported',
};

const STATUS_COLORS: Record<TranscriptionStatus, string> = {
  idle: 'text-surface-muted',
  listening: 'text-indigo-400',
  transcribing: 'text-amber-300',
  mapping: 'text-trust-verified',
  error: 'text-trust-error',
  unsupported: 'text-trust-error',
};

interface VoiceInputPanelProps {
  status: TranscriptionStatus;
  interimTranscript: string;
  finalTranscript: string;
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onDemoVerified: () => void;
  onDemoAmber: () => void;
  onSimulateStt: (transcript: string) => void;
  onApplyCorrection: (transcript: string) => void;
}

export function VoiceInputPanel({
  status,
  interimTranscript,
  finalTranscript,
  isListening,
  isSupported,
  error,
  onStart,
  onStop,
  onReset,
  onDemoVerified,
  onDemoAmber,
  onSimulateStt,
  onApplyCorrection,
}: VoiceInputPanelProps) {
  const displayText = interimTranscript || finalTranscript;
  const isActive = isListening || status === 'transcribing' || status === 'mapping';

  return (
    <div className="flex h-full flex-col">
      <header className="mb-6">
        <div className="mb-1 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
            Column 1
          </span>
        </div>
        <h2 className="text-xl font-semibold tracking-tight">Voice Input Interface</h2>
        <p className="mt-1 text-sm text-surface-muted">
          Speak naturally — Joist maps your words to verified catalog SKUs.
        </p>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="relative mb-8">
          {isListening && (
            <>
              <span className="absolute inset-0 animate-ping rounded-full border-2 border-indigo-500/30" />
              <span className="absolute inset-0 animate-pulse rounded-full border-2 border-indigo-500/20" />
            </>
          )}

          <button
            type="button"
            disabled={!isSupported}
            onClick={isListening ? onStop : onStart}
            className={`relative z-10 flex h-36 w-36 items-center justify-center rounded-full transition-all duration-300 ${
              isListening
                ? 'scale-105 bg-gradient-to-br from-indigo-500 to-violet-600 shadow-glow-voice'
                : 'bg-gradient-to-br from-surface-raised to-surface-border hover:from-indigo-600 hover:to-violet-700 hover:shadow-glow-voice'
            } ${!isSupported ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            aria-label={isListening ? 'Stop voice capture' : 'Start voice capture'}
          >
            {isListening ? (
              <MicOff className="h-12 w-12 text-white" />
            ) : (
              <Mic className="h-12 w-12 text-white" />
            )}
          </button>
        </div>

        <div className="mb-4 flex items-center gap-2">
          {isActive && (
            <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
          )}
          <span className={`text-sm font-medium ${STATUS_COLORS[status]}`}>
            {STATUS_LABELS[status]}
          </span>
        </div>

        <p className="mb-6 text-center text-xs text-surface-muted">
          {isListening ? 'Tap again to stop · Speak clearly' : 'Tap to begin voice capture'}
        </p>

        <div className="w-full rounded-2xl border border-surface-border bg-surface-raised/60 p-4 backdrop-blur-sm">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-surface-muted">
            Live Transcript
          </p>
          <div className="min-h-[72px]">
            {displayText ? (
              <p className="text-sm leading-relaxed text-white/90">
                {displayText}
                {interimTranscript && <span className="terminal-cursor" />}
              </p>
            ) : (
              <p className="text-sm italic text-surface-muted/60">
                Transcription will appear here in real time…
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-trust-error/30 bg-trust-error/10 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-trust-error" />
          <p className="text-xs text-trust-error">{error}</p>
        </div>
      )}

      <footer className="mt-auto space-y-3 border-t border-surface-border pt-4">
        <p className="text-xs text-surface-muted">Quick shortcuts</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onDemoVerified}
            className="flex-1 rounded-xl border border-trust-verified/30 bg-trust-verified/10 px-3 py-2 text-xs font-medium text-trust-verified transition hover:bg-trust-verified/20"
          >
            ✓ Verified scenario
          </button>
          <button
            type="button"
            onClick={onDemoAmber}
            className="flex-1 rounded-xl border border-trust-amber/30 bg-trust-amber/10 px-3 py-2 text-xs font-medium text-trust-amber transition hover:bg-trust-amber/20"
          >
            ⚠ Amber scenario
          </button>
        </div>

        <PresenterScripts
          onSimulateStt={onSimulateStt}
          onApplyCorrection={onApplyCorrection}
          isListening={isListening}
        />

        <button
          type="button"
          onClick={onReset}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-surface-border px-3 py-2 text-xs text-surface-muted transition hover:border-white/20 hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset sandbox
        </button>
      </footer>
    </div>
  );
}
