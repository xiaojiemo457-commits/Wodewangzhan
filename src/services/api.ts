import type { Article, Tool, Photo, MusicEntry, FriendLink } from '../types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

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
