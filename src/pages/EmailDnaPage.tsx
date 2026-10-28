import React, { useState, useEffect } from 'react';
import { Dna, Binary, Layers, ShieldAlert } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';
import { getScanHistory } from '../services/historyStorage';
import { EmailAnalyzeResponse } from '../types';

export const EmailDnaPage: React.FC = () => {
  const [history, setHistory] = useState<EmailAnalyzeResponse[]>([]);
  const [selectedScan, setSelectedScan] = useState<EmailAnalyzeResponse | null>(null);

  useEffect(() => {
    const items = getScanHistory();
    setHistory(items);
    if (items.length > 0) {
      setSelectedScan(items[0]);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-navy-800">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Dna className="w-5 h-5 text-teal-500" />
              <span>Email DNA & Structural Fingerprint Profiler</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Deconstructs email payloads into normalized feature n-grams, link syntax traits, and cluster signatures.
            </p>
          </div>

          {history.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Select Scan:</span>
              <select
                value={selectedScan?.id || ''}
                onChange={(e) => {
                  const match = history.find((h) => h.id === e.target.value);
                  if (match) setSelectedScan(match);
                }}
                className="text-xs font-mono bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
              >
                {history.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.id} — {h.subject ? h.subject.slice(0, 30) + '...' : '(No Subject)'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {history.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={<Dna className="w-8 h-8" />}
              title="No DNA Signatures Indexed in Local Session"
              description="Analyze an email using the Single Email Analyzer with local history enabled to inspect its structural DNA fingerprint."
            />
          </div>
        ) : selectedScan ? (
          <div className="mt-6 space-y-6">
            {/* Selected Item Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Fingerprint Hash</span>
                <span className="font-mono text-sm font-bold text-teal-500">
                  {selectedScan.fingerprint?.fingerprint_hash || 'Unassigned'}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Scam Cluster Pattern</span>
                <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {selectedScan.fingerprint?.cluster_pattern || 'unclassified'}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Verdict</span>
                <div className="mt-0.5">
                  <Badge verdict={selectedScan.predicted_label} size="sm" />
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Estimated Confidence</span>
                <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                  {selectedScan.confidence_score.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Normalized Feature Vector Chips */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Normalized DNA Traits ({selectedScan.fingerprint?.normalized_features?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedScan.fingerprint?.normalized_features?.map((trait, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-mono px-2.5 py-1 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/20"
                  >
                    {trait}
                  </span>
                )) || <span className="text-xs text-slate-500">No normalized traits</span>}
              </div>
            </div>

            {/* Linguistic Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 space-y-1">
                <span className="text-xs text-slate-400">Total Word Count</span>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                  {String(selectedScan.extracted_features?.word_count || 0)}
                </div>
                <p className="text-[11px] text-slate-500">Lexical token density</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 space-y-1">
                <span className="text-xs text-slate-400">Extracted Hyperlinks</span>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                  {String(selectedScan.inspected_links?.length || 0)}
                </div>
                <p className="text-[11px] text-slate-500">Static syntactic link count</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 space-y-1">
                <span className="text-xs text-slate-400">Rule-Based Threat Anchors</span>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                  {String(selectedScan.indicators?.length || 0)}
                </div>
                <p className="text-[11px] text-slate-500">Urgency, credential & brand triggers</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Structural Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
          <div className="flex items-center gap-2 text-teal-500 mb-2">
            <Binary className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Non-Sensitive Hashing</h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Computes deterministic SHA-256 fingerprints solely from token count tiers and threat indicators rather than storing raw private email bodies.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
          <div className="flex items-center gap-2 text-teal-500 mb-2">
            <Layers className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Cluster Matching</h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Groups identical attack campaigns (such as repeated PayPal suspensions or fake DocuSign memos) across disparate sending addresses.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
          <div className="flex items-center gap-2 text-teal-500 mb-2">
            <ShieldAlert className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Local Privacy Scope</h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Stored in browser local storage. Never synchronizes to public threat clouds without explicit enterprise threat intelligence connectors.
          </p>
        </div>
      </div>
    </div>
  );
};
