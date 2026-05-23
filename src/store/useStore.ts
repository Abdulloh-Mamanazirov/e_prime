import { create } from "zustand";
import type { TranslationChange } from "@/lib/gemini";

export interface Utterance {
  id: string;
  original: string;
  translated: string;
  changes: TranslationChange[];
  score: number;
  timestamp: number;
  isTranslating: boolean;
}

export interface ConversionRecord {
  id: string;
  originalText: string;
  translatedText: string;
  score: number;
  timestamp: number;
  changes: TranslationChange[];
}

interface AppState {
  // Active tab
  activeTab: "speech" | "text";
  setActiveTab: (tab: "speech" | "text") => void;

  // Codex mode
  translationMode: "subjective" | "strict";
  setTranslationMode: (mode: "subjective" | "strict") => void;

  // Speech state
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
  interimText: string;
  setInterimText: (text: string) => void;

  // Utterances (speech mode log)
  utterances: Utterance[];
  addUtterance: (utterance: Utterance) => void;
  updateUtterance: (id: string, updates: Partial<Utterance>) => void;
  clearUtterances: () => void;

  // Text mode
  inputText: string;
  setInputText: (text: string) => void;
  translatedText: string;
  setTranslatedText: (text: string) => void;
  textChanges: TranslationChange[];
  setTextChanges: (changes: TranslationChange[]) => void;
  textScore: number;
  setTextScore: (score: number) => void;
  isTranslating: boolean;
  setIsTranslating: (translating: boolean) => void;

  // UI toggles
  explanationMode: boolean;
  toggleExplanationMode: () => void;
  showInfoStrip: boolean;
  toggleInfoStrip: () => void;
  showHistory: boolean;
  toggleHistory: () => void;

  // History
  history: ConversionRecord[];
  addToHistory: (record: ConversionRecord) => void;
  clearHistory: () => void;
  loadFromHistory: (record: ConversionRecord) => void;
}

export const useStore = create<AppState>((set) => ({
  // Active tab
  activeTab: "speech",
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Codex mode
  translationMode: "subjective",
  setTranslationMode: (mode) => set({ translationMode: mode }),

  // Speech state
  isListening: false,
  setIsListening: (listening) => set({ isListening: listening }),
  interimText: "",
  setInterimText: (text) => set({ interimText: text }),

  // Utterances
  utterances: [],
  addUtterance: (utterance) =>
    set((state) => ({ utterances: [...state.utterances, utterance] })),
  updateUtterance: (id, updates) =>
    set((state) => ({
      utterances: state.utterances.map((u) =>
        u.id === id ? { ...u, ...updates } : u
      ),
    })),
  clearUtterances: () => set({ utterances: [], interimText: "" }),

  // Text mode
  inputText: "",
  setInputText: (text) => set({ inputText: text }),
  translatedText: "",
  setTranslatedText: (text) => set({ translatedText: text }),
  textChanges: [],
  setTextChanges: (changes) => set({ textChanges: changes }),
  textScore: 100,
  setTextScore: (score) => set({ textScore: score }),
  isTranslating: false,
  setIsTranslating: (translating) => set({ isTranslating: translating }),

  // UI toggles
  explanationMode: false,
  toggleExplanationMode: () =>
    set((state) => ({ explanationMode: !state.explanationMode })),
  showInfoStrip: false,
  toggleInfoStrip: () =>
    set((state) => ({ showInfoStrip: !state.showInfoStrip })),
  showHistory: false,
  toggleHistory: () => set((state) => ({ showHistory: !state.showHistory })),

  // History
  history: [],
  addToHistory: (record) =>
    set((state) => ({ history: [record, ...state.history].slice(0, 50) })),
  clearHistory: () => set({ history: [] }),
  loadFromHistory: (record) =>
    set({
      activeTab: "text",
      inputText: record.originalText,
      translatedText: record.translatedText,
      textChanges: record.changes,
      textScore: record.score,
    }),
}));
