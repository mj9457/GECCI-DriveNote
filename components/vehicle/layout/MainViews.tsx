import React from 'react';
import { Booking, DriveLog, LogFormState, TimeInputs, VehicleFilter, View } from '@/types/vehicle';
import { CalendarView } from '@/components/vehicle/views/CalendarView';
import { DayView } from '@/components/vehicle/views/DayView';
import { BookingForm } from '@/components/vehicle/views/BookingForm';
import { MonthListView } from '@/components/vehicle/views/MonthListView';
import { DriveLogForm } from '@/components/vehicle/views/DriveLogForm';
import { LogsListView } from '@/components/vehicle/views/LogsListView';
import { UserSummaryView } from '@/components/vehicle/views/UserSummaryView';

interface MainViewsProps {
  view: View;
  currentDate: Date;
  bookings: Booking[];
  driveLogs: DriveLog[];
  selectedDate: Date;
  selectedBooking: Booking | null;
  formMode: 'create' | 'edit' | 'view';
  timeInputs: TimeInputs;
  formData: {
    vehicleId: string;
    startTime: string;
    endTime: string;
    destination: string;
    purpose: string;
    requester: string;
    department: string;
  };
  defaultDept: string;
  isSubmitting: boolean;
  vehicleFilter: VehicleFilter;
  onVehicleFilterChange: (f: VehicleFilter) => void;
  onChangeMonth: (d: number) => void;
  onSelectDate: (d: Date) => void;
  onChangeSelectedDate: (d: Date) => void;
  onGoToday: () => void;
  onChangeDay: (d: number) => void;
  onOpenBookingForm: (b: Booking) => void;
  onOpenDriveLogForm: (b: Booking, o?: 'list' | 'logs' | 'user') => void;
  onSubmitBooking: () => void;
  onDeleteBooking: () => void;
  onBackFromForm: (v: View) => void;
  onChangeFormData: (d: {
    vehicleId: string;
    startTime: string;
    endTime: string;
    destination: string;
    purpose: string;
    requester: string;
    department: string;
  }) => void;
  onChangeTimeInputs: (t: TimeInputs) => void;
  onChangeLogForm: (l: LogFormState) => void;
  onSubmitLog: () => void;
  onBackFromLog: () => void;
  onDeleteMyBooking: (b: Booking) => void;
  onDeleteMyLog: (l: DriveLog) => void;
  checkOverlap: (
    vId: string,
    dateStr: string,
    startT: string,
    endT: string,
    excludeId?: string
  ) => boolean;
  logForm: LogFormState;
  prevKm: number | null;
  user: { uid: string; displayName?: string | null; email?: string; role?: string };
}

export const MainViews: React.FC<MainViewsProps> = ({
  view,
  currentDate,
  bookings,
  driveLogs,
  selectedDate,
  selectedBooking,
  formMode,
  timeInputs,
  formData,
  defaultDept,
  isSubmitting,
  vehicleFilter,
  onVehicleFilterChange,
  onChangeMonth,
  onSelectDate,
  onChangeSelectedDate,
  onGoToday,
  onChangeDay,
  onOpenBookingForm,
  onOpenDriveLogForm,
  onSubmitBooking,
  onDeleteBooking,
  onBackFromForm,
  onChangeFormData,
  onChangeTimeInputs,
  onChangeLogForm,
  onSubmitLog,
  onBackFromLog,
  onDeleteMyBooking,
  onDeleteMyLog,
  checkOverlap,
  logForm,
  prevKm,
  user,
}) => {
  return (
    <main className="flex-1 overflow-auto bg-white md:bg-gray-50 relative">
      {view === 'calendar' && (
        <CalendarView
          currentDate={currentDate}
          bookings={bookings}
          selectedDate={selectedDate}
          onChangeMonth={onChangeMonth}
          onSelectDate={(date) => onSelectDate(date)}
          onGoToday={onGoToday}
        />
      )}

      {view === 'day' && (
        <DayView
          selectedDate={selectedDate}
          bookings={bookings}
          onBackToCalendar={() => onSelectDate(selectedDate)}
          onChangeDay={onChangeDay}
          onOpenBookingForm={onOpenBookingForm}
        />
      )}

      {view === 'form' && (
        <BookingForm
          mode={formMode}
          selectedDate={selectedDate}
          formViewPrev={'calendar'}
          formData={formData}
          defaultDept={defaultDept}
          timeInputs={timeInputs}
          bookings={bookings}
          selectedBooking={selectedBooking}
          isSubmitting={isSubmitting}
          onChangeFormData={onChangeFormData}
          onChangeTimeInputs={onChangeTimeInputs}
          onSubmit={onSubmitBooking}
          onDelete={onDeleteBooking}
          onBack={onBackFromForm}
          onChangeDate={onChangeSelectedDate}
          user={user}
          checkOverlap={checkOverlap}
        />
      )}

      {view === 'list' && (
        <MonthListView
          currentDate={currentDate}
          bookings={bookings}
          driveLogs={driveLogs}
          vehicleFilter={vehicleFilter}
          onVehicleFilterChange={onVehicleFilterChange}
          onChangeMonth={onChangeMonth}
          onGoToday={onGoToday}
          onOpenBookingForm={onOpenBookingForm}
          onOpenDriveLogForm={onOpenDriveLogForm}
        />
      )}

      {view === 'log' && selectedBooking && (
        <DriveLogForm
          booking={selectedBooking}
          logForm={logForm}
          prevKm={prevKm}
          onChangeLogForm={onChangeLogForm}
          onSubmit={onSubmitLog}
          onBack={onBackFromLog}
        />
      )}

      {view === 'logs' && (
        <LogsListView
          currentDate={currentDate}
          bookings={bookings}
          driveLogs={driveLogs}
          vehicleFilter={vehicleFilter}
          onVehicleFilterChange={onVehicleFilterChange}
          onChangeMonth={onChangeMonth}
          onGoToday={onGoToday}
          onOpenDriveLogForm={onOpenDriveLogForm}
        />
      )}

      {view === 'user' && (
        <UserSummaryView
          currentDate={currentDate}
          user={user}
          bookings={bookings}
          driveLogs={driveLogs}
          vehicleFilter={vehicleFilter}
          onVehicleFilterChange={onVehicleFilterChange}
          onChangeMonth={onChangeMonth}
          onGoToday={onGoToday}
          onOpenDriveLogForm={onOpenDriveLogForm}
          onDeleteMyBooking={onDeleteMyBooking}
          onDeleteMyLog={onDeleteMyLog}
        />
      )}
    </main>
  );
};

export default MainViews;
