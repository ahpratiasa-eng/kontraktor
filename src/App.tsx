import React, { useState, useEffect } from 'react';
import {
  Loader2
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import ProjectDetailView from './components/ProjectDetailView';
import ReportView from './components/ReportView';
import ModalManager from './components/ModalManager';
import LandingPage from './components/LandingPage';
import LandingEditor from './components/LandingEditor';
import AHSLibraryView from './components/AHSLibraryView';
import TrashBinView from './components/TrashBinView';
import UserManagementView from './components/UserManagementView';
import LandingSettingsView from './components/LandingSettingsView';

import {
  signInWithPopup, signOut, onAuthStateChanged
} from 'firebase/auth';

import {
  collection, doc, addDoc, updateDoc,
  deleteDoc, onSnapshot, query, setDoc, getDoc
} from 'firebase/firestore';

import { auth, db, googleProvider, appId, signInAnonymously } from './lib/firebase';
import type {
  Project, AppUser, RABItem, Transaction, Material,
  MaterialLog, Worker, TaskLog, UserRole, LandingPageConfig, AHSItem, PricingResource
} from './types';
import { calculateAHSTotal } from './types';
import defaultAHSData from './data/defaultAHS.json';
import defaultResourceData from './data/defaultResources.json';
import { compressImage } from './utils/imageHelper';
import { calculateProjectHealth, formatRupiah } from './utils/helpers';
import { loadDemoData as loadDemoDataUtil } from './utils/demoData';
import { useFormStates } from './hooks';

const App = () => {
  const [user, setUser] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [authStatus, setAuthStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [view, setView] = useState<'project-list' | 'project-detail' | 'report-view' | 'user-management' | 'trash-bin' | 'landing-settings' | 'ahs-library'>('project-list');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isClientView, setIsClientView] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [ahsItems, setAhsItems] = useState<AHSItem[]>([]);
  const [pricingResources, setPricingResources] = useState<PricingResource[]>([]);
  const [landingConfig, setLandingConfig] = useState<LandingPageConfig>({
    companyName: 'Guna Karya',
    tagline: 'Wujudkan Hunian Impian Anda',
    subtitle: 'Layanan konstruksi profesional untuk rumah tinggal, renovasi, dan pembangunan baru. Kualitas terjamin dengan harga transparan.',
    whatsappNumber: '6281234567890',
    instagramHandle: 'guna.karya',
    portfolioItems: []
  });
  const [showLandingEditor, setShowLandingEditor] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<any>(null);

  // Form States - now managed by useFormStates hook (~50 lines moved)
  const formStates = useFormStates();
  const {
    inputName, setInputName, inputClient, setInputClient, inputLocation, setInputLocation,
    inputOwnerPhone, setInputOwnerPhone, inputBudget, setInputBudget, inputStartDate, setInputStartDate,
    inputEndDate, setInputEndDate, rabCategory, setRabCategory, rabItemName, setRabItemName,
    rabUnit, setRabUnit, rabVol, setRabVol, rabPrice, setRabPrice, selectedRabItem, setSelectedRabItem,
    selectedAhsId, setSelectedAhsId, progressInput, setProgressInput, progressDate, setProgressDate,
    progressNote, setProgressNote, paymentAmount, setPaymentAmount, selectedWorkerId, setSelectedWorkerId,
    inputWorkerRole, setInputWorkerRole, inputWageUnit, setInputWageUnit, inputRealRate, setInputRealRate,
    inputMandorRate, setInputMandorRate, stockType, setStockType, stockQty, setStockQty,
    stockDate, setStockDate, stockNotes, setStockNotes,
    selectedMaterial, setSelectedMaterial,
    inputMaterialName, setInputMaterialName, inputMaterialUnit, setInputMaterialUnit,
    inputMinStock, setInputMinStock, inputInitialStock, setInputInitialStock,
    inputEmail, setInputEmail, inputRole, setInputRole, aiPrompt, setAiPrompt, isGeneratingAI, setIsGeneratingAI,
    attendanceDate, setAttendanceDate, attendanceData, setAttendanceData, evidencePhoto, setEvidencePhoto,
    evidenceLocation, setEvidenceLocation, isGettingLoc, setIsGettingLoc
  } = formStates;

  const canAccessManagement = () => userRole === 'super_admin';
  const canEditProject = () => ['super_admin', 'kontraktor'].includes(userRole || '');
  const canSeeMoney = () => ['super_admin', 'kontraktor', 'keuangan'].includes(userRole || '');
  const canAccessWorkers = () => ['super_admin', 'kontraktor', 'pengawas'].includes(userRole || '');
  const canAccessFinance = () => ['super_admin', 'kontraktor', 'keuangan'].includes(userRole || '');

  // Pengawas-specific restrictions (mencegah kecurangan)
  const canViewKurvaS = () => ['super_admin', 'kontraktor', 'keuangan'].includes(userRole || '');
  const canViewInternalRAB = () => ['super_admin', 'kontraktor', 'keuangan'].includes(userRole || '');
  const canAddWorkers = () => ['super_admin', 'kontraktor'].includes(userRole || ''); // Pengawas ga boleh tambah tukang

  // Effects
  // Effects
  useEffect(() => {
    // Check URL Params for Client View
    const params = new URLSearchParams(window.location.search);
    const pId = params.get('projectId');
    const mode = params.get('mode');

    if (pId && mode === 'client') {
      // Set up client view mode
      setActiveProjectId(pId);
      setView('project-detail');
      setIsClientView(true);

      // Use Firebase Anonymous Auth for client portal
      // This allows Firebase to recognize the user for security rules
      signInAnonymously(auth)
        .then((userCredential) => {
          setUser({
            uid: userCredential.user.uid,
            email: 'client@guest.com',
            displayName: 'Tamu Klien',
            isAnonymous: true
          } as any);
          setUserRole('client_guest');
          setAuthStatus('connected');
        })
        .catch((error) => {
          console.error('Anonymous auth failed:', error);
          // Fallback to dummy user if anonymous auth fails
          setUser({ uid: 'guest', email: 'client@guest.com', displayName: 'Tamu Klien' } as any);
          setUserRole('client_guest');
          setAuthStatus('connected');
        });
    }
  }, []);

  useEffect(() => {
    const u = onAuthStateChanged(auth, async (u) => {
      // Skip auth handling if we're in client view mode (guest access)
      if (isClientView) {
        setAuthStatus('connected');
        return;
      }

      if (u) {
        try {
          const d = await getDoc(doc(db, 'app_users', u.email!));
          if (d.exists()) {
            setUser(u);
            setUserRole(d.data().role);
            setAuthStatus('connected');
          } else {
            await signOut(auth);
            console.error('Email not authorized:', u.email);
            alert(`Email ${u.email} tidak terdaftar.`);
          }
        } catch (e) {
          setAuthStatus('error');
        }
      } else {
        setUser(null);
        setAuthStatus('connected');
      }
    });
    return () => u();
  }, [isClientView]);
  useEffect(() => { if (userRole === 'super_admin') return onSnapshot(query(collection(db, 'app_users')), (s) => setAppUsers(s.docs.map(d => d.data() as AppUser))); }, [userRole]);
  useEffect(() => { if (user) return onSnapshot(query(collection(db, 'app_data', appId, 'projects')), (s) => { const l = s.docs.map(d => { const x = d.data(); return { id: d.id, ...x, rabItems: Array.isArray(x.rabItems) ? x.rabItems : [], transactions: x.transactions || [], materials: x.materials || [], workers: x.workers || [], attendanceLogs: x.attendanceLogs || [], isDeleted: x.isDeleted || false } as Project; }); l.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()); setProjects(l); }); }, [user]);

  // Fetch Landing Page Config
  useEffect(() => {
    const defaultConfig: LandingPageConfig = {
      companyName: 'Guna Karya',
      tagline: 'Wujudkan Hunian Impian Anda',
      subtitle: 'Layanan konstruksi profesional untuk rumah tinggal, renovasi, dan pembangunan baru. Kualitas terjamin dengan harga transparan.',
      whatsappNumber: '6281234567890',
      instagramHandle: 'guna.karya',
      portfolioItems: []
    };

    const fetchLandingConfig = async () => {
      try {
        const docRef = doc(db, 'app_data', appId, 'settings', 'landing_page');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setLandingConfig(docSnap.data() as LandingPageConfig);
        } else {
          setLandingConfig(defaultConfig);
        }
      } catch (e) {
        console.error('Failed to fetch landing config:', e);
        // Use default config if fetch fails (e.g., permission denied for guests)
        setLandingConfig(defaultConfig);
      }
    };
    fetchLandingConfig();
  }, []);

  const saveLandingConfig = async (config: LandingPageConfig) => {
    try {
      const docRef = doc(db, 'app_data', appId, 'settings', 'landing_page');
      await setDoc(docRef, config);
      setLandingConfig(config);
    } catch (e) {
      console.error('Failed to save landing config:', e);
      throw e;
    }
  };

  // Library Functions
  useEffect(() => {
    const fetchLibraryData = async () => {
      try {
        // Fetch AHS
        const ahsRef = doc(db, 'app_data', appId, 'settings', 'ahs_library');
        const ahsSnap = await getDoc(ahsRef);
        if (ahsSnap.exists()) {
          setAhsItems(ahsSnap.data().items || []);
        } else {
          setAhsItems(getDefaultAHSData());
        }

        // Fetch Resources
        const resRef = doc(db, 'app_data', appId, 'settings', 'resources_library');
        const resSnap = await getDoc(resRef);
        if (resSnap.exists()) {
          setPricingResources(resSnap.data().items || []);
        } else {
          setPricingResources(defaultResourceData as PricingResource[]);
        }
      } catch (e) {
        console.error('Failed to fetch library data:', e);
      }
    };
    if (user) fetchLibraryData();
  }, [user]);

  const saveAhsItems = async (items: AHSItem[]) => {
    try {
      const docRef = doc(db, 'app_data', appId, 'settings', 'ahs_library');
      await setDoc(docRef, { items, updatedAt: new Date().toISOString() });
      setAhsItems(items);
    } catch (e) {
      console.error('Failed to save AHS:', e);
      alert('Gagal menyimpan AHS');
    }
  };

  const saveResources = async (items: PricingResource[]) => {
    try {
      const docRef = doc(db, 'app_data', appId, 'settings', 'resources_library');
      await setDoc(docRef, { items, updatedAt: new Date().toISOString() });
      setPricingResources(items);
    } catch (e) {
      console.error('Failed to save Resources:', e);
      alert('Gagal menyimpan Resources');
    }
  };

  // Import default AHS data from AHSP file
  const getDefaultAHSData = (): AHSItem[] => {
    return defaultAHSData as AHSItem[];
  };

  const handleResetAHSToDefault = async () => {
    try {
      const defaultData = getDefaultAHSData();
      await saveAhsItems(defaultData);
      alert('Library AHS berhasil direset ke data bawaan!');
    } catch (e) {
      console.error('Failed to reset AHS:', e);
      alert('Gagal reset Library AHS');
    }
  };

  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  // Helper Functions inside App
  const updateProject = async (data: Partial<Project>) => { if (!user || !activeProjectId) return; setIsSyncing(true); try { await updateDoc(doc(db, 'app_data', appId, 'projects', activeProjectId), data); } catch (e) { alert("Gagal simpan."); } setIsSyncing(false); };
  const handleLogin = async () => { try { await signInWithPopup(auth, googleProvider); } catch (e) { console.error(e); alert('Login Gagal'); } };
  const handleLogout = async () => { if (confirm("Keluar?")) await signOut(auth); setProjects([]); setView('project-list'); };
  const handleAddUser = async () => { if (!inputEmail || !inputName) return; try { await setDoc(doc(db, 'app_users', inputEmail), { email: inputEmail, name: inputName, role: inputRole }); alert("User berhasil ditambahkan!"); setShowModal(false); setInputEmail(''); setInputName(''); } catch (e) { alert("Gagal menambah user."); } };
  const handleDeleteUser = async (emailToDelete: string) => { if (emailToDelete === user?.email) return alert("Tidak bisa hapus diri sendiri!"); if (confirm(`Hapus akses ${emailToDelete}?`)) { try { await deleteDoc(doc(db, 'app_users', emailToDelete)); } catch (e) { alert("Gagal."); } } };

  const handleSaveRAB = () => {
    if (!activeProject) return;
    const isNewItem = !selectedRabItem;
    const newItem: RABItem = {
      id: selectedRabItem ? selectedRabItem.id : Date.now(),
      category: rabCategory,
      name: rabItemName,
      unit: rabUnit,
      volume: rabVol,
      unitPrice: rabPrice,
      progress: selectedRabItem?.progress || 0,
      isAddendum: selectedRabItem?.isAddendum || false,
      // Keep original lock date if editing, otherwise set new lock date for new items
      priceLockedAt: isNewItem ? new Date().toISOString() : (selectedRabItem?.priceLockedAt || new Date().toISOString()),
      // Keep original AHS reference if editing, otherwise use current selection
      ahsItemId: isNewItem ? (selectedAhsId || undefined) : (selectedRabItem?.ahsItemId || selectedAhsId || undefined)
    };
    const newItems = selectedRabItem ? activeProject.rabItems.map((i: RABItem) => i.id === newItem.id ? newItem : i) : [...activeProject.rabItems, newItem];
    updateProject({ rabItems: newItems });
    setShowModal(false);
    setRabItemName('');
    setRabVol(0);
    setRabPrice(0);
    setSelectedAhsId(null);  // Reset AHS selection
  };


  const deleteRABItem = (id: number) => { if (!activeProject || !confirm('Hapus item RAB ini?')) return; const newItems = activeProject.rabItems.filter((i: RABItem) => i.id !== id); updateProject({ rabItems: newItems }); };

  const handleUpdateProgress = () => { if (!activeProject || !selectedRabItem) return; const updatedRAB = activeProject.rabItems.map((item: RABItem) => item.id === selectedRabItem.id ? { ...item, progress: progressInput } : item); const newLog: TaskLog = { id: Date.now(), date: progressDate, taskId: selectedRabItem.id, previousProgress: selectedRabItem.progress, newProgress: progressInput, note: progressNote }; updateProject({ rabItems: updatedRAB, taskLogs: [newLog, ...(activeProject.taskLogs || [])] }); setShowModal(false); };
  const handleSaveProject = () => {
    if (!activeProject) {
      // Create new project with all required fields
      const newP: any = {
        name: inputName,
        client: inputClient,
        location: inputLocation,
        ownerPhone: inputOwnerPhone,
        budgetLimit: inputBudget,
        startDate: inputStartDate,
        endDate: inputEndDate,
        status: 'Berjalan',
        rabItems: [],
        transactions: [],
        workers: [],
        materials: [],
        materialLogs: [],
        tasks: [],
        attendanceLogs: [],
        attendanceEvidences: [],
        taskLogs: [],
        galleryItems: [],
        isDeleted: false
      };
      addDoc(collection(db, 'app_data', appId, 'projects'), newP);
      setShowModal(false);
    } else {
      updateProject({ name: inputName, client: inputClient, location: inputLocation, ownerPhone: inputOwnerPhone, budgetLimit: inputBudget, startDate: inputStartDate, endDate: inputEndDate }); setShowModal(false);
    }
  };

  const prepareEditProject = () => {
    if (!activeProject) return;
    setInputName(activeProject.name);
    setInputName(activeProject.name);
    setInputClient(activeProject.client);
    setInputLocation(activeProject.location);
    setInputOwnerPhone(activeProject.ownerPhone || '');
    setInputBudget(activeProject.budgetLimit);
    setInputStartDate(activeProject.startDate);
    setInputEndDate(activeProject.endDate);
    setModalType('editProject');
    setShowModal(true);
  };

  const prepareEditRABItem = (item: RABItem) => {
    setSelectedRabItem(item);
    setRabCategory(item.category);
    setRabItemName(item.name);
    setRabUnit(item.unit);
    setRabVol(item.volume);
    setRabPrice(item.unitPrice);
    setModalType('newRAB');
    setShowModal(true);
  };

  const handlePayWorker = () => { if (!activeProject || !selectedWorkerId || paymentAmount <= 0) return; const newTx: Transaction = { id: Date.now(), date: new Date().toISOString().split('T')[0], category: 'Upah Tukang', description: `Gaji Tukang`, amount: paymentAmount, type: 'expense', workerId: selectedWorkerId }; updateProject({ transactions: [newTx, ...activeProject.transactions] }); setShowModal(false); };
  const handleSaveWorker = () => { if (!activeProject) return; if (selectedWorkerId) { const updatedWorkers = activeProject.workers.map((w: Worker) => { if (w.id === selectedWorkerId) { return { ...w, name: inputName, role: inputWorkerRole as Worker['role'], wageUnit: inputWageUnit as Worker['wageUnit'], realRate: inputRealRate, mandorRate: inputMandorRate }; } return w; }); updateProject({ workers: updatedWorkers }); } else { const newWorker: Worker = { id: Date.now(), name: inputName, role: inputWorkerRole as Worker['role'], wageUnit: inputWageUnit as Worker['wageUnit'], realRate: inputRealRate, mandorRate: inputMandorRate }; updateProject({ workers: [...(activeProject.workers || []), newWorker] }); } setShowModal(false); };
  const handleEditWorker = (w: Worker) => { setSelectedWorkerId(w.id); setInputName(w.name); setInputWorkerRole(w.role); setInputWageUnit(w.wageUnit); setInputRealRate(w.realRate); setInputMandorRate(w.mandorRate); setModalType('newWorker'); setShowModal(true); };
  const handleDeleteWorker = (w: Worker) => { if (!activeProject) return; if (confirm(`Yakin hapus ${w.name}?`)) { const updatedWorkers = activeProject.workers.filter((worker: Worker) => worker.id !== w.id); updateProject({ workers: updatedWorkers }); } };
  const handleStockMovement = () => { if (!activeProject || !selectedMaterial || stockQty <= 0) return; const updatedMaterials = activeProject.materials.map((m: Material) => { if (m.id === selectedMaterial.id) return { ...m, stock: stockType === 'in' ? m.stock + stockQty : m.stock - stockQty }; return m; }); const newLog: MaterialLog = { id: Date.now(), materialId: selectedMaterial.id, date: stockDate, type: stockType, quantity: stockQty, notes: stockNotes || '-', actor: user?.displayName || 'User' }; updateProject({ materials: updatedMaterials, materialLogs: [newLog, ...(activeProject.materialLogs || [])] }); setShowModal(false); setStockQty(0); setStockNotes(''); };

  const handleSaveMaterial = () => {
    if (!activeProject || !inputMaterialName) return;
    const newMaterial: Material = {
      id: Date.now(),
      name: inputMaterialName,
      unit: inputMaterialUnit || 'pcs',
      stock: inputInitialStock,
      minStock: inputMinStock,
    };

    // Initial Stock Log
    let newLogs: MaterialLog[] = [];
    if (inputInitialStock > 0) {
      newLogs = [{
        id: Date.now(),
        materialId: newMaterial.id,
        date: new Date().toISOString().split('T')[0],
        type: 'in',
        quantity: inputInitialStock,
        notes: 'Stok Awal',
        actor: user?.displayName || 'System'
      }];
    }

    updateProject({
      materials: [...(activeProject.materials || []), newMaterial],
      materialLogs: [...(activeProject.materialLogs || []), ...newLogs]
    });
    setShowModal(false);
  };
  const handleSoftDeleteProject = async (p: Project) => { if (confirm(`Yakin ingin memindahkan proyek "${p.name}" ke Sampah?`)) { try { await updateDoc(doc(db, 'app_data', appId, 'projects', p.id), { isDeleted: true }); } catch (e) { alert("Gagal menghapus."); } } };
  const handleRestoreProject = async (p: Project) => { try { await updateDoc(doc(db, 'app_data', appId, 'projects', p.id), { isDeleted: false }); } catch (e) { alert("Gagal restore."); } };
  const handlePermanentDeleteProject = async (p: Project) => { if (confirm(`PERINGATAN: Proyek "${p.name}" akan dihapus SELAMANYA dan tidak bisa dikembalikan. Lanjutkan?`)) { try { await deleteDoc(doc(db, 'app_data', appId, 'projects', p.id)); } catch (e) { alert("Gagal hapus permanen."); } } };

  const handleGetLocation = () => { if (!navigator.geolocation) return alert("Browser tidak support GPS"); setIsGettingLoc(true); navigator.geolocation.getCurrentPosition((pos) => { setEvidenceLocation(`${pos.coords.latitude},${pos.coords.longitude}`); setIsGettingLoc(false); }, (err) => { console.error(err); alert("Gagal ambil lokasi."); setIsGettingLoc(false); }, { enableHighAccuracy: true }); };
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 800, 0.6); // 800px max, 60% quality
      setEvidencePhoto(compressed);
      handleGetLocation();
    } catch (e) {
      alert("Gagal memproses foto.");
      console.error(e);
    }
  };

  const handleReportToOwner = () => {
    if (!activeProject || !activeProject.ownerPhone) return alert("Nomor WA Owner belum diisi di Pengaturan Proyek!");

    const stats = calculateProjectHealth(activeProject);
    const clientLink = `${window.location.origin}?projectId=${activeProject.id}&mode=client`;

    let phone = activeProject.ownerPhone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.substring(1);

    const msg = `*Update Sore Proyek: ${activeProject.name}*\n📅 Tanggal: ${new Date().toLocaleDateString('id-ID')}\n\n📈 Progress Real: ${stats.realProgress.toFixed(2)}%\n⚠️ Status: ${stats.issues.length ? stats.issues.join(', ') : 'Aman'}\n\nPantau detail & foto di portal klien:\n${clientLink}\n\n_Dikirim otomatis jam 17.00 WIB_`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const saveAttendanceWithEvidence = async () => {
    if (!activeProject) return;
    if (!evidencePhoto) { alert("Wajib ambil foto bukti lapangan!"); return; }
    if (!evidenceLocation) { alert("Lokasi wajib terdeteksi!"); return; }

    const newLogs: any[] = [];
    let presentCount = 0;

    Object.keys(attendanceData).forEach(wId => {
      const status = attendanceData[Number(wId)].status;
      newLogs.push({ id: Date.now() + Math.random(), date: attendanceDate, workerId: Number(wId), status: status, note: '' });
      if (status === 'Hadir' || status === 'Lembur' || status === 'Setengah') presentCount++;
    });

    // Upload photo to Firebase Storage (if it's base64)
    let photoUrl = evidencePhoto;
    if (evidencePhoto.startsWith('data:image/')) {
      try {
        const { uploadAttendancePhoto } = await import('./utils/storageHelper');
        photoUrl = await uploadAttendancePhoto(evidencePhoto, activeProject.id, attendanceDate);
      } catch (e) {
        console.error('Failed to upload photo to storage, using base64 fallback:', e);
        // Fallback to base64 if upload fails
      }
    }

    let newEvidences = activeProject.attendanceEvidences || [];
    if (photoUrl || evidenceLocation) {
      newEvidences = [{ id: Date.now(), date: attendanceDate, photoUrl: photoUrl, location: evidenceLocation, uploader: user?.displayName || 'Unknown', timestamp: new Date().toISOString() }, ...newEvidences];
    }

    await updateProject({ attendanceLogs: [...activeProject.attendanceLogs, ...newLogs], attendanceEvidences: newEvidences });
    setShowModal(false);
    setEvidencePhoto(null); // Clear after save

    // WhatsApp Notification Logic (Versi KONTRAKTOR - Internal)
    if (confirm("Absensi tersimpan. Kirim laporan harian ke Grup/Bos (Kontraktor)?")) {
      const today = new Date().toISOString().split('T')[0];
      const todayMats = (activeProject.materialLogs || []).filter(m => m.date === today);
      const matText = todayMats.length > 0
        ? todayMats.map(m => `- ${activeProject.materials.find(x => x.id === m.materialId)?.name}: ${m.quantity} (${m.type})`).join('\n')
        : '- Nihil';

      const todayTx = (activeProject.transactions || []).filter(t => t.date === today);
      const income = todayTx.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
      const expense = todayTx.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);

      const msg = `*Laporan Harian Internal: ${activeProject.name}*\n📅 ${today}\n\n👷 Absensi: ${presentCount} Tukang\n\n📦 Material:\n${matText}\n\n💰 Cashflow Hari Ini:\nMasuk: ${formatRupiah(income)}\nKeluar: ${formatRupiah(expense)}\n\n📍 Lokasi: https://maps.google.com/?q=${evidenceLocation}\n\n_Laporan via Guna Karya_`;

      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };
  const getFilteredEvidence = () => { if (!activeProject || !activeProject.attendanceEvidences) return []; return activeProject.attendanceEvidences; }; // Simplified for now

  const openModal = (type: string) => {
    // Reset state for new project creation
    if (type === 'newProject') {
      setActiveProjectId(null);
      setInputName('');
      setInputClient('');
      setInputLocation('');
      setInputOwnerPhone('');
      setInputBudget(0);
      setInputStartDate('');
      setInputEndDate('');
    }
    // Reset RAB form for new item (not edit)
    if (type === 'newRAB' && !selectedRabItem) {
      setRabCategory('');
      setRabItemName('');
      setRabUnit('');
      setRabVol(0);
      setRabPrice(0);
    }
    // Reset worker form for new worker
    if (type === 'newWorker' && !selectedWorkerId) {
      setInputName('');
      setInputWorkerRole('Tukang');
      setInputWageUnit('Harian');
      setInputRealRate(0);
      setInputMandorRate(0);
    }
    // Reset material form
    if (type === 'newMaterial') {
      setInputMaterialName('');
      setInputMaterialUnit('pcs');
      setInputMinStock(10);
      setInputInitialStock(0);
    }
    setModalType(type);
    setShowModal(true);
  };

  const generateOfflineRAB = (prompt: string) => {
    const p = prompt.toLowerCase();
    const items = [];

    // 1. Detect Dimensions (e.g. 6x10)
    let width = 6, length = 10;
    const dimMatch = p.match(/(\d+)\s*x\s*(\d+)/);
    if (dimMatch) { width = parseInt(dimMatch[1]); length = parseInt(dimMatch[2]); }
    const area = width * length;

    // 2. Detect Floors
    let floors = 1;
    if (p.includes('lantai 2') || p.includes('2 lantai')) floors = 2;
    if (p.includes('lantai 3') || p.includes('3 lantai')) floors = 3;

    const totalArea = area * floors;
    const keliling = (width + length) * 2;
    const wallHeight = floors * 3.5;
    const wallArea = keliling * wallHeight;

    // 3. Generate Basic Items
    items.push({ category: 'A. PERSIAPAN', name: 'Pembersihan Lahan', unit: 'm2', volume: area, unitPrice: 15000 });
    items.push({ category: 'A. PERSIAPAN', name: 'Pemasangan Bowplank', unit: 'm1', volume: keliling + 4, unitPrice: 45000 });
    items.push({ category: 'B. TANAH & PONDASI', name: 'Galian Tanah Pondasi', unit: 'm3', volume: keliling * 0.6, unitPrice: 85000 });
    items.push({ category: 'B. TANAH & PONDASI', name: 'Pondasi Batu Kali', unit: 'm3', volume: keliling * 0.25, unitPrice: 950000 });
    items.push({ category: 'C. BETON', name: 'Sloof 15/20', unit: 'm3', volume: keliling * 0.03, unitPrice: 3500000 });
    if (floors > 1) {
      items.push({ category: 'C. BETON', name: 'Plat Lantai Beton', unit: 'm3', volume: (area * 0.12), unitPrice: 3800000 });
      items.push({ category: 'C. BETON', name: 'Kolom Praktis', unit: 'm3', volume: (floors * 12 * 3.5 * 0.02), unitPrice: 3500000 });
    }
    items.push({ category: 'D. DINDING', name: 'Pasangan Bata Merah', unit: 'm2', volume: wallArea * 0.85, unitPrice: 125000 });
    items.push({ category: 'D. DINDING', name: 'Plesteran Dinding', unit: 'm2', volume: wallArea * 1.7, unitPrice: 65000 });
    items.push({ category: 'D. DINDING', name: 'Acian Dinding', unit: 'm2', volume: wallArea * 1.7, unitPrice: 35000 });
    items.push({ category: 'E. LANTAI', name: 'Pasang Keramik 60x60', unit: 'm2', volume: totalArea, unitPrice: 200000 });
    items.push({ category: 'F. PLAFOND', name: 'Plafond Gypsum', unit: 'm2', volume: totalArea, unitPrice: 95000 });
    items.push({ category: 'G. PENGECATAN', name: 'Cat Dinding', unit: 'm2', volume: wallArea * 1.7, unitPrice: 25000 });
    items.push({ category: 'H. INSTALASI', name: 'Titik Lampu & Saklar', unit: 'titik', volume: 10 * floors, unitPrice: 250000 });

    return items;
  };

  const handleGenerateRAB = async () => {
    if (!aiPrompt) return alert("Masukkan deskripsi proyek dulu!");
    setIsGeneratingAI(true);

    const integrateWithAHS = (items: any[]) => {
      if (!ahsItems || ahsItems.length === 0) return items;

      return items.map((item: any) => {
        // Simple keyword matching
        const keywords = (item.name || '').toLowerCase().replace(/[^\w\s]/gi, '').split(' ').filter((k: string) => k.length > 3);
        let bestMatch: AHSItem | null = null;
        let maxScore = 0;

        ahsItems.forEach((ahs: AHSItem) => {
          let score = 0;
          const ahsName = (ahs.name || '').toLowerCase();

          // 1. Strict Category Match Boost
          if (item.category && ahs.category && item.category.split('.')[0] === ahs.category.split('.')[0]) {
            score += 2;
          }

          // 2. Keyword Match
          let matchedKeywords = 0;
          keywords.forEach((k: string) => {
            if (ahsName.includes(k)) matchedKeywords++;
          });
          score += matchedKeywords * 3;

          // Threshold & Selection
          if (score > maxScore && matchedKeywords >= 1) {
            maxScore = score;
            bestMatch = ahs;
          }
        });

        if (bestMatch) {
          const match = bestMatch as AHSItem;
          // console.log(`AI Match: ${item.name} -> ${match.name}`);
          return {
            ...item,
            name: match.name,
            unit: match.unit,
            unitPrice: calculateAHSTotal(match),
            ahsItemId: match.id
          };
        }
        return item;
      });
    };

    // Fallback Logic
    const runOffline = () => {
      const items = generateOfflineRAB(aiPrompt);
      const matchedItems = integrateWithAHS(items);
      const newItems = matchedItems.map((i: any) => ({ ...i, id: Date.now() + Math.random(), progress: 0, isAddendum: false }));
      if (activeProject) {
        updateProject({ rabItems: [...(activeProject.rabItems || []), ...newItems] });
        alert(`Mode Estimasi Cepat: Berhasil membuat ${newItems.length} item RAB (Offline Mode). Beberapa item mungkin telah disesuaikan dengan AHS.`);
        setShowModal(false);
      }
    };

    const apiKey = "AIzaSyB7ta6cVVnYp0JQMUSnv1rMSNZivr9_p4E";
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `Buatkan RAB konstruksi lengkap untuk: ${aiPrompt}. \nOutput JSON array of objects: {category, name, unit, volume, unitPrice}. \nGunakan Bahasa Indonesia. Gunakan harga standar Jakarta 2024. \nKategori harus urut abjad: A. PERSIAPAN, B. TANAH, C. STRUKTUR, D. DINDING, dll. HANYA JSON RAW tanpa markdown.` }] }] })
      });

      if (!response.ok) throw new Error("API Error");
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

      const items = JSON.parse(cleanJson);

      if (!Array.isArray(items)) throw new Error("Invalid Format");

      const matchedItems = integrateWithAHS(items);
      const newItems = matchedItems.map((i: any) => ({ ...i, id: Date.now() + Math.random(), progress: 0, isAddendum: false }));

      if (activeProject) {
        updateProject({ rabItems: [...(activeProject.rabItems || []), ...newItems] });
        alert(`Berhasil generate RAB! Beberapa item otomatis terhubung ke AHS.`);
        setShowModal(false);
      }
    } catch (e) {
      console.warn("Switching to offline generator:", e);
      runOffline();
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleImportRAB = (importedItems: any[]) => {
    if (!activeProject) return;
    const newItems = importedItems.map(item => ({
      id: Date.now() + Math.random(),
      category: item.Kategori || item.category || 'Uncategorized',
      name: item['Nama Item'] || item.name || 'Unnamed Item',
      unit: item.Satuan || item.unit || 'ls',
      volume: Number(item.Volume || item.volume) || 0,
      unitPrice: Number(item['Harga Satuan'] || item.unitPrice) || 0,
      progress: 0,
      isAddendum: false
    }));
    updateProject({ rabItems: [...(activeProject.rabItems || []), ...newItems] });
    alert(`Berhasil import ${newItems.length} item dari Excel!`);
    setShowModal(false);
  };

  // Demo Data - now uses utility function (~300 lines moved to utils/demoData.ts)
  const loadDemoData = () => loadDemoDataUtil(user, setIsSyncing);

  if (!user && authStatus !== 'loading' && !isClientView) return <LandingPage onLogin={handleLogin} config={landingConfig} />;
  if (authStatus === 'loading' && !isClientView) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      <style>{`@media print { body { background: white; } .print\\:hidden { display: none !important; } .print\\:break-inside-avoid { break-inside: avoid; } }`}</style>

      {/* SIDEBAR (Desktop Only) */}
      {/* SIDEBAR (Desktop Only) */}
      {!isClientView && (
        <Sidebar
          view={view}
          setView={setView}
          openModal={openModal}
          handleLogout={handleLogout}
          userRole={userRole}
        />
      )}

      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 ${!isClientView ? 'md:ml-64' : ''} flex flex-col relative pb-20 md:pb-0`}>

        {/* HEADER (Desktop: Offset left, Mobile: Full) */}
        {!isClientView && (
          <Header
            view={view}
            setView={setView}
            user={user}
            userRole={userRole}
            openModal={openModal}
            handleLogout={handleLogout}
            canAccessManagement={canAccessManagement()}
            canEditProject={canEditProject()}
          />
        )}

        {/* CONTENT */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">

          {/* TRASH BIN VIEW */}
          {/* TRASH BIN VIEW */}
          {view === 'trash-bin' && (
            <TrashBinView
              projects={projects}
              onRestore={handleRestoreProject}
              onDeletePermanent={handlePermanentDeleteProject}
              canAccessManagement={canAccessManagement()}
            />
          )}

          {/* USER MANAGEMENT VIEW */}
          {/* USER MANAGEMENT VIEW */}
          {view === 'user-management' && canAccessManagement() && (
            <UserManagementView
              appUsers={appUsers}
              currentUser={user}
              onDeleteUser={handleDeleteUser}
              onAddUser={() => openModal('addUser')}
            />
          )}

          {/* LANDING PAGE SETTINGS VIEW */}
          {/* LANDING PAGE SETTINGS VIEW */}
          {view === 'landing-settings' && canAccessManagement() && (
            <LandingSettingsView
              config={landingConfig}
              onEdit={() => setShowLandingEditor(true)}
            />
          )}

          {view === 'ahs-library' && (
            <main className="space-y-6">
              <AHSLibraryView
                ahsItems={ahsItems}
                onSave={saveAhsItems}
                resources={pricingResources}
                onSaveResources={saveResources}
                onResetToDefault={handleResetAHSToDefault}
              />
            </main>
          )}

          {view === 'project-list' && (
            <DashboardView
              user={user}
              projects={projects}
              setActiveProjectId={setActiveProjectId}
              setView={setView}
              isSyncing={isSyncing}
              loadDemoData={loadDemoData}
              canEditProject={canEditProject()}
              handleSoftDeleteProject={handleSoftDeleteProject}
            />
          )}

          {view === 'project-detail' && activeProject && (
            <ProjectDetailView
              canAccessFinance={canAccessFinance()}
              canAccessWorkers={canAccessWorkers()}
              canSeeMoney={canSeeMoney()}
              canEditProject={canEditProject()}
              canViewKurvaS={canViewKurvaS()}
              canViewInternalRAB={canViewInternalRAB()}
              canAddWorkers={canAddWorkers()}
              prepareEditProject={prepareEditProject}
              prepareEditRABItem={prepareEditRABItem}
              activeProject={activeProject}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isClientView={isClientView}
              userRole={userRole}
              setView={setView}
              updateProject={updateProject}
              openModal={openModal}
              setModalType={setModalType}
              setShowModal={setShowModal}
              setSelectedRabItem={setSelectedRabItem}
              setProgressInput={setProgressInput}
              setProgressDate={setProgressDate}
              setSelectedWorkerId={setSelectedWorkerId}
              setPaymentAmount={setPaymentAmount}
              setSelectedMaterial={setSelectedMaterial}
              deleteRABItem={deleteRABItem}
              handleEditWorker={handleEditWorker}
              handleDeleteWorker={handleDeleteWorker}
              handleReportToOwner={handleReportToOwner}
              ahsItems={ahsItems}
            />
          )}

          {/* Client View Loading/Error State */}
          {view === 'project-detail' && !activeProject && isClientView && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
              <h2 className="text-xl font-bold text-slate-800 mb-2">Memuat Data Proyek...</h2>
              <p className="text-slate-500 max-w-md">
                Mohon tunggu sebentar. Jika halaman ini tidak berubah dalam beberapa detik,
                link proyek mungkin tidak valid atau sudah kadaluarsa.
              </p>
            </div>
          )}


          {/* REPORT VIEW */}
          {view === 'report-view' && activeProject && (canSeeMoney() || isClientView) && (
            <ReportView
              activeProject={activeProject}
              setView={setView}
              isClientView={isClientView}
              canViewInternalRAB={canViewInternalRAB()}
            />
          )}
        </div>
      </div>

      <ModalManager
        modalType={modalType}
        setModalType={setModalType}
        showModal={showModal}
        setShowModal={setShowModal}
        handleEditProject={handleSaveProject}
        handleSaveRAB={handleSaveRAB}
        handleUpdateProgress={handleUpdateProgress}
        handlePayWorker={handlePayWorker}
        handleSaveWorker={handleSaveWorker}
        handleStockMovement={handleStockMovement}
        handleSaveMaterial={handleSaveMaterial}
        handleAddUser={handleAddUser}
        handleGenerateRAB={handleGenerateRAB}
        handleImportRAB={handleImportRAB}
        saveAttendanceWithEvidence={saveAttendanceWithEvidence}
        getFilteredEvidence={getFilteredEvidence}
        inputName={inputName} setInputName={setInputName}
        inputClient={inputClient} setInputClient={setInputClient}
        inputLocation={inputLocation} setInputLocation={setInputLocation}
        inputOwnerPhone={inputOwnerPhone} setInputOwnerPhone={setInputOwnerPhone}
        inputBudget={inputBudget} setInputBudget={setInputBudget}
        inputStartDate={inputStartDate} setInputStartDate={setInputStartDate}
        inputEndDate={inputEndDate} setInputEndDate={setInputEndDate}
        rabCategory={rabCategory} setRabCategory={setRabCategory}
        rabItemName={rabItemName} setRabItemName={setRabItemName}
        rabUnit={rabUnit} setRabUnit={setRabUnit}
        rabVol={rabVol} setRabVol={setRabVol}
        rabPrice={rabPrice} setRabPrice={setRabPrice}
        progressInput={progressInput} setProgressInput={setProgressInput}
        progressDate={progressDate} setProgressDate={setProgressDate}
        progressNote={progressNote} setProgressNote={setProgressNote}
        paymentAmount={paymentAmount} setPaymentAmount={setPaymentAmount}
        inputWorkerRole={inputWorkerRole} setInputWorkerRole={setInputWorkerRole}
        inputWageUnit={inputWageUnit} setInputWageUnit={setInputWageUnit}
        inputRealRate={inputRealRate} setInputRealRate={setInputRealRate}
        inputMandorRate={inputMandorRate} setInputMandorRate={setInputMandorRate}
        stockType={stockType} setStockType={setStockType}
        stockQty={stockQty} setStockQty={setStockQty}
        stockDate={stockDate} setStockDate={setStockDate}
        stockNotes={stockNotes} setStockNotes={setStockNotes}
        selectedMaterial={selectedMaterial}
        inputMaterialName={inputMaterialName} setInputMaterialName={setInputMaterialName}
        inputMaterialUnit={inputMaterialUnit} setInputMaterialUnit={setInputMaterialUnit}
        inputMinStock={inputMinStock} setInputMinStock={setInputMinStock}
        inputInitialStock={inputInitialStock} setInputInitialStock={setInputInitialStock}
        inputEmail={inputEmail} setInputEmail={setInputEmail}
        inputRole={inputRole} setInputRole={setInputRole}
        aiPrompt={aiPrompt} setAiPrompt={setAiPrompt}
        isGeneratingAI={isGeneratingAI}
        attendanceDate={attendanceDate} setAttendanceDate={setAttendanceDate}
        attendanceData={attendanceData} setAttendanceData={setAttendanceData}
        evidencePhoto={evidencePhoto}
        evidenceLocation={evidenceLocation}
        handlePhotoUpload={handlePhotoUpload}
        isGettingLoc={isGettingLoc}
        activeProject={activeProject}
        selectedRabItem={selectedRabItem}
        selectedWorkerId={selectedWorkerId}


        ahsItems={ahsItems}
        resources={pricingResources}
        selectedAhsId={selectedAhsId}
        setSelectedAhsId={setSelectedAhsId}
      />

      {/* LANDING PAGE EDITOR MODAL */}
      {showLandingEditor && landingConfig && (
        <LandingEditor
          config={landingConfig}
          onSave={saveLandingConfig}
          onClose={() => setShowLandingEditor(false)}
        />
      )}

      {/* MOBILE BOTTOM NAVIGATION */}
      <MobileNav
        view={view}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={userRole}
        isClientView={isClientView}
        canViewKurvaS={canViewKurvaS()}
      />

    </div>
  );
};

export default App;