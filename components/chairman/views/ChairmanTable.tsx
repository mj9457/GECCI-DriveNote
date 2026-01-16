'use client';

import { ChairmanSchedule, ChairmanScheduleType } from '@/types/chairman';

const TYPE_LABELS: Record<ChairmanScheduleType, string> = {
  chairman: '수행',
  event: '행사',
};

const TYPE_BADGES: Record<ChairmanScheduleType, string> = {
  chairman: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  event: 'bg-amber-50 text-amber-700 border-amber-200',
};

type Props = {
  schedules: ChairmanSchedule[];
  onSelectEvent: (schedule: ChairmanSchedule) => void;
};

const formatDateRange = (schedule: ChairmanSchedule) => {
  const start = schedule.startDate || schedule.scheduleDate || '';
  const end = schedule.endDate || schedule.startDate || schedule.scheduleDate || start;
  if (!start) return '-';
  if (start === end) return start;
  return `${start} ~ ${end}`;
};

const formatTimeRange = (schedule: ChairmanSchedule) => {
  if (!schedule.startTime || !schedule.endTime) return '-';
  return `${schedule.startTime} ~ ${schedule.endTime}`;
};

export default function ChairmanTable({ schedules, onSelectEvent }: Props) {
  if (schedules.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 text-sm text-gray-500 text-center">
        등록된 일정이 없습니다.
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-sm sm:text-base font-semibold text-gray-900">
          회장님 수행·행사 일정
        </h2>
        <span className="text-xs text-gray-500">총 {schedules.length}건</span>
      </div>

      <div className="overflow-auto">
        <table className="min-w-full text-xs sm:text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">구분</th>
              <th className="px-3 py-2 text-left font-semibold">일정명</th>
              <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">기간</th>
              <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">시간</th>
              <th className="px-3 py-2 text-left font-semibold">장소</th>
              <th className="px-3 py-2 text-left font-semibold">메모</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((schedule) => (
              <tr
                key={schedule.id}
                className="hover:bg-gray-50 cursor-pointer border-t border-gray-100"
                onClick={() => onSelectEvent(schedule)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSelectEvent(schedule);
                }}
                role="button"
                tabIndex={0}
              >
                <td className="px-3 py-2 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 font-semibold ${
                      TYPE_BADGES[schedule.scheduleType]
                    }`}
                  >
                    {TYPE_LABELS[schedule.scheduleType]}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-900">
                  {schedule.title || '일정 없음'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-700">
                  {formatDateRange(schedule)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-700">
                  {formatTimeRange(schedule)}
                </td>
                <td className="px-3 py-2 text-gray-700">
                  {schedule.location || '-'}
                </td>
                <td className="px-3 py-2 text-gray-700">
                  {schedule.note || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
