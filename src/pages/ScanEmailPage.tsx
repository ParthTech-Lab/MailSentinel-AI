import React, { useState } from 'react';
import { 
  Send, 
  RotateCcw, 
  Sparkles, 
  FileSearch, 
  Fingerprint,
  AlertTriangle,
  ServerOff,
  Shield,
  FileText
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmailAnalyzeResponse, SuspiciousIndicator, ModelInfo } from '../types';
import { analyzeEmail, fetchModelInfo, API_BASE_URL } from '../services/api';
import { saveScanToHistory, findSimilarFingerprints } from '../services/historyStorage';

import { HighlightedEmailViewer } from '../components/common/HighlightedEmailViewer';
import { LinkInspectorView } from '../components/common/LinkInspectorView';
import { BrandRadarCard } from '../components/common/BrandRadarCard';
import { ThreatTimelineView } from '../components/common/ThreatTimelineView';
import { SecurityEvidenceReportModal } from '../components/common/SecurityEvidenceReportModal';

export const ScanEmailPage: React.FC = () => {
  const [sender, setSender] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [headers, setHeaders] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Privacy Shield options
  const [optInHistory, setOptInHistory] = useState(true);
  const [redactSensitive, setRedactSensitive] = useState(true);

  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<EmailAnalyzeResponse | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dna' | 'links' | 'brand' | 'timeline'>('dna');
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Load samples
  const loadPhishingSample = () => {
    setSender('security-update@paypa1-security-verification.com');
    setSubject('URGENT: Your account access has been restricted - Verify Identity Immediately');
    setBody(`Dear Customer,

We have detected suspicious activity on your account from an unrecognized IP address (192.0.2.14).
To prevent permanent suspension, you must verify your identity within 24 hours.

Click the official link below to reactivate your credentials:
http://paypa1-security-verification.com/login?token=89fbc741a0

Failure to do so will result in permanent ledger termination.
Security Team`);
    setResult(null);
    setErrorMessage(null);
  };

  const loadCleanSample = () => {
    setSender('notifications@github.com');
    setSubject('[GitHub] A personal access token has expired');
    setBody(`Hi @developer,

One of your personal access tokens (ghp_deploy_pipeline_key) has expired on October 28.
If this token is no longer in use, you can safely ignore this email.
To generate a new token or review your active developer credentials, visit your account settings at https://github.com/settings/tokens.

Thanks,
The GitHub Team`);
    setResult(null);
    setErrorMessage(null);
  };

  const loadSpamSample = () => {
    setSender('promotions@sweepstakes-jackpot-winner.xyz');
    setSubject('CONGRATULATIONS! You have been selected as our $5,000 Walmart Gift Card Winner!');
    setBody(`You are the lucky winner of our annual customer loyalty sweepstakes! Claim your $5,000 Walmart Gift Card immediately. No purchase necessary. Click here to confirm your shipping address and claim your 100% free reward.`);
    setResult(null);
    setErrorMessage(null);
  };

  const handleClear = () => {
    setSender('');
    setSubject('');
    setBody('');
    setHeaders('');
    setResult(null);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() && !subject.trim()) return;

    setIsScanning(true);
    setErrorMessage(null);
    setResult(null);

    try {
      // Real API call to FastAPI backend with privacy settings
      const data = await analyzeEmail({
        subject: subject.trim(),
        body: body.trim(),
        sender: sender.trim() || undefined,
        headers: headers.trim() || undefined,
        opt_in_history: optInHistory,
        redact_sensitive: redactSensitive,
      });

      setResult(data);

      // Save to local opt-in history if permitted
      if (optInHistory) {
        saveScanToHistory(data);
      }

      // Fetch model governance info for report export
      fetchModelInfo().then(setModelInfo).catch(() => {});
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : 'Unknown network error';
      setErrorMessage(
        `Unable to reach MailSentinel AI backend at ${API_BASE_URL}. ${errText}. Please ensure FastAPI is running (uvicorn backend.app.main:app).`
      );
    } finally {
      setIsScanning(false);
    }
  };

  const getSeverityBadge = (severity: SuspiciousIndicator['severity']) => {
    const config = {
      critical: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      high: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      low: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      info: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    };
    return (
      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${config[severity]}`}>
        {severity}
      </span>
    );
  };

  // Check for similar fingerprints in user's saved history
  const similarScans = result ? findSimilarFingerprints(result) : [];

  return (
    <div className="space-y-6">
      {/* Top Header & Sample Selectors */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Single Email Threat Analyzer
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            End-to-end inspection: Machine learning classification, Link Journey inspector, and Brand Radar.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadPhishingSample}>
            Phishing Sample
          </Button>
          <Button variant="outline" size="sm" onClick={loadSpamSample}>
            Spam Sample
          </Button>
          <Button variant="outline" size="sm" onClick={loadCleanSample}>
            Clean Sample
          </Button>
        </div>
      </div>

      {/* Backend Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3">
          <ServerOff className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-semibold text-rose-400">Backend Connection Error</div>
            <div className="text-rose-300/90">{errorMessage}</div>
            <div className="pt-1 text-[11px] text-slate-400 font-mono">
              To launch backend: <code className="text-teal-400">.\backend\venv\Scripts\python.exe -m uvicorn backend.app.main:app --port 8000</code>
            </div>
          </div>
        </div>
      )}

      {/* Main Analysis Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Inbound Inputs & Privacy Controls (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-6 shadow-sm space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Sender (From Header)
              </label>
              <input
                type="text"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="e.g. security-alert@accounts.google.com"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Subject Line
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Action Required: Account Notice"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Email Body Content
                </label>
                <span className="text-[11px] text-slate-400">
                  {body.length} characters
                </span>
              </div>
              <textarea
                rows={8}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Paste the raw or formatted email body text here..."
                required
                className="w-full px-3.5 py-2.5 rounded-lg text-sm font-mono bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Optional Raw Headers Accordion */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs font-medium text-teal-500 hover:text-teal-400 transition-colors"
              >
                {showAdvanced ? '- Hide Raw Headers' : '+ Add Optional Raw Email Headers'}
              </button>

              {showAdvanced && (
                <div className="mt-2">
                  <textarea
                    rows={4}
                    value={headers}
                    onChange={(e) => setHeaders(e.target.value)}
                    placeholder="Received: from mail.server.com... Authentication-Results: dkim=pass..."
                    className="w-full px-3.5 py-2 rounded-lg text-xs font-mono bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
              )}
            </div>

            {/* Privacy Shield Controls */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <Shield className="w-3.5 h-3.5 text-teal-500" />
                <span>Privacy Shield Controls</span>
              </div>
              
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={redactSensitive}
                  onChange={(e) => setRedactSensitive(e.target.checked)}
                  className="rounded border-slate-300 dark:border-navy-700 text-teal-500 focus:ring-teal-500"
                />
                <span>Redact payment cards, OTPs, & passwords in evidence</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={optInHistory}
                  onChange={(e) => setOptInHistory(e.target.checked)}
                  className="rounded border-slate-300 dark:border-navy-700 text-teal-500 focus:ring-teal-500"
                />
                <span>Save scan summary to local session history (Opt-in)</span>
              </label>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<RotateCcw className="w-3.5 h-3.5" />}
                onClick={handleClear}
              >
                Reset
              </Button>

              <Button
                type="submit"
                variant="primary"
                disabled={isScanning || (!body.trim() && !subject.trim())}
                icon={isScanning ? <Sparkles className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              >
                {isScanning ? 'Executing Pipeline...' : 'Classify Email'}
              </Button>
            </div>
          </form>
        </div>

        {/* Right Output: Detailed Intelligence & DNA Explorer (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            {/* Top Verdict Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-navy-800">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Threat Verdict
                </h3>
                {result && <Badge verdict={result.predicted_label} />}
              </div>

              {result && (
                <div className="flex items-center gap-2">
                  {/* AI Uncertainty Guard Indicator */}
                  {result.uncertainty?.is_uncertain ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Uncertain — Verify Manually
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/30">
                      Decisive Score
                    </span>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    icon={<FileText className="w-3.5 h-3.5" />}
                    onClick={() => setIsReportOpen(true)}
                  >
                    Evidence Report
                  </Button>
                </div>
              )}
            </div>

            {/* Empty State */}
            {!result && !isScanning && !errorMessage && (
              <div className="py-20 text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-navy-950 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-200 dark:border-navy-800">
                  <FileSearch className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Awaiting Inbound Email Payload
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Submit an email to run TF-IDF lexical tokenization, safe URL extraction, and brand impersonation radar checks.
                </p>
              </div>
            )}

            {/* Scanning State */}
            {isScanning && (
              <div className="py-20 text-center">
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto mb-3 border border-teal-500/20 animate-spin">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Executing Multi-Stage Threat Analysis...
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Parsing syntactic links, brand domains, and vector-space classification probabilities.
                </p>
              </div>
            )}

            {/* Result Presentation */}
            {result && !isScanning && (
              <div className="mt-4 space-y-4">
                {/* Confidence & Uncertainty Banner */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Model Confidence (Calibrated Estimate)
                      </span>
                      <div className="font-mono text-xl font-bold text-slate-900 dark:text-white">
                        {result.confidence_score.toFixed(1)}%
                      </div>
                    </div>

                    {/* Fingerprint Badge */}
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Scam Pattern Fingerprint
                      </span>
                      <span className="font-mono text-xs font-bold text-teal-500 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                        {result.fingerprint?.fingerprint_hash}
                      </span>
                    </div>
                  </div>

                  {/* Multi-Class Distribution */}
                  <div className="mt-3 space-y-1 text-[11px]">
                    <div className="text-slate-400 flex justify-between font-mono">
                      <span>Safe: {result.probabilities.safe?.toFixed(1) ?? '0.0'}%</span>
                      <span>Spam: {result.probabilities.spam?.toFixed(1) ?? '0.0'}%</span>
                      <span>Phishing: {result.probabilities.phishing?.toFixed(1) ?? '0.0'}%</span>
                    </div>
                    <div className="w-full flex h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-navy-800">
                      <div 
                        className="bg-emerald-500 h-full" 
                        style={{ width: `${result.probabilities.safe || 0}%` }} 
                        title="Safe Probability"
                      />
                      <div 
                        className="bg-amber-500 h-full" 
                        style={{ width: `${result.probabilities.spam || 0}%` }} 
                        title="Spam Probability"
                      />
                      <div 
                        className="bg-rose-500 h-full" 
                        style={{ width: `${result.probabilities.phishing || 0}%` }} 
                        title="Phishing Probability"
                      />
                    </div>
                  </div>

                  {/* Uncertainty explanation if triggered */}
                  {result.uncertainty?.is_uncertain && (
                    <div className="mt-3 p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-400 space-y-1">
                      <div className="font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>AI Uncertainty Guard Activated:</span>
                      </div>
                      <p>{result.uncertainty.reason}</p>
                      <p className="text-[10px] text-amber-300 italic">{result.uncertainty.recommendation}</p>
                    </div>
                  )}

                  {/* Fingerprint similarity notice */}
                  {similarScans.length > 0 && (
                    <div className="mt-3 p-2.5 rounded bg-teal-500/10 border border-teal-500/20 text-[11px] text-teal-400">
                      <span className="font-bold">Pattern Cluster Match: </span>
                      <span>
                        Shares cluster pattern <code>{result.fingerprint?.cluster_pattern}</code> with {similarScans.length} previous scan(s) in your session history.
                      </span>
                    </div>
                  )}
                </div>

                {/* Sub-Feature Tabs */}
                <div className="flex border-b border-slate-200 dark:border-navy-800 text-xs font-medium">
                  <button
                    onClick={() => setActiveTab('dna')}
                    className={`px-3 py-2 border-b-2 transition-colors ${
                      activeTab === 'dna'
                        ? 'border-teal-500 text-teal-500 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Email DNA & Text Inspector
                  </button>
                  <button
                    onClick={() => setActiveTab('links')}
                    className={`px-3 py-2 border-b-2 transition-colors ${
                      activeTab === 'links'
                        ? 'border-teal-500 text-teal-500 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Link Journey ({result.inspected_links?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('brand')}
                    className={`px-3 py-2 border-b-2 transition-colors ${
                      activeTab === 'brand'
                        ? 'border-teal-500 text-teal-500 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Brand Impersonation
                  </button>
                  <button
                    onClick={() => setActiveTab('timeline')}
                    className={`px-3 py-2 border-b-2 transition-colors ${
                      activeTab === 'timeline'
                        ? 'border-teal-500 text-teal-500 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Threat Timeline
                  </button>
                </div>

                {/* Tab 1: Email DNA & Evidence Highlights */}
                {activeTab === 'dna' && (
                  <div className="space-y-4">
                    <HighlightedEmailViewer
                      body={body}
                      indicators={result.indicators || []}
                    />

                    {/* Evidence Indicators List */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Detected Threat Anchors ({result.indicators.length})
                        </span>
                      </div>

                      {result.indicators.length === 0 ? (
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-navy-950 text-xs text-slate-500">
                          No suspicious terms or coercive phrases detected in text.
                        </div>
                      ) : (
                        result.indicators.map((ind, i) => (
                          <div key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{ind.title}</span>
                              {getSeverityBadge(ind.severity)}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{ind.description}</p>
                            {ind.evidence && ind.evidence.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {ind.evidence.map((ev, idx) => (
                                  <span key={idx} className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-navy-800 text-slate-700 dark:text-slate-300">
                                    {ev}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Tab 2: Safe Link Inspector */}
                {activeTab === 'links' && (
                  <LinkInspectorView links={result.inspected_links || []} />
                )}

                {/* Tab 3: Brand Impersonation Radar */}
                {activeTab === 'brand' && (
                  <BrandRadarCard finding={result.brand_radar} />
                )}

                {/* Tab 4: Threat Timeline */}
                {activeTab === 'timeline' && (
                  <ThreatTimelineView timeline={result.threat_timeline || []} />
                )}

                {/* Disclaimer */}
                <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[10px] text-amber-500/90 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>{result.verdict_disclaimer}</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-navy-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-mono">
              <Fingerprint className="w-3.5 h-3.5" /> {result ? result.id : 'No Active Scan'}
            </span>
            <span className="text-teal-500 font-mono">
              FastAPI v1.1.0 • Privacy Shield Active
            </span>
          </div>
        </div>
      </div>

      {/* Security Evidence Report Modal */}
      {isReportOpen && result && (
        <SecurityEvidenceReportModal
          scan={result}
          modelInfo={modelInfo}
          onClose={() => setIsReportOpen(false)}
        />
      )}
    </div>
  );
};
