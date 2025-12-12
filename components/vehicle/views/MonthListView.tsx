// components/vehicle/MonthListView.tsx
import { Booking, DriveLog, VehicleFilter } from '@/types/vehicle';
import { formatDate } from '@/lib/timeUtils';
import { MonthNavigator } from '@/components/vehicle/common/MonthNavigator';
import { VehicleFilterSelector } from '@/components/vehicle/common/VehicleFilterSelector';
import { getVehicleLabel } from '@/lib/vehicleUtils';
import { MapPin, User, Clock, FileText } from 'lucide-react'; // 아이콘 추가

interface MonthListViewProps {
  currentDate: Date;
  bookings: Booking[];
  driveLogs: DriveLog[];
  vehicleFilter: VehicleFilter;
  onVehicleFilterChange: (filter: VehicleFilter) => void;
  onChangeMonth: (delta: number) => void;
  onGoToday: () => void;
  onOpenBookingForm: (booking: Booking) => void;
  onOpenDriveLogForm: (booking: Booking, origin?: 'list' | 'logs' | 'user') => void;
}

export const MonthListView: React.FC<MonthListViewProps> = ({
  currentDate,
  bookings,
  driveLogs,
  vehicleFilter,
  onVehicleFilterChange,
  onChangeMonth,
  onGoToday,
  onOpenBookingForm,
  onOpenDriveLogForm,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const today = new Date();
  const todayStr = formatDate(today);

  const monthBookings = bookings
    .filter((b) => {
      if (!b.date) return false;
      const [y, m] = b.date.split('-').map(Number);
      return y === year && m === month;
    })
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));

  const filteredBookings = monthBookings.filter((b) =>
    vehicleFilter === 'all' ? true : b.vehicleId === vehicleFilter
  );

  // --- 헬퍼 함수: 차량 뱃지 스타일 ---
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
            {year}년 {month}월 배차 신청 목록
          </h2>
          <VehicleFilterSelector value={vehicleFilter} onChange={onVehicleFilterChange} />
        </div>

        <MonthNavigator
          currentDate={currentDate}
          onChangeMonth={onChangeMonth}
          onGoToday={onGoToday}
        />
      </div>

      {/* 컨텐츠 영역 */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {/* [모바일 뷰] 카드 리스트 형태 (md 미만에서만 보임) */}
        <div className="block md:hidden space-y-3">
          {filteredBookings.length === 0 ? (
            <div className="py-10 text-center text-gray-500 text-sm">
              {vehicleFilter === 'all'
                ? '해당 월의 배차 내역이 없습니다.'
                : '선택한 차량의 배차 내역이 없습니다.'}
            </div>
          ) : (
            filteredBookings.map((b) => {
              const isToday = b.date === todayStr;
              const bookingEnd = new Date(`${b.date}T${b.endTime}:00`);
              const isFinished = bookingEnd < today;
              const bookingLog = driveLogs.find((log) => log.bookingId === b.id);
              const hasLog = !!bookingLog;
              const showLogButton = hasLog || isFinished;

              return (
                <div
                  key={b.id}
                  onClick={() => onOpenBookingForm(b)}
                  className={`
                    relative bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform
                    ${isToday ? 'ring-1 ring-blue-500 ring-offset-1' : ''}
                  `}
                >
                  {/* 카드 상단: 날짜 + 차량 */}
                  <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-bold ${isToday ? 'text-blue-600' : 'text-gray-800'}`}
                      >
                        {b.date}
                      </span>
                      {isToday && (
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-red-100 text-red-600 font-medium">
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

                  {/* 카드 내용 */}
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                      <span className="font-semibold text-gray-900">
                        {b.startTime} ~ {b.endTime}
                      </span>
                    </div>

                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                      <span>
                        {b.requester || b.userName}
                        <span className="text-gray-400 text-xs ml-1">{b.department || '-'}</span>
                      </span>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                      <span className="line-clamp-1">{b.destination}</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                      <span className="line-clamp-1 text-gray-500">{b.purpose}</span>
                    </div>
                  </div>

                  {/* 카드 하단: 운행일지 버튼 */}
                  {showLogButton && (
                    <div className="mt-3 pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDriveLogForm(b, 'list');
                        }}
                        className={`
                          px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1
                          ${
                            hasLog
                              ? 'bg-gray-100 text-gray-600 border border-gray-200'
                              : 'bg-blue-600 text-white shadow-md shadow-blue-200'
                          }
                        `}
                      >
                        {hasLog ? '운행일지 수정' : '운행일지 작성'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* [데스크탑 뷰] 테이블 형태 (md 이상에서만 보임) */}
        <div className="hidden md:block bg-white rounded-lg border border-gray-300 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="px-3 py-3 text-center font-medium text-gray-600">운행날짜</th>
                <th className="px-3 py-3 text-center font-medium text-gray-600">신청차량</th>
                <th className="px-3 py-3 text-center font-medium text-gray-600">신청자</th>
                <th className="px-3 py-3 text-center font-medium text-gray-600">부서</th>
                <th className="px-3 py-3 text-center font-medium text-gray-600">출발시간</th>
                <th className="px-3 py-3 text-center font-medium text-gray-600">도착시간</th>
                <th className="px-3 py-3 text-center font-medium text-gray-600">출장지역</th>
                <th className="px-3 py-3 text-center font-medium text-gray-600">출장목적</th>
                <th className="px-3 py-3 text-center font-medium text-gray-600">운행일지</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-12 text-center text-gray-400">
                    {vehicleFilter === 'all'
                      ? '해당 월의 배차 내역이 없습니다.'
                      : '선택한 차량의 배차 내역이 없습니다.'}
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const isToday = b.date === todayStr;
                  const bookingEnd = new Date(`${b.date}T${b.endTime}:00`);
                  const isFinished = bookingEnd < today;
                  const bookingLog = driveLogs.find((log) => log.bookingId === b.id);
                  const hasLog = !!bookingLog;
                  const showLogButton = hasLog || isFinished;

                  return (
                    <tr
                      key={b.id}
                      onClick={() => onOpenBookingForm(b)}
                      className={`cursor-pointer transition-colors ${
                        isToday ? 'bg-yellow-50 hover:bg-yellow-100' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-3 py-3 align-middle text-center whitespace-nowrap">
                        <span className={isToday ? 'font-bold text-blue-700' : ''}>{b.date}</span>
                        {isToday && (
                          <span className="ml-1 inline-block px-1.5 py-0.5 text-[10px] rounded-full bg-red-100 text-red-600">
                            오늘
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3 align-middle text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getVehicleBadgeStyle(b.vehicleId)}`}
                        >
                          {getVehicleLabel(b.vehicleId)}
                        </span>
                      </td>

                      <td className="px-3 py-3 align-middle text-center whitespace-nowrap">
                        {b.requester || b.userName}
                      </td>

                      <td className="px-3 py-3 align-middle text-center whitespace-nowrap">
                        {b.department || '-'}
                      </td>

                      <td className="px-3 py-3 align-middle text-center whitespace-nowrap text-gray-600">
                        {b.startTime}
                      </td>

                      <td className="px-3 py-3 align-middle text-center whitespace-nowrap text-gray-600">
                        {b.endTime}
                      </td>

                      <td className="px-3 py-3 align-middle text-center text-gray-700">
                        {b.destination}
                      </td>

                      <td className="px-3 py-3 align-middle text-center text-gray-500">
                        {b.purpose}
                      </td>

                      <td className="px-3 py-3 align-middle text-center">
                        {showLogButton && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenDriveLogForm(b, 'list');
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                              hasLog
                                ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                                : 'border border-blue-600 bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                            }`}
                          >
                            {hasLog ? '수정' : '작성'}
                          </button>
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
