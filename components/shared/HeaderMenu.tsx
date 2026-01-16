'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';

const menuItems = [
  { href: '/', label: '홈' },
  { href: '/notice', label: '공지 게시판' },
  { href: '/vehicle', label: '배차신청' },
  { href: '/overtime', label: '연장근로 신청' },
  { href: '/vacation', label: '직원 휴가' },
  { href: '/chairman', label: '회장님 수행 및 행사' },
  { href: '/rental', label: '교육장 대관' },
  { href: '/staff', label: '직원 현황' },
] as const;

const isActivePath = (pathname: string | null, href: string) => {
  if (!pathname) return false;
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
};

export default function HeaderMenu() {
  const pathname = usePathname();

  return (
    <div className="relative">
      <details className="group">
        <summary
          className="
            list-none [&::-webkit-details-marker]:hidden
            inline-flex items-center gap-1.5
            rounded-full border border-gray-300 bg-white px-2.5 py-1.5
            text-xs sm:text-sm text-gray-600
            hover:bg-gray-50 hover:border-gray-400
            cursor-pointer
          "
        >
          <Menu className="w-4 h-4" />
          <span>메뉴</span>
        </summary>

        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 bg-white p-1 shadow-lg z-50">
          {menuItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-xs sm:text-sm transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </details>
    </div>
  );
}
