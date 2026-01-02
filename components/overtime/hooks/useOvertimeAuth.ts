'use client';

import { useEffect, useMemo, useState } from 'react';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { auth, db, appId } from '@/lib/firebaseClient';
import { AllowedUserOvertimePermissions } from '@/types/overtime';

type AllowedUserDoc = {
  department?: string;
  name?: string;
  role?: string;
  overtimePermissions?: AllowedUserOvertimePermissions;
  overtimeApproverName?: string;
};

export type OvertimeUser = {
  uid: string;
  email?: string;
  displayName?: string;
  role?: string;
  department?: string;
  overtimePermissions: AllowedUserOvertimePermissions;
  overtimeApproverName?: string;
};

export const useOvertimeAuth = () => {
  const [user, setUser] = useState<OvertimeUser | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setIsApproved(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const userDocRef = doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'allowed_users',
          currentUser.email || ''
        );
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          setUser({
            uid: currentUser.uid,
            email: currentUser.email || undefined,
            displayName: currentUser.displayName || undefined,
            overtimePermissions: {},
          });
          setIsApproved(false);
          return;
        }

        const data = userDoc.data() as AllowedUserDoc;

        const basePermissions = data.overtimePermissions ?? {};
        const isAdmin = data.role === 'admin';

        setUser({
          uid: currentUser.uid,
          email: currentUser.email || undefined,
          displayName: data.name || currentUser.displayName || undefined,
          role: data.role,
          department: data.department,
          overtimePermissions: isAdmin
            ? { teamLead: true, deptHead: true, accounting: true }
            : basePermissions,
          overtimeApproverName:
            data.overtimeApproverName || data.name || currentUser.displayName || undefined,
        });
        setIsApproved(true);
      } catch (e) {
        console.error('Overtime auth check failed', e);
        setUser({
          uid: currentUser.uid,
          email: currentUser.email || undefined,
          displayName: currentUser.displayName || undefined,
          overtimePermissions: {},
        });
        setIsApproved(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const canApprove = useMemo(() => {
    if (!user) return { teamLead: false, deptHead: false, accounting: false };
    const p = user.overtimePermissions || {};
    return {
      teamLead: !!p.teamLead,
      deptHead: !!p.deptHead,
      accounting: !!p.accounting,
    };
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setLoginError(null);
    } catch (error) {
      console.error(error);
      setLoginError('로그인 중 오류가 발생했습니다.');
    }
  };

  const handleLogout = () => signOut(auth);

  return { user, isApproved, loading, loginError, canApprove, handleLogin, handleLogout } as const;
};

export default useOvertimeAuth;
