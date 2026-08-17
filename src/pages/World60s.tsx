import { useEffect, useRef, useState } from 'react';
import { Calendar, Download, Loader2, Newspaper, RefreshCw } from 'lucide-react';
import { fetch60sNews } from '../services/api';
import type { News60s } from '../types';

// 使用纯 Canvas 2D 绘制日报卡片，避免 SVG foreignObject 的跨域污染问题
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const chars = String(text || '').split('');
  const lines: string[] = [];
  let line = '';
  for (const char of chars) {
    const test = line + char;
    const w = ctx.measureText(test).width;
    if (w > maxWidth && line) {
      lines.push(line);
      line = char;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

async function downloadCardAsPNG(data: News60s, filename: string) {
  const width = 750;
  const paddingX = 48;
  const paddingY = 40;
  const innerWidth = width - paddingX * 2;
  const lineHeight = 1.75;
  const scale = 2;

  // 先创建临时 canvas 计算布局高度
  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = 1;
  tmpCanvas.height = 1;
  const tctx = tmpCanvas.getContext('2d');
  if (!tctx) throw new Error('Canvas 上下文不可用');

  const font = (size: number, weight = 'normal') =>
    `${weight} ${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif`;

  let y = paddingY;

  // 标题区
  tctx.font = font(36, '900');
  y += 36 + 8;
  tctx.font = font(15);
  const dateLine = `${(data.date || '').replace(/-/g, '年').replace(/年(\d{2})年/, '年$1月').replace(/月(\d{2})$/, '月$1日')}${data.lunar_date ? ` · ${data.lunar_date}` : ''}`;
  y += 18 + 32; // 日期行 + 下边距

  // 星期
  tctx.font = font(64, '900');
  const weekdayShort = (data.day_of_week || '').replace('星期', '');
  tctx.font = font(14, '500');
  y += 10 + 26; // 仅占位，实际与标题区同行，高度已计入

  // 分隔线1
  y += 24;

  // 新闻列表
  const news = Array.isArray(data.news) ? data.news : [];
  const numberSize = 26;
  const numberRightGap = 16;
  const textMaxWidth = innerWidth - numberSize - numberRightGap;
  const newsGap = 20;
  tctx.font = font(17);
  for (const item of news) {
    const lines = wrapText(tctx, item, textMaxWidth);
    const h = Math.max(numberSize, lines.length * 17 * lineHeight);
    y += h + newsGap;
  }
  y = y - newsGap + 8;

  // 分隔线2
  y += 24;

  // 每日微语
  if (data.tip) {
    tctx.font = font(18, '500');
    const tipLines = wrapText(tctx, `“${data.tip}”`, innerWidth - 16);
    y += tipLines.length * 18 * lineHeight + 8;
  }

  // 页脚
  y += 36;
  y += 12;

  const height = Math.ceil(y + paddingY);

  // 创建正式 canvas
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 上下文不可用');

  ctx.scale(scale, scale);

  // 背景
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, '#faf8f3');
  bgGradient.addColorStop(1, '#f3efe6');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // 装饰圆
  ctx.save();
  const g1 = ctx.createRadialGradient(width * 0.75, 0, 0, width * 0.75, 0, 260);
  g1.addColorStop(0, 'rgba(199,178,153,0.28)');
  g1.addColorStop(1, 'rgba(199,178,153,0)');
  ctx.fillStyle = g1;
  ctx.beginPath();
  ctx.arc(width * 0.88, -height * 0.05, 240, 0, Math.PI * 2);
  ctx.fill();
  const g2 = ctx.createRadialGradient(width * 0.2, height, 0, width * 0.2, height, 220);
  g2.addColorStop(0, 'rgba(199,178,153,0.24)');
  g2.addColorStop(1, 'rgba(199,178,153,0)');
  ctx.fillStyle = g2;
  ctx.beginPath();
  ctx.arc(width * 0.1, height * 1.08, 200, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  y = paddingY;

  // 顶部标题区
  ctx.font = font(36, '900');
  ctx.fillStyle = '#1a1814';
  ctx.textBaseline = 'top';
  ctx.fillText('每天 60s 读懂世界', paddingX, y);
  y += 36 + 10;

  ctx.font = font(15);
  ctx.fillStyle = '#7a7266';
  ctx.fillText(dateLine, paddingX, y);
  y += 18 + 32;

  // 星期（右上角，已预留空间）
  const weekday = data.day_of_week || '';
  ctx.font = font(64, '900');
  ctx.fillStyle = '#c7b299';
  ctx.textAlign = 'right';
  ctx.fillText(weekdayShort, width - paddingX, paddingY + 6);
  ctx.font = font(14, '500');
  ctx.fillStyle = '#9a9080';
  ctx.fillText(weekday, width - paddingX, paddingY + 72);
  ctx.textAlign = 'left';

  // 分隔线1
  ctx.strokeStyle = '#e0d8c8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(paddingX, y);
  ctx.lineTo(width - paddingX, y);
  ctx.stroke();
  y += 32;

  // 新闻列表
  ctx.font = font(17);
  ctx.fillStyle = '#3b3630';
  ctx.textBaseline = 'top';
  for (let i = 0; i < news.length; i++) {
    const item = news[i];
    const lines = wrapText(ctx, item, textMaxWidth);
    const lineH = 17 * lineHeight;
    const textH = lines.length * lineH;
    const h = Math.max(numberSize, textH);
    const cy = y + h / 2;

    // 序号圆圈
    ctx.save();
    ctx.fillStyle = '#e8e2d6';
    ctx.beginPath();
    ctx.arc(paddingX + numberSize / 2, cy, numberSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = font(15, '700');
    ctx.fillStyle = '#5c5548';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), paddingX + numberSize / 2, cy);
    ctx.restore();

    // 文字
    ctx.fillStyle = '#3b3630';
    const textX = paddingX + numberSize + numberRightGap;
    const textY = cy - textH / 2 + 2;
    for (let j = 0; j < lines.length; j++) {
      ctx.fillText(lines[j], textX, textY + j * lineH);
    }

    y += h + newsGap;
  }
  y = y - newsGap + 8;

  // 分隔线2
  ctx.strokeStyle = '#e0d8c8';
  ctx.beginPath();
  ctx.moveTo(paddingX, y);
  ctx.lineTo(width - paddingX, y);
  ctx.stroke();
  y += 28;

  // 每日微语
  if (data.tip) {
    const tipText = `“${data.tip}”`;
    ctx.font = font(18, '500');
    ctx.fillStyle = '#5c5548';
    const tipLines = wrapText(ctx, tipText, innerWidth - 16);
    const lineH = 18 * lineHeight;

    // 左侧竖线
    ctx.fillStyle = '#c7b299';
    drawRoundedRect(ctx, paddingX, y, 4, tipLines.length * lineH - 4, 2);
    ctx.fill();

    ctx.fillStyle = '#5c5548';
    for (let i = 0; i < tipLines.length; i++) {
      ctx.fillText(tipLines[i], paddingX + 16, y + i * lineH);
    }
    y += tipLines.length * lineH + 8;
  }

  // 页脚
  y += 28;
  ctx.strokeStyle = '#d9d0bf';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(paddingX, y);
  ctx.lineTo(width - paddingX, y);
  ctx.stroke();
  ctx.setLineDash([]);
  y += 14;

  ctx.font = font(12);
  ctx.fillStyle = '#a89b85';
  ctx.fillText('数据来源：60s API · 每天 60 秒读懂世界', paddingX, y);
  ctx.textAlign = 'right';
  ctx.fillText(data.date || '', width - paddingX, y);
  ctx.textAlign = 'left';

  // 导出 PNG
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png')
  );
  if (!blob) throw new Error('生成 PNG 失败');

  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}

export default function World60s() {
  const [data, setData] = useState<News60s | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch60sNews();
      if (res.code === 200 && res.data) {
        setData(res.data);
      } else {
        setError(res.message || '获取新闻失败');
      }
    } catch (e: any) {
      setError(e?.message || '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDownload = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const filename = `60s-${data.date || new Date().toISOString().slice(0, 10)}.png`;
      await downloadCardAsPNG(data, filename);
    } catch (e: any) {
      alert('保存图片失败：' + (e?.message || '未知错误'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen transition-colors bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* 页头 */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20 mb-4">
            <Newspaper className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">每天 60s 读懂世界</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            每日精选新闻 · 一键生成分享图
          </p>
        </header>

        {/* 工具栏 */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors bg-white border border-black/10 hover:bg-black/5 disabled:opacity-50 dark:bg-white/10 dark:border-white/10 dark:hover:bg-white/15"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            刷新
          </button>
          <button
            onClick={handleDownload}
            disabled={saving || loading || !data}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors text-white bg-black hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            保存图片
          </button>
        </div>

        {/* 加载/错误 */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm">正在获取今日新闻...</p>
          </div>
        )}
        {error && !loading && (
          <div className="text-center py-16 text-red-500">
            <p className="text-sm">{error}</p>
            <button
              onClick={load}
              className="mt-4 text-sm underline underline-offset-2 hover:text-red-600"
            >
              重新加载
            </button>
          </div>
        )}

        {/* 日报卡片 */}
        {data && !loading && (
          <div className="flex justify-center overflow-x-auto pb-6">
            <div
              className="relative w-[750px] shrink-0 rounded-2xl shadow-2xl overflow-hidden"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
                background: 'linear-gradient(135deg, #faf8f3 0%, #f3efe6 100%)',
                color: '#2d2a26',
              }}
            >
              {/* 装饰背景 */}
              <div
                className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-30"
                style={{
                  background: 'radial-gradient(circle, rgba(199,178,153,0.35) 0%, transparent 70%)',
                  transform: 'translate(30%, -30%)',
                }}
              />
              <div
                className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-25"
                style={{
                  background: 'radial-gradient(circle, rgba(199,178,153,0.3) 0%, transparent 70%)',
                  transform: 'translate(-25%, 30%)',
                }}
              />

              <div className="relative px-12 py-10">
                {/* 顶部标题区 */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2
                      className="text-4xl font-black tracking-tight mb-2"
                      style={{ color: '#1a1814' }}
                    >
                      每天 60s 读懂世界
                    </h2>
                    <div className="flex items-center gap-2 text-sm" style={{ color: '#7a7266' }}>
                      <Calendar size={14} />
                      <span>
                        {data.date?.replace(/-/g, '年').replace(/年(\d{2})年/, '年$1月').replace(/月(\d{2})$/, '月$1日')}
                        {data.lunar_date ? ` · ${data.lunar_date}` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-6xl font-black leading-none"
                      style={{ color: '#c7b299' }}
                    >
                      {data.day_of_week?.replace('星期', '') || ''}
                    </div>
                    <div className="text-sm font-medium mt-1" style={{ color: '#9a9080' }}>
                      {data.day_of_week || ''}
                    </div>
                  </div>
                </div>

                {/* 分隔线 */}
                <div className="h-px w-full mb-8" style={{ background: '#e0d8c8' }} />

                {/* 新闻列表 */}
                <ul className="space-y-5">
                  {data.news.map((item, index) => (
                    <li key={index} className="flex gap-4">
                      <span
                        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{
                          background: '#e8e2d6',
                          color: '#5c5548',
                        }}
                      >
                        {index + 1}
                      </span>
                      <p
                        className="text-base leading-relaxed pt-0.5"
                        style={{ color: '#3b3630', lineHeight: '1.75' }}
                      >
                        {item}
                      </p>
                    </li>
                  ))}
                </ul>

                {/* 分隔线 */}
                <div className="h-px w-full my-8" style={{ background: '#e0d8c8' }} />

                {/* 每日微语 */}
                {data.tip && (
                  <div className="relative pl-5">
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-full"
                      style={{ background: '#c7b299' }}
                    />
                    <p className="text-lg font-medium italic" style={{ color: '#5c5548' }}>
                      “{data.tip}”
                    </p>
                  </div>
                )}

                {/* 页脚 */}
                <div className="mt-10 pt-6 flex items-center justify-between text-xs" style={{ color: '#a89b85', borderTop: '1px dashed #d9d0bf' }}>
                  <span>数据来源：60s API · 每天 60 秒读懂世界</span>
                  <span>{data.date}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
