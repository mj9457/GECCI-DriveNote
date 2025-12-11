// components/vehicle/DayView.tsx
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Booking } from '@/types/vehicle';
import { HOURS, VEHICLES, VEHICLE_COLORS } from '@/lib/vehicleConstants';
import { formatDate } from '@/lib/timeUtils';

interface DayViewProps {
  selectedDate: Date;
  bookings: Booking[];
  onBackToCalendar: () => void;
  onChangeDay: (delta: number) => void;
  onOpenBookingForm: (booking: Booking) => void;
}

export const DayView: React.FC<DayViewProps> = ({
  selectedDate,
  bookings,
  onBackToCalendar,
  onChangeDay,
  onOpenBookingForm,
}) => {
  const dateStr = formatDate(selectedDate);
  const dayBookings = bookings.filter((b) => b.date === dateStr);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4 bg-white shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onBackToCalendar}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full text-gray-600"
          >
            <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
          </button>
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">
            {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 배차현황
          </h2>
        </div>
        <div className="flex gap-1 sm:gap-2">
          <button
            onClick={() => onChangeDay(-1)}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => onChangeDay(1)}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronRight size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white relative">
        <div className="flex sticky top-0 z-20 bg-gray-50">
          <div className="w-12 sm:w-16 shrink-0 border-right bg-gray-50" />
          {VEHICLES.map((v) => (
            <div
              key={v.id}
              className="flex-1 min-w-24 sm:min-w-[120px] p-2 sm:p-3 text-center border-r border-gray-300 font-semibold text-gray-700 text-xs sm:text-sm"
            >
              <div className="text-[10px] sm:text-xs text-gray-500">{v.name}</div>
              <div className="text-xs sm:text-sm">{v.number}</div>
            </div>
          ))}
        </div>

        <div className="relative h-[1152px] mt-1.5">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute w-full flex"
              style={{ top: `${hour * 48}px`, height: '48px' }}
            >
              <div className="w-12 sm:w-16 shrink-0 text-[10px] sm:text-xs text-gray-400 text-right pr-1.5 sm:pr-2 -mt-1.5 border-r bg-white z-10">
                {String(hour).padStart(2, '0')}:00
              </div>
              <div className="flex-1 border-b border-gray-300 w-full relative" />
            </div>
          ))}

          <div className="absolute inset-0 flex pl-12 sm:pl-16">
            {VEHICLES.map((v) => (
              <div key={`line-${v.id}`} className="flex-1 border-r border-gray-300 h-full relative">
                {dayBookings
                  .filter((b) => b.vehicleId === v.id)
                  .map((b) => {
                    const [sh, sm] = b.startTime.split(':').map(Number);
                    const [eh, em] = b.endTime.split(':').map(Number);
                    const startMinutes = sh * 60 + sm;
                    const endMinutes = eh * 60 + em;
                    const duration = endMinutes - startMinutes;

                    const top = startMinutes * 0.8;
                    const height = Math.max(duration * 0.8, 20);

                    const colorClass = VEHICLE_COLORS[b.vehicleId] ?? 'bg-blue-500 border-blue-600';

                    const requesterName = b.requester || b.userName;
                    const department = b.department;

                    return (
                      <div
                        key={b.id}
                        onClick={() => onOpenBookingForm(b)}
                        className={`
                          absolute left-1 right-1 rounded
                          px-1.5 sm:px-2 py-0.5 sm:py-1
                          text-[10px] sm:text-xs 
                          shadow-sm overflow-hidden z-10
                          opacity-90 hover:opacity-100 hover:scale-[1.02]
                          transition-all cursor-pointer
                          border
                          ${colorClass}
                        `}
                        style={{ top: `${top}px`, height: `${height}px` }}
                        title={`${b.startTime}~${b.endTime} | ${b.destination} | ${requesterName}${
                          department ? ' / ' + department : ''
                        }`}
                      >
                        <div className="font-bold truncate">
                          {requesterName}
                          {department && (
                            <span className="ml-1 text-[10px] sm:text-[11px] opacity-80">
                              ({department})
                            </span>
                          )}
                        </div>
                        <div className="truncate opacity-90">
                          {`${b.destination}(${b.purpose})`}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
