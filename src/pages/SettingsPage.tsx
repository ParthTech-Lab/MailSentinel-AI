import React, { useState } from 'react';
import { Save, Server, BrainCircuit, Shield, CheckCircle2, RefreshCw, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '../components/common/Button';
import { API_BASE_URL, checkBackendHealth } from '../services/api';
import { clearScanHistory } from '../services/historyStorage';

export const SettingsPage: React.FC = () => {
  const [fastApiUrl, setFastApiUrl] = useState(() => {
    return localStorage.getItem('mailsentinel_api_url') || API_BASE_URL;
  });
  const [confidenceThreshold, setConfidenceThreshold] = useState(() => {
    const saved = localStorage.getItem('mailsentinel_threshold');
    return saved ? Number(saved) : 65;
  });
  const [redactSensitive, setRedactSensitive] = useState(() => {
    return localStorage.getItem('mailsentinel_redact') !== 'false';
  });

  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const [savedMessage, setSavedMessage] = useState(false);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);

    const start = performance.now();
    try {
      const data = await checkBackendHealth();
      const latency = Math.round(performance.now() - start);
      setTestResult({
        ok: true,
        message: `Connected successfully! Engine: ${data.service} (v${data.version}) | Latency: ${latency}ms | Model Status: ${data.model_ready ? 'Ready' : 'Uninitialized'}`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      setTestResult({
        ok: false,
        message: `Connection failed: ${msg}. Verify that FastAPI is listening on port 8000.`,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('mailsentinel_api_url', fastApiUrl);
    localStorage.setItem('mailsentinel_threshold', String(confidenceThreshold));
    localStorage.setItem('mailsentinel_redact', String(redactSensitive));

    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const handlePurgeHistory = () => {
    if (window.confirm('Purge all locally stored session scan history?')) {
      clearScanHistory();
      alert('Local history purged successfully.');
    }
  };

  return (
    <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-navy-800">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            System & Engine Preferences
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure local API endpoints, uncertainty thresholds, and client privacy defaults.
          </p>
        </div>

        {savedMessage && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Preferences saved!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
        {/* Backend Endpoint & Test Link */}
        <div>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            <Server className="w-4 h-4 text-teal-500" />
            FastAPI Backend Endpoint URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={fastApiUrl}
              onChange={(e) => setFastApiUrl(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-lg text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-teal-500"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={testingConnection}
              icon={testingConnection ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : undefined}
              onClick={handleTestConnection}
            >
              {testingConnection ? 'Probing...' : 'Test Connection'}
            </Button>
          </div>

          {testResult && (
            <div
              className={`mt-2 p-2.5 rounded-lg text-xs flex items-center gap-2 border ${
                testResult.ok
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Uncertainty Threshold Slider */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              <BrainCircuit className="w-4 h-4 text-teal-500" />
              AI Uncertainty Guard Confidence Threshold
            </label>
            <span className="font-mono text-sm font-bold text-teal-500">{confidenceThreshold}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="90"
            value={confidenceThreshold}
            onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
            className="w-full accent-teal-500 cursor-pointer"
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Predictions below this confidence percentage automatically trigger the "Uncertain — verify manually" advisory.
          </p>
        </div>

        {/* Privacy Defaults */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
            <Shield className="w-4 h-4 text-teal-500" />
            <span>Default Privacy Shield Behavior</span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={redactSensitive}
              onChange={(e) => setRedactSensitive(e.target.checked)}
              className="rounded border-slate-300 dark:border-navy-700 text-teal-500 focus:ring-teal-500"
            />
            <span>Always redact sensitive tokens (Credit cards, OTPs, Passwords) in evidence previews</span>
          </label>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-navy-800 flex items-center justify-between">
          <Button type="submit" variant="primary" icon={<Save className="w-4 h-4" />}>
            Save Preferences
          </Button>

          <Button
            type="button"
            variant="danger"
            size="sm"
            icon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={handlePurgeHistory}
          >
            Purge Local Scan Records
          </Button>
        </div>
      </form>
    </div>
  );
};
