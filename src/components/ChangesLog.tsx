"use client";

import type { TranslationChange } from "@/lib/gemini";
import { ArrowRight } from "lucide-react";

interface ChangesLogProps {
  changes: TranslationChange[];
}

export default function ChangesLog({ changes }: ChangesLogProps) {
  if (changes.length === 0) return null;

  return (
    <div>
      <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-2 block">
        Explanation
      </span>
      <div className="space-y-2">
        {changes.map((change, i) => (
          <div
            key={i}
            className="flex flex-col gap-1 p-2.5 rounded-lg bg-white/[0.03] border border-[var(--border-subtle)]"
          >
            <div className="flex items-center gap-2 text-sm">
              <span className="diff-removed font-mono text-xs">
                {change.original}
              </span>
              <ArrowRight className="w-3 h-3 text-[var(--text-muted)] flex-shrink-0" />
              <span className="diff-added font-mono text-xs">
                {change.replacement}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {change.reason}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
