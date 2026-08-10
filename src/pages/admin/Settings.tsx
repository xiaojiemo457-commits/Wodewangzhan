import { useState, FormEvent } from 'react';
import { Sun, Moon, Monitor, Check, Save } from 'lucide-react';
import { useStore } from '@/store/useStore';

type ThemePref = 'light' | 'dark' | 'system';

export default function AdminSettings() {
  const { theme, setTheme, isDark } = useStore();
  const [siteTitle, setSiteTitle] = useState('莫的个人网站');
  const [siteDescription, setSiteDescription] = useState('记录生活、思考与技术');
  const [themePref, setThemePref] = useState<ThemePref>(
    (localStorage.getItem('theme_pref') as ThemePref) || 'light',
  );
  const [saved, setSaved] = useState(false);

  const handleThemeChange = (pref: ThemePref) => {
    setThemePref(pref);
    localStorage.setItem('theme_pref', pref);
    if (pref === 'light') {
      setTheme('light');
    } else if (pref === 'dark') {
      setTheme('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
    </form>
  );
}
