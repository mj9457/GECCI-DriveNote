// components/vehicle/LogsListView.tsx
import { MapPin, User, Gauge, Navigation, AlertCircle } from 'lucide-react';
import { Booking, DriveLog, VehicleFilter } from '@/types/vehicle';
import { formatDate } from '@/lib/timeUtils';
import { MonthNavigator } from '@/components/vehicle/common/MonthNavigator';
import { VehicleFilterSelector } from '@/components/vehicle/common/VehicleFilterSelector';
import { getVehicleLabel } from '@/lib/vehicleUtils';

interface LogsListViewProps {
  currentDate: Date;
  bookings: Booking[];
  driveLogs: DriveLog[];
  vehicleFilter: VehicleFilter;
  onVehicleFilterChange: (filter: VehicleFilter) => void;
  onChangeMonth: (delta: number) => void;
  onGoToday: () => void;
  onOpenDriveLogForm: (booking: Booking, origin?: 'list' | 'logs' | 'user') => void;
}

export const LogsListView: React.FC<LogsListViewProps> = ({
  currentDate,
  bookings,
  driveLogs,
  vehicleFilter,
  onVehicleFilterChange,
  onChangeMonth,
  onGoToday,
  onOpenDriveLogForm,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const today = new Date();
  const todayStr = formatDate(today);

  const monthLogs = driveLogs
    .filter((log) => {
      if (!log.date) return false;
      const [y, m] = String(log.date).split('-').map(Number);
      return y === year && m === month;
    })
    .sort((a, b) =>
      ((a.date || '') + (a.createdAt || '')).localeCompare((b.date || '') + (b.createdAt || ''))
    );

  const filteredLogs = monthLogs.filter((log) =>
    vehicleFilter === 'all' ? true : log.vehicleId === vehicleFilter
  );

  const getVehicleBadgeStyle = (vId: string) => {
    if (vId === 'v1') return 'bg-green-100 text-green-800';
    if (vId === 'v2') return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 md:bg-white">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-4 bg-white shadow-sm gap-3 sm:gap-0 sticky top-0 z-20">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg md:text-xl font-bold text-gray-800">
            {year}년 {month}월 운행일지
          </h2>
          <VehicleFilterSelector value={vehicleFilter} onChange={onVehicleFilterChange} />
        </div>

        <MonthNavigator
          currentDate={currentDate}
          onChangeMonth={onChangeMonth}
          onGoToday={onGoToday}
        />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {/* 모바일 카드 뷰 */}
        <div className="block md:hidden space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="py-10 text-center text-gray-500 text-sm">
              해당 월의 운행일지가 없습니다.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isToday = log.date === todayStr;
              const booking = bookings.find((b) => b.id === log.bookingId);
              const canOpenLogForm = !!booking;

              let distanceDisplay = '-';
              if (log.distanceKm != null) {
                const n = Number(log.distanceKm);
                if (!Number.isNaN(n)) {
                  distanceDisplay = n === 0 ? '미운행' : `${n.toLocaleString()} km`;
                }
              }

              const finalKmDisplay =
                log.finalKm != null ? `${Number(log.finalKm).toLocaleString()} km` : '-';

              return (
                <div
                  key={log.id}
                  onClick={() => {
                    if (!booking) return;
                    onOpenDriveLogForm(booking, 'logs');
                  }}
                  className={`
                    relative bg-white rounded-xl p-4 shadow-sm border
                    ${canOpenLogForm ? 'cursor-pointer active:scale-[0.98]' : 'opacity-60'}
                    ${isToday ? 'ring-1 ring-blue-500 border-blue-200' : 'border-gray-100'}
                    transition-transform
                  `}
                >
                  <div className="flex items-center justify-between mb-3 border-b pb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-bold ${isToday ? 'text-blue-600' : 'text-gray-800'}`}
                      >
                        {log.date}
                      </span>
                      {isToday && (
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-red-100 text-red-600">
                          오늘
                        </span>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[11px] rounded-full font-medium ${getVehicleBadgeStyle(log.vehicleId)}`}
                    >
                      {getVehicleLabel(log.vehicleId)}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex gap-2">
                      <User className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-xs text-gray-500">운전자</div>
                        <div className="font-semibold">
                          {log.driver || booking?.requester || '-'}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex gap-2">
                        <Gauge className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs text-gray-500">운행거리</div>
                          <div className="font-semibold">{distanceDisplay}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Navigation className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs text-gray-500">최종키로수</div>
                          <div className="font-semibold">{finalKmDisplay}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-xs text-gray-500">구간</div>
                        <div>
                          {log.from === log.to ? (
                            `${log.from} (동일)` || '미입력'
                          ) : (
                            <>
                              {log.from || '미입력'} <span className="text-gray-400">→</span>{' '}
                              {log.to || '미입력'}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {log.via && (
                      <div className="flex gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs text-gray-500">경유지</div>
                          <div>{log.via}</div>
                        </div>
                      </div>
                    )}

                    {log.doubleParking && (
                      <div className="flex gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs text-gray-500">이중주차</div>
                          <div className="text-red-600 font-medium">{log.doubleParking}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2 flex justify-end">
                    {canOpenLogForm ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDriveLogForm(booking!, 'logs');
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200 cursor-pointer"
                      >
                        수정
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">원본 배차 삭제됨</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 데스크탑 테이블 뷰 */}
        <div className="hidden md:block bg-white rounded-lg border border-gray-300 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="px-3 py-3 text-center font-medium text-gray-600">운행날짜</th>
                <th className="px-3 py-3 text-center font-medium text-gray-600">차량</th>
                <th className="px-3 py-3 text-center font-medium text-gray-600">운전자</th>
                <th className="px-3 py-3 text-center font-medium text-gray-600">운행거리</th>
                <th className="px-3 py-3 text-center font-medium text-gray-600">최종키로수</th>
                <th className="px-3 py-3 text-center font-medium text-gray-600">구간</th>
                <th className="px-3 py-3 text-center font-medium text-gray-600">경유지</th>
                <th className="px-3 py-3 text-center font-medium text-gray-600">이중주차</th>
                <th className="px-3 py-3 text-center font-medium text-gray-600">운행일지</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-12 text-center text-gray-400">
                    해당 월의 운행일지가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isToday = log.date === todayStr;
                  const booking = bookings.find((b) => b.id === log.bookingId);
                  const canOpenLogForm = !!booking;

                  let distanceDisplay = '-';
                  if (log.distanceKm != null) {
                    const n = Number(log.distanceKm);
                    if (!Number.isNaN(n)) {
                      distanceDisplay = n === 0 ? '미운행' : `${n.toLocaleString()} km`;
                    }
                  }

                  const finalKmDisplay =
                    log.finalKm != null ? `${Number(log.finalKm).toLocaleString()} km` : '-';

                  return (
                    <tr
                      key={log.id}
                      className={`${canOpenLogForm ? 'cursor-pointer hover:bg-gray-50' : ''} ${isToday ? 'bg-yellow-50' : ''}`}
                      onClick={() => {
                        if (!booking) return;
                        onOpenDriveLogForm(booking, 'logs');
                      }}
                    >
                      <td className="px-3 py-3 text-center">
                        <span className={isToday ? 'font-bold text-blue-700' : ''}>{log.date}</span>
                        {isToday && (
                          <span className="ml-1 inline-block px-1.5 py-0.5 text-[10px] rounded-full bg-red-100 text-red-600">
                            오늘
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getVehicleBadgeStyle(log.vehicleId)}`}
                        >
                          {getVehicleLabel(log.vehicleId)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {log.driver || booking?.requester || '-'}
                      </td>
                      <td className="px-3 py-3 text-center">{distanceDisplay}</td>
                      <td className="px-3 py-3 text-center">{finalKmDisplay}</td>
                      <td className="px-3 py-3 text-center">
                        {log.from === log.to ? (
                          `${log.from} (동일)` || '미입력'
                        ) : (
                          <>
                            {log.from || '미입력'} → {log.to || '미입력'}
                          </>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">{log.via || '-'}</td>
                      <td className="px-3 py-3 text-center text-red-500">
                        {log.doubleParking || '-'}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {canOpenLogForm ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenDriveLogForm(booking!, 'logs');
                            }}
                            className="px-3 py-1 rounded-full text-xs font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 cursor-pointer"
                          >
                            수정
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">원본 배차 삭제됨</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
