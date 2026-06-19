import { useCallback, useEffect, useRef, useState } from 'react';

export type TranscriptionStatus =
  | 'idle'
  | 'listening'
  | 'transcribing'
  | 'mapping'
  | 'error'
  | 'unsupported';

/** How long to wait after the last heard speech before auto-finalizing. */
const SILENCE_FINALIZE_MS = 4_000;

/** Hard cap so the mic cannot run indefinitely. */
const MAX_SESSION_MS = 180_000;

/** Delay before restarting recognition after browser auto-ends (avoids network spam). */
const RESTART_DELAY_MS = 250;

const MAX_NETWORK_RETRIES = 3;

export const SPEECH_NETWORK_ERROR_MESSAGE =
  'Voice recognition needs an internet connection — Chrome sends audio to Google’s speech service. Try Chrome or Edge (not Brave), disable VPN/ad blockers, or use the presenter scripts below.';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export interface UseSpeechToTextOptions {
  onFinalTranscript?: (transcript: string) => void;
  lang?: string;
  /** Ms of silence before auto-stop. Default 4000. */
  silenceFinalizeMs?: number;
  /** Max listening duration. Default 180000 (3 min). */
  maxSessionMs?: number;
}

export interface UseSpeechToTextReturn {
  status: TranscriptionStatus;
  interimTranscript: string;
  /** Confirmed speech segments accumulated so far this session. */
  finalTranscript: string;
  /** Confirmed + in-progress text stitched for live display. */
  liveTranscript: string;
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  reset: () => void;
  injectTranscript: (text: string) => void;
  completeMapping: () => void;
}

export function stitchTranscript(confirmed: string, interim: string): string {
  return [confirmed.trim(), interim.trim()].filter(Boolean).join(' ');
}

export function useSpeechToText(options: UseSpeechToTextOptions = {}): UseSpeechToTextReturn {
  const {
    onFinalTranscript,
    lang = 'en-US',
    silenceFinalizeMs = SILENCE_FINALIZE_MS,
    maxSessionMs = MAX_SESSION_MS,
  } = options;

  const [status, setStatus] = useState<TranscriptionStatus>('idle');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onFinalRef = useRef(onFinalTranscript);
  onFinalRef.current = onFinalTranscript;

  const accumulatedRef = useRef('');
  const interimRef = useRef('');
  const sessionActiveRef = useRef(false);
  const finalizedRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxSessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const networkRetryCountRef = useRef(0);

  const SpeechRecognitionCtor = getSpeechRecognition();
  const isSupported = SpeechRecognitionCtor !== null;

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current != null) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const clearMaxSessionTimer = useCallback(() => {
    if (maxSessionTimerRef.current != null) {
      clearTimeout(maxSessionTimerRef.current);
      maxSessionTimerRef.current = null;
    }
  }, []);

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current != null) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const buildFullTranscript = useCallback(() => {
    const parts = [accumulatedRef.current.trim(), interimRef.current.trim()].filter(Boolean);
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }, []);

  const finalizeSession = useCallback(
    (reason: 'silence' | 'manual' | 'max_duration') => {
      if (finalizedRef.current) return;
      finalizedRef.current = true;
      sessionActiveRef.current = false;
      setSessionActive(false);

      clearSilenceTimer();
      clearMaxSessionTimer();

      clearRestartTimer();
      recognitionRef.current?.stop();

      const full = buildFullTranscript();

      if (full) {
        setFinalTranscript(full);
        setInterimTranscript('');
        interimRef.current = '';
        setStatus('mapping');
        onFinalRef.current?.(full);
      } else if (reason === 'manual') {
        setStatus('idle');
      } else {
        setError(
          reason === 'max_duration'
            ? 'Listening timed out. Tap the mic and try again.'
            : 'No speech detected. Try speaking closer to your microphone.',
        );
        setStatus('error');
      }
    },
    [buildFullTranscript, clearMaxSessionTimer, clearRestartTimer, clearSilenceTimer],
  );

  const scheduleSilenceFinalize = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      if (sessionActiveRef.current && !finalizedRef.current) {
        finalizeSession('silence');
      }
    }, silenceFinalizeMs);
  }, [clearSilenceTimer, finalizeSession, silenceFinalizeMs]);

  const scheduleRecognitionRestart = useCallback((recognition: SpeechRecognitionInstance) => {
    clearRestartTimer();
    restartTimerRef.current = setTimeout(() => {
      if (!sessionActiveRef.current || finalizedRef.current) return;
      try {
        recognition.start();
        networkRetryCountRef.current = 0;
      } catch {
        scheduleSilenceFinalize();
      }
    }, RESTART_DELAY_MS);
  }, [clearRestartTimer, scheduleSilenceFinalize]);

  useEffect(() => {
    if (!SpeechRecognitionCtor) {
      setStatus('unsupported');
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setError(null);
      networkRetryCountRef.current = 0;
      if (sessionActiveRef.current) {
        setStatus('listening');
      }
    };

    recognition.onspeechstart = () => {
      if (sessionActiveRef.current) {
        setStatus('listening');
        scheduleSilenceFinalize();
      }
    };

    recognition.onspeechend = () => {
      // Pause between phrases — stay in listening; silence timer handles finalize.
      if (sessionActiveRef.current) {
        setStatus('listening');
        scheduleSilenceFinalize();
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (!sessionActiveRef.current || finalizedRef.current) return;

      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) {
          accumulatedRef.current = `${accumulatedRef.current} ${text}`.replace(/\s+/g, ' ').trim();
        } else {
          interim += text;
        }
      }

      interimRef.current = interim;
      setInterimTranscript(interim);
      setFinalTranscript(accumulatedRef.current);
      setStatus('listening');
      scheduleSilenceFinalize();
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'aborted') return;

      // Browsers fire no-speech during natural pauses — keep session alive if we have audio so far.
      if (event.error === 'no-speech' && sessionActiveRef.current && !finalizedRef.current) {
        scheduleSilenceFinalize();
        return;
      }

      // Transient Google speech-service failures — retry a few times before surfacing UI error.
      if (event.error === 'network' && sessionActiveRef.current && !finalizedRef.current) {
        if (networkRetryCountRef.current < MAX_NETWORK_RETRIES) {
          networkRetryCountRef.current += 1;
          scheduleRecognitionRestart(recognition);
          return;
        }
      }

      const errMsg =
        event.error === 'not-allowed'
          ? 'Microphone permission denied. Please allow mic access and retry.'
          : event.error === 'no-speech'
            ? 'No speech detected. Try speaking closer to your microphone.'
            : event.error === 'network'
              ? SPEECH_NETWORK_ERROR_MESSAGE
              : `Speech recognition error: ${event.error}`;

      sessionActiveRef.current = false;
      setSessionActive(false);
      finalizedRef.current = true;
      clearSilenceTimer();
      clearMaxSessionTimer();
      clearRestartTimer();
      setError(errMsg);
      setStatus('error');
    };

    recognition.onend = () => {
      // Chrome/Safari end the recognizer after pauses even in continuous mode — restart while session is open.
      if (sessionActiveRef.current && !finalizedRef.current) {
        scheduleRecognitionRestart(recognition);
        return;
      }

      setStatus((prev) => {
        if (prev === 'listening' || prev === 'transcribing') {
          return 'idle';
        }
        return prev;
      });
    };

    recognitionRef.current = recognition;

    return () => {
      clearSilenceTimer();
      clearMaxSessionTimer();
      clearRestartTimer();
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [
    SpeechRecognitionCtor,
    lang,
    clearSilenceTimer,
    clearMaxSessionTimer,
    clearRestartTimer,
    scheduleSilenceFinalize,
    scheduleRecognitionRestart,
  ]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;

    accumulatedRef.current = '';
    interimRef.current = '';
    finalizedRef.current = false;
    networkRetryCountRef.current = 0;
    sessionActiveRef.current = true;
    setSessionActive(true);
    setInterimTranscript('');
    setFinalTranscript('');
    setError(null);
    setStatus('listening');

    clearSilenceTimer();
    clearMaxSessionTimer();

    maxSessionTimerRef.current = setTimeout(() => {
      if (sessionActiveRef.current && !finalizedRef.current) {
        finalizeSession('max_duration');
      }
    }, maxSessionMs);

    scheduleSilenceFinalize();

    try {
      recognitionRef.current.start();
    } catch {
      recognitionRef.current.stop();
      setTimeout(() => recognitionRef.current?.start(), 100);
    }
  }, [
    clearMaxSessionTimer,
    clearSilenceTimer,
    finalizeSession,
    maxSessionMs,
    scheduleSilenceFinalize,
  ]);

  const stopListening = useCallback(() => {
    if (!sessionActiveRef.current || finalizedRef.current) return;
    setStatus('transcribing');
    finalizeSession('manual');
  }, [finalizeSession]);

  const reset = useCallback(() => {
    sessionActiveRef.current = false;
    finalizedRef.current = true;
    setSessionActive(false);
    clearSilenceTimer();
    clearMaxSessionTimer();
    clearRestartTimer();
    recognitionRef.current?.abort();
    accumulatedRef.current = '';
    interimRef.current = '';
    setInterimTranscript('');
    setFinalTranscript('');
    setError(null);
    setStatus('idle');
  }, [clearMaxSessionTimer, clearRestartTimer, clearSilenceTimer]);

  const injectTranscript = useCallback((text: string) => {
    setFinalTranscript(text);
    setInterimTranscript('');
    setStatus('mapping');
    onFinalRef.current?.(text);
  }, []);

  const completeMapping = useCallback(() => {
    setStatus('idle');
  }, []);

  return {
    status,
    interimTranscript,
    finalTranscript,
    liveTranscript: stitchTranscript(finalTranscript, interimTranscript),
    isListening: sessionActive,
    isSupported,
    error,
    startListening,
    stopListening,
    reset,
    injectTranscript,
    completeMapping,
  };
}
