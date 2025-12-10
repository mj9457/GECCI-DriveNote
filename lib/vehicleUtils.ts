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

const safeNumber = (v: unknown): number | null => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v.trim() !== '') {
        const n = Number(v);
        return Number.isNaN(n) ? null : n;
    }
    return null;
};

const getBookingStartTime = (bookings: Booking[], bookingId?: string) => {
    if (!bookingId) return '00:00';
    const b = bookings.find((x) => x.id === bookingId);
    return b?.startTime || '00:00';
};

type Booking = {
    id: string;
    vehicleId: string;
    date: string;
    startTime: string;
    endTime: string;
    // add other fields as needed
};

export const checkOverlap = (
    bookings: Booking[],
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


type DriveLog = {
    vehicleId: string;
    date: string;
    bookingId?: string;
    finalKm?: number | string;
    // add other fields as needed
};

export const getPrevFinalKm = (
    bookings: Booking[],
    driveLogs: DriveLog[],
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

            const logStart = getBookingStartTime(bookings, log.bookingId);
            return logStart < bookingStartTime;
        })
        .sort((a, b) => {
            if (a.date !== b.date) return String(a.date).localeCompare(String(b.date));
            const sa = getBookingStartTime(bookings, a.bookingId);
            const sb = getBookingStartTime(bookings, b.bookingId);
            return sa.localeCompare(sb);
        });

    if (logs.length === 0) return null;

    const last = logs[logs.length - 1];
    return safeNumber(last.finalKm);
};
