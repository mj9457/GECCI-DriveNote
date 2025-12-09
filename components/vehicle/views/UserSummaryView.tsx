// components/vehicle/UserSummaryView.tsx
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
    onOpenDriveLogForm: (
        booking: Booking,
        origin?: 'list' | 'logs' | 'user',
    ) => void;
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

    const monthMyBookings = bookings
        .filter((b) => {
            if (!b.date) return false;
            const [y, m] = b.date.split('-').map(Number);
            if (y !== year || m !== month) return false;
            return b.userId === user.uid;
        })
        .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));

    const filteredMyBookings = monthMyBookings.filter((b) =>
        vehicleFilter === 'all' ? true : b.vehicleId === vehicleFilter,
    );

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
            ((a.date || '') + (a.createdAt || '')).localeCompare(
                (b.date || '') + (b.createdAt || ''),
            ),
        );

    const filteredMyLogs = monthMyLogs.filter((log) =>
        vehicleFilter === 'all' ? true : log.vehicleId === vehicleFilter,
    );

    return (
        <div className="flex flex-col h-full">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4 bg-white shadow-sm">
                <div className="flex flex-col gap-1">
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">
                        {year}년 {month}월 내 이용 내역
                    </h2>
                    <p className="text-[11px] sm:text-xs text-gray-500">
                        {user.displayName || user.email} 님의 배차 신청 및 운행일지입니다.
                    </p>

                    <div className="mt-1">
                        <VehicleFilterSelector
                            value={vehicleFilter}
                            onChange={onVehicleFilterChange}
                        />
                    </div>
                </div>

                <MonthNavigator
                    currentDate={currentDate}
                    onChangeMonth={onChangeMonth}
                    onGoToday={onGoToday}
                />
            </div>

            {/* 내용 */}
            <div className="flex-1 overflow-auto bg-white px-2 sm:px-4 md:px-6 pb-6 space-y-6 sm:space-y-8">
                {/* 1) 내 배차 신청 목록 */}
                <section className="pt-4">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2 sm:mb-3">
                        내 배차 신청 내역
                    </h3>
                    <table className="min-w-full text-[11px] sm:text-xs md:text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                                    운행날짜
                                </th>
                                <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                                    신청차량
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
                                <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                                    삭제
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMyBookings.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-3 py-8 text-center text-gray-400 text-xs sm:text-sm"
                                    >
                                        해당 월에 신청한 배차 내역이 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                filteredMyBookings.map((b) => {
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
                                            onClick={() => onOpenDriveLogForm(b, 'user')}
                                            className={`cursor-pointer ${isToday
                                                ? 'bg-yellow-50 hover:bg-yellow-100'
                                                : 'hover:bg-gray-50'
                                                }`}
                                        >
                                            <td className="px-2 py-2 text-center whitespace-nowrap">
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

                                            <td className="px-2 py-2 text-center whitespace-nowrap">
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

                                            <td className="px-2 py-2 text-center whitespace-nowrap">
                                                {b.startTime}
                                            </td>

                                            <td className="px-2 py-2 text-center whitespace-nowrap">
                                                {b.endTime}
                                            </td>

                                            <td className="px-2 py-2 text-center">
                                                {b.destination}
                                            </td>

                                            <td className="px-2 py-2 text-center">{b.purpose}</td>

                                            <td className="px-2 py-2 text-center">
                                                {showLogButton && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onOpenDriveLogForm(b, 'user');
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

                                            <td className="px-2 py-2 text-center">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteMyBooking(b);
                                                    }}
                                                    className="px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold border border-red-300 text-red-600 bg-white hover:bg-red-50 transition-all"
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
                </section>

                {/* 2) 내 운행일지 */}
                <section className="pt-2 border-t border-gray-200">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2 sm:mb-3 mt-3">
                        내 운행일지
                    </h3>
                    <table className="min-w-full text-[11px] sm:text-xs md:text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                                    운행날짜
                                </th>
                                <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                                    차량
                                </th>
                                <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                                    운행거리
                                </th>
                                <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                                    현재 최종키로수
                                </th>
                                <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                                    구간(출발 → 도착)
                                </th>
                                <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                                    이중주차
                                </th>
                                <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                                    운행일지
                                </th>
                                <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                                    삭제
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMyLogs.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-3 py-8 text-center text-gray-400 text-xs sm:text-sm"
                                    >
                                        해당 월의 운행일지가 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                filteredMyLogs.map((log) => {
                                    const isToday = log.date === todayStr;
                                    const booking = bookings.find((b) => b.id === log.bookingId);
                                    const canOpenLogForm = !!booking;

                                    let distanceDisplay = '-';
                                    if (log.distanceKm != null) {
                                        const n = Number(log.distanceKm);
                                        if (!Number.isNaN(n)) {
                                            distanceDisplay =
                                                n === 0 ? '미운행' : `${n.toLocaleString()} km`;
                                        }
                                    }

                                    const finalKmDisplay =
                                        log.finalKm != null
                                            ? `${Number(log.finalKm).toLocaleString()} km`
                                            : '-';

                                    return (
                                        <tr
                                            key={log.id}
                                            className={`${canOpenLogForm ? 'cursor-pointer' : ''} ${isToday
                                                ? 'bg-yellow-50 hover:bg-yellow-100'
                                                : 'hover:bg-gray-50'
                                                }`}
                                            onClick={() => {
                                                if (!booking) return;
                                                onOpenDriveLogForm(booking, 'user');
                                            }}
                                        >
                                            <td className="px-2 py-2 text-center whitespace-nowrap">
                                                <span
                                                    className={isToday ? 'font-bold text-blue-700' : ''}
                                                >
                                                    {log.date}
                                                </span>
                                            </td>

                                            <td className="px-2 py-2 text-center whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${log.vehicleId === 'v1'
                                                        ? 'bg-green-100 text-green-800'
                                                        : log.vehicleId === 'v2'
                                                            ? 'bg-purple-100 text-purple-800'
                                                            : 'bg-gray-100 text-gray-700'
                                                        }`}
                                                >
                                                    {getVehicleLabel(log.vehicleId)}
                                                </span>
                                            </td>

                                            <td className="px-2 py-2 text-center whitespace-nowrap">
                                                {distanceDisplay}
                                            </td>

                                            <td className="px-2 py-2 text-center whitespace-nowrap">
                                                {finalKmDisplay}
                                            </td>

                                            <td className="px-2 py-2">
                                                {log.from || '미입력'}{' '}
                                                <span className="text-gray-400">→</span>{' '}
                                                {log.to || booking?.destination || '미입력'}
                                            </td>

                                            <td className="px-2 py-2 text-center whitespace-nowrap">
                                                {log.doubleParking || '-'}
                                            </td>

                                            <td className="px-2 py-2 text-center">
                                                {canOpenLogForm ? (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onOpenDriveLogForm(booking!, 'user');
                                                        }}
                                                        className="px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition-all"
                                                    >
                                                        보기/수정
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-400 text-[10px] sm:text-xs">
                                                        원본 배차 삭제됨
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-2 py-2 text-center">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteMyLog(log);
                                                    }}
                                                    className="px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold border border-red-300 text-red-600 bg-white hover:bg-red-50 transition-all"
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
                </section>
            </div>
        </div>
    );
};
