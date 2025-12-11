import { addDoc, collection, deleteDoc, doc, updateDoc, DocumentData } from 'firebase/firestore';
import { useCallback } from 'react';
import { db, appId } from '@/lib/firebaseClient';
import { Booking, DriveLog } from '@/types/vehicle';

export const useActions = () => {
  const saveBooking = useCallback(
    async (
      mode: 'create' | 'edit',
      params: {
        id?: string;
        data: Omit<Booking, 'id'> & Partial<Booking>;
      }
    ) => {
      try {
        if (mode === 'edit' && params.id) {
          const bookingRef = doc(
            db,
            'artifacts',
            appId as string,
            'public',
            'data',
            'vehicle_bookings',
            params.id
          );
          await updateDoc(bookingRef, params.data as DocumentData);
          return { ok: true };
        } else {
          await addDoc(
            collection(db, 'artifacts', appId as string, 'public', 'data', 'vehicle_bookings'),
            params.data as DocumentData
          );
          return { ok: true };
        }
      } catch (err) {
        console.error('saveBooking failed', err);
        return { ok: false, error: err };
      }
    },
    []
  );

  const deleteBooking = useCallback(async (id: string) => {
    try {
      const bookingRef = doc(
        db,
        'artifacts',
        appId as string,
        'public',
        'data',
        'vehicle_bookings',
        id
      );
      await deleteDoc(bookingRef);
      return { ok: true };
    } catch (err) {
      console.error('deleteBooking failed', err);
      return { ok: false, error: err };
    }
  }, []);

  const saveDriveLog = useCallback(
    async (params: { id?: string; data: Omit<DriveLog, 'id'> & Partial<DriveLog> }) => {
      try {
        if (params.id) {
          const logRef = doc(
            db,
            'artifacts',
            appId as string,
            'public',
            'data',
            'vehicle_drive_logs',
            params.id
          );
          await updateDoc(logRef, params.data as DocumentData);
          return { ok: true };
        } else {
          await addDoc(
            collection(db, 'artifacts', appId as string, 'public', 'data', 'vehicle_drive_logs'),
            params.data as DocumentData
          );
          return { ok: true };
        }
      } catch (err) {
        console.error('saveDriveLog failed', err);
        return { ok: false, error: err };
      }
    },
    []
  );

  const deleteDriveLog = useCallback(async (id: string) => {
    try {
      const logRef = doc(
        db,
        'artifacts',
        appId as string,
        'public',
        'data',
        'vehicle_drive_logs',
        id
      );
      await deleteDoc(logRef);
      return { ok: true };
    } catch (err) {
      console.error('deleteDriveLog failed', err);
      return { ok: false, error: err };
    }
  }, []);

  return { saveBooking, deleteBooking, saveDriveLog, deleteDriveLog } as const;
};

export default useActions;
