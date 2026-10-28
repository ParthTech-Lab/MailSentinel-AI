export type NavigationTab = 
  | 'dashboard'
  | 'scan-email'
  | 'email-dna'
  | 'threat-intel'
  | 'scan-history'
  | 'reports'
  | 'settings';

export type ThreatVerdict = 'clean' | 'safe' | 'spam' | 'phishing' | 'suspicious' | 'pending';
export type ModelPredictedLabel = 'safe' | 'spam' | 'phishing';

export interface EmailScanPayload {
  sender?: string;
  subject: string;
  body: string;
  headers?: string;
  opt_in_history?: boolean;
  redact_sensitive?: boolean;
}

export interface SuspiciousIndicator {
  category: string;
  title: string;
  description: string;
  evidence: string[];
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  is_externally_verified: boolean;
}

export interface UrlInspectionFinding {
  raw_url: string;
  scheme: string;
  hostname: string;
  path: string;
  port?: number | null;
  is_ip_address: boolean;
  has_lookalike_domain: boolean;
  suspicious_tld: boolean;
  indicators: string[];
  severity: 'clean' | 'low' | 'medium' | 'high' | 'critical';
  disclaimer: string;
}

export interface BrandImpersonationFinding {
  brand_name: string;
  mentioned_brand: string;
  sender_provided: boolean;
  sender_domain?: string | null;
  legitimate_domains: string[];
  is_mismatch: boolean;
  confidence_assessment: 'confirmed_mismatch' | 'unverified_sender' | 'clean_or_unmentioned';
  explanation: string;
}

export interface ScamPatternFingerprint {
  fingerprint_hash: string;
  normalized_features: string[];
  cluster_pattern: string;
  disclaimer: string;
}

export interface ThreatTimelineStep {
  step_number: number;
  name: string;
  status: 'completed' | 'flagged' | 'bypassed' | 'failed';
  duration_ms: number;
  details: string;
}

export interface UncertaintyEvaluation {
  is_uncertain: boolean;
  status_label: 'Decisive' | 'Uncertain — verify manually';
  reason?: string | null;
  confidence_score: number;
  margin_between_top_classes: number;
  word_count: number;
  recommendation: string;
}

export interface EmailAnalyzeResponse {
  id: string;
  timestamp: string;
  sender?: string;
  subject: string;
  category: 'Safe / Legitimate' | 'Spam' | 'Phishing / Potentially Malicious';
  predicted_label: ModelPredictedLabel;
  confidence_score: number;
  probabilities: Record<string, number>;
  verdict_disclaimer: string;
  explanation: string;
  indicators: SuspiciousIndicator[];
  
  // Prompt 3 Advanced Intelligence Fields
  uncertainty: UncertaintyEvaluation;
  brand_radar?: BrandImpersonationFinding | null;
  inspected_links: UrlInspectionFinding[];
  fingerprint: ScamPatternFingerprint;
  threat_timeline: ThreatTimelineStep[];
  privacy_shield_applied: boolean;
  
  extracted_features: {
    character_count?: number;
    word_count?: number;
    url_count?: number;
    has_ip_url?: boolean;
    sample_urls?: string[];
    sender_provided?: boolean;
    [key: string]: unknown;
  };
}

export interface ModelMetrics {
  accuracy: number;
  macro_precision: number;
  macro_recall: number;
  macro_f1: number;
  weighted_f1: number;
  evaluated_samples: number;
  confusion_matrix: number[][];
}

export interface ModelInfo {
  status: 'trained' | 'uninitialized' | 'missing_dataset' | 'error';
  version: string;
  algorithm: string;
  vectorizer: string;
  target_classes: string[];
  trained_at?: string;
  dataset?: {
    name: string;
    description: string;
    total_samples: number;
    distribution: Record<string, number>;
    sources: string[];
  };
  metrics?: ModelMetrics;
  disclaimer: string;
}
