'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';

import { db, appId } from '@/lib/firebaseClient';
import { VacationSchedule } from '@/types/vacation';

export const useRealtimeVacations = (user: { uid?: string } | null, isApproved: boolean) => {
  const [vacations, setVacations] = useState<VacationSchedule[]>([]);

  useEffect(() => {
    if (!user || !isApproved) return;

    const q = query(
      collection(db, 'artifacts', appId as string, 'public', 'data', 'vacation_schedules'),
      orderBy('startDate', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const loaded = snap.docs.map(
        (d) => ({ id: d.id, ...(d.data() as Omit<VacationSchedule, 'id'>) }) as VacationSchedule
      );
      setVacations(loaded);
    });

    return () => {
      try {
        unsub();
      } catch {
        /* ignore */
      }
    };
  }, [user, isApproved]);

  return { vacations } as const;
};

export default useRealtimeVacations;
