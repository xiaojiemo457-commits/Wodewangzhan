import { readJSON, writeJSON } from './dataService.js';

const ABOUT_FILE = new URL('./data/about.json', import.meta.url);

const DEFAULT_ABOUT = {
  name: '莫军杰',
  bio: '记录生活，热爱生活。普通人一个。喜欢清晨的微风，喜欢傍晚的散步，喜欢把每一天的小事都记下来。生活不需要多精彩，真实就好。',
  avatar: '',
  email: 'hello@example.com',
  github: 'https://github.com/xiaojiemo457-commits/-',
  interests: ['阅读', '旅行', '音乐', '徒步', '美食', '电影'],
  skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'HTML/CSS', 'Git'],
  aboutContent: '<h2>你好，我是莫军杰 👋</h2><p>一个热爱生活的普通人。</p><p>我来自一个小城市，在桂林上的大学，21岁本科毕业。毕业后没有急着找工作，而是背着背包独自旅行了一年，走过了大半个中国。那一段路上的时光，让我想清楚了很多事情。</p><p>现在我把生活的点滴记录在这个小小的个人空间里，有日记、有音乐、有照片。希望你也能在这里找到一些共鸣。</p><blockquote>"生活不需要多精彩，真实就好。"</blockquote>',
  updated_at: new Date().toISOString(),
};

export async function getAbout() {
  let about = await readJSON(ABOUT_FILE);
  if (!about || !about.name) {
    about = { ...DEFAULT_ABOUT };
    await writeJSON(ABOUT_FILE, about);
    console.log('[aboutService] 已生成默认 About 数据');
  }
  return about;
}

export async function updateAbout(updates) {
  const about = await getAbout();
  const allowed = ['name', 'bio', 'avatar', 'email', 'github', 'interests', 'skills', 'aboutContent'];
  const next = { ...about };
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      if (Array.isArray(updates[key])) {
        next[key] = updates[key];
      } else if (typeof updates[key] === 'string') {
        next[key] = updates[key].trim();
      } else {
        next[key] = updates[key];
      }
    }
  }
  next.updated_at = new Date().toISOString();
  await writeJSON(ABOUT_FILE, next);
  return next;
}

export default { getAbout, updateAbout };