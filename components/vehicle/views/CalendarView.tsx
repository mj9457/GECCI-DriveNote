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
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    onSelectDate(newDate);
  };

  return (
    <div className="p-2 sm:p-4">
      {/* 달력 헤더 */}
      <div className="flex justify-between items-center mb-4 px-1">
        <button
          onClick={() => onChangeMonth(-1)}
          className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
          {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
        </h2>

        <div className="flex items-center gap-1 sm:gap-2">
          {!isCurrentMonth && (
            <button
              onClick={onGoToday}
              className="px-2.5 py-1 text-xs sm:text-sm border rounded-full bg-white text-gray-700 hover:bg-blue-50 hover:border-blue-400 transition-colors"
            >
              오늘
            </button>
          )}
          <button
            onClick={() => onChangeMonth(1)}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs sm:text-sm text-gray-500 font-medium">
        <div className="text-red-500">일</div>
        <div>월</div>
        <div>화</div>
        <div>수</div>
        <div>목</div>
        <div>금</div>
        <div className="text-blue-500">토</div>
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {/* 빈 칸 */}
        {blanks.map((_, i) => (
          <div key={`blank-${i}`} className="min-h-20 sm:h-32 bg-gray-50/50 rounded-lg" />
        ))}

        {/* 날짜 칸 */}
        {dayNumbers.map((day) => {
          const dateStr = `${currentDate.getFullYear()}-${String(
            currentDate.getMonth() + 1
          ).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

          const dayBookings = monthBookings
            .filter((b) => b.date === dateStr)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          const isToday = formatDate(today) === dateStr;

          // 모바일에서는 최대 4개의 점만 표시
          const mobileDots = dayBookings.slice(0, 4);

          return (
            <div
              key={day}
              onClick={() => handleDateClick(day)}
              className={`
                flex flex-col
                min-h-20 sm:h-34 
                border rounded-lg p-1.5 sm:p-2.5 
                cursor-pointer transition-all hover:shadow-md active:scale-95
                bg-white relative
                ${isToday ? 'ring-2 ring-blue-500 ring-offset-1 border-transparent' : 'border-gray-200'}
              `}
            >
              {/* 날짜 숫자 + (뱃지) */}
              <div className="flex items-center justify-between sm:mb-1">
                <span
                  className={`text-sm sm:text-base font-semibold ml-0.5 ${
                    isToday ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  {day}
                </span>

                {/* 일정 개수 뱃지 (모바일에서는 점으로 대체하므로 숨길 수도 있으나, 개수 확인용으로 유지하거나 선택 가능) */}
                {dayBookings.length > 0 && (
                  <span className="min-w-4 h-4 px-1 rounded-full bg-red-100 text-red-600 text-[12px] font-bold flex items-center justify-center sm:bg-red-500 sm:text-white">
                    {dayBookings.length}
                  </span>
                )}
              </div>

              {/* [PC/태블릿] 상세 텍스트 리스트 (sm 이상) */}
              <div className="hidden sm:flex flex-col gap-1 mt-1 overflow-hidden">
                {dayBookings.slice(0, 4).map((b, idx) => {
                  const bookingEnd = new Date(`${b.date}T${b.endTime}:00`);
                  const isFinished = bookingEnd < today;
                  const colorClass = isFinished
                    ? 'bg-gray-200 text-gray-500'
                    : (VEHICLE_COLORS[b.vehicleId] ?? 'bg-gray-100 text-gray-800');

                  return (
                    <div
                      key={idx}
                      className={`text-[12px] px-1.5 py-0.5 rounded truncate ${colorClass} sm:flex sm:items-center`}
                      title={`${b.startTime} ${b.requester} (${b.purpose})`}
                    >
                      {b.startTime} {VEHICLES.find((v) => v.id === b.vehicleId)?.name || ''} /{' '}
                      {b.requester}
                    </div>
                  );
                })}
              </div>

              {/* [모바일] 색상 점(Dot) 리스트 (sm 미만) */}
              <div className="flex sm:hidden flex-wrap gap-1 mt-auto content-end justify-center pb-1">
                {mobileDots.map((b, idx) => {
                  const bookingEnd = new Date(`${b.date}T${b.endTime}:00`);
                  const isFinished = bookingEnd < today;

                  // 배경색 클래스에서 색상 추출 (Tailwind 클래스 매핑 필요)
                  // 간단하게 완료 여부와 차량 타입에 따라 점 색상 지정
                  let dotColor = 'bg-gray-400';
                  if (!isFinished) {
                    if (b.vehicleId === 'v1') dotColor = 'bg-green-500';
                    else if (b.vehicleId === 'v2') dotColor = 'bg-purple-500';
                    else dotColor = 'bg-blue-500';
                  }

                  return <div key={idx} className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />;
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
