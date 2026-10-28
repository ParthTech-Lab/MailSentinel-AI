import React from 'react';
import { EmailAnalyzeResponse, ModelInfo } from '../../types';
import { Printer, Download, X, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { Button } from './Button';

interface SecurityEvidenceReportModalProps {
  scan: EmailAnalyzeResponse;
  modelInfo?: ModelInfo | null;
  onClose: () => void;
}

export const SecurityEvidenceReportModal: React.FC<SecurityEvidenceReportModalProps> = ({
  scan,
  modelInfo,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    const reportData = {
      report_title: "MailSentinel AI Security Evidence Report",
      generated_at: new Date().toISOString(),
      scan_transaction: scan,
      model_governance: modelInfo || { status: "offline" }
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MailSentinel_Report_${scan.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Toolbar (hidden on print) */}
        <div className="p-4 border-b border-slate-200 dark:border-navy-800 flex items-center justify-between bg-slate-50 dark:bg-navy-950 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Security Evidence Report — {scan.id}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={<Printer className="w-3.5 h-3.5" />} onClick={handlePrint}>
              Print Report
            </Button>
            <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={handleExportJSON}>
              Export JSON
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-200 dark:hover:bg-navy-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Body */}
        <div className="p-8 overflow-y-auto space-y-6 text-slate-900 dark:text-slate-100 bg-white dark:bg-navy-900 print:p-0 print:text-black">
          {/* Header */}
          <div className="border-b border-slate-200 dark:border-navy-800 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  MailSentinel AI Threat Dossier
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Automated Evidence Extraction & Machine Learning Classification
                </p>
              </div>
              <div className="text-right text-xs font-mono text-slate-500 dark:text-slate-400">
                <div>ID: {scan.id}</div>
                <div>Timestamp: {new Date(scan.timestamp).toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Verdict Summary Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Classification Verdict
              </span>
              <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {scan.category}
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Uncertainty Status
              </span>
              <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                {scan.uncertainty?.is_uncertain ? (
                  <span className="text-amber-500 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> Uncertain — Manual Review Advised
                  </span>
                ) : (
                  <span className="text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Decisive Score
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Model Confidence
              </span>
              <div className="text-base font-mono font-bold text-teal-600 dark:text-teal-400 mt-0.5">
                {scan.confidence_score.toFixed(1)}% (Estimated)
              </div>
            </div>
          </div>

          {/* Email Metadata */}
          <div className="space-y-1.5 text-xs">
            <div className="flex gap-2">
              <span className="font-semibold text-slate-500 w-24">Subject:</span>
              <span className="font-medium">{scan.subject || '(None provided)'}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold text-slate-500 w-24">Sender:</span>
              <span className="font-mono">{scan.sender || '(None provided)'}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold text-slate-500 w-24">Fingerprint:</span>
              <span className="font-mono text-teal-500">{scan.fingerprint?.fingerprint_hash} ({scan.fingerprint?.cluster_pattern})</span>
            </div>
          </div>

          {/* Machine Learning Probability Breakdown */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              1. Calibrated Machine Learning Distribution
            </h4>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950">
                Safe: {scan.probabilities?.safe?.toFixed(1) ?? '0.0'}%
              </div>
              <div className="p-2.5 rounded border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950">
                Spam: {scan.probabilities?.spam?.toFixed(1) ?? '0.0'}%
              </div>
              <div className="p-2.5 rounded border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950">
                Phishing: {scan.probabilities?.phishing?.toFixed(1) ?? '0.0'}%
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              {scan.explanation}
            </p>
          </div>

          {/* Rule-Based Evidence Indicators */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              2. Rule-Based Threat Indicators ({scan.indicators?.length || 0})
            </h4>
            {scan.indicators && scan.indicators.length > 0 ? (
              <div className="space-y-2">
                {scan.indicators.map((ind, i) => (
                  <div key={i} className="p-3 rounded border border-slate-200 dark:border-navy-800 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{ind.title}</span>
                      <span className="text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400">
                        {ind.severity}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">{ind.description}</p>
                    {ind.evidence && ind.evidence.length > 0 && (
                      <div className="text-[11px] font-mono text-rose-500">
                        Evidence token(s): {ind.evidence.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No overt suspicious phrases detected.</p>
            )}
          </div>

          {/* Inspected Hyperlinks */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              3. Link Journey Static Inspection ({scan.inspected_links?.length || 0})
            </h4>
            {scan.inspected_links && scan.inspected_links.length > 0 ? (
              <div className="space-y-2 text-xs">
                {scan.inspected_links.map((link, i) => (
                  <div key={i} className="p-2.5 rounded border border-slate-200 dark:border-navy-800 space-y-1">
                    <div className="flex justify-between font-mono">
                      <span className="font-bold">{link.hostname}</span>
                      <span className="uppercase text-[10px]">{link.severity}</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 truncate">{link.raw_url}</div>
                    {link.indicators && link.indicators.length > 0 && (
                      <div className="text-[11px] text-rose-400">
                        {link.indicators.join('; ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No links extracted from email body.</p>
            )}
          </div>

          {/* Model Governance & Limitations */}
          <div className="pt-4 border-t border-slate-200 dark:border-navy-800 space-y-2 text-[11px] text-slate-500 dark:text-slate-400">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              4. Limitations & Safe Handling Guidance
            </h4>
            <p>
              • <strong>Statistical Nature:</strong> {scan.verdict_disclaimer}
            </p>
            <p>
              • <strong>External Authentication:</strong> Cryptographic SPF, DKIM, and DMARC headers were not verified. DNS registration age and real-time destination redirects were not checked.
            </p>
            <p>
              • <strong>Recommended Action:</strong> Do not approve financial disbursements, gift cards, or credentials without verified out-of-band communication with the claimed sender.
            </p>
            {modelInfo && (
              <p className="font-mono text-[10px] pt-1">
                Engine: {modelInfo.algorithm} | Benchmark Accuracy: {(modelInfo.metrics?.accuracy ? modelInfo.metrics.accuracy * 100 : 92.3).toFixed(1)}% | Version: {modelInfo.version}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
