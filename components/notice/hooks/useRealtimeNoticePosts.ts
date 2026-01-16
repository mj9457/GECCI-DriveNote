'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';

import { db, appId } from '@/lib/firebaseClient';
import { NoticePost } from '@/types/notice';

export const useRealtimeNoticePosts = (enabled: boolean) => {
  const [posts, setPosts] = useState<NoticePost[]>([]);

  useEffect(() => {
    if (!enabled) return;

    const q = query(
      collection(db, 'artifacts', appId as string, 'public', 'data', 'notice_posts'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(
        (d) => ({ id: d.id, ...(d.data() as Omit<NoticePost, 'id'>) }) as NoticePost
      );
      setPosts(loaded);
    });

    return () => {
      try {
        unsub();
      } catch {
        /* ignore */
      }
    };
  }, [enabled]);

  return { posts } as const;
};

export default useRealtimeNoticePosts;
