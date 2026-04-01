import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';
const TOKEN_KEY = 'voltpass_jwt';

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const json = await response.json();

  if (!response.ok) {
    throw new Error(json?.error ?? `Request failed: ${response.status}`);
  }
  return json;
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    sendMagicLink: (email: string, name?: string, tradeType?: string, homeState?: string) =>
      request('/auth/magic-link', {
        method: 'POST',
        body: JSON.stringify({ email, name, tradeType, homeState }),
      }),

    verify: async (token: string) => {
      const result = await request<{ token: string; user: any }>('/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      await setToken(result.token);
      return result;
    },
  },

  credentials: {
    list: () => request<{ data: any[] }>('/credentials'),
    get: (id: string) => request<{ data: any }>(`/credentials/${id}`),
    create: (data: object) =>
      request<{ data: any }>('/credentials', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/credentials/${id}`, { method: 'DELETE' }),
    share: (id: string, ttlHours?: number) =>
      request<{ data: any }>(`/credentials/${id}/share`, {
        method: 'POST',
        body: JSON.stringify({ ttlHours }),
      }),
  },

  compliance: {
    check: (targetState: string, tradeLevel: string) =>
      request<{ data: any }>('/compliance/check', {
        method: 'POST',
        body: JSON.stringify({ targetState, tradeLevel }),
      }),
  },
};

// ── Offline credential cache ─────────────────────────────────────────────────
const CREDS_CACHE_KEY = 'voltpass_credentials_cache';
const CREDS_CACHE_TS_KEY = 'voltpass_credentials_cache_ts';

export async function cacheCredentials(credentials: any[]) {
  await SecureStore.setItemAsync(CREDS_CACHE_KEY, JSON.stringify(credentials));
  await SecureStore.setItemAsync(CREDS_CACHE_TS_KEY, Date.now().toString());
}

export async function getCachedCredentials(): Promise<{ credentials: any[]; cachedAt: Date | null }> {
  const raw = await SecureStore.getItemAsync(CREDS_CACHE_KEY);
  const ts = await SecureStore.getItemAsync(CREDS_CACHE_TS_KEY);
  return {
    credentials: raw ? JSON.parse(raw) : [],
    cachedAt: ts ? new Date(parseInt(ts, 10)) : null,
  };
}
