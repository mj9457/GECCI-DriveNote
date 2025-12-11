// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { AlertTriangle } from 'lucide-react'; // 아이콘을 위해 추가 (선택)

export const metadata: Metadata = {
  title: '경기동부상공회의소 시스템',
  description: '사내 차량 운행 및 관리 시스템',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50">
        <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center min-[360px]:hidden">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-black/20">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
          <h2 className="text-xl font-bold mb-3">화면이 너무 좁습니다</h2>
          <p className="text-sm text-slate-300 leading-relaxed break-keep">
            원활한 시스템 사용을 위해
            <br />
            화면 너비를 <span className="text-blue-400 font-bold">360px 이상</span>으로 늘려주세요.
          </p>
        </div>

        <div className="hidden min-h-screen min-[360px]:block">{children}</div>
      </body>
    </html>
  );
}
