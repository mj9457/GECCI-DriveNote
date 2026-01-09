export type RentalTimeOption = 'full_day' | 'basic';

export type RentalFacility =
  | 'none'
  | 'screen_tv'
  | 'laptop'
  | 'hvac'
  | 'audio'
  | 'geumgang_parking';

export type RentalMemberType = 'member' | 'non_member';

export interface RentalSchedule {
  id: string;
  userId: string;
  businessNumber: string;
  companyName: string;
  applicantName: string;
  phone: string;
  eventName: string;
  rentalDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  timeOption: RentalTimeOption;
  facilities: RentalFacility[];
  memberType: RentalMemberType;
  createdAt?: string;
  updatedAt?: string;
}

export interface RentalFormState {
  businessNumber: string;
  companyName: string;
  applicantName: string;
  phone: string;
  eventName: string;
  rentalDate: string;
  startTime: string;
  endTime: string;
  timeOption: RentalTimeOption;
  facilities: RentalFacility[];
  memberType: RentalMemberType;
}
