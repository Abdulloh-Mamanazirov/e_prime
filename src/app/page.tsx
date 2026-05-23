"use client";

import { useStore } from "@/store/useStore";
import Header from "@/components/Header";
import InfoStrip from "@/components/InfoStrip";
import SpeechPanel from "@/components/SpeechPanel";
import TextInputPanel from "@/components/TextInputPanel";
import HistorySidebar from "@/components/HistorySidebar";
import { Mic, Type, Eye, EyeOff, Brain, Zap } from "lucide-react";

export default function Home() {
  const {
    activeTab,
    setActiveTab,
    explanationMode,
    toggleExplanationMode,
    translationMode,
    setTranslationMode,
  } = useStore();

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <Header />
      <InfoStrip />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col">
        {/* Tab Switcher + Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-[var(--border-subtle)] self-start">
            <button
              onClick={() => setActiveTab("speech")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                activeTab === "speech" ? "tab-active" : "tab-inactive !border-0"
              }`}
            >
              <Mic className="w-4 h-4" />
              Speech
            </button>
            <button
              onClick={() => setActiveTab("text")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                activeTab === "text" ? "tab-active" : "tab-inactive !border-0"
              }`}
            >
              <Type className="w-4 h-4" />
              Text
            </button>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto">
            {/* Codex Mode Selector */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-[var(--border-subtle)]">
              <button
                onClick={() => setTranslationMode("subjective")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 ${
                  translationMode === "subjective"
                    ? "bg-[var(--accent-emerald)]/10 text-[var(--accent-emerald)] border border-[var(--accent-emerald)]/30 font-medium"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-transparent"
                }`}
                title="Honest Subjectivity mode: Reinserts the speaker/observer to fix projection problems"
              >
                <Brain className="w-3.5 h-3.5" />
                <span>Honest Subjectivity</span>
              </button>
              <button
                onClick={() => setTranslationMode("strict")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 ${
                  translationMode === "strict"
                    ? "bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/30 font-medium"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-transparent"
                }`}
                title="Strict E-Prime mode: Direct replacement of 'to be' with active verbs"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Strict E-Prime</span>
              </button>
            </div>

            {/* Explanation Mode Toggle */}
            <button
              onClick={toggleExplanationMode}
              className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-all duration-200 ${
                explanationMode
                  ? "bg-[var(--accent-emerald)]/10 text-[var(--accent-emerald)] border border-[var(--accent-emerald)]/30"
                  : "bg-white/[0.04] text-[var(--text-muted)] border border-[var(--border-subtle)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {explanationMode ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Explanations</span>
            </button>
          </div>
        </div>

        {/* Active Panel */}
        <div className="flex-1">
          {activeTab === "speech" ? <SpeechPanel /> : <TextInputPanel />}
        </div>
      </main>

      {/* History Sidebar */}
      <HistorySidebar />
    </div>
  );
}
