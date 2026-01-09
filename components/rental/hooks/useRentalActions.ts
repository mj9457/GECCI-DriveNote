'use client';

import { addDoc, collection, deleteDoc, doc, updateDoc, DocumentData } from 'firebase/firestore';
import { useCallback } from 'react';

import { db, appId } from '@/lib/firebaseClient';
import { RentalSchedule } from '@/types/rental';

export const useRentalActions = () => {
  const saveRental = useCallback(
    async (
      mode: 'create' | 'edit',
      params: {
        id?: string;
        data: Omit<RentalSchedule, 'id'> & Partial<RentalSchedule>;
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
            'rental_schedules',
            params.id
          );
          await updateDoc(ref, params.data as DocumentData);
          return { ok: true };
        }

        await addDoc(
          collection(db, 'artifacts', appId as string, 'public', 'data', 'rental_schedules'),
          params.data as DocumentData
        );
        return { ok: true };
      } catch (error) {
        console.error('saveRental failed', error);
        return { ok: false, error };
      }
    },
    []
  );

  const deleteRental = useCallback(async (id: string) => {
    try {
      const ref = doc(db, 'artifacts', appId as string, 'public', 'data', 'rental_schedules', id);
      await deleteDoc(ref);
      return { ok: true };
    } catch (error) {
      console.error('deleteRental failed', error);
      return { ok: false, error };
    }
  }, []);

  return { saveRental, deleteRental } as const;
};

export default useRentalActions;
