import { useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';

interface Blob {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  angle: number;
  angleSpeed: number;
}

interface BlobConfig {
  color: string;
  radius: number;
}

const DARK_BLOBS: BlobConfig[] = [
  { color: '#1a0b2e', radius: 0.45 },
  { color: '#0d47a1', radius: 0.4 },
  { color: '#006064', radius: 0.42 },
];

const LIGHT_BLOBS: BlobConfig[] = [
  { color: '#fce4ec', radius: 0.45 },
  { color: '#fff3e0', radius: 0.4 },
  { color: '#fffde7', radius: 0.42 },
];

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

export default function FluidBackground() {
  const isDark = useStore((s) => s.isDark);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const blobsRef = useRef<Blob[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999, active: false });
  const rafRef = useRef<number>(0);
  const isDarkRef = useRef(isDark);
  // 供主题切换时重建色板
  const reinitRef = useRef<() => void>(() => {});

  useEffect(() => {
    isDarkRef.current = isDark;
    reinitRef.current();
  }, [isDark]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let running = false;

    const initBlobs = () => {
      const configs = isDarkRef.current ? DARK_BLOBS : LIGHT_BLOBS;
      blobsRef.current = configs.map((c, i) => {
        const baseX = width * (0.25 + i * 0.25);
        const baseY = height * (0.3 + (i % 2) * 0.35);
        return {
          x: baseX,
          y: baseY,
          baseX,
          baseY,
          vx: 0,
          vy: 0,
          radius: Math.max(width, height) * c.radius,
          color: c.color,
          angle: Math.random() * Math.PI * 2,
          angleSpeed: 0.0002 + Math.random() * 0.0003,
        };
      });
    };
    reinitRef.current = initBlobs;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initBlobs();
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
    };

    const onMouseLeave = () => {
      mouseRef.current.active = false;
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };

    const render = () => {
      const dark = isDarkRef.current;

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = dark ? '#000000' : '#ffffff';
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = dark ? 'screen' : 'source-over';

      const blobs = blobsRef.current;
      const mouse = mouseRef.current;
      const influenceRadius = Math.max(width, height) * 0.4;

      for (const blob of blobs) {
        blob.angle += blob.angleSpeed;
        const targetX = blob.baseX + Math.cos(blob.angle) * width * 0.12;
        const targetY = blob.baseY + Math.sin(blob.angle * 1.3) * height * 0.1;

        if (mouse.active) {
          const dx = mouse.x - blob.x;
          const dy = mouse.y - blob.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < influenceRadius && dist > 1) {
            const force = (1 - dist / influenceRadius) * 0.6;
            blob.vx += (dx / dist) * force;
            blob.vy += (dy / dist) * force;
          }
        }

        blob.vx += (targetX - blob.x) * 0.0015;
        blob.vy += (targetY - blob.y) * 0.0015;
        blob.vx *= 0.94;
        blob.vy *= 0.94;
        blob.x += blob.vx;
        blob.y += blob.vy;

        const r = blob.radius;
        const { r: cr, g: cg, b: cb } = hexToRgb(blob.color);
        const grad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, r);
        const coreA = dark ? 0.85 : 0.9;
        const midA = dark ? 0.35 : 0.55;
        grad.addColorStop(0, `rgba(${cr},${cg},${cb},${coreA})`);
        grad.addColorStop(0.5, `rgba(${cr},${cg},${cb},${midA})`);
        grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(render);
    };

    // 页面隐藏时暂停动画，节省 CPU/电量
    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(rafRef.current);
      } else if (!running) {
        running = true;
        rafRef.current = requestAnimationFrame(render);
      }
    };

    // 尊重系统「减弱动态效果」：只渲染一帧静态画面
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    resize();
    if (prefersReduced) {
      render();
      cancelAnimationFrame(rafRef.current); // 只画一帧
      running = false;
    } else {
      running = true;
      render();
    }
    window.addEventListener('resize', resize);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden -z-10"
      style={{
        background: isDark
          ? 'linear-gradient(180deg, #1a0b2e 0%, #0d47a1 30%, #006064 60%, #1a0b2e 100%)'
          : 'linear-gradient(180deg, #fce4ec 0%, #fff3e0 30%, #fffde7 60%, #fce4ec 100%)',
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}
