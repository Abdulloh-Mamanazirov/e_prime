// Web Speech API abstraction
// Provides a clean interface for continuous speech recognition with interim results

export interface SpeechCallbacks {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (error: string) => void;
  onStatusChange: (listening: boolean) => void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export class SpeechManager {
  private recognition: SpeechRecognitionInstance | null = null;
  private callbacks: SpeechCallbacks;
  private isListening = false;
  private shouldRestart = false;

  constructor(callbacks: SpeechCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Checks if the Web Speech API is available in the current browser.
   */
  static isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * Starts continuous speech recognition.
   * Interim results stream as the user speaks.
   * Final results fire when the user pauses.
   * The microphone never stops unless explicitly called.
   */
  start(): void {
    if (!SpeechManager.isSupported()) {
      this.callbacks.onError(
        "Speech recognition not supported. Please use Chrome or Edge."
      );
      return;
    }

    if (this.isListening) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = "en-US";
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.callbacks.onStatusChange(true);
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript) {
        this.callbacks.onInterim(interimTranscript);
      }

      if (finalTranscript) {
        this.callbacks.onFinal(finalTranscript.trim());
      }
    };

    this.recognition.onerror = (event: { error: string }) => {
      // "no-speech" and "aborted" are not real errors — just restart
      if (event.error === "no-speech" || event.error === "aborted") {
        return;
      }
      this.callbacks.onError(`Speech error: ${event.error}`);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      // Auto-restart if we should keep listening (mic stays on)
      if (this.shouldRestart) {
        setTimeout(() => {
          if (this.shouldRestart) {
            this.start();
          }
        }, 100);
      } else {
        this.callbacks.onStatusChange(false);
      }
    };

    this.shouldRestart = true;
    this.recognition.start();
  }

  /**
   * Stops speech recognition completely.
   */
  stop(): void {
    this.shouldRestart = false;
    this.isListening = false;
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    this.callbacks.onStatusChange(false);
  }

  /**
   * Returns whether the recognition is currently active.
   */
  getIsListening(): boolean {
    return this.isListening;
  }
}
