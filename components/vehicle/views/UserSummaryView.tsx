// components/vehicle/UserSummaryView.tsx
import { MapPin, User, Gauge, Navigation, AlertCircle, Clock, Trash2 } from 'lucide-react';
import { Booking, DriveLog, VehicleFilter } from '@/types/vehicle';
import { formatDate } from '@/lib/timeUtils';
import { MonthNavigator } from '@/components/vehicle/common/MonthNavigator';
import { VehicleFilterSelector } from '@/components/vehicle/common/VehicleFilterSelector';
import { getVehicleLabel } from '@/lib/vehicleUtils';

interface UserSummaryViewProps {
  currentDate: Date;
  user: { uid: string; displayName?: string | null; email?: string | null };
  bookings: Booking[];
  driveLogs: DriveLog[];
  vehicleFilter: VehicleFilter;
  onVehicleFilterChange: (filter: VehicleFilter) => void;
  onChangeMonth: (delta: number) => void;
  onGoToday: () => void;
  onOpenDriveLogForm: (booking: Booking, origin?: 'list' | 'logs' | 'user') => void;
  onDeleteMyBooking: (booking: Booking) => void;
  onDeleteMyLog: (log: DriveLog) => void;
}

export const UserSummaryView: React.FC<UserSummaryViewProps> = ({
  currentDate,
  user,
  bookings,
  driveLogs,
  vehicleFilter,
  onVehicleFilterChange,
  onChangeMonth,
  onGoToday,
  onOpenDriveLogForm,
  onDeleteMyBooking,
  onDeleteMyLog,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const today = new Date();
  const todayStr = formatDate(today);

  const getVehicleBadgeStyle = (vId: string) => {
    if (vId === 'v1') return 'bg-green-100 text-green-800';
    if (vId === 'v2') return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-700';
  };

  // -----------------------
  // 1) 내 배차 (현재 코드)
  // -----------------------
  const monthMyBookings = bookings
    .filter((b) => {
      if (!b.date) return false;
      const [y, m] = b.date.split('-').map(Number);
      if (y !== year || m !== month) return false;
      return b.userId === user.uid;
    })
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));

  const filteredMyBookings = monthMyBookings.filter((b) =>
    vehicleFilter === 'all' ? true : b.vehicleId === vehicleFilter
  );

  // -----------------------
  // 2) 내 운행일지 (과거 계산 로직 유지)
  // -----------------------
  const monthMyLogs = driveLogs
    .filter((log) => {
      if (!log.date) return false;
      const [y, m] = String(log.date).split('-').map(Number);
      if (y !== year || m !== month) return false;
      const booking = bookings.find((b) => b.id === log.bookingId);
      if (!booking) return false;
      return booking.userId === user.uid;
    })
    .sort((a, b) =>
      ((a.date || '') + (a.createdAt || '')).localeCompare((b.date || '') + (b.createdAt || ''))
    );

  const filteredMyLogs = monthMyLogs.filter((log) =>
    vehicleFilter === 'all' ? true : log.vehicleId === vehicleFilter
  );

  // log -> booking 매핑 헬퍼
  const getBookingByLog = (log: DriveLog) => bookings.find((b) => b.id === log.bookingId);

  return (
    <div className="flex flex-col h-full bg-gray-50 md:bg-white">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-4 bg-white shadow-sm gap-3 sm:gap-0 sticky top-0 z-20">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg md:text-xl font-bold text-gray-800">
            {year}년 {month}월 내 이용 내역
          </h2>
          <p className="text-xs text-gray-500">
            {user.displayName || user.email} 님의 배차 신청 및 운행일지입니다.
          </p>
          <VehicleFilterSelector value={vehicleFilter} onChange={onVehicleFilterChange} />
        </div>

        <MonthNavigator
          currentDate={currentDate}
          onChangeMonth={onChangeMonth}
          onGoToday={onGoToday}
        />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-8">
        {/* 1) 내 배차 신청 내역 */}
        <section>
          <h3 className="text-base font-semibold text-gray-800 mb-3">내 배차 신청 내역</h3>

          {/* 모바일 카드 */}
          <div className="block md:hidden space-y-3">
            {filteredMyBookings.length === 0 ? (
              <div className="py-10 text-center text-gray-500 text-sm">
                해당 월에 신청한 배차 내역이 없습니다.
              </div>
            ) : (
              filteredMyBookings.map((b) => {
                const isToday = b.date === todayStr;
                const bookingEnd = new Date(`${b.date}T${b.endTime}:00`);
                const isFinished = bookingEnd < today;
                const bookingLog = driveLogs.find((log) => log.bookingId === b.id);
                const hasLog = !!bookingLog;
                const showLogButton = hasLog || isFinished;

                return (
                  <div
                    key={b.id}
                    onClick={() => onOpenDriveLogForm(b, 'user')}
                    className={`
                      relative bg-white rounded-xl p-4 shadow-sm border cursor-pointer
                      active:scale-[0.98] transition-transform
                      ${isToday ? 'ring-1 ring-blue-500 border-blue-200' : 'border-gray-100'}
                    `}
                  >
                    <div className="flex items-center justify-between mb-3 border-b pb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-bold ${isToday ? 'text-blue-600' : 'text-gray-800'}`}
                        >
                          {b.date}
                        </span>
                        {isToday && (
                          <span className="px-1.5 py-0.5 text-[10px] rounded bg-red-100 text-red-600">
                            오늘
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[11px] rounded-full font-medium ${getVehicleBadgeStyle(b.vehicleId)}`}
                      >
                        {getVehicleLabel(b.vehicleId)}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex gap-2">
                        <Clock className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-xs text-gray-500">운행시간</div>
                          <div className="font-semibold">
                            {b.startTime} ~ {b.endTime}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs text-gray-500">출장지역</div>
                            <div className="font-semibold">{b.destination}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <User className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs text-gray-500">목적</div>
                            <div className="font-semibold truncate">{b.purpose}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 flex justify-end gap-2">
                      {showLogButton && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDriveLogForm(b, 'user');
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                            hasLog
                              ? 'bg-gray-100 text-gray-600 border border-gray-200'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {hasLog ? '일지 수정' : '일지 작성'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteMyBooking(b);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-200"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 데스크탑 테이블 */}
          <div className="hidden md:block bg-white rounded-lg border border-gray-300 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border border-b border-gray-300">
                <tr>
                  <th className="px-3 py-3 text-center font-medium text-gray-600">운행날짜</th>
                  <th className="px-3 py-3 text-center font-medium text-gray-600">신청차량</th>
                  <th className="px-3 py-3 text-center font-medium text-gray-600">출발시간</th>
                  <th className="px-3 py-3 text-center font-medium text-gray-600">도착시간</th>
                  <th className="px-3 py-3 text-center font-medium text-gray-600">출장지역</th>
                  <th className="px-3 py-3 text-center font-medium text-gray-600">출장목적</th>
                  <th className="px-3 py-3 text-center font-medium text-gray-600">운행일지</th>
                  <th className="px-3 py-3 text-center font-medium text-gray-600">삭제</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMyBookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-12 text-center text-gray-400">
                      해당 월에 신청한 배차 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredMyBookings.map((b) => {
                    const isToday = b.date === todayStr;
                    const bookingEnd = new Date(`${b.date}T${b.endTime}:00`);
                    const isFinished = bookingEnd < today;
                    const bookingLog = driveLogs.find((log) => log.bookingId === b.id);
                    const hasLog = !!bookingLog;
                    const showLogButton = hasLog || isFinished;

                    return (
                      <tr
                        key={b.id}
                        onClick={() => onOpenDriveLogForm(b, 'user')}
                        className={`cursor-pointer hover:bg-gray-50 ${isToday ? 'bg-yellow-50' : ''}`}
                      >
                        <td className="px-3 py-3 text-center">
                          <span className={isToday ? 'font-bold text-blue-700' : ''}>{b.date}</span>
                          {isToday && (
                            <span className="ml-1 inline-block px-1.5 py-0.5 text-[10px] rounded-full bg-red-100 text-red-600">
                              오늘
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getVehicleBadgeStyle(b.vehicleId)}`}
                          >
                            {getVehicleLabel(b.vehicleId)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">{b.startTime}</td>
                        <td className="px-3 py-3 text-center">{b.endTime}</td>
                        <td className="px-3 py-3 text-center">{b.destination}</td>
                        <td className="px-3 py-3 text-center">{b.purpose}</td>
                        <td className="px-3 py-3 text-center">
                          {showLogButton && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenDriveLogForm(b, 'user');
                              }}
                              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                hasLog
                                  ? 'bg-white text-gray-700 border-gray-300'
                                  : 'bg-blue-600 text-white'
                              }`}
                            >
                              {hasLog ? '수정' : '작성'}
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteMyBooking(b);
                            }}
                            className="px-3 py-1 rounded-full text-xs font-semibold border border-red-300 text-red-600 bg-white hover:bg-red-50"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 2) 내 운행일지 내역 (수정) */}
        <section>
          <h3 className="text-base font-semibold text-gray-800 mb-3">내 운행일지 내역</h3>

          {/* 모바일 카드 뷰 */}
          <div className="block md:hidden space-y-3">
            {filteredMyLogs.length === 0 ? (
              <div className="py-10 text-center text-gray-500 text-sm">
                해당 월에 작성한 운행일지가 없습니다.
              </div>
            ) : (
              filteredMyLogs.map((log) => {
                const booking = getBookingByLog(log);
                const vId = booking?.vehicleId || log.vehicleId;

                return (
                  <div
                    key={log.id}
                    className="relative bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-3 border-b pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-800">{log.date || '-'}</span>
                        <span
                          className={`px-2 py-0.5 text-[11px] rounded-full font-medium ${getVehicleBadgeStyle(vId)}`}
                        >
                          {getVehicleLabel(vId)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteMyLog(log)}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                        삭제
                      </button>
                    </div>

                    <div className="space-y-2 text-sm">
                      {/* 구간 */}
                      <div className="flex gap-2">
                        <Navigation className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-xs text-gray-500">구간</div>
                          <div className="font-semibold truncate">
                            {log.from || '-'} → {log.to || '-'}
                          </div>
                        </div>
                      </div>

                      {/* 경유지 + 이중주차 */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-xs text-gray-500">경유지</div>
                            <div className="font-semibold truncate">{log.via || '-'}</div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <AlertCircle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-xs text-gray-500">이중주차</div>
                            <div className="font-semibold truncate">{log.doubleParking || '-'}</div>
                          </div>
                        </div>
                      </div>

                      {/* 운행거리 + 최종키로수 */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex gap-2">
                          <Gauge className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-xs text-gray-500">운행거리</div>
                            <div className="font-semibold">
                              {(log.distanceKm ?? 0).toLocaleString()} km
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Gauge className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-xs text-gray-500">최종키로수</div>
                            <div className="font-semibold">
                              {(Number(log.finalKm) || 0).toLocaleString()} km
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 연결된 배차로 열기 */}
                    {booking && (
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => onOpenDriveLogForm(booking, 'user')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                        >
                          운행일지 열기
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* 데스크탑 테이블 뷰 */}
          <div className="hidden md:block bg-white rounded-lg border border-gray-300 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-300">
                <tr>
                  <th className="px-3 py-3 text-center font-medium text-gray-600">운행날짜</th>
                  <th className="px-3 py-3 text-center font-medium text-gray-600">차량</th>
                  <th className="px-3 py-3 text-center font-medium text-gray-600">운행거리(km)</th>
                  <th className="px-3 py-3 text-center font-medium text-gray-600">
                    최종키로수(km)
                  </th>
                  <th className="px-3 py-3 text-center font-medium text-gray-600">구간</th>
                  <th className="px-3 py-3 text-center font-medium text-gray-600">경유지</th>
                  <th className="px-3 py-3 text-center font-medium text-gray-600">이중주차</th>
                  <th className="px-3 py-3 text-center font-medium text-gray-600">삭제</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {filteredMyLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-12 text-center text-gray-400">
                      해당 월에 작성한 운행일지가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredMyLogs.map((log) => {
                    const booking = getBookingByLog(log);
                    const vId = booking?.vehicleId || log.vehicleId;

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-gray-50"
                        onClick={() => booking && onOpenDriveLogForm(booking, 'user')}
                      >
                        <td className="px-3 py-3 text-center">{log.date || '-'}</td>

                        <td className="px-3 py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getVehicleBadgeStyle(vId)}`}
                          >
                            {getVehicleLabel(vId)}
                          </span>
                        </td>

                        <td className="px-3 py-3 text-center">
                          {(log.distanceKm ?? 0).toLocaleString()}
                        </td>

                        <td className="px-3 py-3 text-center">
                          {(Number(log.finalKm) || 0).toLocaleString()}
                        </td>

                        <td className="px-3 py-3 text-center">
                          <span className="inline-block max-w-[260px] truncate align-middle">
                            {log.from || '-'} → {log.to || '-'}
                          </span>
                        </td>

                        <td className="px-3 py-3 text-center">
                          <span className="inline-block max-w-[180px] truncate align-middle">
                            {log.via || '-'}
                          </span>
                        </td>

                        <td className="px-3 py-3 text-center">
                          <span className="inline-block max-w-[220px] truncate align-middle">
                            {log.doubleParking || '-'}
                          </span>
                        </td>

                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteMyLog(log);
                            }}
                            className="px-3 py-1 rounded-full text-xs font-semibold border border-red-300 text-red-600 bg-white hover:bg-red-50"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};
