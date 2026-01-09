'use client';

import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { RentalSchedule, RentalMemberType } from '@/types/rental';

const MEMBER_COLORS: Record<RentalMemberType, string> = {
  member: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  non_member: 'bg-rose-100 text-rose-800 border-rose-200',
};

const TIME_OPTION_LABELS: Record<string, string> = {
  full_day: '전일',
  basic: '기본',
};

type Props = {
  currentMonth: Date;
  rentals: RentalSchedule[];
  onChangeMonth: (delta: number) => void;
  onSelectEvent: (rental: RentalSchedule) => void;
  onAdd: () => void;
};

const parseDate = (value: string) => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export function RentalCalendar({
  currentMonth,
  rentals,
  onChangeMonth,
  onSelectEvent,
  onAdd,
}: Props) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const blanks = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();

  const monthEvents = rentals.filter((r) => {
    const day = parseDate(r.rentalDate);
    return day.getFullYear() === year && day.getMonth() === month;
  });

  const dailyEvents: Record<number, RentalSchedule[]> = {};
  monthEvents.forEach((r) => {
    const day = parseDate(r.rentalDate).getDate();
    if (!dailyEvents[day]) dailyEvents[day] = [];
    dailyEvents[day].push(r);
  });

  return (
    <div className="flex flex-col gap-3 sm:gap-4 h-full">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChangeMonth(-1)}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 border border-gray-200"
            aria-label="이전 달"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-lg sm:text-xl font-bold text-gray-900 tabular-nums">
            {year}년 {month + 1}월
          </div>
          <button
            type="button"
            onClick={() => onChangeMonth(1)}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 border border-gray-200"
            aria-label="다음 달"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 text-[11px] sm:text-xs text-gray-600">
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200">
            <span className="font-semibold">회원사/유관단체(무료)</span>
          </div>
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full border bg-rose-50 text-rose-800 border-rose-200">
            <span className="font-semibold">비회원사(유료)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChangeMonth(0)}
            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm hover:bg-cyan-50"
          >
            오늘
          </button>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-cyan-600 text-white text-sm font-semibold hover:bg-cyan-700 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            대관 등록
          </button>
        </div>
      </header>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-3 sm:p-4 flex-1">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500 mb-2">
          <div className="text-red-500">일</div>
          <div>월</div>
          <div>화</div>
          <div>수</div>
          <div>목</div>
          <div>금</div>
          <div className="text-blue-500">토</div>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {Array.from({ length: blanks }).map((_, idx) => (
            <div
              key={`blank-${idx}`}
              className="h-28 sm:h-32 bg-gray-50 rounded-xl border border-dashed border-gray-200"
            />
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const dateObj = new Date(year, month, day);
            const events = dailyEvents[day] || [];
            const isToday = isSameDay(today, dateObj);

            return (
              <div
                key={day}
                className={`flex flex-col gap-1 p-1 sm:p-2 rounded-xl border h-28 sm:h-32 ${
                  isToday
                    ? 'border-cyan-500 shadow-[0_0_0_1px_rgba(6,182,212,0.25)]'
                    : 'border-gray-200'
                } bg-white`}
              >
                <div
                  className={`text-sm font-semibold tabular-nums ${isToday ? 'text-cyan-600' : 'text-gray-800'}`}
                >
                  {day}
                </div>

                <div className="flex flex-col gap-1 overflow-auto">
                  {events.slice(0, 3).map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => onSelectEvent(event)}
                      className={`w-full text-left text-[11px] sm:text-xs px-2 py-1 rounded-lg border ${
                        MEMBER_COLORS[event.memberType]
                      } hover:opacity-90 transition`}
                    >
                      <div className="font-semibold truncate">{event.eventName || '행사명 없음'}</div>
                      <div className="text-[10px] sm:text-[11px] opacity-80 truncate">
                        {event.companyName || '-'} · {TIME_OPTION_LABELS[event.timeOption] || '-'}
                      </div>
                    </button>
                  ))}

                  {events.length > 3 && (
                    <div className="text-[11px] text-gray-500">+ {events.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default RentalCalendar;
