'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';

import { db, appId } from '@/lib/firebaseClient';
import { ChairmanSchedule } from '@/types/chairman';

export const useRealtimeChairmanSchedules = (user: { uid?: string } | null, isApproved: boolean) => {
  const [schedules, setSchedules] = useState<ChairmanSchedule[]>([]);

  useEffect(() => {
    if (!user || !isApproved) return;

    const q = query(
      collection(db, 'artifacts', appId as string, 'public', 'data', 'chairman_schedules'),
      orderBy('startDate', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const loaded = snap.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...(doc.data() as Omit<ChairmanSchedule, 'id'>),
          }) as ChairmanSchedule
      );
      setSchedules(loaded);
    });

    return () => {
      try {
        unsub();
      } catch {
        /* ignore */
      }
    };
  }, [user, isApproved]);

  return { schedules } as const;
};

export default useRealtimeChairmanSchedules;
