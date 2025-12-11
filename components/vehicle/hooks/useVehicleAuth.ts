import { useEffect, useState } from 'react';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { auth, db, appId } from '@/lib/firebaseClient';

export const useVehicleAuth = () => {
    const [user, setUser] = useState<{ uid?: string; displayName?: string; email?: string; role?: string; } | null>(null);
    const [isApproved, setIsApproved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [defaultDept, setDefaultDept] = useState<string>('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setLoading(true);

                try {
                    const userDocRef = doc(
                        db,
                        'artifacts',
                        appId,
                        'public',
                        'data',
                        'allowed_users',
                        currentUser.email || '',
                    );
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                                setIsApproved(true);
                                const data = userDoc.data() as { department?: string; name?: string; role?: string; };

                                setUser({
                                    uid: currentUser.uid,
                                    email: currentUser.email || undefined,
                                    displayName: data.name || currentUser.displayName || undefined, 
                                    role: data.role || undefined
                                });

                                if (data && typeof data.department === 'string') {
                                setDefaultDept(data.department);
                                } else {
                                setDefaultDept('');
                                }
                            } else {
                                setUser({
                                    uid: currentUser.uid,
                                    email: currentUser.email || undefined,
                                    displayName: currentUser.displayName || undefined,
                                    role: undefined
                                });
                                setIsApproved(false);
                                setDefaultDept('');
                            }
                            } catch (e) {
                            console.error('Auth check failed', e);
                            setIsApproved(false);
                            setDefaultDept('');
                            
                            setUser({
                                uid: currentUser.uid,
                                email: currentUser.email || undefined,
                                displayName: currentUser.displayName || undefined,
                                role: undefined
                            });
                            } finally {
                            setLoading(false);
                            }
                        } else {
                            setUser(null);
                            setIsApproved(false);
                            setDefaultDept('');
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
            setLoginError('로그인 중 오류가 발생했습니다.');
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

export default useVehicleAuth;
