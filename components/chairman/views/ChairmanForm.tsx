'use client';

import { CalendarRange, Clock, FileText, MapPin, Tag, Trash2, X } from 'lucide-react';
import { ChairmanFormState, ChairmanScheduleType } from '@/types/chairman';

type Props = {
  open: boolean;
  mode: 'create' | 'edit' | 'view';
  form: ChairmanFormState;
  onChange: (next: ChairmanFormState) => void;
  onSubmit: () => void;
  onClose: () => void;
  onDelete?: () => void;
  isSubmitting?: boolean;
  canDelete?: boolean;
};

const TYPE_OPTIONS: { value: ChairmanScheduleType; label: string }[] = [
  { value: 'chairman', label: '회장님 수행' },
  { value: 'event', label: '행사 일정' },
];

export function ChairmanForm({
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
    mode === 'create'
      ? '수행/행사 일정 등록'
      : mode === 'edit'
        ? '수행/행사 일정 수정'
        : '수행/행사 일정 보기';

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center p-4">
        <div className="w-full sm:max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
          <div className="px-4 sm:px-6 py-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 text-white p-2 rounded-lg">
                <CalendarRange className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm sm:text-base font-bold text-gray-900">{title}</div>
                <div className="text-xs text-gray-500">
                  {isReadOnly ? '일정 정보를 확인하세요.' : '일정 정보를 입력하고 저장하세요.'}
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
                <span className="text-xs sm:text-sm font-semibold text-gray-700">일정 구분 *</span>
                <div className="relative">
                  <Tag className="absolute left-3 top-3 text-gray-400" size={16} />
                  <select
                    value={form.scheduleType}
                    disabled={isReadOnly}
                    onChange={(e) =>
                      onChange({ ...form, scheduleType: e.target.value as ChairmanScheduleType })
                    }
                    className="w-full h-10 rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50"
                  >
                    {TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">일정명 *</span>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={form.title}
                    disabled={isReadOnly}
                    onChange={(e) => onChange({ ...form, title: e.target.value })}
                    className="w-full h-10 rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50"
                    placeholder="일정명을 입력하세요"
                  />
                </div>
              </label>

              <div className="flex flex-col gap-2 md:col-span-2">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">일정 기간 *</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] text-gray-500">시작일자</span>
                    <input
                      type="date"
                      value={form.startDate}
                      disabled={isReadOnly}
                      onChange={(e) => onChange({ ...form, startDate: e.target.value })}
                      className="h-10 rounded-lg border border-gray-300 px-3 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] text-gray-500">종료일자</span>
                    <input
                      type="date"
                      value={form.endDate}
                      disabled={isReadOnly}
                      onChange={(e) => onChange({ ...form, endDate: e.target.value })}
                      className="h-10 rounded-lg border border-gray-300 px-3 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] text-gray-500">시작시간</span>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 text-gray-400" size={16} />
                      <input
                        type="time"
                        value={form.startTime}
                        disabled={isReadOnly}
                        onChange={(e) => onChange({ ...form, startTime: e.target.value })}
                        className="w-full h-10 rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50"
                      />
                    </div>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] text-gray-500">종료시간</span>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 text-gray-400" size={16} />
                      <input
                        type="time"
                        value={form.endTime}
                        disabled={isReadOnly}
                        onChange={(e) => onChange({ ...form, endTime: e.target.value })}
                        className="w-full h-10 rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50"
                      />
                    </div>
                  </label>
                </div>
              </div>

              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">장소</span>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={form.location}
                    disabled={isReadOnly}
                    onChange={(e) => onChange({ ...form, location: e.target.value })}
                    className="w-full h-10 rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50"
                    placeholder="장소를 입력하세요"
                  />
                </div>
              </label>

              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">메모</span>
                <textarea
                  value={form.note}
                  disabled={isReadOnly}
                  onChange={(e) => onChange({ ...form, note: e.target.value })}
                  className="min-h-24 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50"
                  placeholder="필요한 메모를 입력하세요"
                />
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
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
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

export default ChairmanForm;
