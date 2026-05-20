"use client";

import { diffWords } from "diff";

interface DiffViewProps {
  original: string;
  translated: string;
}

export default function DiffView({ original, translated }: DiffViewProps) {
  const diffs = diffWords(original, translated);

  return (
    <div className="mb-3">
      <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-2 block">
        Changes
      </span>
      <div className="text-sm leading-relaxed">
        {diffs.map((part, i) => {
          if (part.added) {
            return (
              <span key={i} className="diff-added">
                {part.value}
              </span>
            );
          }
          if (part.removed) {
            return (
              <span key={i} className="diff-removed">
                {part.value}
              </span>
            );
          }
          return (
            <span key={i} className="text-[var(--text-secondary)]">
              {part.value}
            </span>
          );
        })}
      </div>
    </div>
  );
}
