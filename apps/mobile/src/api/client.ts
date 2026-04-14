// API client

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function upload<T>(path: string, file: { uri: string; name: string; type: string }): Promise<T> {
  const formData = new FormData();
  formData.append('file', file as unknown as Blob);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
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
  aiNotesImageToDraft: (file: { uri: string; name: string; type: string }) =>
    upload<AiDraftResult>('/ai/notes-image-to-draft', file),
  estimatePdfUrl: (estimateId: string) => `${API_BASE_URL}/estimates/${encodeURIComponent(estimateId)}/pdf`,
  getLaborRates: () => request('/catalog/labor-rates'),
  getEquipment: () => request('/catalog/equipment'),
};
