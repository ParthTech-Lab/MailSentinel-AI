import React, { useState, useEffect } from 'react';
import { History, Download, Trash2, Search, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmailAnalyzeResponse } from '../types';
import { getScanHistory, clearScanHistory } from '../services/historyStorage';
import { SecurityEvidenceReportModal } from '../components/common/SecurityEvidenceReportModal';

export const ScanHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<EmailAnalyzeResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [verdictFilter, setVerdictFilter] = useState<string>('all');
  const [selectedScanForReport, setSelectedScanForReport] = useState<EmailAnalyzeResponse | null>(null);

  const loadHistory = () => {
    setHistory(getScanHistory());
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handlePurge = () => {
    if (window.confirm('Are you sure you want to purge all locally saved scan history? This action cannot be undone.')) {
      clearScanHistory();
      setHistory([]);
    }
  };

  const handleExportAll = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MailSentinel_Audit_Log_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      (item.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sender || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.fingerprint?.fingerprint_hash || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (verdictFilter === 'all') return true;
    if (verdictFilter === 'uncertain') return item.uncertainty?.is_uncertain === true;
    return item.predicted_label === verdictFilter;
  });

  return (
    <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-navy-800">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-teal-500" />
            <span>Audit & Scan History</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Opt-in session records with threat fingerprints and evidence summaries.
          </p>
        </div>

        {history.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExportAll}
            >
              Export JSON
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={handlePurge}
            >
              Purge History
            </Button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      {history.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by subject, sender, transaction ID, or fp_ hash..."
              className="w-full pl-9 pr-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500">Filter:</span>
            <select
              value={verdictFilter}
              onChange={(e) => setVerdictFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-lg px-2.5 py-2 text-slate-900 dark:text-white"
            >
              <option value="all">All Records ({history.length})</option>
              <option value="phishing">Phishing Threats</option>
              <option value="spam">Spam Lures</option>
              <option value="safe">Safe / Legitimate</option>
              <option value="uncertain">Uncertain Guard Flags</option>
            </select>
          </div>
        </div>
      )}

      {/* Records Table or Empty State */}
      {history.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={<History className="w-7 h-7" />}
            title="Scan History Empty"
            description="No email analyses have been recorded in this session. Enable 'Save scan summary' on the Scan Email page to save opt-in records."
          />
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          No records match your filter query.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-navy-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Timestamp / ID</th>
                <th className="py-3 px-3">Subject & Sender</th>
                <th className="py-3 px-3">Verdict</th>
                <th className="py-3 px-3">Uncertainty</th>
                <th className="py-3 px-3">Fingerprint</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
              {filteredHistory.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40 transition-colors"
                >
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                    <div>{new Date(item.timestamp).toLocaleDateString()}</div>
                    <div className="text-[10px] text-slate-400">{item.id}</div>
                  </td>

                  <td className="py-3 px-3 max-w-xs">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                      {item.subject || '(No Subject)'}
                    </div>
                    <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {item.sender || 'Sender not specified'}
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <Badge verdict={item.predicted_label} size="sm" />
                    <span className="block font-mono text-[10px] text-slate-400 mt-0.5">
                      {item.confidence_score.toFixed(1)}%
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    {item.uncertainty?.is_uncertain ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        <AlertTriangle className="w-3 h-3" /> Uncertain
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                        <CheckCircle2 className="w-3 h-3" /> Decisive
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 font-mono text-[11px] text-teal-500">
                    <div>{item.fingerprint?.fingerprint_hash || 'fp_none'}</div>
                    <div className="text-[10px] text-slate-400">
                      {item.fingerprint?.cluster_pattern || 'standard'}
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<FileText className="w-3 h-3" />}
                      onClick={() => setSelectedScanForReport(item)}
                    >
                      Dossier
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Security Evidence Report Modal */}
      {selectedScanForReport && (
        <SecurityEvidenceReportModal
          scan={selectedScanForReport}
          onClose={() => setSelectedScanForReport(null)}
        />
      )}
    </div>
  );
};
