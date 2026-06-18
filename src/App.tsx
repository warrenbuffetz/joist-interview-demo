import { useCallback, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { VoiceInputPanel } from './components/VoiceInputPanel';
import { TrustLogsPanel } from './components/TrustLogsPanel';
import { SmartphonePreview } from './components/SmartphonePreview';
import { useSpeechToText } from './hooks/useSpeechToText';
import { runHandshakeEngine, type HandshakeResult } from './engine/handshakeEngine';
import { DEMO_TRANSCRIPTS } from './data/catalogData';

type WorkflowStage = 'idle' | 'listening' | 'drafting' | 'complete';

function App() {
  const [handshakeResult, setHandshakeResult] = useState<HandshakeResult | null>(null);
  const [displayLogs, setDisplayLogs] = useState<HandshakeResult['logs']>([]);
  const [workflowStage, setWorkflowStage] = useState<WorkflowStage>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const logIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onHandshakeCompleteRef = useRef<() => void>(() => {});

  const clearLogInterval = useCallback(() => {
    if (logIntervalRef.current) {
      clearInterval(logIntervalRef.current);
      logIntervalRef.current = null;
    }
  }, []);

  const processTranscript = useCallback(
    (transcript: string) => {
      clearLogInterval();
      setWorkflowStage('drafting');
      setIsProcessing(true);
      setHandshakeResult(null);
      setDisplayLogs([]);

      const result = runHandshakeEngine(transcript);
      let index = 0;

      logIntervalRef.current = setInterval(() => {
        if (index < result.logs.length) {
          setDisplayLogs((prev) => [...prev, result.logs[index]]);
          index++;
        } else {
          clearLogInterval();
          setHandshakeResult(result);
          setIsProcessing(false);
          setWorkflowStage('complete');
          onHandshakeCompleteRef.current();
        }
      }, 180);
    },
    [clearLogInterval],
  );

  const speech = useSpeechToText({
    onFinalTranscript: processTranscript,
  });

  useEffect(() => {
    onHandshakeCompleteRef.current = speech.completeMapping;
  }, [speech.completeMapping]);

  const handleReset = useCallback(() => {
    clearLogInterval();
    speech.reset();
    setHandshakeResult(null);
    setDisplayLogs([]);
    setWorkflowStage('idle');
    setIsProcessing(false);
  }, [clearLogInterval, speech]);

  const handleStart = useCallback(() => {
    clearLogInterval();
    setHandshakeResult(null);
    setDisplayLogs([]);
    setWorkflowStage('listening');
    speech.startListening();
  }, [clearLogInterval, speech]);

  const handleStop = useCallback(() => {
    speech.stopListening();
  }, [speech]);

  const handleDemoVerified = useCallback(() => {
    speech.injectTranscript(DEMO_TRANSCRIPTS.verified);
  }, [speech]);

  const handleDemoAmber = useCallback(() => {
    speech.injectTranscript(DEMO_TRANSCRIPTS.amber);
  }, [speech]);

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
            <motion.div
              className="flex items-center gap-1.5 rounded-full border border-trust-verified/30 bg-trust-verified/10 px-3 py-1"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-trust-verified" />
              <span className="text-xs font-medium text-trust-verified">LIVE</span>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-6">
        <div className="grid min-h-[calc(100vh-88px)] grid-cols-1 gap-4 lg:grid-cols-3">
          <motion.section
            className="flex min-h-[480px] flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface-raised/50 p-6 backdrop-blur-sm lg:min-h-0"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <VoiceInputPanel
              status={speech.status}
              interimTranscript={speech.interimTranscript}
              finalTranscript={speech.finalTranscript}
              isListening={speech.isListening}
              isSupported={speech.isSupported}
              error={speech.error}
              onStart={handleStart}
              onStop={handleStop}
              onReset={handleReset}
              onDemoVerified={handleDemoVerified}
              onDemoAmber={handleDemoAmber}
            />
          </motion.section>

          <motion.section
            className="flex min-h-[480px] flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface-raised/50 p-6 backdrop-blur-sm lg:min-h-0"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <TrustLogsPanel logs={displayLogs} isProcessing={isProcessing} />
          </motion.section>

          <motion.section
            className="flex min-h-[480px] flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface-raised/50 p-6 backdrop-blur-sm lg:min-h-0"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <SmartphonePreview result={handshakeResult} workflowStage={workflowStage} />
          </motion.section>
        </div>
      </main>
    </div>
  );
}

export default App;
