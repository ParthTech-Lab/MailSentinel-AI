import { EmailAnalyzeResponse } from '../types';

const STORAGE_KEY = 'mailsentinel_scan_history';

export function getScanHistory(): EmailAnalyzeResponse[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as EmailAnalyzeResponse[];
  } catch (e) {
    console.error('Failed to load scan history:', e);
    return [];
  }
}

export function saveScanToHistory(scan: EmailAnalyzeResponse): void {
  try {
    const existing = getScanHistory();
    // Prepend new scan, keep last 50 scans
    const updated = [scan, ...existing.filter(s => s.id !== scan.id)].slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save scan to history:', e);
  }
}

export function clearScanHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear scan history:', e);
  }
}

export function findSimilarFingerprints(
  targetScan: EmailAnalyzeResponse
): { scanId: string; subject: string; timestamp: string; cluster: string; sharedFeatures: string[] }[] {
  const history = getScanHistory();
  const matches: { scanId: string; subject: string; timestamp: string; cluster: string; sharedFeatures: string[] }[] = [];

  const targetFeatures = new Set(targetScan.fingerprint?.normalized_features || []);
  const targetHash = targetScan.fingerprint?.fingerprint_hash;

  for (const item of history) {
    if (item.id === targetScan.id) continue;

    const itemFeatures = new Set(item.fingerprint?.normalized_features || []);
    // Find intersection of normalized features
    const shared = [...targetFeatures].filter(f => itemFeatures.has(f));

    // If identical hash or same cluster with at least 3 shared normalized traits
    if (
      (targetHash && item.fingerprint?.fingerprint_hash === targetHash) ||
      (item.fingerprint?.cluster_pattern === targetScan.fingerprint?.cluster_pattern && shared.length >= 3)
    ) {
      matches.push({
        scanId: item.id,
        subject: item.subject,
        timestamp: item.timestamp,
        cluster: item.fingerprint?.cluster_pattern || 'unknown',
        sharedFeatures: shared,
      });
    }
  }

  return matches.slice(0, 5);
}

