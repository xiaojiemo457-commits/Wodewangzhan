import { useEffect, useMemo, useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Github, Twitter, Mail } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

const PIE_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F', '#FFBB28'];

export default function About() {
  const { isDark, articles, photos, tools, categories, fetchArticles, fetchPhotos, fetchTools } = useStore();
  const [totalArticles, setTotalArticles] = useState(0);

  useEffect(() => {
    fetchArticles().then((r) => setTotalArticles(r.total)).catch(() => { /* noop */ });
    fetchPhotos();
    fetchTools();
  }, []);

  const pieData = useMemo(() => {
    return categories
      .map((c) => ({
        name: c.name,
        value: articles.filter((a) => a.category_id === c.id || a.category?.id === c.id).length,
      }))
      .filter((d) => d.value > 0);
  }, [articles, categories]);

  const barData = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({ key, label: `${d.getMonth() + 1}月`, count: 0 });
    }
    articles.forEach((a) => {
      const d = new Date(a.created_at);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const m = months.find((x) => x.key === key);
      if (m) m.count += 1;
    });
    return months;
  }, [articles]);

  const stats = [
    { label: '文章总数', value: totalArticles || articles.length },
    { label: '分类数', value: categories.length },
    { label: '照片数', value: photos.length },
    { label: '工具数', value: tools.length },
  ];

  const axisColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const tooltipStyle = {
    backgroundColor: isDark ? '#111827' : '#ffffff',
    border: `1px solid ${gridColor}`,
    borderRadius: '8px',
    color: isDark ? '#f3f4f6' : '#111827',
  };

  const socials = [
    { icon: Github, href: 'https://github.com/xiaojiemo457-commits/-', label: 'GitHub' },
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Mail, href: 'mailto:hello@example.com', label: 'Email' },
  ];

  return (
    <div className={cn('min-h-screen pb-16 transition-colors', isDark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900')}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold mb-4 shadow-lg">
            莫
          </div>
          <h1 className="text-2xl font-bold">莫</h1>
          <p className={cn('text-sm mt-1', isDark ? 'text-gray-400' : 'text-gray-500')}>用心记录生活的每一刻</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {stats.map((s) => (
            <div
              key={s.label}
              className={cn(
                'rounded-2xl p-6 border text-center',
                isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
              )}
            >
              <div className="text-3xl font-bold text-sky-500">{s.value}</div>
              <div className={cn('text-sm mt-1', isDark ? 'text-gray-400' : 'text-gray-500')}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <div className={cn('rounded-2xl p-6 border', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100')}>
            <h2 className="text-lg font-semibold mb-4">文章分类分布</h2>
            {pieData.length === 0 ? (
              <div className={cn('h-[300px] flex items-center justify-center text-sm', isDark ? 'text-gray-500' : 'text-gray-400')}>
                暂无数据
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={{ fill: axisColor, fontSize: 12 }}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className={cn('rounded-2xl p-6 border', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100')}>
            <h2 className="text-lg font-semibold mb-4">近 6 个月文章</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} />
                <YAxis tick={{ fill: axisColor, fontSize: 12 }} allowDecimals={false} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Social */}
        <div className="flex items-center justify-center gap-6">
          {socials.map(({ icon: Icon, href, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className={cn(
                'p-3 rounded-full border transition-colors hover:text-sky-500',
                isDark ? 'bg-gray-900 border-gray-800 text-gray-300' : 'bg-white border-gray-200 text-gray-600'
              )}
            >
              <Icon className="w-5 h-5" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
