import React from 'react';
import { CalendarView } from '@/components/vehicle/views/CalendarView';
import { DayView } from '@/components/vehicle/views/DayView';
import { BookingForm } from '@/components/vehicle/views/BookingForm';
import { MonthListView } from '@/components/vehicle/views/MonthListView';
import { DriveLogForm } from '@/components/vehicle/views/DriveLogForm';
import { LogsListView } from '@/components/vehicle/views/LogsListView';
import { UserSummaryView } from '@/components/vehicle/views/UserSummaryView';

interface MainViewsProps {
    view: string;
    currentDate: Date;
    bookings: any[];
    driveLogs: any[];
    selectedDate: Date;
    selectedBooking: any | null;
    formMode: any;
    timeInputs: any;
    formData: any;
    defaultDept: string;
    isSubmitting: boolean;
    vehicleFilter: any;
    onVehicleFilterChange: (f: any) => void;
    onChangeMonth: (d: number) => void;
    onSelectDate: (d: Date) => void;
    onGoToday: () => void;
    onChangeDay: (d: number) => void;
    onOpenBookingForm: (b: any) => void;
    onOpenDriveLogForm: (b: any, o?: any) => void;
    onSubmitBooking: () => void;
    onDeleteBooking: () => void;
    onBackFromForm: (v: any) => void;
    onChangeFormData: (d: any) => void;
    onChangeTimeInputs: (t: any) => void;
    onChangeLogForm: (l: any) => void;
    onSubmitLog: () => void;
    onBackFromLog: () => void;
    onDeleteMyBooking: (b: any) => void;
    onDeleteMyLog: (l: any) => void;
    checkOverlap: (vId: string, dateStr: string, startT: string, endT: string, excludeId?: string) => boolean;
    logForm: any;
    prevKm: number | null;
    user: any;
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
                    formViewPrev={"calendar"}
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
                    userId={user?.uid}
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
