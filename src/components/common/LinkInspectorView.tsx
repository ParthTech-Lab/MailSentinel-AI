import React from 'react';
import { UrlInspectionFinding } from '../../types';
import { Globe, AlertTriangle, ShieldCheck, Link2Off } from 'lucide-react';

interface LinkInspectorViewProps {
  links: UrlInspectionFinding[];
}

export const LinkInspectorView: React.FC<LinkInspectorViewProps> = ({ links }) => {
  if (!links || links.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-slate-200 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-950/40 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
        <Link2Off className="w-4 h-4 text-slate-400" />
        <span>No outbound hyperlinks or web addresses were extracted from the email text.</span>
      </div>
    );
  }

  const getSeverityBadge = (severity: UrlInspectionFinding['severity']) => {
    const config = {
      critical: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      high: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      low: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      clean: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    };
    return (
      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${config[severity]}`}>
        {severity}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-teal-500" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Link Journey Inspector ({links.length} URLs extracted)
          </h4>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          Safe Static Analysis
        </span>
      </div>

      <div className="space-y-2">
        {links.map((link, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm space-y-2"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white truncate">
                  {link.hostname}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400">
                  {link.scheme}://
                </span>
              </div>
              {getSeverityBadge(link.severity)}
            </div>

            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate bg-slate-50 dark:bg-navy-950 p-1.5 rounded border border-slate-200 dark:border-navy-800">
              {link.raw_url}
            </div>

            {link.indicators.length > 0 ? (
              <div className="space-y-1 pt-1">
                {link.indicators.map((ind, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-rose-500 dark:text-rose-400">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>{ind}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-emerald-500">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Standard syntactic structure. No overt host or typosquatting anomalies.</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-[10px] text-slate-400 italic">
        * Static URL syntax parsing only. Links are never fetched or navigated to. External redirect targets and domain reputation are not queried.
      </p>
    </div>
  );
};
