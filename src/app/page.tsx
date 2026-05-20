"use client";

import { useStore } from "@/store/useStore";
import Header from "@/components/Header";
import InfoStrip from "@/components/InfoStrip";
import SpeechPanel from "@/components/SpeechPanel";
import TextInputPanel from "@/components/TextInputPanel";
import HistorySidebar from "@/components/HistorySidebar";
import { Mic, Type, Eye, EyeOff } from "lucide-react";

export default function Home() {
  const { activeTab, setActiveTab, explanationMode, toggleExplanationMode } =
    useStore();

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <Header />
      <InfoStrip />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col">
        {/* Tab Switcher + Controls */}
        <div className="flex items-center justify-between mb-5">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-[var(--border-subtle)]">
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
