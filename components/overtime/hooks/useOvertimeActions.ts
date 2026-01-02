'use client';

import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';

import { db, appId } from '@/lib/firebaseClient';
import { OvertimeApplication } from '@/types/overtime';

type CreatePayload = Omit<
  OvertimeApplication,
  | 'id'
  | 'teamLeadChecked'
  | 'deptHeadChecked'
  | 'substituteLeaveUsed'
  | 'teamLeadCheckedAt'
  | 'deptHeadCheckedAt'
  | 'substituteLeaveUsedAt'
  | 'teamLeadCheckedBy'
  | 'deptHeadCheckedBy'
  | 'substituteLeaveUsedBy'
  | 'createdAt'
  | 'updatedAt'
>;

export const useOvertimeActions = () => {
  const createApplication = async (payload: CreatePayload) => {
    const nowIso = new Date().toISOString();
    await addDoc(collection(db, 'artifacts', String(appId), 'public', 'data', 'overtime_applications'), {
      ...payload,
      teamLeadChecked: false,
      deptHeadChecked: false,
      substituteLeaveUsed: false,
      createdAt: nowIso,
    } satisfies Omit<OvertimeApplication, 'id'>);
  };

  const updateApplication = async (
    id: string,
    data: Partial<
      Pick<
        OvertimeApplication,
        | 'monthKey'
        | 'applicationDate'
        | 'startTime'
        | 'endTime'
        | 'minutes'
        | 'applicantName'
        | 'applicantEmail'
        | 'department'
        | 'workDetails'
        | 'eApprovalChecked'
      >
    >
  ) => {
    const ref = doc(db, 'artifacts', String(appId), 'public', 'data', 'overtime_applications', id);
    const nowIso = new Date().toISOString();
    await updateDoc(ref, {
      ...data,
      updatedAt: nowIso,
    });
  };

  const deleteApplication = async (id: string) => {
    const ref = doc(db, 'artifacts', String(appId), 'public', 'data', 'overtime_applications', id);
    await deleteDoc(ref);
  };

  const setEApprovalChecked = async (id: string, value: boolean, actor: { email?: string }) => {
    const ref = doc(db, 'artifacts', String(appId), 'public', 'data', 'overtime_applications', id);
    const nowIso = new Date().toISOString();
    await updateDoc(ref, {
      eApprovalChecked: value,
      eApprovalCheckedAt: value ? nowIso : null,
      eApprovalCheckedBy: value ? actor.email || null : null,
      updatedAt: nowIso,
    });
  };

  const toggleApproval = async (
    id: string,
    field: 'teamLeadChecked' | 'deptHeadChecked',
    value: boolean,
    actor: { email?: string; name?: string }
  ) => {
    const ref = doc(db, 'artifacts', String(appId), 'public', 'data', 'overtime_applications', id);
    const nowIso = new Date().toISOString();
    await updateDoc(ref, {
      [field]: value,
      [`${field}At`]: value ? nowIso : null,
      [`${field}By`]: value ? actor.email || null : null,
      ...(value && actor.name ? { approverName: actor.name } : {}),
      updatedAt: nowIso,
    });
  };

  const setAccountingSubstituteLeave = async (
    id: string,
    note: string,
    actor: { email?: string }
  ) => {
    const ref = doc(db, 'artifacts', String(appId), 'public', 'data', 'overtime_applications', id);
    const nowIso = new Date().toISOString();
    const used = note.trim().length > 0;
    await updateDoc(ref, {
      substituteLeaveUsed: used,
      substituteLeaveNote: note,
      substituteLeaveUsedAt: used ? nowIso : null,
      substituteLeaveUsedBy: used ? actor.email || null : null,
      updatedAt: nowIso,
    });
  };

  return {
    createApplication,
    updateApplication,
    deleteApplication,
    setEApprovalChecked,
    toggleApproval,
    setAccountingSubstituteLeave,
  } as const;
};

export default useOvertimeActions;
