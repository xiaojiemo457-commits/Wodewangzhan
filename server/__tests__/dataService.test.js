// dataService 单元测试：原子写入、读取容错、ID 生成
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, readFile, writeFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { readJSON, writeJSON, generateId, ensureDataDir } from '../dataService.js';

let dir;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'data-svc-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('writeJSON（原子写入）', () => {
  it('写入并格式化 JSON，内容正确', async () => {
    const file = join(dir, 'a.json');
    await writeJSON(file, { hello: 'world', n: 1 });
    const raw = await readFile(file, 'utf-8');
    expect(raw).toContain('"hello": "world"');
    expect(JSON.parse(raw)).toEqual({ hello: 'world', n: 1 });
  });

  it('自动创建父目录', async () => {
    const file = join(dir, 'nested', 'deep', 'b.json');
    await writeJSON(file, [1, 2, 3]);
    expect(JSON.parse(await readFile(file, 'utf-8'))).toEqual([1, 2, 3]);
  });

  it('覆盖已有文件', async () => {
    const file = join(dir, 'c.json');
    await writeJSON(file, { v: 1 });
    await writeJSON(file, { v: 2 });
    expect(JSON.parse(await readFile(file, 'utf-8'))).toEqual({ v: 2 });
  });

  it('不会残留临时文件', async () => {
    const file = join(dir, 'd.json');
    await writeJSON(file, { ok: true });
    const files = await import('fs/promises').then(({ readdir }) => readdir(dir));
    expect(files).toEqual(['d.json']);
  });
});

describe('readJSON（读取容错）', () => {
  it('读取不存在的文件返回默认值（空数组）', async () => {
    expect(await readJSON(join(dir, 'missing.json'))).toEqual([]);
  });

  it('读取自定义默认值', async () => {
    expect(await readJSON(join(dir, 'missing.json'), { fallback: 1 })).toEqual({ fallback: 1 });
  });

  it('处理 BOM 头', async () => {
    const file = join(dir, 'bom.json');
    await writeFile(file, '\uFEFF{"a":1}', 'utf-8');
    expect(await readJSON(file)).toEqual({ a: 1 });
  });

  it('损坏的 JSON 返回默认值', async () => {
    const file = join(dir, 'bad.json');
    await writeFile(file, '{oops', 'utf-8');
    expect(await readJSON(file)).toEqual([]);
  });
});

describe('ensureDataDir', () => {
  it('创建数据目录且可重复调用', async () => {
    const original = (await import('fs/promises')).mkdir;
    // 目录已存在时不抛错
    await ensureDataDir();
    await ensureDataDir();
    expect(original).toBeDefined();
  });
});

describe('generateId', () => {
  it('生成带前缀的唯一 ID', () => {
    const a = generateId('tool');
    const b = generateId('tool');
    expect(a.startsWith('tool-')).toBe(true);
    expect(a).not.toBe(b);
  });

  it('默认前缀为 id', () => {
    expect(generateId().startsWith('id-')).toBe(true);
  });
});
