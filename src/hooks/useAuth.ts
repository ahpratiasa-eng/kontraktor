import { useState, useEffect } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot, collection, query } from 'firebase/firestore';
import { auth, db, googleProvider, appId, signInAnonymously } from '../lib/firebase';
import type { UserRole, AppUser } from '../types';

export const useAuth = () => {
    const [user, setUser] = useState<any | null>(null);
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [authStatus, setAuthStatus] = useState<'loading' | 'connected' | 'error'>('loading');
    const [isClientView, setIsClientView] = useState(false);
    const [appUsers, setAppUsers] = useState<AppUser[]>([]);

    // Check URL for client view mode
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const pId = params.get('projectId');
        const mode = params.get('mode');

        if (pId && mode === 'client') {
            setIsClientView(true);
            signInAnonymously(auth)
                .then(() => setAuthStatus('connected'))
                .catch((err) => {
                    console.error('Anonymous auth failed:', err);
                    setAuthStatus('error');
                });
        }
    }, []);

    // Auth state listener
    useEffect(() => {
        if (isClientView) return; // Skip for client view

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);

                // Check user role
                try {
                    const userDoc = await getDoc(doc(db, 'app_users', firebaseUser.email || ''));
                    if (userDoc.exists()) {
                        setUserRole(userDoc.data().role as UserRole);
                    } else {
                        // Default role for new users
                        setUserRole('kontraktor');
                    }
                    setAuthStatus('connected');
                } catch (e) {
                    console.error('Failed to fetch user role:', e);
                    setUserRole('kontraktor');
                    setAuthStatus('connected');
                }
            } else {
                setUser(null);
                setUserRole(null);
                setAuthStatus('connected');
            }
        });

        return () => unsubscribe();
    }, [isClientView]);

    // Subscribe to app users (for user management)
    useEffect(() => {
        if (!user || isClientView) return;

        const unsubscribe = onSnapshot(
            query(collection(db, 'app_users')),
            (snapshot) => {
                const users = snapshot.docs.map(doc => ({ ...doc.data(), email: doc.id } as AppUser));
                setAppUsers(users);
            }
        );

        return () => unsubscribe();
    }, [user, isClientView]);

    // Handlers
    const handleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (e) {
            console.error(e);
            alert('Login Gagal');
        }
    };

    const handleLogout = async () => {
        if (confirm("Keluar?")) {
            await signOut(auth);
        }
    };

    // Role check helpers
    const canAccessFinance = () => ['super_admin', 'kontraktor', 'keuangan'].includes(userRole || '');
    const canAccessWorkers = () => ['super_admin', 'kontraktor', 'pengawas'].includes(userRole || '');
    const canAccessManagement = () => userRole === 'super_admin';
    const canEditProject = () => ['super_admin', 'kontraktor'].includes(userRole || '');
    const canSeeMoney = () => ['super_admin', 'kontraktor', 'keuangan'].includes(userRole || '');

    return {
        user,
        userRole,
        authStatus,
        isClientView,
        appUsers,
        handleLogin,
        handleLogout,
        canAccessFinance,
        canAccessWorkers,
        canAccessManagement,
        canEditProject,
        canSeeMoney,
        setIsClientView,
    };
};

export default useAuth;
