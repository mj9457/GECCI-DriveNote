'use client';

import { useMemo } from 'react';

import { useRealtimeNoticePosts } from '@/components/notice/hooks/useRealtimeNoticePosts';

export const useNoticeUnread = (enabled: boolean, userId?: string, userEmail?: string) => {
  const { posts } = useRealtimeNoticePosts(enabled);

  const unreadCount = useMemo(() => {
    if (!enabled) return 0;
    if (!userId && !userEmail) return posts.length;
    return posts.filter((post) => {
      const likes = post.likes || [];
      const confirmed =
        (!!userId && likes.some((like) => like.uid === userId)) ||
        (!!userEmail && likes.some((like) => like.email === userEmail));
      return !confirmed;
    }).length;
  }, [enabled, posts, userEmail, userId]);

  return { unreadCount } as const;
};

export default useNoticeUnread;
