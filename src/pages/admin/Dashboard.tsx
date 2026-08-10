import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Wrench, Image, Link as LinkIcon, Clock, Eye } from 'lucide-react';
import { useStore } from '@/store/useStore';

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  to,
}: {
  label: string;
  value: number;
  icon: typeof FileText;
  color: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-800/50 p-5 transition hover:border-gray-700 hover:bg-gray-800"
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${color}`}>
        <Icon className="text-white" size={22} />
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-sm text-gray-400">{label}</div>
      </div>
    </Link>
  );
}

export default function AdminDashboard() {
  const {
    articles,
    fetchArticles,
    tools,
    fetchTools,
    photos,
    fetchPhotos,
    friendLinks,
    fetchFriendLinks,
  } = useStore();

  useEffect(() => {
    fetchArticles();
    fetchTools();
    fetchPhotos();
    fetchFriendLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingLinks = friendLinks.filter((l) => l.status === 'pending');
  const recentArticles = [...articles]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="文章总数"
          value={articles.length}
          icon={FileText}
          color="bg-indigo-600"
          to="/admin/articles"
        />
        <StatCard
          label="工具数"
          value={tools.length}
          icon={Wrench}
          color="bg-emerald-600"
          to="/admin/tools"
        />
        <StatCard
          label="照片数"
          value={photos.length}
          icon={Image}
          color="bg-pink-600"
          to="/admin/photos"
        />
        <StatCard
          label="友链数"
          value={friendLinks.length}
          icon={LinkIcon}
          color="bg-amber-600"
          to="/admin/friend-links"
        />
      </div>

      {/* Pending friend links alert */}
      {pendingLinks.length > 0 && (
        <Link
          to="/admin/friend-links"
          className="flex items-center justify-between rounded-xl border border-amber-700/50 bg-amber-900/20 px-5 py-4 transition hover:bg-amber-900/30"
        >
          <div className="flex items-center gap-3">
            <Clock className="text-amber-400" size={20} />
            <span className="text-amber-200">
              有 <span className="font-bold">{pendingLinks.length}</span> 个友链待审核
            </span>
          </div>
          <span className="text-sm text-amber-400">去处理 →</span>
        </Link>
      )}

      {/* Recent articles */}
      <div className="rounded-xl border border-gray-800 bg-gray-800/50">
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
          <h2 className="font-semibold text-white">最近文章</h2>
          <Link to="/admin/articles" className="text-sm text-indigo-400 hover:text-indigo-300">
            查看全部
          </Link>
        </div>
        {recentArticles.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">暂无文章</div>
        ) : (
          <ul className="divide-y divide-gray-800">
            {recentArticles.map((article) => (
              <li key={article.id} className="flex items-center justify-between px-5 py-3">
                <Link
                  to={`/admin/articles/${article.id}/edit`}
                  className="truncate text-sm text-gray-200 hover:text-indigo-400"
                >
                  {article.title}
                </Link>
                <div className="ml-4 flex shrink-0 items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Eye size={14} />
                    {article.views}
                  </span>
                  <span>{new Date(article.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
