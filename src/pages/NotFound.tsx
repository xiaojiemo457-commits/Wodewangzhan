import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { cn } from '../lib/utils';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center transition-colors px-4 bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="text-[120px] sm:text-[160px] font-bold leading-none bg-gradient-to-br from-sky-500 to-indigo-600 bg-clip-text text-transparent">
        404
      </div>
      <p className="text-lg mt-4 text-gray-600 dark:text-gray-300">页面不存在</p>
      <p className="text-sm mt-2 text-gray-400 dark:text-gray-500">你访问的页面走丢了</p>
      <button
        onClick={() => navigate('/')}
        className="mt-8 flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-500 text-white font-medium hover:bg-sky-600 transition-colors"
      >
        <Home className="w-4 h-4" /> 返回首页
      </button>
    </div>
  );
}
