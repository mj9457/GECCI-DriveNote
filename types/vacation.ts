export type VacationCategory = 'annual' | 'special' | 'leave' | 'sick';

export type VacationSubType =
  | 'full'
  | 'half_am'
  | 'half_pm'
  | 'half_2h'
  | 'special_birth'
  | 'special_general'
  | 'special_foundation_alt'
  | 'special_health'
  | 'special_alt_full'
  | 'special_alt_4h'
  | 'special_alt_2h'
  | 'leave_default'
  | 'sick_default';

export interface VacationSchedule {
  id: string;
  userId: string;
  userName?: string;
  department?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  category: VacationCategory;
  subType: VacationSubType;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VacationFormState {
  userName: string;
  department: string;
  startDate: string;
  endDate: string;
  category: VacationCategory;
  subType: VacationSubType;
  note: string;
}
