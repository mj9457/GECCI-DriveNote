// lib/vehicleUtils.ts
import { VEHICLES } from './vehicleConstants';

export const getVehicleLabel = (vehicleId: string) => {
    const v = VEHICLES.find((v) => v.id === vehicleId);
    return v ? `${v.number} (${v.name})` : vehicleId;
};

// time string "HH:MM" -> minutes (special-case '24:00' -> 1440)
export const timeToMinutes = (t: string) => {
    const [hStr, mStr] = t.split(':');
    const h = parseInt(hStr || '0', 10);
    const m = parseInt(mStr || '0', 10);
    if (h === 24 && m === 0) return 24 * 60;
    return h * 60 + m;
};

export const checkOverlap = (
    bookings: Array<any>,
    vId: string,
    dateStr: string,
    startT: string,
    endT: string,
    excludeId?: string,
) => {
    const startMin = timeToMinutes(startT);
    const endMin = timeToMinutes(endT);

    return bookings.some((b) => {
        if (b.vehicleId !== vId || b.date !== dateStr) return false;
        if (excludeId && b.id === excludeId) return false;

        const bStart = timeToMinutes(b.startTime);
        const bEnd = timeToMinutes(b.endTime);

        return startMin < bEnd && endMin > bStart;
    });
};

export const getPrevFinalKm = (
    bookings: Array<any>,
    driveLogs: Array<any>,
    vehicleId: string,
    dateStr: string,
    bookingId?: string,
    bookingStartTime?: string,
): number | null => {
    const logs = driveLogs
        .filter((log) => {
            if (log.vehicleId !== vehicleId) return false;
            if (!log.date) return false;
            if (bookingId && log.bookingId === bookingId) return false;

            if (log.date < dateStr) return true;
            if (log.date > dateStr) return false;

            if (!bookingStartTime) return true;

            const relatedBooking = bookings.find((b) => b.id === log.bookingId);
            const logStart = relatedBooking?.startTime || '00:00';
            return logStart < bookingStartTime;
        })
        .sort((a, b) => {
            if (a.date !== b.date) return String(a.date).localeCompare(String(b.date));
            const bookingA = bookings.find((bk) => bk.id === a.bookingId);
            const bookingB = bookings.find((bk) => bk.id === b.bookingId);
            const sa = bookingA?.startTime || '00:00';
            const sb = bookingB?.startTime || '00:00';
            return sa.localeCompare(sb);
        });

    if (logs.length === 0) return null;

    const last = logs[logs.length - 1];
    const raw = last.finalKm;
    if (typeof raw === 'number') return raw;
    const n = Number(raw as any);
    return Number.isNaN(n) ? null : n;
};
