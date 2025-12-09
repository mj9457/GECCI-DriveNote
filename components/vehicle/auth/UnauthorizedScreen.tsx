// components/vehicle/UnauthorizedScreen.tsx
import { AlertCircle } from 'lucide-react';

interface UnauthorizedScreenProps {
    email: string;
    onLogout: () => void;
}

export const UnauthorizedScreen: React.FC<UnauthorizedScreenProps> = ({
    email,
    onLogout,
}) => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="bg-white px-6 py-8 sm:px-8 sm:py-10 rounded-2xl shadow-lg w-full max-w-sm sm:max-w-md lg:max-w-lg text-center">
            <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                승인 대기 중
            </h2>
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
