// 友链服务 - 统一数据管理逻辑（内置友链、管理员友链、访客友链、审核）
// 文件存储：server/data/friendLinks.json

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, 'data');
const LINKS_FILE = join(DATA_DIR, 'friendLinks.json');

// 内置友链（永久保存，不可删除）
export const builtinLinks = [
  {
    id: 'builtin-1',
    name: 'Orbital Orbit',
    url: 'https://orbital-orbit.up.railway.app/',
    description: '一个简洁优雅的个人站点，记录生活与思考。',
    createdAt: Date.now() - 86400000 * 30,
    color: 'from-cyan-500 to-blue-500',
    isAdminCreated: true,
    status: 'approved',
  },
];

// 颜色方案
const colorSchemes = [
  'from-cyan-500 to-blue-500',
  'from-emerald-500 to-teal-500',
  'from-purple-500 to-pink-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-red-500',
  'from-indigo-500 to-violet-500',
  'from-sky-500 to-cyan-500',
  'from-fuchsia-500 to-pink-500',
];

export function getColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colorSchemes[Math.abs(hash) % colorSchemes.length];
}

// 确保数据目录存在
export async function ensureDataDir() {
  try {
    await mkdir(DATA_DIR, { recursive: true });
  } catch (e) {
    // 目录已存在
  }
}

// 加载数据
export async function loadData() {
  await ensureDataDir();
  try {
    const raw = await readFile(LINKS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    // 初始化 JSON 文件
    const initial = {
      adminLinks: [],
      visitorLinks: [],
    };
    await writeFile(LINKS_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
}

// 保存数据
export async function saveData(data) {
  await ensureDataDir();
  await writeFile(LINKS_FILE, JSON.stringify(data, null, 2));
}

// 获取所有友链
export async function getAllLinks() {
  const data = await loadData();
  return {
    builtin: builtinLinks,
    admin: data.adminLinks,
    visitor: data.visitorLinks,
    all: [...builtinLinks, ...data.adminLinks, ...data.visitorLinks],
  };
}

// 生成 ID
function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// 创建友链
export async function createLink(payload) {
  const { name, url, description, isAdmin, status } = payload;

  if (!name || !url) {
    throw new Error('名称和URL必填');
  }

  const newLink = {
    id: generateId(isAdmin ? 'admin' : 'link'),
    name: name.trim(),
    url: url.startsWith('http') ? url : `https://${url}`,
    description: (description || '暂无描述').trim(),
    createdAt: Date.now(),
    color: getColor(name),
    isAdminCreated: isAdmin || false,
    status: status || (isAdmin ? 'approved' : 'pending'),
  };

  const data = await loadData();
  if (newLink.isAdminCreated) {
    data.adminLinks.push(newLink);
  } else {
    data.visitorLinks.push(newLink);
  }
  await saveData(data);

  return newLink;
}

// 更新友链
export async function updateLink(id, updates) {
  const data = await loadData();

  // 检查是否是内置友链
  if (builtinLinks.some(l => l.id === id)) {
    throw new Error('内置友链不可修改');
  }

  // 在 adminLinks 中查找
  let updated = null;
  let adminIdx = data.adminLinks.findIndex(l => l.id === id);
  if (adminIdx !== -1) {
    updated = { ...data.adminLinks[adminIdx], ...updates };
    data.adminLinks[adminIdx] = updated;
  } else {
    // 在 visitorLinks 中查找
    let visitorIdx = data.visitorLinks.findIndex(l => l.id === id);
    if (visitorIdx !== -1) {
      updated = { ...data.visitorLinks[visitorIdx], ...updates };
      data.visitorLinks[visitorIdx] = updated;
    }
  }

  if (!updated) {
    throw new Error('友链不存在');
  }

  await saveData(data);
  return updated;
}

// 删除友链
export async function deleteLink(id) {
  const data = await loadData();

  // 检查是否是内置友链
  if (builtinLinks.some(l => l.id === id)) {
    throw new Error('内置友链不可删除');
  }

  const adminIdx = data.adminLinks.findIndex(l => l.id === id);
  if (adminIdx !== -1) {
    data.adminLinks.splice(adminIdx, 1);
  } else {
    const visitorIdx = data.visitorLinks.findIndex(l => l.id === id);
    if (visitorIdx !== -1) {
      data.visitorLinks.splice(visitorIdx, 1);
    } else {
      throw new Error('友链不存在');
    }
  }

  await saveData(data);
}

// 审核通过
export async function approveLink(id) {
  const data = await loadData();

  const visitorIdx = data.visitorLinks.findIndex(l => l.id === id);
  if (visitorIdx !== -1) {
    data.visitorLinks[visitorIdx].status = 'approved';
    await saveData(data);
    return data.visitorLinks[visitorIdx];
  }

  const adminIdx = data.adminLinks.findIndex(l => l.id === id);
  if (adminIdx !== -1) {
    data.adminLinks[adminIdx].status = 'approved';
    await saveData(data);
    return data.adminLinks[adminIdx];
  }

  throw new Error('友链不存在');
}

// 审核拒绝
export async function rejectLink(id) {
  const data = await loadData();

  const visitorIdx = data.visitorLinks.findIndex(l => l.id === id);
  if (visitorIdx !== -1) {
    data.visitorLinks[visitorIdx].status = 'rejected';
    await saveData(data);
    return data.visitorLinks[visitorIdx];
  }

  throw new Error('友链不存在');
}

// 获取统计
export async function getStats() {
  const links = await getAllLinks();
  return {
    total: links.all.length,
    pending: links.all.filter(l => l.status === 'pending').length,
    approved: links.all.filter(l => l.status === 'approved').length,
    rejected: links.all.filter(l => l.status === 'rejected').length,
    admin: links.admin.length,
    visitor: links.visitor.length,
  };
}

export { LINKS_FILE };
