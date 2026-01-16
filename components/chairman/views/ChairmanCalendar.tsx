'use client';

import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { ChairmanSchedule, ChairmanScheduleType } from '@/types/chairman';

const TYPE_COLORS: Record<ChairmanScheduleType, string> = {
  chairman: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  event: 'bg-amber-100 text-amber-800 border-amber-200',
};

const TYPE_LABELS: Record<ChairmanScheduleType, string> = {
  chairman: '수행',
  event: '행사',
};

type Props = {
  currentMonth: Date;
  schedules: ChairmanSchedule[];
  onChangeMonth: (delta: number) => void;
  onSelectEvent: (schedule: ChairmanSchedule) => void;
  onAdd: () => void;
  showAddButton?: boolean;
};

const parseDate = (value?: string) => {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export function ChairmanCalendar({
  currentMonth,
  schedules,
  onChangeMonth,
  onSelectEvent,
  onAdd,
  showAddButton = true,
}: Props) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const blanks = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month, daysInMonth);
  const today = new Date();

  const dailyEvents: Record<number, ChairmanSchedule[]> = {};
  schedules.forEach((schedule) => {
    const startValue = schedule.startDate || schedule.scheduleDate;
    const endValue = schedule.endDate || schedule.startDate || schedule.scheduleDate;
    const start = parseDate(startValue);
    const end = parseDate(endValue);
    if (!start || !end) return;
    if (end < start) return;
    if (end < monthStart || start > monthEnd) return;

    const rangeStart = start < monthStart ? new Date(monthStart) : new Date(start);
    const rangeEnd = end > monthEnd ? new Date(monthEnd) : new Date(end);
    for (let cursor = rangeStart; cursor <= rangeEnd; cursor.setDate(cursor.getDate() + 1)) {
      const day = cursor.getDate();
      if (!dailyEvents[day]) dailyEvents[day] = [];
      dailyEvents[day].push(schedule);
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
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full border bg-indigo-50 text-indigo-800 border-indigo-200">
            <span className="font-semibold">회장님 수행</span>
          </div>
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full border bg-amber-50 text-amber-800 border-amber-200">
            <span className="font-semibold">행사 일정</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChangeMonth(0)}
            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm hover:bg-indigo-50"
          >
            오늘
          </button>
          {showAddButton && (
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              일정 등록
            </button>
          )}
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
            const events = (dailyEvents[day] || []).slice().sort((a, b) => {
              if (a.startTime === b.startTime) return a.title.localeCompare(b.title);
              return a.startTime.localeCompare(b.startTime);
            });
            const isToday = isSameDay(today, dateObj);

            return (
              <div
                key={day}
                className={`flex flex-col gap-1 p-1 sm:p-2 rounded-xl border h-28 sm:h-32 ${
                  isToday
                    ? 'border-indigo-500 shadow-[0_0_0_1px_rgba(99,102,241,0.25)]'
                    : 'border-gray-200'
                } bg-white`}
              >
                <div
                  className={`text-sm font-semibold tabular-nums ${
                    isToday ? 'text-indigo-600' : 'text-gray-800'
                  }`}
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
                        TYPE_COLORS[event.scheduleType]
                      } hover:opacity-90 transition`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold truncate">{event.title || '일정 없음'}</div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-current">
                          {TYPE_LABELS[event.scheduleType]}
                        </span>
                      </div>
                      <div className="text-[10px] sm:text-[11px] opacity-80 truncate">
                        {event.startTime}~{event.endTime} · {event.location || '-'}
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

export default ChairmanCalendar;
