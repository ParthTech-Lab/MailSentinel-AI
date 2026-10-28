import { EmailAnalyzeResponse, EmailScanPayload, ModelInfo } from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const DEFAULT_TIMEOUT_MS = 15000; // 15-second defensive timeout

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000} seconds. Ensure the FastAPI backend is running.`);
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}

export async function checkBackendHealth(): Promise<{
  status: string;
  service: string;
  model_ready: boolean;
  version: string;
  environment: string;
}> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/health`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  }, 5000); // 5s timeout for health checks

  if (!response.ok) {
    throw new Error(`Health probe returned status ${response.status}`);
  }
  return response.json();
}

export async function fetchModelInfo(): Promise<ModelInfo> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/v1/model-info`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to load model info: status ${response.status}`);
  }
  return response.json();
}

export async function analyzeEmail(payload: EmailScanPayload): Promise<EmailAnalyzeResponse> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/v1/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      subject: payload.subject,
      body: payload.body,
      sender: payload.sender || undefined,
      headers: payload.headers || undefined,
      opt_in_history: payload.opt_in_history ?? false,
      redact_sensitive: payload.redact_sensitive ?? true,
    }),
  });

  if (!response.ok) {
    let errorDetail = `Server responded with HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // fallback to status code
    }
    throw new Error(errorDetail);
  }

  return response.json();
}
