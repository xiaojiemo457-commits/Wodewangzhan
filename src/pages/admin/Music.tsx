import { useEffect, useState, FormEvent } from 'react';
import { Plus, Trash2, Edit3, X, Music as MusicIcon, Search, Disc3, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { createMusic, updateMusic, deleteMusic } from '@/services/api';
import type { MusicEntry } from '@/types';

type FormState = {
  title: string;
  artist: string;
  url: string;
  cover: string;
  note: string;
  date: string;
};

const emptyForm: FormState = {
  title: '',
  artist: '',
  url: '',
  cover: '',
  note: '',
  date: new Date().toISOString().slice(0, 10),
};

export default function AdminMusic() {
  const musicEntries = useStore((s) => s.musicEntries);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    useStore.getState().fetchMusic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = musicEntries.filter(
    (m) =>
      !search ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.artist.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (entry: MusicEntry) => {
    setEditingId(entry.id);
    setForm({
      title: entry.title,
      artist: entry.artist,
      url: entry.url,
      cover: entry.cover || '',
      note: entry.diary || '',
      date: entry.date ? new Date(entry.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.url) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        artist: form.artist,
        url: form.url,
        cover: form.cover || undefined,
        note: form.note,
        date: form.date || undefined,
      };
      if (editingId) {
        await updateMusic(editingId, payload);
      } else {
        await createMusic(payload);
      }
      await useStore.getState().fetchMusic();
      setModalOpen(false);
    } catch (err: any) {
      alert('保存失败: ' + (err?.message || '未知错误'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await deleteMusic(id);
      await useStore.getState().fetchMusic();
      setConfirmId(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-400">共 {musicEntries.length} 条音乐日记</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索歌曲或艺术家..."
              className="w-56 rounded-lg border border-gray-700 bg-gray-900 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus size={16} />
            添加音乐
          </button>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-800 py-20 text-gray-500">
          <Disc3 size={40} className="mb-3 opacity-50" />
          <p className="text-sm">暂无音乐记录</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-900/60 text-xs uppercase text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left">歌曲</th>
                <th className="px-4 py-3 text-left">艺术家</th>
                <th className="px-4 py-3 text-left">日期</th>
                <th className="px-4 py-3 text-left">笔记</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-gray-900/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {m.cover ? (
                        <img src={m.cover} alt="" className="h-10 w-10 rounded object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-800">
                          <MusicIcon size={16} className="text-gray-500" />
                        </div>
                      )}
                      <span className="font-medium text-white">{m.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{m.artist}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {m.date ? new Date(m.date).toLocaleDateString('zh-CN') : '—'}
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate text-gray-400" title={m.diary || ''}>
                    {m.diary || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(m)}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-700 hover:text-white"
                        title="编辑"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => setConfirmId(m.id)}
                        className="rounded-md p-1.5 text-red-400 hover:bg-red-600/20"
                        title="删除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-700 bg-gray-800 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {editingId ? '编辑音乐' : '添加音乐'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-gray-400">歌曲标题 *</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-400">艺术家</label>
                  <input
                    value={form.artist}
                    onChange={(e) => setForm({ ...form, artist: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-400">音频 URL *</label>
                <input
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  required
                  placeholder="https://.../song.mp3"
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-gray-400">封面 URL</label>
                  <input
                    value={form.cover}
                    onChange={(e) => setForm({ ...form, cover: e.target.value })}
                    placeholder="可选"
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-400">日期</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-400">日记 / 笔记</label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  rows={3}
                  placeholder="和这首歌相关的故事..."
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
                  {saving ? '保存中...' : (editingId ? '保存修改' : '添加')}
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
            <p className="mb-6 text-sm text-gray-400">确定要删除这条音乐日记吗？</p>
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
