export type ChairmanScheduleType = 'chairman' | 'event';

export interface ChairmanSchedule {
  id: string;
  scheduleType: ChairmanScheduleType;
  title: string;
  startDate: string;
  endDate: string;
  scheduleDate?: string;
  startTime: string;
  endTime: string;
  location?: string;
  note?: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChairmanFormState {
  scheduleType: ChairmanScheduleType;
  title: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  note: string;
}
