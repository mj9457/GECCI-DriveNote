// components/vehicle/Header.tsx
'use client';

import React from 'react';
import { Car, NotebookText, User as UserIcon, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

import HeaderMenu from '@/components/shared/HeaderMenu';
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
        px-3 sm:px-4 md:px-6 py-3 sm:py-4 
        flex flex-wrap items-center justify-between 
        min-[721px]:flex-nowrap 
        z-30 shadow-sm relative
      "
    >
      {/* 
        [1] 좌측: 아이콘 + 제목 + 차량신청/운행일지 토글 버튼 
      */}
      <div className="flex items-center gap-1.5 sm:gap-2 order-1">
        <div className="bg-blue-600 text-white w-11 h-11 rounded-lg flex items-center justify-center">
          <Icon />
        </div>
        <h1 className="font-bold text-base sm:text-lg md:text-xl">{headerTitle}</h1>

        <button
          type="button"
          onClick={handleToggleClick}
          className="
            inline-flex items-center gap-1 px-2.5 py-1 ml-1 sm:ml-2 rounded-full border text-[11px] sm:text-sm
            transition-colors cursor-pointer
            bg-white text-gray-600 border-gray-300 hover:bg-blue-50 hover:border-blue-400           
          "
        >
          <NotebookText className="w-3.5 h-3.5" />
          <span>{toggleButtonLabel}</span>
        </button>
      </div>

      {/* 
        [2] 중앙: 달력 / 월별 토글 
        - 720px 이하: order-3 & w-full (두 번째 줄로 내려감)
        - 721px 이상: absolute (중앙 고정) & w-auto
      */}
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
            onClick={() => setView('calendar')}
            className={`px-2 py-0.5 rounded-full font-medium cursor-pointer transition-colors ${
              view === 'calendar' || view === 'day' || view === 'form'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            달력 보기
          </button>

          <button
            type="button"
            onClick={() => setView('list')}
            className={`px-2 py-0.5 rounded-full font-medium cursor-pointer transition-colors ${
              view === 'list'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            월별 목록
          </button>
        </div>
      </div>

      {/* 
        [3] 우측: 홈 아이콘 + 사용자 pill + 로그아웃 
      */}
      <div className="flex items-center gap-2 sm:gap-3 order-2">
        <HeaderMenu />
        {/* 🔹 사용자 정보 Pill */}
        <div className="relative flex items-center">
          {pendingLogCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center border border-white pointer-events-none z-10">
              {pendingLogBadgeText}
            </span>
          )}

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
            onClick={onUserClick}
          >
            <UserIcon className="w-4 h-4 text-gray-500" />

            {/* 텍스트는 721px 이상에서만 보임 (hidden -> block) */}
            <span className="font-medium text-gray-700 truncate hidden min-[721px]:block">
              {user.displayName || user.email}
            </span>
          </div>
        </div>

        {/* 🔹 로그아웃 */}
        <div className="relative group">
          <button
            onClick={onLogout}
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
  );
};

export default Header;
