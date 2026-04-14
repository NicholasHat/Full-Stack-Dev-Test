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
    request(`/jobs${customerId ? `?customerId=${encodeURIComponent(customerId)}` : ''}`),
  listEstimates: (jobId?: string) =>
    request(`/estimates${jobId ? `?jobId=${encodeURIComponent(jobId)}` : ''}`),
  getLaborRates: () => request('/catalog/labor-rates'),
  getEquipment: () => request('/catalog/equipment'),
};
