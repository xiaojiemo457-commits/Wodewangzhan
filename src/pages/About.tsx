import { useEffect } from 'react';
import { Github, Mail } from 'lucide-react';
import DOMPurify from 'dompurify';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

export default function About() {
  const about = useStore((s) => s.about);

  useEffect(() => {
    useStore.getState().fetchAbout();
  }, []);

  // 净化后端 HTML 内容，防止存储型 XSS
  const safeContent = about?.aboutContent ? DOMPurify.sanitize(about.aboutContent) : '';

  if (!about) {
    return (
      <div className="min-h-screen flex items-center justify-center transition-colors bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <div className="max-w-md w-full px-6 py-16 text-center">
          <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-5xl font-semibold mb-6 shadow-xl shadow-amber-500/20 animate-pulse">
            ...
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  const hasAvatar = about.avatar && about.avatar.trim() !== '';

  return (
    <div className="min-h-screen flex items-center justify-center transition-colors bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="max-w-md w-full px-6 py-16 text-center">
        {/* Avatar */}
        <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-5xl font-semibold mb-6 shadow-xl shadow-amber-500/20 overflow-hidden">
          {hasAvatar ? (
            <img src={about.avatar} alt={about.name} className="w-full h-full object-cover" />
          ) : (
            about.name?.charAt(0) || '?'
          )}
        </div>

        {/* Name */}
        <h1 className="text-3xl font-semibold tracking-tight">{about.name}</h1>
        <p className="mt-3 text-base text-gray-500 dark:text-gray-400">
          {about.bio}
        </p>

        {/* Divider */}
        <div className="my-8 mx-auto h-px w-16 bg-gray-200 dark:bg-gray-800" />

        {/* Bio */}
        {safeContent && (
          <div
            className="text-sm leading-relaxed text-left text-gray-600 dark:text-gray-400"
            dangerouslySetInnerHTML={{ __html: safeContent }}
          />
        )}

        {/* Interests */}
        {about.interests && about.interests.length > 0 && (
          <div className="mt-8 text-left">
            <h2 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">兴趣爱好</h2>
            <div className="flex flex-wrap gap-2">
              {about.interests.map((interest, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-600 border border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-800"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {about.skills && about.skills.length > 0 && (
          <div className="mt-6 text-left">
            <h2 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">技能</h2>
            <div className="flex flex-wrap gap-2">
              {about.skills.map((skill, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r text-white from-amber-500 to-orange-500"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Social */}
        <div className="flex items-center justify-center gap-5 mt-10">
          {about.github && (
            <a
              href={about.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="p-3 rounded-full border transition-all hover:scale-110 hover:text-amber-500 hover:border-amber-500 bg-white border-gray-200 text-gray-600 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300"
            >
              <Github className="w-5 h-5" />
            </a>
          )}
          {about.email && (
            <a
              href={`mailto:${about.email}`}
              aria-label="Email"
              className="p-3 rounded-full border transition-all hover:scale-110 hover:text-amber-500 hover:border-amber-500 bg-white border-gray-200 text-gray-600 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300"
            >
              <Mail className="w-5 h-5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
