import { useEffect, useState } from 'react';
import { Check, X, Trash2, ExternalLink, Link as LinkIcon } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { FriendLink } from '@/types';

function LinkRow({
  link,
  children,
}: {
  link: FriendLink;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-800 px-4 py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-gray-200">{link.name}</span>
          <a
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="text-gray-500 hover:text-indigo-400"
            title="访问"
          >
            <ExternalLink size={14} />
          </a>
          {link.type === 'builtin' && (
            <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-400">
              内置
            </span>
          )}
          {link.type === 'visitor' && (
            <span className="rounded-full bg-blue-900/50 px-2 py-0.5 text-xs text-blue-300">
              访客
            </span>
          )}
        </div>
        {link.description && (
          <div className="truncate text-xs text-gray-500">{link.description}</div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">{children}</div>
    </div>
  );
}

export default function FriendLinksAdmin() {
  const friendLinks = useStore((s) => s.friendLinks);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    useStore.getState().fetchFriendLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pending = friendLinks.filter((l) => l.status === 'pending');
  const approved = friendLinks.filter((l) => l.status === 'approved');

  const handleApprove = async (id: string) => {
    setActionId(id);
    try {
      await useStore.getState().approveFriendLink(id);
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionId(id);
    try {
      await useStore.getState().rejectFriendLink(id);
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionId(id);
    try {
      await useStore.getState().deleteFriendLink(id);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-800 bg-gray-800/50 p-4 text-center">
          <div className="text-2xl font-bold text-white">{friendLinks.length}</div>
          <div className="text-xs text-gray-400">总数</div>
        </div>
        <div className="rounded-xl border border-amber-800/50 bg-amber-900/10 p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">{pending.length}</div>
          <div className="text-xs text-amber-400/80">待审核</div>
        </div>
        <div className="rounded-xl border border-emerald-800/50 bg-emerald-900/10 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">{approved.length}</div>
          <div className="text-xs text-emerald-400/80">已通过</div>
        </div>
      </div>

      {/* Pending links */}
      <div className="rounded-xl border border-gray-800 bg-gray-800/50">
        <div className="flex items-center gap-2 border-b border-gray-800 px-4 py-3">
          <LinkIcon size={18} className="text-amber-400" />
          <h2 className="font-semibold text-white">待审核 ({pending.length})</h2>
        </div>
        {pending.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">暂无待审核友链</div>
        ) : (
          pending.map((link) => (
            <LinkRow key={link.id} link={link}>
              <button
                onClick={() => handleApprove(link.id)}
                disabled={actionId === link.id}
                className="rounded-lg bg-emerald-600/10 p-1.5 text-emerald-400 hover:bg-emerald-600 hover:text-white disabled:opacity-50"
                title="通过"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => handleReject(link.id)}
                disabled={actionId === link.id}
                className="rounded-lg bg-red-600/10 p-1.5 text-red-400 hover:bg-red-600 hover:text-white disabled:opacity-50"
                title="拒绝"
              >
                <X size={16} />
              </button>
            </LinkRow>
          ))
        )}
      </div>

      {/* Approved links */}
      <div className="rounded-xl border border-gray-800 bg-gray-800/50">
        <div className="flex items-center gap-2 border-b border-gray-800 px-4 py-3">
          <LinkIcon size={18} className="text-emerald-400" />
          <h2 className="font-semibold text-white">已通过 ({approved.length})</h2>
        </div>
        {approved.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">暂无已通过友链</div>
        ) : (
          approved.map((link) => (
            <LinkRow key={link.id} link={link}>
              {link.type !== 'builtin' && (
                <button
                  onClick={() => handleDelete(link.id)}
                  disabled={actionId === link.id}
                  className="rounded-lg bg-red-600/10 p-1.5 text-red-400 hover:bg-red-600 hover:text-white disabled:opacity-50"
                  title="删除"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </LinkRow>
          ))
        )}
      </div>
    </div>
  );
}
