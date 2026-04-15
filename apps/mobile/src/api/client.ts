// API client

import Constants from 'expo-constants';
import { NativeModules } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const REQUEST_TIMEOUT_MS = 15000;
const UPLOAD_TIMEOUT_MS = 60000;

let lastWorkingBaseUrl = API_BASE_URL;

function normalizeBaseUrl(value: string) {
  return value.replace(/\/$/, '');
}

function isLoopbackBaseUrl(value: string) {
  try {
    const hostname = new URL(value).hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return false;
  }
}

function tryGetHostFromScriptUrl() {
  try {
    const scriptUrl = (NativeModules as { SourceCode?: { scriptURL?: string } })?.SourceCode?.scriptURL;
    if (!scriptUrl) {
      return null;
    }

    const normalized = scriptUrl.startsWith('exp://')
      ? scriptUrl.replace(/^exp:\/\//, 'http://')
      : scriptUrl;
    return new URL(normalized).hostname;
  } catch {
    return null;
  }
}

function tryGetHostFromExpoConstants() {
  try {
    const hostUri =
      (Constants.expoConfig as { hostUri?: string } | undefined)?.hostUri ??
      (Constants.expoGoConfig as { hostUri?: string } | undefined)?.hostUri ??
      (Constants.manifest2 as { extra?: { expoClient?: { hostUri?: string } } } | undefined)?.extra
        ?.expoClient?.hostUri;

    if (!hostUri) {
      return null;
    }

    const normalized = hostUri.startsWith('exp://') ? hostUri.replace(/^exp:\/\//, 'http://') : hostUri;
    return new URL(normalized).hostname;
  } catch {
    return null;
  }
}

function buildBaseUrlCandidates() {
  const candidates: string[] = [];

  const envBase = normalizeBaseUrl(API_BASE_URL);
  candidates.push(envBase);

  const hostFromScript = tryGetHostFromScriptUrl();
  if (hostFromScript && hostFromScript !== 'localhost' && hostFromScript !== '127.0.0.1') {
    candidates.push(`http://${hostFromScript}:8000`);
  }

  const hostFromConstants = tryGetHostFromExpoConstants();
  if (hostFromConstants && hostFromConstants !== 'localhost' && hostFromConstants !== '127.0.0.1') {
    candidates.push(`http://${hostFromConstants}:8000`);
  }

  candidates.push('http://127.0.0.1:8000');
  candidates.push('http://localhost:8000');

  return [...new Set(candidates)];
}

function getPreferredBaseUrl() {
  const candidates = buildBaseUrlCandidates();
  const stableCandidate = candidates.find((value) => !isLoopbackBaseUrl(value));

  if (lastWorkingBaseUrl) {
    return lastWorkingBaseUrl;
  }

  return stableCandidate ?? lastWorkingBaseUrl;
}

function isNetworkError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes('network request failed') ||
    message.includes('failed to fetch') ||
    message.includes('timed out') ||
    message.includes('aborted')
  );
}

async function fetchWithTimeout(url: string, init?: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

export type Customer = {
  id: string;
  name?: string | null;
  address?: string | null;
  phone?: string | null;
  propertyType?: string | null;
  squareFootage?: number | null;
  systemType?: string | null;
  systemAge?: number | null;
  lastServiceDate?: string | null;
};

export type CustomerInput = {
  name?: string | null;
  address?: string | null;
  phone?: string | null;
  propertyType?: string | null;
  squareFootage?: number | null;
  systemType?: string | null;
  systemAge?: number | null;
  lastServiceDate?: string | null;
};

export type Job = {
  id: string;
  customerId: string;
  address?: string | null;
  scheduledDate?: string | null;
  status?: string | null;
  specialNotes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type JobInput = {
  customerId: string;
  address?: string | null;
  scheduledDate?: string | null;
  status?: string | null;
  specialNotes?: string | null;
};

export type JobPatch = {
  customerId?: string;
  address?: string | null;
  scheduledDate?: string | null;
  status?: string | null;
  specialNotes?: string | null;
};

export type EstimateLabor = {
  jobType?: string | null;
  level?: string | null;
  hoursChosen?: number | null;
  hourlyRate?: number | null;
  laborTotal?: number | null;
};

export type EstimateEquipmentLine = {
  equipmentId?: string | null;
  freeText?: string | null;
  qty: number;
  unitPrice?: number | null;
  lineTotal?: number | null;
};

export type EstimateAdjustment = {
  code: string;
  amount?: number | null;
  note?: string | null;
};

export type EstimateTotals = {
  laborTotal: number;
  equipmentTotal: number;
  adjustmentsTotal: number;
  grandTotal: number;
};

export type LaborRate = {
  jobType: string;
  level: string;
  hourlyRate: number;
  estimatedHours: {
    min: number;
    max: number;
  };
};

export type EquipmentCatalogItem = {
  id: string;
  name: string;
  category: string;
  brand: string;
  modelNumber: string;
  baseCost: number;
};

export type Bundle = {
  id: string;
  name: string;
  description?: string | null;
  labor?: {
    jobType?: string | null;
    level?: string | null;
    hoursChosen?: number | null;
  } | null;
  equipmentLines: Array<{
    equipmentId?: string | null;
    qty: number;
  }>;
  adjustments: Array<{ code: string }>;
  notesTemplate?: string | null;
};

export type Estimate = {
  id: string;
  jobId: string;
  customerId: string;
  status: string;
  version: number;
  labor?: EstimateLabor | null;
  equipmentLines: EstimateEquipmentLine[];
  adjustments: EstimateAdjustment[];
  specialNotes?: string | null;
  totals?: EstimateTotals | null;
  createdAt: string;
  updatedAt: string;
};

export type EstimateCreateInput = {
  jobId: string;
  customerId: string;
  status?: string;
  version?: number;
  labor?: EstimateLabor | null;
  equipmentLines?: EstimateEquipmentLine[];
  adjustments?: EstimateAdjustment[];
  specialNotes?: string | null;
  totals?: EstimateTotals | null;
};

export type EstimateDraftInput = {
  jobId?: string | null;
  customerId?: string | null;
  labor?: {
    jobType?: string | null;
    level?: string | null;
    hoursChosen?: number | null;
  } | null;
  equipmentLines?: Array<{
    equipmentId?: string | null;
    freeText?: string | null;
    qty: number;
  }>;
  adjustments?: Array<{ code: string }>;
  specialNotes?: string | null;
  missingRequiredFields?: string[];
};

export type AiDraftResult = {
  draft: EstimateDraftInput;
  retriesUsed: number;
  fallbackToEmptyDraft: boolean;
  validationErrors: string[];
  transcript?: string | null;
  extractedText?: string | null;
};

export type UploadFileInput = {
  uri: string;
  name: string;
  type: string;
};

async function parseResponseBody<T>(response: Response): Promise<T> {
  if (response.status === 204 || response.status === 205) {
    return undefined as T;
  }

  const contentLength = response.headers.get('content-length');
  if (contentLength === '0') {
    return undefined as T;
  }

  const text = await response.text();
  if (!text.trim()) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const bases = [lastWorkingBaseUrl, ...buildBaseUrlCandidates()].filter(
    (value, index, array) => array.indexOf(value) === index
  );
  const failures: string[] = [];

  for (const baseUrl of bases) {
    try {
      const response = await fetchWithTimeout(
        `${baseUrl}${path}`,
        {
          headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
          ...init,
        },
        REQUEST_TIMEOUT_MS,
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `HTTP ${response.status}`);
      }

      lastWorkingBaseUrl = baseUrl;
      return parseResponseBody<T>(response);
    } catch (error) {
      if (!isNetworkError(error)) {
        throw error;
      }

      failures.push(`${baseUrl}: ${error instanceof Error ? error.message : 'network error'}`);
    }
  }

  throw new Error(
    `Network request failed for ${path}. Tried: ${failures.join(' | ') || 'no endpoints available'}`
  );
}

async function upload<T>(path: string, file: UploadFileInput): Promise<T> {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as never);

  const bases = [lastWorkingBaseUrl, ...buildBaseUrlCandidates()].filter(
    (value, index, array) => array.indexOf(value) === index
  );
  const failures: string[] = [];

  for (const baseUrl of bases) {
    try {
      const response = await fetchWithTimeout(
        `${baseUrl}${path}`,
        {
          method: 'POST',
          body: formData,
        },
        UPLOAD_TIMEOUT_MS,
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `HTTP ${response.status}`);
      }

      lastWorkingBaseUrl = baseUrl;
      return parseResponseBody<T>(response);
    } catch (error) {
      if (!isNetworkError(error)) {
        throw error;
      }

      failures.push(`${baseUrl}: ${error instanceof Error ? error.message : 'network error'}`);
    }
  }

  throw new Error(
    `Network upload failed for ${path}. Tried: ${failures.join(' | ') || 'no endpoints available'}`
  );
}

export const api = {
  health: () => request<{ status: string; env: string }>('/health'),
  listCustomers: (query?: string) =>
    request<Customer[]>(`/customers${query ? `?query=${encodeURIComponent(query)}` : ''}`),
  getCustomer: (customerId: string) => request<Customer>(`/customers/${encodeURIComponent(customerId)}`),
  createCustomer: (payload: CustomerInput) =>
    request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateCustomer: (customerId: string, payload: CustomerInput) =>
    request<Customer>(`/customers/${encodeURIComponent(customerId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  listJobs: (customerId?: string) =>
    request<Job[]>(`/jobs${customerId ? `?customerId=${encodeURIComponent(customerId)}` : ''}`),
  getJob: (jobId: string) => request<Job>(`/jobs/${encodeURIComponent(jobId)}`),
  createJob: (payload: JobInput) =>
    request<Job>('/jobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateJob: (jobId: string, payload: JobPatch) =>
    request<Job>(`/jobs/${encodeURIComponent(jobId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  listEstimates: (jobId?: string) =>
    request<Estimate[]>(`/estimates${jobId ? `?jobId=${encodeURIComponent(jobId)}` : ''}`),
  createEstimate: (payload: EstimateCreateInput) =>
    request<Estimate>('/estimates', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getEstimate: (estimateId: string) => request<Estimate>(`/estimates/${encodeURIComponent(estimateId)}`),
  deleteEstimate: (estimateId: string) =>
    request<void>(`/estimates/${encodeURIComponent(estimateId)}`, { method: 'DELETE' }),
  updateEstimate: (estimateId: string, payload: Partial<EstimateCreateInput>) =>
    request<Estimate>(`/estimates/${encodeURIComponent(estimateId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  applyEstimateDraft: (estimateId: string, payload: EstimateDraftInput) =>
    request<Estimate>(`/estimates/${encodeURIComponent(estimateId)}/apply-draft`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  repriceEstimate: (estimateId: string) =>
    request<{ id: string; labor?: EstimateLabor | null; equipmentLines: EstimateEquipmentLine[]; adjustments: EstimateAdjustment[]; totals: EstimateTotals }>(
      `/estimates/${encodeURIComponent(estimateId)}/reprice`,
      { method: 'POST' }
    ),
  finalizeEstimate: (estimateId: string) =>
    request<Estimate>(`/estimates/${encodeURIComponent(estimateId)}/finalize`, { method: 'POST' }),
  aiVoiceToDraft: (file: UploadFileInput) => upload<AiDraftResult>('/ai/voice-to-draft', file),
  aiNotesImageToDraft: (file: UploadFileInput) =>
    upload<AiDraftResult>('/ai/notes-image-to-draft', file),
  resetDemoData: () =>
    request<{ customersSeeded: number; jobsCleared: number; estimatesCleared: number }>(
      '/admin/reset-demo-data',
      { method: 'POST' }
    ),
  estimatePdfUrl: (estimateId: string) => {
    const baseUrl = getPreferredBaseUrl();
    return `${baseUrl ?? API_BASE_URL}/estimates/${encodeURIComponent(estimateId)}/pdf`;
  },
  getLaborRates: () => request<LaborRate[]>('/catalog/labor-rates'),
  getEquipment: () => request<EquipmentCatalogItem[]>('/catalog/equipment'),
  getBundles: () => request<Bundle[]>('/catalog/bundles'),
};
