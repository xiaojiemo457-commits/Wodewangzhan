import { Github, Mail } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

export default function Footer() {
  const { isDark } = useStore();
  return (
    <footer
      className={cn(
        'relative z-10 py-6 px-4',
        isDark ? 'text-white/60' : 'text-black/60'
      )}
    >
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-3 text-sm">
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/xiaojiemo457-commits/-"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className={cn(
              'transition-colors',
              isDark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'
            )}
          >
            <Github size={18} />
          </a>
          <a
            href="mailto:hello@example.com"
            aria-label="Email"
            className={cn(
              'transition-colors',
              isDark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'
            )}
          >
            <Mail size={18} />
          </a>
        </div>
        <p>© {new Date().getFullYear()} 莫 · 用心记录生活</p>
      </div>
    </footer>
  );
}
