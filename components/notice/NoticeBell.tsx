'use client';

import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useNoticeUnread } from '@/components/notice/hooks/useNoticeUnread';

interface NoticeBellProps {
  enabled: boolean;
  userId?: string;
  userEmail?: string;
}

export const NoticeBell = ({ enabled, userId, userEmail }: NoticeBellProps) => {
  const router = useRouter();
  const { unreadCount } = useNoticeUnread(enabled, userId, userEmail);

  if (!enabled) return null;

  const badge =
    unreadCount > 99 ? '99+' : unreadCount > 0 ? String(unreadCount) : '';

  return (
    <button
      type="button"
      onClick={() => router.push('/notice')}
      className="relative flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 bg-white text-gray-600 hover:bg-blue-50 hover:border-blue-400 transition"
      aria-label="공지 게시판"
    >
      <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
      {badge && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center border border-white">
          {badge}
        </span>
      )}
    </button>
  );
};

export default NoticeBell;
