'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner';
import { UserStar, LogOut, Plus, User as UserIcon } from 'lucide-react';

import { LoginScreen } from '@/components/vehicle/auth/LoginScreen';
import { UnauthorizedScreen } from '@/components/vehicle/auth/UnauthorizedScreen';
import HeaderMenu from '@/components/shared/HeaderMenu';
import { useVacationAuth } from '@/components/vacation/hooks/useVacationAuth';
import { useRealtimeChairmanSchedules } from '@/components/chairman/hooks/useRealtimeChairmanSchedules';
import { useChairmanActions } from '@/components/chairman/hooks/useChairmanActions';
import ChairmanCalendar from '@/components/chairman/views/ChairmanCalendar';
import ChairmanTable from '@/components/chairman/views/ChairmanTable';
import ChairmanForm from '@/components/chairman/views/ChairmanForm';
import { ChairmanFormState, ChairmanSchedule } from '@/types/chairman';

const toDateValue = (d: Date) => d.toISOString().slice(0, 10);

export default function ChairmanApp() {
  const router = useRouter();
  const { user, isApproved, loading, loginError, handleLogin, handleLogout } = useVacationAuth();
  const { schedules } = useRealtimeChairmanSchedules(user, isApproved);
  const { saveSchedule, deleteSchedule } = useChairmanActions();

  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedSchedule, setSelectedSchedule] = useState<ChairmanSchedule | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<ChairmanFormState>(() => ({
    scheduleType: 'chairman',
    title: '',
    startDate: toDateValue(new Date()),
    endDate: toDateValue(new Date()),
    startTime: '09:00',
    endTime: '18:00',
    location: '',
    note: '',
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
    setSelectedSchedule(null);
    const today = new Date();
    setForm({
      scheduleType: 'chairman',
      title: '',
      startDate: toDateValue(today),
      endDate: toDateValue(today),
      startTime: '09:00',
      endTime: '18:00',
      location: '',
      note: '',
    });
    setIsFormOpen(true);
  };

  const openSchedule = (schedule: ChairmanSchedule) => {
    setSelectedSchedule(schedule);
    const startDate = schedule.startDate || schedule.scheduleDate || toDateValue(new Date());
    const endDate = schedule.endDate || schedule.startDate || schedule.scheduleDate || startDate;
    setForm({
      scheduleType: schedule.scheduleType,
      title: schedule.title || '',
      startDate,
      endDate,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      location: schedule.location || '',
      note: schedule.note || '',
    });

    const canEdit = !!user && schedule.userId === user.uid;
    setFormMode(canEdit ? 'edit' : 'view');
    const [y, m] = startDate.split('-').map(Number);
    if (y && m) setCurrentMonth(new Date(y, m - 1, 1));
    setIsFormOpen(true);
  };

  const validateForm = () => {
    if (
      !form.title.trim() ||
      !form.startDate ||
      !form.endDate ||
      !form.startTime ||
      !form.endTime
    ) {
      toast.error('필수 항목을 모두 입력하세요.', {
        description: '일정명, 일정 기간, 시작/종료 시간은 필수입니다.',
      });
      return false;
    }

    const start = new Date(`${form.startDate}T${form.startTime}`);
    const end = new Date(`${form.endDate}T${form.endTime}`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast.error('날짜/시간 형식이 올바르지 않습니다.');
      return false;
    }
    if (end < start) {
      toast.error('종료 날짜/시간이 시작 날짜/시간보다 빠를 수 없습니다.');
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
        const res = await saveSchedule('create', {
          data: {
            ...form,
            userId: user.uid,
            createdAt: new Date().toISOString(),
          },
        });
        if (!res.ok) throw res.error;
        toast.success('일정이 등록되었습니다.');
      } else if (formMode === 'edit' && selectedSchedule) {
        const res = await saveSchedule('edit', {
          id: selectedSchedule.id,
          data: {
            ...form,
            userId: selectedSchedule.userId,
            updatedAt: new Date().toISOString(),
          },
        });
        if (!res.ok) throw res.error;
        toast.success('일정이 수정되었습니다.');
      }

      const day = new Date(form.startDate);
      if (!Number.isNaN(day.getTime())) {
        setCurrentMonth(new Date(day.getFullYear(), day.getMonth(), 1));
      }
      setIsFormOpen(false);
      setSelectedSchedule(null);
      setFormMode('create');
    } catch (error) {
      console.error(error);
      toast.error('저장 중 오류가 발생했습니다.', {
        description: '잠시 후 다시 시도해 주세요.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSchedule) return;
    const ok = window.confirm('정말 이 일정을 삭제할까요?');
    if (!ok) return;
    try {
      const res = await deleteSchedule(selectedSchedule.id);
      if (!res.ok) throw res.error;
      toast.success('일정이 삭제되었습니다.');
      setIsFormOpen(false);
      setSelectedSchedule(null);
      setFormMode('create');
    } catch (error) {
      console.error(error);
      toast.error('삭제 중 문제가 발생했습니다.');
    }
  };

  const sortedSchedules = useMemo(
    () =>
      [...schedules].sort((a, b) => {
        const aDate = a.startDate || a.scheduleDate || '';
        const bDate = b.startDate || b.scheduleDate || '';
        if (aDate === bDate) return a.startTime.localeCompare(b.startTime);
        return aDate.localeCompare(bDate);
      }),
    [schedules]
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} error={loginError} />;
  }

  if (!isApproved) {
    return <UnauthorizedScreen email={user.email || user.uid} onLogout={handleLogout} />;
  }

  const canDelete = !!user && selectedSchedule?.userId === user.uid;

  return (
    <div className="flex flex-col h-screen bg-gray-100 px-0 sm:px-2 md:px-4 lg:px-8">
      <Toaster position="top-center" richColors closeButton />
      <div className="flex flex-col h-full w-full max-w-full sm:max-w-3xl md:max-w-5xl lg:max-w-7xl mx-auto bg-gray-100 md:bg-gray-50 md:rounded-2xl md:shadow-2xl overflow-hidden relative my-2">
        <header className="bg-white text-gray-800 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white w-11 h-11 rounded-lg flex items-center justify-center">
              <UserStar />
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg md:text-xl">회장님 수행·행사 일정</h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                달력에서 수행/행사 일정을 관리합니다.
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div className="flex items-center gap-1 sm:gap-2 bg-gray-100 px-1.5 py-1 rounded-full text-[11px] sm:text-xs">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2 py-0.5 rounded-full font-medium cursor-pointer transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                테이블
              </button>
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`px-2 py-0.5 rounded-full font-medium cursor-pointer transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                캘린더
              </button>
            </div>

            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              일정 등록
            </button>
          </div>

          {viewMode === 'table' ? (
            <ChairmanTable schedules={sortedSchedules} onSelectEvent={openSchedule} />
          ) : (
            <ChairmanCalendar
              currentMonth={currentMonth}
              schedules={sortedSchedules}
              onChangeMonth={changeMonth}
              onSelectEvent={openSchedule}
              onAdd={openCreateForm}
              showAddButton={false}
            />
          )}
        </main>
      </div>

      <ChairmanForm
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
