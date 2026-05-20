"use client";

import { useStore } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Trash2 } from "lucide-react";

export default function HistorySidebar() {
  const { showHistory, toggleHistory, history, clearHistory, loadFromHistory } =
    useStore();

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const truncate = (text: string, max: number) =>
    text.length > max ? text.slice(0, max) + "..." : text;

  return (
    <AnimatePresence>
      {showHistory && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="sidebar-overlay"
            onClick={toggleHistory}
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-[var(--bg-secondary)] border-l border-[var(--border-subtle)] z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--accent-emerald)]" />
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Conversion History
                </h2>
                <span className="text-xs text-[var(--text-muted)] bg-white/5 px-2 py-0.5 rounded-full">
                  {history.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="p-1.5 rounded hover:bg-white/10 transition-colors"
                    title="Clear all history"
                  >
                    <Trash2 className="w-4 h-4 text-[var(--text-muted)]" />
                  </button>
                )}
                <button
                  onClick={toggleHistory}
                  className="p-1.5 rounded hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-[var(--text-muted)]" />
                </button>
              </div>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Clock className="w-10 h-10 text-[var(--text-muted)] mb-3 opacity-40" />
                  <p className="text-sm text-[var(--text-muted)]">
                    No conversions yet
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1 opacity-70">
                    Your translations will appear here
                  </p>
                </div>
              ) : (
                history.map((record) => (
                  <button
                    key={record.id}
                    onClick={() => {
                      loadFromHistory(record);
                      toggleHistory();
                    }}
                    className="w-full text-left p-3 rounded-lg bg-white/[0.03] border border-[var(--border-subtle)] hover:border-[var(--border-glow)] hover:bg-white/[0.05] transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {formatTime(record.timestamp)}
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          record.score >= 80
                            ? "text-[var(--accent-emerald)]"
                            : record.score >= 50
                            ? "text-[var(--accent-yellow)]"
                            : "text-[var(--accent-red)]"
                        }`}
                      >
                        {record.score}%
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-1">
                      {truncate(record.originalText, 80)}
                    </p>
                    <p className="text-xs text-[var(--accent-emerald)] opacity-70 group-hover:opacity-100 transition-opacity">
                      → {truncate(record.translatedText, 80)}
                    </p>
                  </button>
                ))
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
