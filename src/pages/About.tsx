import { Github, Mail } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

export default function About() {
  const { isDark } = useStore();

  const socials = [
    { icon: Github, href: 'https://github.com/xiaojiemo457-commits/-', label: 'GitHub' },
    { icon: Mail, href: 'mailto:hello@example.com', label: 'Email' },
  ];

  return (
    <div className={cn('min-h-screen flex items-center justify-center transition-colors', isDark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900')}>
      <div className="max-w-md w-full px-6 py-16 text-center">
        {/* Avatar */}
        <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-5xl font-semibold mb-6 shadow-xl shadow-amber-500/20">
          莫
        </div>

        {/* Name */}
        <h1 className="text-3xl font-semibold tracking-tight">莫军杰</h1>
        <p className={cn('mt-3 text-base', isDark ? 'text-gray-400' : 'text-gray-500')}>
          记录生活，热爱生活
        </p>

        {/* Divider */}
        <div className={cn('my-8 mx-auto h-px w-16', isDark ? 'bg-gray-800' : 'bg-gray-200')} />

        {/* Bio */}
        <p className={cn('text-sm leading-relaxed', isDark ? 'text-gray-400' : 'text-gray-600')}>
          普通人一个。喜欢清晨的微风，喜欢傍晚的散步，喜欢把每一天的小事都记下来。生活不需要多精彩，真实就好。
        </p>

        {/* Social */}
        <div className="flex items-center justify-center gap-5 mt-10">
          {socials.map(({ icon: Icon, href, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className={cn(
                'p-3 rounded-full border transition-all hover:scale-110 hover:text-amber-500 hover:border-amber-500',
                isDark ? 'bg-gray-900 border-gray-800 text-gray-300' : 'bg-white border-gray-200 text-gray-600'
              )}
            >
              <Icon className="w-5 h-5" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
