import { useEffect, useState, FormEvent } from 'react';
import { Plus, Trash2, Edit3, X, Search, Calendar, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { TimelineEvent } from '@/types';

type FormState = {
  age: number;
  year: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  sort_order: number;
};

const emptyForm: FormState = {
  age: 0,
  year: '',
  title: '',
  description: '',
  icon: '',
  color: '#6366f1',
  sort_order: 0,
};

export default function AdminTimeline() {
  const timelineEvents = useStore((s) => s.timelineEvents);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    useStore.getState().fetchTimeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = timelineEvents.filter(
    (t) =>
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item: TimelineEvent) => {
    setEditingId(item.id);
    setForm({
      age: item.age,
      year: item.year,
      title: item.title,
      description: item.description,
      icon: item.icon,
      color: item.color,
      sort_order: item.sort_order,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        age: Number(form.age) || 0,
        year: form.year.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        icon: form.icon.trim(),
        color: form.color,
        sort_order: Number(form.sort_order) || 0,
      };
      if (editingId) {
        await useStore.getState().updateTimelineItem(editingId, payload);
      } else {
        await useStore.getState().addTimelineEvent(payload);
      }
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
      await useStore.getState().removeTimelineEvent(id);
      setConfirmId(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-400">共 {timelineEvents.length} 条时间轴事件</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索标题或描述..."
              className="w-56 rounded-lg border border-gray-700 bg-gray-900 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus size={16} />
            添加事件
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-800 py-20 text-gray-500">
          <Calendar size={40} className="mb-3 opacity-50" />
          <p className="text-sm">暂无时间轴事件</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-900/60 text-xs uppercase text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left">年龄</th>
                <th className="px-4 py-3 text-left">年份</th>
                <th className="px-4 py-3 text-left">标题</th>
                <th className="px-4 py-3 text-left">图标</th>
                <th className="px-4 py-3 text-left">颜色</th>
                <th className="px-4 py-3 text-left">排序</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-gray-900/40">
                  <td className="px-4 py-3 text-gray-300">{t.age}</td>
                  <td className="px-4 py-3 text-gray-400">{t.year || '—'}</td>
                  <td className="px-4 py-3 max-w-xs truncate text-gray-200" title={t.title}>
                    {t.title}
                  </td>
                  <td className="px-4 py-3 text-lg">{t.icon || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-5 w-5 rounded border border-gray-600"
                        style={{ backgroundColor: t.color }}
                      />
                      <span className="text-xs text-gray-500">{t.color}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{t.sort_order}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(t)}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-700 hover:text-white"
                        title="编辑"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => setConfirmId(t.id)}
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-xl border border-gray-700 bg-gray-800 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {editingId ? '编辑时间轴事件' : '添加时间轴事件'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-gray-400">年龄</label>
                  <input
                    type="number"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-400">年份</label>
                  <input
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    placeholder="如 2024"
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-400">排序</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-400">标题 *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder="事件标题"
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-400">描述</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="事件描述..."
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-gray-400">图标</label>
                  <input
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    placeholder="emoji 🎒"
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-400">颜色</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="h-10 w-12 cursor-pointer rounded-lg border border-gray-700 bg-gray-900"
                    />
                    <input
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
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

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-800 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                <AlertTriangle className="text-red-400" size={20} />
              </div>
              <h3 className="text-lg font-semibold text-white">确认删除</h3>
            </div>
            <p className="mb-6 text-sm text-gray-400">确定要删除这条时间轴事件吗？</p>
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