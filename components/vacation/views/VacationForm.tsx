'use client';

import { X, Trash2, CalendarRange, User, Building2, StickyNote } from 'lucide-react';
import { VacationFormState, VacationCategory, VacationSubType } from '@/types/vacation';

type Props = {
  open: boolean;
  mode: 'create' | 'edit' | 'view';
  form: VacationFormState;
  onChange: (next: VacationFormState) => void;
  onSubmit: () => void;
  onClose: () => void;
  onDelete?: () => void;
  isSubmitting?: boolean;
  canDelete?: boolean;
};

const CATEGORY_OPTIONS: { value: VacationCategory; label: string }[] = [
  { value: 'annual', label: '연차' },
  { value: 'special', label: '특별휴가' },
  { value: 'leave', label: '휴직' },
  { value: 'sick', label: '병가' },
];

const SUBTYPE_OPTIONS: Record<VacationCategory, { value: VacationSubType; label: string }[]> = {
  annual: [
    { value: 'full', label: '연차' },
    { value: 'half_am', label: '오전반차' },
    { value: 'half_pm', label: '오후반차' },
    { value: 'half_2h', label: '2H 반차' },
  ],
  special: [
    { value: 'special_birth', label: '출산' },
    { value: 'special_general', label: '특별' },
    { value: 'special_foundation_alt', label: '대체휴일(창립기념일)' },
    { value: 'special_health', label: '건강검진' },
    { value: 'special_alt_full', label: '대체휴무(종일)' },
    { value: 'special_alt_4h', label: '대체휴무(4H)' },
    { value: 'special_alt_2h', label: '대체휴무(2H)' },
  ],
  leave: [{ value: 'leave_default', label: '휴직' }],
  sick: [{ value: 'sick_default', label: '병가(무급)' }],
};

export function VacationForm({
  open,
  mode,
  form,
  onChange,
  onSubmit,
  onClose,
  onDelete,
  isSubmitting,
  canDelete,
}: Props) {
  if (!open) return null;
  const isReadOnly = mode === 'view';

  const title =
    mode === 'create' ? '휴가 일정 등록' : mode === 'edit' ? '휴가 일정 수정' : '휴가 일정 보기';
  const subTypeOptions = SUBTYPE_OPTIONS[form.category] || [];

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center p-4">
        <div className="w-full sm:max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
          <div className="px-4 sm:px-6 py-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <CalendarRange className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm sm:text-base font-bold text-gray-900">{title}</div>
                <div className="text-xs text-gray-500">
                  {isReadOnly ? '등록된 정보를 확인하세요.' : '휴가 정보를 입력하고 저장하세요.'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-4 sm:px-6 py-4 sm:py-6 overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">이름 *</span>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={form.userName}
                    disabled={isReadOnly}
                    onChange={(e) => onChange({ ...form, userName: e.target.value })}
                    className="w-full h-10 rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
                    placeholder="홍길동"
                  />
                </div>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">부서 *</span>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={form.department}
                    disabled={isReadOnly}
                    onChange={(e) => onChange({ ...form, department: e.target.value })}
                    className="w-full h-10 rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
                    placeholder="예) 경영지원팀"
                  />
                </div>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">시작일 *</span>
                <input
                  type="date"
                  value={form.startDate}
                  disabled={isReadOnly}
                  onChange={(e) => onChange({ ...form, startDate: e.target.value })}
                  className="h-10 rounded-lg border border-gray-300 px-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">종료일 *</span>
                <input
                  type="date"
                  value={form.endDate}
                  disabled={isReadOnly}
                  onChange={(e) => onChange({ ...form, endDate: e.target.value })}
                  className="h-10 rounded-lg border border-gray-300 px-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">휴가 종류 *</span>
                <select
                  value={form.category}
                  disabled={isReadOnly}
                  onChange={(e) =>
                    onChange({
                      ...form,
                      category: e.target.value as VacationCategory,
                      subType:
                        SUBTYPE_OPTIONS[e.target.value as VacationCategory]?.[0]?.value ??
                        form.subType,
                    })
                  }
                  className="h-10 rounded-lg border border-gray-300 px-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">세부 구분 *</span>
                <select
                  value={form.subType}
                  disabled={isReadOnly}
                  onChange={(e) =>
                    onChange({ ...form, subType: e.target.value as VacationSubType })
                  }
                  className="h-10 rounded-lg border border-gray-300 px-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
                >
                  {subTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">메모</span>
                <div className="relative">
                  <StickyNote className="absolute left-3 top-3 text-gray-400" size={16} />
                  <textarea
                    value={form.note}
                    disabled={isReadOnly}
                    onChange={(e) => onChange({ ...form, note: e.target.value })}
                    className="w-full min-h-28 rounded-xl border border-gray-300 bg-white pl-9 pr-3 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
                    placeholder="팀원 공유용 메모를 남길 수 있어요."
                  />
                </div>
              </label>
            </div>
          </div>

          <div className="px-4 sm:px-6 py-4 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            {mode !== 'create' && onDelete && canDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                일정 삭제
              </button>
            )}

            <div className="flex items-center gap-2 sm:ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-50"
              >
                닫기
              </button>
              {!isReadOnly && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={onSubmit}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                >
                  {isSubmitting ? '저장 중...' : mode === 'edit' ? '수정하기' : '등록하기'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VacationForm;
