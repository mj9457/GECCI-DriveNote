// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, appId } from '@/lib/firebaseClient';

import {
  Car,
  Clock4,
  ShieldCheck,
  Users,
  LogIn,
  LogOut,
  AlertCircle,
  CalendarDays,
  Building2,
  IdCard,
} from 'lucide-react';
import Link from 'next/link';

type UserRole = 'admin' | 'staff' | 'pending' | 'none';

interface AllowedUserData {
  role?: 'admin' | 'staff';
  department?: string;
}

export default function HomePage() {
  const router = useRouter();

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('none');
  const [department, setDepartment] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [checkingRole, setCheckingRole] = useState(false);

  // --- 로그인 상태 감시 ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setRole('none');
        setDepartment('');
        setLoading(false);
        return;
      }

      setCheckingRole(true);
      setLoading(true);

      try {
        // Vehicle 시스템과 동일한 경로
        const userDocRef = doc(
          db,
          'artifacts',
          appId as string,
          'public',
          'data',
          'allowed_users',
          user.email || ''
        );
        const snap = await getDoc(userDocRef);

        if (snap.exists()) {
          const data = snap.data() as AllowedUserData;
          setRole(data.role === 'admin' ? 'admin' : 'staff');
          setDepartment(data.department ?? '');
        } else {
          // 로그인은 했지만 승인 목록에는 없음
          setRole('pending');
        }
      } catch (e) {
        console.error('권한 확인 실패:', e);
        setRole('none');
      } finally {
        setLoading(false);
        setCheckingRole(false);
      }
    });

    return () => unsub();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
      alert('로그인 중 오류가 발생했습니다.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
  };

  // --- 카드 클릭 핸들러들 ---

  const requireApprovedUser = () => {
    if (!firebaseUser) {
      alert('로그인 후 이용 가능합니다.');
      return false;
    }

    if (role !== 'admin' && role !== 'staff') {
      alert(
        role === 'pending'
          ? '관리자 승인 대기 중입니다. 승인 후 이용 가능합니다.'
          : '접근 권한이 없습니다. 관리자에게 문의해 주세요.'
      );
      return false;
    }

    return true;
  };

  /** 차량 운행 관리 진입 */
  const handleVehicleClick = () => {
    if (!requireApprovedUser()) return;
    router.push('/vehicle');
  };

  /** 휴가 캘린더 진입 */
  const handleVacationClick = () => {
    if (!requireApprovedUser()) return;
    router.push('/vacation');
  };

  /** 교육장 대관 캘린더 진입 */
  const handleRentalClick = () => {
    if (!requireApprovedUser()) return;
    router.push('/rental');
  };

  /** 회장님 수행/행사 일정 캘린더 진입 */
  const handleChairmanClick = () => {
    if (!requireApprovedUser()) return;
    router.push('/chairman');
  };

  /** 연장근로 신청 */
  const handleOvertimeClick = () => {
    if (!requireApprovedUser()) return;
    router.push('/overtime');
  };

  /** 관리자용: 사용자 승인 관리 (추후) */
  const handleUserManageClick = () => {
    if (role !== 'admin') return;
    alert('사용자 승인 관리 기능은 추후 개발 예정입니다.');
  };

  /** 관리자용: 시스템 설정 (추후) */
  const handleSystemConfigClick = () => {
    if (role !== 'admin') return;
    alert('시스템 설정 기능은 추후 개발 예정입니다.');
  };

  // --- UI ---

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <div className="w-9 h-9 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">로딩 중입니다...</span>
        </div>
      </main>
    );
  }

  const isLoggedIn = !!firebaseUser;
  const isApproved = role === 'admin' || role === 'staff';

  const cards = [
    {
      key: 'vehicle',
      title: '차량 운행 관리',
      description: '배차 신청 · 일별 현황 · 운행일지',
      features: [
        '· 달력 기반 차량 배차 현황 조회',
        '· 배차 신청 / 수정 / 삭제',
        '· 운행일지 작성 및 월별 통계 확인',
      ],
      onClick: handleVehicleClick,
      cardClassName: isApproved
        ? 'border-blue-400/60 bg-slate-900/60 hover:bg-slate-900 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/40'
        : 'border-slate-600/70 bg-slate-900/40 hover:bg-slate-900/70',
      iconClassName: 'bg-blue-500/90 shadow-blue-500/50',
      badgeClassName: isApproved
        ? 'bg-blue-500/20 text-blue-100 border border-blue-400/60'
        : 'bg-slate-700/60 text-slate-200 border border-slate-500',
      actionLabel: '바로가기 →',
      Icon: Car,
    },
    {
      key: 'overtime',
      title: '연장근로 신청',
      description: '연장 · 휴일근로 신청 및 결재',
      features: [
        '· 근로일 선택 및 시간대 입력',
        '· 팀장 / 부장 결재선 지정',
        '· 승인 현황 및 이력 조회',
      ],
      onClick: handleOvertimeClick,
      cardClassName:
        'border-emerald-400/60 bg-slate-900/60 hover:bg-slate-900/70 hover:-translate-y-1 hover:shadow-2xl hover:shadow-green-700/40',
      iconClassName: 'bg-emerald-500/90 shadow-emerald-500/40',
      badgeClassName: isApproved
        ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-400/60'
        : 'bg-slate-700/60 text-slate-200 border border-slate-500',
      actionLabel: '바로가기 →',
      Icon: Clock4,
    },
    {
      key: 'vacation',
      title: '휴가 캘린더',
      description: '직원 휴가 일정',
      features: [
        '· 월간 달력에서 팀원 휴가/반차/재택 일정 표시',
        '· 내 일정 등록·수정 및 메모 공유',
        '· 부서 기준 필수 입력으로 일정 누락 방지',
      ],
      onClick: handleVacationClick,
      cardClassName:
        'border-orange-400/60 bg-slate-900/60 hover:bg-slate-900/70 hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-500/40',
      iconClassName: 'bg-orange-500/90 shadow-orange-500/50',
      badgeClassName: isApproved
        ? 'bg-orange-500/20 text-orange-100 border border-orange-400/60'
        : 'bg-slate-700/60 text-slate-200 border border-slate-500',
      actionLabel: '바로가기 →',
      Icon: CalendarDays,
    },
    {
      key: 'chairman',
      title: '회장님 수행·행사 일정',
      description: '수행/행사 일정 통합 관리',
      features: [
        '· 월간 달력에서 수행/행사 일정 함께 표시',
        '· 일정 등록·수정 및 장소/메모 관리',
        '· 일정 유형별 색상 구분으로 빠른 확인',
      ],
      onClick: handleChairmanClick,
      cardClassName:
        'border-indigo-400/60 bg-slate-900/60 hover:bg-slate-900/70 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/40',
      iconClassName: 'bg-indigo-500/90 shadow-indigo-500/50',
      badgeClassName: isApproved
        ? 'bg-indigo-500/20 text-indigo-100 border border-indigo-400/60'
        : 'bg-slate-700/60 text-slate-200 border border-slate-500',
      actionLabel: '바로가기 →',
      Icon: Users,
    },
    {
      key: 'rental',
      title: '교육장 대관 캘린더',
      description: '대관 현황 확인 및 일정 등록',
      features: [
        '· 달력 기반 대관 일정 조회',
        '· 사업자정보/행사/시간 입력',
        '· 부대시설 및 회원사 구분',
      ],
      onClick: handleRentalClick,
      cardClassName:
        'border-cyan-400/60 bg-slate-900/60 hover:bg-slate-900/70 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/40',
      iconClassName: 'bg-cyan-500/90 shadow-cyan-500/50',
      badgeClassName: isApproved
        ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-400/60'
        : 'bg-slate-700/60 text-slate-200 border border-slate-500',
      actionLabel: '바로가기',
      Icon: Building2,
    },
  ] as const;

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-5xl">
        {/* 상단 헤더 */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
              경기동부상공회의소 내부 시스템
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2">
              차량 운행 관리 및 각종 신청 업무를 하나의 화면에서 관리합니다.
            </p>
          </div>

          {/* 로그인 영역 */}
          <div className="flex items-center gap-3">
            {isLoggedIn && (
              <>
                <Link
                  href="/staff"
                  className="flex items-center justify-center text-gray-400 hover:text-indigo-500 transition-colors"
                  aria-label="직원 현황"
                >
                  <IdCard className="w-5 h-5 sm:w-6 sm:h-6" />
                </Link>
                <div className="hidden sm:flex flex-col items-end text-right text-xs sm:text-sm">
                  <span className="font-semibold">
                    {firebaseUser.displayName || firebaseUser.email}
                  </span>
                  <span className="text-slate-300">
                    {role === 'admin'
                      ? '관리자'
                      : role === 'staff'
                        ? '직원'
                        : role === 'pending'
                          ? '승인 대기'
                          : '미승인'}
                    {department ? ` · ${department}` : ''}
                  </span>
                </div>
              </>
            )}

            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-600 text-xs sm:text-sm hover:bg-slate-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">로그아웃</span>
              </button>
            ) : (
              <button
                onClick={handleLogin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 text-xs sm:text-sm font-medium hover:bg-blue-500 shadow-lg shadow-blue-500/30 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Google 로그인</span>
              </button>
            )}
          </div>
        </header>

        {/* 승인 안내 배너 */}
        {isLoggedIn && !isApproved && !checkingRole && (
          <div className="mb-6 rounded-xl border border-yellow-400/40 bg-yellow-500/10 px-4 py-3 flex items-start gap-2 text-xs sm:text-sm text-yellow-100">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <div>
              <div className="font-semibold mb-0.5">
                시스템 접근 권한이 아직 승인되지 않았습니다.
              </div>
              <div className="text-yellow-50/90">
                관리자에게 승인 요청 후 이용해 주세요. 일부 메뉴는 클릭 시 안내만 제공됩니다.
              </div>
            </div>
          </div>
        )}

        {/* 카드 그리드 */}
        <section className="ㅏ grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {cards.map((card) => (
            <button
              key={card.key}
              onClick={card.onClick}
              className={`
                group relative flex flex-col items-start justify-between
                rounded-2xl px-5 py-6 md:px-6 md:py-7
                border
                text-left
                transition-all
                ${card.cardClassName}
              `}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-10 h-10 md:w-11 md:h-11 rounded-xl ${card.iconClassName} flex items-center justify-center shadow-lg`}
                >
                  <card.Icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-semibold">{card.title}</h2>
                  <p className="text-xs sm:text-sm text-slate-300">{card.description}</p>
                </div>
              </div>

              <ul className="text-[11px] sm:text-xs text-slate-300 space-y-1.5 mb-4">
                {card.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              <div className="flex items-center justify-between w-full text-xs sm:text-sm">
                <span
                  className={`
                    inline-flex items-center gap-1 px-2 py-1 rounded-full
                    ${card.badgeClassName}
                  `}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {isApproved ? '이용 가능' : '승인 필요'}
                </span>
                <span className="text-slate-300 group-hover:text-white">{card.actionLabel}</span>
              </div>
            </button>
          ))}

          {/* 카드 6: 관리자 전용 메뉴 */}
          {/* <div
            className={`
              flex flex-col gap-3
              rounded-2xl px-5 py-6 md:px-6 md:py-7
              border
              text-left
              border-slate-700 bg-slate-900/30 opacity-50
              }
            `}
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-amber-500/90 flex items-center justify-center shadow-lg shadow-amber-500/40">
                <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-semibold">관리자 패널</h2>
                <p className="text-xs sm:text-sm text-slate-300">사용자 권한 및 시스템 정책 관리</p>
              </div>
            </div>

            <div className="space-y-2 mt-2">
              <button
                type="button"
                onClick={handleUserManageClick}
                disabled={role !== 'admin'}
                className={`
                  w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm
                  border
                  ${
                    role === 'admin'
                      ? 'border-slate-600 bg-slate-900/80 hover:bg-slate-800/90 transition-colors'
                      : 'border-slate-700 bg-slate-900/40 cursor-not-allowed'
                  }
                `}
              >
                <span className="inline-flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  사용자 승인 관리
                </span>
                <span className="text-[11px] text-slate-300">추후 개발</span>
              </button>

              <button
                type="button"
                onClick={handleSystemConfigClick}
                disabled={role !== 'admin'}
                className={`
                  w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm
                  border
                  ${
                    role === 'admin'
                      ? 'border-slate-600 bg-slate-900/80 hover:bg-slate-800/90 transition-colors'
                      : 'border-slate-700 bg-slate-900/40 cursor-not-allowed'
                  }
                `}
              >
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  시스템 정책 설정
                </span>
                <span className="text-[11px] text-slate-300">추후 개발</span>
              </button>
            </div>

            <p className="mt-2 text-[11px] sm:text-xs text-slate-400">
              관리자 계정에만 활성화됩니다. 직원 계정으로 로그인 시 조회만 가능합니다.
            </p>
          </div> */}
        </section>
      </div>
    </main>
  );
}
