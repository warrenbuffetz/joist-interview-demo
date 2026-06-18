import { useCallback, useEffect, useRef, useState } from 'react';

export type TranscriptionStatus =
  | 'idle'
  | 'listening'
  | 'transcribing'
  | 'mapping'
  | 'error'
  | 'unsupported';

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
}

export interface UseSpeechToTextReturn {
  status: TranscriptionStatus;
  interimTranscript: string;
  finalTranscript: string;
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  reset: () => void;
  injectTranscript: (text: string) => void;
  completeMapping: () => void;
}

export function useSpeechToText(options: UseSpeechToTextOptions = {}): UseSpeechToTextReturn {
  const { onFinalTranscript, lang = 'en-US' } = options;

  const [status, setStatus] = useState<TranscriptionStatus>('idle');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onFinalRef = useRef(onFinalTranscript);
  onFinalRef.current = onFinalTranscript;

  const SpeechRecognitionCtor = getSpeechRecognition();
  const isSupported = SpeechRecognitionCtor !== null;

  useEffect(() => {
    if (!SpeechRecognitionCtor) {
      setStatus('unsupported');
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setStatus('listening');
      setError(null);
    };

    recognition.onspeechstart = () => {
      setStatus('listening');
    };

    recognition.onspeechend = () => {
      setStatus('transcribing');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (interim) {
        setInterimTranscript(interim);
        setStatus('listening');
      }

      if (final) {
        const trimmed = final.trim();
        setFinalTranscript(trimmed);
        setInterimTranscript('');
        setStatus('mapping');
        onFinalRef.current?.(trimmed);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errMsg =
        event.error === 'not-allowed'
          ? 'Microphone permission denied. Please allow mic access and retry.'
          : event.error === 'no-speech'
            ? 'No speech detected. Try speaking closer to your microphone.'
            : `Speech recognition error: ${event.error}`;

      setError(errMsg);
      setStatus('error');
    };

    recognition.onend = () => {
      setStatus((prev) => {
        if (prev === 'listening' || prev === 'transcribing') {
          return 'idle';
        }
        return prev;
      });
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [SpeechRecognitionCtor, lang]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;

    setInterimTranscript('');
    setFinalTranscript('');
    setError(null);

    try {
      recognitionRef.current.start();
    } catch {
      recognitionRef.current.stop();
      setTimeout(() => recognitionRef.current?.start(), 100);
    }
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setStatus('transcribing');
  }, []);

  const reset = useCallback(() => {
    recognitionRef.current?.abort();
    setInterimTranscript('');
    setFinalTranscript('');
    setError(null);
    setStatus('idle');
  }, []);

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
    isListening: status === 'listening',
    isSupported,
    error,
    startListening,
    stopListening,
    reset,
    injectTranscript,
    completeMapping,
  };
}
