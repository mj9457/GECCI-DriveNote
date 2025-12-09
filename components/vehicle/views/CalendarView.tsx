// components/vehicle/CalendarView.tsx
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Booking } from '@/types/vehicle';
import { VEHICLES, VEHICLE_COLORS } from '@/lib/vehicleConstants';
import { formatDate } from '@/lib/timeUtils';

interface CalendarViewProps {
    currentDate: Date;
    bookings: Booking[];
    selectedDate: Date;
    onChangeMonth: (delta: number) => void;
    onSelectDate: (date: Date) => void;
    onGoToday: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
    currentDate,
    bookings,
    selectedDate,
    onChangeMonth,
    onSelectDate,
    onGoToday,
}) => {
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentDate);
    const blanks = Array(firstDay).fill(null);
    const dayNumbers = Array.from({ length: days }, (_, i) => i + 1);

    const monthBookings = bookings.filter((b) => {
        const bDate = new Date(b.date);
        return (
            bDate.getMonth() === currentDate.getMonth() &&
            bDate.getFullYear() === currentDate.getFullYear()
        );
    });

    const today = new Date();
    const isCurrentMonth =
        currentDate.getFullYear() === today.getFullYear() &&
        currentDate.getMonth() === today.getMonth();

    const handleDateClick = (day: number) => {
        const newDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            day,
        );
        onSelectDate(newDate);
    };

    return (
        <div className="p-3 sm:p-4">
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={() => onChangeMonth(-1)}
                    className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full"
                >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
                    {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
                </h2>

                <div className="flex items-center gap-1 sm:gap-2">
                    {!isCurrentMonth && (
                        <button
                            onClick={onGoToday}
                            className="px-2 sm:px-3 py-1 text-[11px] sm:text-xs border rounded-full bg-white text-gray-700 hover:bg-blue-50 hover:border-blue-400"
                        >
                            오늘
                        </button>
                    )}
                    <button
                        onClick={() => onChangeMonth(1)}
                        className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full"
                    >
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1 sm:mb-2 text-center text-[10px] sm:text-xs md:text-sm text-gray-500 font-medium">
                <div className="text-red-500">일</div>
                <div>월</div>
                <div>화</div>
                <div>수</div>
                <div>목</div>
                <div>금</div>
                <div className="text-blue-500">토</div>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {blanks.map((_, i) => (
                    <div
                        key={`blank-${i}`}
                        className="h-24 sm:h-32 bg-gray-50 rounded-lg"
                    />
                ))}

                {dayNumbers.map((day) => {
                    const dateStr = `${currentDate.getFullYear()}-${String(
                        currentDate.getMonth() + 1,
                    ).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                    const dayBookings = monthBookings
                        .filter((b) => b.date === dateStr)
                        .slice()
                        .sort((a, b) => a.startTime.localeCompare(b.startTime));

                    const isToday = formatDate(today) === dateStr;

                    return (
                        <div
                            key={day}
                            onClick={() => handleDateClick(day)}
                            className={`h-24 sm:h-32 border rounded-lg p-2 sm:p-2.5 md:p-3 cursor-pointer transition-all hover:shadow-md hover:border-blue-300 bg-white relative ${isToday ? 'ring-2 ring-blue-500' : 'border-gray-200'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <span
                                    className={`text-sm sm:text-base font-semibold ${isToday ? 'text-blue-600' : 'text-gray-700'
                                        }`}
                                >
                                    {day}
                                </span>

                                {dayBookings.length > 0 && (
                                    <span className="ml-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] sm:text-[11px] flex items-center justify-center">
                                        {dayBookings.length}
                                    </span>
                                )}
                            </div>

                            <div className="mt-1 flex flex-col gap-1 overflow-hidden h-14 sm:h-20 md:h-24">
                                {dayBookings.length > 0 &&
                                    dayBookings.slice(0, 4).map((b, idx) => {
                                        const bookingEnd = new Date(`${b.date}T${b.endTime}:00`);
                                        const isFinished = bookingEnd < today;

                                        const colorClass = isFinished
                                            ? 'bg-gray-200 text-gray-500'
                                            : VEHICLE_COLORS[b.vehicleId] ??
                                            'bg-gray-100 text-gray-800';

                                        return (
                                            <div
                                                key={idx}
                                                className={`text-[10px] sm:text-xs px-1 rounded truncate ${colorClass}`}
                                            >
                                                {b.startTime}{' '}
                                                {VEHICLES.find((v) => v.id === b.vehicleId)?.name} /{' '}
                                                {b.requester}
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
