'use client';

import { useEffect, useState } from 'react';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { auth, db, appId } from '@/lib/firebaseClient';

export type VacationUser = {
  uid: string;
  email?: string;
  displayName?: string;
  role?: string;
  department?: string;
};

export const useVacationAuth = () => {
  const [user, setUser] = useState<VacationUser | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [defaultDept, setDefaultDept] = useState<string>('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setIsApproved(false);
        setDefaultDept('');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const userDocRef = doc(
          db,
          'artifacts',
          appId as string,
          'public',
          'data',
          'allowed_users',
          currentUser.email || ''
        );
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data() as { department?: string; name?: string; role?: string };
          setIsApproved(true);
          setUser({
            uid: currentUser.uid,
            email: currentUser.email || undefined,
            displayName: data.name || currentUser.displayName || undefined,
            role: data.role || undefined,
            department: data.department || undefined,
          });
          setDefaultDept(data.department || '');
        } else {
          setUser({
            uid: currentUser.uid,
            email: currentUser.email || undefined,
            displayName: currentUser.displayName || undefined,
          });
          setIsApproved(false);
          setDefaultDept('');
        }
      } catch (error) {
        console.error('Vacation auth check failed', error);
        setUser({
          uid: currentUser.uid,
          email: currentUser.email || undefined,
          displayName: currentUser.displayName || undefined,
        });
        setIsApproved(false);
        setDefaultDept('');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setLoginError(null);
    } catch (error) {
      console.error(error);
      setLoginError('로그인에 실패했습니다.');
    }
  };

  const handleLogout = () => signOut(auth);

  return {
    user,
    isApproved,
    loading,
    loginError,
    defaultDept,
    handleLogin,
    handleLogout,
  } as const;
};

export default useVacationAuth;
