// 站点设置服务 - 站点标题 / 描述 / 版权 / 备案 等全站配置
// 文件存储：server/data/settings.json

import { readJSON, writeJSON } from './dataService.js';

const SETTINGS_FILE = new URL('./data/settings.json', import.meta.url);

// 默认站点设置
const DEFAULT_SETTINGS = {
  siteTitle: '莫的个人空间',
  siteDescription: '记录生活、思考与技术',
  siteFooter: '莫 · 用心记录生活',
  siteKeywords: '个人网站,博客,日记,生活',
  icp: '',
};

// 读取站点设置（文件不存在时返回默认值）
export async function getSettings() {
  const data = await readJSON(SETTINGS_FILE);
  return { ...DEFAULT_SETTINGS, ...(data && typeof data === 'object' ? data : {}) };
}

// 保存站点设置（仅允许更新已知字段）
export async function updateSettings(payload = {}) {
  const current = await getSettings();
  const next = { ...current };
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (payload[key] !== undefined) {
      next[key] = String(payload[key] ?? '').trim();
    }
  }
  await writeJSON(SETTINGS_FILE, next);
  return next;
}

export default { getSettings, updateSettings, DEFAULT_SETTINGS };