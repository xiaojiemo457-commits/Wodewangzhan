import { useEffect, useState, FormEvent } from 'react';
import { Plus, Trash2, X, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { createPhoto, deletePhoto } from '@/services/api';

export default function AdminPhotos() {
  const { photos, fetchPhotos } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    url: '',
    description: '',
    year: new Date().getFullYear(),
  });
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.url) return;
    setSaving(true);
    try {
      await createPhoto(form);
      await fetchPhotos();
      setModalOpen(false);
      setForm({ title: '', url: '', description: '', year: new Date().getFullYear() });
    } catch {
      alert('添加失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await deletePhoto(id);
      await fetchPhotos();
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
        <p className="text-sm text-gray-400">共 {photos.length} 张照片</p>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus size={16} />
          添加照片
        </button>
      </div>

      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-800 py-16 text-gray-500">
          <ImageIcon size={40} className="mb-3 opacity-50" />
          <p className="text-sm">暂无照片</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative overflow-hidden rounded-xl border border-gray-800"
            >
              <div className="aspect-square bg-gray-800">
                {photo.url ? (
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="text-gray-600" size={32} />
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="truncate text-sm font-medium text-gray-200">{photo.title}</div>
                <div className="text-xs text-gray-500">{photo.year}</div>
              </div>
              <button
                onClick={() => setConfirmId(photo.id)}
                className="absolute right-2 top-2 rounded-lg bg-black/60 p-1.5 text-red-400 opacity-0 transition group-hover:opacity-100 hover:bg-red-600 hover:text-white"
                title="删除"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add photo modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-800 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">添加照片</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-gray-400">标题</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-400">图片链接</label>
                <input
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://"
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-400">描述</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-400">年份</label>
                <input
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? '保存中...' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-800 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                <AlertTriangle className="text-red-400" size={20} />
              </div>
              <h3 className="text-lg font-semibold text-white">确认删除</h3>
            </div>
            <p className="mb-6 text-sm text-gray-400">确定要删除这张照片吗？</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmId(null)}
                disabled={deleting}
                className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(confirmId)}
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
