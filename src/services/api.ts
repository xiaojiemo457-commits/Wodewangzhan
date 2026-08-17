import type { Article, Tool, Photo, MusicEntry, FriendLink, TimelineEvent, AboutData, News60s, HotBoard, HotBoardAll, HotPlatformInfo } from '../types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('admin_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${url}`, {
    headers,
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ===== 认证 =====
export async function login(password: string) {
  return request<{ token: string }>(`/auth/login`, { method: 'POST', body: JSON.stringify({ password }) });
}

export async function fetchAuthMe() {
  return request<{ authenticated: boolean }>(`/auth/me`);
}

export async function logout() {
  return request<{ success: boolean }>(`/auth/logout`, { method: 'POST' });
}

// ===== 站点设置 =====
export interface SiteSettings {
  siteTitle: string;
  siteDescription: string;
  siteFooter: string;
  siteKeywords: string;
  icp: string;
}

export async function getSettings() {
  return request<SiteSettings>(`/settings`);
}

export async function updateSettings(data: Partial<SiteSettings>) {
  return request<{ success: boolean; settings: SiteSettings }>(`/settings`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// 兼容命名导出
export const api = {
  getSettings,
  updateSettings,
  login,
  fetchAuthMe,
  logout,
};


// ===== 文章 =====
export async function fetchArticles(params?: { category?: string; search?: string; page?: number }) {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  const qs = query.toString();
  return request<{ items: Article[]; total: number; page: number; totalPages: number }>(`/articles${qs ? `?${qs}` : ''}`);
}

export async function fetchArticleById(id: string) {
  return request<{ article: Article }>(`/articles/${id}`);
}

export async function createArticle(data: Partial<Article>) {
  return request<{ article: Article }>(`/articles`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateArticle(id: string, data: Partial<Article>) {
  return request<{ article: Article }>(`/articles/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteArticle(id: string) {
  return request<{ success: boolean }>(`/articles/${id}`, { method: 'DELETE' });
}

// ===== 工具 =====
export async function fetchTools() {
  return request<Tool[]>(`/tools`);
}

export async function createTool(data: Partial<Tool>) {
  return request<{ tool: Tool }>(`/tools`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateTool(id: string, data: Partial<Tool>) {
  return request<{ tool: Tool }>(`/tools/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteTool(id: string) {
  return request<{ success: boolean }>(`/tools/${id}`, { method: 'DELETE' });
}

// ===== 照片 =====
export async function fetchPhotos() {
  return request<Photo[]>(`/photos`);
}

export async function createPhoto(data: Partial<Photo>) {
  return request<{ photo: Photo }>(`/photos`, { method: 'POST', body: JSON.stringify(data) });
}

export async function deletePhoto(id: string) {
  return request<{ success: boolean }>(`/photos/${id}`, { method: 'DELETE' });
}

// ===== 音乐日记 =====
export async function fetchMusic() {
  return request<MusicEntry[]>(`/music`);
}

export async function createMusic(data: Partial<MusicEntry>) {
  return request<{ entry: MusicEntry }>(`/music`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateMusic(id: string, data: Partial<MusicEntry>) {
  return request<{ entry: MusicEntry }>(`/music/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteMusic(id: string) {
  return request<{ success: boolean }>(`/music/${id}`, { method: 'DELETE' });
}

// ===== 友链 =====
export async function fetchFriendLinks() {
  return request<{ all: FriendLink[] }>(`/links`);
}

export async function addFriendLink(data: { name: string; url: string; description?: string; isAdmin: boolean }) {
  return request<{ link: FriendLink }>(`/links`, { method: 'POST', body: JSON.stringify(data) });
}

export async function approveFriendLink(id: string) {
  return request<{ link: FriendLink }>(`/links/${id}/approve`, { method: 'POST' });
}

export async function rejectFriendLink(id: string) {
  return request<{ link: FriendLink }>(`/links/${id}/reject`, { method: 'POST' });
}

export async function deleteFriendLink(id: string) {
  return request<{ success: boolean }>(`/links/${id}`, { method: 'DELETE' });
}

// ===== 修改密码 =====
export async function changePassword(currentPassword: string, newPassword: string) {
  return request<{ success: boolean }>(`/auth/password`, {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

// ===== 时间轴 =====
export async function fetchTimeline() {
  return request<TimelineEvent[]>(`/timeline`);
}

export async function createTimelineEvent(data: Partial<TimelineEvent>) {
  return request<{ item: TimelineEvent }>(`/timeline`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateTimelineEvent(id: string, data: Partial<TimelineEvent>) {
  return request<{ item: TimelineEvent }>(`/timeline/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteTimelineEvent(id: string) {
  return request<{ success: boolean }>(`/timeline/${id}`, { method: 'DELETE' });
}

// ===== 关于页 =====
export async function fetchAbout() {
  return request<AboutData>(`/about`);
}

// ===== 每日 60s 读懂世界 =====
export interface News60sResponse {
  code: number;
  message: string;
  data: News60s;
}

export async function fetch60sNews() {
  return request<News60sResponse>(`/60s`);
}

// ===== 全平台热榜（小红书/社交社区/新闻资讯/生活预警）=====
export async function fetchHotPlatforms() {
  return request<{ platforms: HotPlatformInfo[] }>(`/hot/platforms`);
}

export async function fetchHotBoard(platform: string) {
  return request<HotBoard>(`/hot/${platform}`);
}

// 批量拉取全部平台热榜（每平台前 10 条，单平台失败降级为空）
export async function fetchHotBoardsAll() {
  return request<HotBoardAll>(`/hot/all`);
}

export async function updateAbout(data: Partial<AboutData>) {
  return request<{ about: AboutData }>(`/about`, { method: 'PUT', body: JSON.stringify(data) });
}
