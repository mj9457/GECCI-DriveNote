import type { Metadata } from 'next';

import OvertimeApp from '@/components/overtime/OvertimeApp';

export const metadata: Metadata = {
  title: '연장근로 신청',
  description: '연장근로 신청 및 승인 관리',
};

export default function OvertimePage() {
  return <OvertimeApp />;
}

