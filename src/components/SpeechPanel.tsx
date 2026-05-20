"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useStore } from "@/store/useStore";
import { SpeechManager } from "@/lib/speech";
import { calculateScore } from "@/lib/eprime";
import { Mic, MicOff, Trash2 } from "lucide-react";
import ScoreMeter from "./ScoreMeter";
import DiffView from "./DiffView.tsx";
import ChangesLog from "./ChangesLog.tsx";

export default function SpeechPanel() {
  const {
    isListening,
    setIsListening,
    interimText,
    setInterimText,
    utterances,
    addUtterance,
    updateUtterance,
    clearUtterances,
    explanationMode,
    addToHistory,
  } = useStore();

  const speechRef = useRef<SpeechManager | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isBrowserSupported, setIsBrowserSupported] = useState(false);

  const translateUtterance = useCallback(
    async (id: string, text: string) => {
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (!res.ok) throw new Error("Translation failed");

        const data = await res.json();
        const score = calculateScore(data.translated);

        updateUtterance(id, {
          translated: data.translated,
          changes: data.changes || [],
          score,
          isTranslating: false,
        });

        addToHistory({
          id,
          originalText: text,
          translatedText: data.translated,
          score,
          timestamp: Date.now(),
          changes: data.changes || [],
        });
      } catch {
        updateUtterance(id, {
          translated: "[Translation failed]",
          isTranslating: false,
          score: 0,
        });
      }
    },
    [updateUtterance, addToHistory]
  );

  useEffect(() => {
    speechRef.current = new SpeechManager({
      onInterim: (text) => {
        setInterimText(text);
      },
      onFinal: (text) => {
        setInterimText("");
        const id = `utt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        addUtterance({
          id,
          original: text,
          translated: "",
          changes: [],
          score: 0,
          timestamp: Date.now(),
          isTranslating: true,
        });
        translateUtterance(id, text);
      },
      onError: (error) => {
        console.error(error);
      },
      onStatusChange: (listening) => {
        setIsListening(listening);
      },
    });

    return () => {
      speechRef.current?.stop();
    };
  }, [setInterimText, addUtterance, setIsListening, translateUtterance]);

  // Check browser support after mount to avoid hydration mismatch
  useEffect(() => {
    setIsBrowserSupported(SpeechManager.isSupported());
  }, []);

  // Auto-scroll to bottom when new utterances appear
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [utterances, interimText]);

  const toggleMic = () => {
    if (isListening) {
      speechRef.current?.stop();
    } else {
      speechRef.current?.start();
    }
  };

  const overallScore =
    utterances.length > 0 && utterances.some((u) => !u.isTranslating)
      ? Math.round(
          utterances
            .filter((u) => !u.isTranslating)
            .reduce((sum, u) => sum + u.score, 0) /
            utterances.filter((u) => !u.isTranslating).length
        )
      : 100;

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Controls Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Mic Button */}
          <button
            onClick={toggleMic}
            disabled={!isBrowserSupported}
            className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
              isListening
                ? "bg-gradient-to-br from-[var(--accent-emerald)] to-[var(--accent-cyan)] mic-active"
                : "bg-white/10 hover:bg-white/15 border border-[var(--border-subtle)]"
            } ${!isBrowserSupported ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
            title={isListening ? "Stop listening" : "Start listening"}
          >
            {isListening ? (
              <Mic className="w-6 h-6 text-[var(--bg-primary)]" />
            ) : (
              <MicOff className="w-6 h-6 text-[var(--text-secondary)]" />
            )}
          </button>

          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {isListening ? "Listening..." : "Click to start"}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {isListening
                ? "Speak naturally — translations appear automatically"
                : !isBrowserSupported
                ? "Use Chrome or Edge for speech"
                : "Microphone stays on until you stop it"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {utterances.length > 0 && (
            <button
              onClick={clearUtterances}
              className="btn-secondary !py-2 !px-3 text-sm flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
          {utterances.length > 0 && <ScoreMeter score={overallScore} size={56} />}
        </div>
      </div>

      {/* Utterance Log */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 min-h-[300px] max-h-[60vh]"
      >
        {utterances.length === 0 && !interimText && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Mic className="w-7 h-7 text-[var(--text-muted)]" />
            </div>
            <p className="text-[var(--text-secondary)] text-sm">
              Press the microphone button and start speaking
            </p>
            <p className="text-[var(--text-muted)] text-xs mt-1">
              Each sentence will automatically translate into E-Prime
            </p>
          </div>
        )}

        {utterances.map((utt) => (
          <div key={utt.id} className="glass-card p-4 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Original */}
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1.5 block">
                  Original
                </span>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {utt.original}
                </p>
              </div>

              {/* Translated */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--accent-emerald)]">
                    E-Prime
                  </span>
                  {!utt.isTranslating && (
                    <span
                      className={`text-[10px] font-bold ${
                        utt.score >= 80
                          ? "text-[var(--accent-emerald)]"
                          : utt.score >= 50
                          ? "text-[var(--accent-yellow)]"
                          : "text-[var(--accent-red)]"
                      }`}
                    >
                      {utt.score}%
                    </span>
                  )}
                </div>
                {utt.isTranslating ? (
                  <div className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
                    <span>Translating</span>
                    <span className="flex gap-0.5">
                      <span className="loading-dot w-1 h-1 rounded-full bg-[var(--accent-emerald)] inline-block" />
                      <span className="loading-dot w-1 h-1 rounded-full bg-[var(--accent-emerald)] inline-block" />
                      <span className="loading-dot w-1 h-1 rounded-full bg-[var(--accent-emerald)] inline-block" />
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                    {utt.translated}
                  </p>
                )}
              </div>
            </div>

            {/* Diff & Changes */}
            {!utt.isTranslating && utt.changes.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
                <DiffView original={utt.original} translated={utt.translated} />
                {explanationMode && (
                  <ChangesLog changes={utt.changes} />
                )}
              </div>
            )}
          </div>
        ))}

        {/* Interim text (live) */}
        {interimText && (
          <div className="glass-card p-4 border-[var(--accent-emerald)]/30">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--accent-cyan)] mb-1.5 block">
              Listening...
            </span>
            <p className="text-sm text-[var(--text-secondary)] italic">
              {interimText}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
