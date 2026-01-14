'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner';
import { CalendarDays, LogOut, User as UserIcon } from 'lucide-react';

import { LoginScreen } from '@/components/vehicle/auth/LoginScreen';
import { UnauthorizedScreen } from '@/components/vehicle/auth/UnauthorizedScreen';
import HeaderMenu from '@/components/shared/HeaderMenu';
import { useVacationAuth } from '@/components/vacation/hooks/useVacationAuth';
import { useRealtimeVacations } from '@/components/vacation/hooks/useRealtimeVacations';
import { useVacationActions } from '@/components/vacation/hooks/useVacationActions';
import VacationCalendar from '@/components/vacation/views/VacationCalendar';
import VacationForm from '@/components/vacation/views/VacationForm';
import { VacationFormState, VacationSchedule } from '@/types/vacation';

const toDateValue = (d: Date) => d.toISOString().slice(0, 10);

export default function VacationApp() {
  const router = useRouter();
  const { user, isApproved, loading, loginError, defaultDept, handleLogin, handleLogout } =
    useVacationAuth();
  const { vacations } = useRealtimeVacations(user, isApproved);
  const { saveVacation, deleteVacation } = useVacationActions();

  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedVacation, setSelectedVacation] = useState<VacationSchedule | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<VacationFormState>(() => ({
    userName: '',
    department: '',
    startDate: toDateValue(new Date()),
    endDate: toDateValue(new Date()),
    category: 'annual',
    subType: 'full',
    note: '',
  }));

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      userName: prev.userName || user.displayName || user.email || '',
      department: prev.department || user.department || defaultDept || '',
    }));
  }, [user, defaultDept]);

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
    setSelectedVacation(null);
    const today = new Date();
    setForm({
      userName: user?.displayName || user?.email || '',
      department: user?.department || defaultDept || '',
      startDate: toDateValue(today),
      endDate: toDateValue(today),
      category: 'annual',
      subType: 'full',
      note: '',
    });
    setIsFormOpen(true);
  };

  const openVacation = (vacation: VacationSchedule) => {
    setSelectedVacation(vacation);
    setForm({
      userName: vacation.userName || '',
      department: vacation.department || '',
      startDate: vacation.startDate,
      endDate: vacation.endDate,
      category: vacation.category,
      subType: vacation.subType,
      note: vacation.note || '',
    });

    const canEdit = !!user && vacation.userId === user.uid;
    setFormMode(canEdit ? 'edit' : 'view');
    const [y, m] = vacation.startDate.split('-').map(Number);
    if (y && m) setCurrentMonth(new Date(y, m - 1, 1));
    setIsFormOpen(true);
  };

  const validateForm = () => {
    if (
      !form.userName.trim() ||
      !form.department.trim() ||
      !form.startDate ||
      !form.endDate ||
      !form.subType
    ) {
      toast.error('필수 정보를 모두 입력하세요.', {
        description: '이름, 부서, 시작일, 종료일, 세부 구분은 필수입니다.',
      });
      return false;
    }

    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast.error('날짜 형식이 올바르지 않습니다.');
      return false;
    }
    if (end < start) {
      toast.error('종료일이 시작일보다 빠를 수 없습니다.');
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
        const res = await saveVacation('create', {
          data: {
            ...form,
            userId: user.uid,
            userName: form.userName || user.displayName || user.email || '',
            department: form.department || defaultDept,
            createdAt: new Date().toISOString(),
          },
        });
        if (!res.ok) throw res.error;
        toast.success('휴가 일정이 등록되었습니다.');
      } else if (formMode === 'edit' && selectedVacation) {
        const res = await saveVacation('edit', {
          id: selectedVacation.id,
          data: {
            ...form,
            userId: selectedVacation.userId,
            userName: form.userName,
            department: form.department,
            updatedAt: new Date().toISOString(),
          },
        });
        if (!res.ok) throw res.error;
        toast.success('휴가 일정이 수정되었습니다.');
      }

      const start = new Date(form.startDate);
      if (!Number.isNaN(start.getTime())) {
        setCurrentMonth(new Date(start.getFullYear(), start.getMonth(), 1));
      }
      setIsFormOpen(false);
      setSelectedVacation(null);
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
    if (!selectedVacation) return;
    const ok = window.confirm('정말 이 휴가 일정을 삭제할까요?');
    if (!ok) return;
    try {
      const res = await deleteVacation(selectedVacation.id);
      if (!res.ok) throw res.error;
      toast.success('휴가 일정이 삭제되었습니다.');
      setIsFormOpen(false);
      setSelectedVacation(null);
      setFormMode('create');
    } catch (error) {
      console.error(error);
      toast.error('삭제 중 문제가 발생했습니다.');
    }
  };

  const sortedVacations = useMemo(
    () =>
      [...vacations].sort((a, b) => {
        if (a.startDate === b.startDate) return (a.userName || '').localeCompare(b.userName || '');
        return a.startDate.localeCompare(b.startDate);
      }),
    [vacations]
  );

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
    return <UnauthorizedScreen email={user.email || user.uid} onLogout={handleLogout} />;
  }

  const canDelete = !!user && selectedVacation?.userId === user.uid;

  return (
    <div className="flex flex-col h-screen bg-gray-100 px-0 sm:px-2 md:px-4 lg:px-8">
      <Toaster position="top-center" richColors closeButton />
      <div className="flex flex-col h-full w-full max-w-full sm:max-w-3xl md:max-w-5xl lg:max-w-7xl mx-auto bg-gray-100 md:bg-gray-50 md:rounded-2xl md:shadow-2xl overflow-hidden relative my-2">
        <header className="bg-white text-gray-800 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <div className="bg-orange-500/90 text-white w-11 h-11 rounded-lg flex items-center justify-center">
              <CalendarDays />
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg md:text-xl">부서원 휴가 달력</h1>
              <p className="text-xs text-gray-500 hidden sm:block">휴가 일정 캘린더</p>
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
          <VacationCalendar
            currentMonth={currentMonth}
            vacations={sortedVacations}
            onChangeMonth={changeMonth}
            onSelectEvent={openVacation}
            onAdd={openCreateForm}
          />
        </main>
      </div>

      <VacationForm
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
