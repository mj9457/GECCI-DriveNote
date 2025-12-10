import React from 'react';
import { Truck, User as UserIcon, LogOut } from 'lucide-react';

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
    return (
        <header className="bg-white text-gray-800 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between z-30 shadow-sm relative">
            <div
                className="flex items-center gap-1.5 sm:gap-2 cursor-pointer"
                onClick={() => setView('calendar')}
            >
                <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg text-white">
                    <Truck size={18} className="sm:w-5 sm:h-5" />
                </div>
                <h1 className="font-bold text-base sm:text-lg md:text-xl">{headerTitle}</h1>
            </div>

            <div className="absolute left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-1 sm:gap-2 bg-gray-100 px-1.5 py-1 rounded-full text-[11px] sm:text-xs">
                    <button type="button" onClick={() => setView('calendar')} className={`px-2 py-0.5 rounded-full font-medium ${view === 'calendar' || view === 'day' || view === 'form' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>달력 보기</button>
                    <button type="button" onClick={() => setView('list')} className={`px-2 py-0.5 rounded-full font-medium ${view === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>월별 목록</button>
                    <button type="button" onClick={() => setView('logs')} className={`px-2 py-0.5 rounded-full font-medium ${view === 'logs' || view === 'log' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>운행일지</button>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative">
                    {pendingLogCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center border border-white pointer-events-none">{pendingLogBadgeText}</span>
                    )}

                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm bg-gray-50 px-2.5 sm:px-3 py-1.5 rounded-full border max-w-[140px] sm:max-w-[170px] cursor-pointer hover:bg-blue-50 hover:border-blue-400" onClick={onUserClick}>
                        <UserIcon size={12} className="sm:w-4 sm:h-4 text-gray-500" />
                        <span className="font-medium text-gray-700 truncate">{user.displayName || user.email}</span>
                    </div>
                </div>

                <button onClick={onLogout} className="text-gray-400 hover:text-red-500 transition-colors"><LogOut size={18} className="sm:w-5 sm:h-5" /></button>
            </div>
        </header>
    );
};

export default Header;
