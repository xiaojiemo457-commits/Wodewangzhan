// authService 单元测试：scrypt 哈希、登录、暴力破解限流、明文迁移、会话管理
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const { mockStore } = vi.hoisted(() => ({ mockStore: new Map() }));

vi.mock('../dataService.js', () => ({
  readJSON: async (file, fallback) => {
    const key = String(file);
    return mockStore.has(key) ? mockStore.get(key) : (fallback ?? []);
  },
  writeJSON: async (file, data) => {
    mockStore.set(String(file), structuredClone(data));
  },
}));

import * as auth from '../authService.js';

const AUTH_KEY = String(new URL('../data/auth.json', import.meta.url));

beforeEach(() => {
  mockStore.clear();
  auth.resetRateLimit();
  auth.clearSessions();
  delete process.env.ADMIN_PASSWORD;
});

afterEach(() => {
  vi.useRealTimers();
  delete process.env.ADMIN_PASSWORD;
});

describe('hashPassword / verifyPassword', () => {
  it('生成 salt:hash 格式且可验证', () => {
    const hash = auth.hashPassword('my-password');
    expect(hash).toContain(':');
    expect(auth.verifyPassword('my-password', hash)).toBe(true);
    expect(auth.verifyPassword('wrong', hash)).toBe(false);
  });

  it('同一密码不同盐哈希不同', () => {
    const a = auth.hashPassword('same');
    const b = auth.hashPassword('same');
    expect(a).not.toBe(b);
  });

  it('非法输入返回 false', () => {
    expect(auth.verifyPassword('x', '')).toBe(false);
    expect(auth.verifyPassword('x', 'plaintext')).toBe(false);
    expect(auth.verifyPassword(undefined, 'a:b')).toBe(false);
    expect(auth.verifyPassword('x', 'a:short')).toBe(false);
  });
});

describe('登录', () => {
  it('首次运行自动生成初始密码并保存哈希', async () => {
    const result = await auth.login('anything', '1.2.3.4');
    expect(result.ok).toBe(false);
    const saved = mockStore.get(AUTH_KEY);
    expect(saved).toBeDefined();
    expect(saved.passwordHash).toContain(':');
    expect(saved.password).toBeUndefined();
  });

  it('密码正确返回 token', async () => {
    mockStore.set(AUTH_KEY, { passwordHash: auth.hashPassword('secret123') });
    const result = await auth.login('secret123', '1.2.3.4');
    expect(result.ok).toBe(true);
    expect(typeof result.token).toBe('string');
    expect(result.token.length).toBeGreaterThan(20);
    expect(auth.verify(result.token)).toBe(true);
  });

  it('密码错误返回 ok:false', async () => {
    mockStore.set(AUTH_KEY, { passwordHash: auth.hashPassword('secret123') });
    const result = await auth.login('nope', '1.2.3.4');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('密码错误');
    expect(auth.verify(result.token || '')).toBe(false);
  });

  it('环境变量密码优先', async () => {
    process.env.ADMIN_PASSWORD = 'env-pass-1';
    const result = await auth.login('env-pass-1', '9.9.9.9');
    expect(result.ok).toBe(true);
    const wrong = await auth.login('env-pass-2', '9.9.9.9');
    expect(wrong.ok).toBe(false);
    // 环境变量模式下不落盘
    expect(mockStore.has(AUTH_KEY)).toBe(false);
  });
});

describe('暴力破解限流', () => {
  it('连续 5 次错误后锁定，锁定期内即使密码正确也拒绝', async () => {
    mockStore.set(AUTH_KEY, { passwordHash: auth.hashPassword('secret123') });
    const ip = '10.0.0.1';
    for (let i = 1; i <= 5; i++) {
      const r = await auth.login('wrong', ip);
      expect(r.ok).toBe(false);
      if (i < 5) expect(r.remaining).toBe(5 - i);
    }
    // 第 6 次：密码正确但已锁定
    const locked = await auth.login('secret123', ip);
    expect(locked.ok).toBe(false);
    expect(locked.locked).toBe(true);
    expect(locked.remaining).toBeGreaterThanOrEqual(1);
  });

  it('锁定到期后恢复', async () => {
    vi.useFakeTimers();
    mockStore.set(AUTH_KEY, { passwordHash: auth.hashPassword('secret123') });
    const ip = '10.0.0.2';
    for (let i = 0; i < 5; i++) await auth.login('wrong', ip);
    expect((await auth.login('secret123', ip)).locked).toBe(true);
    // 15 分钟后解锁
    vi.setSystemTime(Date.now() + 16 * 60 * 1000);
    const ok = await auth.login('secret123', ip);
    expect(ok.ok).toBe(true);
  });
});

describe('旧明文密码迁移', () => {
  it('明文登录成功后自动迁移为哈希', async () => {
    mockStore.set(AUTH_KEY, { password: 'old-plain' });
    const result = await auth.login('old-plain', '1.2.3.4');
    expect(result.ok).toBe(true);
    const saved = mockStore.get(AUTH_KEY);
    expect(saved.password).toBeUndefined();
    expect(saved.passwordHash).toContain(':');
    // 迁移后新哈希仍可用
    expect(auth.verifyPassword('old-plain', saved.passwordHash)).toBe(true);
  });

  it('明文密码错误时拒绝', async () => {
    mockStore.set(AUTH_KEY, { password: 'old-plain' });
    expect((await auth.login('wrong', '1.2.3.4')).ok).toBe(false);
  });
});

describe('会话管理', () => {
  it('logout 使 token 失效', async () => {
    mockStore.set(AUTH_KEY, { passwordHash: auth.hashPassword('pw') });
    const { token } = await auth.login('pw', '1.2.3.4');
    expect(auth.verify(token)).toBe(true);
    auth.logout(token);
    expect(auth.verify(token)).toBe(false);
  });

  it('7 天后 token 过期', async () => {
    vi.useFakeTimers();
    mockStore.set(AUTH_KEY, { passwordHash: auth.hashPassword('pw') });
    const { token } = await auth.login('pw', '1.2.3.4');
    expect(auth.verify(token)).toBe(true);
    vi.setSystemTime(Date.now() + 8 * 24 * 3600 * 1000);
    expect(auth.verify(token)).toBe(false);
  });
});

describe('changePassword', () => {
  it('旧密码错误 / 过短 / 相同均拒绝', async () => {
    mockStore.set(AUTH_KEY, { passwordHash: auth.hashPassword('old-pw') });
    expect((await auth.changePassword('bad', 'new-pw')).ok).toBe(false);
    expect((await auth.changePassword('old-pw', '123')).ok).toBe(false);
    expect((await auth.changePassword('old-pw', 'old-pw')).ok).toBe(false);
  });

  it('成功修改后旧密码失效、新密码生效、会话清空', async () => {
    vi.useFakeTimers();
    mockStore.set(AUTH_KEY, { passwordHash: auth.hashPassword('old-pw') });
    const { token } = await auth.login('old-pw', '1.2.3.4');
    expect(auth.verify(token)).toBe(true);

    const r = await auth.changePassword('old-pw', 'new-pw-123');
    expect(r.ok).toBe(true);
    const saved = mockStore.get(AUTH_KEY);
    expect(auth.verifyPassword('new-pw-123', saved.passwordHash)).toBe(true);
    expect(auth.verifyPassword('old-pw', saved.passwordHash)).toBe(false);
    // 所有旧会话失效
    expect(auth.verify(token)).toBe(false);
  });

  it('环境变量密码模式下禁止在线修改', async () => {
    process.env.ADMIN_PASSWORD = 'env-pass';
    const r = await auth.changePassword('env-pass', 'new-pw-123');
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('环境变量');
  });
});
