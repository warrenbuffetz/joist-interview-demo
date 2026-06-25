import { useCallback, useState, useRef, useEffect } from 'react';
import { VoiceInputPanel } from './components/VoiceInputPanel';
import { TrustLogsPanel } from './components/TrustLogsPanel';
import { SmartphonePreview } from './components/SmartphonePreview';
import { useSpeechToText } from './hooks/useSpeechToText';
import {
  runHandshakeEngine,
  type HandshakeResult,
  type HandshakeLogEntry,
  type InputSource,
} from './engine/handshakeEngine';
import { DEMO_BILLING_OVERRIDE, DEMO_TRANSCRIPTS } from './data/catalogData';
import type { PresenterScript } from './data/presenterScripts';
import type { ScenarioBillingOverride } from './utils/scenarioBilling';
import { finalizeHumanCorrectedResult } from './utils/invoiceTotals';

type WorkflowStage = 'idle' | 'listening' | 'drafting' | 'complete';

function isValidLog(log: HandshakeLogEntry | undefined | null): log is HandshakeLogEntry {
  return (
    log != null &&
    typeof log.id === 'string' &&
    typeof log.timestamp === 'number' &&
    typeof log.message === 'string'
  );
}

function App() {
  const [handshakeResult, setHandshakeResult] = useState<HandshakeResult | null>(null);
  const [displayLogs, setDisplayLogs] = useState<HandshakeLogEntry[]>([]);
  const [workflowStage, setWorkflowStage] = useState<WorkflowStage>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTranscript, setActiveTranscript] = useState('');
  const runIdRef = useRef(0);
  const completeMappingRef = useRef<() => void>(() => {});

  const cancelRun = useCallback(() => {
    runIdRef.current += 1;
  }, []);

  useEffect(() => () => cancelRun(), [cancelRun]);

  const finishHandshake = useCallback((result: HandshakeResult, runId: number) => {
    if (runId !== runIdRef.current) return;
    setHandshakeResult(result);
    setIsProcessing(false);
    setWorkflowStage('complete');
    completeMappingRef.current();
  }, []);

  const processInputText = useCallback(
    (
      inputText: string,
      source: InputSource,
      billingOverride?: ScenarioBillingOverride,
    ) => {
      cancelRun();
      const runId = runIdRef.current;

      setActiveTranscript(inputText);
      setWorkflowStage('drafting');
      setIsProcessing(true);
      setHandshakeResult(null);
      setDisplayLogs([]);

      const result = runHandshakeEngine(inputText, source, billingOverride);
      const validLogs = result.logs.filter(isValidLog);

      // Stream logs one at a time using slice — no index-based access
      validLogs.forEach((log, i) => {
        setTimeout(() => {
          if (runId !== runIdRef.current) return;
          setDisplayLogs((prev) => [...prev, log]);
          if (i === validLogs.length - 1) {
            finishHandshake(result, runId);
          }
        }, i * 150);
      });

      // Safety: if engine returns zero logs, still finish
      if (validLogs.length === 0) {
        finishHandshake(result, runId);
      }
    },
    [cancelRun, finishHandshake],
  );

  const processVoiceTranscript = useCallback(
    (transcript: string) => processInputText(transcript, 'voice'),
    [processInputText],
  );

  const handleProcessTextNote = useCallback(
    (text: string) => processInputText(text.trim(), 'text'),
    [processInputText],
  );

  const processHumanCorrection = useCallback(
    (transcript: string) => {
      cancelRun();
      const runId = runIdRef.current;

      setActiveTranscript(transcript);
      setWorkflowStage('drafting');
      setIsProcessing(true);
      setHandshakeResult(null);
      setDisplayLogs([]);

      const result = finalizeHumanCorrectedResult(runHandshakeEngine(transcript));
      const validLogs = result.logs.filter(isValidLog);

      validLogs.forEach((log, i) => {
        setTimeout(() => {
          if (runId !== runIdRef.current) return;
          setDisplayLogs((prev) => [...prev, log]);
          if (i === validLogs.length - 1) {
            finishHandshake(result, runId);
          }
        }, i * 150);
      });

      if (validLogs.length === 0) {
        finishHandshake(result, runId);
      }
    },
    [cancelRun, finishHandshake],
  );

  const processPresenterScript = useCallback(
    (script: PresenterScript) => {
      processInputText(script.readAloud, 'scenario', script.billingOverride);
    },
    [processInputText],
  );

  const speech = useSpeechToText({
    onFinalTranscript: processVoiceTranscript,
  });

  useEffect(() => {
    completeMappingRef.current = speech.completeMapping;
  }, [speech.completeMapping]);

  const handleReset = useCallback(() => {
    cancelRun();
    speech.reset();
    setHandshakeResult(null);
    setDisplayLogs([]);
    setActiveTranscript('');
    setWorkflowStage('idle');
    setIsProcessing(false);
  }, [cancelRun, speech]);

  const handleStart = useCallback(() => {
    cancelRun();
    setHandshakeResult(null);
    setDisplayLogs([]);
    setActiveTranscript('');
    setWorkflowStage('listening');
    speech.startListening();
  }, [cancelRun, speech]);

  const handleStop = useCallback(() => {
    speech.stopListening();
  }, [speech]);

  const handleDemoVerified = useCallback(() => {
    processInputText(DEMO_TRANSCRIPTS.verified, 'scenario', DEMO_BILLING_OVERRIDE);
  }, [processInputText]);

  const handleDemoAmber = useCallback(() => {
    processInputText(DEMO_TRANSCRIPTS.amber, 'scenario');
  }, [processInputText]);

  const displayTranscript = activeTranscript || speech.finalTranscript;
  const panelFinalTranscript = speech.isListening ? speech.finalTranscript : displayTranscript;
  const panelLiveTranscript = speech.isListening
    ? speech.liveTranscript
    : displayTranscript;
  const hasCompletedSession = Boolean(handshakeResult) && workflowStage === 'complete';

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-surface-border px-6 py-4">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <span className="text-sm font-bold text-white">J</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight">Joist Trust Sandbox</h1>
              <p className="text-xs text-surface-muted">
                Autonomous Invoice Assistant — Live Demo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-surface-border px-3 py-1 text-xs text-surface-muted sm:inline">
              Project Handshake v1.0
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-trust-verified/30 bg-trust-verified/10 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-trust-verified" />
              <span className="text-xs font-medium text-trust-verified">LIVE</span>
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-6">
        <div className="grid min-h-[calc(100vh-88px)] grid-cols-1 gap-4 lg:grid-cols-3">
          <section className="flex min-h-[480px] flex-col overflow-y-auto rounded-2xl border border-surface-border bg-surface-raised/50 p-6 lg:min-h-0 lg:max-h-[calc(100vh-88px)]">
            <VoiceInputPanel
              status={isProcessing ? 'mapping' : speech.status}
              interimTranscript={speech.interimTranscript}
              finalTranscript={panelFinalTranscript}
              liveTranscript={panelLiveTranscript}
              isListening={speech.isListening}
              isSupported={speech.isSupported}
              error={speech.error}
              onStart={handleStart}
              onStop={handleStop}
              onReset={handleReset}
              onDemoVerified={handleDemoVerified}
              onDemoAmber={handleDemoAmber}
              onSimulateStt={processVoiceTranscript}
              onProcessTextNote={handleProcessTextNote}
              isProcessing={isProcessing}
              onApplyCorrection={processHumanCorrection}
              onRunPresenterScript={processPresenterScript}
              hasCompletedSession={hasCompletedSession}
            />
          </section>

          <section className="flex min-h-[480px] flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface-raised/50 p-6 lg:min-h-0">
            <TrustLogsPanel logs={displayLogs} isProcessing={isProcessing} />
          </section>

          <section className="flex min-h-[480px] flex-col overflow-y-auto rounded-2xl border border-surface-border bg-surface-raised/50 p-6 lg:min-h-0">
            <SmartphonePreview
              result={handshakeResult}
              workflowStage={workflowStage}
              onReset={handleReset}
            />
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
