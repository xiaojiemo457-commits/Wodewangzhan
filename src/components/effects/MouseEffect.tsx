import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  born: number;
  maxLife: number;
  size: number;
  colorPrefix: string; // e.g. "rgba(0,229,255,"
}

interface Ripple {
  x: number;
  y: number;
  born: number;
  duration: number;
  maxRadius: number;
  colorPrefix: string;
}

const MAX_PARTICLES = 120;

function pickColor(isDark: boolean): string {
  const palette = isDark
    ? ['rgba(0,229,255,', 'rgba(139,92,246,', 'rgba(34,211,238,'] // cyan / purple
    : ['rgba(245,200,66,', 'rgba(236,72,153,', 'rgba(251,191,36,']; // gold / pink / warm
  return palette[Math.floor(Math.random() * palette.length)];
}

export default function MouseEffect() {
  const isDark = useStore((s) => s.isDark);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, lastX: 0, lastY: 0, hasLast: false });
  const rafRef = useRef<number>(0);
  const isDarkRef = useRef(isDark);

  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let running = false;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onMouseMove = (e: MouseEvent) => {
      const m = mouseRef.current;
      const dark = isDarkRef.current;
      if (m.hasLast) {
        m.lastX = m.x;
        m.lastY = m.y;
      } else {
        m.lastX = e.clientX;
        m.lastY = e.clientY;
        m.hasLast = true;
      }
      m.x = e.clientX;
      m.y = e.clientY;

      const dx = m.x - m.lastX;
      const dy = m.y - m.lastY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      // Throttle by distance to keep particle count reasonable
      if (dist < 6) return;
      const count = Math.min(3, Math.floor(dist / 14) + 1);
      const now = performance.now();
      for (let i = 0; i < count; i++) {
        if (particlesRef.current.length >= MAX_PARTICLES) break;
        const t = i / count;
        const px = m.lastX + dx * t + (Math.random() - 0.5) * 6;
        const py = m.lastY + dy * t + (Math.random() - 0.5) * 6;
        particlesRef.current.push({
          x: px,
          y: py,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6 - 0.15,
          born: now,
          maxLife: 500,
          size: 2 + Math.random() * 3,
          colorPrefix: pickColor(dark),
        });
      }
    };

    const onClick = (e: MouseEvent) => {
      const dark = isDarkRef.current;
      const now = performance.now();
      ripplesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        born: now,
        duration: 600,
        maxRadius: 70 + Math.random() * 40,
        colorPrefix: dark ? 'rgba(34,211,238,' : 'rgba(245,158,11,',
      });
      // Spawn a small burst of particles on click
      for (let i = 0; i < 12; i++) {
        if (particlesRef.current.length >= MAX_PARTICLES) break;
        const angle = (Math.PI * 2 * i) / 12;
        const speed = 1 + Math.random() * 2;
        particlesRef.current.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          born: now,
          maxLife: 500,
          size: 2 + Math.random() * 3,
          colorPrefix: pickColor(dark),
        });
      }
    };

    const render = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, width, height);

      // Particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        const age = now - p.born;
        if (age >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }
        const life = 1 - age / p.maxLife;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.01; // slight gravity
        const alpha = life * 0.9;
        const size = p.size * (0.5 + life * 0.5);
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.colorPrefix + '1)';
        ctx.fillStyle = p.colorPrefix + alpha + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Ripples
      const ripples = ripplesRef.current;
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        const age = now - r.born;
        if (age >= r.duration) {
          ripples.splice(i, 1);
          continue;
        }
        const t = age / r.duration;
        const radius = r.maxRadius * t;
        const alpha = (1 - t) * 0.6;
        ctx.strokeStyle = r.colorPrefix + alpha + ')';
        ctx.lineWidth = 2 * (1 - t * 0.5);
        ctx.beginPath();
        ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
        ctx.stroke();
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

    // 尊重系统「减弱动态效果」：完全禁用粒子特效
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    resize();
    if (prefersReduced) {
      running = false;
    } else {
      running = true;
      render();
    }
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onClick);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-50"
      aria-hidden="true"
    />
  );
}
