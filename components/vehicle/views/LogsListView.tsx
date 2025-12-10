// components/vehicle/LogsListView.tsx
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
    onOpenDriveLogForm: (
        booking: Booking,
        origin?: 'list' | 'logs' | 'user',
    ) => void;
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
            ((a.date || '') + (a.createdAt || '')).localeCompare(
                (b.date || '') + (b.createdAt || ''),
            ),
        );

    const filteredLogs = monthLogs.filter((log) =>
        vehicleFilter === 'all' ? true : log.vehicleId === vehicleFilter,
    );

    return (
        <div className="flex flex-col h-full">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4 bg-white shadow-sm">
                <div className="flex flex-col gap-2">
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">
                        {year}년 {month}월 운행일지
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
                                차량
                            </th>
                            <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                                운전자
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
                                경유지
                            </th>
                            <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                                이중주차
                            </th>
                            <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                                운행일지
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={9}
                                    className="px-3 py-8 text-center text-gray-400 text-xs sm:text-sm"
                                >
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
                                            }
                                            border-b border-gray-100 last:border-none
                                            `}
                                        onClick={() => {
                                            if (!booking) return;
                                            onOpenDriveLogForm(booking, 'logs');
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
                                            {log.driver ||
                                                booking?.requester ||
                                                booking?.userName ||
                                                '-'}
                                        </td>

                                        <td className="px-2 py-2 text-center whitespace-nowrap">
                                            {distanceDisplay}
                                        </td>

                                        <td className="px-2 py-2 text-center whitespace-nowrap">
                                            {finalKmDisplay}
                                        </td>

                                        <td className="px-2 py-2 text-center whitespace-nowrap">
                                            {log.from === log.to ? (
                                                `${log.from} (동일)` || '미입력'
                                            ) : (
                                                <>
                                                {log.from || '미입력'}{' '}
                                                <span className="text-gray-400">→</span>{' '}
                                                {log.to || booking?.destination || '미입력'}
                                                </>
                                            )}
                                        </td>

                                        <td className="px-2 py-2 w-[170px]">
                                            {log.via || '미입력'}{' '}
                                        </td>

                                        <td className="px-2 py-2 text-center whitespace-nowrap text-red-500">
                                            {log.doubleParking || '-'}
                                        </td>

                                        <td className="px-2 py-2 text-center">
                                            {canOpenLogForm ? (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onOpenDriveLogForm(booking!, 'logs');
                                                    }}
                                                    className="px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition-all"
                                                >
                                                    수정
                                                </button>
                                            ) : (
                                                <span className="text-gray-400 text-[10px] sm:text-xs">
                                                    원본 배차 삭제됨
                                                </span>
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
