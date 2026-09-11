import axios from 'axios';
import type {
  ChatReply,
  ConversationDoc,
  ExtractedCriteria,
  LeadDoc,
  LeadPriorities,
  OverviewStats,
  PropertyDoc,
  ScoreBreakdown,
  SearchResultDoc,
  SiteVisitDoc,
  UserDoc,
} from './types';

/** Central axios instance — auth interceptor + normalized API errors. */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api',
});

const TOKEN_KEY = 'propintel_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

api.interceptors.request.use(cfg => {
  const token = getToken();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

/** Unwrap axios responses so callers receive the body directly (matches all call sites). */
api.interceptors.response.use(res => res.data as never);

/** Normalize axios errors into a readable message. */
export function errMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message ?? err.message;
  }
  return err instanceof Error ? err.message : 'Something went wrong';
}

function unwrap<T>(data: unknown): T {
  return data as T;
}

// ---- auth ----
export const authApi = {
  register: (body: { name: string; email: string; phone?: string; password: string; role: string }) =>
    api.post<unknown, { token: string; user: UserDoc }>('/auth/register', body).then(r => unwrap<{ token: string; user: UserDoc }>(r as never)),
  login: (body: { email: string; password: string }) =>
    api.post<unknown, { token: string; user: UserDoc }>('/auth/login', body),
  me: () => api.get<unknown, { user: UserDoc }>('/auth/me'),
};

// ---- properties ----
export interface PropertyFilters {
  city?: string;
  locality?: string;
  propertyType?: string;
  listingType?: string;
  bedrooms?: string;
  minPrice?: string;
  maxPrice?: string;
  minArea?: string;
  parking?: string;
  furnishing?: string;
  amenities?: string;
  search?: string;
  page?: string;
  limit?: string;
}

export const propertyApi = {
  list: (params: PropertyFilters) =>
    api.get<unknown, { items: PropertyDoc[]; total: number; page: number; pages: number }>('/properties', { params }),
  get: (id: string) => api.get<unknown, { property: PropertyDoc }>(`/properties/${id}`),
  create: (body: Record<string, unknown>) => api.post<unknown, { property: PropertyDoc }>('/properties', body),
  update: (id: string, body: Record<string, unknown>) => api.put<unknown, { property: PropertyDoc }>(`/properties/${id}`, body),
  remove: (id: string) => api.delete(`/properties/${id}`),
};

// ---- AI ----
export const aiApi = {
  search: (query: string) =>
    api.post<unknown, { criteria: ExtractedCriteria; results: SearchResultDoc[] }>('/ai/property-search', { query }),
  recommend: (conversationId?: string) =>
    api.post<unknown, { results: SearchResultDoc[] }>('/ai/recommend-properties', conversationId ? { conversationId } : {}),
  chat: (message: string, conversationId?: string) =>
    api.post<unknown, ChatReply>('/ai/chat', { message, conversationId }),
  conversations: () => api.get<unknown, { items: ConversationDoc[] }>('/ai/conversations'),
  conversation: (id: string) => api.get<unknown, { conversation: ConversationDoc }>(`/ai/conversations/${id}`),
  compare: (propertyIds: string[]) =>
    api.post<unknown, { properties: PropertyDoc[]; summary: string }>('/ai/compare-properties', { propertyIds }),
};

// ---- leads ----
export const leadApi = {
  list: (params: Record<string, string>) =>
    api.get<unknown, { items: LeadDoc[]; total: number; page: number; pages: number }>('/leads', { params }),
  get: (id: string) =>
    api.get<unknown, { lead: LeadDoc; nextAction: { action: string; reason: string }; scoreBreakdown: ScoreBreakdown; temperature: string }>(`/leads/${id}`),
  create: (body: Record<string, unknown>) => api.post<unknown, { lead: LeadDoc }>('/leads', body),
  update: (id: string, body: Record<string, unknown>) => api.put<unknown, { lead: LeadDoc }>(`/leads/${id}`, body),
  remove: (id: string) => api.delete(`/leads/${id}`),
  score: (id: string) => api.post<unknown, { lead: LeadDoc; score: number; temperature: string; reasons: string[]; nextAction: { action: string; reason: string } }>(`/leads/${id}/score`),
  priorities: () => api.get<unknown, LeadPriorities>('/leads/priorities'),
};

// ---- saved ----
export const savedApi = {
  list: () => api.get<unknown, { items: PropertyDoc[] }>('/saved'),
  save: (propertyId: string) => api.post(`/saved/${propertyId}`),
  unsave: (propertyId: string) => api.delete(`/saved/${propertyId}`),
};

// ---- site visits ----
export const visitApi = {
  list: () => api.get<unknown, { items: SiteVisitDoc[] }>('/site-visits'),
  request: (body: { propertyId: string; date: string; time: string; notes?: string }) =>
    api.post<unknown, { visit: SiteVisitDoc }>('/site-visits', body),
  update: (id: string, body: Record<string, string>) => api.put<unknown, { visit: SiteVisitDoc }>(`/site-visits/${id}`, body),
  remove: (id: string) => api.delete(`/site-visits/${id}`),
};

// ---- analytics ----
export interface FunnelPoint { stage: string; count: number }
export interface AgentRow { agentId: string; name: string; email: string; leads: number; qualified: number; visits: number; conversions: number; conversionRate: number }
export interface SourceRow { source: string; leads: number; qualified: number; converted: number; conversionRate: number }

export const analyticsApi = {
  overview: () => api.get<unknown, OverviewStats>('/analytics/overview'),
  leads: () => api.get<unknown, { byStatus: { _id: string; count: number }[]; byTemperature: { _id: string; count: number }[]; funnel: FunnelPoint[] }>('/analytics/leads'),
  properties: () => api.get<unknown, { byCity: { _id: string; count: number; avgPrice: number }[]; byType: { _id: string; count: number }[] }>('/analytics/properties'),
  agents: () => api.get<unknown, { items: AgentRow[] }>('/analytics/agents'),
  campaigns: () => api.get<unknown, { items: SourceRow[] }>('/analytics/campaigns'),
  demand: () => api.get<unknown, { locations: { _id: string; count: number }[]; types: { _id: string; count: number }[]; budgets: { label: string; count: number }[] }>('/analytics/demand'),
};
