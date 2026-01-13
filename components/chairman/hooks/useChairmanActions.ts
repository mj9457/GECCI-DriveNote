'use client';

import { addDoc, collection, deleteDoc, doc, updateDoc, DocumentData } from 'firebase/firestore';
import { useCallback } from 'react';

import { db, appId } from '@/lib/firebaseClient';
import { ChairmanSchedule } from '@/types/chairman';

export const useChairmanActions = () => {
  const saveSchedule = useCallback(
    async (
      mode: 'create' | 'edit',
      params: {
        id?: string;
        data: Omit<ChairmanSchedule, 'id'> & Partial<ChairmanSchedule>;
      }
    ) => {
      try {
        if (mode === 'edit' && params.id) {
          const ref = doc(
            db,
            'artifacts',
            appId as string,
            'public',
            'data',
            'chairman_schedules',
            params.id
          );
          await updateDoc(ref, params.data as DocumentData);
          return { ok: true };
        }

        await addDoc(
          collection(db, 'artifacts', appId as string, 'public', 'data', 'chairman_schedules'),
          params.data as DocumentData
        );
        return { ok: true };
      } catch (error) {
        console.error('saveSchedule failed', error);
        return { ok: false, error };
      }
    },
    []
  );

  const deleteSchedule = useCallback(async (id: string) => {
    try {
      const ref = doc(
        db,
        'artifacts',
        appId as string,
        'public',
        'data',
        'chairman_schedules',
        id
      );
      await deleteDoc(ref);
      return { ok: true };
    } catch (error) {
      console.error('deleteSchedule failed', error);
      return { ok: false, error };
    }
  }, []);

  return { saveSchedule, deleteSchedule } as const;
};

export default useChairmanActions;
