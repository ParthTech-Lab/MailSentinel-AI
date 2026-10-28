import React, { useState } from 'react';
import { SuspiciousIndicator } from '../../types';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface HighlightedEmailViewerProps {
  body: string;
  indicators: SuspiciousIndicator[];
}

export const HighlightedEmailViewer: React.FC<HighlightedEmailViewerProps> = ({
  body,
  indicators,
}) => {
  const [highlightEnabled, setHighlightEnabled] = useState(true);

  // Collect all genuine evidence snippets
  const evidenceSnippets = Array.from(
    new Set(
      indicators
        .flatMap((ind) => ind.evidence || [])
        .map((ev) => ev.trim())
        .filter((ev) => ev.length > 2)
    )
  );

  // Render highlighted text while strictly preserving original content
  const renderHighlightedContent = () => {
    if (!highlightEnabled || evidenceSnippets.length === 0) {
      return (
        <pre className="font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200">
          {body}
        </pre>
      );
    }

    // Build regex pattern matching any evidence snippet safely
    const escaped = evidenceSnippets
      .map((ev) => ev.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');

    if (!escaped) {
      return (
        <pre className="font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200">
          {body}
        </pre>
      );
    }

    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = body.split(regex);

    return (
      <pre className="font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200">
        {parts.map((part, i) => {
          const isMatch = evidenceSnippets.some(
            (ev) => ev.toLowerCase() === part.toLowerCase()
          );

          if (isMatch) {
            return (
              <mark
                key={i}
                className="bg-rose-500/25 dark:bg-rose-500/30 text-rose-800 dark:text-rose-200 px-1 py-0.5 rounded border border-rose-500/40 font-semibold"
                title="Suspicious threat evidence token"
              >
                {part}
              </mark>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </pre>
    );
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-navy-800 bg-slate-50/70 dark:bg-navy-950/60 p-4 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-navy-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Email Content Inspector
          </span>
          {evidenceSnippets.length > 0 ? (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
              {evidenceSnippets.length} threat anchors flagged
            </span>
          ) : (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> No suspicious tokens detected
            </span>
          )}
        </div>

        {evidenceSnippets.length > 0 && (
          <button
            type="button"
            onClick={() => setHighlightEnabled(!highlightEnabled)}
            className="inline-flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 hover:underline"
          >
            {highlightEnabled ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{highlightEnabled ? 'Hide Highlights' : 'Highlight Evidence'}</span>
          </button>
        )}
      </div>

      <div className="max-h-64 overflow-y-auto pr-2">
        {renderHighlightedContent()}
      </div>

      {evidenceSnippets.length > 0 && highlightEnabled && (
        <div className="pt-2 border-t border-slate-200 dark:border-navy-800 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="w-2.5 h-2.5 rounded bg-rose-500/30 border border-rose-500/50 inline-block" />
          <span>Highlighted sections represent exact terms flagged by the rule-based explainability engine.</span>
        </div>
      )}
    </div>
  );
};

