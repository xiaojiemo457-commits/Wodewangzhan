import { useEffect } from 'react';
import { Github, Mail } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

export default function Footer() {
  const siteSettings = useStore((s) => s.siteSettings);

  useEffect(() => {
    useStore.getState().fetchSiteSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const footerText = siteSettings?.siteFooter || '用心记录生活';
  const icp = siteSettings?.icp;

  return (
    <footer className="relative z-10 py-6 px-4 text-black/60 dark:text-white/60">
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-3 text-sm">
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/xiaojiemo457-commits/-"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="transition-colors text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
          >
            <Github size={18} />
          </a>
          <a
            href="mailto:hello@example.com"
            aria-label="Email"
            className="transition-colors text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
          >
            <Mail size={18} />
          </a>
        </div>
        <p>© {new Date().getFullYear()} {footerText}</p>
        {icp && (
          <a
            href="https://beian.miit.gov.cn"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs hover:underline text-black/40 dark:text-white/40"
          >
            {icp}
          </a>
        )}
      </div>
    </footer>
  );
}
