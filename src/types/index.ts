export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  cover_image: string;
  category_id: string;
  category?: Category;
  author_id: string;
  views: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  url: string;
  category: string;
  icon: string;
  clicks: number;
  created_at: string;
}

export interface Photo {
  id: string;
  title: string;
  url: string;
  description: string;
  year: number;
  created_at: string;
}

export interface MusicEntry {
  id: string;
  title: string;
  artist: string;
  cover: string;
  url: string;
  diary: string;
  date: string;
}

export interface FriendLink {
  id: string;
  name: string;
  url: string;
  description: string;
  type: 'builtin' | 'admin' | 'visitor';
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  age: number;
  year: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  sort_order: number;
}

export interface AboutData {
  name: string;
  bio: string;
  avatar: string;
  email: string;
  github: string;
  interests: string[];
  skills: string[];
  aboutContent: string;
  updated_at: string;
}

export interface News60s {
  date: string;
  lunar_date: string;
  day_of_week: string;
  news: string[];
  tip: string;
  cover?: string;
  image?: string;
  link?: string;
  created?: string;
  created_at?: string;
  updated?: string;
  updated_at?: string;
  api_updated?: string;
  api_updated_at?: string;
}

// 全平台热榜（DailyHotApi 本地实例 + 60s API 补充）
export interface HotBoardItem {
  title: string;
  hot: string | number;
  url: string;
  desc?: string;
  tag?: string;
}

export interface HotBoard {
  platform: string;
  name: string;
  group: string;
  updated_at: string;
  items: HotBoardItem[];
}

export interface HotPlatformInfo {
  platform: string;
  name: string;
  group: string;
}

// 批量接口 /api/hot/all 返回：所有平台榜单 + 可选单平台错误
export interface HotBoardAll {
  updated_at: string;
  boards: (HotBoard & { error?: string })[];
}
