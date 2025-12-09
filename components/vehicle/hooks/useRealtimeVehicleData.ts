import { useEffect, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';

import { db, appId } from '@/lib/firebaseClient';
import { Booking, DriveLog } from '@/types/vehicle';

export const useRealtimeVehicleData = (user: any | null, isApproved: boolean) => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [driveLogs, setDriveLogs] = useState<DriveLog[]>([]);

    useEffect(() => {
        if (!user || !isApproved) return;

        const qBookings = query(
            collection(db, 'artifacts', appId, 'public', 'data', 'vehicle_bookings'),
        );
        const qLogs = query(
            collection(db, 'artifacts', appId, 'public', 'data', 'vehicle_drive_logs'),
        );

        const unsubBookings = onSnapshot(qBookings, (snapshot) => {
            const loaded = snapshot.docs.map(
                (d) => ({ id: d.id, ...(d.data() as Omit<Booking, 'id'>) }) as Booking,
            );
            setBookings(loaded);
        });

        const unsubLogs = onSnapshot(qLogs, (snapshot) => {
            const loaded = snapshot.docs.map(
                (d) => ({ id: d.id, ...(d.data() as Omit<DriveLog, 'id'>) }) as DriveLog,
            );
            setDriveLogs(loaded);
        });

        return () => {
            try {
                unsubBookings();
            } catch (e) {
                /* ignore */
            }
            try {
                unsubLogs();
            } catch (e) {
                /* ignore */
            }
        };
    }, [user, isApproved]);

    return { bookings, driveLogs } as const;
};

export default useRealtimeVehicleData;
