// 认证服务 - 管理员登录、会话 token 管理
// 安全特性：
//   - 密码使用 scrypt 加盐哈希存储（不再存明文，不再有默认密码 admin123）
//   - 首次运行自动生成随机初始密码并打印到控制台
//   - 登录失败限流：5 次错误后锁定 15 分钟
//   - 旧版明文密码首次登录成功时自动迁移为哈希
// 会话 token 保存在内存中，服务重启后需要重新登录。

import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { readJSON, writeJSON } from './dataService.js';

const AUTH_FILE = new URL('./data/auth.json', import.meta.url);

// 会话有效期：7 天（毫秒）
const SESSION_TTL = 7 * 24 * 3600 * 1000;

// 会话存储：token -> { createdAt, lastSeenAt }
const SESSIONS = new Map();

// 登录失败限流：ip -> { count, lockedUntil }
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;
const ATTEMPTS = new Map();

let initLogged = false;

/** 加盐哈希密码，返回 "salt:hash" 格式 */
export function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(password, salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

/** 校验密码与存储的哈希是否匹配（常量时间比较） */
export function verifyPassword(password, stored) {
  if (typeof password !== 'string' || typeof stored !== 'string') return false;
  const idx = stored.indexOf(':');
  if (idx <= 0) return false; // 非 hash 格式（旧明文）由迁移逻辑处理
  const salt = stored.slice(0, idx);
  const expected = Buffer.from(stored.slice(idx + 1), 'hex');
  if (expected.length !== 32) return false;
  const actual = scryptSync(password, salt, 32);
  return timingSafeEqual(actual, expected);
}

/** 读取密码记录：{ hash } | { legacy: 明文 } | null */
async function readPasswordRecord() {
  if (process.env.ADMIN_PASSWORD) return { hash: hashPassword(process.env.ADMIN_PASSWORD) };
  try {
    const data = await readJSON(AUTH_FILE, null);
    if (data && typeof data === 'object') {
      if (data.passwordHash) return { hash: data.passwordHash };
      if (data.password) return { legacy: data.password };
    }
  } catch {
    /* 忽略读取错误 */
  }
  return null;
}

/** 首次运行：生成随机初始密码并保存 */
async function ensureInitialized() {
  if (process.env.ADMIN_PASSWORD || initLogged) return;
  if (await readPasswordRecord()) return;
  initLogged = true;
  const password = randomBytes(9).toString('base64url');
  await writeJSON(AUTH_FILE, {
    passwordHash: hashPassword(password),
    updatedAt: new Date().toISOString(),
  });
  console.log(`\n⚠️  首次运行：已生成初始管理员密码 → ${password}`);
  console.log(`⚠️  请立即登录后台修改密码！\n`);
}

/** 校验明文密码（兼容旧格式与 hash 格式） */
function checkPassword(password, record) {
  if (!record) return false;
  if (record.legacy !== undefined) return typeof password === 'string' && password === record.legacy;
  return verifyPassword(password, record.hash);
}

/** 登录：成功后签发 token。返回 { ok, token? | reason?, locked?, remaining? } */
export async function login(password, ip = '') {
  const key = ip || 'unknown';
  const cur = ATTEMPTS.get(key);
  if (cur && cur.lockedUntil > Date.now()) {
    const remaining = Math.max(1, Math.ceil((cur.lockedUntil - Date.now()) / 60000));
    return { ok: false, reason: `尝试次数过多，请 ${remaining} 分钟后重试`, locked: true, remaining };
  }
  if (cur && cur.lockedUntil > 0 && cur.lockedUntil <= Date.now()) ATTEMPTS.delete(key);

  await ensureInitialized();
  const record = await readPasswordRecord();
  if (!checkPassword(password, record)) {
    const attempt = ATTEMPTS.get(key) || { count: 0, lockedUntil: 0 };
    attempt.count += 1;
    if (attempt.count >= MAX_ATTEMPTS) {
      attempt.lockedUntil = Date.now() + LOCK_MS;
      attempt.count = 0;
    }
    ATTEMPTS.set(key, attempt);
    return {
      ok: false,
      reason: '密码错误',
      remaining: attempt.lockedUntil ? undefined : MAX_ATTEMPTS - attempt.count,
    };
  }

  ATTEMPTS.delete(key);

  // 旧版明文密码 → 迁移为 scrypt 哈希
  if (record && record.legacy !== undefined) {
    try {
      await writeJSON(AUTH_FILE, {
        passwordHash: hashPassword(record.legacy),
        updatedAt: new Date().toISOString(),
      });
      console.log('[authService] 已将明文密码迁移为 scrypt 哈希');
    } catch (e) {
      console.error('[authService] 密码迁移失败:', e);
    }
  }

  // 顺带清理过期会话
  for (const [t, s] of SESSIONS) {
    if (Date.now() - s.createdAt > SESSION_TTL) SESSIONS.delete(t);
  }

  const token = randomBytes(24).toString('hex');
  SESSIONS.set(token, { createdAt: Date.now(), lastSeenAt: Date.now() });
  return { ok: true, token };
}

// 校验 token 是否有效
export function verify(token) {
  if (typeof token !== 'string' || !token) return false;
  const session = SESSIONS.get(token);
  if (!session) return false;
  if (Date.now() - session.createdAt > SESSION_TTL) {
    SESSIONS.delete(token);
    return false;
  }
  session.lastSeenAt = Date.now();
  return true;
}

// 登出：销毁会话
export function logout(token) {
  if (typeof token === 'string') {
    SESSIONS.delete(token);
  }
}

// 修改管理员密码（需先验证旧密码）
export async function changePassword(oldPassword, newPassword) {
  const record = await readPasswordRecord();
  if (!checkPassword(oldPassword, record)) {
    return { ok: false, reason: '旧密码不正确' };
  }
  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    return { ok: false, reason: '新密码长度至少 6 位' };
  }
  if (newPassword === oldPassword) {
    return { ok: false, reason: '新密码不能与旧密码相同' };
  }
  if (process.env.ADMIN_PASSWORD) {
    return { ok: false, reason: '当前使用环境变量密码，请直接修改环境变量' };
  }
  await writeJSON(AUTH_FILE, {
    passwordHash: hashPassword(newPassword),
    updatedAt: new Date().toISOString(),
  });
  // 修改密码后使所有已有会话失效，强制重新登录
  SESSIONS.clear();
  return { ok: true };
}

// 供测试使用：重置限流状态
export function resetRateLimit() {
  ATTEMPTS.clear();
}

// 供测试使用：清空所有会话
export function clearSessions() {
  SESSIONS.clear();
}

export default { login, verify, logout, changePassword, hashPassword, verifyPassword, resetRateLimit, clearSessions };
