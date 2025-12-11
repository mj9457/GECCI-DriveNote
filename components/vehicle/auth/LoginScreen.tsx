// components/vehicle/LoginScreen.tsx
import { AlertCircle, Car } from 'lucide-react';

interface LoginScreenProps {
    onLogin: () => void;
    error: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, error }) => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8">
        <div className="bg-white px-6 py-8 sm:px-8 sm:py-10 rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md lg:max-w-lg text-center">
            <div className="bg-blue-100 p-4 rounded-full inline-block mb-4">
                <Car className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
            </div>
            <div className="flex flex-col items-center">
                <img
                    src="https://gecci.korcham.net/images/logo/logo_top/gecci_top_logo.png"
                    className="mb-4 sm:mb-5 w-32 sm:w-40 lg:w-44"
                    alt="GECCI Logo"
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
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    alt="Google"
                />
                Google 계정으로 로그인
            </button>
        </div>
    </div>
);
