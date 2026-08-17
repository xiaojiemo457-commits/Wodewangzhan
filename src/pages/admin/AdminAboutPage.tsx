import { useEffect, useState, FormEvent } from 'react';
import { User, Save } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { AboutData } from '@/types';

type FormState = {
  name: string;
  bio: string;
  avatar: string;
  email: string;
  github: string;
  interests: string;
  skills: string;
  aboutContent: string;
};

const emptyForm: FormState = {
  name: '',
  bio: '',
  avatar: '',
  email: '',
  github: '',
  interests: '',
  skills: '',
  aboutContent: '',
};

export default function AdminAboutPage() {
  const about = useStore((s) => s.about);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await useStore.getState().fetchAbout();
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (about) {
      setForm({
        name: about.name || '',
        bio: about.bio || '',
        avatar: about.avatar || '',
        email: about.email || '',
        github: about.github || '',
        interests: (about.interests || []).join(', '),
        skills: (about.skills || []).join(', '),
        aboutContent: about.aboutContent || '',
      });
    }
  }, [about]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Partial<AboutData> = {
        name: form.name.trim(),
        bio: form.bio.trim(),
        avatar: form.avatar.trim(),
        email: form.email.trim(),
        github: form.github.trim(),
        interests: form.interests
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        skills: form.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        aboutContent: form.aboutContent,
      };
      await useStore.getState().updateAboutPage(payload);
    } catch (err: any) {
      alert('保存失败: ' + (err?.message || '未知错误'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        <span className="ml-3 text-sm">加载中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/10">
          <User className="text-indigo-400" size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">关于页设置</h2>
          <p className="text-sm text-gray-400">编辑个人信息和关于页面内容</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-gray-800 bg-gray-800/50 p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-300">基本信息</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-gray-400">昵称</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="你的名字"
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-400">头像 URL</label>
              <input
                value={form.avatar}
                onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                placeholder="https://..."
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-400">邮箱</label>
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-400">GitHub</label>
              <input
                value={form.github}
                onChange={(e) => setForm({ ...form, github: e.target.value })}
                placeholder="github.com/yourname"
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-800/50 p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-300">个人简介</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-gray-400">简介</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={2}
                placeholder="一句话介绍自己"
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-gray-400">兴趣爱好 <span className="text-xs text-gray-500">（用逗号分隔）</span></label>
                <textarea
                  value={form.interests}
                  onChange={(e) => setForm({ ...form, interests: e.target.value })}
                  rows={3}
                  placeholder="阅读, 音乐, 旅行"
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-400">技能标签 <span className="text-xs text-gray-500">（用逗号分隔）</span></label>
                <textarea
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                  rows={3}
                  placeholder="React, TypeScript, Node.js"
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-800/50 p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-300">关于内容</h3>
          <div>
            <label className="mb-1 block text-sm text-gray-400">关于页正文 <span className="text-xs text-gray-500">（支持纯文本 / HTML）</span></label>
            <textarea
              value={form.aboutContent}
              onChange={(e) => setForm({ ...form, aboutContent: e.target.value })}
              rows={12}
              placeholder="<h2>关于我</h2><p>这里是关于页的详细内容...</p>"
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 font-mono text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? '保存中...' : '保存修改'}
          </button>
        </div>
      </form>
    </div>
  );
}