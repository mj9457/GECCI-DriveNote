'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

import { db, appId } from '@/lib/firebaseClient';
import { OvertimeApplication } from '@/types/overtime';

export const useRealtimeOvertimeApplications = (monthKey: string, enabled: boolean) => {
  const [items, setItems] = useState<OvertimeApplication[]>([]);

  useEffect(() => {
    if (!enabled) return;
    if (!monthKey) return;

    const q = query(
      collection(db, 'artifacts', appId as string, 'public', 'data', 'overtime_applications'),
      where('monthKey', '==', monthKey)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(
        (d) => ({ id: d.id, ...(d.data() as Omit<OvertimeApplication, 'id'>) }) as OvertimeApplication
      );
      loaded.sort((a, b) => {
        if (a.applicationDate !== b.applicationDate) {
          return a.applicationDate < b.applicationDate ? 1 : -1;
        }
        if (a.startTime !== b.startTime) return a.startTime < b.startTime ? 1 : -1;
        const ac = a.createdAt || '';
        const bc = b.createdAt || '';
        return ac < bc ? 1 : -1;
      });
      setItems(loaded);
    });

    return () => {
      try {
        unsub();
      } catch {
        /* ignore */
      }
    };
  }, [enabled, monthKey]);

  return { items } as const;
};

export default useRealtimeOvertimeApplications;
