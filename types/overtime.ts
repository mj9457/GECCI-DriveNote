export type OvertimeApprovalRole = 'teamLead' | 'deptHead' | 'accounting';

export interface AllowedUserOvertimePermissions {
  teamLead?: boolean;
  deptHead?: boolean;
  accounting?: boolean;
}

export interface OvertimeApplication {
  id: string;

  monthKey: string; // "YYYY-MM" for querying
  applicationDate: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  minutes: number;

  applicantName: string;
  applicantEmail?: string;
  department: string;
  workDetails: string;
  eApprovalChecked: boolean;
  eApprovalCheckedAt?: string;
  eApprovalCheckedBy?: string;

  // Department approvals
  approverName?: string; // name shown in dept approval group
  teamLeadChecked: boolean;
  teamLeadCheckedAt?: string;
  teamLeadCheckedBy?: string;
  deptHeadChecked: boolean
  deptHeadCheckedAt?: string;
  deptHeadCheckedBy?: string;

  // Accounting
  substituteLeaveUsed: boolean;
  substituteLeaveNote?: string;
  substituteLeaveUsedAt?: string;
  substituteLeaveUsedBy?: string;

  createdAt: string;
  updatedAt?: string;
}
