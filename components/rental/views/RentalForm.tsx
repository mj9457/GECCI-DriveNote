'use client';

import {
  X,
  Trash2,
  CalendarRange,
  User,
  Building2,
  Phone,
  Clock,
  Ticket,
  Briefcase,
} from 'lucide-react';
import {
  RentalFormState,
  RentalFacility,
  RentalMemberType,
  RentalTimeOption,
} from '@/types/rental';

type Props = {
  open: boolean;
  mode: 'create' | 'edit' | 'view';
  form: RentalFormState;
  onChange: (next: RentalFormState) => void;
  onSubmit: () => void;
  onClose: () => void;
  onDelete?: () => void;
  isSubmitting?: boolean;
  canDelete?: boolean;
};

const TIME_OPTIONS: { value: RentalTimeOption; label: string }[] = [
  { value: 'full_day', label: '전일(10:00~18:00)' },
  { value: 'basic', label: '기본(4시간이내)' },
];

const FACILITY_OPTIONS: { value: RentalFacility; label: string }[] = [
  { value: 'none', label: '사용안함' },
  { value: 'screen_tv', label: '전자스크린TV' },
  { value: 'laptop', label: '노트북' },
  { value: 'hvac', label: '냉난방시설' },
  { value: 'audio', label: '음향장비' },
  { value: 'geumgang_parking', label: '금강아파트 주차장' },
];

const MEMBER_OPTIONS: { value: RentalMemberType; label: string }[] = [
  { value: 'member', label: '회원사/유관단체(무료)' },
  { value: 'non_member', label: '비회원사(유료)' },
];

const toggleFacility = (current: RentalFacility[], next: RentalFacility): RentalFacility[] => {
  if (next === 'none') {
    const noneValue: RentalFacility = 'none';
    return current.includes('none') ? [] : [noneValue];
  }
  const withoutNone = current.filter((item) => item !== 'none');
  if (withoutNone.includes(next)) {
    return withoutNone.filter((item) => item !== next);
  }
  return [...withoutNone, next];
};

export function RentalForm({
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
      ? '교육장 대관 등록'
      : mode === 'edit'
        ? '교육장 대관 수정'
        : '교육장 대관 보기';

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center p-4">
        <div className="w-full sm:max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
          <div className="px-4 sm:px-6 py-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-cyan-500/90 text-white p-2 rounded-lg">
                <CalendarRange className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm sm:text-base font-bold text-gray-900">{title}</div>
                <div className="text-xs text-gray-500">
                  {isReadOnly ? '대관 정보를 확인하세요.' : '대관 정보를 입력하고 저장하세요.'}
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
                <span className="text-xs sm:text-sm font-semibold text-gray-700">사업자번호 *</span>
                <div className="relative">
                  <Ticket className="absolute left-3 top-3 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={form.businessNumber}
                    disabled={isReadOnly}
                    onChange={(e) => onChange({ ...form, businessNumber: e.target.value })}
                    className="w-full h-10 rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none disabled:bg-gray-50"
                    placeholder="000-00-00000"
                  />
                </div>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">업체명 *</span>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={form.companyName}
                    disabled={isReadOnly}
                    onChange={(e) => onChange({ ...form, companyName: e.target.value })}
                    className="w-full h-10 rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none disabled:bg-gray-50"
                    placeholder="업체명을 입력하세요"
                  />
                </div>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">신청자명 *</span>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={form.applicantName}
                    disabled={isReadOnly}
                    onChange={(e) => onChange({ ...form, applicantName: e.target.value })}
                    className="w-full h-10 rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none disabled:bg-gray-50"
                    placeholder="신청자명을 입력하세요"
                  />
                </div>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">휴대폰번호 *</span>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-gray-400" size={16} />
                  <input
                    type="tel"
                    value={form.phone}
                    disabled={isReadOnly}
                    onChange={(e) => onChange({ ...form, phone: e.target.value })}
                    className="w-full h-10 rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none disabled:bg-gray-50"
                    placeholder="010-0000-0000"
                  />
                </div>
              </label>

              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">행사명 *</span>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={form.eventName}
                    disabled={isReadOnly}
                    onChange={(e) => onChange({ ...form, eventName: e.target.value })}
                    className="w-full h-10 rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none disabled:bg-gray-50"
                    placeholder="행사명을 입력하세요"
                  />
                </div>
              </label>

              <div className="flex flex-col gap-2 md:col-span-2">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">
                  대관일/시간 *
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] text-gray-500">대관일</span>
                    <input
                      type="date"
                      value={form.rentalDate}
                      disabled={isReadOnly}
                      onChange={(e) => onChange({ ...form, rentalDate: e.target.value })}
                      className="h-10 rounded-lg border border-gray-300 px-3 text-sm bg-white focus:ring-2 focus:ring-cyan-500 outline-none disabled:bg-gray-50"
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
                        className="w-full h-10 rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none disabled:bg-gray-50"
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
                        className="w-full h-10 rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none disabled:bg-gray-50"
                      />
                    </div>
                  </label>
                </div>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">시간 *</span>
                <select
                  value={form.timeOption}
                  disabled={isReadOnly}
                  onChange={(e) =>
                    onChange({ ...form, timeOption: e.target.value as RentalTimeOption })
                  }
                  className="h-10 rounded-lg border border-gray-300 px-3 text-sm bg-white focus:ring-2 focus:ring-cyan-500 outline-none disabled:bg-gray-50"
                >
                  {TIME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">
                  회원사 구분 *
                </span>
                <select
                  value={form.memberType}
                  disabled={isReadOnly}
                  onChange={(e) =>
                    onChange({ ...form, memberType: e.target.value as RentalMemberType })
                  }
                  className="h-10 rounded-lg border border-gray-300 px-3 text-sm bg-white focus:ring-2 focus:ring-cyan-500 outline-none disabled:bg-gray-50"
                >
                  {MEMBER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-col gap-2 md:col-span-2">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">부대시설 *</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FACILITY_OPTIONS.map((facility) => {
                    const checked = form.facilities.includes(facility.value);
                    const disabled =
                      isReadOnly || (facility.value !== 'none' && form.facilities.includes('none'));
                    return (
                      <label
                        key={facility.value}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs sm:text-sm ${
                          checked ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-gray-200'
                        } ${disabled ? 'opacity-60' : 'cursor-pointer'}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() =>
                            onChange({
                              ...form,
                              facilities: toggleFacility(form.facilities, facility.value),
                            })
                          }
                        />
                        {facility.label}
                      </label>
                    );
                  })}
                </div>
              </div>
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
                  className="px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-semibold hover:bg-cyan-700 disabled:opacity-60"
                >
                  {isSubmitting ? '저장 중..' : mode === 'edit' ? '수정하기' : '등록하기'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RentalForm;
