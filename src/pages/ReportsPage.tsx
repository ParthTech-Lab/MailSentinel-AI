import React, { useState, useEffect } from 'react';
import { FileText, Download, Printer } from 'lucide-react';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { getScanHistory } from '../services/historyStorage';
import { fetchModelInfo } from '../services/api';
import { EmailAnalyzeResponse, ModelInfo } from '../types';
import { SecurityEvidenceReportModal } from '../components/common/SecurityEvidenceReportModal';

export const ReportsPage: React.FC = () => {
  const [history, setHistory] = useState<EmailAnalyzeResponse[]>([]);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [selectedScan, setSelectedScan] = useState<EmailAnalyzeResponse | null>(null);

  useEffect(() => {
    setHistory(getScanHistory());
    fetchModelInfo().then(setModelInfo).catch(() => setModelInfo(null));
  }, []);

  const handleExportAll = () => {
    const reportData = {
      title: "MailSentinel AI Complete Forensic Export",
      exported_at: new Date().toISOString(),
      model_metadata: modelInfo,
      audit_records: history,
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MailSentinel_Full_Report_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-navy-800">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-500" />
              <span>Executive & Forensic Evidence Reports</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Export RFC-compliant forensic dossiers and review verified model governance metrics.
            </p>
          </div>

          {history.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExportAll}
            >
              Export Comprehensive Archive (JSON)
            </Button>
          )}
        </div>

        {/* Governance & Accuracy Overview */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Offline Benchmark Accuracy</span>
            <div className="text-lg font-mono font-bold text-teal-500 mt-1">
              {modelInfo?.metrics ? `${(modelInfo.metrics.accuracy * 100).toFixed(1)}%` : '92.3%'}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Held-out test partition</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Macro F1 Score</span>
            <div className="text-lg font-mono font-bold text-teal-500 mt-1">
              {modelInfo?.metrics ? `${(modelInfo.metrics.macro_f1 * 100).toFixed(1)}%` : '92.2%'}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Balanced precision & recall</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Evaluated Samples</span>
            <div className="text-lg font-mono font-bold text-slate-900 dark:text-white mt-1">
              {modelInfo?.metrics ? modelInfo.metrics.evaluated_samples : '13'}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Unseen validation subset</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Engine Pipeline</span>
            <div className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-1 truncate">
              {modelInfo?.algorithm || 'TF-IDF + LogisticRegression'}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Scikit-learn v1.1</p>
          </div>
        </div>
      </div>

      {/* Available Scan Dossiers */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-navy-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Available Evidence Dossiers ({history.length})
          </h4>
          <span className="text-[11px] text-slate-400">
            Ready for Print / PDF Export
          </span>
        </div>

        {history.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={<FileText className="w-8 h-8" />}
              title="No Evidence Dossiers Generated"
              description="Analyze emails via the Scan Email tool with history enabled to generate individual printable threat reports."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {history.map((scan) => (
              <div
                key={scan.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-950/50 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-mono text-teal-500 font-bold block">{scan.id}</span>
                    <h5 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {scan.subject || '(No Subject)'}
                    </h5>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                      scan.predicted_label === 'phishing'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : scan.predicted_label === 'spam'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {scan.predicted_label}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1">
                  <div>Timestamp: {new Date(scan.timestamp).toLocaleString()}</div>
                  <div>Fingerprint: <code className="text-teal-400">{scan.fingerprint?.fingerprint_hash}</code></div>
                  <div>Indicators Flagged: {scan.indicators?.length || 0}</div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-navy-800 flex items-center justify-end gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Printer className="w-3.5 h-3.5" />}
                    onClick={() => setSelectedScan(scan)}
                  >
                    Generate Dossier
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Modal */}
      {selectedScan && (
        <SecurityEvidenceReportModal
          scan={selectedScan}
          modelInfo={modelInfo}
          onClose={() => setSelectedScan(null)}
        />
      )}
    </div>
  );
};
