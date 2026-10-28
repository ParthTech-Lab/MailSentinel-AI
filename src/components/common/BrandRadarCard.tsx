import React from 'react';
import { BrandImpersonationFinding } from '../../types';
import { ShieldAlert, ShieldCheck, HelpCircle, Building } from 'lucide-react';

interface BrandRadarCardProps {
  finding?: BrandImpersonationFinding | null;
}

export const BrandRadarCard: React.FC<BrandRadarCardProps> = ({ finding }) => {
  if (!finding) {
    return (
      <div className="p-4 rounded-xl border border-slate-200 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-950/40 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
        <Building className="w-4 h-4 text-slate-400" />
        <span>No monitored corporate brand names were referenced in the message text.</span>
      </div>
    );
  }

  const isMismatch = finding.is_mismatch;
  const isUnverified = finding.confidence_assessment === 'unverified_sender';

  return (
    <div
      className={`p-4 rounded-xl border space-y-3 ${
        isMismatch
          ? 'bg-rose-500/5 border-rose-500/30'
          : isUnverified
          ? 'bg-amber-500/5 border-amber-500/30'
          : 'bg-emerald-500/5 border-emerald-500/30'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isMismatch ? (
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          ) : isUnverified ? (
            <HelpCircle className="w-4 h-4 text-amber-500" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          )}
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Brand Impersonation Radar: {finding.brand_name}
          </span>
        </div>

        <span
          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
            isMismatch
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              : isUnverified
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
          }`}
        >
          {finding.confidence_assessment.replace(/_/g, ' ')}
        </span>
      </div>

      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
        {finding.explanation}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
        <div className="p-2 rounded bg-white/60 dark:bg-navy-900/60 border border-slate-200 dark:border-navy-800">
          <span className="text-slate-400 block text-[10px]">Claimed Sender Domain:</span>
          <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
            {finding.sender_domain || '(None Provided by User)'}
          </span>
        </div>

        <div className="p-2 rounded bg-white/60 dark:bg-navy-900/60 border border-slate-200 dark:border-navy-800">
          <span className="text-slate-400 block text-[10px]">Known Official Domains:</span>
          <span className="font-mono font-medium text-teal-600 dark:text-teal-400">
            {finding.legitimate_domains.slice(0, 2).join(', ')}
          </span>
        </div>
      </div>
    </div>
  );
};

