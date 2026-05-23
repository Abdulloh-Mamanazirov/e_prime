"use client";

import type { TranslationChange } from "@/lib/gemini";
import { ArrowRight, HelpCircle } from "lucide-react";

interface ChangesLogProps {
  changes: TranslationChange[];
}

const CATEGORY_MAP = {
  projection: {
    label: "Projection",
    description: "Projects internal reactions/judgments onto external objects",
    style: {
      backgroundColor: "rgba(239, 68, 68, 0.08)",
      color: "var(--accent-red)",
      borderColor: "rgba(239, 68, 68, 0.2)",
    },
  },
  identity: {
    label: "Identity Claim",
    description: "Equates a label or concept with the actual person or object",
    style: {
      backgroundColor: "rgba(192, 132, 252, 0.08)",
      color: "#c084fc",
      borderColor: "rgba(192, 132, 252, 0.2)",
    },
  },
  class_membership: {
    label: "Class Membership",
    description: "Asserts category grouping as an inherent, absolute truth",
    style: {
      backgroundColor: "rgba(6, 182, 212, 0.08)",
      color: "var(--accent-cyan)",
      borderColor: "rgba(6, 182, 212, 0.2)",
    },
  },
  existence: {
    label: "Existence Statement",
    description: "Claims absolute existence, omitting location or observer context",
    style: {
      backgroundColor: "rgba(251, 146, 60, 0.08)",
      color: "#fb923c",
      borderColor: "rgba(251, 146, 60, 0.2)",
    },
  },
  auxiliary: {
    label: "Auxiliary Verb",
    description: "A grammatical helper verb to denote tense or aspect",
    style: {
      backgroundColor: "rgba(255, 255, 255, 0.04)",
      color: "var(--text-muted)",
      borderColor: "rgba(255, 255, 255, 0.1)",
    },
  },
};

export default function ChangesLog({ changes }: ChangesLogProps) {
  if (changes.length === 0) return null;

  return (
    <div>
      <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-2 block">
        Explanation
      </span>
      <div className="space-y-2">
        {changes.map((change, i) => {
          const catInfo = change.category ? CATEGORY_MAP[change.category] : null;

          return (
            <div
              key={i}
              className="flex flex-col gap-2 p-3 rounded-lg bg-white/[0.03] border border-[var(--border-subtle)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="diff-removed font-mono text-xs">
                    {change.original}
                  </span>
                  <ArrowRight className="w-3 h-3 text-[var(--text-muted)] flex-shrink-0" />
                  <span className="diff-added font-mono text-xs">
                    {change.replacement}
                  </span>
                </div>

                {catInfo && (
                  <div
                    className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border cursor-help group relative"
                    style={catInfo.style}
                  >
                    <span>{catInfo.label}</span>
                    <HelpCircle className="w-3 h-3 opacity-60" />
                    
                    {/* Tooltip */}
                    <div className="absolute right-0 bottom-full mb-2 w-48 p-2 rounded-lg bg-black/90 border border-white/10 text-[10px] text-white opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-xl z-10 leading-normal font-normal">
                      {catInfo.description}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {change.reason}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
