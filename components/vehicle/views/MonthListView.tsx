// components/vehicle/MonthListView.tsx
import { Booking, DriveLog, VehicleFilter } from '@/types/vehicle';
import { VEHICLES } from '@/lib/vehicleConstants';
import { formatDate } from '@/lib/timeUtils';
import { MonthNavigator } from '@/components/vehicle/common/MonthNavigator';
import { VehicleFilterSelector } from '@/components/vehicle/common/VehicleFilterSelector';
import { getVehicleLabel } from '@/lib/vehicleUtils';

interface MonthListViewProps {
    currentDate: Date;
    bookings: Booking[];
    driveLogs: DriveLog[];
    vehicleFilter: VehicleFilter;
    onVehicleFilterChange: (filter: VehicleFilter) => void;
    onChangeMonth: (delta: number) => void;
    onGoToday: () => void;
    onOpenBookingForm: (booking: Booking) => void;
    onOpenDriveLogForm: (
        booking: Booking,
        origin?: 'list' | 'logs' | 'user',
    ) => void;
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
        vehicleFilter === 'all' ? true : b.vehicleId === vehicleFilter,
    );

    return (
        <div className="flex flex-col h-full">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4 bg-white shadow-sm">
                <div className="flex flex-col gap-1">
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">
                        {year}년 {month}월 배차 신청 목록
                    </h2>

                    <VehicleFilterSelector
                        value={vehicleFilter}
                        onChange={onVehicleFilterChange}
                    />
                </div>

                <MonthNavigator
                    currentDate={currentDate}
                    onChangeMonth={onChangeMonth}
                    onGoToday={onGoToday}
                />
            </div>

            {/* 테이블 */}
            <div className="flex-1 overflow-auto bg-white px-2 sm:px-4 md:px-6">
                <table className="min-w-full text-[11px] sm:text-xs md:text-sm">
                    <thead className="bg-gray-100 sticky top-0 z-10">
                        <tr>
                            <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                                운행날짜
                            </th>
                            <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                                신청차량
                            </th>
                            <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                                신청자
                            </th>
                            <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                                부서
                            </th>
                            <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                                운행시간(출발)
                            </th>
                            <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                                운행시간(도착)
                            </th>
                            <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                                출장지역
                            </th>
                            <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                                출장목적
                            </th>
                            <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                                운행일지
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBookings.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={9}
                                    className="px-3 py-8 text-center text-gray-400 text-xs sm:text-sm"
                                >
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

                                const bookingLog = driveLogs.find(
                                    (log) => log.bookingId === b.id,
                                );
                                const hasLog = !!bookingLog;

                                const showLogButton = hasLog || isFinished;

                                return (
                                    <tr
                                        key={b.id}
                                        onClick={() => onOpenBookingForm(b)}
                                        className={`cursor-pointer ${isToday
                                            ? 'bg-yellow-50 hover:bg-yellow-100'
                                            : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <td className="px-2 py-2 align-middle text-center whitespace-nowrap">
                                            <span
                                                className={isToday ? 'font-bold text-blue-700' : ''}
                                            >
                                                {b.date}
                                            </span>
                                            {isToday && (
                                                <span className="ml-1 inline-block px-1.5 py-0.5 text-[10px] sm:text-[11px] rounded-full bg-red-100 text-red-600">
                                                    오늘
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-2 py-2 align-middle text-center whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${b.vehicleId === 'v1'
                                                    ? 'bg-green-100 text-green-800'
                                                    : b.vehicleId === 'v2'
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : 'bg-gray-100 text-gray-700'
                                                    }`}
                                            >
                                                {getVehicleLabel(b.vehicleId)}
                                            </span>
                                        </td>

                                        <td className="px-2 py-2 align-middle text-center whitespace-nowrap">
                                            {b.requester || b.userName}
                                        </td>

                                        <td className="px-2 py-2 align-middle text-center whitespace-nowrap">
                                            {b.department || '-'}
                                        </td>

                                        <td className="px-2 py-2 align-middle text-center whitespace-nowrap">
                                            {b.startTime}
                                        </td>

                                        <td className="px-2 py-2 align-middle text-center whitespace-nowrap">
                                            {b.endTime}
                                        </td>

                                        <td className="px-2 py-2 align-middle text-center">
                                            {b.destination}
                                        </td>

                                        <td className="px-2 py-2 align-middle text-center">
                                            {b.purpose}
                                        </td>

                                        <td className="px-2 py-2 align-middle text-center">
                                            {showLogButton && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onOpenDriveLogForm(b, 'list');
                                                    }}
                                                    className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold transition-all ${hasLog
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
    );
};
