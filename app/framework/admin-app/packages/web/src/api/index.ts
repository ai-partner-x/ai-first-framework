const BASE = '/api';

function getToken() {
  return localStorage.getItem('accessToken');
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(BASE + url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const json = await res.json();
  if (res.status === 401) {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
    throw new Error('未登录');
  }
  if (!json.success) throw new Error(json.error || '请求失败');
  return json.data as T;
}

// ---- Auth ----
export const authApi = {
  login: (username: string, password: string) =>
    request<{ accessToken: string; refreshToken: string; userInfo: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  getUserInfo: () => request<any>('/auth/info'),
};

// ---- User ----
export const userApi = {
  page: (params: Record<string, any>) =>
    request<any>(`/sys/user/page?${new URLSearchParams(params).toString()}`),
  getById: (id: number) => request<any>(`/sys/user/${id}`),
  create: (data: any) => request<any>('/sys/user', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => request<any>(`/sys/user/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request<any>(`/sys/user/${id}`, { method: 'DELETE' }),
  resetPassword: (id: number, newPassword: string) =>
    request<any>(`/sys/user/${id}/password`, { method: 'PUT', body: JSON.stringify({ newPassword }) }),
};

// ---- Role ----
export const roleApi = {
  list: () => request<any[]>('/sys/role/list'),
  getById: (id: number) => request<any>(`/sys/role/${id}`),
  create: (data: any) => request<any>('/sys/role', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => request<any>(`/sys/role/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request<any>(`/sys/role/${id}`, { method: 'DELETE' }),
  getMenuIds: (id: number) => request<number[]>(`/sys/role/${id}/menus`),
  assignMenus: (id: number, menuIds: number[]) =>
    request<any>(`/sys/role/${id}/menus`, { method: 'PUT', body: JSON.stringify({ menuIds }) }),
};

// ---- Menu ----
export const menuApi = {
  tree: () => request<any[]>('/sys/menu/tree'),
  userTree: () => request<any[]>('/sys/menu/user-tree'),
  getById: (id: number) => request<any>(`/sys/menu/${id}`),
  create: (data: any) => request<any>('/sys/menu', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => request<any>(`/sys/menu/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request<any>(`/sys/menu/${id}`, { method: 'DELETE' }),
};
