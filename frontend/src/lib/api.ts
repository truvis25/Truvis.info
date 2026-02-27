/**
 * TruVis API Client
 * Handles auth token management, request/response, error handling.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface ApiOptions extends RequestInit {
  token?: string;
}

class ApiError extends Error {
  status: number;
  details?: Record<string, string[]>;

  constructor(message: string, status: number, details?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
    credentials: 'include',
  });

  // Handle 204 No Content
  if (response.status === 204) return {} as T;

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data.error || 'Request failed',
      response.status,
      data.details
    );
  }

  return data as T;
}

// ─────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────

export const authApi = {
  register: (data: { email: string; password: string; companyName: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  verifyEmail: (token: string) =>
    request(`/auth/verify-email?token=${token}`),

  login: (data: { email: string; password: string }) =>
    request<{ accessToken: string; user: { id: string; email: string; role: string } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  refresh: () =>
    request<{ accessToken: string }>('/auth/refresh', { method: 'POST' }),

  logout: (token: string) =>
    request('/auth/logout', { method: 'POST', token }),

  me: (token: string) =>
    request<{ user: { id: string; email: string; role: string } }>('/auth/me', { token }),
};

// ─────────────────────────────────────────
// PUBLIC
// ─────────────────────────────────────────

export const publicApi = {
  getStats: () => request('/public/stats'),
  getFeatured: () => request('/public/featured'),
  getIndustries: () => request('/public/industries'),
  getServiceTags: () => request('/public/service-tags'),
  getLocations: () => request('/public/filters/locations'),
};

// ─────────────────────────────────────────
// COMPANY (PUBLIC)
// ─────────────────────────────────────────

export const companyApi = {
  search: (params: Record<string, string | number | boolean | undefined>) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') query.set(k, String(v));
    });
    return request(`/companies?${query.toString()}`);
  },

  getProfile: (slug: string) => request(`/companies/${slug}`),

  contact: (slug: string, data: object) =>
    request(`/companies/${slug}/contact`, { method: 'POST', body: JSON.stringify(data) }),
};

// ─────────────────────────────────────────
// COMPANY DASHBOARD (AUTHENTICATED)
// ─────────────────────────────────────────

export const dashboardApi = {
  getMyProfile: (token: string) =>
    request('/companies/me/profile', { token }),

  updateProfile: (token: string, data: object) =>
    request('/companies/me/profile', { method: 'PATCH', body: JSON.stringify(data), token }),

  submitForApproval: (token: string) =>
    request('/companies/me/submit', { method: 'POST', token }),

  uploadLogo: async (token: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_BASE}/companies/me/logo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
      body: formData,
    }).then(r => r.json());
  },

  uploadCover: async (token: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_BASE}/companies/me/cover`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
      body: formData,
    }).then(r => r.json());
  },

  uploadGallery: async (token: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_BASE}/companies/me/gallery`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
      body: formData,
    }).then(r => r.json());
  },

  addService: (token: string, data: object) =>
    request('/companies/me/services', { method: 'POST', body: JSON.stringify(data), token }),

  deleteService: (token: string, serviceId: string) =>
    request(`/companies/me/services/${serviceId}`, { method: 'DELETE', token }),

  getMyPosts: (token: string) =>
    request('/blog/me/posts', { token }),

  submitPost: (token: string, data: object) =>
    request('/blog', { method: 'POST', body: JSON.stringify(data), token }),
};

// ─────────────────────────────────────────
// ADMIN (AUTHENTICATED + ADMIN ROLE)
// ─────────────────────────────────────────

export const adminApi = {
  getDashboard: (token: string) => request('/admin/dashboard', { token }),

  getCompanies: (token: string, params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request(`/admin/companies${query}`, { token });
  },

  getPendingCompanies: (token: string, page = 1) =>
    request(`/admin/companies/pending?page=${page}`, { token }),

  reviewCompany: (token: string, id: string, data: object) =>
    request(`/admin/companies/${id}/review`, { method: 'PATCH', body: JSON.stringify(data), token }),

  updateBadges: (token: string, id: string, data: object) =>
    request(`/admin/companies/${id}/badges`, { method: 'PATCH', body: JSON.stringify(data), token }),

  updateFeatured: (token: string, id: string, data: object) =>
    request(`/admin/companies/${id}/featured`, { method: 'PATCH', body: JSON.stringify(data), token }),

  assignTags: (token: string, id: string, tagIds: string[]) =>
    request(`/admin/companies/${id}/tags`, { method: 'PATCH', body: JSON.stringify({ tagIds }), token }),

  getPendingBlogs: (token: string) => request('/admin/blogs/pending', { token }),

  reviewBlog: (token: string, id: string, data: object) =>
    request(`/admin/blogs/${id}/review`, { method: 'PATCH', body: JSON.stringify(data), token }),

  getAuditLogs: (token: string, page = 1) =>
    request(`/admin/audit-logs?page=${page}`, { token }),
};

// ─────────────────────────────────────────
// BLOG (PUBLIC)
// ─────────────────────────────────────────

export const blogApi = {
  list: (page = 1) => request(`/blog?page=${page}`),
  getPost: (slug: string) => request(`/blog/${slug}`),
};

export { ApiError };
