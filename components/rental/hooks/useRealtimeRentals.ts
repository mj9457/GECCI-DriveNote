'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';

import { db, appId } from '@/lib/firebaseClient';
import { RentalSchedule } from '@/types/rental';

export const useRealtimeRentals = (user: { uid?: string } | null, isApproved: boolean) => {
  const [rentals, setRentals] = useState<RentalSchedule[]>([]);

  useEffect(() => {
    if (!user || !isApproved) return;

    const q = query(
      collection(db, 'artifacts', appId as string, 'public', 'data', 'rental_schedules'),
      orderBy('rentalDate', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const loaded = snap.docs.map(
        (d) => ({ id: d.id, ...(d.data() as Omit<RentalSchedule, 'id'>) }) as RentalSchedule
      );
      setRentals(loaded);
    });

    return () => {
      try {
        unsub();
      } catch {
        /* ignore */
      }
    };
  }, [user, isApproved]);

  return { rentals } as const;
};

export default useRealtimeRentals;
