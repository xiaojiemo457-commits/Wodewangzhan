import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bold,
  Italic,
  Heading,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  List,
  Maximize2,
  Minimize2,
  Save,
  X,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { createArticle, updateArticle, fetchArticleById } from '@/services/api';

const ToolbarButton = ({
  icon: Icon,
  title,
  onClick,
}: {
  icon: typeof Bold;
  title: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className="rounded p-1.5 text-gray-400 hover:bg-gray-700 hover:text-white"
  >
    <Icon size={18} />
  </button>
);

export default function ArticleEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const categories = useStore((s) => s.categories);

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [fullscreen, setFullscreen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEdit && id) {
      (async () => {
        try {
          const { article } = await fetchArticleById(id);
          setTitle(article.title);
          setCategoryId(article.category_id);
          setContent(article.content);
          setSummary(article.summary);
          setCoverImage(article.cover_image);
        } catch {
          /* noop */
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [id, isEdit]);

  const wrapSelection = (before: string, after: string = before) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end);
    const next = content.slice(0, start) + before + selected + after + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = start + before.length;
      ta.selectionEnd = end + before.length;
    });
  };

  const insertAtCursor = (text: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const next = content.slice(0, start) + text + content.slice(ta.selectionEnd);
    setContent(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + text.length;
    });
  };

  const insertLinePrefix = (prefix: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = content.lastIndexOf('\n', start - 1) + 1;
    const next = content.slice(0, lineStart) + prefix + content.slice(lineStart);
    setContent(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + prefix.length;
    });
  };

  const handleBold = () => wrapSelection('**');
  const handleItalic = () => wrapSelection('*');
  const handleHeading = () => insertLinePrefix('## ');
  const handleQuote = () => insertLinePrefix('> ');
  const handleCode = () => wrapSelection('`');
  const handleList = () => insertLinePrefix('- ');
  const handleLink = () => {
    const url = window.prompt('输入链接地址');
    if (!url) return;
    wrapSelection('[', `](${url})`);
  };
  const handleImage = () => {
    const url = window.prompt('输入图片地址');
    if (!url) return;
    const alt = window.prompt('输入图片描述（可选）') || '';
    insertAtCursor(`![${alt}](${url})`);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault();
        handleBold();
      } else if (e.key === 'i') {
        e.preventDefault();
        handleItalic();
      } else if (e.key === 'k') {
        e.preventDefault();
        handleLink();
      }
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert('标题和内容不能为空');
      return;
    }
    setSaving(true);
    const payload = {
      title,
      content,
      summary: summary || content.slice(0, 100),
      category_id: categoryId,
      cover_image: coverImage,
    };
    try {
      if (isEdit && id) {
        await updateArticle(id, payload);
      } else {
        await createArticle(payload);
      }
      await useStore.getState().fetchArticles();
      navigate('/admin/articles');
    } catch {
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">加载中...</div>
    );
  }

  const editor = (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-800 bg-gray-900 px-4 py-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="文章标题"
          className="min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none focus:border-indigo-500"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none focus:border-indigo-500"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => setFullscreen((f) => !f)}
          className="rounded-lg border border-gray-700 p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
          title={fullscreen ? '退出全屏' : '全屏编辑'}
        >
          {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
        <button
          onClick={() => navigate('/admin/articles')}
          className="rounded-lg border border-gray-700 px-4 py-2 text-gray-300 hover:bg-gray-800"
        >
          <X size={16} className="inline" />
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? '保存中...' : '保存'}
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-gray-800 bg-gray-900 px-3 py-2">
        <ToolbarButton icon={Bold} title="加粗 (Ctrl+B)" onClick={handleBold} />
        <ToolbarButton icon={Italic} title="斜体 (Ctrl+I)" onClick={handleItalic} />
        <ToolbarButton icon={Heading} title="标题" onClick={handleHeading} />
        <ToolbarButton icon={Quote} title="引用" onClick={handleQuote} />
        <ToolbarButton icon={Code} title="代码" onClick={handleCode} />
        <ToolbarButton icon={LinkIcon} title="链接 (Ctrl+K)" onClick={handleLink} />
        <ToolbarButton icon={ImageIcon} title="图片" onClick={handleImage} />
        <ToolbarButton icon={List} title="列表" onClick={handleList} />
      </div>

      {/* Editor + Preview */}
      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
        <div className="flex min-h-0 flex-col border-r border-gray-800">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="在此输入 Markdown 内容..."
            className="min-h-[300px] flex-1 resize-none bg-gray-900 p-4 font-mono text-sm text-gray-200 outline-none lg:min-h-0"
          />
        </div>
        <div className="min-h-[300px] overflow-auto bg-gray-950 p-4 lg:min-h-0">
          <div className="prose max-w-none text-gray-200">
            {content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            ) : (
              <span className="text-gray-600">预览区</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900">
        <div className="h-full p-0">{editor}</div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
      {editor}
    </div>
  );
}
