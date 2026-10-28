import React from 'react';
import { ThreatVerdict, ModelPredictedLabel } from '../../types';

interface BadgeProps {
  verdict: ThreatVerdict | ModelPredictedLabel;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ verdict, size = 'md' }) => {
  // Normalize label
  const normalizedKey = verdict === 'clean' ? 'safe' : verdict;

  const styles: Record<string, string> = {
    safe: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    clean: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    spam: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    phishing: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    suspicious: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    pending: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
  };

  const labels: Record<string, string> = {
    safe: 'Safe / Legitimate',
    clean: 'Safe / Legitimate',
    spam: 'Spam Detected',
    phishing: 'Phishing / Malicious',
    suspicious: 'Suspicious Heuristics',
    pending: 'Analyzing Email',
  };

  const currentStyle = styles[normalizedKey] || styles.pending;
  const currentLabel = labels[normalizedKey] || 'Classifying';
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${currentStyle} ${sizeClass}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
      {currentLabel}
    </span>
  );
};
