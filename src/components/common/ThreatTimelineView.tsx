import React from 'react';
import { ThreatTimelineStep } from '../../types';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

interface ThreatTimelineViewProps {
  timeline: ThreatTimelineStep[];
}

export const ThreatTimelineView: React.FC<ThreatTimelineViewProps> = ({ timeline }) => {
  if (!timeline || timeline.length === 0) return null;

  const totalDuration = timeline.reduce((acc, step) => acc + (step.duration_ms || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-navy-800">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-teal-500" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Threat Story Timeline ({timeline.length} Execution Stages)
          </h4>
        </div>
        <span className="text-[11px] font-mono text-teal-500 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
          Total: {totalDuration.toFixed(1)}ms
        </span>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-navy-800">
        {timeline.map((step) => {
          const isFlagged = step.status === 'flagged';
          const isFailed = step.status === 'failed';

          return (
            <div key={step.step_number} className="relative">
              {/* Dot Icon */}
              <div
                className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white ${
                  isFailed
                    ? 'bg-rose-500'
                    : isFlagged
                    ? 'bg-amber-500'
                    : 'bg-teal-500'
                }`}
              >
                {isFailed ? (
                  <XCircle className="w-3 h-3" />
                ) : isFlagged ? (
                  <AlertTriangle className="w-3 h-3" />
                ) : (
                  <CheckCircle2 className="w-3 h-3" />
                )}
              </div>

              <div className="bg-slate-50 dark:bg-navy-950 p-3 rounded-lg border border-slate-200 dark:border-navy-800 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {step.step_number}. {step.name}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {step.duration_ms.toFixed(1)}ms
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  {step.details}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

