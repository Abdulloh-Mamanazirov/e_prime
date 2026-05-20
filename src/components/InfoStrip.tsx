"use client";

import { getToBeFormsReference } from "@/lib/eprime";
import { useStore } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function InfoStrip() {
  const { showInfoStrip, toggleInfoStrip } = useStore();
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
          <div className="info-strip mx-4 sm:mx-6 mt-4 px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                &quot;To Be&quot; Forms — These violate E-Prime
              </h3>
              <button
                onClick={toggleInfoStrip}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
