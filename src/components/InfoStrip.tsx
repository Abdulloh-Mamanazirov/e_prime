"use client";

import { useState } from "react";
import { getToBeFormsReference } from "@/lib/eprime";
import { useStore } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, Ban } from "lucide-react";

const CODEX_ITEMS = [
  {
    title: "1. Projection & Predication",
    badge: "Deceptive",
    color: "var(--accent-red)",
    description: "Takes internal feelings/reactions and projects them onto external objects. This erases the perceiver from the statement.",
    example: '"The movie is boring" ➔ "I feel bored by this movie."',
  },
  {
    title: "2. Identity Claim",
    badge: "Essentializing",
    color: "#c084fc",
    description: "Equates a label or concept with a person or object, freezing a passing trait into a permanent identity.",
    example: '"He is a coward" ➔ "He acted fearfully in that instance."',
  },
  {
    title: "3. Class Membership",
    badge: "Categorizing",
    color: "var(--accent-cyan)",
    description: "Asserts category classification as an absolute truth rather than a human-created sorting model.",
    example: '"A cat is a mammal" ➔ "Scientists classify cats as mammals."',
  },
  {
    title: "4. Existence Claim",
    badge: "Objectifying",
    color: "#fb923c",
    description: "Asserts absolute presence of a thing/problem without identifying the observer, context, or location.",
    example: '"There is a bug" ➔ "I observe a bug in the console."',
  },
  {
    title: "5. Auxiliary Verb",
    badge: "Grammatical",
    color: "var(--text-muted)",
    description: "Acts purely as a grammatical helper for progressive actions. Banned in E-Prime, but semantically neutral.",
    example: '"She is running" ➔ "She runs."',
  },
];

export default function InfoStrip() {
  const { showInfoStrip, toggleInfoStrip } = useStore();
  const [activeTab, setActiveTab] = useState<"forms" | "codex">("codex"); // Default to Codex as it's more informative!
  const forms = getToBeFormsReference();

  const categories = [
    { label: "Present", items: forms.present, color: "var(--accent-red)" },
    { label: "Past", items: forms.past, color: "var(--accent-yellow)" },
    { label: "Infinitive", items: forms.infinitive, color: "#c084fc" },
    { label: "Participles", items: forms.participles, color: "#fb923c" },
    { label: "Negatives", items: forms.negatives, color: "#f87171" },
    { label: "Contractions", items: forms.contractions, color: "var(--accent-cyan)" },
  ];

  return (
    <AnimatePresence>
      {showInfoStrip && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="info-strip mx-4 sm:mx-6 mt-4 p-4">
            {/* Header with Tab switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/5">
              <div className="flex items-center gap-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Reference Guide
                </h3>
                {/* Tabs */}
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/5 border border-white/10">
                  <button
                    onClick={() => setActiveTab("codex")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-all duration-200 ${
                      activeTab === "codex"
                        ? "bg-white/10 text-white font-medium shadow-sm"
                        : "text-[var(--text-muted)] hover:text-white"
                    }`}
                  >
                    <BookOpen className="w-3 h-3" />
                    Cognitive Codex
                  </button>
                  <button
                    onClick={() => setActiveTab("forms")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-all duration-200 ${
                      activeTab === "forms"
                        ? "bg-white/10 text-white font-medium shadow-sm"
                        : "text-[var(--text-muted)] hover:text-white"
                    }`}
                  >
                    <Ban className="w-3 h-3" />
                    Banned Forms
                  </button>
                </div>
              </div>
              <button
                onClick={toggleInfoStrip}
                className="p-1 rounded hover:bg-white/10 transition-colors self-end sm:self-auto"
                title="Close reference guide"
              >
                <X className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
            </div>

            {/* Tab content */}
            {activeTab === "forms" ? (
              <div className="flex flex-wrap gap-x-6 gap-y-2 animate-fade-in">
                {categories.map((cat) => (
                  <div key={cat.label} className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[var(--text-muted)]">
                      {cat.label}:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {cat.items.map((item) => (
                        <span
                          key={item}
                          className="text-xs font-mono px-1.5 py-0.5 rounded"
                          style={{
                            background: `${cat.color}15`,
                            color: cat.color,
                            border: `1px solid ${cat.color}30`,
                          }}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-fade-in">
                {CODEX_ITEMS.map((item) => (
                  <div
                    key={item.title}
                    className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <h4 className="text-xs font-semibold text-white">
                          {item.title}
                        </h4>
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border"
                          style={{
                            backgroundColor: `${item.color}10`,
                            color: item.color,
                            borderColor: `${item.color}30`,
                          }}
                        >
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mb-2">
                        {item.description}
                      </p>
                    </div>
                    <div className="mt-auto pt-2 border-t border-white/5">
                      <span className="text-[9px] font-semibold text-[var(--text-muted)] block mb-0.5 uppercase tracking-wider">
                        Transformation Example
                      </span>
                      <span className="text-[11px] font-mono text-[var(--accent-emerald)] bg-[var(--accent-emerald)]/5 px-1.5 py-0.5 rounded block border border-[var(--accent-emerald)]/10 leading-normal">
                        {item.example}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
