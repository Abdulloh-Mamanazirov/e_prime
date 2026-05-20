"use client";

import { useStore } from "@/store/useStore";
import { Info, History, Sparkles } from "lucide-react";

export default function Header() {
  const { toggleInfoStrip, toggleHistory, showInfoStrip } = useStore();

  return (
    <header className="w-full border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--accent-emerald)] to-[var(--accent-cyan)] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[var(--bg-primary)]" />
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text leading-tight">
              E-Prime
            </h1>
            <p className="text-xs text-[var(--text-muted)] leading-tight">
              Translation Tool
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleInfoStrip}
            className={`btn-secondary flex items-center gap-2 text-sm !py-2 !px-3 ${
              showInfoStrip
                ? "!border-[var(--accent-emerald)] !text-[var(--accent-emerald)]"
                : ""
            }`}
            title="Show 'to be' forms reference"
          >
            <Info className="w-4 h-4" />
            <span className="hidden sm:inline">Reference</span>
          </button>

          <button
            onClick={toggleHistory}
            className="btn-secondary flex items-center gap-2 text-sm !py-2 !px-3"
            title="View conversion history"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </button>
        </div>
      </div>
    </header>
  );
}
