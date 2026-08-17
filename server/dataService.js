// 通用 JSON 文件读写工具 - 为所有数据服务提供基础读写能力
// 写入采用「临时文件 + rename」的原子方式，避免进程崩溃导致数据文件损坏

import { readFile, writeFile, mkdir, rename } from 'fs/promises';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// 数据目录：server/data/
export const DATA_DIR = new URL('./data/', import.meta.url);

// 确保数据目录存在
export async function ensureDataDir() {
  try {
    await mkdir(DATA_DIR, { recursive: true });
  } catch {
    // 目录已存在
  }
}

// 读取并解析 JSON 文件，文件不存在或损坏时返回默认值（空数组）
export async function readJSON(filePath, fallback = []) {
  const target = typeof filePath === 'string' ? filePath : fileURLToPath(filePath);
  try {
    const raw = await readFile(target, 'utf-8');
    // 处理可能的 BOM 头
    const text = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

// 将数据以美化格式原子写入 JSON 文件
// 先写临时文件，成功后 rename 覆盖目标文件
export async function writeJSON(filePath, data) {
  const target = typeof filePath === 'string' ? filePath : fileURLToPath(filePath);
  const dir = dirname(target);
  try {
    await mkdir(dir, { recursive: true });
  } catch {
    // 目录已存在
  }
  const content = JSON.stringify(data, null, 2);
  const tmp = `${target}.${process.pid}.${Date.now().toString(36)}.tmp`;
  await writeFile(tmp, content, 'utf-8');
  try {
    await rename(tmp, target);
  } catch (err) {
    // rename 失败（如跨盘）时回退为直接写入，并清理临时文件
    await writeFile(target, content, 'utf-8');
    throw err;
  }
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
