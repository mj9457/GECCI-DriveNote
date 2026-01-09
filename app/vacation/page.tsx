import type { Metadata } from 'next';
import VacationApp from '@/components/vacation/VacationApp';

export const metadata: Metadata = {
  title: '휴가 일정 캘린더',
  description: '팀원들의 휴가 일정을 관리하는 전용 캘린더',
};

export default function VacationPage() {
  return <VacationApp />;
}
