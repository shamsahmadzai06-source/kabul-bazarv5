const API_BASE = 'https://gk-uploader.shamsahmadzai06.workers.dev';

function getGuestId(): string {
  let guestId = localStorage.getItem('guestId');
  if (!guestId) {
    guestId = crypto.randomUUID();
    localStorage.setItem('guestId', guestId);
  }
  return guestId;
}

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Guest-Id': getGuestId(),
    ...(options.headers as Record<string, string> || {}),
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  signup: (data: { name: string; email: string; phone?: string; password: string; isSellerRequest?: boolean; businessName?: string; description?: string }) =>
    fetchApi('/api/auth/signup', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    fetchApi('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  me: () => fetchApi('/api/auth/me'),

  uploadAvatar: (formData: FormData) =>
    fetch(`${API_BASE}/api/auth/avatar`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData,
    }).then(r => r.json()),

  uploadCover: (formData: FormData) =>
    fetch(`${API_BASE}/api/users/cover`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData,
    }).then(r => r.json()),

  updateProfile: (data: Partial<{ name: string; lastName: string; phone: string; whatsapp: string; bio: string; shopAddress: string; binanceId: string; usdtTrc20: string }>) =>
    fetchApi('/api/users/profile', { method: 'PATCH', body: JSON.stringify(data) }),

  getPosts: (params?: { page?: number; limit?: number; search?: string; authorId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    if (params?.authorId) qs.set('authorId', params.authorId);
    return fetchApi(`/api/posts?${qs.toString()}`);
  },

  getPost: (id: string) => fetchApi(`/api/posts/${id}`),

  createPost: (formData: FormData) =>
    fetch(`${API_BASE}/api/posts`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData,
    }).then(r => r.json()),

  likePost: (id: string) => fetchApi(`/api/posts/${id}/like`, { method: 'POST' }),

  toggleSold: (id: string) => fetchApi(`/api/posts/${id}/sold`, { method: 'PATCH' }),

  updateDiscount: (id: string, data: { discountPrice?: number; discountPercent?: number }) =>
    fetchApi(`/api/posts/${id}/discount`, { method: 'PATCH', body: JSON.stringify(data) }),

  deletePost: (id: string) => fetchApi(`/api/posts/${id}`, { method: 'DELETE' }),

  getUserPosts: (userId: string) => fetchApi(`/api/posts/user/${userId}`),

  batchViews: (postIds: string[]) =>
    fetchApi('/api/posts/views/batch', { method: 'POST', body: JSON.stringify({ postIds }) }),

  getConversations: () => fetchApi('/api/messages/conversations'),

  getAdminConversation: () => fetchApi('/api/messages/admin-conversation', { method: 'POST' }),

  getMessages: (conversationId: string) =>
    fetchApi(`/api/messages?conversationId=${conversationId}`),

  sendMessage: (data: { conversationId: string; content: string; recipientId?: string }) =>
    fetchApi('/api/messages', { method: 'POST', body: JSON.stringify(data) }),

  getNotifications: () => fetchApi('/api/notifications'),

  getUnreadCount: () => fetchApi('/api/notifications/unread'),

  markRead: (id: string) => fetchApi(`/api/notifications/${id}/read`, { method: 'PATCH' }),

  markAllRead: () => fetchApi('/api/notifications/read-all', { method: 'POST' }),

  applySeller: (data: { businessName: string; description: string; phone: string }) =>
    fetchApi('/api/seller-requests', { method: 'POST', body: JSON.stringify(data) }),

  getAdminStats: () => fetchApi('/api/admin/stats'),

  getPendingRequests: () => fetchApi('/api/admin/seller-requests'),

  approveRequest: (id: string) => fetchApi(`/api/admin/seller-requests/${id}/approve`, { method: 'POST' }),

  rejectRequest: (id: string) => fetchApi(`/api/admin/seller-requests/${id}/reject`, { method: 'POST' }),

  getSellers: () => fetchApi('/api/admin/sellers'),

  revokeSeller: (id: string) => fetchApi(`/api/admin/sellers/${id}/revoke`, { method: 'PATCH' }),

  getAllUsers: () => fetchApi('/api/admin/users'),

  deleteUser: (id: string) => fetchApi(`/api/admin/users/${id}`, { method: 'DELETE' }),

  getAllPosts: () => fetchApi('/api/admin/posts'),

  saveSettings: (data: { binanceId: string; usdtAddress: string }) =>
    fetchApi('/api/admin/settings', { method: 'POST', body: JSON.stringify(data) }),

  getAds: (position?: string) => fetchApi(`/api/ads?position=${position || 'home'}`),

  clickAd: (adId: string) => fetchApi('/api/ads/click', { method: 'POST', body: JSON.stringify({ adId }) }),

  getAdminAds: () => fetchApi('/api/admin/ads'),

  createAd: (data: { title: string; imageUrl: string; linkUrl: string; position?: string; priority?: number }) =>
    fetchApi('/api/admin/ads', { method: 'POST', body: JSON.stringify(data) }),

  updateAd: (id: string, data: Partial<{ title: string; imageUrl: string; linkUrl: string; position: string; priority: number; isActive: number }>) =>
    fetchApi(`/api/admin/ads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteAd: (id: string) => fetchApi(`/api/admin/ads/${id}`, { method: 'DELETE' }),

  track: (data: Record<string, unknown>) =>
    fetchApi('/api/track', { method: 'POST', body: JSON.stringify(data) }),

  trackInstall: (data: Record<string, unknown>) =>
    fetchApi('/api/track/install', { method: 'POST', body: JSON.stringify(data) }),

  heartbeat: () => fetchApi('/api/online', { method: 'POST', body: JSON.stringify({}) }),

  getSettings: () => fetchApi('/api/settings'),

  getVersion: () => fetchApi('/api/version'),
};