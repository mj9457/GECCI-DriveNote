'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Users, House, LogOut, IdCard } from 'lucide-react';
import { Toaster } from 'sonner';

import { LoginScreen } from '@/components/vehicle/auth/LoginScreen';
import { UnauthorizedScreen } from '@/components/vehicle/auth/UnauthorizedScreen';
import { useVacationAuth } from '@/components/vacation/hooks/useVacationAuth';
import { staffMembers } from '@/components/staff/data';

const normalize = (value: string) => value.trim().toLowerCase();

export default function StaffDirectoryApp() {
  const { user, isApproved, loading, loginError, handleLogin, handleLogout } = useVacationAuth();
  const [query, setQuery] = useState('');

  const filteredMembers = useMemo(() => {
    const q = normalize(query);
    if (!q) return staffMembers;
    return staffMembers.filter((member) =>
      [
        member.name,
        member.department,
        member.title,
        member.position,
        member.extension,
        member.mobile,
        member.email,
        member.task,
        member.seat,
      ]
        .map(normalize)
        .some((value) => value.includes(q))
    );
  }, [query]);

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

  return (
    <div className="flex flex-col h-screen bg-slate-100 px-0 sm:px-2 md:px-4 lg:px-8">
      <Toaster position="top-center" richColors closeButton />
      <div className="flex flex-col h-full w-full max-w-full sm:max-w-3xl md:max-w-6xl lg:max-w-[1300px] mx-auto bg-slate-100 md:bg-white md:rounded-2xl md:shadow-2xl overflow-hidden relative my-0 sm:my-4 md:my-6">
        <header className="bg-white text-gray-800 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white p-2 rounded-lg">
              <IdCard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg md:text-xl">직원 현황</h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                조직도, 업무분장, 연락처를 한 화면에서 확인합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center justify-center text-gray-400 hover:text-indigo-500 transition-colors"
            >
              <House className="w-5 h-5 sm:w-6 sm:h-6" />
            </Link>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-300">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="font-medium truncate max-w-[180px]">
                {user.displayName || user.email}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
              aria-label="로그아웃"
            >
              <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto px-3 sm:px-4 md:px-6 py-4 sm:py-5">
          <section className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">조직도</h2>
                <span className="text-[11px] text-gray-500">public/org-chart.png</span>
              </div>
              <div className="p-4">
                <img
                  src="/org-chart.png"
                  alt="조직도"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 object-contain max-h-[360px]"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">검색</h2>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="이름, 부서, 직책, 업무, 연락처로 검색"
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-gray-600">
                {['기획운영팀', '교육사업팀', '차량운행팀', '경영지원팀', '회계팀', '기타'].map(
                  (label) => (
                    <div
                      key={label}
                      className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-center"
                    >
                      {label}
                    </div>
                  )
                )}
              </div>
            </div>
          </section>

          <section className="mt-5 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                직원별 업무분장표
              </h2>
              <span className="text-xs text-gray-500">
                총 {filteredMembers.length}명
              </span>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-2 text-left">이름</th>
                    <th className="px-3 py-2 text-left">부서</th>
                    <th className="px-3 py-2 text-left">직책/직위</th>
                    <th className="px-3 py-2 text-left">담당업무</th>
                    <th className="px-3 py-2 text-left">내선</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="border-t border-gray-100">
                      <td className="px-3 py-2 font-semibold text-gray-900">{member.name}</td>
                      <td className="px-3 py-2">{member.department}</td>
                      <td className="px-3 py-2">
                        {member.title} · {member.position}
                      </td>
                      <td className="px-3 py-2 text-gray-700">{member.task}</td>
                      <td className="px-3 py-2 tabular-nums">{member.extension}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-5 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-semibold text-gray-900">직원 개인정보</h2>
              <span className="text-xs text-gray-500">비상 연락처 포함</span>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-2 text-left">이름</th>
                    <th className="px-3 py-2 text-left">직책/직위</th>
                    <th className="px-3 py-2 text-left">내선</th>
                    <th className="px-3 py-2 text-left">휴대폰</th>
                    <th className="px-3 py-2 text-left">비상연락처</th>
                    <th className="px-3 py-2 text-left">이메일</th>
                    <th className="px-3 py-2 text-left">좌석</th>
                    <th className="px-3 py-2 text-left">입사일</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="border-t border-gray-100">
                      <td className="px-3 py-2 font-semibold text-gray-900">{member.name}</td>
                      <td className="px-3 py-2">
                        {member.title} · {member.position}
                      </td>
                      <td className="px-3 py-2 tabular-nums">{member.extension}</td>
                      <td className="px-3 py-2 tabular-nums">{member.mobile}</td>
                      <td className="px-3 py-2">{member.emergencyContact}</td>
                      <td className="px-3 py-2">{member.email}</td>
                      <td className="px-3 py-2">{member.seat}</td>
                      <td className="px-3 py-2 tabular-nums">{member.joinedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
