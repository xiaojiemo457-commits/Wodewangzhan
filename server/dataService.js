// 通用 JSON 文件读写工具 - 为所有数据服务提供基础读写能力

import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// 数据目录：server/data/
export const DATA_DIR = new URL('./data/', import.meta.url);

// 确保数据目录存在
export async function ensureDataDir() {
  try {
    await mkdir(DATA_DIR, { recursive: true });
  } catch (e) {
    // 目录已存在
  }
}

// 读取并解析 JSON 文件，文件不存在则返回空数组
export async function readJSON(filePath) {
  try {
    const raw = await readFile(filePath, 'utf-8');
    // 处理可能的 BOM 头
    const text = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
    return JSON.parse(text);
  } catch (e) {
    return [];
  }
}

// 将数据以美化格式写入 JSON 文件
export async function writeJSON(filePath, data) {
  // 确保父目录存在
  const dir = typeof filePath === 'string' ? dirname(filePath) : dirname(fileURLToPath(filePath));
  try {
    await mkdir(dir, { recursive: true });
  } catch (e) {
    // 目录已存在
  }
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// 生成唯一 ID
export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default {
  DATA_DIR,
  ensureDataDir,
  readJSON,
  writeJSON,
  generateId,
};
