"use client";

import { useCallback, useRef } from "react";
import { useStore } from "@/store/useStore";
import { calculateScore } from "@/lib/eprime";
import { Upload, Sparkles, Download } from "lucide-react";
import ScoreMeter from "./ScoreMeter";
import DiffView from "./DiffView";
import ChangesLog from "./ChangesLog";

export default function TextInputPanel() {
  const {
    inputText,
    setInputText,
    translatedText,
    setTranslatedText,
    textChanges,
    setTextChanges,
    textScore,
    setTextScore,
    isTranslating,
    setIsTranslating,
    explanationMode,
    addToHistory,
  } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim() || isTranslating) return;

    setIsTranslating(true);
    setTranslatedText("");
    setTextChanges([]);

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText.trim() }),
      });

      if (!res.ok) throw new Error("Translation failed");

      const data = await res.json();
      const score = calculateScore(data.translated);

      setTranslatedText(data.translated);
      setTextChanges(data.changes || []);
      setTextScore(score);

      addToHistory({
        id: `txt-${Date.now()}`,
        originalText: inputText.trim(),
        translatedText: data.translated,
        score,
        timestamp: Date.now(),
        changes: data.changes || [],
      });
    } catch {
      setTranslatedText("[Translation failed. Please try again.]");
    } finally {
      setIsTranslating(false);
    }
  }, [
    inputText,
    isTranslating,
    setIsTranslating,
    setTranslatedText,
    setTextChanges,
    setTextScore,
    addToHistory,
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInputText(content);
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExport = () => {
    if (!translatedText) return;
    const blob = new Blob([translatedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eprime-translation-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleTranslate();
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Input Area */}
      <div className="glass-card p-4 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">
            Input Text
          </span>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary !py-1.5 !px-2.5 text-xs flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload .txt
            </button>
          </div>
        </div>

        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type or paste your text here... (Ctrl+Enter to translate)"
          className="flex-1 min-h-[180px] bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none border border-[var(--border-subtle)] rounded-lg p-3 focus:outline-none"
          spellCheck={false}
        />

        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-[var(--text-muted)]">
            {inputText.length > 0 && (
              <>
                {inputText.split(/\s+/).filter((w) => w.length > 0).length}{" "}
                words
              </>
            )}
          </p>
          <button
            onClick={handleTranslate}
            disabled={!inputText.trim() || isTranslating}
            className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isTranslating ? (
              <>
                <span className="flex gap-0.5">
                  <span className="loading-dot w-1.5 h-1.5 rounded-full bg-[var(--bg-primary)] inline-block" />
                  <span className="loading-dot w-1.5 h-1.5 rounded-full bg-[var(--bg-primary)] inline-block" />
                  <span className="loading-dot w-1.5 h-1.5 rounded-full bg-[var(--bg-primary)] inline-block" />
                </span>
                Translating
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Translate
                <kbd className="hidden sm:inline text-[10px] bg-black/20 px-1.5 py-0.5 rounded ml-1">
                  ⌘↵
                </kbd>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Output Area */}
      {(translatedText || isTranslating) && (
        <div className="glass-card p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--accent-emerald)]">
              E-Prime Translation
            </span>
            <div className="flex items-center gap-3">
              {translatedText && !isTranslating && (
                <>
                  <button
                    onClick={handleExport}
                    className="btn-secondary !py-1.5 !px-2.5 text-xs flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export .txt
                  </button>
                  <ScoreMeter score={textScore} size={48} />
                </>
              )}
            </div>
          </div>

          {isTranslating ? (
            <div className="flex items-center justify-center py-8 gap-2 text-[var(--text-muted)]">
              <span className="flex gap-1">
                <span className="loading-dot w-2 h-2 rounded-full bg-[var(--accent-emerald)] inline-block" />
                <span className="loading-dot w-2 h-2 rounded-full bg-[var(--accent-emerald)] inline-block" />
                <span className="loading-dot w-2 h-2 rounded-full bg-[var(--accent-emerald)] inline-block" />
              </span>
              <span className="text-sm">Translating with Gemini...</span>
            </div>
          ) : (
            <>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                {translatedText}
              </p>

              {textChanges.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                  <DiffView original={inputText} translated={translatedText} />
                  {explanationMode && <ChangesLog changes={textChanges} />}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
