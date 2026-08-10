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
