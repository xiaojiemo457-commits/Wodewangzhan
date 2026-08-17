import { useEffect, useMemo, useState } from 'react';
import { cn } from '../../lib/utils';

interface TableOfContentsProps {
  content: string;
}

interface Heading {
  level: number;
  text: string;
  id: string;
}

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseHeadings(content: string): Heading[] {
  const lines = content.split('\n');
  const headings: Heading[] = [];
  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      headings.push({ level, text, id: slugify(text) });
    }
  }
  return headings;
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const headings = useMemo(() => parseHeadings(content), [content]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '0px 0px -75% 0px', threshold: 0 }
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <nav className="hidden lg:block">
      <div className="sticky top-24">
        <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-white/80">
          目录
        </h4>
        <ul className="space-y-0.5 border-l text-sm border-black/10 dark:border-white/10">
          {headings.map((h) => {
            const active = activeId === h.id;
            return (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => handleClick(h.id)}
                  className={cn(
                    'block w-full border-l-2 pl-3 pr-2 py-1 text-left transition-colors -ml-px',
                    h.level === 3 ? 'pl-6' : 'pl-3',
                    active
                      ? 'border-black font-medium text-black dark:border-white dark:text-white'
                      : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-white/50 dark:hover:text-white/80'
                  )}
                >
                  {h.text}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
