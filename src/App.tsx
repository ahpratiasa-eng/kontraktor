import React, { useState, useEffect } from 'react';
import {
  Loader2, RotateCcw, ShieldCheck, UserPlus,
  Trash2, Palette
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
  MaterialLog, Worker, TaskLog, UserRole, LandingPageConfig, AHSItem
} from './types';
import { compressImage } from './utils/imageHelper';
import { calculateProjectHealth, formatRupiah } from './utils/helpers';

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

  // Form States (now managed centrally in App to pass to ModalManager)
  const [inputName, setInputName] = useState('');
  const [inputClient, setInputClient] = useState('');
  const [inputLocation, setInputLocation] = useState('');
  const [inputOwnerPhone, setInputOwnerPhone] = useState('');
  const [inputBudget, setInputBudget] = useState(0);
  const [inputStartDate, setInputStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [inputEndDate, setInputEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [rabCategory, setRabCategory] = useState('');
  const [rabItemName, setRabItemName] = useState('');
  const [rabUnit, setRabUnit] = useState('');
  const [rabVol, setRabVol] = useState(0);
  const [rabPrice, setRabPrice] = useState(0);
  const [selectedRabItem, setSelectedRabItem] = useState<RABItem | null>(null);

  const [progressInput, setProgressInput] = useState(0);
  const [progressDate, setProgressDate] = useState(new Date().toISOString().split('T')[0]);
  const [progressNote, setProgressNote] = useState('');

  const [paymentAmount, setPaymentAmount] = useState(0);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);

  const [inputWorkerRole, setInputWorkerRole] = useState('Tukang');
  const [inputWageUnit, setInputWageUnit] = useState('Harian');
  const [inputRealRate, setInputRealRate] = useState(0);
  const [inputMandorRate, setInputMandorRate] = useState(0);

  const [stockType, setStockType] = useState<'in' | 'out'>('in');
  const [stockQty, setStockQty] = useState(0);
  const [stockDate, setStockDate] = useState(new Date().toISOString().split('T')[0]);
  const [stockNotes, setStockNotes] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const [inputEmail, setInputEmail] = useState('');
  const [inputRole, setInputRole] = useState<UserRole>('pengawas');

  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<any>({});
  const [evidencePhoto, setEvidencePhoto] = useState<string | null>(null);
  const [evidenceLocation, setEvidenceLocation] = useState<string | null>(null);
  const [isGettingLoc, setIsGettingLoc] = useState(false);

  const canAccessManagement = () => userRole === 'super_admin';
  const canEditProject = () => ['super_admin', 'kontraktor'].includes(userRole || '');
  const canSeeMoney = () => ['super_admin', 'kontraktor', 'keuangan'].includes(userRole || '');
  const canAccessWorkers = () => ['super_admin', 'kontraktor', 'pengawas'].includes(userRole || '');
  const canAccessFinance = () => ['super_admin', 'kontraktor', 'keuangan'].includes(userRole || '');

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

  // AHS Library Functions
  useEffect(() => {
    const fetchAHS = async () => {
      try {
        const docRef = doc(db, 'app_data', appId, 'settings', 'ahs_library');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAhsItems(docSnap.data().items || []);
        } else {
          // Load default SNI data
          setAhsItems(getDefaultAHSData());
        }
      } catch (e) {
        console.error('Failed to fetch AHS:', e);
      }
    };
    if (user) fetchAHS();
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

  // Default AHS Data (beberapa contoh SNI)
  const getDefaultAHSData = (): AHSItem[] => [
    {
      id: 'ahs_sni_001', code: 'A.1.1', category: 'A. PEKERJAAN PERSIAPAN', name: 'Pembersihan Lapangan', unit: 'm²',
      components: [
        { id: 1, type: 'upah', name: 'Pekerja', unit: 'OH', coefficient: 0.05, unitPrice: 100000 },
        { id: 2, type: 'upah', name: 'Mandor', unit: 'OH', coefficient: 0.005, unitPrice: 150000 },
      ],
      isCustom: false, createdAt: '2024-01-01', updatedAt: '2024-01-01'
    },
    {
      id: 'ahs_sni_002', code: 'B.1.1', category: 'B. PEKERJAAN TANAH', name: 'Galian Tanah Biasa Sedalam 1m', unit: 'm³',
      components: [
        { id: 1, type: 'upah', name: 'Pekerja', unit: 'OH', coefficient: 0.75, unitPrice: 100000 },
        { id: 2, type: 'upah', name: 'Mandor', unit: 'OH', coefficient: 0.025, unitPrice: 150000 },
      ],
      isCustom: false, createdAt: '2024-01-01', updatedAt: '2024-01-01'
    },
    {
      id: 'ahs_sni_003', code: 'C.1.1', category: 'C. PEKERJAAN PASANGAN', name: 'Pasang 1m² Dinding Bata Merah 1:4', unit: 'm²',
      components: [
        { id: 1, type: 'bahan', name: 'Bata Merah', unit: 'bh', coefficient: 70, unitPrice: 800 },
        { id: 2, type: 'bahan', name: 'Semen PC 50kg', unit: 'zak', coefficient: 0.23, unitPrice: 65000 },
        { id: 3, type: 'bahan', name: 'Pasir Pasang', unit: 'm³', coefficient: 0.043, unitPrice: 250000 },
        { id: 4, type: 'upah', name: 'Tukang Batu', unit: 'OH', coefficient: 0.2, unitPrice: 150000 },
        { id: 5, type: 'upah', name: 'Pekerja', unit: 'OH', coefficient: 0.2, unitPrice: 100000 },
        { id: 6, type: 'upah', name: 'Mandor', unit: 'OH', coefficient: 0.01, unitPrice: 150000 },
      ],
      isCustom: false, createdAt: '2024-01-01', updatedAt: '2024-01-01'
    },
    {
      id: 'ahs_sni_004', code: 'C.2.1', category: 'C. PEKERJAAN PASANGAN', name: 'Plesteran 1:4', unit: 'm²',
      components: [
        { id: 1, type: 'bahan', name: 'Semen PC 50kg', unit: 'zak', coefficient: 0.13, unitPrice: 65000 },
        { id: 2, type: 'bahan', name: 'Pasir Pasang', unit: 'm³', coefficient: 0.024, unitPrice: 250000 },
        { id: 3, type: 'upah', name: 'Tukang Batu', unit: 'OH', coefficient: 0.15, unitPrice: 150000 },
        { id: 4, type: 'upah', name: 'Pekerja', unit: 'OH', coefficient: 0.2, unitPrice: 100000 },
        { id: 5, type: 'upah', name: 'Mandor', unit: 'OH', coefficient: 0.01, unitPrice: 150000 },
      ],
      isCustom: false, createdAt: '2024-01-01', updatedAt: '2024-01-01'
    },
    {
      id: 'ahs_sni_005', code: 'D.1.1', category: 'D. PEKERJAAN BETON', name: 'Beton Mutu K-225', unit: 'm³',
      components: [
        { id: 1, type: 'bahan', name: 'Semen PC 50kg', unit: 'zak', coefficient: 7.84, unitPrice: 65000 },
        { id: 2, type: 'bahan', name: 'Pasir Beton', unit: 'm³', coefficient: 0.52, unitPrice: 300000 },
        { id: 3, type: 'bahan', name: 'Kerikil/Split', unit: 'm³', coefficient: 0.78, unitPrice: 350000 },
        { id: 4, type: 'upah', name: 'Pekerja', unit: 'OH', coefficient: 1.65, unitPrice: 100000 },
        { id: 5, type: 'upah', name: 'Tukang Batu', unit: 'OH', coefficient: 0.275, unitPrice: 150000 },
        { id: 6, type: 'upah', name: 'Mandor', unit: 'OH', coefficient: 0.083, unitPrice: 150000 },
      ],
      isCustom: false, createdAt: '2024-01-01', updatedAt: '2024-01-01'
    },
    {
      id: 'ahs_sni_006', code: 'E.1.1', category: 'E. PEKERJAAN LANTAI', name: 'Pasang Keramik Lantai 40x40', unit: 'm²',
      components: [
        { id: 1, type: 'bahan', name: 'Keramik 40x40', unit: 'm²', coefficient: 1.05, unitPrice: 85000 },
        { id: 2, type: 'bahan', name: 'Semen PC 50kg', unit: 'zak', coefficient: 0.2, unitPrice: 65000 },
        { id: 3, type: 'bahan', name: 'Pasir Pasang', unit: 'm³', coefficient: 0.045, unitPrice: 250000 },
        { id: 4, type: 'bahan', name: 'Semen Warna/Nat', unit: 'kg', coefficient: 0.5, unitPrice: 15000 },
        { id: 5, type: 'upah', name: 'Tukang Batu', unit: 'OH', coefficient: 0.2, unitPrice: 150000 },
        { id: 6, type: 'upah', name: 'Pekerja', unit: 'OH', coefficient: 0.35, unitPrice: 100000 },
        { id: 7, type: 'upah', name: 'Mandor', unit: 'OH', coefficient: 0.018, unitPrice: 150000 },
      ],
      isCustom: false, createdAt: '2024-01-01', updatedAt: '2024-01-01'
    },
  ];

  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  // Helper Functions inside App
  const updateProject = async (data: Partial<Project>) => { if (!user || !activeProjectId) return; setIsSyncing(true); try { await updateDoc(doc(db, 'app_data', appId, 'projects', activeProjectId), data); } catch (e) { alert("Gagal simpan."); } setIsSyncing(false); };
  const handleLogin = async () => { try { await signInWithPopup(auth, googleProvider); } catch (e) { console.error(e); alert('Login Gagal'); } };
  const handleLogout = async () => { if (confirm("Keluar?")) await signOut(auth); setProjects([]); setView('project-list'); };
  const handleAddUser = async () => { if (!inputEmail || !inputName) return; try { await setDoc(doc(db, 'app_users', inputEmail), { email: inputEmail, name: inputName, role: inputRole }); alert("User berhasil ditambahkan!"); setShowModal(false); setInputEmail(''); setInputName(''); } catch (e) { alert("Gagal menambah user."); } };
  const handleDeleteUser = async (emailToDelete: string) => { if (emailToDelete === user?.email) return alert("Tidak bisa hapus diri sendiri!"); if (confirm(`Hapus akses ${emailToDelete}?`)) { try { await deleteDoc(doc(db, 'app_users', emailToDelete)); } catch (e) { alert("Gagal."); } } };

  const handleSaveRAB = () => {
    if (!activeProject) return;
    const newItem: RABItem = { id: selectedRabItem ? selectedRabItem.id : Date.now(), category: rabCategory, name: rabItemName, unit: rabUnit, volume: rabVol, unitPrice: rabPrice, progress: selectedRabItem?.progress || 0, isAddendum: selectedRabItem?.isAddendum || false };
    const newItems = selectedRabItem ? activeProject.rabItems.map((i: RABItem) => i.id === newItem.id ? newItem : i) : [...activeProject.rabItems, newItem];
    updateProject({ rabItems: newItems }); setShowModal(false); setRabItemName(''); setRabVol(0); setRabPrice(0);
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

  const saveAttendanceWithEvidence = () => {
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

    let newEvidences = activeProject.attendanceEvidences || [];
    if (evidencePhoto || evidenceLocation) {
      newEvidences = [{ id: Date.now(), date: attendanceDate, photoUrl: evidencePhoto, location: evidenceLocation, uploader: user?.displayName || 'Unknown', timestamp: new Date().toISOString() }, ...newEvidences];
    }

    updateProject({ attendanceLogs: [...activeProject.attendanceLogs, ...newLogs], attendanceEvidences: newEvidences });
    setShowModal(false);

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
    setModalType(type);
    setShowModal(true);
  };

  const handleGenerateRAB = async () => {
    if (!aiPrompt) return alert("Masukkan deskripsi proyek dulu!");
    setIsGeneratingAI(true);
    const apiKey = "AIzaSyB7ta6cVVnYp0JQMUSnv1rMSNZivr9_p4E";
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `Buatkan daftar item RAB konstruksi dalam Bahasa Indonesia berdasarkan deskripsi berikut: '${aiPrompt}'. Output wajib format JSON murni array of objects dengan key: category, name, unit, volume, unitPrice. Pastikan nama item dan kategori menggunakan istilah konstruksi standar Indonesia. No markdown.` }] }] })
      });
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const cleanJson = text.replace(/```json|```/g, '').trim();
      const items = JSON.parse(cleanJson);
      const newItems = items.map((i: any) => ({ ...i, id: Date.now() + Math.random(), progress: 0, isAddendum: false }));
      if (activeProject) { updateProject({ rabItems: [...(activeProject.rabItems || []), ...newItems] }); alert(`Berhasil menambahkan ${newItems.length} item RAB!`); setShowModal(false); }
    } catch (e) { console.error(e); alert("Gagal generate AI. Coba lagi."); } finally { setIsGeneratingAI(false); }
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

  const loadDemoData = async () => {
    if (!user) return;
    setIsSyncing(true);

    // Project dates: Started 6 months ago, ended 1 month ago (completed)
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - 6);
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() - 1);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const getDateBetween = (progressPercent: number) => {
      const start = startDate.getTime();
      const end = endDate.getTime();
      const targetTime = start + (end - start) * (progressPercent / 100);
      return formatDate(new Date(targetTime));
    };

    // Workers
    const workers = [
      { id: 1, name: 'Pak Joko', role: 'Mandor', wageUnit: 'Harian', realRate: 250000, mandorRate: 300000 },
      { id: 2, name: 'Udin', role: 'Tukang', wageUnit: 'Harian', realRate: 180000, mandorRate: 200000 },
      { id: 3, name: 'Budi', role: 'Tukang', wageUnit: 'Harian', realRate: 180000, mandorRate: 200000 },
      { id: 4, name: 'Slamet', role: 'Tukang', wageUnit: 'Harian', realRate: 180000, mandorRate: 200000 },
      { id: 5, name: 'Agus', role: 'Kenek', wageUnit: 'Harian', realRate: 120000, mandorRate: 150000 },
      { id: 6, name: 'Dedi', role: 'Kenek', wageUnit: 'Harian', realRate: 120000, mandorRate: 150000 },
    ];

    // RAB Items - Total ~2 Milyar
    const rabItems = [
      // A. PERSIAPAN (5%)
      { id: 1, category: 'A. PERSIAPAN', name: 'Pembersihan Lahan & Bongkaran', unit: 'ls', volume: 1, unitPrice: 25000000, progress: 100, isAddendum: false, startDate: getDateBetween(0), endDate: getDateBetween(5) },
      { id: 2, category: 'A. PERSIAPAN', name: 'Pengukuran & Bouwplank', unit: 'ls', volume: 1, unitPrice: 15000000, progress: 100, isAddendum: false, startDate: getDateBetween(3), endDate: getDateBetween(8) },
      { id: 3, category: 'A. PERSIAPAN', name: 'Mobilisasi Alat & Material', unit: 'ls', volume: 1, unitPrice: 20000000, progress: 100, isAddendum: false, startDate: getDateBetween(5), endDate: getDateBetween(10) },

      // B. STRUKTUR BAWAH (20%)
      { id: 4, category: 'B. STRUKTUR BAWAH', name: 'Galian Tanah Pondasi', unit: 'm3', volume: 120, unitPrice: 150000, progress: 100, isAddendum: false, startDate: getDateBetween(8), endDate: getDateBetween(15) },
      { id: 5, category: 'B. STRUKTUR BAWAH', name: 'Urugan Pasir Bawah Pondasi', unit: 'm3', volume: 30, unitPrice: 350000, progress: 100, isAddendum: false, startDate: getDateBetween(12), endDate: getDateBetween(18) },
      { id: 6, category: 'B. STRUKTUR BAWAH', name: 'Pondasi Batu Kali', unit: 'm3', volume: 45, unitPrice: 1500000, progress: 100, isAddendum: false, startDate: getDateBetween(15), endDate: getDateBetween(25) },
      { id: 7, category: 'B. STRUKTUR BAWAH', name: 'Sloof Beton 20x30', unit: 'm3', volume: 12, unitPrice: 4500000, progress: 100, isAddendum: false, startDate: getDateBetween(22), endDate: getDateBetween(30) },
      { id: 8, category: 'B. STRUKTUR BAWAH', name: 'Pile Cap & Tie Beam', unit: 'm3', volume: 8, unitPrice: 5000000, progress: 100, isAddendum: false, startDate: getDateBetween(28), endDate: getDateBetween(35) },

      // C. STRUKTUR ATAS (25%)
      { id: 9, category: 'C. STRUKTUR ATAS', name: 'Kolom Beton 40x40 Lt.1', unit: 'm3', volume: 15, unitPrice: 5500000, progress: 100, isAddendum: false, startDate: getDateBetween(32), endDate: getDateBetween(42) },
      { id: 10, category: 'C. STRUKTUR ATAS', name: 'Balok Beton Lt.1', unit: 'm3', volume: 18, unitPrice: 5200000, progress: 100, isAddendum: false, startDate: getDateBetween(40), endDate: getDateBetween(50) },
      { id: 11, category: 'C. STRUKTUR ATAS', name: 'Plat Lantai 2 t=12cm', unit: 'm2', volume: 180, unitPrice: 450000, progress: 100, isAddendum: false, startDate: getDateBetween(48), endDate: getDateBetween(55) },
      { id: 12, category: 'C. STRUKTUR ATAS', name: 'Kolom Beton 40x40 Lt.2', unit: 'm3', volume: 12, unitPrice: 5500000, progress: 100, isAddendum: false, startDate: getDateBetween(52), endDate: getDateBetween(60) },
      { id: 13, category: 'C. STRUKTUR ATAS', name: 'Balok & Ring Balk Lt.2', unit: 'm3', volume: 14, unitPrice: 5200000, progress: 100, isAddendum: false, startDate: getDateBetween(58), endDate: getDateBetween(65) },
      { id: 14, category: 'C. STRUKTUR ATAS', name: 'Tangga Beton', unit: 'unit', volume: 1, unitPrice: 35000000, progress: 100, isAddendum: false, startDate: getDateBetween(55), endDate: getDateBetween(62) },

      // D. DINDING & PASANGAN (15%)
      { id: 15, category: 'D. DINDING & PASANGAN', name: 'Pasangan Bata Ringan Lt.1', unit: 'm2', volume: 280, unitPrice: 180000, progress: 100, isAddendum: false, startDate: getDateBetween(45), endDate: getDateBetween(58) },
      { id: 16, category: 'D. DINDING & PASANGAN', name: 'Pasangan Bata Ringan Lt.2', unit: 'm2', volume: 220, unitPrice: 180000, progress: 100, isAddendum: false, startDate: getDateBetween(60), endDate: getDateBetween(70) },
      { id: 17, category: 'D. DINDING & PASANGAN', name: 'Plesteran & Acian Lt.1', unit: 'm2', volume: 560, unitPrice: 85000, progress: 100, isAddendum: false, startDate: getDateBetween(55), endDate: getDateBetween(68) },
      { id: 18, category: 'D. DINDING & PASANGAN', name: 'Plesteran & Acian Lt.2', unit: 'm2', volume: 440, unitPrice: 85000, progress: 100, isAddendum: false, startDate: getDateBetween(68), endDate: getDateBetween(78) },

      // E. ATAP (10%)
      { id: 19, category: 'E. ATAP', name: 'Rangka Atap Baja Ringan', unit: 'm2', volume: 200, unitPrice: 350000, progress: 100, isAddendum: false, startDate: getDateBetween(62), endDate: getDateBetween(72) },
      { id: 20, category: 'E. ATAP', name: 'Penutup Atap Genteng Metal', unit: 'm2', volume: 200, unitPrice: 180000, progress: 100, isAddendum: false, startDate: getDateBetween(70), endDate: getDateBetween(78) },
      { id: 21, category: 'E. ATAP', name: 'Lisplang & Talang', unit: 'm', volume: 80, unitPrice: 250000, progress: 100, isAddendum: false, startDate: getDateBetween(75), endDate: getDateBetween(80) },

      // F. LANTAI (8%)
      { id: 22, category: 'F. LANTAI', name: 'Lantai Granit 60x60 Lt.1', unit: 'm2', volume: 150, unitPrice: 450000, progress: 100, isAddendum: false, startDate: getDateBetween(75), endDate: getDateBetween(85) },
      { id: 23, category: 'F. LANTAI', name: 'Lantai Granit 60x60 Lt.2', unit: 'm2', volume: 130, unitPrice: 450000, progress: 100, isAddendum: false, startDate: getDateBetween(80), endDate: getDateBetween(88) },
      { id: 24, category: 'F. LANTAI', name: 'Lantai Kamar Mandi', unit: 'm2', volume: 24, unitPrice: 350000, progress: 100, isAddendum: false, startDate: getDateBetween(78), endDate: getDateBetween(85) },

      // G. KUSEN, PINTU & JENDELA (7%)
      { id: 25, category: 'G. KUSEN, PINTU & JENDELA', name: 'Kusen Aluminium', unit: 'ls', volume: 1, unitPrice: 45000000, progress: 100, isAddendum: false, startDate: getDateBetween(72), endDate: getDateBetween(82) },
      { id: 26, category: 'G. KUSEN, PINTU & JENDELA', name: 'Pintu Panel + Kaca', unit: 'unit', volume: 12, unitPrice: 3500000, progress: 100, isAddendum: false, startDate: getDateBetween(80), endDate: getDateBetween(88) },
      { id: 27, category: 'G. KUSEN, PINTU & JENDELA', name: 'Jendela Aluminium + Kaca', unit: 'unit', volume: 15, unitPrice: 2800000, progress: 100, isAddendum: false, startDate: getDateBetween(80), endDate: getDateBetween(88) },

      // H. PLAFON (5%)
      { id: 28, category: 'H. PLAFON', name: 'Rangka Plafon Metal Furing', unit: 'm2', volume: 280, unitPrice: 120000, progress: 100, isAddendum: false, startDate: getDateBetween(78), endDate: getDateBetween(88) },
      { id: 29, category: 'H. PLAFON', name: 'Plafon Gypsum 9mm', unit: 'm2', volume: 280, unitPrice: 95000, progress: 100, isAddendum: false, startDate: getDateBetween(85), endDate: getDateBetween(92) },

      // I. SANITAIR & PLUMBING (5%)
      { id: 30, category: 'I. SANITAIR & PLUMBING', name: 'Instalasi Air Bersih', unit: 'ls', volume: 1, unitPrice: 25000000, progress: 100, isAddendum: false, startDate: getDateBetween(30), endDate: getDateBetween(85) },
      { id: 31, category: 'I. SANITAIR & PLUMBING', name: 'Instalasi Air Kotor & Septictank', unit: 'ls', volume: 1, unitPrice: 35000000, progress: 100, isAddendum: false, startDate: getDateBetween(25), endDate: getDateBetween(40) },
      { id: 32, category: 'I. SANITAIR & PLUMBING', name: 'Sanitary Ware (Closet, Wastafel)', unit: 'set', volume: 4, unitPrice: 8500000, progress: 100, isAddendum: false, startDate: getDateBetween(88), endDate: getDateBetween(95) },

      // J. ELEKTRIKAL (5%)
      { id: 33, category: 'J. ELEKTRIKAL', name: 'Instalasi Listrik', unit: 'ttk', volume: 80, unitPrice: 450000, progress: 100, isAddendum: false, startDate: getDateBetween(50), endDate: getDateBetween(90) },
      { id: 34, category: 'J. ELEKTRIKAL', name: 'Panel Listrik & MCB', unit: 'ls', volume: 1, unitPrice: 15000000, progress: 100, isAddendum: false, startDate: getDateBetween(88), endDate: getDateBetween(95) },
      { id: 35, category: 'J. ELEKTRIKAL', name: 'Lampu & Saklar', unit: 'ls', volume: 1, unitPrice: 25000000, progress: 100, isAddendum: false, startDate: getDateBetween(92), endDate: getDateBetween(98) },

      // K. FINISHING (10%)
      { id: 36, category: 'K. FINISHING', name: 'Cat Dinding Interior', unit: 'm2', volume: 1000, unitPrice: 45000, progress: 100, isAddendum: false, startDate: getDateBetween(90), endDate: getDateBetween(98) },
      { id: 37, category: 'K. FINISHING', name: 'Cat Dinding Eksterior', unit: 'm2', volume: 400, unitPrice: 55000, progress: 100, isAddendum: false, startDate: getDateBetween(88), endDate: getDateBetween(96) },
      { id: 38, category: 'K. FINISHING', name: 'Railing Tangga Stainless', unit: 'm', volume: 12, unitPrice: 1500000, progress: 100, isAddendum: false, startDate: getDateBetween(92), endDate: getDateBetween(98) },
      { id: 39, category: 'K. FINISHING', name: 'Pagar & Gerbang', unit: 'ls', volume: 1, unitPrice: 45000000, progress: 100, isAddendum: false, startDate: getDateBetween(85), endDate: getDateBetween(95) },
      { id: 40, category: 'K. FINISHING', name: 'Carport & Taman', unit: 'ls', volume: 1, unitPrice: 35000000, progress: 100, isAddendum: false, startDate: getDateBetween(92), endDate: getDateBetween(100) },
    ];

    // Materials
    const materials = [
      { id: 1, name: 'Semen Tiga Roda 50kg', unit: 'sak', stock: 0, minStock: 20 },
      { id: 2, name: 'Pasir Cor', unit: 'm3', stock: 0, minStock: 5 },
      { id: 3, name: 'Split/Kerikil', unit: 'm3', stock: 0, minStock: 5 },
      { id: 4, name: 'Besi Beton 10mm', unit: 'btg', stock: 0, minStock: 50 },
      { id: 5, name: 'Besi Beton 12mm', unit: 'btg', stock: 0, minStock: 50 },
      { id: 6, name: 'Bata Ringan 10cm', unit: 'bh', stock: 0, minStock: 200 },
      { id: 7, name: 'Semen Mortar', unit: 'sak', stock: 0, minStock: 30 },
      { id: 8, name: 'Cat Dulux Interior', unit: 'pail', stock: 0, minStock: 5 },
    ];

    // Material Logs
    const materialLogs: any[] = [];
    const materialUsage = [
      { id: 1, totalIn: 850, totalOut: 850 },
      { id: 2, totalIn: 45, totalOut: 45 },
      { id: 3, totalIn: 35, totalOut: 35 },
      { id: 4, totalIn: 280, totalOut: 280 },
      { id: 5, totalIn: 180, totalOut: 180 },
      { id: 6, totalIn: 4500, totalOut: 4500 },
      { id: 7, totalIn: 120, totalOut: 120 },
      { id: 8, totalIn: 25, totalOut: 25 },
    ];

    materialUsage.forEach((m, idx) => {
      // In logs
      materialLogs.push({ id: Date.now() + idx * 2, materialId: m.id, date: getDateBetween(10 + idx * 5), type: 'in', quantity: m.totalIn, notes: 'Pembelian awal', actor: 'Pak Joko' });
      // Out logs
      materialLogs.push({ id: Date.now() + idx * 2 + 1, materialId: m.id, date: getDateBetween(90 + idx), type: 'out', quantity: m.totalOut, notes: 'Pemakaian proyek', actor: 'Udin' });
    });

    // Attendance Logs (Generate for 5 months of work, ~100 working days)
    const attendanceLogs: any[] = [];
    let currentDate = new Date(startDate);
    let logId = 1;

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      // Skip Sunday
      if (dayOfWeek !== 0) {
        workers.forEach(w => {
          // Random attendance with 90% presence rate
          const rand = Math.random();
          let status = 'Hadir';
          if (rand > 0.95) status = 'Izin';
          else if (rand > 0.90) status = 'Sakit';
          else if (rand > 0.85) status = 'Lembur';

          attendanceLogs.push({
            id: logId++,
            date: formatDate(currentDate),
            workerId: w.id,
            status: status,
            note: ''
          });
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Task Logs (Progress updates)
    const taskLogs: any[] = [];
    rabItems.forEach((item, idx) => {
      // Add progress updates at 25%, 50%, 75%, 100%
      [25, 50, 75, 100].forEach((prog, pIdx) => {
        const progressDate = new Date(startDate);
        const itemDuration = (idx + 1) * 3 + pIdx * 2;
        progressDate.setDate(progressDate.getDate() + itemDuration);

        if (progressDate <= endDate) {
          taskLogs.push({
            id: Date.now() + idx * 100 + pIdx,
            date: formatDate(progressDate),
            taskId: item.id,
            previousProgress: prog - 25,
            newProgress: prog,
            note: prog === 100 ? 'Pekerjaan selesai' : `Update progress ${prog}%`
          });
        }
      });
    });

    // Transactions
    const transactions: any[] = [];
    let txId = 1;

    // Income (Termin payments)
    const terminSchedule = [
      { percent: 30, date: getDateBetween(10), desc: 'Termin 1 - DP 30%' },
      { percent: 25, date: getDateBetween(40), desc: 'Termin 2 - Progress 25%' },
      { percent: 25, date: getDateBetween(70), desc: 'Termin 3 - Progress 25%' },
      { percent: 20, date: getDateBetween(100), desc: 'Termin 4 - Pelunasan 20%' },
    ];

    const totalRAB = rabItems.reduce((sum, item) => sum + (item.volume * item.unitPrice), 0);

    terminSchedule.forEach(t => {
      transactions.push({
        id: txId++,
        date: t.date,
        category: 'Termin/DP',
        description: t.desc,
        amount: Math.round(totalRAB * t.percent / 100),
        type: 'income'
      });
    });

    // Distribute expenses over project duration
    for (let week = 0; week < 22; week++) {
      const weekDate = new Date(startDate);
      weekDate.setDate(weekDate.getDate() + week * 7);

      if (weekDate <= endDate) {
        // Weekly wages
        const totalWeeklyWage = workers.reduce((sum, w) => sum + (w.realRate * 6), 0);
        transactions.push({
          id: txId++,
          date: formatDate(weekDate),
          category: 'Upah Tukang',
          description: `Gaji Minggu ke-${week + 1}`,
          amount: totalWeeklyWage,
          type: 'expense'
        });

        // Material purchases (heavier in early-mid project)
        if (week < 16) {
          const materialCost = Math.round(30000000 + Math.random() * 50000000);
          transactions.push({
            id: txId++,
            date: formatDate(weekDate),
            category: 'Material',
            description: `Material Minggu ke-${week + 1}`,
            amount: materialCost,
            type: 'expense'
          });
        }

        // Operational costs
        if (week % 2 === 0) {
          transactions.push({
            id: txId++,
            date: formatDate(weekDate),
            category: 'Operasional',
            description: 'Transport & Operasional',
            amount: Math.round(1500000 + Math.random() * 1000000),
            type: 'expense'
          });
        }
      }
    }

    // Gallery Items (Progress photos)
    const galleryItems = [
      { id: 1, imageUrl: '', caption: 'Pembersihan lahan awal', uploadedAt: getDateBetween(2), uploadedBy: 'Pak Joko', progress: 0 },
      { id: 2, imageUrl: '', caption: 'Pengukuran & bouwplank selesai', uploadedAt: getDateBetween(8), uploadedBy: 'Pak Joko', progress: 5 },
      { id: 3, imageUrl: '', caption: 'Galian pondasi', uploadedAt: getDateBetween(12), uploadedBy: 'Udin', progress: 10 },
      { id: 4, imageUrl: '', caption: 'Cor pondasi batu kali', uploadedAt: getDateBetween(20), uploadedBy: 'Pak Joko', progress: 18 },
      { id: 5, imageUrl: '', caption: 'Sloof dan kolom Lt.1 terpasang', uploadedAt: getDateBetween(35), uploadedBy: 'Budi', progress: 28 },
      { id: 6, imageUrl: '', caption: 'Pengecoran plat lantai 2', uploadedAt: getDateBetween(50), uploadedBy: 'Pak Joko', progress: 40 },
      { id: 7, imageUrl: '', caption: 'Struktur Lt.2 selesai', uploadedAt: getDateBetween(62), uploadedBy: 'Udin', progress: 52 },
      { id: 8, imageUrl: '', caption: 'Pasangan dinding ongoing', uploadedAt: getDateBetween(68), uploadedBy: 'Slamet', progress: 60 },
      { id: 9, imageUrl: '', caption: 'Pemasangan rangka atap', uploadedAt: getDateBetween(72), uploadedBy: 'Pak Joko', progress: 68 },
      { id: 10, imageUrl: '', caption: 'Atap terpasang sempurna', uploadedAt: getDateBetween(78), uploadedBy: 'Budi', progress: 75 },
      { id: 11, imageUrl: '', caption: 'Instalasi listrik & plumbing', uploadedAt: getDateBetween(82), uploadedBy: 'Agus', progress: 80 },
      { id: 12, imageUrl: '', caption: 'Pemasangan granit lantai', uploadedAt: getDateBetween(86), uploadedBy: 'Udin', progress: 85 },
      { id: 13, imageUrl: '', caption: 'Finishing plafon & cat', uploadedAt: getDateBetween(92), uploadedBy: 'Slamet', progress: 92 },
      { id: 14, imageUrl: '', caption: 'Pagar dan carport selesai', uploadedAt: getDateBetween(96), uploadedBy: 'Pak Joko', progress: 97 },
      { id: 15, imageUrl: '', caption: 'SERAH TERIMA - Proyek 100% Selesai', uploadedAt: getDateBetween(100), uploadedBy: 'Pak Joko', progress: 100 },
    ];

    // Attendance Evidences (sample photos)
    const attendanceEvidences = [
      { id: 1, date: getDateBetween(5), photoUrl: '', location: '-6.1234,106.5678', uploader: 'Pak Joko', timestamp: getDateBetween(5) + 'T08:00:00' },
      { id: 2, date: getDateBetween(25), photoUrl: '', location: '-6.1234,106.5678', uploader: 'Pak Joko', timestamp: getDateBetween(25) + 'T08:00:00' },
      { id: 3, date: getDateBetween(50), photoUrl: '', location: '-6.1234,106.5678', uploader: 'Udin', timestamp: getDateBetween(50) + 'T08:00:00' },
      { id: 4, date: getDateBetween(75), photoUrl: '', location: '-6.1234,106.5678', uploader: 'Pak Joko', timestamp: getDateBetween(75) + 'T08:00:00' },
      { id: 5, date: getDateBetween(95), photoUrl: '', location: '-6.1234,106.5678', uploader: 'Pak Joko', timestamp: getDateBetween(95) + 'T08:00:00' },
    ];

    const demo = {
      name: 'Rumah Mewah 2 Lantai - Villa Indah',
      client: 'Bpk. Ahmad Wijaya',
      location: 'Pondok Indah, Jakarta Selatan',
      ownerPhone: '6281234567890',
      status: 'Selesai',
      budgetLimit: 2200000000,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      rabItems,
      transactions,
      workers,
      materials,
      materialLogs,
      taskLogs,
      attendanceLogs,
      attendanceEvidences,
      galleryItems,
      isDeleted: false
    };

    await addDoc(collection(db, 'app_data', appId, 'projects'), demo);
    setIsSyncing(false);
    alert('Demo proyek lengkap berhasil dibuat! 🎉');
  };


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
          {view === 'trash-bin' && (
            <main className="space-y-4">
              <h2 className="font-bold text-2xl text-slate-800 mb-6">Tong Sampah Proyek</h2>
              {projects.filter(p => p.isDeleted).length === 0 && <div className="text-center py-20 text-slate-400 bg-white rounded-xl border border-dashed">Tong sampah kosong.</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{projects.filter(p => p.isDeleted).map(p => (<div key={p.id} className="bg-red-50 p-6 rounded-xl border border-red-100 flex flex-col justify-between h-full"><div className="mb-4"><h3 className="font-bold text-lg text-slate-800">{p.name}</h3><p className="text-sm text-slate-500">{p.client}</p></div><div className="flex gap-2 mt-auto"><button onClick={() => handleRestoreProject(p)} className="flex-1 bg-green-100 text-green-700 p-2 rounded-lg text-sm font-bold hover:bg-green-200 flex items-center justify-center gap-2"><RotateCcw size={16} /> Pulihkan</button>{canAccessManagement() && <button onClick={() => handlePermanentDeleteProject(p)} className="flex-1 bg-red-200 text-red-800 p-2 rounded-lg text-sm font-bold hover:bg-red-300 flex items-center justify-center gap-2"><Trash2 size={16} /> Hapus</button>}</div></div>))}</div>
            </main>
          )}

          {/* USER MANAGEMENT VIEW */}
          {view === 'user-management' && canAccessManagement() && (
            <main className="space-y-6">
              <div className="bg-blue-600 text-white p-8 rounded-2xl shadow-lg mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4"><div><h2 className="font-bold text-2xl flex items-center gap-2"><ShieldCheck size={28} /> Kelola Akses Pengguna</h2></div><button onClick={() => openModal('addUser')} className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-50 shadow-md"><UserPlus size={20} /> Tambah User</button></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{appUsers.map((u) => (<div key={u.email} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4"><div className="flex items-start justify-between"><div><div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-lg mb-2">{u.name.charAt(0)}</div><p className="font-bold text-lg text-slate-800">{u.name}</p><p className="text-sm text-slate-500">{u.email}</p></div>{u.email !== user?.email && <button onClick={() => handleDeleteUser(u.email)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={20} /></button>}</div><span className="self-start text-xs px-3 py-1 rounded-full font-bold bg-blue-100 text-blue-700 uppercase">{u.role.replace('_', ' ')}</span></div>))}</div>
            </main>
          )}

          {/* LANDING PAGE SETTINGS VIEW */}
          {view === 'landing-settings' && canAccessManagement() && (
            <main className="space-y-6">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 rounded-2xl shadow-lg mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="font-bold text-2xl flex items-center gap-2">
                    <Palette size={28} /> Kelola Landing Page
                  </h2>
                  <p className="text-indigo-100 mt-1">Edit konten halaman depan website</p>
                </div>
                <button
                  onClick={() => setShowLandingEditor(true)}
                  className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-50 shadow-md"
                >
                  <Palette size={20} /> Edit Landing Page
                </button>
              </div>

              {/* Preview Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="font-bold text-lg text-slate-800">Preview Konfigurasi</h3>
                </div>
                <div className="p-6 space-y-4">
                  {landingConfig ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl">
                          <p className="text-xs text-slate-500 font-bold uppercase mb-1">Nama Perusahaan</p>
                          <p className="text-lg font-bold text-slate-800">{landingConfig.companyName}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl">
                          <p className="text-xs text-slate-500 font-bold uppercase mb-1">Nomor WhatsApp</p>
                          <p className="text-lg font-bold text-green-600">+{landingConfig.whatsappNumber}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl">
                          <p className="text-xs text-slate-500 font-bold uppercase mb-1">Instagram</p>
                          <p className="text-lg font-bold text-pink-600">@{landingConfig.instagramHandle}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl">
                          <p className="text-xs text-slate-500 font-bold uppercase mb-1">Jumlah Portofolio</p>
                          <p className="text-lg font-bold text-blue-600">{landingConfig.portfolioItems.length} Item</p>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">Tagline</p>
                        <p className="text-lg font-bold text-slate-800">{landingConfig.tagline}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">Deskripsi</p>
                        <p className="text-sm text-slate-600">{landingConfig.subtitle}</p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p>Memuat konfigurasi...</p>
                    </div>
                  )}
                </div>
              </div>
            </main>
          )}

          {view === 'ahs-library' && (
            <main className="space-y-6">
              <AHSLibraryView
                ahsItems={ahsItems}
                onSave={saveAhsItems}
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
      />

    </div>
  );
};

export default App;