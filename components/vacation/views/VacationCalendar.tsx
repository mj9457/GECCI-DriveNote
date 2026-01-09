'use client';

import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { VacationSchedule, VacationCategory } from '@/types/vacation';

const CATEGORY_LABELS: Record<VacationCategory, string> = {
  annual: '연차',
  special: '특별휴가',
  leave: '휴직',
  sick: '병가',
};

const CATEGORY_COLORS: Record<VacationCategory, string> = {
  annual: 'bg-blue-100 text-blue-800 border-blue-200',
  special: 'bg-amber-100 text-amber-800 border-amber-200',
  leave: 'bg-slate-100 text-slate-800 border-slate-200',
  sick: 'bg-rose-100 text-rose-800 border-rose-200',
};

type Props = {
  currentMonth: Date;
  vacations: VacationSchedule[];
  onChangeMonth: (delta: number) => void;
  onSelectEvent: (vacation: VacationSchedule) => void;
  onAdd: () => void;
};

const SUBTYPE_LABELS: Record<string, string> = {
  full: '연차',
  half_am: '오전반차',
  half_pm: '오후반차',
  half_2h: '2H 반차',
  special_birth: '출산',
  special_general: '특별',
  special_foundation_alt: '대체휴일(창립기념일)',
  special_health: '건강검진',
  special_alt_full: '대체휴무(종일)',
  special_alt_4h: '대체휴무(4H)',
  special_alt_2h: '대체휴무(2H)',
  leave_default: '휴직',
  sick_default: '병가(무급)',
};

const parseDate = (value: string) => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const dateInRange = (day: Date, start: string, end: string) => {
  const s = parseDate(start);
  const e = parseDate(end);
  return s <= day && day <= e;
};

export function VacationCalendar({
  currentMonth,
  vacations,
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

  const monthEvents = vacations.filter((v) => {
    const start = parseDate(v.startDate);
    const end = parseDate(v.endDate);
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    return end >= monthStart && start <= monthEnd;
  });

  const dailyEvents: Record<number, VacationSchedule[]> = {};
  monthEvents.forEach((v) => {
    for (let d = 1; d <= daysInMonth; d += 1) {
      const dayDate = new Date(year, month, d);
      if (dateInRange(dayDate, v.startDate, v.endDate)) {
        if (!dailyEvents[d]) dailyEvents[d] = [];
        dailyEvents[d].push(v);
      }
    }
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
          {Object.entries(CATEGORY_LABELS).map(([category, label]) => (
            <div
              key={category}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border ${CATEGORY_COLORS[category as VacationCategory]}`}
            >
              <span className="font-semibold">{label}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChangeMonth(0)}
            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm hover:bg-blue-50"
          >
            오늘
          </button>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            휴가 추가
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
                    ? 'border-blue-500 shadow-[0_0_0_1px_rgba(37,99,235,0.25)]'
                    : 'border-gray-200'
                } bg-white`}
              >
                <div
                  className={`text-sm font-semibold tabular-nums ${isToday ? 'text-blue-600' : 'text-gray-800'}`}
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
                        CATEGORY_COLORS[event.category]
                      } hover:opacity-90 transition`}
                    >
                      <div className="font-semibold truncate">
                        {event.userName || '이름 없음'}
                        <span className="text-[10px] sm:text-[11px] opacity-80 border-l border-gray-400 pl-1 ml-1">
                          {SUBTYPE_LABELS[event.subType] || '-'}
                        </span>
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

export default VacationCalendar;
