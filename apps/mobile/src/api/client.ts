// Simple API client for the mobile app

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

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
    request(`/customers${query ? `?query=${encodeURIComponent(query)}` : ''}`),
  listJobs: (customerId?: string) =>
    request(`/jobs${customerId ? `?customerId=${encodeURIComponent(customerId)}` : ''}`),
  listEstimates: (jobId?: string) =>
    request(`/estimates${jobId ? `?jobId=${encodeURIComponent(jobId)}` : ''}`),
  getLaborRates: () => request('/catalog/labor-rates'),
  getEquipment: () => request('/catalog/equipment'),
};
