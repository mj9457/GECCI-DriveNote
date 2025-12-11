// components/vehicle/VehicleApp.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
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
import { useVehicleAuth } from '@/components/vehicle/hooks/useVehicleAuth';
import { useRealtimeVehicleData } from '@/components/vehicle/hooks/useRealtimeVehicleData';
import useActions from '@/components/vehicle/hooks/useActions';
import { Header } from '@/components/vehicle/layout/Header';
import FAB from '@/components/vehicle/layout/FAB';
import MainViews from '@/components/vehicle/layout/MainViews';
import { checkOverlap as utilCheckOverlap, getPrevFinalKm} from '@/lib/vehicleUtils';

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
                prev.requester || user.displayName || user.email || user.uid || user.role || '',
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
    const { saveBooking, deleteBooking: actionDeleteBooking } = useActions();


    // auth handlers provided by useVehicleAuth

    // FAB 클릭 → 신규 신청 폼 열기
    const handleFabClick = async () => {
        if (user?.email) {
            try {
                const userDocRef = doc(
                    db,
                    `artifacts/${appId}/public/data/allowed_users/${user.email}`,
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
                user?.displayName || user?.email || user?.uid || user?.role ||'',
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

    // 배차 저장
    const handleBookingSubmit = async () => {
        if (isSubmitting || !user) return;
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
                    } as Booking,
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
                    } as Booking,
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

    if (selectedBooking.userId !== user.uid && user.role !== 'admin') {
        toast.error('삭제 권한이 없습니다.', {
            description: '본인 또는 관리자만 삭제할 수 있습니다.',
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

        if (booking.userId !== user.uid && user.role !== 'admin') {
            toast.error('삭제 권한이 없습니다.', {
                description: '본인 또는 관리자만 삭제할 수 있습니다.',
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
                String(appId),
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
            bookings,
            driveLogs,
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
                    String(appId),
                    'public',
                    'data',
                    'vehicle_drive_logs',
                    existingLog.id,
                );
                await updateDoc(logRef, baseData as Partial<DriveLog>);
                toast.success('운행일지가 수정되었습니다.');
            } else {
                await addDoc(
                    collection(
                        db,
                        'artifacts',
                        String(appId),
                        'public',
                        'data',
                        'vehicle_drive_logs',
                    ),
                    {
                        ...baseData,
                        createdAt: new Date().toISOString(),
                    } as Omit<DriveLog, 'id'>,
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

        if (user && (booking.userId === user.uid || user.role === 'admin')) {
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

    const fabVisible = view !== 'form' && view !== 'log' && view !== 'logs';

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
                email={user.email || user.uid || ''}
                onLogout={handleLogout}
            />
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-100 px-0 sm:px-2 md:px-4 lg:px-8">
            <Toaster position="top-center" richColors closeButton />
            <div className="flex flex-col h-full w-full max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-7xl mx-auto bg-gray-100 md:bg-gray-50 md:rounded-2xl md:shadow-2xl overflow-hidden relative my-2 sm:my-4 md:my-6">
                {/* Header */}
                <Header
                    headerTitle={headerTitle}
                    user={user}
                    pendingLogCount={pendingLogCount}
                    pendingLogBadgeText={pendingLogBadgeText}
                    onUserClick={() => setView('user')}
                    onLogout={handleLogout}
                    view={view}
                    setView={setView}
                />

                {user && user.uid && (
                    <MainViews
                        view={view}
                        currentDate={currentDate}
                        bookings={bookings}
                        driveLogs={driveLogs}
                        selectedDate={selectedDate}
                        selectedBooking={selectedBooking}
                        formMode={formMode}
                        timeInputs={timeInputs}
                        formData={formData}
                        defaultDept={defaultDept}
                        isSubmitting={isSubmitting}
                        vehicleFilter={vehicleFilter}
                        onVehicleFilterChange={setVehicleFilter}
                        onChangeMonth={changeMonth}
                        onSelectDate={(date) => {
                            setSelectedDate(date);
                            setView('day');
                        }}
                        onGoToday={goToCurrentMonth}
                        onChangeDay={changeDay}
                        onOpenBookingForm={openBookingForm}
                        onOpenDriveLogForm={openDriveLogForm}
                        onSubmitBooking={handleBookingSubmit}
                        onDeleteBooking={handleDeleteBooking}
                        onBackFromForm={(v) => setView(v)}
                        onChangeFormData={setFormData}
                        onChangeTimeInputs={setTimeInputs}
                        onChangeLogForm={setLogForm}
                        onSubmitLog={handleLogSubmit}
                        onBackFromLog={() => setView(prevView)}
                        onDeleteMyBooking={handleDeleteMyBooking}
                        onDeleteMyLog={handleDeleteMyLog}
                        checkOverlap={(vId, dateStr, startT, endT, excludeId) =>
                            utilCheckOverlap(bookings, vId, dateStr, startT, endT, excludeId)
                        }
                        logForm={logForm}
                        prevKm={
                            selectedBooking
                                ? getPrevFinalKm(
                                      bookings,
                                      driveLogs,
                                      selectedBooking.vehicleId,
                                      selectedBooking.date,
                                      selectedBooking.id,
                                      selectedBooking.startTime,
                                  )
                                : null
                        }
                        user={{ ...user, uid: user.uid }}
                    />
                )}

             
            
            </div>  
            {/* FAB */}
                <FAB
                    visible={fabVisible}
                    onClick={handleFabClick}
                />
        </div>
    );
}
