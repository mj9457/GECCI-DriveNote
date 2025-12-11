// components/vehicle/Header.tsx
'use client';

import React from 'react';
import { Car, NotebookText, User as UserIcon, LogOut, House } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { View } from '@/types/vehicle';

interface HeaderProps {
  headerTitle: string;
  user: { uid?: string; displayName?: string | null; email?: string | null };
  pendingLogCount: number;
  pendingLogBadgeText: string;
  onUserClick: () => void;
  onLogout: () => void;
  view: View;
  setView: (v: View) => void;
}

export const Header: React.FC<HeaderProps> = ({
  headerTitle,
  user,
  pendingLogCount,
  pendingLogBadgeText,
  onUserClick,
  onLogout,
  view,
  setView,
}) => {
  const router = useRouter();

  const isLogView = view === 'logs' || view === 'log';
  const Icon = isLogView ? NotebookText : Car;
  const toggleButtonLabel = isLogView ? '차량신청' : '운행일지';

  const handleToggleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setView(isLogView ? 'calendar' : 'logs');
  };

  return (
    <header
      className="
        bg-white text-gray-800 
        px-3 sm:px-4 md:px-6 
        py-2.5 sm:py-3 
        flex flex-col gap-2 
        sm:flex-row sm:items-center sm:justify-between 
        z-30 shadow-sm relative
      "
    >
      {/* ⬅️ 상단: 아이콘 + 제목 + 토글 버튼 (모바일/데스크톱 공통) */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg text-white flex items-center justify-center">
            <Icon size={18} className="sm:w-5 sm:h-5" />
          </div>
          <h1 className="font-bold text-sm sm:text-lg md:text-xl truncate">{headerTitle}</h1>

          {/* 차량신청 / 운행일지 토글 버튼 */}
          <button
            type="button"
            onClick={handleToggleClick}
            className="
              hidden xs:inline-flex items-center gap-1 
              px-2 sm:px-2.5 py-1 ml-1 sm:ml-2 
              rounded-full border text-[11px] sm:text-sm
              transition-colors cursor-pointer
              bg-white text-gray-600 border-gray-300 
              hover:bg-blue-50 hover:border-blue-400
              shrink-0
            "
          >
            <NotebookText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{toggleButtonLabel}</span>
            <span className="sm:hidden">{isLogView ? '신청' : '일지'}</span>
          </button>
        </div>

        {/* 우측: 홈 + 유저 + 로그아웃 (줄이 좁을 때도 정렬 유지) */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* 홈 아이콘 + hover tooltip */}
          <div className="relative group flex items-center justify-center">
            <button
              onClick={() => router.push('/')}
              className="flex items-center justify-center text-gray-400 hover:text-blue-500 transition-colors cursor-pointer"
            >
              <House className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <div
              className="
                absolute left-1/2 -translate-x-1/2 mt-1
                hidden group-hover:block
                whitespace-nowrap
                bg-gray-800 text-white text-[10px] sm:text-[12px] px-2 py-1 rounded-md shadow-lg
                z-50
              "
            >
              홈으로
            </div>
          </div>

          {/* 사용자 pill */}
          <div className="relative flex items-center">
            {pendingLogCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center border border-white pointer-events-none">
                {pendingLogBadgeText}
              </span>
            )}

            <div
              className="
                inline-flex items-center gap-1.5 sm:gap-2 
                text-[11px] sm:text-sm 
                bg-gray-50 px-2 sm:px-3 py-1.5 
                rounded-full border border-gray-300 
                max-w-[120px] sm:max-w-[170px] 
                cursor-pointer hover:bg-blue-50 hover:border-blue-400
              "
              onClick={onUserClick}
            >
              <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
              <span className="font-medium text-gray-700 truncate">
                {user.displayName || user.email}
              </span>
            </div>
          </div>

          {/* 로그아웃 + hover tooltip */}
          <div className="relative group flex items-center justify-center">
            <button
              onClick={onLogout}
              className="flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
            >
              <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <div
              className="
                absolute left-1/2 -translate-x-1/2 mt-1
                hidden group-hover:block
                whitespace-nowrap
                bg-gray-800 text-white text-[10px] sm:text-[12px] px-2 py-1 rounded-md shadow-lg
                z-50
              "
            >
              로그아웃
            </div>
          </div>
        </div>
      </div>

      {/* 중앙: 달력 / 월별 토글 */}
      {/* 모바일: 아래쪽에 꽉 차게, 데스크톱: 기존처럼 가운데 */}
      {/* 데스크톱용 (가운데 배치) */}
      <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-1 sm:gap-2 bg-gray-100 px-1.5 py-1 rounded-full text-[11px] sm:text-xs">
          <button
            type="button"
            onClick={() => setView('calendar')}
            className={`px-2 py-0.5 rounded-full font-medium cursor-pointer ${
              view === 'calendar' || view === 'day' || view === 'form'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            달력 보기
          </button>

          <button
            type="button"
            onClick={() => setView('list')}
            className={`px-2 py-0.5 rounded-full font-medium cursor-pointer ${
              view === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            월별 목록
          </button>
        </div>
      </div>

      {/* 모바일용 토글 (헤더 아래, 100% 폭) */}
      <div className="sm:hidden mt-1">
        <div className="flex items-center justify-center gap-1 bg-gray-100 px-2 py-1.5 rounded-full text-[11px]">
          <button
            type="button"
            onClick={() => setView('calendar')}
            className={`flex-1 px-2 py-0.5 rounded-full font-medium cursor-pointer ${
              view === 'calendar' || view === 'day' || view === 'form'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            달력
          </button>

          <button
            type="button"
            onClick={() => setView('list')}
            className={`flex-1 px-2 py-0.5 rounded-full font-medium cursor-pointer ${
              view === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            월별
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
