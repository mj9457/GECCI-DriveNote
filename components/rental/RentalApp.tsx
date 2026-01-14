'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner';
import { CalendarDays, LogOut, User as UserIcon } from 'lucide-react';

import { LoginScreen } from '@/components/vehicle/auth/LoginScreen';
import { UnauthorizedScreen } from '@/components/vehicle/auth/UnauthorizedScreen';
import HeaderMenu from '@/components/shared/HeaderMenu';
import { useVacationAuth } from '@/components/vacation/hooks/useVacationAuth';
import { useRealtimeRentals } from '@/components/rental/hooks/useRealtimeRentals';
import { useRentalActions } from '@/components/rental/hooks/useRentalActions';
import RentalCalendar from '@/components/rental/views/RentalCalendar';
import RentalForm from '@/components/rental/views/RentalForm';
import { RentalFormState, RentalSchedule } from '@/types/rental';

const toDateValue = (d: Date) => d.toISOString().slice(0, 10);

export default function RentalApp() {
  const router = useRouter();
  const { user, isApproved, loading, loginError, handleLogin, handleLogout } = useVacationAuth();
  const { rentals } = useRealtimeRentals(user, isApproved);
  const { saveRental, deleteRental } = useRentalActions();

  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedRental, setSelectedRental] = useState<RentalSchedule | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<RentalFormState>(() => ({
    businessNumber: '',
    companyName: '',
    applicantName: '',
    phone: '',
    eventName: '',
    rentalDate: toDateValue(new Date()),
    startTime: '10:00',
    endTime: '18:00',
    timeOption: 'full_day',
    facilities: ['none'],
    memberType: 'member',
  }));

  const changeMonth = (delta: number) => {
    if (delta === 0) {
      setCurrentMonth(new Date());
      return;
    }
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + delta);
    setCurrentMonth(next);
  };

  const openCreateForm = () => {
    setFormMode('create');
    setSelectedRental(null);
    const today = new Date();
    setForm({
      businessNumber: '',
      companyName: '',
      applicantName: '',
      phone: '',
      eventName: '',
      rentalDate: toDateValue(today),
      startTime: '10:00',
      endTime: '18:00',
      timeOption: 'full_day',
      facilities: ['none'],
      memberType: 'member',
    });
    setIsFormOpen(true);
  };

  const openRental = (rental: RentalSchedule) => {
    setSelectedRental(rental);
    setForm({
      businessNumber: rental.businessNumber || '',
      companyName: rental.companyName || '',
      applicantName: rental.applicantName || '',
      phone: rental.phone || '',
      eventName: rental.eventName || '',
      rentalDate: rental.rentalDate,
      startTime: rental.startTime,
      endTime: rental.endTime,
      timeOption: rental.timeOption,
      facilities: rental.facilities || ['none'],
      memberType: rental.memberType,
    });

    const canEdit = !!user && rental.userId === user.uid;
    setFormMode(canEdit ? 'edit' : 'view');
    const [y, m] = rental.rentalDate.split('-').map(Number);
    if (y && m) setCurrentMonth(new Date(y, m - 1, 1));
    setIsFormOpen(true);
  };

  const validateForm = () => {
    if (
      !form.businessNumber.trim() ||
      !form.companyName.trim() ||
      !form.applicantName.trim() ||
      !form.phone.trim() ||
      !form.eventName.trim() ||
      !form.rentalDate ||
      !form.startTime ||
      !form.endTime ||
      !form.timeOption ||
      !form.memberType ||
      !form.facilities.length
    ) {
      toast.error('필수 항목을 모두 입력하세요.', {
        description:
          '사업자번호, 업체명, 신청자명, 휴대폰번호, 행사명, 대관일, 시간 정보가 필요합니다.',
      });
      return false;
    }

    const start = new Date(`2000-01-01T${form.startTime}`);
    const end = new Date(`2000-01-01T${form.endTime}`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast.error('시간 형식이 올바르지 않습니다.');
      return false;
    }
    if (end < start) {
      toast.error('종료시간이 시작시간보다 빠를 수 없습니다.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (formMode === 'view') return;
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      if (formMode === 'create') {
        const res = await saveRental('create', {
          data: {
            ...form,
            userId: user.uid,
            createdAt: new Date().toISOString(),
          },
        });
        if (!res.ok) throw res.error;
        toast.success('대관 일정이 등록되었습니다.');
      } else if (formMode === 'edit' && selectedRental) {
        const res = await saveRental('edit', {
          id: selectedRental.id,
          data: {
            ...form,
            userId: selectedRental.userId,
            updatedAt: new Date().toISOString(),
          },
        });
        if (!res.ok) throw res.error;
        toast.success('대관 일정이 수정되었습니다.');
      }

      const day = new Date(form.rentalDate);
      if (!Number.isNaN(day.getTime())) {
        setCurrentMonth(new Date(day.getFullYear(), day.getMonth(), 1));
      }
      setIsFormOpen(false);
      setSelectedRental(null);
      setFormMode('create');
    } catch (error) {
      console.error(error);
      toast.error('저장 중 오류가 발생했습니다.', {
        description: '잠시 후 다시 시도해주세요.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRental) return;
    const ok = window.confirm('정말 대관 일정을 삭제할까요?');
    if (!ok) return;
    try {
      const res = await deleteRental(selectedRental.id);
      if (!res.ok) throw res.error;
      toast.success('대관 일정이 삭제되었습니다.');
      setIsFormOpen(false);
      setSelectedRental(null);
      setFormMode('create');
    } catch (error) {
      console.error(error);
      toast.error('삭제 중 문제가 발생했습니다.');
    }
  };

  const sortedRentals = useMemo(
    () =>
      [...rentals].sort((a, b) => {
        if (a.rentalDate === b.rentalDate)
          return (a.eventName || '').localeCompare(b.eventName || '');
        return a.rentalDate.localeCompare(b.rentalDate);
      }),
    [rentals]
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-cyan-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} error={loginError} />;
  }

  if (!isApproved) {
    return <UnauthorizedScreen email={user.email || user.uid} onLogout={handleLogout} />;
  }

  const canDelete = !!user && selectedRental?.userId === user.uid;

  return (
    <div className="flex flex-col h-screen bg-gray-100 px-0 sm:px-2 md:px-4 lg:px-8">
      <Toaster position="top-center" richColors closeButton />
      <div className="flex flex-col h-full w-full max-w-full sm:max-w-3xl md:max-w-5xl lg:max-w-7xl mx-auto bg-gray-100 md:bg-gray-50 md:rounded-2xl md:shadow-2xl overflow-hidden relative my-2">
        <header className="bg-white text-gray-800 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <div className="bg-cyan-600 text-white w-11 h-11 rounded-lg flex items-center justify-center">
              <CalendarDays />
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg md:text-xl">교육장 대관 일정</h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                교육장 대관 일정을 관리합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 order-2">
            <HeaderMenu />

            <div className="relative flex items-center">
              <div
                className="
                  inline-flex items-center 
                  gap-0 min-[721px]:gap-2       
                  text-xs sm:text-sm 
                  bg-gray-50 
                  px-2 min-[721px]:px-3 py-1.5   
                  rounded-full border border-gray-300 
                  min-[721px]:max-w-[170px]      
                  cursor-pointer hover:bg-blue-50 hover:border-blue-400
                "
                onClick={() => router.push('/staff')}
              >
                <UserIcon className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700 truncate hidden min-[721px]:block">
                  {user.displayName || user.email}
                </span>
              </div>
            </div>

            <div className="relative group">
              <button
                onClick={handleLogout}
                className="flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <div className="absolute left-1/2 -translate-x-1/2 mt-1 hidden group-hover:block whitespace-nowrap bg-gray-800 text-white text-[14px] px-2 py-1 rounded-md shadow-lg z-50">
                로그아웃
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <RentalCalendar
            currentMonth={currentMonth}
            rentals={sortedRentals}
            onChangeMonth={changeMonth}
            onSelectEvent={openRental}
            onAdd={openCreateForm}
          />
        </main>
      </div>

      <RentalForm
        open={isFormOpen}
        mode={formMode}
        form={form}
        onChange={setForm}
        onSubmit={handleSubmit}
        onClose={() => setIsFormOpen(false)}
        onDelete={canDelete ? handleDelete : undefined}
        isSubmitting={isSubmitting}
        canDelete={canDelete}
      />
    </div>
  );
}
