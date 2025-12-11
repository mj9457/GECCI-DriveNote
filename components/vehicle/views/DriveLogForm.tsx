// components/vehicle/DriveLogForm.tsx
import { ChevronLeft } from 'lucide-react';
import { Booking, LogFormState } from '@/types/vehicle';
import { VEHICLES } from '@/lib/vehicleConstants';
import { formatDate } from '@/lib/timeUtils';

interface DriveLogFormProps {
    booking: Booking;
    logForm: LogFormState;
    prevKm: number | null;
    onChangeLogForm: (form: LogFormState) => void;
    onSubmit: () => void;
    onBack: () => void;
}

export const DriveLogForm: React.FC<DriveLogFormProps> = ({
    booking,
    logForm,
    prevKm,
    onChangeLogForm,
    onSubmit,
    onBack,
}) => {
    const dateStr = booking.date || formatDate(new Date());

    const prevKmDisplay =
        prevKm != null ? `${prevKm.toLocaleString()} km` : '이전 운행 기록 없음';

    const finalKmNum = Number(logForm.finalKm || 0);
    const distanceKm =
        prevKm != null && finalKmNum > prevKm ? finalKmNum - prevKm : 0;

    const vehicleLabel =
        VEHICLES.find((v) => v.id === booking.vehicleId)?.number || '';

    const isCarnival = booking.vehicleId === 'v2';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <div className="px-3 sm:px-4 md:px-6 py-4 md:py-6 max-w-5xl mx-auto bg-white min-h-full">
            {/* 상단 제목 */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                        onClick={onBack}
                        className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full text-gray-600"
                    >
                        <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
                    </button>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold">
                        운행일지 작성
                    </h2>
                </div>
            </div>

            {/* 배차 기본정보 */}
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 text-[11px] sm:text-xs md:text-sm space-y-1.5">
                <div>
                    <span className="font-semibold text-gray-700">운행날짜 : </span>
                    {dateStr}
                </div>
                <div>
                    <span className="font-semibold text-gray-700">운행차량 : </span>
                    {`${vehicleLabel}(${booking.vehicleId === 'v1' ? '티볼리' : '카니발'})`}
                </div>
                <div>
                    <span className="font-semibold text-gray-700">운행시간 : </span>
                    {booking.startTime} ~ {booking.endTime}
                </div>
                <div>
                    <span className="font-semibold text-gray-700">
                        신청자 / 부서 :{' '}
                    </span>
                    {booking.requester || booking.userName || '-'}
                    {booking.department && ` (${booking.department})`}
                </div>
                <div>
                    <span className="font-semibold text-gray-700">출장지역 : </span>
                    {booking.destination || '-'}
                </div>
                <div>
                    <span className="font-semibold text-gray-700">사용목적 : </span>
                    {booking.purpose || '-'}
                </div>
            </div>

            {/* 운행일지 입력 폼 */}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* 출발지 / 경유지 / 도착지 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            출발지
                        </label>
                        <input
                            type="text"
                            value={logForm.from}
                            onChange={(e) =>
                                onChangeLogForm({ ...logForm, from: e.target.value })
                            }
                            placeholder="예) 다남프라자"
                            className="w-full p-2.5 sm:p-3 border border-gray-300  rounded-lg text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-red-500 mb-1">
                            경유지
                        </label>
                        <input
                            type="text"
                            value={logForm.via}
                            onChange={(e) =>
                                onChangeLogForm({ ...logForm, via: e.target.value })
                            }
                            placeholder="예) 남양주시청"
                            className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-red-500 mb-1">
                            최종 도착지
                        </label>
                        <input
                            type="text"
                            value={logForm.to}
                            onChange={(e) =>
                                onChangeLogForm({ ...logForm, to: e.target.value })
                            }
                            placeholder="예) 다남프라자"
                            className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* 키로수 영역 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            이전 최종키로수
                        </label>
                        <input
                            type="text"
                            readOnly
                            value={prevKmDisplay}
                            className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg text-xs sm:text-sm bg-gray-50 text-gray-600"
                        />
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-red-500 mb-1">
                            현재 최종키로수
                        </label>
                        <div className="flex items-center gap-1.5">
                            <input
                                type="number"
                                value={logForm.finalKm}
                                onChange={(e) =>
                                    onChangeLogForm({ ...logForm, finalKm: e.target.value })
                                }
                                placeholder="숫자만 입력"
                                className="flex-1 p-2.5 sm:p-3 border border-gray-300 rounded-lg text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-xs sm:text-sm text-gray-500">km</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            운행키로수 (자동)
                        </label>
                        <input
                            type="text"
                            readOnly
                            value={
                                logForm.finalKm && prevKm != null
                                    ? `${distanceKm.toLocaleString()} km`
                                    : ''
                            }
                            placeholder="현재 최종키로수 입력하세요"
                            className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg text-xs sm:text-sm bg-gray-50 text-gray-700"
                        />
                    </div>
                </div>

                {/* 사용 목적 / 운전자 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            사용 목적
                        </label>
                        <input
                            type="text"
                            value={logForm.purpose}
                            onChange={(e) =>
                                onChangeLogForm({ ...logForm, purpose: e.target.value })
                            }
                            placeholder="예) 회의"
                            className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            운전자 / 동승자
                        </label>
                        <input
                            type="text"
                            value={logForm.driver}
                            onChange={(e) =>
                                onChangeLogForm({ ...logForm, driver: e.target.value })
                            }
                            placeholder="예) 운전자1, 동승자1"
                            className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* 이중주차 / 특이사항 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-red-500 mb-1">
                            이중주차 여부 (민우 전달 필수)
                        </label>
                        <select
                            value={logForm.doubleParking}
                            onChange={(e) =>
                                onChangeLogForm({
                                    ...logForm,
                                    doubleParking: e.target.value,
                                })
                            }
                            className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg text-xs sm:text-sm outline-none bg-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">선택하세요</option>
                            {isCarnival ? (
                                <>
                                    <option value="일반주차">일반주차</option>
                                    <option value="이중주차(기어중립)">
                                        이중주차(기어중립)
                                    </option>
                                </>
                            ) : (
                                <>
                                    <option value="지하1층(일반주차)">
                                        지하1층(일반주차)
                                    </option>
                                    <option value="지하1층(이중주차)">
                                        지하1층(이중주차)
                                    </option>
                                    <option value="금강아파트">금강아파트</option>
                                    <option value="그외(전달필수)">그외(전달필수)</option>
                                </>
                            )}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            특이사항 (경고등 / 주유 등)
                        </label>
                        <input
                            type="text"
                            value={logForm.note}
                            onChange={(e) =>
                                onChangeLogForm({ ...logForm, note: e.target.value })
                            }
                            placeholder="예) 엔진 경고등 점등, 주유 필요 등"
                            className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
                >
                    운행일지 저장
                </button>
            </form>
        </div>
    );
};
