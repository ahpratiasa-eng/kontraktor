import { useState, useEffect } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot, collection, query } from 'firebase/firestore';
import { auth, db, googleProvider, signInAnonymously } from '../lib/firebase';
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
                        setAuthStatus('connected');
                    } else {
                        // Strict mode: Reject undefined users
                        await signOut(auth);
                        alert(`Email ${firebaseUser.email} tidak terdaftar.`);
                        setUser(null);
                        setUserRole(null);
                        setAuthStatus('connected'); // Connected but logged out effectively
                    }
                } catch (e) {
                    console.error('Failed to fetch user role:', e);
                    setAuthStatus('error');
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
        if (!user || isClientView || userRole !== 'super_admin') return;

        const unsubscribe = onSnapshot(
            query(collection(db, 'app_users')),
            (snapshot) => {
                const users = snapshot.docs.map(doc => ({ ...doc.data(), email: doc.id } as AppUser));
                setAppUsers(users);
            }
        );

        return () => unsubscribe();
    }, [user, isClientView, userRole]);

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

    // Pengawas restrictions - mencegah kecurangan
    const canViewKurvaS = () => ['super_admin', 'kontraktor', 'keuangan'].includes(userRole || '');
    const canViewInternalRAB = () => ['super_admin', 'kontraktor', 'keuangan'].includes(userRole || '');
    const canAddWorkers = () => ['super_admin', 'kontraktor'].includes(userRole || ''); // Pengawas ga boleh tambah tukang

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
        canViewKurvaS,
        canViewInternalRAB,
        canAddWorkers,
        setIsClientView,
    };
};

export default useAuth;
