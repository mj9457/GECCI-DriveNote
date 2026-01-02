'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Toaster, toast } from 'sonner';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock4,
  House,
  LogOut,
  Trash2,
  User as UserIcon,
  X,
} from 'lucide-react';

import { normalizeTimeInput } from '@/lib/timeUtils';
import { diffMinutes, formatMinutes, toDateInputValue, toMonthKey } from '@/lib/overtimeUtils';
import { LoginScreen } from '@/components/vehicle/auth/LoginScreen';
import { UnauthorizedScreen } from '@/components/vehicle/auth/UnauthorizedScreen';
import { useOvertimeAuth } from '@/components/overtime/hooks/useOvertimeAuth';
import { useRealtimeOvertimeApplications } from '@/components/overtime/hooks/useRealtimeOvertimeApplications';
import { useOvertimeActions } from '@/components/overtime/hooks/useOvertimeActions';
import FAB from '@/components/vehicle/layout/FAB';

export default function OvertimeApp() {
  const { user, isApproved, loading, loginError, canApprove, handleLogin, handleLogout } =
    useOvertimeAuth();

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const monthKey = useMemo(() => toMonthKey(currentDate), [currentDate]);

  const { items } = useRealtimeOvertimeApplications(monthKey, !!user && isApproved);
  const {
    createApplication,
    updateApplication,
    deleteApplication,
    setEApprovalChecked,
    toggleApproval,
    setAccountingSubstituteLeave,
  } = useOvertimeActions();

  const [viewMode, setViewMode] = useState<'all' | 'dept' | 'accounting'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingApplicantEmail, setEditingApplicantEmail] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    applicationDate: toDateInputValue(new Date()),
    startTime: '18:00',
    endTime: '20:00',
    applicantName: '',
    department: '',
    workDetails: '',
    eApprovalChecked: false,
  });

  const resetToCreateForm = () => {
    setFormMode('create');
    setEditingId(null);
    setForm({
      applicationDate: toDateInputValue(new Date()),
      startTime: '18:00',
      endTime: '20:00',
      applicantName: user?.displayName || user?.email || '',
      department: user?.department || '',
      workDetails: '',
      eApprovalChecked: false,
    });
  };

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      applicantName: prev.applicantName || user.displayName || user.email || '',
      department: prev.department || user.department || '',
    }));
  }, [user]);

  const computedMinutes = useMemo(() => {
    const start = normalizeTimeInput(form.startTime);
    const end = normalizeTimeInput(form.endTime);
    if (!start || !end) return null;
    return diffMinutes(start, end);
  }, [form.startTime, form.endTime]);

  const canManageDeptRow = (department: string) => {
    if (!user) return false;
    const isSameDept = !!department && !!user.department && department === user.department;
    return isSameDept || user.role === 'admin';
  };

  const visibleItems = useMemo(() => {
    if (!user) return items;
    if (viewMode === 'dept') {
      if (user.role === 'admin') return items;
      return items.filter((r) => r.department === user.department);
    }
    return items;
  }, [items, user, viewMode]);

  const changeMonth = (delta: number) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + delta);
    setCurrentDate(d);
  };

  const changeYear = (delta: number) => {
    const d = new Date(currentDate);
    d.setFullYear(d.getFullYear() + delta);
    setCurrentDate(d);
  };

  const onSubmit = async () => {
    if (!user) return;
    if (submitting) return;

    const startTime = normalizeTimeInput(form.startTime);
    const endTime = normalizeTimeInput(form.endTime);

    if (!form.applicationDate) {
      toast.error('신청날짜를 입력해 주세요.');
      return;
    }
    if (!startTime || !endTime) {
      toast.error('시작/종료시간 형식이 올바르지 않습니다.', {
        description: '예: 18:00, 1800, 18-00',
      });
      return;
    }

    const minutes = diffMinutes(startTime, endTime);
    if (minutes <= 0) {
      toast.error('종료시간은 시작시간보다 늦어야 합니다.');
      return;
    }

    if (!form.applicantName.trim() || !form.department.trim() || !form.workDetails.trim()) {
      toast.error('필수 항목을 입력해 주세요.', {
        description: '신청자, 부서, 근로내용은 필수입니다.',
      });
      return;
    }

    const derivedMonthKey = form.applicationDate.slice(0, 7);

    if (formMode === 'view') {
      toast.error('수정 권한이 없습니다.');
      return;
    }

    if (formMode === 'edit') {
      const canEdit =
        user.role === 'admin' ||
        (!!editingApplicantEmail && !!user.email && editingApplicantEmail === user.email);
      if (!canEdit) {
        toast.error('수정 권한이 없습니다.');
        return;
      }
      if (!editingId) {
        toast.error('수정 대상이 없습니다.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (formMode === 'create') {
        await createApplication({
          monthKey: derivedMonthKey,
          applicationDate: form.applicationDate,
          startTime,
          endTime,
          minutes,
          applicantName: form.applicantName.trim(),
          applicantEmail: user.email,
          department: form.department.trim(),
          workDetails: form.workDetails.trim(),
          eApprovalChecked: !!form.eApprovalChecked,
        });
        toast.success('연장근로 신청이 등록되었습니다.');

        resetToCreateForm();
        const [y, m] = derivedMonthKey.split('-').map(Number);
        setCurrentDate(new Date(y, (m || 1) - 1, 1));
        setIsFormOpen(false);
        return;
      }

      if (formMode === 'edit' && editingId) {
        await updateApplication(editingId, {
          monthKey: derivedMonthKey,
          applicationDate: form.applicationDate,
          startTime,
          endTime,
          minutes,
          applicantName: form.applicantName.trim(),
          applicantEmail: editingApplicantEmail || user.email,
          department: form.department.trim(),
          workDetails: form.workDetails.trim(),
          eApprovalChecked: !!form.eApprovalChecked,
        });
        toast.success('수정되었습니다.');
        const [y, m] = derivedMonthKey.split('-').map(Number);
        setCurrentDate(new Date(y, (m || 1) - 1, 1));
        setIsFormOpen(false);
      }
    } catch (e) {
      console.error(e);
      toast.error('저장에 실패했습니다.', { description: '잠시 후 다시 시도해 주세요.' });
    } finally {
      setSubmitting(false);
    }
  };

  const onToggle = async (
    id: string,
    field: 'teamLeadChecked' | 'deptHeadChecked',
    value: boolean
  ) => {
    if (!user) return;
    try {
      await toggleApproval(id, field, value, {
        email: user.email,
        name: user.overtimeApproverName,
      });
    } catch (e) {
      console.error(e);
      toast.error('체크 처리에 실패했습니다.');
    }
  };

  const onDelete = async (id: string) => {
    const ok = window.confirm('정말 이 연장근로 신청을 삭제하시겠습니까?');
    if (!ok) return;

    try {
      await deleteApplication(id);
      toast.success('삭제되었습니다.');
    } catch (e) {
      console.error(e);
      toast.error('삭제에 실패했습니다.');
    }
  };

  const onToggleEApproval = async (id: string, value: boolean) => {
    if (!user) return;
    try {
      await setEApprovalChecked(id, value, { email: user.email });
    } catch (e) {
      console.error(e);
      toast.error('전자품의 체크 처리에 실패했습니다.');
    }
  };

  const onUpdateSubLeaveNote = async (id: string, note: string) => {
    if (!user) return;
    try {
      await setAccountingSubstituteLeave(id, note, { email: user.email });
    } catch (e) {
      console.error(e);
      toast.error('대체휴무 메모 저장에 실패했습니다.');
    }
  };

  const openCreateModal = () => {
    resetToCreateForm();
    setFormMode('create');
    setEditingId(null);
    setEditingApplicantEmail(undefined);
    setIsFormOpen(true);
  };

  const openRowModal = (row: {
    id: string;
    applicationDate: string;
    startTime: string;
    endTime: string;
    applicantName: string;
    applicantEmail?: string;
    department: string;
    workDetails: string;
    eApprovalChecked?: boolean;
    eApproval?: unknown;
  }) => {
    if (!user) return;

    const compatChecked =
      typeof row.eApprovalChecked === 'boolean'
        ? row.eApprovalChecked
        : typeof row.eApproval === 'string'
          ? row.eApproval.trim().length > 0
          : !!row.eApproval;

    const canEdit =
      user.role === 'admin' ||
      (!!row.applicantEmail && !!user.email && row.applicantEmail === user.email);

    setFormMode(canEdit ? 'edit' : 'view');
    setEditingId(row.id);
    setEditingApplicantEmail(row.applicantEmail);

    setForm({
      applicationDate: row.applicationDate,
      startTime: row.startTime,
      endTime: row.endTime,
      applicantName: row.applicantName,
      department: row.department,
      workDetails: row.workDetails,
      eApprovalChecked: compatChecked,
    });

    setIsFormOpen(true);
  };

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

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const isThisMonth = toMonthKey(new Date()) === monthKey;
  const isReadOnly = formMode === 'view';
  const approvalBadges = [
    {
      label: '팀장',
      active: canApprove.teamLead,
      activeClass: 'bg-blue-50 border-blue-200 text-blue-700',
    },
    {
      label: '부장',
      active: canApprove.deptHead,
      activeClass: 'bg-amber-50 border-amber-200 text-amber-700',
    },
    {
      label: '회계',
      active: canApprove.accounting,
      activeClass: 'bg-purple-50 border-purple-200 text-purple-700',
    },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-100 px-0 sm:px-2 md:px-4 lg:px-8">
      <Toaster position="top-center" richColors closeButton />

      <div className="flex flex-col h-full w-full max-w-full sm:max-w-3xl md:max-w-5xl lg:max-w-7xl mx-auto bg-gray-100 md:bg-gray-50 md:rounded-2xl md:shadow-2xl overflow-hidden relative my-0 sm:my-4 md:my-6">
        <header
          className="
            bg-white text-gray-800
            px-3 sm:px-4 md:px-6 py-3 sm:py-4
            flex flex-wrap items-center justify-between
            min-[721px]:flex-nowrap
            z-30 shadow-sm relative
          "
        >
          <div className="flex items-center gap-1.5 sm:gap-2 order-1">
            <div className="bg-emerald-600 p-1.5 sm:p-2 rounded-lg text-white">
              <Clock4 size={18} className="sm:w-5 sm:h-5" />
            </div>
            <h1 className="font-bold text-base sm:text-lg md:text-xl">연장근로 신청</h1>
            <span className="ml-1 sm:ml-2 inline-flex items-center rounded-full border border-gray-300 bg-white px-2 py-0.5 text-[11px] sm:text-xs text-gray-600 tabular-nums">
              {monthKey}
            </span>
          </div>

          <div
            className="
              order-3 w-full flex justify-center mt-3
              min-[721px]:mt-0 min-[721px]:w-auto min-[721px]:order-0
              min-[721px]:absolute min-[721px]:left-1/2 min-[721px]:-translate-x-1/2
            "
          >
            <div className="flex items-center gap-1 sm:gap-2 bg-gray-100 px-1.5 py-1 rounded-full text-[11px] sm:text-xs">
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`px-2 py-0.5 rounded-full font-medium cursor-pointer transition-colors ${
                  viewMode === 'all'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                전체
              </button>
              <button
                type="button"
                onClick={() => setViewMode('dept')}
                className={`px-2 py-0.5 rounded-full font-medium cursor-pointer transition-colors ${
                  viewMode === 'dept'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                부서장
              </button>
              <button
                type="button"
                onClick={() => setViewMode('accounting')}
                className={`px-2 py-0.5 rounded-full font-medium cursor-pointer transition-colors ${
                  viewMode === 'accounting'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                회계팀
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 order-2">
            <div className="relative group">
              <Link
                href="/"
                className="flex items-center justify-center text-gray-400 hover:text-blue-500 transition-colors cursor-pointer"
              >
                <House className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>
              <div className="absolute left-1/2 -translate-x-1/2 mt-1 hidden group-hover:block whitespace-nowrap bg-gray-800 text-white text-[14px] px-2 py-1 rounded-md shadow-lg z-50">
                홈
              </div>
            </div>

            <div className="relative flex items-center">
              <div
                className="
                  inline-flex items-center
                  gap-0 min-[721px]:gap-2
                  text-xs sm:text-sm
                  bg-gray-50
                  px-2 min-[721px]:px-3 py-1.5
                  rounded-full border border-gray-300
                  min-[721px]:max-w-[220px]
                  cursor-default
                "
              >
                <UserIcon className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700 truncate hidden min-[721px]:block">
                  {user.displayName || user.email || user.uid}
                  {user.department ? ` · ${user.department}` : ''}
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

        <section className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-300 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changeYear(-1)}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full"
                  aria-label="이전 연도"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="text-sm sm:text-base font-semibold text-gray-900 tabular-nums">
                  {year}년
                </div>
                <button
                  onClick={() => changeYear(1)}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full"
                  aria-label="다음 연도"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                <div className="w-px h-6 bg-gray-200 mx-1" />

                <button
                  onClick={() => changeMonth(-1)}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full"
                  aria-label="이전 월"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="text-sm sm:text-base font-semibold text-gray-900 tabular-nums">
                  {month}월
                </div>
                <button
                  onClick={() => changeMonth(1)}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full"
                  aria-label="다음 월"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {!isThisMonth && (
                <button
                  type="button"
                  onClick={() => setCurrentDate(new Date())}
                  className="px-2 sm:px-3 py-1 text-[11px] sm:text-xs border border-gray-300 rounded-full bg-white text-gray-700 hover:bg-emerald-50 hover:border-emerald-400"
                >
                  이번 달
                </button>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3">
              <div className="flex items-center gap-1 sm:gap-2">
                {approvalBadges.some((b) => b.active) ? (
                  approvalBadges.map((b) => (
                    <span
                      key={b.label}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] sm:text-xs border ${
                        b.active ? b.activeClass : 'bg-gray-100 border-gray-200 text-gray-400'
                      }`}
                    >
                      {b.label}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] sm:text-xs text-gray-500">승인 권한 없음</span>
                )}
              </div>
              <div className="text-[11px] sm:text-xs text-gray-600">
                현재 {visibleItems.length}건
              </div>
            </div>
          </div>
        </section>

        <section className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
          <div className="bg-white md:rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-gray-300 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">
                {year}년 {month}월 신청 목록
              </div>
              <div className="text-sm text-gray-600 tabular-nums">
                총 <span className="text-red-600">{visibleItems.length}</span>건
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full text-sm">
                <thead className="text-gray-700">
                  <tr className="border-b bg-green-100 border-gray-300">
                    <th
                      colSpan={9}
                      className="px-3 py-2 text-center font-semibold border-r-2 border-gray-200"
                    >
                      신청자 작성
                    </th>
                    <th
                      colSpan={3}
                      className="px-3 py-2 text-center font-semibold border-r-2 border-gray-200"
                    >
                      부서장 확인
                    </th>
                    <th colSpan={1} className="px-3 py-2 text-center font-semibold">
                      회계팀 확인
                    </th>
                  </tr>
                  <tr className="border-b border-gray-300 bg-gray-50 text-xs">
                    <th className="px-3 py-2 text-center">신청날짜</th>
                    <th className="px-3 py-2 text-center">시작시간</th>
                    <th className="px-3 py-2 text-center">종료시간</th>
                    <th className="px-3 py-2 text-center">시간</th>
                    <th className="px-3 py-2 text-center">신청자</th>
                    <th className="px-3 py-2 text-center">부서</th>
                    <th className="px-3 py-2 text-center">근로내용</th>
                    <th className="px-3 py-2 text-center">전자품의</th>
                    <th className="px-3 py-2 text-center border-r-2 border-gray-200">삭제</th>
                    <th className="px-3 py-2 text-center">이름</th>
                    <th className="px-3 py-2 text-center">팀장</th>
                    <th className="px-3 py-2 text-center border-r-2 border-gray-200">부장</th>
                    <th className="px-3 py-2 text-center">대체휴무 사용</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {viewMode === 'dept' &&
                  !(canApprove.teamLead || canApprove.deptHead || user.role === 'admin') ? (
                    <tr>
                      <td colSpan={12} className="px-4 py-10 text-center text-gray-500">
                        부서장 확인 권한이 없습니다.
                      </td>
                    </tr>
                  ) : viewMode === 'accounting' &&
                    !(canApprove.accounting || user.role === 'admin') ? (
                    <tr>
                      <td colSpan={12} className="px-4 py-10 text-center text-gray-500">
                        회계팀 확인 권한이 없습니다.
                      </td>
                    </tr>
                  ) : visibleItems.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-4 py-10 text-center text-gray-500">
                        해당 월의 신청 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    visibleItems.map((row) => {
                      const deptGate = canManageDeptRow(row.department);
                      const canTeamLead = deptGate && canApprove.teamLead;
                      const canDeptHead = deptGate && canApprove.deptHead;
                      const canAccounting = canApprove.accounting || user.role === 'admin';
                      const canDelete =
                        user.role === 'admin' ||
                        (!!row.applicantEmail && !!user.email && row.applicantEmail === user.email);
                      const rowCompat = row as unknown as {
                        eApprovalChecked?: boolean;
                        eApproval?: unknown;
                        substituteLeaveNote?: string;
                      };
                      const eApprovalChecked =
                        typeof rowCompat.eApprovalChecked === 'boolean'
                          ? rowCompat.eApprovalChecked
                          : typeof rowCompat.eApproval === 'string'
                            ? rowCompat.eApproval.trim().length > 0
                            : !!rowCompat.eApproval;

                      return (
                        <tr
                          key={row.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() =>
                            openRowModal({
                              id: row.id,
                              applicationDate: row.applicationDate,
                              startTime: row.startTime,
                              endTime: row.endTime,
                              applicantName: row.applicantName,
                              applicantEmail: row.applicantEmail,
                              department: row.department,
                              workDetails: row.workDetails,
                              eApprovalChecked: rowCompat.eApprovalChecked,
                              eApproval: rowCompat.eApproval,
                            })
                          }
                        >
                          <td className="px-3 py-2 whitespace-nowrap tabular-nums text-center">
                            {row.applicationDate}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap tabular-nums text-center">
                            {row.startTime}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap tabular-nums text-center">
                            {row.endTime}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-center">
                            <span className="inline-flex items-center rounded-full bg-red-300 px-2 py-0.5 text-xs text-gray-900">
                              {formatMinutes(row.minutes)}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-center">
                            {row.applicantName}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-center">
                            {row.department}
                          </td>
                          <td className="px-3 py-2 min-w-[140px] text-center">
                            <div
                              className="max-w-[360px] truncate text-gray-800"
                              title={row.workDetails}
                            >
                              {row.workDetails}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <label
                                className="inline-flex items-center gap-2 text-xs text-gray-700"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  checked={eApprovalChecked}
                                  disabled={!canDelete}
                                  onChange={(e) => onToggleEApproval(row.id, e.target.checked)}
                                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-60"
                                />
                                {/* <span className="hidden lg:inline">
                                  {eApprovalChecked ? '완료' : '미완료'}
                                </span> */}
                              </label>
                            </div>
                          </td>
                          <td className="px-3 py-2 border-r-2 border-gray-100 text-center">
                            {canDelete && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(row.id);
                                }}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
                                aria-label="삭제"
                                title="삭제"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-center">
                            {row.approverName || '-'}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              disabled={!canTeamLead}
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggle(row.id, 'teamLeadChecked', !row.teamLeadChecked);
                              }}
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
                                row.teamLeadChecked
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'bg-white border-gray-300'
                              } ${
                                canTeamLead
                                  ? 'hover:bg-emerald-50 hover:border-emerald-300'
                                  : 'opacity-50 cursor-not-allowed'
                              }`}
                              aria-label="팀장 확인"
                              title={
                                canTeamLead
                                  ? '팀장 확인 체크'
                                  : '해당 부서 팀장 권한이 있어야 합니다.'
                              }
                            >
                              {row.teamLeadChecked ? <Check className="w-4 h-4" /> : null}
                            </button>
                          </td>
                          <td className="px-3 py-2 text-center border-r-2 border-gray-100">
                            <button
                              type="button"
                              disabled={!canDeptHead}
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggle(row.id, 'deptHeadChecked', !row.deptHeadChecked);
                              }}
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
                                row.deptHeadChecked
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'bg-white border-gray-300'
                              } ${
                                canDeptHead
                                  ? 'hover:bg-emerald-50 hover:border-emerald-300'
                                  : 'opacity-50 cursor-not-allowed'
                              }`}
                              aria-label="부장 확인"
                              title={
                                canDeptHead
                                  ? '부장 확인 체크'
                                  : '해당 부서 부장 권한이 있어야 합니다.'
                              }
                            >
                              {row.deptHeadChecked ? <Check className="w-4 h-4" /> : null}
                            </button>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <div className="flex items-center justify-center">
                              <input
                                type="text"
                                defaultValue={rowCompat.substituteLeaveNote || ''}
                                disabled={!canAccounting}
                                onClick={(e) => e.stopPropagation()}
                                onBlur={(e) => onUpdateSubLeaveNote(row.id, e.target.value)}
                                className={`w-full rounded-lg border px-2 py-1 text-xs sm:text-sm text-center ${
                                  canAccounting
                                    ? 'border-gray-300 focus:ring-2 focus:ring-emerald-500'
                                    : 'border-gray-200 bg-gray-50 text-gray-500'
                                }`}
                                placeholder="예시) 11월 28일 대휴(4시간) 사용"
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-gray-300 text-xs text-gray-500">
              권한 관련 문의는 박민준 사원(내선 305)에게 해주시기 바랍니다.
            </div>
          </div>
        </section>

        <FAB visible={viewMode === 'all' && !isFormOpen} onClick={openCreateModal} />
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsFormOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center p-0 sm:p-4">
            <div className="w-full sm:max-w-4xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
              <div className="px-4 sm:px-6 py-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-600 p-2 rounded-lg text-white">
                    <Clock4 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm sm:text-base font-bold text-gray-900">
                      {formMode === 'create'
                        ? '연장근로 신청서'
                        : formMode === 'edit'
                          ? '연장근로 신청 수정'
                          : '연장근로 신청 상세'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formMode === 'view'
                        ? '신청 정보를 확인할 수 있습니다.'
                        : '신청 정보를 입력 후 저장하세요.'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
                  aria-label="닫기"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-4 sm:px-6 py-4 sm:py-6 overflow-auto">
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 sm:p-5">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
                    <label className="flex flex-col gap-1">
                      <span className="text-xs sm:text-sm font-bold text-gray-700">신청날짜 *</span>
                      <input
                        type="date"
                        value={form.applicationDate}
                        disabled={isReadOnly}
                        onChange={(e) => {
                          const v = e.target.value;
                          setForm((prev) => ({ ...prev, applicationDate: v }));
                          if (v && v.length >= 7) {
                            const [y, m] = v.slice(0, 7).split('-').map(Number);
                            if (y && m) setCurrentDate(new Date(y, m - 1, 1));
                          }
                        }}
                        className="h-10 rounded-lg border border-gray-300 px-3 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-xs sm:text-sm font-bold text-gray-700">시작시간 *</span>
                      <input
                        value={form.startTime}
                        disabled={isReadOnly}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, startTime: e.target.value }))
                        }
                        onBlur={(e) => {
                          const normalized = normalizeTimeInput(e.target.value);
                          if (normalized) {
                            setForm((prev) => ({ ...prev, startTime: normalized }));
                          } else if (e.target.value.trim() !== '') {
                            toast.error('시작시간 형식이 올바르지 않습니다.', {
                              description: '예: 18:00, 1800, 18-00',
                            });
                          }
                        }}
                        placeholder="18:00"
                        className="h-10 rounded-lg border border-gray-300 px-3 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-xs sm:text-sm font-bold text-gray-700">종료시간 *</span>
                      <input
                        value={form.endTime}
                        disabled={isReadOnly}
                        onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
                        onBlur={(e) => {
                          const normalized = normalizeTimeInput(e.target.value);
                          if (normalized) {
                            setForm((prev) => ({ ...prev, endTime: normalized }));
                          } else if (e.target.value.trim() !== '') {
                            toast.error('종료시간 형식이 올바르지 않습니다.', {
                              description: '예: 20:00, 2000, 20-00',
                            });
                          }
                        }}
                        placeholder="20:00"
                        className="h-10 rounded-lg border border-gray-300 px-3 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-xs sm:text-sm font-bold text-gray-700">시간</span>
                      <input
                        value={computedMinutes == null ? '' : formatMinutes(computedMinutes)}
                        readOnly
                        className="h-10 rounded-lg border border-gray-300 px-3 text-sm bg-white"
                        placeholder="자동 계산"
                      />
                    </label>

                    <label className="flex flex-col gap-1 md:col-span-2">
                      <span className="text-xs sm:text-sm font-bold text-gray-700">신청자 *</span>
                      <input
                        value={form.applicantName}
                        disabled={isReadOnly}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, applicantName: e.target.value }))
                        }
                        className="h-10 rounded-lg border border-gray-300 px-3 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </label>

                    <label className="flex flex-col gap-1 md:col-span-2">
                      <span className="text-xs sm:text-sm font-bold text-gray-700">부서 *</span>
                      <input
                        value={form.department}
                        disabled={isReadOnly}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, department: e.target.value }))
                        }
                        className="h-10 rounded-lg border border-gray-300 px-3 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </label>

                    <label className="flex flex-col gap-1 md:col-span-4">
                      <span className="text-xs sm:text-sm font-bold text-gray-700">근로내용 *</span>
                      <textarea
                        value={form.workDetails}
                        disabled={isReadOnly}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, workDetails: e.target.value }))
                        }
                        className="min-h-28 rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="예) 행사 지원, 문서 정리, 업무 마감 처리 등"
                      />
                    </label>

                    <label className="flex flex-col gap-1 md:col-span-4">
                      <span className="text-xs sm:text-sm font-bold text-gray-700">전자품의</span>
                      <label className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={form.eApprovalChecked}
                          disabled={isReadOnly}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, eApprovalChecked: e.target.checked }))
                          }
                          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>전자품의 완료</span>
                      </label>
                    </label>
                  </div>

                  <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      {isReadOnly ? '닫기' : '취소'}
                    </button>

                    {!isReadOnly && (
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={onSubmit}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {submitting
                          ? '저장 중...'
                          : formMode === 'edit'
                            ? '수정 저장'
                            : '신청 등록'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
