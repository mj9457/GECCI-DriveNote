// types/vehicle.ts
export type VehicleId = 'v1' | 'v2';

export interface Vehicle {
  id: VehicleId;
  number: string;
  name: string;
}

export type VehicleFilter = 'all' | 'v1' | 'v2';

export interface Booking {
  id: string;
  vehicleId: VehicleId;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  destination: string;
  purpose: string;
  requester: string;
  department: string;
  userId: string;
  userName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DriveLog {
  id: string;
  bookingId: string;
  vehicleId: VehicleId;
  date: string; // "YYYY-MM-DD"
  from: string;
  via: string;
  to: string;
  prevFinalKm: number | null;
  finalKm: number;
  distanceKm: number;
  purpose: string;
  driver: string;
  doubleParking: string;
  note: string;
  createdAt?: string;
  updatedAt?: string;
}

export type View = 'calendar' | 'day' | 'form' | 'list' | 'log' | 'logs' | 'user';

export interface TimeInputs {
  start: string;
  end: string;
}

export interface LogFormState {
  from: string;
  via: string;
  to: string;
  finalKm: string;
  purpose: string;
  driver: string;
  doubleParking: string;
  note: string;
}
