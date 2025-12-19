import { useState, useEffect } from 'react';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query } from 'firebase/firestore';
import { db, appId } from '../lib/firebase';
import type { Project } from '../types';

export const useProjects = (user: any, isClientView: boolean, clientProjectId?: string | null) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(clientProjectId || null);
    const [isSyncing, setIsSyncing] = useState(false);

    // Derived state
    const activeProject = projects.find(p => p.id === activeProjectId) || null;

    // Subscribe to projects
    useEffect(() => {
        if (!user || isClientView) return;

        const q = query(collection(db, 'app_data', appId, 'projects'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const source = snapshot.metadata.hasPendingWrites ? "Local" : "Server";
            console.log(`[DEBUG onSnapshot] Source: ${source}, Docs: ${snapshot.docs.length}`);

            const projectsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Project[];
            setProjects(projectsData);
        });

        return () => unsubscribe();
    }, [user, isClientView]);

    // Client view: Subscribe to single project
    useEffect(() => {
        if (!isClientView || !clientProjectId) return;

        const unsubscribe = onSnapshot(
            doc(db, 'app_data', appId, 'projects', clientProjectId),
            (docSnap) => {
                if (docSnap.exists()) {
                    setProjects([{ id: docSnap.id, ...docSnap.data() } as Project]);
                }
            }
        );

        return () => unsubscribe();
    }, [isClientView, clientProjectId]);

    // Update project
    const updateProject = async (data: Partial<Project>) => {
        if (!user) {
            alert("Error: Anda belum login. Silakan refresh dan login ulang.");
            return;
        }
        if (!activeProjectId) {
            alert("Error: Tidak ada proyek terpilih. Silakan pilih proyek dulu.");
            return;
        }

        // OPTIMISTIC UPDATE
        setProjects(prev => prev.map(p =>
            p.id === activeProjectId ? { ...p, ...data } : p
        ));

        setIsSyncing(true);
        try {
            // FIX: Sanitize data to remove 'undefined' values which Firestore rejects
            const cleanData = JSON.parse(JSON.stringify(data));
            await updateDoc(doc(db, 'app_data', appId, 'projects', activeProjectId), cleanData);
        } catch (e: any) {
            console.error('FIREBASE ERROR:', e);
            alert(`Gagal simpan: ${e?.message || 'Unknown error'}.`);
        }
        setIsSyncing(false);
    };

    // Create project
    const createProject = async (projectData: Omit<Project, 'id'>) => {
        if (!user) return null;
        setIsSyncing(true);
        try {
            const docRef = await addDoc(collection(db, 'app_data', appId, 'projects'), projectData);
            setIsSyncing(false);
            return docRef.id;
        } catch (e) {
            alert("Gagal membuat proyek.");
            console.error(e);
            setIsSyncing(false);
            return null;
        }
    };

    // Soft delete project
    const softDeleteProject = async (project: Project) => {
        if (!confirm(`Yakin ingin memindahkan proyek "${project.name}" ke Sampah?`)) return;
        try {
            await updateDoc(doc(db, 'app_data', appId, 'projects', project.id), { isDeleted: true });
        } catch (e) {
            alert("Gagal menghapus.");
        }
    };

    // Restore project
    const restoreProject = async (project: Project) => {
        try {
            await updateDoc(doc(db, 'app_data', appId, 'projects', project.id), { isDeleted: false });
        } catch (e) {
            alert("Gagal restore.");
        }
    };

    // Permanent delete project
    const permanentDeleteProject = async (project: Project) => {
        if (!confirm(`PERINGATAN: Proyek "${project.name}" akan dihapus SELAMANYA dan tidak bisa dikembalikan. Lanjutkan?`)) return;
        try {
            await deleteDoc(doc(db, 'app_data', appId, 'projects', project.id));
        } catch (e) {
            alert("Gagal hapus permanen.");
        }
    };

    return {
        projects,
        activeProject,
        activeProjectId,
        setActiveProjectId,
        isSyncing,
        setIsSyncing,
        updateProject,
        createProject,
        softDeleteProject,
        restoreProject,
        permanentDeleteProject,
    };
};

export default useProjects;
