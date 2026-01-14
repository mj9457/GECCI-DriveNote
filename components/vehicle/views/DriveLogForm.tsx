// components/vehicle/DriveLogForm.tsx
import { Calendar as CalendarIcon, Car, Clock4, User, MapPin, FileText, X } from 'lucide-react';
import { Booking, LogFormState } from '@/types/vehicle';
import { VEHICLES } from '@/lib/vehicleConstants';
import { formatDate } from '@/lib/timeUtils';

interface DriveLogFormProps {
  booking: Booking;
  logForm: LogFormState;
  prevKm: number | null;
  onChangeLogForm: (form: LogFormState) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export const DriveLogForm: React.FC<DriveLogFormProps> = ({
  booking,
  logForm,
  prevKm,
  onChangeLogForm,
  onSubmit,
  onBack,
}) => {
  const dateStr = booking.date || formatDate(new Date());

  const prevKmDisplay = prevKm != null ? `${prevKm.toLocaleString()} km` : '이전 운행 기록 없음';

  const finalKmNum = Number(logForm.finalKm || 0);
  const distanceKm = prevKm != null && finalKmNum > prevKm ? finalKmNum - prevKm : 0;

  const vehicleLabel = VEHICLES.find((v) => v.id === booking.vehicleId)?.number || '';

  const isCarnival = booking.vehicleId === 'v2';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  // 공통 input 스타일 (밑줄형)
  const underlineInputBase =
    'w-full px-0 py-2.5 sm:py-3 border-0 border-b-2 text-sm sm:text-base outline-none bg-transparent';
  const underlineInput = underlineInputBase + ' border-gray-300 focus:border-blue-500 focus:ring-0';
  const underlineReadOnly = underlineInputBase + ' border-dashed border-gray-300 text-gray-600';

  return (
    <div className="px-3 sm:px-4 md:px-6 py-4 md:py-6 max-w-5xl mx-auto bg-white min-h-full">
      {/* 상단 제목 */}
      <div className="flex items-center justify-between mb-5 sm:mb-7">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">운행일지 작성</h2>
        <button
          type="button"
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
          aria-label="닫기"
          title="닫기"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* 배차 기본정보 카드 */}
      <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 sm:p-5 mb-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-md">
            <FileText />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-blue-900">배차 기본정보</h3>
            <p className="text-xs sm:text-sm text-blue-800/80">
              운행일지 작성 전, 배차 내역을 다시 한 번 확인해 주세요.
            </p>
          </div>
        </div>

        {/* ✅ 3행 2열 (모바일 글씨 한 단계 축소) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 text-[13px] sm:text-base">
          {/* 운행날짜 */}
          <div className="flex items-start gap-2 bg-white/80 rounded-xl px-3 py-2.5 border border-blue-100">
            <div className="mt-0.5">
              <CalendarIcon className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] sm:text-xs text-gray-500 font-medium">운행날짜</span>
              <span className="mt-1 font-semibold text-gray-900 text-[12px] sm:text-sm">
                {dateStr}
              </span>
            </div>
          </div>

          {/* 운행차량 */}
          <div className="flex items-start gap-2 bg-white/80 rounded-xl px-3 py-2.5 border border-blue-100">
            <div className="mt-0.5">
              <Car className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] sm:text-xs text-gray-500 font-medium">운행차량</span>
              <span className="mt-1 font-semibold text-gray-900 text-[12px] sm:text-sm">
                {vehicleLabel}
                <span className="ml-1 text-[10px] sm:text-xs text-gray-500">
                  ({booking.vehicleId === 'v1' ? '티볼리' : '카니발'})
                </span>
              </span>
            </div>
          </div>

          {/* 운행시간 */}
          <div className="flex items-start gap-2 bg-white/80 rounded-xl px-3 py-2.5 border border-blue-100">
            <div className="mt-0.5">
              <Clock4 className="w-4 h-4 text-orange-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] sm:text-xs text-gray-500 font-medium">운행시간</span>
              <span className="mt-1 font-semibold text-gray-900 text-[12px] sm:text-sm">
                {booking.startTime} ~ {booking.endTime}
              </span>
            </div>
          </div>

          {/* 신청자 / 부서 */}
          <div className="flex items-start gap-2 bg-white/80 rounded-xl px-3 py-2.5 border border-blue-100">
            <div className="mt-0.5">
              <User className="w-4 h-4 text-purple-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] sm:text-xs text-gray-500 font-medium">
                신청자 / 부서
              </span>
              <span className="mt-1 font-semibold text-gray-900 text-[12px] sm:text-sm">
                {booking.requester || booking.userName || '-'}
                {booking.department && (
                  <span className="ml-1 text-[10px] sm:text-xs text-gray-500">
                    ({booking.department})
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* 출장지역 */}
          <div className="flex items-start gap-2 bg-white/80 rounded-xl px-3 py-2.5 border border-blue-100">
            <div className="mt-0.5">
              <MapPin className="w-4 h-4 text-red-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] sm:text-xs text-gray-500 font-medium">출장지역</span>
              <span className="mt-1 font-semibold text-gray-900 text-[12px] sm:text-sm">
                {booking.destination || '-'}
              </span>
            </div>
          </div>

          {/* 사용목적 */}
          <div className="flex items-start gap-2 bg-white/80 rounded-xl px-3 py-2.5 border border-blue-100">
            <div className="mt-0.5">
              <FileText className="w-4 h-4 text-sky-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] sm:text-xs text-gray-500 font-medium">사용목적</span>
              <span className="mt-1 font-semibold text-gray-900 text-[12px] sm:text-sm">
                {booking.purpose || '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 🔻 여기서부터 운행일지 입력 영역 ― 배차 카드와 시각적으로 분리 */}
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="mb-2 sm:mb-3">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900">운행일지 입력</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            실제 운행 경로, 키로수, 특이사항을 정확히 입력해 주세요.
          </p>
        </div>

        <div className="bg-gray-50/70 border border-gray-200 rounded-2xl p-4 sm:p-5 space-y-5 sm:space-y-7">
          {/* 출발지 / 경유지 / 도착지 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
            <div>
              <label className="block text-xs sm:text-base font-semibold text-gray-800 mb-1.5">
                출발지
              </label>
              <input
                type="text"
                value={logForm.from}
                onChange={(e) => onChangeLogForm({ ...logForm, from: e.target.value })}
                placeholder="예) 다남프라자"
                className={underlineInput}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-base font-semibold text-red-500 mb-1.5">
                경유지
              </label>
              <input
                type="text"
                value={logForm.via}
                onChange={(e) => onChangeLogForm({ ...logForm, via: e.target.value })}
                placeholder="예) 남양주시청"
                className={underlineInput}
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs sm:text-base font-semibold text-gray-800 mb-1.5">
                최종 도착지
              </label>
              <input
                type="text"
                value={logForm.to}
                onChange={(e) => onChangeLogForm({ ...logForm, to: e.target.value })}
                placeholder="예) 다남프라자"
                className={underlineInput}
              />
            </div>
          </div>

          {/* 키로수 영역 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
            <div>
              <label className="block text-xs sm:text-base font-semibold text-gray-800 mb-1.5">
                이전 최종키로수
              </label>
              <input type="text" readOnly value={prevKmDisplay} className={underlineReadOnly} />
            </div>

            <div>
              <label className="block text-xs sm:text-base font-semibold text-red-500 mb-1.5">
                현재 최종키로수
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={logForm.finalKm}
                  onChange={(e) => onChangeLogForm({ ...logForm, finalKm: e.target.value })}
                  placeholder="숫자만 입력"
                  className={underlineInput + ' flex-1'}
                />
                <span className="text-sm sm:text-base text-gray-600">km</span>
              </div>
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs sm:text-base font-semibold text-gray-800 mb-1.5">
                운행키로수 (자동)
              </label>
              <input
                type="text"
                readOnly
                value={logForm.finalKm && prevKm != null ? `${distanceKm.toLocaleString()} km` : ''}
                placeholder="현재 최종키로수 입력 후 자동 계산"
                className={underlineReadOnly}
              />
            </div>
          </div>

          {/* 사용 목적 / 운전자 */}
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            <div>
              <label className="block text-xs sm:text-base font-semibold text-gray-800 mb-1.5">
                사용 목적
              </label>
              <input
                type="text"
                value={logForm.purpose}
                onChange={(e) => onChangeLogForm({ ...logForm, purpose: e.target.value })}
                placeholder="예) 회의, 시찰, 교육 등"
                className={underlineInput}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-base font-semibold text-gray-800 mb-1.5">
                운전자 / 동승자
              </label>
              <input
                type="text"
                value={logForm.driver}
                onChange={(e) => onChangeLogForm({ ...logForm, driver: e.target.value })}
                placeholder="예) 운전자1, 동승자1"
                className={underlineInput}
              />
            </div>
          </div>

          {/* 이중주차 / 특이사항 */}
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            <div>
              <label className="block text-xs sm:text-base font-semibold text-red-500 mb-1.5">
                이중주차 여부 * (민우 전달 필수)
              </label>
              <select
                value={logForm.doubleParking}
                onChange={(e) =>
                  onChangeLogForm({
                    ...logForm,
                    doubleParking: e.target.value,
                  })
                }
                className={underlineInput + ' bg-transparent pr-6 cursor-pointer appearance-none'}
              >
                <option value="">선택하세요</option>
                {isCarnival ? (
                  <>
                    <option value="일반주차">일반주차</option>
                    <option value="이중주차(기어중립)">이중주차(기어중립)</option>
                  </>
                ) : (
                  <>
                    <option value="지하1층(일반주차)">지하1층(일반주차)</option>
                    <option value="지하1층(이중주차)">지하1층(이중주차)</option>
                    <option value="금강아파트">금강아파트</option>
                    <option value="그외(전달필수)">그외(전달필수)</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-base font-semibold text-gray-800 mb-1.5">
                특이사항 (경고등 / 주유 등)
              </label>
              <input
                type="text"
                value={logForm.note}
                onChange={(e) => onChangeLogForm({ ...logForm, note: e.target.value })}
                placeholder="예) 엔진 경고등 점등, 주유 필요 등"
                className={underlineInput}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-4 sm:mt-5">
          <button
            type="submit"
            className="w-3/4 sm:w-1/4 py-3.5 sm:py-4 rounded-xl font-bold text-lg sm:text-xl text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
          >
            운행일지 저장
          </button>
        </div>
      </form>
    </div>
  );
};
