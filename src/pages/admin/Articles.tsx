import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Eye, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { deleteArticle } from '@/services/api';
import { Article } from '@/types';

export default function AdminArticles() {
  const articles = useStore((s) => s.articles);
  const categories = useStore((s) => s.categories);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    useStore.getState().fetchArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? '未分类';

  const handleDelete = async (article: Article) => {
    setDeleting(true);
    try {
      await deleteArticle(article.id);
      await useStore.getState().fetchArticles();
      setConfirmId(null);
    } catch {
      /* noop */
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">共 {articles.length} 篇文章</p>
        <Link
          to="/admin/articles/new"
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          <Plus size={16} />
          新建文章
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-800 bg-gray-800/50 text-xs uppercase text-gray-400">
            <tr>
              <th className="px-4 py-3 font-medium">标题</th>
              <th className="px-4 py-3 font-medium">分类</th>
              <th className="px-4 py-3 font-medium">浏览</th>
              <th className="px-4 py-3 font-medium">日期</th>
              <th className="px-4 py-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {articles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  暂无文章，点击右上角新建
                </td>
              </tr>
            ) : (
              articles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-800/40">
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/articles/${article.id}/edit`}
                      className="font-medium text-gray-200 hover:text-indigo-400"
                    >
                      {article.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-300">
                      {getCategoryName(article.category_id)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-gray-400">
                      <Eye size={14} />
                      {article.views}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(article.created_at).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/admin/articles/${article.id}/edit`}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-700 hover:text-indigo-400"
                        title="编辑"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        onClick={() => setConfirmId(article.id)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-700 hover:text-red-400"
                        title="删除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation modal */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-800 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                <AlertTriangle className="text-red-400" size={20} />
              </div>
              <h3 className="text-lg font-semibold text-white">确认删除</h3>
            </div>
            <p className="mb-6 text-sm text-gray-400">
              确定要删除文章「{articles.find((a) => a.id === confirmId)?.title}」吗？此操作不可撤销。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmId(null)}
                disabled={deleting}
                className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
              >
                取消
              </button>
              <button
                onClick={() =>
                  handleDelete(articles.find((a) => a.id === confirmId) as Article)
                }
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? '删除中...' : '删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
