import { useState } from 'react';
import { AlertCircle, FileText, Send } from 'lucide-react';

interface TextNotePanelProps {
  onProcessTextNote: (text: string) => void;
  disabled?: boolean;
}

const PLACEHOLDER =
  'Example: Replaced copper pipe in basement, one hour labor, add miscellaneous fittings around $50.';

export function TextNotePanel({ onProcessTextNote, disabled = false }: TextNotePanelProps) {
  const [note, setNote] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = () => {
    if (!note.trim()) {
      setValidationError('Enter a field note to process.');
      return;
    }
    setValidationError('');
    onProcessTextNote(note);
    setNote('');
  };

  return (
    <div className="w-full rounded-2xl border border-surface-border bg-surface-raised/60 p-4 backdrop-blur-sm">
      <div className="mb-2 flex items-center gap-2">
        <FileText className="h-3.5 w-3.5 text-indigo-400" />
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
          Text Note
        </p>
      </div>
      <p className="mb-2 text-[11px] text-surface-muted">
        Type a field note — Joist runs it through the same trust pipeline as voice.
      </p>

      <textarea
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          if (validationError) setValidationError('');
        }}
        placeholder={PLACEHOLDER}
        disabled={disabled}
        rows={3}
        className="w-full resize-none rounded-xl border border-surface-border bg-surface/60 p-3 text-sm text-white placeholder:text-surface-muted/60 focus:border-indigo-500/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      />

      {validationError && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-trust-amber">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={disabled}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:from-indigo-600 hover:to-violet-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Send className="h-3.5 w-3.5" />
        Process Text Note
      </button>
    </div>
  );
}
