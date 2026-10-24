export type RustBackendStatus = Record<string, unknown>;

const baseUrl = (import.meta.env.VITE_CL1_RUST_BACKEND_URL as string | undefined)?.replace(/\/$/, '') || '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  if (!response.ok) {
    throw new Error(`Rust backend ${response.status}: ${await response.text()}`);
  }
  return response.json() as Promise<T>;
}

export function rustBackendEnabled(): boolean {
  return Boolean(baseUrl);
}

export function rustStatus(): Promise<RustBackendStatus> {
  return request<RustBackendStatus>('/api/status');
}

export function rustConfig(): Promise<RustBackendStatus> {
  return request<RustBackendStatus>('/_/config');
}

export function rustStimulate(channels: number[], amplitudeUv = 200, durationMs = 0.4) {
  return request<{ accepted: boolean; channels: number[] }>('/api/stim', {
    method: 'POST',
    body: JSON.stringify({ channels, amplitude_uv: amplitudeUv, duration_ms: durationMs }),
  });
}

export function rustExperiments() {
  return request<{ experiments: Array<{ name: string; description: string }> }>('/api/experiments');
}
