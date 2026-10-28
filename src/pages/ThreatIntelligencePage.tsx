import React, { useState, useEffect } from 'react';
import { Radio, Search, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/common/Button';
import { getScanHistory } from '../services/historyStorage';
import { EmailAnalyzeResponse } from '../types';

export const ThreatIntelligencePage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [testResult, setTestResult] = useState<{
    query: string;
    verdict: string;
    details: string;
    isSuspicious: boolean;
  } | null>(null);

  const [history, setHistory] = useState<EmailAnalyzeResponse[]>([]);

  useEffect(() => {
    setHistory(getScanHistory());
  }, []);

  // Collect flagged domains and IPs from actual session scans
  const sessionFlaggedDomains = Array.from(
    new Set(
      history
        .flatMap((h) => h.inspected_links || [])
        .filter((l) => l.severity === 'critical' || l.severity === 'high')
        .map((l) => l.hostname)
    )
  );

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const q = query.toLowerCase().trim();
    // Rule check
    const isIp = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(q);
    const hasLookalike = /paypa[1l]|micr[o0]s[o0]ft|g[o0]{2}gle|netf[1l]ix|amaz[o0]n|app[1l]e/.test(q);
    const isRiskyTld = /\.xyz$|\.top$|\.cc$|\.tk$|\.buzz$/.test(q);

    if (isIp) {
      setTestResult({
        query,
        verdict: 'High-Risk Direct IP Host',
        details: 'Numerical IPv4 address detected. Commonly abused in transient credential phishing gateways without domain registration.',
        isSuspicious: true,
      });
    } else if (hasLookalike) {
      setTestResult({
        query,
        verdict: 'Typosquatting / Lookalike Indicator',
        details: 'Domain employs character substitution matching high-value target brand names.',
        isSuspicious: true,
      });
    } else if (isRiskyTld) {
      setTestResult({
        query,
        verdict: 'Suspicious High-Abuse TLD',
        details: 'Top-level domain matches registries frequently utilized by bulk automated spam and disposable phishing kits.',
        isSuspicious: true,
      });
    } else {
      setTestResult({
        query,
        verdict: 'No Syntactic Risk Flagged',
        details: 'Host does not match known local lookalike signatures. Note: External live blacklist connectors are on standby.',
        isSuspicious: false,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-navy-800">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-teal-500" />
              <span>Threat Intelligence Feeds & IOC Explorer</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Examine indicators of compromise (IOCs), lookalike domain patterns, and feed connector status.
            </p>
          </div>
          <span className="text-xs font-mono text-teal-500 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20">
            Local Heuristic Engine: Active
          </span>
        </div>

        {/* Interactive IOC Quick Lookup */}
        <div className="mt-6 max-w-2xl">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Quick Domain / IP Syntactic Query
          </label>
          <form onSubmit={handleLookup} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. paypa1-verification.xyz or 192.168.1.100"
                className="w-full pl-9 pr-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
              />
            </div>
            <Button type="submit" variant="primary" size="sm">
              Inspect Host
            </Button>
          </form>

          {/* Test Result Display */}
          {testResult && (
            <div
              className={`mt-3 p-3.5 rounded-lg border text-xs space-y-1 ${
                testResult.isSuspicious
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {testResult.isSuspicious ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                <span>{testResult.verdict} — {testResult.query}</span>
              </div>
              <p className="text-[11px] opacity-90">{testResult.details}</p>
            </div>
          )}
        </div>
      </div>

      {/* External Feeds & Connectors Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            name: 'PhishTank Community Feed',
            source: 'OpenPhish / Community',
            status: 'Standby / Unconfigured',
            desc: 'Real-time database of confirmed community-submitted phishing targets.',
          },
          {
            name: 'Spamhaus DBL',
            source: 'The Spamhaus Project',
            status: 'Standby / Unconfigured',
            desc: 'Reputation list of domains suspected of spamming or hosting cyber threats.',
          },
          {
            name: 'abuse.ch URLhaus',
            source: 'abuse.ch Project',
            status: 'Standby / Unconfigured',
            desc: 'Database of verified malicious URLs used for malware distribution.',
          },
        ].map((feed, i) => (
          <div
            key={i}
            className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">{feed.name}</span>
              <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-navy-800">
                {feed.status}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{feed.desc}</p>
            <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-100 dark:border-navy-800">
              Source: {feed.source}
            </div>
          </div>
        ))}
      </div>

      {/* Session IOC Extract */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-6 shadow-sm space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Suspicious Indicators Flagged in Your Session ({sessionFlaggedDomains.length})
        </h4>

        {sessionFlaggedDomains.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">
            No critical or high-risk domain IOCs have been encountered in your session scans yet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sessionFlaggedDomains.map((dom, idx) => (
              <span
                key={idx}
                className="text-xs font-mono px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3 h-3" />
                {dom}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
