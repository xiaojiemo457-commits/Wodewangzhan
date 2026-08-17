// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cn, extractDominantColor, rgbToCss } from './utils';

describe('cn', () => {
  it('合并多个类名', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('过滤 falsy 值', () => {
    expect(cn('a', false, null, undefined, 0, '')).toBe('a');
  });

  it('支持嵌套数组与对象条件', () => {
    expect(cn(['a', { b: true, c: false }])).toBe('a b');
  });

  it('用 tailwind-merge 消除冲突类', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});

describe('rgbToCss', () => {
  it('默认 alpha 为 1', () => {
    expect(rgbToCss([255, 0, 128])).toBe('rgba(255, 0, 128, 1)');
  });

  it('支持自定义 alpha', () => {
    expect(rgbToCss([10, 20, 30], 0.5)).toBe('rgba(10, 20, 30, 0.5)');
  });
});

describe('extractDominantColor', () => {
  /** 模拟 canvas：返回指定像素数据；throwOnGetImageData 模拟 getImageData 抛错 */
  function mockCanvas(pixels: number[] | null, throwOnGetImageData = false) {
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => {
        if (throwOnGetImageData) {
          throw new Error('canvas not supported');
        }
        return {
          drawImage: vi.fn(),
          getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(pixels ?? []) })),
        };
      }),
    };
    return vi
      .spyOn(document, 'createElement')
      .mockImplementation(((tag: string) => {
        if (tag === 'canvas') return canvas as unknown as HTMLElement;
        return document.createElement(tag);
      }) as any);
  }

  /** 模拟 Image：src 赋值时同步触发 onload / onerror */
  function mockImage(behavior: 'load' | 'error') {
    class FakeImage {
      crossOrigin = '';
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(v: string) {
        if (behavior === 'load') this.onload?.();
        else this.onerror?.();
      }
    }
    (globalThis as any).Image = FakeImage;
  }

  afterEach(() => {
    vi.restoreAllMocks();
    delete (globalThis as any).Image;
  });

  it('图片加载成功时返回平均主色', async () => {
    mockImage('load');
    mockCanvas([100, 150, 200, 255, 60, 90, 120, 255]);
    await expect(extractDominantColor('https://example.com/a.png')).resolves.toEqual([80, 120, 160]);
  });

  it('getContext 不可用时返回 null', async () => {
    mockImage('load');
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => null),
    };
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return canvas as unknown as HTMLElement;
      return document.createElement(tag);
    });
    await expect(extractDominantColor('x')).resolves.toBeNull();
  });

  it('像素全部透明时返回 null', async () => {
    mockImage('load');
    mockCanvas([10, 20, 30, 0, 40, 50, 60, 0]);
    await expect(extractDominantColor('x')).resolves.toBeNull();
  });

  it('getImageData 抛错时返回 null', async () => {
    mockImage('load');
    mockCanvas(null, true);
    await expect(extractDominantColor('x')).resolves.toBeNull();
  });

  it('图片加载失败时返回 null', async () => {
    mockImage('error');
    await expect(extractDominantColor('x')).resolves.toBeNull();
  });
});
