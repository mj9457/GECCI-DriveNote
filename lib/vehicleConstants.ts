// lib/vehicleConstants.ts
import { Vehicle } from '@/types/vehicle';

export const VEHICLES: Vehicle[] = [
    { id: 'v1', number: '176호 7342', name: '티볼리' },
    { id: 'v2', number: '205하 2053', name: '카니발' },
];

export const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const VEHICLE_COLORS: Record<string, string> = {
    v1: 'bg-green-100 text-green-800',
    v2: 'bg-purple-100 text-purple-800',
};
