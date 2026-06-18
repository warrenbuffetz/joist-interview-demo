import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Shield } from 'lucide-react';
import type { HandshakeLogEntry } from '../engine/handshakeEngine';

const LEVEL_STYLES: Record<HandshakeLogEntry['level'], string> = {
  info: 'text-sky-400',
  success: 'text-trust-verified',
  warn: 'text-trust-amber',
  error: 'text-trust-error',
};

const LEVEL_PREFIX: Record<HandshakeLogEntry['level'], string> = {
  info: 'INFO',
  success: ' OK ',
  warn: 'WARN',
  error: ' ERR',
};

function formatTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  const s = date.getSeconds().toString().padStart(2, '0');
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
}

interface TrustLogsPanelProps {
  logs: HandshakeLogEntry[];
  isProcessing: boolean;
}

export function TrustLogsPanel({ logs, isProcessing }: TrustLogsPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex h-full flex-col">
      <header className="mb-4">
        <div className="mb-1 flex items-center gap-2">
          <Shield className="h-4 w-4 text-trust-verified" />
          <span className="text-xs font-semibold uppercase tracking-widest text-trust-verified">
            Column 2
          </span>
        </div>
        <h2 className="text-xl font-semibold tracking-tight">Handshake Trust Logs</h2>
        <p className="mt-1 text-sm text-surface-muted">
          Real-time trust pipeline — every decision is auditable.
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-surface-border bg-[#0d0e10]">
        {/* Terminal chrome */}
        <div className="flex items-center gap-2 border-b border-surface-border px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-trust-amber/80" />
            <span className="h-3 w-3 rounded-full bg-trust-verified/80" />
          </div>
          <div className="flex flex-1 items-center justify-center gap-1.5">
            <Terminal className="h-3 w-3 text-surface-muted" />
            <span className="font-mono text-xs text-surface-muted">
              joist-trust-handshake — live
            </span>
          </div>
          {isProcessing && (
            <motion.span
              className="font-mono text-xs text-indigo-400"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              RUNNING
            </motion.span>
          )}
        </div>

        {/* Log stream */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-5">
          {logs.length === 0 ? (
            <p className="text-surface-muted/50">
              <span className="text-trust-verified">$</span> awaiting voice intake…
              <span className="terminal-cursor" />
            </p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="mb-1">
                <span className="text-surface-muted/60">[{formatTime(log.timestamp)}]</span>{' '}
                <span className={LEVEL_STYLES[log.level]}>[{LEVEL_PREFIX[log.level]}]</span>{' '}
                <span className="text-white/80">{log.message}</span>
              </div>
            ))
          )}

          {isProcessing && (
            <motion.p
              className="mt-2 text-indigo-400"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              ▌ processing handshake…
            </motion.p>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-surface-border bg-surface-raised/40 px-3 py-2">
        <p className="font-mono text-[10px] text-surface-muted">
          TRUST FRAMEWORK v1.0 · intake → normalize → catalog → pricing → trust
        </p>
      </div>
    </div>
  );
}
