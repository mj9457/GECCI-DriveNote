// components/vehicle/VehicleApp.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { LogOut, Truck, User as UserIcon } from 'lucide-react';
import { Toaster, toast } from 'sonner';

import { db, appId } from '@/lib/firebaseClient';
import { VEHICLES } from '@/lib/vehicleConstants';
import { formatDate, normalizeTimeInput } from '@/lib/timeUtils';
import {
    Booking,
    DriveLog,
    LogFormState,
    TimeInputs,
    VehicleFilter,
    View,
} from '@/types/vehicle';

import { LoginScreen } from '@/components/vehicle/auth/LoginScreen';
import { UnauthorizedScreen } from '@/components/vehicle/auth/UnauthorizedScreen';
import { CalendarView } from '@/components/vehicle/views/CalendarView';
import { DayView } from '@/components/vehicle/views/DayView';
import { BookingForm } from '@/components/vehicle/views/BookingForm';
import { MonthListView } from '@/components/vehicle/views/MonthListView';
import { DriveLogForm } from '@/components/vehicle/views/DriveLogForm';
import { LogsListView } from '@/components/vehicle/views/LogsListView';
import { UserSummaryView } from '@/components/vehicle/views/UserSummaryView';
import { useVehicleAuth } from '@/components/vehicle/hooks/useVehicleAuth';
import { useRealtimeVehicleData } from '@/components/vehicle/hooks/useRealtimeVehicleData';
import useActions from '@/components/vehicle/hooks/useActions';
import { Header } from '@/components/vehicle/layout/Header';
import FAB from '@/components/vehicle/layout/FAB';
import MainViews from '@/components/vehicle/layout/MainViews';
import { checkOverlap as utilCheckOverlap, getPrevFinalKm as utilGetPrevFinalKm } from '@/lib/vehicleUtils';

export default function VehicleApp() {
    const {
        user,
        isApproved,
        loading,
        loginError,
        defaultDept,
        handleLogin,
        handleLogout,
    } = useVehicleAuth();

    const [view, setView] = useState<View>('calendar');
    const [prevView, setPrevView] = useState<View>('calendar');

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    // bookings / driveLogs are provided by realtime hook

    const [logForm, setLogForm] = useState<LogFormState>({
        from: '다남프라자',
        via: '',
        to: '다남프라자',
        finalKm: '',
        purpose: '',
        driver: '',
        doubleParking: '',
        note: '',
    });

    const [timeInputs, setTimeInputs] = useState<TimeInputs>({
        start: '09:00',
        end: '12:00',
    });

    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>(
        'create',
    );

    // defaultDept is provided by auth hook
    const [vehicleFilter, setVehicleFilter] = useState<VehicleFilter>('all');

    const [formData, setFormData] = useState<{
        vehicleId: string;
        startTime: string;
        endTime: string;
        destination: string;
        purpose: string;
        requester: string;
        department: string;
    }>({
        vehicleId: VEHICLES[0].id,
        startTime: '09:00',
        endTime: '12:00',
        destination: '',
        purpose: '',
        requester: '',
        department: '',
    });

    // ----------------- Auth & Firestore -----------------

    // formData의 시간 → timeInputs에 반영
    useEffect(() => {
        setTimeInputs({
            start: formData.startTime,
            end: formData.endTime,
        });
    }, [formData.startTime, formData.endTime]);

    // realtime data handled by hooks
    const { bookings, driveLogs } = useRealtimeVehicleData(user, isApproved);

    // user가 바뀌면 formData.requester를 초기화
    useEffect(() => {
        if (!user) return;
        setFormData((prev) => ({
            ...prev,
            requester:
                prev.requester || user.displayName || user.email || user.uid || '',
        }));
    }, [user]);

    // logView 진입 시 logForm 세팅
    useEffect(() => {
        if (view !== 'log' || !selectedBooking) return;

        const booking = selectedBooking;

        const existingLog = driveLogs.find(
            (log) => log.bookingId === booking.id,
        );

        setLogForm({
            from: (existingLog && existingLog.from) || '다남프라자',
            via: (existingLog && existingLog.via) || '',
            to: (existingLog && existingLog.to) || '다남프라자',
            finalKm:
                existingLog && existingLog.finalKm != null
                    ? String(existingLog.finalKm)
                    : '',
            purpose: (existingLog && existingLog.purpose) || booking.purpose || '',
            driver:
                (existingLog && existingLog.driver) ||
                booking.requester ||
                booking.userName ||
                '',
            doubleParking: (existingLog && existingLog.doubleParking) || '',
            note: (existingLog && existingLog.note) || '',
        });
    }, [view, selectedBooking, driveLogs]);

    // ----------------- Handlers -----------------
    const { saveBooking, deleteBooking: actionDeleteBooking, saveDriveLog, deleteDriveLog } = useActions();

    // auth handlers provided by useVehicleAuth

    // FAB 클릭 → 신규 신청 폼 열기
    const handleFabClick = async () => {
        if (user?.email) {
            try {
                const userDocRef = doc(
                    db,
                    'artifacts',
                    appId,
                    'public',
                    'data',
                    'allowed_users',
                    user.email!,
                );
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    console.log('현재 사용자 Firestore 정보:', userDocSnap.data());
                } else {
                    console.log(
                        'allowed_users 에 현재 사용자 문서가 없습니다. email:',
                        user.email,
                    );
                }
            } catch (error) {
                console.error('사용자 Firestore 정보 조회 실패:', error);
            }
        } else {
            console.log('로그인 정보에 email 이 없습니다.', user);
        }

        setPrevView(view === 'form' ? 'calendar' : view);

        setFormMode('create');
        setSelectedBooking(null);

        setFormData({
            vehicleId: VEHICLES[0].id,
            startTime: '09:00',
            endTime: '12:00',
            destination: '',
            purpose: '',
            requester:
                user?.displayName || user?.email || user?.uid || '',
            department: defaultDept || '',
        });

        const today = new Date();

        if (view === 'calendar') {
            setSelectedDate(today);
        } else if (view === 'day') {
            // 유지
        } else if (view === 'list' || view === 'logs' || view === 'user') {
            if (
                today.getFullYear() === currentDate.getFullYear() &&
                today.getMonth() === currentDate.getMonth()
            ) {
                setSelectedDate(today);
            } else {
                setSelectedDate(
                    new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
                );
            }
        }

        setView('form');
    };

    const changeMonth = (delta: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setCurrentDate(newDate);
    };

    const goToCurrentMonth = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    const changeDay = (delta: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + delta);
        setSelectedDate(newDate);
    };

    const timeToMinutes = (t: string) => {
        const [hStr, mStr] = t.split(':');
        const h = parseInt(hStr || '0', 10);
        const m = parseInt(mStr || '0', 10);
        // '24:00' 은 익일 0시로 처리
        if (h === 24 && m === 0) return 24 * 60;
        return h * 60 + m;
    };

    // 🔹 기존 checkOverlap 전체를 이걸로 교체
    const checkOverlap = (
        vId: string,
        dateStr: string,
        startT: string,
        endT: string,
        excludeId?: string,
    ) => {
        const startMin = timeToMinutes(startT);
        const endMin = timeToMinutes(endT);

        return bookings.some((b) => {
            if (b.vehicleId !== vId || b.date !== dateStr) return false;
            if (excludeId && b.id === excludeId) return false;

            const bStart = timeToMinutes(b.startTime);
            const bEnd = timeToMinutes(b.endTime);

            // [start, end) 와 [bStart, bEnd) 가 겹치면 true
            return startMin < bEnd && endMin > bStart;
        });
    };

    // 이전 운행 최종키로수
    const getPrevFinalKm = (
        vehicleId: string,
        dateStr: string,
        bookingId?: string,
        bookingStartTime?: string,
    ): number | null => {
        const logs = driveLogs
            .filter((log) => {
                if (log.vehicleId !== vehicleId) return false;
                if (!log.date) return false;
                if (bookingId && log.bookingId === bookingId) return false;

                if (log.date < dateStr) return true;
                if (log.date > dateStr) return false;

                if (!bookingStartTime) return true;

                const relatedBooking = bookings.find((b) => b.id === log.bookingId);
                const logStart = relatedBooking?.startTime || '00:00';
                return logStart < bookingStartTime;
            })
            .sort((a, b) => {
                if (a.date !== b.date) {
                    return String(a.date).localeCompare(String(b.date));
                }
                const bookingA = bookings.find((bk) => bk.id === a.bookingId);
                const bookingB = bookings.find((bk) => bk.id === b.bookingId);
                const sa = bookingA?.startTime || '00:00';
                const sb = bookingB?.startTime || '00:00';
                return sa.localeCompare(sb);
            });

        if (logs.length === 0) return null;

        const last = logs[logs.length - 1];
        const raw = last.finalKm;
        if (typeof raw === 'number') return raw;
        const n = Number(raw as any);
        return Number.isNaN(n) ? null : n;
    };

    // 배차 저장
    const handleBookingSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        const normalizedStart = normalizeTimeInput(timeInputs.start);
        const normalizedEnd = normalizeTimeInput(timeInputs.end);

        if (!normalizedStart || !normalizedEnd) {
            toast.error('시간 형식이 올바르지 않습니다.', {
                description:
                    '출발/도착 시간을 예: 09:00, 9-00, 900 와 같은 형식으로 입력해 주세요.',
            });
            setIsSubmitting(false);
            return;
        }

        const startTime = normalizedStart;
        const endTime = normalizedEnd;
        const effectiveDept = formData.department || defaultDept;

        if (
            !formData.vehicleId ||
            !startTime ||
            !endTime ||
            !formData.destination ||
            !formData.requester ||
            !formData.purpose ||
            !effectiveDept
        ) {
            toast.error('필수 정보를 모두 입력해 주세요.', {
                description:
                    '신청자, 부서, 출장 목적, 출장 지역, 시간 등을 확인해주세요.',
            });
            setIsSubmitting(false);
            return;
        }

        if (startTime >= endTime) {
            toast.error('시간 선택이 올바르지 않습니다.', {
                description: '도착 시간이 출발 시간보다 늦어야 합니다.',
            });
            setIsSubmitting(false);
            return;
        }

        const dateStr = formatDate(selectedDate);
        const excludeId =
            formMode === 'edit' && selectedBooking ? selectedBooking.id : undefined;

        if (
            utilCheckOverlap(
                bookings,
                formData.vehicleId,
                dateStr,
                startTime,
                endTime,
                excludeId,
            )
        ) {
            toast.error('이미 예약된 시간대입니다.', {
                description: '다른 시간대를 선택해 주세요.',
            });
            setIsSubmitting(false);
            return;
        }
        try {
            if (formMode === 'edit' && selectedBooking) {
                const res = await saveBooking('edit', {
                    id: selectedBooking.id,
                    data: {
                        ...formData,
                        startTime,
                        endTime,
                        department: effectiveDept,
                        date: dateStr,
                        userId: user.uid,
                        userName: user.displayName,
                        updatedAt: new Date().toISOString(),
                    } as any,
                });

                if (res.ok) {
                    toast.success('배차 예약이 수정되었습니다.', {
                        description: `${dateStr} / ${startTime}~${endTime}`,
                    });
                } else {
                    throw res.error;
                }
            } else {
                const res = await saveBooking('create', {
                    data: {
                        ...formData,
                        startTime,
                        endTime,
                        department: effectiveDept,
                        date: dateStr,
                        userId: user.uid,
                        userName: user.displayName,
                        createdAt: new Date().toISOString(),
                    } as any,
                });

                if (res.ok) {
                    toast.success('배차 예약이 등록되었습니다.', {
                        description: `${dateStr} / ${startTime}~${endTime}`,
                    });
                } else {
                    throw res.error;
                }
            }

            setView('day');
            setFormData((prev) => ({
                ...prev,
                destination: '',
                purpose: '',
            }));
            setSelectedBooking(null);
            setFormMode('create');
        } catch (err) {
            console.error(err);
            toast.error('저장에 실패했습니다.', {
                description: '네트워크 상태를 확인하거나, 잠시 후 다시 시도해 주세요.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteBooking = async () => {
        if (!selectedBooking || !user) return;

        if (selectedBooking.userId !== user.uid) {
            toast.error('삭제 권한이 없습니다.', {
                description: '본인이 신청한 배차만 삭제할 수 있습니다.',
            });
            return;
        }

        const ok = window.confirm('정말 이 배차 일정을 삭제하시겠습니까?');
        if (!ok) return;

        try {
            const res = await actionDeleteBooking(selectedBooking.id);
            if (res.ok) {
                toast.success('배차 예약이 삭제되었습니다.');
                setSelectedBooking(null);
                setFormMode('create');
                setView('day');
            } else {
                throw res.error;
            }
        } catch (err) {
            console.error(err);
            toast.error('삭제 중 오류가 발생했습니다.', {
                description: '잠시 후 다시 시도해 주세요.',
            });
        }
    };

    // 내 배차에서 개별 삭제
    const handleDeleteMyBooking = async (booking: Booking) => {
        if (!user) return;

        if (booking.userId !== user.uid) {
            toast.error('삭제 권한이 없습니다.', {
                description: '본인이 신청한 배차만 삭제할 수 있습니다.',
            });
            return;
        }

        const ok = window.confirm('정말 이 배차 신청을 삭제하시겠습니까?');
        if (!ok) return;

        try {
            const res = await actionDeleteBooking(booking.id);
            if (res.ok) {
                if (selectedBooking && selectedBooking.id === booking.id) {
                    setSelectedBooking(null);
                    setFormMode('create');
                    if (view === 'form') {
                        setView('user');
                    }
                }
                toast.success('배차 신청이 삭제되었습니다.');
            } else {
                throw res.error;
            }
        } catch (err) {
            console.error(err);
            toast.error('배차 삭제 중 오류가 발생했습니다.', {
                description: '잠시 후 다시 시도해 주세요.',
            });
        }
    };

    // 내 운행일지 삭제
    const handleDeleteMyLog = async (log: DriveLog) => {
        const ok = window.confirm('정말 이 운행일지를 삭제하시겠습니까?');
        if (!ok) return;

        try {
            const logRef = doc(
                db,
                'artifacts',
                appId,
                'public',
                'data',
                'vehicle_drive_logs',
                log.id,
            );

            await deleteDoc(logRef);

            toast.success('운행일지가 삭제되었습니다.');
        } catch (err) {
            console.error(err);
            toast.error('운행일지 삭제 중 오류가 발생했습니다.', {
                description: '잠시 후 다시 시도해 주세요.',
            });
        }
    };

    // 운행일지 저장
    const handleLogSubmit = async () => {
        if (!selectedBooking) return;

        const booking = selectedBooking;
        const dateStr = booking.date || formatDate(selectedDate);

        const prevKmRaw = getPrevFinalKm(
            booking.vehicleId,
            dateStr,
            booking.id,
            booking.startTime,
        );

        const prevKm = prevKmRaw != null ? prevKmRaw : null;
        const finalKm = Number(logForm.finalKm || 0);

        if (!finalKm) {
            toast.error('현재 최종 키로수를 입력해 주세요.');
            return;
        }

        if (prevKm != null && finalKm < prevKm) {
            toast.error('키로수 입력이 올바르지 않습니다.', {
                description:
                    '현재 최종 키로수는 이전 최종 키로수보다 크거나 같아야 합니다.',
            });
            return;
        }

        const distanceKm =
            prevKm != null ? finalKm - prevKm : 0;

        const existingLog = driveLogs.find(
            (log) => log.bookingId === booking.id,
        );

        try {
            const baseData: Omit<DriveLog, 'id'> = {
                bookingId: booking.id,
                vehicleId: booking.vehicleId,
                date: dateStr,
                from: logForm.from,
                via: logForm.via,
                to: logForm.to,
                prevFinalKm: prevKm,
                finalKm,
                distanceKm,
                purpose: logForm.purpose,
                driver: logForm.driver,
                doubleParking: logForm.doubleParking,
                note: logForm.note,
                updatedAt: new Date().toISOString(),
            };

            if (existingLog) {
                const logRef = doc(
                    db,
                    'artifacts',
                    appId,
                    'public',
                    'data',
                    'vehicle_drive_logs',
                    existingLog.id,
                );
                await updateDoc(logRef, baseData as any);
                toast.success('운행일지가 수정되었습니다.');
            } else {
                await addDoc(
                    collection(
                        db,
                        'artifacts',
                        appId,
                        'public',
                        'data',
                        'vehicle_drive_logs',
                    ),
                    {
                        ...baseData,
                        createdAt: new Date().toISOString(),
                    } as any,
                );
                toast.success('운행일지가 저장되었습니다.');
            }

            setView(prevView);
        } catch (error) {
            console.error(error);
            toast.error('운행일지 저장 중 오류가 발생했습니다.', {
                description: '잠시 후 다시 시도해 주세요.',
            });
        }
    };

    // Day / List / User 등에서 배차 클릭 → 폼 열기
    const openBookingForm = (booking: Booking) => {
        const [y, m, d] = booking.date.split('-').map(Number);
        setSelectedDate(new Date(y, m - 1, d));

        setFormData({
            vehicleId: booking.vehicleId,
            startTime: booking.startTime,
            endTime: booking.endTime,
            destination: booking.destination ?? '',
            purpose: booking.purpose ?? '',
            requester: booking.requester ?? booking.userName ?? '',
            department: booking.department ?? defaultDept ?? '',
        });

        setSelectedBooking(booking);
        setPrevView(view);

        if (user && booking.userId === user.uid) {
            setFormMode('edit');
        } else {
            setFormMode('view');
        }

        setView('form');
    };

    // 운행일지 화면 열기
    const openDriveLogForm = (
        booking: Booking,
        origin: 'list' | 'logs' | 'user' = 'list',
    ) => {
        setSelectedBooking(booking);
        setPrevView(origin);
        setView('log');
    };

    // ----------------- Header / Badge -----------------

    const isLogView = view === 'logs' || view === 'log';
    const headerTitle = isLogView
        ? '차량운행일지'
        : view === 'user'
            ? '내 이용내역'
            : '차량신청현황';

    const pendingLogCount = useMemo(() => {
        const now = new Date();
        if (!user) return 0;
        return bookings.filter((b) => {
            if (b.userId !== user.uid) return false;
            if (!b.date || !b.endTime) return false;

            const end = new Date(`${b.date}T${b.endTime}:00`);
            if (end > now) return false;

            const hasLog = driveLogs.some((log) => log.bookingId === b.id);
            return !hasLog;
        }).length;
    }, [bookings, driveLogs, user]);

    const pendingLogBadgeText = useMemo(() => (pendingLogCount > 9 ? '9+' : pendingLogCount.toString()), [pendingLogCount]);

    // ----------------- Render -----------------

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
            </div>
        );
    }

    if (!user) {
        return <LoginScreen onLogin={handleLogin} error={loginError} />;
    }

    if (!isApproved) {
        return (
            <UnauthorizedScreen
                email={user.email}
                onLogout={handleLogout}
            />
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-100 px-0 sm:px-2 md:px-4 lg:px-8">
            <Toaster position="top-center" richColors closeButton />
            <div className="flex flex-col h-full w-full max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-6xl mx-auto bg-gray-100 md:bg-gray-50 md:rounded-2xl md:shadow-2xl overflow-hidden relative my-2 sm:my-4 md:my-6">
                {/* Header */}
                <header className="bg-white text-gray-800 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between z-30 shadow-sm relative">
                    {/* 좌측: 아이콘 + 제목 */}
                    <div
                        className="flex items-center gap-1.5 sm:gap-2 cursor-pointer"
                        onClick={() => setView('calendar')}
                    >
                        <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg text-white">
                            <Truck size={18} className="sm:w-5 sm:h-5" />
                        </div>
                        <h1 className="font-bold text-base sm:text-lg md:text-xl">
                            {headerTitle}
                        </h1>
                    </div>

                    {/* 중앙: 뷰 전환 토글 */}
                    <div className="absolute left-1/2 -translate-x-1/2">
                        <div className="flex items-center gap-1 sm:gap-2 bg-gray-100 px-1.5 py-1 rounded-full text-[11px] sm:text-xs">
                            <button
                                type="button"
                                onClick={() => setView('calendar')}
                                className={`px-2 py-0.5 rounded-full font-medium ${view === 'calendar' ||
                                    view === 'day' ||
                                    view === 'form'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500'
                                    }`}
                            >
                                달력 보기
                            </button>

                            <button
                                type="button"
                                onClick={() => setView('list')}
                                className={`px-2 py-0.5 rounded-full font-medium ${view === 'list'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500'
                                    }`}
                            >
                                월별 목록
                            </button>

                            <button
                                type="button"
                                onClick={() => setView('logs')}
                                className={`px-2 py-0.5 rounded-full font-medium ${view === 'logs' || view === 'log'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500'
                                    }`}
                            >
                                운행일지
                            </button>
                        </div>
                    </div>

                    {/* 우측: 사용자 pill + 로그아웃 */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="relative">
                            {pendingLogCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center border border-white pointer-events-none">
                                    {pendingLogBadgeText}
                                </span>
                            )}

                            <div
                                className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm bg-gray-50 px-2.5 sm:px-3 py-1.5 rounded-full border max-w-[140px] sm:max-w-[170px] cursor-pointer hover:bg-blue-50 hover:border-blue-400"
                                onClick={() => setView('user')}
                            >
                                <UserIcon
                                    size={12}
                                    className="sm:w-4 sm:h-4 text-gray-500"
                                />
                                <span className="font-medium text-gray-700 truncate">
                                    {user.displayName || user.email}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <LogOut size={18} className="sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </header>

                {/* Main */}
                <main className="flex-1 overflow-auto bg-white md:bg-gray-50 relative">
                    {view === 'calendar' && (
                        <CalendarView
                            currentDate={currentDate}
                            bookings={bookings}
                            selectedDate={selectedDate}
                            onChangeMonth={changeMonth}
                            onSelectDate={(date) => {
                                setSelectedDate(date);
                                setView('day');
                            }}
                            onGoToday={goToCurrentMonth}
                        />
                    )}

                    {view === 'day' && (
                        <DayView
                            selectedDate={selectedDate}
                            bookings={bookings}
                            onBackToCalendar={() => setView('calendar')}
                            onChangeDay={changeDay}
                            onOpenBookingForm={openBookingForm}
                        />
                    )}

                    {view === 'form' && (
                        <BookingForm
                            mode={formMode}
                            selectedDate={selectedDate}
                            formViewPrev={prevView}
                            formData={formData}
                            defaultDept={defaultDept}
                            timeInputs={timeInputs}
                            bookings={bookings}
                            selectedBooking={selectedBooking}
                            isSubmitting={isSubmitting}
                            onChangeFormData={setFormData}
                            onChangeTimeInputs={setTimeInputs}
                            onSubmit={handleBookingSubmit}
                            onDelete={handleDeleteBooking}
                            onBack={(v) => setView(v)}
                            userId={user.uid}
                            checkOverlap={checkOverlap}
                        />
                    )}

                    {view === 'list' && (
                        <MonthListView
                            currentDate={currentDate}
                            bookings={bookings}
                            driveLogs={driveLogs}
                            vehicleFilter={vehicleFilter}
                            onVehicleFilterChange={setVehicleFilter}
                            onChangeMonth={changeMonth}
                            onGoToday={goToCurrentMonth}
                            onOpenBookingForm={openBookingForm}
                            onOpenDriveLogForm={openDriveLogForm}
                        />
                    )}

                    {view === 'log' && selectedBooking && (
                        <DriveLogForm
                            booking={selectedBooking}
                            logForm={logForm}
                            prevKm={getPrevFinalKm(
                                selectedBooking.vehicleId,
                                selectedBooking.date,
                                selectedBooking.id,
                                selectedBooking.startTime,
                            )}
                            onChangeLogForm={setLogForm}
                            onSubmit={handleLogSubmit}
                            onBack={() => setView(prevView)}
                        />
                    )}

                    {view === 'logs' && (
                        <LogsListView
                            currentDate={currentDate}
                            bookings={bookings}
                            driveLogs={driveLogs}
                            vehicleFilter={vehicleFilter}
                            onVehicleFilterChange={setVehicleFilter}
                            onChangeMonth={changeMonth}
                            onGoToday={goToCurrentMonth}
                            onOpenDriveLogForm={openDriveLogForm}
                        />
                    )}

                    {view === 'user' && (
                        <UserSummaryView
                            currentDate={currentDate}
                            user={user}
                            bookings={bookings}
                            driveLogs={driveLogs}
                            vehicleFilter={vehicleFilter}
                            onVehicleFilterChange={setVehicleFilter}
                            onChangeMonth={changeMonth}
                            onGoToday={goToCurrentMonth}
                            onOpenDriveLogForm={openDriveLogForm}
                            onDeleteMyBooking={handleDeleteMyBooking}
                            onDeleteMyLog={handleDeleteMyLog}
                        />
                    )}
                </main>

                {/* FAB */}
                {view !== 'form' && (
                    <button
                        onClick={handleFabClick}
                        className="fixed sm:absolute bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-blue-700 hover:scale-110 transition-all z-50 group"
                    >
                        <span className="text-2xl sm:text-3xl leading-none group-hover:rotate-90 transition-transform duration-300">
                            +
                        </span>
                    </button>
                )}
            </div>
        </div>
    );
}
