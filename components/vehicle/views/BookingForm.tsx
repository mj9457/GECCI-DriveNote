// components/vehicle/BookingForm.tsx
import {
    AlertCircle,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    FileText,
    MapPin,
    User,
} from 'lucide-react';
import { Booking, TimeInputs, View } from '@/types/vehicle';
import { VEHICLES } from '@/lib/vehicleConstants';
import { formatDate, normalizeTimeInput } from '@/lib/timeUtils';
import { toast } from 'sonner';
import { useEffect, useMemo, useState } from 'react';

interface BookingFormProps {
    mode: 'create' | 'edit' | 'view';
    selectedDate: Date;
    formViewPrev: View;
    formData: {
        vehicleId: string;
        startTime: string;
        endTime: string;
        destination: string;
        purpose: string;
        requester: string;
        department: string;
    };
    defaultDept: string;
    timeInputs: TimeInputs;
    bookings: Booking[];
    selectedBooking: Booking | null;
    isSubmitting: boolean;
    onChangeFormData: (data: BookingFormProps['formData']) => void;
    onChangeTimeInputs: (inputs: TimeInputs) => void;
    onSubmit: () => void;
    onDelete: () => void;
    onBack: (view: View) => void;
    onChangeDate: (date: Date) => void;
    user: { uid: string; displayName?: string | null; email?: string | null; role?: string; };
    checkOverlap: (
        vehicleId: string,
        dateStr: string,
        startTime: string,
        endTime: string,
        excludeId?: string,
    ) => boolean;
}

export const BookingForm: React.FC<BookingFormProps> = ({
    mode,
    selectedDate,
    formViewPrev,
    formData,
    defaultDept,
    timeInputs,
    bookings,
    selectedBooking,
    isSubmitting,
    onChangeFormData,
    onChangeTimeInputs,
    onSubmit,
    onDelete,
    onBack,
    onChangeDate,
    user,
    checkOverlap,
}) => {
    const isReadOnly = mode === 'view';

    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [pickerMonth, setPickerMonth] = useState<Date>(selectedDate);

    useEffect(() => {
        setPickerMonth(selectedDate);
    }, [selectedDate]);

    const excludeId = mode === 'edit' && selectedBooking ? selectedBooking.id : undefined;

    const normalizedStartForCheck = normalizeTimeInput(timeInputs.start);
    const normalizedEndForCheck = normalizeTimeInput(timeInputs.end);

    const hasValidTimeRange =
        normalizedStartForCheck &&
        normalizedEndForCheck &&
        normalizedStartForCheck < normalizedEndForCheck;

    const isOverlap =
        !isReadOnly &&
        !isSubmitting &&
        hasValidTimeRange &&
        checkOverlap(
            formData.vehicleId,
            formatDate(selectedDate),
            normalizedStartForCheck,
            normalizedEndForCheck,
            excludeId,
        );

    const dateStr = formatDate(selectedDate);

    const sameDateBookings = useMemo(
        () =>
            bookings
                .filter(
                    (b) =>
                        b.date === dateStr && b.vehicleId === formData.vehicleId,
                )
                .sort((a, b) =>
                    (a.startTime || '').localeCompare(b.startTime || ''),
                ),
        [bookings, dateStr, formData.vehicleId],
    );

    const timeStrToMin = (t: string) => {
        if (!t) return 0;
        const [hStr, mStr] = t.split(':');
        const h = parseInt(hStr || '0', 10);
        const m = parseInt(mStr || '0', 10);
        return h * 60 + m;
    };

    const minToTimeStr = (total: number) => {
        const h = Math.floor(total / 60);
        const m = total % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const DAY_START = 0;
    const DAY_END = 24 * 60;

    let cursor = DAY_START;
    const availableRanges: { start: string; end: string }[] = [];

    sameDateBookings.forEach((b) => {
        const s = timeStrToMin(b.startTime);
        const e = timeStrToMin(b.endTime);

        if (s > cursor) {
            const gapStart = cursor;
            const gapEnd = Math.min(s, DAY_END);
            if (gapEnd > gapStart) {
                availableRanges.push({
                    start: minToTimeStr(gapStart),
                    end: minToTimeStr(gapEnd),
                });
            }
        }

        if (e > cursor) {
            cursor = e;
        }
    });

    if (cursor < DAY_END) {
        availableRanges.push({
            start: minToTimeStr(cursor),
            end: minToTimeStr(DAY_END),
        });
    }

    const selectedVehicle = VEHICLES.find((v) => v.id === formData.vehicleId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit();
    };

    const effectiveDept = formData.department || defaultDept || '';

    const blanks = useMemo(
        () => Array(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), 1).getDay()).fill(null),
        [pickerMonth],
    );

    const daysInMonth = useMemo(
        () => new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 0).getDate(),
        [pickerMonth],
    );

    const handleSelectDay = (day: number) => {
        const nextDate = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), day);
        onChangeDate(nextDate);
        setIsDatePickerOpen(false);
    };

    const handleToday = () => {
        const today = new Date();
        setPickerMonth(today);
        onChangeDate(today);
        setIsDatePickerOpen(false);
    };

    return (
        <div className="px-3 sm:px-4 md:px-6 py-4 md:py-6 max-w-lg md:max-w-xl lg:max-w-2xl mx-auto bg-white min-h-full">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-4 sm:mb-6 pb-3 sm:pb-4">
                <button
                    onClick={() => onBack(formViewPrev)}
                    className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full text-gray-600"
                >
                    <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
                </button>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold">
                    차량 배차 신청
                </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* 운행 일자 */}
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border relative">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600 font-medium mb-1">
                        <CalendarIcon size={16} className="sm:w-5 sm:h-5" />
                        <span className="text-sm sm:text-base">운행 일자</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mt-1">
                        <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
                            {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월{' '}
                            {selectedDate.getDate()}일
                        </div>

                        {!isReadOnly && (
                            <button
                                type="button"
                                onClick={() => setIsDatePickerOpen((prev) => !prev)}
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border bg-white text-xs sm:text-sm font-semibold text-gray-700 hover:border-blue-500 hover:text-blue-600 hover:shadow-sm transition-all"
                            >
                                <CalendarIcon size={16} className="text-blue-600" />
                                <span>달력으로 변경</span>
                            </button>
                        )}
                    </div>

                    {!isReadOnly && isDatePickerOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-30"
                                onClick={() => setIsDatePickerOpen(false)}
                            />
                            <div className="absolute right-2 top-full mt-2 z-40 w-full max-w-xs sm:max-w-sm">
                                <div className="bg-white border rounded-xl shadow-2xl p-3 sm:p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <button
                                            type="button"
                                            className="p-2 rounded-lg hover:bg-gray-100"
                                            onClick={() =>
                                                setPickerMonth(
                                                    (prev) =>
                                                        new Date(
                                                            prev.getFullYear(),
                                                            prev.getMonth() - 1,
                                                            1,
                                                        ),
                                                )
                                            }
                                        >
                                            <ChevronLeft className="w-4 h-4 text-gray-600" />
                                        </button>
                                        <div className="text-sm sm:text-base font-semibold text-gray-800">
                                            {pickerMonth.getFullYear()}년 {pickerMonth.getMonth() + 1}월
                                        </div>
                                        <button
                                            type="button"
                                            className="p-2 rounded-lg hover:bg-gray-100"
                                            onClick={() =>
                                                setPickerMonth(
                                                    (prev) =>
                                                        new Date(
                                                            prev.getFullYear(),
                                                            prev.getMonth() + 1,
                                                            1,
                                                        ),
                                                )
                                            }
                                        >
                                            <ChevronRight className="w-4 h-4 text-gray-600" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-7 gap-1 text-[11px] sm:text-xs text-center text-gray-500 font-semibold">
                                        <div className="text-red-500">일</div>
                                        <div>월</div>
                                        <div>화</div>
                                        <div>수</div>
                                        <div>목</div>
                                        <div>금</div>
                                        <div className="text-blue-500">토</div>
                                    </div>

                                    <div className="grid grid-cols-7 gap-1 text-center">
                                        {blanks.map((_, idx) => (
                                            <div key={`blank-${idx}`} className="h-9" />
                                        ))}

                                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                                            const cellDate = new Date(
                                                pickerMonth.getFullYear(),
                                                pickerMonth.getMonth(),
                                                day,
                                            );

                                            const isSelected =
                                                selectedDate.getFullYear() ===
                                                    cellDate.getFullYear() &&
                                                selectedDate.getMonth() === cellDate.getMonth() &&
                                                selectedDate.getDate() === cellDate.getDate();

                                            const isToday = (() => {
                                                const today = new Date();
                                                return (
                                                    today.getFullYear() === cellDate.getFullYear() &&
                                                    today.getMonth() === cellDate.getMonth() &&
                                                    today.getDate() === cellDate.getDate()
                                                );
                                            })();

                                            return (
                                                <button
                                                    type="button"
                                                    key={day}
                                                    onClick={() => handleSelectDay(day)}
                                                    className={`flex items-center justify-center h-9 rounded-lg text-sm font-semibold transition-all border ${isSelected
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                                        : isToday
                                                            ? 'border-blue-200 text-blue-700 bg-blue-50'
                                                            : 'text-gray-700 bg-white hover:bg-blue-50'}
                                                    ${isSelected ? 'hover:bg-blue-600' : ''}`}
                                                >
                                                    {day}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="flex items-center justify-between gap-2">
                                        <button
                                            type="button"
                                            onClick={handleToday}
                                            className="text-[12px] sm:text-xs text-blue-600 font-medium hover:underline"
                                        >
                                            오늘 날짜로 이동
                                        </button>
                                        <div className="text-[11px] sm:text-xs text-gray-500">
                                            선택된 날짜: {formatDate(selectedDate)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* 신청자 / 부서 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            신청자
                        </label>
                        <div className="relative">
                            <User className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3.5 text-gray-400" size={16} />
                            <input
                                type="text"
                                value={formData.requester}
                                disabled={isReadOnly}
                                onChange={(e) =>
                                    onChangeFormData({ ...formData, requester: e.target.value })
                                }
                                placeholder="신청자 이름 또는 아이디"
                                className="w-full pl-8 sm:pl-10 p-2.5 sm:p-3 border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            부서
                        </label>
                        <select
                            value={effectiveDept}
                            disabled={isReadOnly}
                            onChange={(e) =>
                                onChangeFormData({ ...formData, department: e.target.value })
                            }
                            className={`w-full p-2.5 sm:p-3 border rounded-lg text-xs sm:text-sm outline-none ${isReadOnly
                                ? 'bg-gray-50 text-gray-600 appearance-none cursor-default'
                                : 'bg-white focus:ring-2 focus:ring-blue-500'
                                }`}
                        >
                            <option value="">부서를 선택하세요</option>
                            <option value="대외협력추진본부">대외협력추진본부</option>
                            <option value="회원지원팀">회원지원팀</option>
                            <option value="회계팀">회계팀</option>
                            <option value="총무팀">총무팀</option>
                            <option value="사무국">사무국</option>
                        </select>
                    </div>
                </div>

                {/* 차량 선택 */}
                <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        차량 선택
                    </label>

                    <fieldset
                        disabled={isReadOnly}
                        className="grid grid-cols-1 gap-2.5 sm:gap-3"
                    >
                        {VEHICLES.map((v) => (
                            <label
                                key={v.id}
                                className={`
                  flex items-center p-2.5 sm:p-3 border rounded-lg transition-all text-xs sm:text-sm
                  ${formData.vehicleId === v.id
                                        ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                                        : 'hover:bg-gray-50'
                                    }
                  ${isReadOnly
                                        ? 'cursor-not-allowed opacity-60 hover:bg-white'
                                        : 'cursor-pointer'
                                    }
                `}
                            >
                                <input
                                    type="radio"
                                    name="vehicle"
                                    value={v.id}
                                    checked={formData.vehicleId === v.id}
                                    onChange={(e) =>
                                        onChangeFormData({
                                            ...formData,
                                            vehicleId: e.target.value,
                                        })
                                    }
                                    className="mr-2 sm:mr-3"
                                />
                                <div>
                                    <div className="font-bold text-gray-800">{v.number}</div>
                                    <div className="text-[11px] sm:text-xs text-gray-500">
                                        {v.name}
                                    </div>
                                </div>
                            </label>
                        ))}
                    </fieldset>
                </div>

                {/* 출발/도착 시간 입력 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            출발 시간
                        </label>
                        <input
                            type="text"
                            value={timeInputs.start}
                            disabled={isReadOnly}
                            onChange={(e) =>
                                onChangeTimeInputs({
                                    ...timeInputs,
                                    start: e.target.value,
                                })
                            }
                            onBlur={(e) => {
                                const normalized = normalizeTimeInput(e.target.value);
                                if (normalized) {
                                    onChangeTimeInputs({
                                        ...timeInputs,
                                        start: normalized,
                                    });
                                } else if (e.target.value.trim() !== '') {
                                    toast.error('출발 시간 형식이 올바르지 않습니다.', {
                                        description:
                                            '예: 09:00, 9-00, 900, 9 00, 9_00 형식으로 입력해 주세요.',
                                    });
                                }
                            }}
                            placeholder="예: 09:00 또는 900"
                            className={`w-full p-2.5 sm:p-3 border rounded-lg text-xs sm:text-sm outline-none ${isReadOnly
                                ? 'bg-gray-50 text-gray-600 cursor-default'
                                : 'bg-white focus:ring-2 focus:ring-blue-500'
                                }`}
                        />
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            도착 예정 시간
                        </label>
                        <input
                            type="text"
                            value={timeInputs.end}
                            disabled={isReadOnly}
                            onChange={(e) =>
                                onChangeTimeInputs({ ...timeInputs, end: e.target.value })
                            }
                            onBlur={(e) => {
                                const normalized = normalizeTimeInput(e.target.value);
                                if (normalized) {
                                    onChangeTimeInputs({ ...timeInputs, end: normalized });
                                } else if (e.target.value.trim() !== '') {
                                    toast.error('도착 시간 형식이 올바르지 않습니다.', {
                                        description:
                                            '예: 12:30, 1230, 12-30, 12 30, 12_30 형식으로 입력해 주세요.',
                                    });
                                }
                            }}
                            placeholder="예: 12:30 또는 1230"
                            className={`w-full p-2.5 sm:p-3 border rounded-lg text-xs sm:text-sm outline-none ${isReadOnly
                                ? 'bg-gray-50 text-gray-600 cursor-default'
                                : 'bg-white focus:ring-2 focus:ring-blue-500'
                                }`}
                        />
                    </div>
                </div>

                {!isReadOnly && (
                    <div className="text-[11px] sm:text-xs text-gray-500 mt-1">
                        시간 입력 예시:{' '}
                        <span className="font-mono">09:00</span>,{' '}
                        <span className="font-mono">9-00</span>,{' '}
                        <span className="font-mono">900</span>,{' '}
                        <span className="font-mono">9 00</span>,{' '}
                        <span className="font-mono">9_00</span> 형식 모두 입력 가능하며,
                        저장 시 자동으로 <span className="font-mono">HH:MM</span> 형식으로
                        변환됩니다.
                    </div>
                )}

                {isOverlap && (
                    <div className="flex items-start gap-2 bg-red-50 text-red-600 p-2.5 sm:p-3 rounded-lg text-xs sm:text-sm animate-pulse">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <div>
                            <span className="font-bold">예약 불가:</span> 선택하신 시간대에 이미
                            예약된 일정이 있습니다.
                        </div>
                    </div>
                )}

                {/* 예약 현황 안내 카드 */}
                {!isReadOnly && (
                    <div className="mt-2 sm:mt-3">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 sm:p-4 text-[13px] sm:text-[14px] space-y-2 shadow-[0_1px_4px_rgba(37,99,235,0.12)]">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600/90 text-white">
                                        <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] sm:text-xs font-semibold text-blue-700 tracking-wide">
                                            선택 날짜 / 차량
                                        </span>
                                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                            <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[11px] sm:text-xs font-medium text-blue-700 border border-blue-200">
                                                {dateStr}
                                            </span>
                                            <span className="inline-flex items-center rounded-full bg-purple-600 px-2 py-0.5 text-[11px] sm:text-xs font-semibold text-white shadow-sm">
                                                {selectedVehicle
                                                    ? `${selectedVehicle.name} · ${selectedVehicle.number}`
                                                    : '차량을 선택해 주세요'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-blue-100/70 my-1" />

                            {sameDateBookings.length === 0 ? (
                                <div className="flex items-start gap-2">
                                    <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <div className="text-blue-800 text-[12px] sm:text-[13px]">
                                        아직 이 차량으로 등록된 예약이 없습니다.
                                        <span className="ml-1 font-medium">
                                            00:00 ~ 24:00
                                        </span>{' '}
                                        전체 시간대가 신청 가능합니다.
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5 text-blue-800 font-medium text-[12px] sm:text-[13px]">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                        <span>이미 예약된 시간</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {sameDateBookings.map((b) => (
                                            <span
                                                key={b.id}
                                                className="px-1.5 py-0.5 rounded-full bg-white text-blue-800 border border-blue-200 text-[11px] sm:text-xs"
                                            >
                                                <span className="font-mono">
                                                    {b.startTime} ~ {b.endTime}
                                                </span>
                                                {(b.requester || b.userName) && (
                                                    <span className="ml-1 text-blue-500">
                                                        · {b.requester || b.userName}
                                                    </span>
                                                )}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {availableRanges.length > 0 && (
                                <div className="pt-1 border-t border-dashed border-blue-100 mt-1.5">
                                    <div className="flex items-center gap-1.5 text-blue-800 font-medium text-[12px] sm:text-[13px] mb-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        <span>신청 가능한 시간대 (00:00 ~ 24:00 기준)</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {availableRanges.map((r, idx) => (
                                            <span
                                                key={idx}
                                                className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[11px] sm:text-xs font-medium shadow-sm"
                                            >
                                                <span className="font-mono">
                                                    {r.start} ~ {r.end}
                                                </span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 출장 지역 */}
                <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        출장 지역
                    </label>
                    <div className="relative">
                        <MapPin
                            className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3.5 text-gray-400"
                            size={16}
                        />
                        <select
                            value={formData.destination}
                            disabled={isReadOnly}
                            onChange={(e) =>
                                onChangeFormData({
                                    ...formData,
                                    destination: e.target.value,
                                })
                            }
                            className={`w-full pl-8 sm:pl-10 p-2.5 sm:p-3 border rounded-lg text-xs sm:text-sm outline-none ${isReadOnly
                                ? 'bg-gray-100 text-gray-500 cursor-default appearance-none'
                                : 'bg-white focus:ring-2 focus:ring-blue-500'
                                }`}
                        >
                            <option value="">출장 지역을 선택하세요</option>
                            <option value="관내(남양주/구리)">관내(남양주/구리)</option>
                            <option value="관외">관외</option>
                        </select>
                    </div>
                </div>

                {/* 출장 목적 */}
                <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        출장 목적
                    </label>
                    <div className="relative">
                        <FileText
                            className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3.5 text-gray-400"
                            size={16}
                        />
                        <input
                            type="text"
                            placeholder="예: 클라이언트 미팅"
                            value={formData.purpose}
                            disabled={isReadOnly}
                            onChange={(e) =>
                                onChangeFormData({ ...formData, purpose: e.target.value })
                            }
                            className="w-full pl-8 sm:pl-10 p-2.5 sm:p-3 border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                {isReadOnly && (
                    <div className="text-xs sm:text-sm text-gray-500 bg-gray-50 border rounded-lg p-2.5 sm:p-3">
                        <span className="text-red-500">다른 사용자가 신청한 배차 내역</span>
                        입니다. 내용은 확인만 가능하며 수정할 수 없습니다.
                    </div>
                )}

                {!isReadOnly && (
                    <button
                        type="submit"
                        disabled={isOverlap || isSubmitting}
                        className={`w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg text-white shadow-lg transition-all ${isOverlap || isSubmitting
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl'
                            }`}
                    >
                        {mode === 'edit'
                            ? isSubmitting
                                ? '수정 중...'
                                : '배차 수정하기'
                            : isSubmitting
                                ? '신청 중...'
                                : '배차 신청하기'}
                    </button>
                )}

               {mode === 'edit' &&
                selectedBooking &&
                (selectedBooking.userId === user.uid || user.role === 'admin') && (
                    <button
                        type="button"
                        onClick={onDelete}
                        className="w-full mt-2 sm:mt-3 py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base text-white bg-red-500 hover:bg-red-600 shadow-md hover:shadow-lg transition-all"
                    >
                        이 배차 일정 삭제하기
                    </button>
                )}
            </form>
        </div>
    );
};
