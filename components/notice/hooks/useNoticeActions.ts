'use client';

import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';

import { db, appId } from '@/lib/firebaseClient';
import { NoticePost } from '@/types/notice';

type NoticeCreateInput = Omit<NoticePost, 'id'>;
type NoticeUpdateInput = Partial<Omit<NoticePost, 'id' | 'createdAt'>>;

export const useNoticeActions = () => {
  const createPost = async (input: NoticeCreateInput) => {
    await addDoc(
      collection(db, 'artifacts', String(appId), 'public', 'data', 'notice_posts'),
      input
    );
  };

  const updatePost = async (id: string, input: NoticeUpdateInput) => {
    const ref = doc(db, 'artifacts', String(appId), 'public', 'data', 'notice_posts', id);
    await updateDoc(ref, input);
  };

  const deletePost = async (id: string) => {
    const ref = doc(db, 'artifacts', String(appId), 'public', 'data', 'notice_posts', id);
    await deleteDoc(ref);
  };

  return {
    createPost,
    updatePost,
    deletePost,
  } as const;
};

export default useNoticeActions;
