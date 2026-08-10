import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { isDark, setIsAdmin } = useStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (password === 'admin123') {
        const token = btoa('admin-authenticated');
        localStorage.setItem('admin_auth_token', token);
        setIsAdmin(true);
        navigate('/admin');
      } else {
        setError('密码错误，请重试');
        setLoading(false);
      }
    }, 300);
  };

  return (
    <div
      className={`flex min-h-screen items-center justify-center p-4 ${
        isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
      }`}
    >
      <div
        className={`w-full max-w-sm rounded-2xl border p-8 shadow-xl ${
          isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
        }`}
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600">
            <Lock className="text-white" size={26} />
          </div>
          <h1 className="text-2xl font-bold">管理员登录</h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            请输入密码以进入后台
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className={`mb-1.5 block text-sm font-medium ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              placeholder="请输入管理员密码"
              className={`w-full rounded-lg border px-3 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${
                isDark
                  ? 'border-gray-700 bg-gray-800 text-white placeholder:text-gray-500'
                  : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400'
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <button
          onClick={() => navigate('/')}
          className={`mt-4 flex w-full items-center justify-center gap-1.5 text-sm ${
            isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <ArrowLeft size={16} />
          返回首页
        </button>
      </div>
    </div>
  );
}
