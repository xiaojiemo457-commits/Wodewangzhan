import { useState, FormEvent, useEffect } from 'react';
import { Sun, Moon, Monitor, Check, Save, KeyRound, Lock } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { api, changePassword } from '@/services/api';

type ThemePref = 'light' | 'dark' | 'system';

export default function AdminSettings() {
  const theme = useStore((s) => s.theme);
  const isDark = useStore((s) => s.isDark);
  const [siteTitle, setSiteTitle] = useState('');
  const [siteDescription, setSiteDescription] = useState('');
  const [siteFooter, setSiteFooter] = useState('');
  const [siteKeywords, setSiteKeywords] = useState('');
  const [icp, setIcp] = useState('');
  const [themePref, setThemePref] = useState<ThemePref>(
    (localStorage.getItem('theme_pref') as ThemePref) || 'light',
  );
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getSettings();
        setSiteTitle(data.siteTitle || '');
        setSiteDescription(data.siteDescription || '');
        setSiteFooter(data.siteFooter || '');
        setSiteKeywords(data.siteKeywords || '');
        setIcp(data.icp || '');
      } catch (e) {
        console.error('加载站点设置失败', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleThemeChange = (pref: ThemePref) => {
    setThemePref(pref);
    localStorage.setItem('theme_pref', pref);
    if (pref === 'light') {
      useStore.getState().setTheme('light');
    } else if (pref === 'dark') {
      useStore.getState().setTheme('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      useStore.getState().setTheme(prefersDark ? 'dark' : 'light');
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings({
        siteTitle,
        siteDescription,
        siteFooter,
        siteKeywords,
        icp,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('保存失败', e);
      alert('保存失败');
    }
  };

  const themeOptions: { value: ThemePref; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: '浅色', icon: Sun },
    { value: 'dark', label: '深色', icon: Moon },
    { value: 'system', label: '跟随系统', icon: Monitor },
  ];

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">站点信息</h2>
        <div className="space-y-4 rounded-xl border border-gray-800 bg-gray-800/50 p-5">
          <div>
            <label className="mb-1.5 block text-sm text-gray-400">站点标题</label>
            <input
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-gray-400">站点描述</label>
            <textarea
              value={siteDescription}
              onChange={(e) => setSiteDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-gray-400">页脚文字</label>
            <input
              value={siteFooter}
              onChange={(e) => setSiteFooter(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-gray-400">SEO 关键词（逗号分隔）</label>
            <input
              value={siteKeywords}
              onChange={(e) => setSiteKeywords(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-gray-400">ICP 备案号</label>
            <input
              value={icp}
              onChange={(e) => setIcp(e.target.value)}
              placeholder="可选"
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">主题偏好</h2>
        <div className="rounded-xl border border-gray-800 bg-gray-800/50 p-5">
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const active = themePref === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleThemeChange(opt.value)}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition ${
                    active
                      ? 'border-indigo-500 bg-indigo-600/10 text-indigo-400'
                      : 'border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <Icon size={22} />
                  <span className="text-sm">{opt.label}</span>
                  {active && <Check size={14} className="text-indigo-400" />}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-gray-500">
            当前生效：{isDark ? '深色模式' : '浅色模式'}（{theme}）
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Save size={16} />
          保存设置
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-emerald-400">
            <Check size={16} />
            保存成功
          </span>
        )}
      </div>

      {/* 安全 - 修改密码 */}
      <SecuritySection />
    </form>
  );
}

function SecuritySection() {
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!currentPwd || !newPwd) {
      setMsg({ type: 'error', text: '请填写完整信息' });
      return;
    }
    if (newPwd.length < 4) {
      setMsg({ type: 'error', text: '新密码至少 4 位' });
      return;
    }
    if (newPwd !== confirmPwd) {
      setMsg({ type: 'error', text: '两次输入的新密码不一致' });
      return;
    }
    setSubmitting(true);
    try {
      await changePassword(currentPwd, newPwd);
      setMsg({ type: 'success', text: '密码修改成功' });
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err: any) {
      const status = err?.message?.match(/(\d+)/)?.[1];
      setMsg({ type: 'error', text: status === '401' ? '当前密码不正确' : '修改失败，请稍后再试' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-4">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
        <KeyRound size={18} className="text-amber-400" />
        安全设置
      </h2>
      <form onSubmit={handleChangePassword} className="space-y-4 rounded-xl border border-gray-800 bg-gray-800/50 p-5">
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm text-gray-400">
            <Lock size={14} />
            当前密码
          </label>
          <input
            type="password"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm text-gray-400">新密码</label>
            <input
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-gray-400">确认新密码</label>
            <input
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            <KeyRound size={16} />
            {submitting ? '提交中...' : '修改密码'}
          </button>
          {msg && (
            <span className={`text-sm ${msg.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
              {msg.text}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
