"use client"

import { initializeApp } from "firebase/app";
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

import { useState, useEffect } from 'react';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  FileText,
  Truck,
  LogOut,
  AlertCircle,
  User,
} from 'lucide-react';

import { Toaster, toast } from 'sonner';

// --- Firebase Setup ---
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Constants & Helpers ---
const VEHICLES = [
  { id: 'v1', number: '176호 7342', name: '티볼리' },
  { id: 'v2', number: '205하 2053', name: '카니발' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const TIME_HOURS_12 = [
  '01', '02', '03', '04', '05', '06',
  '07', '08', '09', '10', '11', '12',
];

const TIME_MINUTES = ['00', '10', '20', '30', '40', '50'];

// "HH:MM" (24시간) → { ampm, hour, minute }
const parseTimeToParts = (timeStr: string) => {
  if (!timeStr) {
    return { ampm: 'AM', hour: '09', minute: '00' }; // 기본값
  }

  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr || '9', 10);
  let ampm: 'AM' | 'PM' = 'AM';

  if (h === 0) {
    h = 12;
    ampm = 'AM';
  } else if (h === 12) {
    ampm = 'PM';
  } else if (h > 12) {
    h = h - 12;
    ampm = 'PM';
  } else {
    ampm = 'AM';
  }

  const hour = String(h).padStart(2, '0');
  const minute = mStr ?? '00';

  return { ampm, hour, minute };
};

// { ampm, hour, minute } → "HH:MM" (24시간)
const partsToTime24 = (parts: { ampm: string; hour: string; minute: string }) => {
  let h = parseInt(parts.hour || '9', 10);

  if (parts.ampm === 'AM') {
    if (h === 12) h = 0;
  } else {
    if (h !== 12) h = h + 12;
  }

  const hStr = String(h).padStart(2, '0');
  return `${hStr}:${parts.minute}`;
};


// --- Components ---

// 1. Login Component
const LoginScreen = ({ onLogin, error }: { onLogin: () => void; error: string | null }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8">
    <div className="bg-white px-6 py-8 sm:px-8 sm:py-10 rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md lg:max-w-lg text-center">
      <div className="bg-blue-100 p-4 rounded-full inline-block mb-4">
        <Truck className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
      </div>
      <div className="flex flex-col items-center">
        <img
          src="https://gecci.korcham.net/images/logo/logo_top/gecci_top_logo.png"
          className="mb-4 sm:mb-5 w-32 sm:w-40 lg:w-44"
        />
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
          차량 운행 관리 시스템
        </h1>
        <p className="text-gray-500 text-sm sm:text-base mb-6 sm:mb-8 leading-relaxed">
          사내 차량 배차 및 운행 일지를 관리합니다.
          <br className="hidden sm:block" />
          승인된 사용자만 접속 가능합니다.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-xs sm:text-sm flex items-center justify-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <button
        onClick={onLogin}
        className="w-full bg-white border border-gray-300 text-gray-700 font-semibold py-2.5 sm:py-3 px-4 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors shadow-sm text-sm sm:text-base"
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google"
          className="w-4 h-4 sm:w-5 sm:h-5"
        />
        Google 계정으로 로그인
      </button>
    </div>
  </div>
);

// 2. Unauthorized Component
const UnauthorizedScreen = ({ email, onLogout }: { email: string; onLogout: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8">
    <div className="bg-white px-6 py-8 sm:px-8 sm:py-10 rounded-2xl shadow-lg w-full max-w-sm sm:max-w-md lg:max-w-lg text-center">
      <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-orange-500 mx-auto mb-4" />
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">승인 대기 중</h2>
      <p className="text-gray-600 text-sm sm:text-base mb-6 leading-relaxed">
        <span className="font-semibold">{email}</span> 님은 아직
        <br className="hidden sm:block" />
        시스템 접근 권한이 없습니다.
        <br />
        관리자에게 승인을 요청해주세요.
      </p>
      <button
        onClick={onLogout}
        className="text-blue-600 hover:underline text-sm sm:text-base"
      >
        로그아웃
      </button>
    </div>
  </div>
);

// 3. Main Application Component
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  // ⭐ view/prevView 에 'user' 추가
  const [view, setView] = useState<'calendar' | 'day' | 'form' | 'list' | 'log' | 'logs' | 'user'>('calendar');
  const [prevView, setPrevView] = useState<'calendar' | 'day' | 'list' | 'log' | 'logs' | 'user'>('calendar');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState<any[]>([]);

  const [driveLogs, setDriveLogs] = useState<any[]>([]); // 운행일지 목록
  const [logForm, setLogForm] = useState({
    from: '다남프라자',      // 출발지
    via: '',                // 경유지
    to: '다남프라자',        // 최종 도착지
    finalKm: '',            // 현재 최종 키로수(입력)
    purpose: '',            // 사용 목적
    driver: '',             // 운전자/동승자
    doubleParking: '',      // 이중주차 여부
    note: '',               // 특이사항
  });

  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');

  const [defaultDept, setDefaultDept] = useState<string>('');

  const [vehicleFilter, setVehicleFilter] = useState<'all' | 'v1' | 'v2'>('all');

  // Form State
  const [formData, setFormData] = useState({
    vehicleId: VEHICLES[0].id,
    startTime: '09:00',
    endTime: '12:00',
    destination: '',
    purpose: '',
    requester: '',
    department: '',
  });

  const VEHICLE_COLORS: Record<string, string> = {
    v1: "bg-green-100 text-green-800",
    v2: "bg-purple-100 text-purple-800",
  };

  // --- Auth & Data Loading ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await checkApproval(currentUser);
      } else {
        setUser(null);
        setIsApproved(false);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      console.log(user);
      setFormData(prev => ({
        ...prev,
        requester: prev.requester || user.displayName || user.email || user.uid || user.department,
      }));
    }
  }, [user]);

  const checkApproval = async (currentUser: any) => {
    setLoading(true);
    try {
      // ⭐ doc() 경로를 segment 로 수정 + appId 사용
      const userDocRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'allowed_users',
        currentUser.email!,
      );
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        setIsApproved(true);

        const data = userDoc.data();
        if (data && typeof data.department === 'string') {
          setDefaultDept(data.department);

          setFormData(prev => ({
            ...prev,
            department: prev.department || data.department,
          }));
        } else {
          setDefaultDept('');
        }
      } else {
        setIsApproved(false);
        setDefaultDept('');
      }
    } catch (e) {
      console.error('Auth check failed', e);
      setIsApproved(false);
      setDefaultDept('');
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    if (!user || !isApproved) return;

    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'vehicle_bookings'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedBookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBookings(loadedBookings);
    });

    return () => unsubscribe();
  }, [user, isApproved]);

  useEffect(() => {
    if (!user || !isApproved) return;

    const q = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'vehicle_drive_logs')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedLogs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDriveLogs(loadedLogs as any[]);
    });

    return () => unsubscribe();
  }, [user, isApproved]);

  useEffect(() => {
    if (view !== 'log' || !selectedBooking) return;

    const booking = selectedBooking;

    const existingLog = driveLogs.find((log: any) => log.bookingId === booking.id);

    setLogForm({
      from: (existingLog && existingLog.from) || '다남프라자',
      via: (existingLog && existingLog.via) || '',
      to: (existingLog && existingLog.to) || '다남프라자',
      finalKm:
        existingLog && existingLog.finalKm != null
          ? String(existingLog.finalKm)
          : '',
      purpose: (existingLog && existingLog.purpose) || booking.purpose || '',
      driver:
        (existingLog && existingLog.driver) ||
        booking.requester ||
        booking.userName ||
        '',
      doubleParking: (existingLog && existingLog.doubleParking) || '',
      note: (existingLog && existingLog.note) || '',
    });
  }, [view, selectedBooking, driveLogs]);


  // --- Handlers ---
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setLoginError(null);
    } catch (error) {
      setLoginError("로그인 중 오류가 발생했습니다.");
    }
  };

  const handleLogout = () => signOut(auth);

  const handleFabClick = async () => {
    if (user?.email) {
      try {
        const userDocRef = doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'allowed_users',
          user.email!,
        );
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          console.log("현재 사용자 Firestore 정보:", userDocSnap.data());
        } else {
          console.log(
            "allowed_users 에 현재 사용자 문서가 없습니다. email:",
            user.email
          );
        }
      } catch (error) {
        console.error("사용자 Firestore 정보 조회 실패:", error);
      }
    } else {
      console.log("로그인 정보에 email 이 없습니다.", user);
    }

    setPrevView(view === "form" ? "calendar" : view);

    setFormMode("create");
    setSelectedBooking(null);

    setFormData({
      vehicleId: VEHICLES[0].id,                // 기본 차량
      startTime: "09:00",                       // 기본 출발시간
      endTime: "12:00",                         // 기본 도착시간
      destination: "",                          // 출장 지역 reset
      purpose: "",                              // 🔥 출장 목적 reset
      requester:
        user?.displayName ||
        user?.email ||
        user?.uid ||
        "",
      department: defaultDept || "",            // Firestore에서 읽은 기본 부서
    });

    const today = new Date();

    if (view === "calendar") {
      setSelectedDate(today);
    } else if (view === "day") {
      // Day 뷰에서는 selectedDate 유지
    } else if (view === "list") {
      if (
        today.getFullYear() === currentDate.getFullYear() &&
        today.getMonth() === currentDate.getMonth()
      ) {
        setSelectedDate(today);
      } else {
        setSelectedDate(
          new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        );
      }
    }

    setView("form");
  };




  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  const goToCurrentMonth = () => {
    const today = new Date();
    setCurrentDate(today);     // 달력/월별 목록 기준 월을 오늘로
    setSelectedDate(today);    // 선택된 날짜도 오늘로 맞춰줌
  };

  const changeDay = (delta: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + delta);
    setSelectedDate(newDate);
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
    setView('day');
  };

  const checkOverlap = (
    vId: string,
    dateStr: string,
    startT: string,
    endT: string,
    excludeId?: string,
  ) => {
    return bookings.some(b => {
      if (b.vehicleId !== vId || b.date !== dateStr) return false;
      if (excludeId && b.id === excludeId) return false;
      return (startT < b.endTime) && (endT > b.startTime);
    });
  };

  // 같은 차량의 "이전 운행일지"에서 최종키로수 가져오기
  const getPrevFinalKm = (vehicleId: string, dateStr: string, bookingId?: string) => {
    const logs = driveLogs
      .filter((log: any) => {
        if (log.vehicleId !== vehicleId) return false;
        if (!log.date) return false;
        if (bookingId && log.bookingId === bookingId) return false; // 현재 건은 제외
        return log.date <= dateStr;
      })
      .sort((a: any, b: any) => (a.date || '').localeCompare(b.date || ''));

    if (logs.length === 0) return null;
    const last = logs[logs.length - 1];

    const raw = (last as any).finalKm;
    if (typeof raw === 'number') return raw;
    const n = Number(raw);
    return Number.isNaN(n) ? null : n;
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // 중복 클릭 방지
    setIsSubmitting(true);

    // 🔹 Firestore 에서 가져온 부서를 최우선으로 사용
    const effectiveDept = formData.department || defaultDept;

    if (
      !formData.vehicleId ||
      !formData.startTime ||
      !formData.endTime ||
      !formData.destination ||
      !formData.requester ||
      !formData.purpose ||
      !effectiveDept
    ) {
      toast.error('필수 정보를 모두 입력해 주세요.', {
        description: '신청자, 부서, 출장 목적, 출장 지역, 시간 등을 확인해주세요.',
      });
      setIsSubmitting(false);
      return;
    }

    if (formData.startTime >= formData.endTime) {
      toast.error('시간 선택이 올바르지 않습니다.', {
        description: '도착 시간이 출발 시간보다 늦어야 합니다.',
      });
      setIsSubmitting(false);
      return;
    }

    const dateStr = formatDate(selectedDate);

    const excludeId =
      formMode === 'edit' && selectedBooking ? selectedBooking.id : undefined;

    if (
      checkOverlap(
        formData.vehicleId,
        dateStr,
        formData.startTime,
        formData.endTime,
        excludeId,
      )
    ) {
      toast.error('이미 예약된 시간대입니다.', {
        description: '다른 시간대를 선택해 주세요.',
      });
      setIsSubmitting(false);
      return;
    }

    try {
      if (formMode === 'edit' && selectedBooking) {
        const bookingRef = doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'vehicle_bookings',
          selectedBooking.id,
        );

        await updateDoc(bookingRef, {
          ...formData,
          department: effectiveDept,
          date: dateStr,
          userId: user.uid,
          userName: user.displayName,
          updatedAt: new Date().toISOString(),
        });

        toast.success('배차 예약이 수정되었습니다.', {
          description: `${dateStr} / ${formData.startTime}~${formData.endTime}`,
        });
      } else {
        await addDoc(
          collection(
            db,
            'artifacts',
            appId,
            'public',
            'data',
            'vehicle_bookings',
          ),
          {
            ...formData,
            department: effectiveDept,
            date: dateStr,
            userId: user.uid,
            userName: user.displayName,
            createdAt: new Date().toISOString(),
          },
        );

        toast.success('배차 예약이 등록되었습니다.', {
          description: `${dateStr} / ${formData.startTime}~${formData.endTime}`,
        });
      }

      setView('day');
      setFormData((prev) => ({
        ...prev,
        destination: '',
        purpose: '',
      }));
      setSelectedBooking(null);
      setFormMode('create');
    } catch (err) {
      console.error(err);
      toast.error('저장에 실패했습니다.', {
        description: '네트워크 상태를 확인하거나, 잠시 후 다시 시도해 주세요.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleDelete = async () => {
    if (!selectedBooking) return;

    if (selectedBooking.userId !== user.uid) {
      toast.error('삭제 권한이 없습니다.', {
        description: '본인이 신청한 배차만 삭제할 수 있습니다.',
      });
      return;
    }

    const ok = window.confirm('정말 이 배차 일정을 삭제하시겠습니까?');
    if (!ok) return;

    try {
      const bookingRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'vehicle_bookings',
        selectedBooking.id,
      );

      await deleteDoc(bookingRef);

      toast.success('배차 예약이 삭제되었습니다.');

      setSelectedBooking(null);
      setFormMode('create');
      setView('day');
    } catch (err) {
      console.error(err);
      toast.error('삭제 중 오류가 발생했습니다.', {
        description: '잠시 후 다시 시도해 주세요.',
      });
    }
  };

  // ✅ 내 배차 신청 내역에서 개별 배차 삭제
  const handleDeleteMyBooking = async (booking: any) => {
    if (booking.userId !== user.uid) {
      toast.error('삭제 권한이 없습니다.', {
        description: '본인이 신청한 배차만 삭제할 수 있습니다.',
      });
      return;
    }

    const ok = window.confirm('정말 이 배차 신청을 삭제하시겠습니까?');
    if (!ok) return;

    try {
      const bookingRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'vehicle_bookings',
        booking.id,
      );

      await deleteDoc(bookingRef);

      // 혹시 이 배차를 보고 있는 상태라면 초기화
      if (selectedBooking && selectedBooking.id === booking.id) {
        setSelectedBooking(null);
        setFormMode('create');
        if (view === 'form') {
          setView('user');
        }
      }

      toast.success('배차 신청이 삭제되었습니다.');
    } catch (err) {
      console.error(err);
      toast.error('배차 삭제 중 오류가 발생했습니다.', {
        description: '잠시 후 다시 시도해 주세요.',
      });
    }
  };

  // ✅ 내 운행일지 목록에서 개별 운행일지 삭제
  const handleDeleteMyLog = async (log: any) => {
    const ok = window.confirm('정말 이 운행일지를 삭제하시겠습니까?');
    if (!ok) return;

    try {
      const logRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'vehicle_drive_logs',
        log.id,
      );

      await deleteDoc(logRef);

      toast.success('운행일지가 삭제되었습니다.');
    } catch (err) {
      console.error(err);
      toast.error('운행일지 삭제 중 오류가 발생했습니다.', {
        description: '잠시 후 다시 시도해 주세요.',
      });
    }
  };



  // 운행일지 저장
  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    const booking = selectedBooking;
    const dateStr = booking.date || formatDate(selectedDate);

    const prevKmRaw = getPrevFinalKm(booking.vehicleId, dateStr, booking.id);
    const prevKm = prevKmRaw != null ? prevKmRaw : 0;

    const finalKm = Number(logForm.finalKm || 0);

    if (!finalKm) {
      toast.error('현재 최종 키로수를 입력해 주세요.');
      return;
    }

    if (finalKm < prevKm) {
      toast.error('키로수 입력이 올바르지 않습니다.', {
        description:
          '현재 최종 키로수는 이전 최종 키로수보다 크거나 같아야 합니다.',
      });
      return;
    }

    const distanceKm = finalKm - prevKm;

    // 이 배차건에 대해 이미 저장된 운행일지가 있는지 확인
    const existingLog = driveLogs.find(
      (log: any) => log.bookingId === booking.id,
    );

    try {
      const baseData = {
        bookingId: booking.id,
        vehicleId: booking.vehicleId,
        date: dateStr,
        from: logForm.from,
        via: logForm.via,
        to: logForm.to,
        prevFinalKm: prevKm,
        finalKm,
        distanceKm,
        purpose: logForm.purpose,
        driver: logForm.driver,
        doubleParking: logForm.doubleParking,
        note: logForm.note,
        updatedAt: new Date().toISOString(),
      };

      if (existingLog) {
        const logRef = doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'vehicle_drive_logs',
          existingLog.id,
        );
        await updateDoc(logRef, baseData);
        toast.success('운행일지가 수정되었습니다.');
      } else {
        await addDoc(
          collection(
            db,
            'artifacts',
            appId,
            'public',
            'data',
            'vehicle_drive_logs',
          ),
          {
            ...baseData,
            createdAt: new Date().toISOString(),
          },
        );
        toast.success('운행일지가 저장되었습니다.');
      }

      setView(prevView);
    } catch (error) {
      console.error(error);
      toast.error('운행일지 저장 중 오류가 발생했습니다.', {
        description: '잠시 후 다시 시도해 주세요.',
      });
    }
  };



  // --- Rendering Sub-components ---

  // A. Month View
  const renderCalendar = () => {
    const { days, firstDay } = getDaysInMonth(currentDate);
    const blanks = Array(firstDay).fill(null);
    let dayNumbers = Array.from({ length: days }, (_, i) => i + 1);

    const monthBookings = bookings.filter(b => {
      const bDate = new Date(b.date);
      return (
        bDate.getMonth() === currentDate.getMonth() &&
        bDate.getFullYear() === currentDate.getFullYear()
      );
    });

    const today = new Date();

    const isCurrentMonth =
      currentDate.getFullYear() === today.getFullYear() &&
      currentDate.getMonth() === today.getMonth();

    return (
      <div className="p-3 sm:p-4">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => changeMonth(-1)}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
          </h2>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* 🔹 이번 달이 아닐 때만 버튼 표시 */}
            {!isCurrentMonth && (
              <button
                onClick={goToCurrentMonth}
                className="
          px-2 sm:px-3 py-1
          text-[11px] sm:text-xs
          border rounded-full
          bg-white text-gray-700
          hover:bg-blue-50 hover:border-blue-400
        "
              >
                오늘
              </button>
            )}
            <button
              onClick={() => changeMonth(1)}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/*
        <div className="flex justify-end items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-800 text-[10px] sm:text-xs">
            <span className="w-2 h-2 rounded-full bg-green-800"></span>
            티볼리
          </div>

          <div className="flex items-center gap-1 px-2 py-1 rounded bg-purple-100 text-purple-800 text-[10px] sm:text-xs">
            <span className="w-2 h-2 rounded-full bg-purple-800"></span>
            카니발
          </div>
        
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-gray-200 text-gray-600 text-[10px] sm:text-xs">
            <span className="w-2 h-2 rounded-full bg-gray-500"></span>
            완료
          </div>
        </div>
        */}

        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1 sm:mb-2 text-center text-[10px] sm:text-xs md:text-sm text-gray-500 font-medium">
          <div className="text-red-500">일</div>
          <div>월</div><div>화</div><div>수</div><div>목</div><div>금</div>
          <div className="text-blue-500">토</div>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {blanks.map((_, i) => (
            <div
              key={`blank-${i}`}
              className="h-24 sm:h-32 bg-gray-50 rounded-lg"
            ></div>
          ))}
          {dayNumbers.map(day => {
            const dateStr = `${currentDate.getFullYear()}-${String(
              currentDate.getMonth() + 1
            ).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            const dayBookings = monthBookings
              .filter(b => b.date === dateStr)
              .slice()
              .sort((a, b) => a.startTime.localeCompare(b.startTime));

            const isToday = formatDate(new Date()) === dateStr;

            return (
              <div
                key={day}
                onClick={() => handleDateClick(day)}
                className={`h-24 sm:h-32 border rounded-lg p-2 sm:p-2.5 md:p-3 cursor-pointer transition-all hover:shadow-md hover:border-blue-300 bg-white relative ${isToday ? 'ring-2 ring-blue-500' : 'border-gray-200'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm sm:text-base font-semibold ${isToday ? 'text-blue-600' : 'text-gray-700'
                      }`}
                  >
                    {day}
                  </span>

                  {dayBookings.length > 0 && (
                    <span
                      className="ml-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] sm:text-[11px] flex items-center justify-center">
                      {dayBookings.length}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-col gap-1 overflow-hidden h-14 sm:h-20 md:h-24">
                  {dayBookings.length > 0 ? (
                    dayBookings.slice(0, 4).map((b, idx) => {
                      const bookingEnd = new Date(`${b.date}T${b.endTime}:00`);
                      const isFinished = bookingEnd < today;

                      const colorClass = isFinished
                        ? "bg-gray-200 text-gray-500"
                        : (VEHICLE_COLORS[b.vehicleId] ?? "bg-gray-100 text-gray-800");

                      return (
                        <div
                          key={idx}
                          className={`text-[10px] sm:text-xs px-1 rounded truncate ${colorClass}`}
                        >
                          {b.startTime} {VEHICLES.find(v => v.id === b.vehicleId)?.name} / {b.requester}
                        </div>
                      );
                    })
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div >
    );
  };

  const openBookingForm = (booking: any) => {
    const [y, m, d] = booking.date.split('-').map(Number);
    setSelectedDate(new Date(y, m - 1, d));

    setFormData({
      vehicleId: booking.vehicleId,
      startTime: booking.startTime,
      endTime: booking.endTime,
      destination: booking.destination ?? '',
      purpose: booking.purpose ?? '',
      requester: booking.requester ?? booking.userName ?? '',
      department: booking.department ?? defaultDept ?? '',
    });

    setSelectedBooking(booking);
    // ⭐ 현재 view 그대로 prevView 로 저장 (day / list / user)
    setPrevView(view);

    if (booking.userId === user.uid) {
      setFormMode('edit');
    } else {
      setFormMode('view');
    }

    setView('form');
  };

  // ⭐ 운행일지 작성 화면으로 이동 (origin 에 'user' 추가)
  const openDriveLogForm = (booking: any, origin: 'list' | 'logs' | 'user' = 'list') => {
    setSelectedBooking(booking);
    setPrevView(origin);
    setView('log');
  }





  // B. Day View (Timeline)
  const renderDayView = () => {
    const dateStr = formatDate(selectedDate);
    const dayBookings = bookings.filter(b => b.date === dateStr);

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4 bg-white shadow-sm z-10 sticky top-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setView('calendar')}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full text-gray-600"
            >
              <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
            </button>
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">
              {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 배차현황
            </h2>
          </div>
          <div className="flex gap-1 sm:gap-2">
            <button
              onClick={() => changeDay(-1)}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => changeDay(1)}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronRight size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-white relative">
          <div className="flex sticky top-0 z-20 bg-gray-50">
            <div className="w-12 sm:w-16 flex-shrink-0 border-right bg-gray-50"></div>
            {VEHICLES.map(v => (
              <div
                key={v.id}
                className="flex-1 min-w-[96px] sm:min-w-[120px] p-2 sm:p-3 text-center border-r border-gray-300 font-semibold text-gray-700 text-xs sm:text-sm"
              >
                <div className="text-[10px] sm:text-xs text-gray-500">{v.name}</div>
                <div className="text-xs sm:text-sm">{v.number}</div>
              </div>
            ))}
          </div>

          <div className="relative h-[1152] mt-[6]">
            {HOURS.map(hour => (
              <div
                key={hour}
                className="absolute w-full flex"
                style={{ top: `${hour * 48}px`, height: '48px' }}
              >
                <div className="w-12 sm:w-16 flex-shrink-0 text-[10px] sm:text-xs text-gray-400 text-right pr-1.5 sm:pr-2 -mt-1.5 border-r bg-white z-10">
                  {String(hour).padStart(2, '0')}:00
                </div>
                <div className="flex-1 border-b border-gray-300 w-full relative"></div>
              </div>
            ))}

            <div className="absolute inset-0 flex pl-12 sm:pl-16">
              {VEHICLES.map(v => (
                <div
                  key={`line-${v.id}`}
                  className="flex-1 border-r border-gray-300 h-full relative"
                >
                  {dayBookings
                    .filter(b => b.vehicleId === v.id)
                    .map(b => {
                      const [sh, sm] = b.startTime.split(':').map(Number);
                      const [eh, em] = b.endTime.split(':').map(Number);
                      const startMinutes = sh * 60 + sm;
                      const endMinutes = eh * 60 + em;
                      const duration = endMinutes - startMinutes;

                      const top = startMinutes * 0.8;
                      const height = Math.max(duration * 0.8, 20);

                      const colorClass =
                        VEHICLE_COLORS[b.vehicleId] ?? "bg-blue-500 border-blue-600";

                      const requesterName = b.requester || b.userName;
                      const department = b.department;

                      return (
                        <div
                          key={b.id}
                          onClick={() => openBookingForm(b)}
                          className={`
                                      absolute left-1 right-1 rounded
                                      px-1.5 sm:px-2 py-0.5 sm:py-1
                                      text-[10px] sm:text-xs 
                                      shadow-sm overflow-hidden z-10
                                      opacity-90 hover:opacity-100 hover:scale-[1.02]
                                      transition-all cursor-pointer
                                      border
                                      ${colorClass}
                                    `}
                          style={{ top: `${top}px`, height: `${height}px` }}
                          title={`${b.startTime}~${b.endTime} | ${b.destination} | ${requesterName}${department ? ' / ' + department : ''}`}
                        >
                          <div className="font-bold truncate">
                            {requesterName}
                            {department && (
                              <span className="ml-1 text-[10px] sm:text-[11px] opacity-80">
                                ({department})
                              </span>
                            )}
                          </div>
                          <div className="truncate opacity-90">
                            {`${b.destination}(${b.purpose})`}
                          </div>
                        </div>
                      );
                    })}


                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // C. Request Form
  const renderForm = () => {
    const excludeId =
      formMode === 'edit' && selectedBooking ? selectedBooking.id : undefined;

    const isReadOnly = formMode === 'view';

    // 출발/도착 시간이 유효하게 선택된 경우에만 겹침 체크
    const hasValidTimeRange =
      formData.startTime &&
      formData.endTime &&
      formData.startTime < formData.endTime;

    // ① 조회 전용(view) 모드가 아니고
    // ② 시간이 정상적으로 선택된 경우에만 겹침 체크
    const isOverlap =
      !isReadOnly &&
      !isSubmitting &&
      hasValidTimeRange &&
      checkOverlap(
        formData.vehicleId,
        formatDate(selectedDate),
        formData.startTime,
        formData.endTime,
        excludeId,
      );

    const startParts = parseTimeToParts(formData.startTime);
    const endParts = parseTimeToParts(formData.endTime);

    // 🔹 선택된 일자 + 차량의 기존 예약과 가능한 시간대 계산
    const dateStr = formatDate(selectedDate);
    const sameDateBookings = bookings
      .filter((b) => b.date === dateStr && b.vehicleId === formData.vehicleId)
      .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

    const timeStrToMin = (t: string) => {
      if (!t) return 0;
      const [hStr, mStr] = t.split(":");
      const h = parseInt(hStr || "0", 10);
      const m = parseInt(mStr || "0", 10);
      return h * 60 + m;
    };

    const minToTimeStr = (total: number) => {
      const h = Math.floor(total / 60);
      const m = total % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };

    // ✅ 출발 시간(24시간 기준) 분 값
    const startTotalMin = timeStrToMin(formData.startTime);

    // ✅ AM/PM, 시, 분 조합(parts)을 분으로 바꿔주는 헬퍼
    const partsToMinutes = (p: { ampm: string; hour: string; minute: string }) => {
      const t24 = partsToTime24(p);
      return timeStrToMin(t24);
    };

    const DAY_START = 0;          // 00:00
    const DAY_END = 24 * 60;      // 24:00

    let cursor = DAY_START;
    const availableRanges: { start: string; end: string }[] = [];

    sameDateBookings.forEach((b: any) => {
      const s = timeStrToMin(b.startTime);
      const e = timeStrToMin(b.endTime);

      // 예약 사이의 빈 구간 = 예약 가능 시간
      if (s > cursor) {
        const gapStart = cursor;
        const gapEnd = Math.min(s, DAY_END);
        if (gapEnd > gapStart) {
          availableRanges.push({
            start: minToTimeStr(gapStart),
            end: minToTimeStr(gapEnd),
          });
        }
      }

      if (e > cursor) {
        cursor = e;
      }
    });

    // 마지막 예약 이후 ~ DAY_END 까지
    if (cursor < DAY_END) {
      availableRanges.push({
        start: minToTimeStr(cursor),
        end: minToTimeStr(DAY_END),
      });
    }

    return (
      <div className="px-3 sm:px-4 md:px-6 py-4 md:py-6 max-w-lg md:max-w-xl lg:max-w-2xl mx-auto bg-white min-h-full">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-4 sm:mb-6 pb-3 sm:pb-4">
          <button
            onClick={() => setView(prevView)}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full text-gray-600"
          >
            <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
          </button>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold">차량 배차 신청</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border">
            <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600 font-medium mb-1">
              <CalendarIcon size={16} className="sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">운행 일자</span>
            </div>

            {/* 사람이 읽기 쉬운 형식 + 실제 변경 가능한 date input */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mt-1">
              {/* 한글로 표시되는 날짜 */}
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
                {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
              </div>

              {/* 실제로 날짜를 바꾸는 input */}
              {!isReadOnly && (
                <input
                  type="date"
                  value={formatDate(selectedDate)} // "YYYY-MM-DD"
                  onChange={(e) => {
                    const value = e.target.value; // "YYYY-MM-DD"
                    if (!value) return;
                    const [y, m, d] = value.split('-').map(Number);
                    const newDate = new Date(y, m - 1, d);
                    setSelectedDate(newDate);
                  }}
                  className="
          w-full sm:w-auto
          px-2.5 sm:px-3 py-2 sm:py-2.5
          border rounded-lg text-xs sm:text-sm
          outline-none
          bg-white focus:ring-2 focus:ring-blue-500
        "
                />
              )}
            </div>
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                신청자
              </label>
              <div className="relative">
                <User className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3.5 text-gray-400" size={16} />
                <input
                  type="text"
                  value={formData.requester}
                  disabled={isReadOnly}
                  onChange={(e) =>
                    setFormData({ ...formData, requester: e.target.value })
                  }
                  placeholder="신청자 이름 또는 아이디"
                  className="w-full pl-8 sm:pl-10 p-2.5 sm:p-3 border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                부서
              </label>
              <select
                value={formData.department || defaultDept || ''}
                disabled={isReadOnly}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                className={`
                            w-full p-2.5 sm:p-3 border rounded-lg text-xs sm:text-sm 
                            outline-none
                                    ${isReadOnly
                    ? 'bg-gray-50 text-gray-600 appearance-none cursor-default'
                    : 'bg-white focus:ring-2 focus:ring-blue-500'
                  }
                          `}
              >
                <option value="">부서를 선택하세요</option>
                <option value="대외협력추진본부">대외협력추진본부</option>
                <option value="회원지원팀">회원지원팀</option>
                <option value="회계팀">회계팀</option>
                <option value="총무팀">총무팀</option>
                <option value="사무국">사무국</option>
              </select>
            </div>

          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              차량 선택
            </label>

            {/* ✅ view 모드일 때 전체 차량 선택 블록을 비활성화 */}
            <fieldset
              disabled={isReadOnly}
              className="grid grid-cols-1 gap-2.5 sm:gap-3"
            >
              {VEHICLES.map(v => (
                <label
                  key={v.id}
                  className={`
          flex items-center p-2.5 sm:p-3 border rounded-lg transition-all text-xs sm:text-sm
          ${formData.vehicleId === v.id
                      ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                      : 'hover:bg-gray-50'
                    }
          ${isReadOnly
                      ? 'cursor-not-allowed opacity-60 hover:bg-white'
                      : 'cursor-pointer'
                    }
        `}
                >
                  <input
                    type="radio"
                    name="vehicle"
                    value={v.id}
                    checked={formData.vehicleId === v.id}
                    onChange={(e) =>
                      setFormData({ ...formData, vehicleId: e.target.value })
                    }
                    className="mr-2 sm:mr-3"
                  />
                  <div>
                    <div className="font-bold text-gray-800">{v.number}</div>
                    <div className="text-[11px] sm:text-xs text-gray-500">{v.name}</div>
                  </div>
                </label>
              ))}
            </fieldset>
          </div>

          {/* 🔹 출발/도착 시간을 항상 좌우 2열로 배치 */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* 출발 시간 */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                출발 시간
              </label>
              {/* 🔹 오전/오후 · 시 · 분을 가로 한 줄로 고정 */}
              <div className="flex flex-nowrap gap-1.5 sm:gap-2">
                {/* 오전/오후 */}
                <select
                  disabled={isReadOnly}
                  value={startParts.ampm}
                  onChange={(e) => {
                    const updated = { ...startParts, ampm: e.target.value };
                    const newTime = partsToTime24(updated);
                    setFormData({ ...formData, startTime: newTime });
                  }}
                  className={`
          basis-[28%] sm:basis-[26%]
          p-2.5 sm:p-3 border rounded-lg text-xs sm:text-sm 
          outline-none
          ${isReadOnly
                      ? 'bg-gray-50 text-gray-600 appearance-none cursor-default'
                      : 'bg-white focus:ring-2 focus:ring-blue-500'
                    }
        `}
                >
                  <option value="AM">오전</option>
                  <option value="PM">오후</option>
                </select>

                {/* 시 */}
                <select
                  disabled={isReadOnly}
                  value={startParts.hour}
                  onChange={(e) => {
                    const updated = { ...startParts, hour: e.target.value };
                    const newTime = partsToTime24(updated);
                    setFormData({ ...formData, startTime: newTime });
                  }}
                  className={`
          basis-[36%]
          p-2.5 sm:p-3 border rounded-lg text-xs sm:text-sm 
          outline-none
          ${isReadOnly
                      ? 'bg-gray-50 text-gray-600 appearance-none cursor-default'
                      : 'bg-white focus:ring-2 focus:ring-blue-500'
                    }
        `}
                >
                  {TIME_HOURS_12.map((h) => (
                    <option key={h} value={h}>
                      {h}시
                    </option>
                  ))}
                </select>

                {/* 분 */}
                <select
                  disabled={isReadOnly}
                  value={startParts.minute}
                  onChange={(e) => {
                    const updated = { ...startParts, minute: e.target.value };
                    const newTime = partsToTime24(updated);
                    setFormData({ ...formData, startTime: newTime });
                  }}
                  className={`
          basis-[36%]
          p-2.5 sm:p-3 border rounded-lg text-xs sm:text-sm 
          outline-none
          ${isReadOnly
                      ? 'bg-gray-50 text-gray-600 appearance-none cursor-default'
                      : 'bg-white focus:ring-2 focus:ring-blue-500'
                    }
        `}
                >
                  {TIME_MINUTES.map((m) => (
                    <option key={m} value={m}>
                      {m}분
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 도착 예정 시간 */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                도착 예정 시간
              </label>
              <div className="flex flex-nowrap gap-1.5 sm:gap-2">
                {/* 오전/오후 */}
                <select
                  disabled={isReadOnly}
                  value={endParts.ampm}
                  onChange={(e) => {
                    const updated = { ...endParts, ampm: e.target.value };
                    const newTime = partsToTime24(updated);
                    setFormData({ ...formData, endTime: newTime });
                  }}
                  className={`
                              basis-[28%] sm:basis-[26%]
                              p-2.5 sm:p-3 border rounded-lg text-xs sm:text-sm 
                              outline-none
                              ${isReadOnly
                      ? 'bg-gray-50 text-gray-600 appearance-none cursor-default'
                      : 'bg-white focus:ring-2 focus:ring-blue-500'
                    }
                            `}
                >{["AM", "PM"].map((ampmOpt) => {
                  const candidateMin = partsToMinutes({
                    ...endParts,
                    ampm: ampmOpt,
                  });
                  const disabledOpt = candidateMin <= startTotalMin;

                  return (
                    <option key={ampmOpt} value={ampmOpt} disabled={disabledOpt}>
                      {ampmOpt === "AM" ? "오전" : "오후"}
                    </option>
                  );
                })}
                </select>

                {/* 시 */}
                <select
                  disabled={isReadOnly}
                  value={endParts.hour}
                  onChange={(e) => {
                    const updated = { ...endParts, hour: e.target.value };
                    const newTime = partsToTime24(updated);
                    setFormData({ ...formData, endTime: newTime });
                  }}
                  className={`
          basis-[36%]
          p-2.5 sm:p-3 border rounded-lg text-xs sm:text-sm 
          outline-none
          ${isReadOnly
                      ? 'bg-gray-50 text-gray-600 appearance-none cursor-default'
                      : 'bg-white focus:ring-2 focus:ring-blue-500'
                    }
        `}
                >
                  {TIME_HOURS_12.map((h) => {
                    const candidateMin = partsToMinutes({
                      ...endParts,
                      hour: h,
                    });
                    const disabledOpt = candidateMin <= startTotalMin;

                    return (
                      <option key={h} value={h} disabled={disabledOpt}>
                        {h}시
                      </option>
                    );
                  })}
                </select>

                {/* 분 */}
                <select
                  disabled={isReadOnly}
                  value={endParts.minute}
                  onChange={(e) => {
                    const updated = { ...endParts, minute: e.target.value };
                    const newTime = partsToTime24(updated);
                    setFormData({ ...formData, endTime: newTime });
                  }}
                  className={`
          basis-[36%]
          p-2.5 sm:p-3 border rounded-lg text-xs sm:text-sm 
          outline-none
          ${isReadOnly
                      ? 'bg-gray-50 text-gray-600 appearance-none cursor-default'
                      : 'bg-white focus:ring-2 focus:ring-blue-500'
                    }
        `}
                >
                  {TIME_MINUTES.map((m) => {
                    const candidateMin = partsToMinutes({
                      ...endParts,
                      minute: m,
                    });
                    const disabledOpt = candidateMin <= startTotalMin;

                    return (
                      <option key={m} value={m} disabled={disabledOpt}>
                        {m}분
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>


          {isOverlap && (
            <div className="flex items-start gap-2 bg-red-50 text-red-600 p-2.5 sm:p-3 rounded-lg text-xs sm:text-sm animate-pulse">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <div>
                <span className="font-bold">예약 불가:</span> 선택하신 시간대에 이미 예약된 일정이 있습니다.
              </div>
            </div>
          )}

          {/* 🔹 선택한 날짜/차량의 예약 가능 시간 안내 */}
          {!isReadOnly && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 sm:p-3 text-[14px] space-y-1">
              <div className="font-medium text-blue-800">
                {formatDate(selectedDate)} / 선택 차량 예약 현황
              </div>

              {sameDateBookings.length === 0 ? (
                <div className="text-blue-700">
                  아직 예약이 없습니다. 기본 운행시간(00:00~24:00) 전체가 신청 가능합니다.
                </div>
              ) : (
                <>
                  <div className="text-blue-800 mt-1 mb-0.5">이미 예약된 시간</div>
                  <div className="flex flex-wrap gap-1">
                    {sameDateBookings.map((b: any) => (
                      <span
                        key={b.id}
                        className="px-1.5 py-0.5 rounded-full bg-white text-blue-700 border border-blue-200"
                      >
                        {b.startTime}~{b.endTime}
                        {b.requester || b.userName
                          ? ` · ${b.requester || b.userName}`
                          : ""}
                      </span>
                    ))}
                  </div>

                  {availableRanges.length > 0 && (
                    <div className="mt-2 pt-1 border-t border-blue-100">
                      <div className="text-blue-800 mb-0.5">
                        예약 가능 시간대 (00:00~24:00 기준)
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {availableRanges.map((r, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white"
                          >
                            {r.start}~{r.end}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              출장 지역
            </label>
            <div className="relative">
              <MapPin
                className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3.5 text-gray-400"
                size={16}
              />
              <select
                value={formData.destination}
                disabled={isReadOnly}
                onChange={(e) =>
                  setFormData({ ...formData, destination: e.target.value })
                }
                className={`
        w-full pl-8 sm:pl-10 p-2.5 sm:p-3
        border rounded-lg text-xs sm:text-sm
        outline-none
        ${isReadOnly
                    ? 'bg-gray-100 text-gray-500 cursor-default appearance-none'
                    : 'bg-white focus:ring-2 focus:ring-blue-500'
                  }
      `}
              >
                <option value="">출장 지역을 선택하세요</option>
                <option value="관내(남양주/구리)">관내(남양주/구리)</option>
                <option value="관외">관외</option>
              </select>
            </div>
          </div>


          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              출장 목적
            </label>
            <div className="relative">
              <FileText className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="예: 클라이언트 미팅"
                value={formData.purpose}
                disabled={isReadOnly}
                onChange={(e) =>
                  setFormData({ ...formData, purpose: e.target.value })
                }
                className="w-full pl-8 sm:pl-10 p-2.5 sm:p-3 border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {isReadOnly && (
            <div className="text-xs sm:text-sm text-gray-500 bg-gray-50 border rounded-lg p-2.5 sm:p-3">
              <span className="text-red-500">다른 사용자가 신청한 배차 내역</span>입니다. 내용은 확인만 가능하며 수정할 수 없습니다.
            </div>
          )}

          {!isReadOnly && (
            <button
              type="submit"
              disabled={isOverlap || isSubmitting}
              className={`w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg text-white shadow-lg transition-all ${isOverlap || isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl'
                }`}
            >
              {formMode === 'edit'
                ? (isSubmitting ? '수정 중...' : '배차 수정하기')
                : (isSubmitting ? '신청 중...' : '배차 신청하기')}
            </button>
          )}

          {formMode === 'edit' && selectedBooking && selectedBooking.userId === user.uid && (
            <button
              type="button"
              onClick={handleDelete}
              className="
                w-full mt-2 sm:mt-3
                py-2.5 sm:py-3
                rounded-xl font-bold text-sm sm:text-base
                text-white bg-red-500 hover:bg-red-600
                shadow-md hover:shadow-lg
                transition-all
              "
            >
              이 배차 일정 삭제하기
            </button>
          )}
        </form>
      </div>
    );
  };

  // D. Month List View (Table)
  const renderMonthList = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    // ✅ 오늘 날짜 문자열 (YYYY-MM-DD)
    const todayStr = formatDate(new Date());
    const today = new Date();
    const isCurrentMonth =
      year === today.getFullYear() && month === today.getMonth()

    const monthBookings = bookings
      .filter((b) => {
        if (!b.date) return false;
        const [y, m] = b.date.split('-').map(Number);
        return y === year && m === month;
      })
      .sort((a, b) =>
        (a.date + a.startTime).localeCompare(b.date + b.startTime)
      );

    const filteredBookings = monthBookings.filter((b: any) =>
      vehicleFilter === 'all' ? true : b.vehicleId === vehicleFilter
    );

    const getVehicleLabel = (vehicleId: string) => {
      const v = VEHICLES.find((v) => v.id === vehicleId);
      return v ? `${v.number} (${v.name})` : vehicleId;
    };

    return (
      <div className="flex flex-col h-full">
        {/* 상단 제목 & 월 이동 버튼 */}
        <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4 bg-white shadow-sm">
          <div className="flex flex-col gap-1">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">
              {year}년 {month}월 배차 신청 목록
            </h2>

            {/* 🔹 차량 필터 버튼들 */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs">
              <span className="text-gray-500 mr-1">차량별 보기:</span>
              <button
                type="button"
                onClick={() => setVehicleFilter('all')}
                className={`
                  px-2 py-0.5 rounded-full border
                  ${vehicleFilter === 'all'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300'}
                `}
              >
                전체
              </button>
              <button
                type="button"
                onClick={() => setVehicleFilter('v1')}
                className={`
                  px-2 py-0.5 rounded-full border
                  ${vehicleFilter === 'v1'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-600 border-gray-300'}
                `}
              >
                티볼리
              </button>
              <button
                type="button"
                onClick={() => setVehicleFilter('v2')}
                className={`
                  px-2 py-0.5 rounded-full border
                  ${vehicleFilter === 'v2'
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-600 border-gray-300'}
                `}
              >
                카니발
              </button>
            </div>
          </div>

          {/* 월 이동 버튼 */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => changeMonth(-1)}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* 🔹 이번 달이 아닐 때만 “이번 달” 버튼 노출 */}
            {!isCurrentMonth && (
              <button
                onClick={goToCurrentMonth}
                className="
        px-2 sm:px-3 py-1
        text-[11px] sm:text-xs
        border rounded-full
        bg-white text-gray-700
        hover:bg-blue-50 hover:border-blue-400
      "
              >
                오늘
              </button>
            )}

            <button
              onClick={() => changeMonth(1)}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>


        </div>

        {/* 표 영역 */}
        <div className="flex-1 overflow-auto bg-white px-2 sm:px-4 md:px-6">
          <table className="min-w-full text-[11px] sm:text-xs md:text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                  운행날짜
                </th>
                <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                  신청차량
                </th>
                <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                  신청자
                </th>
                <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                  부서
                </th>
                <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                  운행시간(출발)
                </th>
                <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                  운행시간(도착)
                </th>
                <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                  출장지역
                </th>
                <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                  출장목적
                </th>
                <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                  운행일지
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}  // 🔹 컬럼 11개로 변경
                    className="px-3 py-8 text-center text-gray-400 text-xs sm:text-sm"
                  >
                    {vehicleFilter === 'all'
                      ? '해당 월의 배차 내역이 없습니다.'
                      : '선택한 차량의 배차 내역이 없습니다.'}
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b: any) => {
                  const isToday = b.date === todayStr;

                  // 운행 종료 시간이 현재보다 이전인지 확인
                  const bookingEnd = new Date(`${b.date}T${b.endTime}:00`);
                  const isFinished = bookingEnd < today;

                  // 🔹 해당 배차 건의 운행일지 찾기
                  const bookingLog = driveLogs.find(
                    (log: any) => log.bookingId === b.id
                  );
                  const hasLog = !!bookingLog;

                  // 🔹 운행키로수 / 현재 최종키로수 표시 값
                  let distanceDisplay = '-';

                  if (bookingLog && bookingLog.distanceKm != null) {
                    const distanceNum = Number(bookingLog.distanceKm);

                    if (!Number.isNaN(distanceNum)) {
                      if (distanceNum === 0) {
                        // ✅ 운행키로수가 0이면 "미운행" 표시
                        distanceDisplay = '미운행';
                      } else {
                        distanceDisplay = `${distanceNum.toLocaleString()} km`;
                      }
                    }
                  }

                  const finalKmDisplay =
                    bookingLog && bookingLog.finalKm != null
                      ? `${Number(bookingLog.finalKm).toLocaleString()} km`
                      : '-';

                  // 🔹 이미 운행일지가 있거나, 운행이 끝난 배차만 버튼 노출
                  const showLogButton = hasLog || isFinished;

                  return (
                    <tr
                      key={b.id}
                      onClick={() => openBookingForm(b)}
                      className={`
                        cursor-pointer
                        ${isToday ? 'bg-yellow-50 hover:bg-yellow-100' : 'hover:bg-gray-50'}
                      `}
                    >
                      {/* 운행날짜 */}
                      <td className="px-2 py-2 align-middle text-center whitespace-nowrap">
                        <span className={isToday ? 'font-bold text-blue-700' : ''}>
                          {b.date}
                        </span>
                        {isToday && (
                          <span className="ml-1 inline-block px-1.5 py-0.5 text-[10px] sm:text-[11px] rounded-full bg-red-100 text-red-600">
                            오늘
                          </span>
                        )}
                      </td>

                      {/* 신청차량 */}
                      <td className="px-2 py-2 align-middle text-center whitespace-nowrap">
                        <span
                          className={`
                            inline-flex items-center px-2 py-0.5 rounded-full 
                            text-[10px] sm:text-xs font-medium
                            ${b.vehicleId === 'v1'
                              ? 'bg-green-100 text-green-800'   // 티볼리
                              : b.vehicleId === 'v2'
                                ? 'bg-purple-100 text-purple-800' // 카니발
                                : 'bg-gray-100 text-gray-700'     // 기타
                            }
                          `}
                        >
                          {getVehicleLabel(b.vehicleId)}
                        </span>
                      </td>

                      {/* 신청자 */}
                      <td className="px-2 py-2 align-middle text-center whitespace-nowrap">
                        {b.requester || b.userName}
                      </td>

                      {/* 부서 */}
                      <td className="px-2 py-2 align-middle text-center whitespace-nowrap">
                        {b.department || '-'}
                      </td>

                      {/* 운행시간(출발) */}
                      <td className="px-2 py-2 align-middle text-center whitespace-nowrap">
                        {b.startTime}
                      </td>

                      {/* 운행시간(도착) */}
                      <td className="px-2 py-2 align-middle text-center whitespace-nowrap">
                        {b.endTime}
                      </td>

                      {/* 출장지역 */}
                      <td className="px-2 py-2 align-middle text-center">
                        {b.destination}
                      </td>

                      {/* 출장목적 */}
                      <td className="px-2 py-2 align-middle text-center">
                        {b.purpose}
                      </td>

                      {/* 운행일지 버튼 */}
                      <td className="px-2 py-2 align-middle text-center">
                        {showLogButton && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();       // 행 클릭으로 폼 열리는 것 방지
                              openDriveLogForm(b);       // 운행일지 화면으로 이동
                            }}
                            className={`
        px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold transition-all
        ${hasLog
                                // ✅ 수정: 심플한 회색 아웃라인 버튼
                                ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                                // ✅ 작성: 파란 배경에 흰 글씨로 강조
                                : 'border border-blue-600 bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                              }
      `}
                          >
                            {hasLog ? '수정' : '작성'}
                          </button>
                        )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };


  // E. 운행일지 작성 화면
  const renderDriveLogForm = () => {


    if (!selectedBooking) return null;

    const booking = selectedBooking;
    const dateStr = booking.date || formatDate(selectedDate);

    const prevKmRaw = getPrevFinalKm(booking.vehicleId, dateStr, booking.id);
    const prevKm = prevKmRaw != null ? prevKmRaw : null;

    const finalKmNum = Number(logForm.finalKm || 0);
    const distanceKm =
      prevKm != null && finalKmNum > prevKm ? finalKmNum - prevKm : 0;

    const vehicleLabel =
      VEHICLES.find((v) => v.id === booking.vehicleId)?.number || '';

    const isTivoli = booking.vehicleId === 'v1';
    const isCarnival = booking.vehicleId === 'v2';

    return (
      <div className="px-3 sm:px-4 md:px-6 py-4 md:py-6 max-w-5xl mx-auto bg-white min-h-full">
        {/* 상단 제목 */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setView(prevView)}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full text-gray-600"
            >
              <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
            </button>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold">운행일지 작성</h2>
          </div>
        </div>

        {/* 배차 기본 정보 요약 */}
        <div className="bg-gray-50 border rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 text-[11px] sm:text-xs md:text-sm space-y-1.5">
          <div>
            <span className="font-semibold text-gray-700">운행날짜 : </span>
            {dateStr}
          </div>
          <div>
            <span className="font-semibold text-gray-700">운행차량 : </span>
            {`${vehicleLabel}(${"카니발"})`}
          </div>
          <div>
            <span className="font-semibold text-gray-700">운행시간 : </span>
            {booking.startTime} ~ {booking.endTime}
          </div>
          <div>
            <span className="font-semibold text-gray-700">출장지역 : </span>
            {booking.destination || '-'}
          </div>
          <div>
            <span className="font-semibold text-gray-700">사용목적 : </span>
            {booking.purpose || '-'}
          </div>
          <div>
            <span className="font-semibold text-gray-700">신청자 / 부서 : </span>
            {booking.requester || booking.userName || '-'}
            {booking.department && ` (${booking.department})`}
          </div>
        </div>

        {/* 운행일지 입력 폼 */}
        <form onSubmit={handleLogSubmit} className="space-y-4 sm:space-y-6">
          {/* 출발지 / 경유지 / 최종도착지 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                출발지
              </label>
              <input
                type="text"
                value={logForm.from}
                onChange={(e) => setLogForm({ ...logForm, from: e.target.value })}
                placeholder="예) 다남프라자"
                className="w-full p-2.5 sm:p-3 border rounded-lg text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-red-500 mb-1">
                경유지
              </label>
              <input
                type="text"
                value={logForm.via}
                onChange={(e) => setLogForm({ ...logForm, via: e.target.value })}
                placeholder="예) 남양주시청"
                className="w-full p-2.5 sm:p-3 border rounded-lg text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-red-500 mb-1">
                최종 도착지
              </label>
              <input
                type="text"
                value={logForm.to}
                onChange={(e) => setLogForm({ ...logForm, to: e.target.value })}
                placeholder="예) 다남프라자"
                className="w-full p-2.5 sm:p-3 border rounded-lg text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 키로수 영역 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {/* 이전 최종키로수 (읽기 전용) */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                이전 최종키로수
              </label>
              <input
                type="text"
                readOnly
                value={
                  prevKm != null
                    ? `${prevKm.toLocaleString()} km`
                    : '이전 운행 기록 없음'
                }
                className="w-full p-2.5 sm:p-3 border rounded-lg text-xs sm:text-sm bg-gray-50 text-gray-600"
              />
            </div>

            {/* 현재 최종키로수 (입력 가능) */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-red-500 mb-1">
                현재 최종키로수
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={logForm.finalKm}
                  onChange={(e) =>
                    setLogForm({ ...logForm, finalKm: e.target.value })
                  }
                  placeholder="숫자만 입력"
                  className="flex-1 p-2.5 sm:p-3 border rounded-lg text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs sm:text-sm text-gray-500">km</span>
              </div>
            </div>

            {/* 운행키로수 (자동 계산, 수정 불가) */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                운행키로수 (자동)
              </label>
              <input
                type="text"
                readOnly
                value={
                  logForm.finalKm && prevKm != null
                    ? `${distanceKm.toLocaleString()} km`
                    : ''
                }
                placeholder="현재 최종키로수 입력하세요"
                className="w-full p-2.5 sm:p-3 border rounded-lg text-xs sm:text-sm bg-gray-50 text-gray-700"
              />
            </div>
          </div>

          {/* 사용목적 / 운전자 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                사용 목적
              </label>
              <input
                type="text"
                value={logForm.purpose}
                onChange={(e) =>
                  setLogForm({ ...logForm, purpose: e.target.value })
                }
                placeholder="예) 회의"
                className="w-full p-2.5 sm:p-3 border rounded-lg text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                운전자 / 동승자
              </label>
              <input
                type="text"
                value={logForm.driver}
                onChange={(e) =>
                  setLogForm({ ...logForm, driver: e.target.value })
                }
                placeholder="예) 운전자1, 동승자1"
                className="w-full p-2.5 sm:p-3 border rounded-lg text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 이중주차여부 / 특이사항 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-red-500 mb-1">
                이중주차 여부 (민우 전달 필수)
              </label>
              <select
                value={logForm.doubleParking}
                onChange={(e) =>
                  setLogForm({ ...logForm, doubleParking: e.target.value })
                }
                className="w-full p-2.5 sm:p-3 border rounded-lg text-xs sm:text-sm outline-none bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">선택하세요</option>
                {isCarnival ? (
                  // 🚙 카니발(v2): 일반주차 / 이중주차(기어중립)만
                  <>
                    <option value="일반주차">일반주차</option>
                    <option value="이중주차(기어중립)">이중주차(기어중립)</option>
                  </>
                ) : (
                  // 🚗 티볼리(v1) 및 기타 차량: 기존 옵션 유지
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
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                특이사항 (경고등 / 주유 등)
              </label>
              <input
                type="text"
                value={logForm.note}
                onChange={(e) =>
                  setLogForm({ ...logForm, note: e.target.value })
                }
                placeholder="예) 엔진 경고등 점등, 주유 필요 등"
                className="w-full p-2.5 sm:p-3 border rounded-lg text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>



          <button
            type="submit"
            className="w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
          >
            운행일지 저장
          </button>
        </form>
      </div>
    );
  };

  // ⭐ 새로 추가: 로그인한 사용자 기준 월별 배차 + 운행일지 요약 화면
  const renderUserSummary = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    const today = new Date();
    const todayStr = formatDate(today);
    const isCurrentMonth =
      year === today.getFullYear() &&
      currentDate.getMonth() === today.getMonth();

    const getVehicleLabel = (vehicleId: string) => {
      const v = VEHICLES.find((v) => v.id === vehicleId);
      return v ? `${v.number} (${v.name})` : vehicleId;
    };

    // 이 유저가 신청한 해당 월 배차
    const monthMyBookings = bookings
      .filter((b: any) => {
        if (!b.date) return false;
        const [y, m] = b.date.split('-').map(Number);
        if (y !== year || m !== month) return false;
        return b.userId === user.uid;
      })
      .sort((a: any, b: any) =>
        (a.date + a.startTime).localeCompare(b.date + b.startTime)
      );

    const filteredMyBookings = monthMyBookings.filter((b: any) =>
      vehicleFilter === 'all' ? true : b.vehicleId === vehicleFilter
    );

    // 이 유저와 관련된 해당 월 운행일지
    const monthMyLogs = driveLogs
      .filter((log: any) => {
        if (!log.date) return false;
        const [y, m] = String(log.date).split('-').map(Number);
        if (y !== year || m !== month) return false;

        const booking = bookings.find((b: any) => b.id === log.bookingId);
        if (!booking) return false;
        return booking.userId === user.uid;
      })
      .sort((a: any, b: any) =>
        ((a.date || '') + (a.createdAt || '')).localeCompare(
          (b.date || '') + (b.createdAt || '')
        )
      );

    const filteredMyLogs = monthMyLogs.filter((log: any) =>
      vehicleFilter === 'all' ? true : log.vehicleId === vehicleFilter
    );

    return (
      <div className="flex flex-col h-full">
        {/* 상단 제목 + 월 이동 + 차량 필터 */}
        <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4 bg-white shadow-sm">
          <div className="flex flex-col gap-1">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">
              {year}년 {month}월 내 이용 내역
            </h2>
            <p className="text-[11px] sm:text-xs text-gray-500">
              {user.displayName || user.email} 님의 배차 신청 및 운행일지입니다.
            </p>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs mt-1">
              <span className="text-gray-500 mr-1">차량별 보기:</span>
              <button
                type="button"
                onClick={() => setVehicleFilter('all')}
                className={`
                  px-2 py-0.5 rounded-full border
                  ${vehicleFilter === 'all'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300'}
                `}
              >
                전체
              </button>
              <button
                type="button"
                onClick={() => setVehicleFilter('v1')}
                className={`
                  px-2 py-0.5 rounded-full border
                  ${vehicleFilter === 'v1'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-600 border-gray-300'}
                `}
              >
                티볼리
              </button>
              <button
                type="button"
                onClick={() => setVehicleFilter('v2')}
                className={`
                  px-2 py-0.5 rounded-full border
                  ${vehicleFilter === 'v2'
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-600 border-gray-300'}
                `}
              >
                카니발
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => changeMonth(-1)}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {!isCurrentMonth && (
              <button
                onClick={goToCurrentMonth}
                className="
                  px-2 sm:px-3 py-1
                  text-[11px] sm:text-xs
                  border rounded-full
                  bg-white text-gray-700
                  hover:bg-blue-50 hover:border-blue-400
                "
              >
                오늘
              </button>
            )}

            <button
              onClick={() => changeMonth(1)}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* 내용: 위 배차 목록, 아래 운행일지 목록 */}
        <div className="flex-1 overflow-auto bg-white px-2 sm:px-4 md:px-6 pb-6 space-y-6 sm:space-y-8">
          {/* 1) 내 배차 신청 목록 */}
          <section className="pt-4">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2 sm:mb-3">
              내 배차 신청 내역
            </h3>
            <table className="min-w-full text-[11px] sm:text-xs md:text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                    운행날짜
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                    신청차량
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                    운행시간(출발)
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                    운행시간(도착)
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                    출장지역
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                    출장목적
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                    운행일지
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                    삭제
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMyBookings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-3 py-8 text-center text-gray-400 text-xs sm:text-sm"
                    >
                      해당 월에 신청한 배차 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredMyBookings.map((b: any) => {
                    const isToday = b.date === todayStr;

                    const bookingEnd = new Date(`${b.date}T${b.endTime}:00`);
                    const isFinished = bookingEnd < today;

                    const bookingLog = driveLogs.find(
                      (log: any) => log.bookingId === b.id
                    );
                    const hasLog = !!bookingLog;

                    const showLogButton = hasLog || isFinished;

                    return (
                      <tr
                        key={b.id}
                        onClick={() => openBookingForm(b)}
                        className={`
                          cursor-pointer
                          ${isToday ? 'bg-yellow-50 hover:bg-yellow-100' : 'hover:bg-gray-50'}
                        `}
                      >
                        <td className="px-2 py-2 text-center whitespace-nowrap">
                          <span className={isToday ? 'font-bold text-blue-700' : ''}>
                            {b.date}
                          </span>
                          {isToday && (
                            <span className="ml-1 inline-block px-1.5 py-0.5 text-[10px] sm:text-[11px] rounded-full bg-red-100 text-red-600">
                              오늘
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-center whitespace-nowrap">
                          <span
                            className={`
                              inline-flex items-center px-2 py-0.5 rounded-full 
                              text-[10px] sm:text-xs font-medium
                              ${b.vehicleId === 'v1'
                                ? 'bg-green-100 text-green-800'
                                : b.vehicleId === 'v2'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-gray-100 text-gray-700'}
                            `}
                          >
                            {getVehicleLabel(b.vehicleId)}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center whitespace-nowrap">
                          {b.startTime}
                        </td>
                        <td className="px-2 py-2 text-center whitespace-nowrap">
                          {b.endTime}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {b.destination}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {b.purpose}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {showLogButton && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDriveLogForm(b, 'user');
                              }}
                              className={`
                                px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold transition-all
                                ${hasLog
                                  ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                                  : 'border border-blue-600 bg-blue-600 text-white shadow-sm hover:bg-blue-700'}
                              `}
                            >
                              {hasLog ? '수정' : '작성'}
                            </button>
                          )}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMyBooking(b);
                            }}
                            className="
      px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold
      border border-red-300 text-red-600 bg-white
      hover:bg-red-50 transition-all
    "
                          >
                            삭제
                          </button>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </section>

          {/* 2) 내 운행일지 목록 */}
          <section className="pt-2 border-t border-gray-200">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2 sm:mb-3 mt-3">
              내 운행일지
            </h3>
            <table className="min-w-full text-[11px] sm:text-xs md:text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                    운행날짜
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                    차량
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                    운행거리
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                    현재 최종키로수
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                    구간(출발 → 도착)
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                    이중주차
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                    운행일지
                  </th>
                  <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                    삭제
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMyLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-3 py-8 text-center text-gray-400 text-xs sm:text-sm"
                    >
                      해당 월의 운행일지가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredMyLogs.map((log: any) => {
                    const isToday = log.date === todayStr;
                    const booking = bookings.find((b: any) => b.id === log.bookingId);

                    let distanceDisplay = '-';
                    if (log.distanceKm != null) {
                      const n = Number(log.distanceKm);
                      if (!Number.isNaN(n)) {
                        distanceDisplay =
                          n === 0 ? '미운행' : `${n.toLocaleString()} km`;
                      }
                    }

                    const finalKmDisplay =
                      log.finalKm != null
                        ? `${Number(log.finalKm).toLocaleString()} km`
                        : '-';

                    const canOpenLogForm = !!booking;

                    return (
                      <tr
                        key={log.id}
                        className={`
                          ${canOpenLogForm ? 'cursor-pointer' : ''}
                          ${isToday ? 'bg-yellow-50 hover:bg-yellow-100' : 'hover:bg-gray-50'}
                        `}
                        onClick={() => {
                          if (!booking) return;
                          openDriveLogForm(booking, 'user');
                        }}
                      >
                        <td className="px-2 py-2 text-center whitespace-nowrap">
                          <span className={isToday ? 'font-bold text-blue-700' : ''}>
                            {log.date}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center whitespace-nowrap">
                          <span
                            className={`
                              inline-flex items-center px-2 py-0.5 rounded-full 
                              text-[10px] sm:text-xs font-medium
                              ${log.vehicleId === 'v1'
                                ? 'bg-green-100 text-green-800'
                                : log.vehicleId === 'v2'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-gray-100 text-gray-700'}
                            `}
                          >
                            {getVehicleLabel(log.vehicleId)}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center whitespace-nowrap">
                          {distanceDisplay}
                        </td>
                        <td className="px-2 py-2 text-center whitespace-nowrap">
                          {finalKmDisplay}
                        </td>
                        <td className="px-2 py-2">
                          {log.from || '미입력'}{' '}
                          <span className="text-gray-400">→</span>{' '}
                          {log.to || booking?.destination || '미입력'}
                        </td>
                        <td className="px-2 py-2 text-center whitespace-nowrap">
                          {log.doubleParking || '-'}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {canOpenLogForm ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDriveLogForm(booking!, 'user');
                              }}
                              className="
                                px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold
                                border border-gray-300 bg-white text-gray-700
                                hover:bg-gray-100 transition-all
                              "
                            >
                              보기/수정
                            </button>
                          ) : (
                            <span className="text-gray-400 text-[10px] sm:text-xs">
                              원본 배차 삭제됨
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMyBooking(b);
                            }}
                            className="
      px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold
      border border-red-300 text-red-600 bg-white
      hover:bg-red-50 transition-all
    "
                          >
                            삭제
                          </button>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    );
  };

  // D-2. 운행일지 월별 목록
  const renderLogsList = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    const today = new Date();
    const todayStr = formatDate(today);
    const isCurrentMonth =
      year === today.getFullYear() &&
      currentDate.getMonth() === today.getMonth();

    // 선택된 월의 운행일지만 필터
    const monthLogs = driveLogs
      .filter((log: any) => {
        if (!log.date) return false;
        const [y, m] = String(log.date).split('-').map(Number);
        return y === year && m === month;
      })
      .sort((a: any, b: any) =>
        ((a.date || '') + (a.createdAt || '')).localeCompare(
          (b.date || '') + (b.createdAt || '')
        )
      );

    // 차량 필터 적용
    const filteredLogs = monthLogs.filter((log: any) =>
      vehicleFilter === 'all' ? true : log.vehicleId === vehicleFilter
    );

    const getVehicleLabel = (vehicleId: string) => {
      const v = VEHICLES.find((v) => v.id === vehicleId);
      return v ? `${v.number} (${v.name})` : vehicleId;
    };

    return (
      <div className="flex flex-col h-full">
        {/* 상단 제목 & 월 이동 버튼 */}
        <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4 bg-white shadow-sm">
          <div className="flex flex-col gap-1">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">
              {year}년 {month}월 운행일지
            </h2>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs">
              <span className="text-gray-500 mr-1">차량별 보기:</span>
              <button
                type="button"
                onClick={() => setVehicleFilter('all')}
                className={`
                  px-2 py-0.5 rounded-full border
                  ${vehicleFilter === 'all'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300'
                  }
                `}
              >
                전체
              </button>
              <button
                type="button"
                onClick={() => setVehicleFilter('v1')}
                className={`
                  px-2 py-0.5 rounded-full border
                  ${vehicleFilter === 'v1'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-600 border-gray-300'
                  }
                `}
              >
                티볼리
              </button>
              <button
                type="button"
                onClick={() => setVehicleFilter('v2')}
                className={`
                  px-2 py-0.5 rounded-full border
                  ${vehicleFilter === 'v2'
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-600 border-gray-300'
                  }
                `}
              >
                카니발
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => changeMonth(-1)}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {!isCurrentMonth && (
              <button
                onClick={goToCurrentMonth}
                className="
                  px-2 sm:px-3 py-1
                  text-[11px] sm:text-xs
                  border rounded-full
                  bg-white text-gray-700
                  hover:bg-blue-50 hover:border-blue-400
                "
              >
                오늘
              </button>
            )}

            <button
              onClick={() => changeMonth(1)}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* 표 영역 */}
        <div className="flex-1 overflow-auto bg-white px-2 sm:px-4 md:px-6">
          <table className="min-w-full text-[11px] sm:text-xs md:text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                  운행날짜
                </th>
                <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                  차량
                </th>
                <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                  운전자
                </th>
                <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                  운행거리
                </th>
                <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                  현재 최종키로수
                </th>
                <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                  구간(출발 → 도착)
                </th>
                <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                  이중주차
                </th>
                <th className="px-2 sm:px-3 py-2 text-center font-medium text-gray-600">
                  운행일지
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-8 text-center text-gray-400 text-xs sm:text-sm"
                  >
                    해당 월의 운행일지가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: any) => {
                  const isToday = log.date === todayStr;

                  const booking = bookings.find(
                    (b: any) => b.id === log.bookingId
                  );

                  // 운행거리 표시 (0이면 "미운행")
                  let distanceDisplay = '-';
                  if (log.distanceKm != null) {
                    const n = Number(log.distanceKm);
                    if (!Number.isNaN(n)) {
                      distanceDisplay =
                        n === 0 ? '미운행' : `${n.toLocaleString()} km`;
                    }
                  }

                  const finalKmDisplay =
                    log.finalKm != null
                      ? `${Number(log.finalKm).toLocaleString()} km`
                      : '-';

                  const canOpenLogForm = !!booking;

                  return (
                    <tr
                      key={log.id}
                      className={`
                        ${canOpenLogForm ? 'cursor-pointer' : ''}
                        ${isToday
                          ? 'bg-yellow-50 hover:bg-yellow-100'
                          : 'hover:bg-gray-50'
                        }
                      `}
                      onClick={() => {
                        if (!booking) return;
                        openDriveLogForm(booking, 'logs');
                      }}
                    >
                      <td className="px-2 py-2 text-center whitespace-nowrap">
                        <span
                          className={
                            isToday ? 'font-bold text-blue-700' : ''
                          }
                        >
                          {log.date}
                        </span>
                      </td>

                      <td className="px-2 py-2 text-center whitespace-nowrap">
                        <span
                          className={`
                            inline-flex items-center px-2 py-0.5 rounded-full 
                            text-[10px] sm:text-xs font-medium
                            ${log.vehicleId === 'v1'
                              ? 'bg-green-100 text-green-800'
                              : log.vehicleId === 'v2'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-700'
                            }
                          `}
                        >
                          {getVehicleLabel(log.vehicleId)}
                        </span>
                      </td>

                      <td className="px-2 py-2 text-center whitespace-nowrap">
                        {log.driver ||
                          booking?.requester ||
                          booking?.userName ||
                          '-'}
                      </td>

                      <td className="px-2 py-2 text-center whitespace-nowrap">
                        {distanceDisplay}
                      </td>

                      <td className="px-2 py-2 text-center whitespace-nowrap">
                        {finalKmDisplay}
                      </td>

                      <td className="px-2 py-2">
                        {log.from || '미입력'}{' '}
                        <span className="text-gray-400">→</span>{' '}
                        {log.to || booking?.destination || '미입력'}
                      </td>

                      <td className="px-2 py-2 text-center whitespace-nowrap">
                        {log.doubleParking || '-'}
                      </td>

                      <td className="px-2 py-2 text-center">
                        {canOpenLogForm ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDriveLogForm(booking!, 'logs');
                            }}
                            className="
                              px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold
                              border border-gray-300 bg-white text-gray-700
                              hover:bg-gray-100 transition-all
                            "
                          >
                            보기/수정
                          </button>
                        ) : (
                          <span className="text-gray-400 text-[10px] sm:text-xs">
                            원본 배차 삭제됨
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };




  // --- Main Render Flow ---

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12-2 border-blue-600"></div>
      </div>
    );

  if (!user) return <LoginScreen onLogin={handleLogin} error={loginError} />;

  if (!isApproved) return <UnauthorizedScreen email={user.email} onLogout={handleLogout} />;

  const isLogView = view === 'logs' || view === 'log';
  // ⭐ user 뷰일 때 제목 변경
  const headerTitle = isLogView
    ? '차량운행일지'
    : view === 'user'
      ? '내 이용내역'
      : '차량신청현황';

  return (
    <div className="flex flex-col h-screen bg-gray-100 px-0 sm:px-2 md:px-4 lg:px-8">
      <Toaster
        position="top-center"
        richColors
        closeButton
      />
      <div className="flex flex-col h-full w-full max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-6xl mx-auto bg-gray-100 md:bg-gray-50 md:rounded-2xl md:shadow-2xl overflow-hidden relative my-2 sm:my-4 md:my-6 ">
        {/* Header */}
        <header className="bg-white text-gray-800 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between z-30 shadow-sm relative">
          {/* 왼쪽: 아이콘 + 제목 */}
          <div
            className="flex items-center gap-1.5 sm:gap-2 cursor-pointer"
            onClick={() => setView('calendar')}
          >
            <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg text-white">
              <Truck size={18} className="sm:w-5 sm:h-5" />
            </div>
            <h1 className="font-bold text-base sm:text-lg md:text-xl">
              {headerTitle}
            </h1>
          </div>

          {/* 가운데: 토글 */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <div
              className="
                flex items-center gap-1 sm:gap-2 
                bg-gray-100 px-1.5 py-1 
                rounded-full 
                text-[11px] sm:text-xs
              "
            >
              {/* 달력 보기 탭 */}
              <button
                type="button"
                onClick={() => setView('calendar')}
                className={`
                  px-2 py-0.5 rounded-full font-medium
                  ${view === 'calendar' || view === 'day' || view === 'form'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500'
                  }
                `}
              >
                달력 보기
              </button>

              {/* 월별 신청 목록 탭 */}
              <button
                type="button"
                onClick={() => setView('list')}
                className={`
                  px-2 py-0.5 rounded-full font-medium
                  ${view === 'list'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500'
                  }
                `}
              >
                월별 목록
              </button>

              {/* 운행일지 탭 */}
              <button
                type="button"
                onClick={() => setView('logs')}
                className={`
                  px-2 py-0.5 rounded-full font-medium
                  ${view === 'logs' || view === 'log'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500'
                  }
                `}
              >
                운행일지
              </button>
            </div>
          </div>

          {/* 오른쪽: 사용자 표시 + 로그아웃 */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* ⭐ user pill 클릭 시 내 이용내역으로 이동 */}
            <div
              className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm bg-gray-50 px-2.5 sm:px-3 py-1.5 rounded-full border max-w-[140px] sm:max-w-[170px] cursor-pointer hover:bg-blue-50 hover:border-blue-400"
              onClick={() => setView('user')}
            >
              <User size={12} className="sm:w-4 sm:h-4 text-gray-500" />
              <span className="font-medium text-gray-700 truncate">
                {user.displayName}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <LogOut size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </header>


        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-white md:bg-gray-50 relative">
          {view === 'calendar' && renderCalendar()}
          {view === 'day' && renderDayView()}
          {view === 'form' && renderForm()}
          {view === 'list' && renderMonthList()}
          {view === 'log' && renderDriveLogForm()}
          {view === 'logs' && renderLogsList()}
          {view === 'user' && renderUserSummary()}
        </main>


        {/* FAB */}
        {view !== 'form' && (
          <button
            onClick={handleFabClick}
            className="fixed sm:absolute bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-blue-700 hover:scale-110 transition-all z-50 group"
          >
            <Plus size={22} className="sm:w-7 sm:h-7 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        )}
      </div>
    </div>
  );

}
