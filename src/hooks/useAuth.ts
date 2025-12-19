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
                // Skip verification for anonymous users (client portal)
                if (firebaseUser.isAnonymous) {
                    setAuthStatus('connected');
                    return;
                }

                // For Google login users - verify they are in app_users
                setUser(firebaseUser);

                try {
                    const userDoc = await getDoc(doc(db, 'app_users', firebaseUser.email || ''));

                    if (userDoc.exists()) {
                        // User is registered - allow login
                        setUserRole(userDoc.data().role as UserRole);
                        setAuthStatus('connected');
                    } else {
                        // Check if this is the FIRST user ever (no users in app_users)
                        const { getDocs } = await import('firebase/firestore');
                        const allUsersSnapshot = await getDocs(collection(db, 'app_users'));

                        if (allUsersSnapshot.empty) {
                            // First user - auto-register as super_admin
                            const { setDoc } = await import('firebase/firestore');
                            await setDoc(doc(db, 'app_users', firebaseUser.email || ''), {
                                email: firebaseUser.email,
                                name: firebaseUser.displayName || 'Admin',
                                role: 'super_admin'
                            });
                            setUserRole('super_admin');
                            setAuthStatus('connected');
                            alert(`Selamat datang! Anda terdaftar sebagai Super Admin pertama.`);
                        } else {
                            // REJECT: Not registered and not the first user
                            console.warn(`Unauthorized login attempt: ${firebaseUser.email}`);
                            await signOut(auth);
                            setUser(null);
                            setUserRole(null);
                            setAuthStatus('connected');
                            alert(`⛔ Akses Ditolak!\n\nEmail ${firebaseUser.email} tidak terdaftar dalam sistem.\n\nHubungi Super Admin untuk mendapatkan akses.`);
                        }
                    }
                } catch (e) {
                    console.error('Auth check failed:', e);
                    await signOut(auth);
                    setUser(null);
                    setUserRole(null);
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

    const [impersonatedRole, setImpersonatedRole] = useState<UserRole | null>(null);

    // ... (existing code)

    // Helper to switch roles (only for dev/testing)
    const impersonateRole = (role: UserRole | null) => {
        setImpersonatedRole(role);
    };

    // Effective role is the impersonated one if set, otherwise the real one
    const effectiveRole = impersonatedRole || userRole;

    // Role check helpers
    const canAccessFinance = () => ['super_admin', 'kontraktor', 'keuangan'].includes(effectiveRole || '');
    const canAccessWorkers = () => ['super_admin', 'kontraktor', 'pengawas'].includes(effectiveRole || '');
    const canAccessManagement = () => effectiveRole === 'super_admin';
    const canEditProject = () => ['super_admin', 'kontraktor'].includes(effectiveRole || '');
    const canSeeMoney = () => ['super_admin', 'kontraktor', 'keuangan'].includes(effectiveRole || '');

    // Pengawas restrictions - mencegah kecurangan
    const canViewKurvaS = () => ['super_admin', 'kontraktor', 'keuangan'].includes(effectiveRole || '');
    const canViewInternalRAB = () => ['super_admin', 'kontraktor', 'keuangan'].includes(effectiveRole || '');
    const canAddWorkers = () => ['super_admin', 'kontraktor'].includes(effectiveRole || ''); // Pengawas ga boleh tambah tukang

    // NEW: Allow Pengawas to see the tab, but UI inside will be restricted
    const canViewProgressTab = () => ['super_admin', 'kontraktor', 'keuangan', 'pengawas'].includes(effectiveRole || '');

    return {
        user,
        userRole: effectiveRole, // Return effective role for general consumption
        originalRole: userRole,  // Return true role for checking admin status
        impersonateRole,         // Function to switch
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
        canViewProgressTab,
        setIsClientView,
    };
};

export default useAuth;
