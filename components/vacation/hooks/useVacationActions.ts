'use client';

import { addDoc, collection, deleteDoc, doc, updateDoc, DocumentData } from 'firebase/firestore';
import { useCallback } from 'react';

import { db, appId } from '@/lib/firebaseClient';
import { VacationSchedule } from '@/types/vacation';

export const useVacationActions = () => {
  const saveVacation = useCallback(
    async (
      mode: 'create' | 'edit',
      params: {
        id?: string;
        data: Omit<VacationSchedule, 'id'> & Partial<VacationSchedule>;
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
            'vacation_schedules',
            params.id
          );
          await updateDoc(ref, params.data as DocumentData);
          return { ok: true };
        }

        await addDoc(
          collection(db, 'artifacts', appId as string, 'public', 'data', 'vacation_schedules'),
          params.data as DocumentData
        );
        return { ok: true };
      } catch (error) {
        console.error('saveVacation failed', error);
        return { ok: false, error };
      }
    },
    []
  );

  const deleteVacation = useCallback(async (id: string) => {
    try {
      const ref = doc(
        db,
        'artifacts',
        appId as string,
        'public',
        'data',
        'vacation_schedules',
        id
      );
      await deleteDoc(ref);
      return { ok: true };
    } catch (error) {
      console.error('deleteVacation failed', error);
      return { ok: false, error };
    }
  }, []);

  return { saveVacation, deleteVacation } as const;
};

export default useVacationActions;
