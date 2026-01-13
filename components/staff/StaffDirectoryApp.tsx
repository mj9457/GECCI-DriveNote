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

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const highlightText = (value: string, query: string) => {
  const trimmed = query.trim();
  if (!trimmed) return value;
  const escaped = escapeRegExp(trimmed);
  const parts = value.split(new RegExp(`(${escaped})`, 'gi'));
  if (parts.length === 1) return value;
  return parts.map((part, index) =>
    part.toLowerCase() === trimmed.toLowerCase() ? (
      <mark
        key={`${part}-${index}`}
        className="rounded bg-amber-300/70 font-semibold text-gray-900"
      >
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    )
  );
};

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
        member.division,
        member.title,
        member.position,
        member.extension,
        member.mobile,
        member.email,
        ...member.tasks,
      ]
        .map(normalize)
        .some((value) => value.includes(q))
    );
  }, [query]);

  const divisionOrder: Array<'회원사업부' | '대외협력추진본부'> = [
    '회원사업부',
    '대외협력추진본부',
  ];

  const membersByDivision = useMemo(() => {
    const grouped: Record<'회원사업부' | '대외협력추진본부', typeof filteredMembers> = {
      회원사업부: [],
      대외협력추진본부: [],
    };
    filteredMembers.forEach((member) => {
      grouped[member.division].push(member);
    });
    return grouped;
  }, [filteredMembers]);

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
      <div className="flex flex-col h-full w-full max-w-full sm:max-w-3xl md:max-w-6xl lg:max-w-[1300px] mx-auto bg-slate-100 md:bg-white md:rounded-2xl md:shadow-2xl overflow-hidden relative my-2">
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
            <img
              src="/org-chart.jpg"
              alt="조직도"
              className="w-full rounded-xl border border-gray-200 object-contain max-h-[360px] pb-0.5 bg-white"
            />

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

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-600">
                {[
                  '전체',
                  '회원사업부',
                  '대외협력추진본부',
                  '회계',
                  '교육',
                  '홍보/관리',
                  '검정',
                  '무역',
                ].map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setQuery(label === '전체' ? '' : label)}
                    className={`rounded-lg border p-4 text-center cursor-pointer transition ${
                      (label === '전체' ? query === '' : query === label)
                        ? 'border-indigo-500 bg-indigo-100 text-indigo-700'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:border-indigo-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-5 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                직원별 업무분장표
              </h2>
              <span className="text-xs text-gray-500">총 {filteredMembers.length}명</span>
            </div>
            <div className="p-4 space-y-6">
              {divisionOrder.map((division) => {
                const members = membersByDivision[division];
                if (members.length === 0) return null;
                return (
                  <div key={division}>
                    <div className="text-sm sm:text-base font-semibold text-gray-800 mb-3">
                      {division}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-base font-bold text-gray-900">
                                {highlightText(member.name, query)}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {highlightText(member.department, query)} ·{' '}
                                {highlightText(member.title, query)} ·{' '}
                                {highlightText(member.position, query)}
                              </div>
                            </div>
                            <span className="text-xs text-gray-500 tabular-nums">
                              내선 {highlightText(member.extension, query)}
                            </span>
                          </div>
                          <ul className="mt-3 space-y-1 text-xs sm:text-sm text-gray-700">
                            {member.tasks.map((task) => (
                              <li key={task} className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                <span className="flex-1">{highlightText(task, query)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-5 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-semibold text-gray-900">직원 개인정보</h2>
              <span className="text-xs text-gray-500">비상 연락처 포함</span>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-base font-bold text-gray-900">
                        {highlightText(member.name, query)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {highlightText(member.title, query)} ·{' '}
                        {highlightText(member.position, query)} ·{' '}
                        {highlightText(member.department, query)}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 tabular-nums">
                      내선 {highlightText(member.extension, query)}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1 text-xs sm:text-sm text-gray-700">
                    <div>휴대폰: {highlightText(member.mobile, query)}</div>
                    <div>비상연락처: {highlightText(member.emergencyContact, query)}</div>
                    <div>이메일: {highlightText(member.email, query)}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
