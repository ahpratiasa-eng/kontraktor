import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Wallet, Package, Users, TrendingUp, 
  Plus, Trash2, ArrowLeft, Building2, 
  Loader2, RefreshCw, X, Calendar, FileText, 
  Banknote, Edit, Settings, ChevronDown, ChevronUp, LogOut, LogIn, Lock, ShieldCheck, UserPlus,
  History, AlertTriangle, Camera, ExternalLink, Image as ImageIcon, CheckCircle, Printer, RotateCcw, Sparkles
} from 'lucide-react';

import { getAuth, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';

import { 
  collection, doc, addDoc, updateDoc, 
  deleteDoc, onSnapshot, query, getDoc 
} from 'firebase/firestore';

import { auth, db, googleProvider, appId } from './lib/firebase';
import type { Project, AppUser, RABItem, Transaction, Material, MaterialLog, Worker, Task, AttendanceLog, AttendanceEvidence, TaskLog, GroupedTransaction, UserRole } from './types';
import { formatNumber, parseNumber, formatRupiah, getGroupedTransactions, calculateProjectHealth, getStats } from './utils/helpers';
import SCurveChart from './components/SCurveChart';
import { NumberInput, TransactionGroup } from './components/UIComponents';

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null); 
  const [authStatus, setAuthStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [view, setView] = useState<'project-list' | 'project-detail' | 'report-view' | 'user-management' | 'trash-bin'>('project-list'); 
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<any>(null);
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [loginError, setLoginError] = useState('');
  const [rabViewMode, setRabViewMode] = useState<'internal' | 'client'>('client');

  // Input States
  const [inputName, setInputName] = useState(''); const [inputEmail, setInputEmail] = useState(''); const [inputRole, setInputRole] = useState<UserRole>('pengawas'); const [inputClient, setInputClient] = useState(''); const [inputDuration, setInputDuration] = useState(30); const [inputBudget, setInputBudget] = useState(0); const [inputStartDate, setInputStartDate] = useState(''); const [inputEndDate, setInputEndDate] = useState('');
  const [rabCategory, setRabCategory] = useState(''); const [rabItemName, setRabItemName] = useState(''); const [rabUnit, setRabUnit] = useState('ls'); const [rabVol, setRabVol] = useState(0); const [rabPrice, setRabPrice] = useState(0); const [selectedRabItem, setSelectedRabItem] = useState<RABItem | null>(null);
  const [inputRealRate, setInputRealRate] = useState(150000); const [inputMandorRate, setInputMandorRate] = useState(170000); const [inputWorkerRole, setInputWorkerRole] = useState<'Tukang' | 'Kenek' | 'Mandor'>('Tukang'); const [inputWageUnit, setInputWageUnit] = useState<'Harian' | 'Mingguan' | 'Bulanan'>('Harian');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null); const [stockType, setStockType] = useState<'in' | 'out'>('in'); const [stockQty, setStockQty] = useState(0); const [stockDate, setStockDate] = useState(new Date().toISOString().split('T')[0]); const [stockNotes, setStockNotes] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null); const [paymentAmount, setPaymentAmount] = useState(0); const [amount, setAmount] = useState(0); 
  const [progressInput, setProgressInput] = useState(0); const [progressDate, setProgressDate] = useState(new Date().toISOString().split('T')[0]); const [progressNote, setProgressNote] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]); const [attendanceData, setAttendanceData] = useState<{[workerId: number]: {status: string, note: string}}>({}); const [filterStartDate, setFilterStartDate] = useState(new Date().toISOString().split('T')[0]); const [filterEndDate, setFilterEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [evidencePhoto, setEvidencePhoto] = useState<string>(''); const [evidenceLocation, setEvidenceLocation] = useState<string>(''); const [isGettingLoc, setIsGettingLoc] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<{[key: string]: boolean}>({}); 
  const [expandedReportIds, setExpandedReportIds] = useState<{[id: string]: boolean}>({});
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Permission Checks
  const canAccessFinance = () => ['super_admin', 'kontraktor', 'keuangan'].includes(userRole || '');
  const canAccessWorkers = () => ['super_admin', 'kontraktor', 'pengawas'].includes(userRole || '');
  const canAccessManagement = () => userRole === 'super_admin';
  const canEditProject = () => ['super_admin', 'kontraktor'].includes(userRole || '');
  const canSeeMoney = () => ['super_admin', 'kontraktor', 'keuangan'].includes(userRole || '');

  // Effects
  useEffect(() => { const u = onAuthStateChanged(auth, async (u) => { if (u) { try { const d = await getDoc(doc(db, 'app_users', u.email!)); if (d.exists()) { setUser(u); setUserRole(d.data().role); setAuthStatus('connected'); setLoginError(''); } else { await signOut(auth); setLoginError(`Email ${u.email} tidak terdaftar.`); } } catch (e) { setAuthStatus('error'); } } else { setUser(null); setAuthStatus('connected'); } }); return () => u(); }, []);
  useEffect(() => { if (userRole === 'super_admin') return onSnapshot(query(collection(db, 'app_users')), (s) => setAppUsers(s.docs.map(d => d.data() as AppUser))); }, [userRole]);
  useEffect(() => { if (user) return onSnapshot(query(collection(db, 'app_data', appId, 'projects')), (s) => { const l = s.docs.map(d => { const x = d.data(); return { id: d.id, ...x, rabItems: Array.isArray(x.rabItems) ? x.rabItems : [], transactions: x.transactions || [], materials: x.materials || [], workers: x.workers || [], attendanceLogs: x.attendanceLogs || [], isDeleted: x.isDeleted || false } as Project; }); l.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()); setProjects(l); }); }, [user]);

  const activeProject = projects.find(p => p.id === activeProjectId);
  const rabGroups = getRABGroups();

  // Helper Functions inside App (Handlers that use state)
  const updateProject = async (data: Partial<Project>) => { if (!user || !activeProjectId) return; setIsSyncing(true); try { await updateDoc(doc(db, 'app_data', appId, 'projects', activeProjectId), data); } catch(e) { alert("Gagal simpan."); } setIsSyncing(false); };
  const handleLogin = async () => { setLoginError(''); try { await signInWithPopup(auth, googleProvider); } catch (e) { setLoginError("Login gagal."); } };
  const handleLogout = async () => { if(confirm("Keluar?")) await signOut(auth); setProjects([]); setView('project-list'); };
  const handleAddUser = async () => { if (!inputEmail || !inputName) return; try { await setDoc(doc(db, 'app_users', inputEmail), { email: inputEmail, name: inputName, role: inputRole }); alert("User berhasil ditambahkan!"); setShowModal(false); setInputEmail(''); setInputName(''); } catch (e) { alert("Gagal menambah user."); } };
  const handleDeleteUser = async (emailToDelete: string) => { if (emailToDelete === user?.email) return alert("Tidak bisa hapus diri sendiri!"); if (confirm(`Hapus akses ${emailToDelete}?`)) { try { await deleteDoc(doc(db, 'app_users', emailToDelete)); } catch (e) { alert("Gagal."); } } };
  
  const handleSaveRAB = () => { 
     if(!activeProject) return; 
     const newItem = { id: selectedRabItem ? selectedRabItem.id : Date.now(), category: rabCategory, name: rabItemName, unit: rabUnit, volume: rabVol, unitPrice: rabPrice, progress: selectedRabItem?.progress || 0, isAddendum: selectedRabItem?.isAddendum || false };
     const newItems = selectedRabItem ? activeProject.rabItems.map(i => i.id === newItem.id ? newItem : i) : [...activeProject.rabItems, newItem];
     updateProject({ rabItems: newItems }); setShowModal(false); setRabItemName(''); setRabVol(0); setRabPrice(0);
  };
  const handleEditRABItem = (item: RABItem) => { setSelectedRabItem(item); setRabCategory(item.category); setRabItemName(item.name); setRabUnit(item.unit); setRabVol(item.volume); setRabPrice(item.unitPrice); setModalType('newRAB'); setShowModal(true); };
  const handleAddCCO = () => { setRabItemName(''); setRabCategory('PEKERJAAN TAMBAH KURANG (CCO)'); setSelectedRabItem(null); setModalType('newRAB'); };
  const deleteRABItem = (id: number) => { if(!activeProject || !confirm('Hapus item RAB ini?')) return; const newItems = activeProject.rabItems.filter(i => i.id !== id); updateProject({ rabItems: newItems }); };
  const handleTransaction = (e: React.FormEvent) => { e.preventDefault(); if (!activeProject) return; const form = e.target as HTMLFormElement; const desc = (form.elements.namedItem('desc') as HTMLInputElement).value; const cat = (form.elements.namedItem('cat') as HTMLSelectElement).value; if (!desc || amount <= 0) { alert("Data tidak valid"); return; } updateProject({ transactions: [{ id: Date.now(), date: new Date().toISOString().split('T')[0], category: cat, description: desc, amount: amount, type: txType }, ...(activeProject.transactions || [])] }); form.reset(); setAmount(0); };
  const handleUpdateProgress = () => { if (!activeProject || !selectedRabItem) return; const updatedRAB = activeProject.rabItems.map(item => item.id === selectedRabItem.id ? { ...item, progress: progressInput } : item); const newLog: TaskLog = { id: Date.now(), date: progressDate, taskId: selectedRabItem.id, previousProgress: selectedRabItem.progress, newProgress: progressInput, note: progressNote }; updateProject({ rabItems: updatedRAB, taskLogs: [newLog, ...(activeProject.taskLogs || [])] }); setShowModal(false); };
  const handleEditProject = () => { if (!activeProject) return; updateProject({ name: inputName, client: inputClient, budgetLimit: inputBudget, startDate: inputStartDate, endDate: inputEndDate }); setShowModal(false); };
  const handlePayWorker = () => { if (!activeProject || !selectedWorkerId || paymentAmount <= 0) return; const worker = activeProject.workers.find(w => w.id === selectedWorkerId); const newTx: Transaction = { id: Date.now(), date: new Date().toISOString().split('T')[0], category: 'Upah Tukang', description: `Gaji Tukang`, amount: paymentAmount, type: 'expense', workerId: selectedWorkerId }; updateProject({ transactions: [newTx, ...activeProject.transactions] }); setShowModal(false); };
  const handleSaveWorker = () => { if(!activeProject) return; if (selectedWorkerId) { const updatedWorkers = activeProject.workers.map(w => { if(w.id === selectedWorkerId) { return { ...w, name: inputName, role: inputWorkerRole, wageUnit: inputWageUnit, realRate: inputRealRate, mandorRate: inputMandorRate }; } return w; }); updateProject({ workers: updatedWorkers }); } else { const newWorker: Worker = { id: Date.now(), name: inputName, role: inputWorkerRole, wageUnit: inputWageUnit, realRate: inputRealRate, mandorRate: inputMandorRate }; updateProject({ workers: [...(activeProject.workers || []), newWorker] }); } setShowModal(false); };
  const handleEditWorker = (w: Worker) => { setSelectedWorkerId(w.id); setInputName(w.name); setInputWorkerRole(w.role); setInputWageUnit(w.wageUnit); setInputRealRate(w.realRate); setInputMandorRate(w.mandorRate); setModalType('newWorker'); setShowModal(true); };
  const handleDeleteWorker = (w: Worker) => { if(!activeProject) return; if(confirm(`Yakin hapus ${w.name}?`)) { const updatedWorkers = activeProject.workers.filter(worker => worker.id !== w.id); updateProject({ workers: updatedWorkers }); } };
  const handleStockMovement = () => { if (!activeProject || !selectedMaterial || stockQty <= 0) return; const updatedMaterials = activeProject.materials.map(m => { if (m.id === selectedMaterial.id) return { ...m, stock: stockType === 'in' ? m.stock + stockQty : m.stock - stockQty }; return m; }); const newLog: MaterialLog = { id: Date.now(), materialId: selectedMaterial.id, date: stockDate, type: stockType, quantity: stockQty, notes: stockNotes || '-', actor: user?.displayName || 'User' }; updateProject({ materials: updatedMaterials, materialLogs: [newLog, ...(activeProject.materialLogs || [])] }); setShowModal(false); setStockQty(0); setStockNotes(''); };
  const handleSoftDeleteProject = async (p: Project) => { if(confirm(`Yakin ingin memindahkan proyek "${p.name}" ke Sampah?`)) { try { await updateDoc(doc(db, 'app_data', appId, 'projects', p.id), { isDeleted: true }); } catch(e) { alert("Gagal menghapus."); } } };
  const handleRestoreProject = async (p: Project) => { try { await updateDoc(doc(db, 'app_data', appId, 'projects', p.id), { isDeleted: false }); } catch(e) { alert("Gagal restore."); } };
  const handlePermanentDeleteProject = async (p: Project) => { if(confirm(`PERINGATAN: Proyek "${p.name}" akan dihapus SELAMANYA dan tidak bisa dikembalikan. Lanjutkan?`)) { try { await deleteDoc(doc(db, 'app_data', appId, 'projects', p.id)); } catch(e) { alert("Gagal hapus permanen."); } } };
  const toggleGroup = (groupId: string) => { setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] })); };
  const toggleReportGroup = (groupId: string) => { setExpandedReportIds(prev => ({ ...prev, [groupId]: !prev[groupId] })); };
  const handleGetLocation = () => { if (!navigator.geolocation) return alert("Browser tidak support GPS"); setIsGettingLoc(true); navigator.geolocation.getCurrentPosition((pos) => { setEvidenceLocation(`${pos.coords.latitude},${pos.coords.longitude}`); setIsGettingLoc(false); }, (err) => { alert("Gagal ambil lokasi."); setIsGettingLoc(false); }, { enableHighAccuracy: true }); };
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = (event) => { const img = new Image(); img.src = event.target?.result as string; img.onload = () => { const canvas = document.createElement('canvas'); let width = img.width; let height = img.height; const MAX_WIDTH = 800; const MAX_HEIGHT = 800; if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } } canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx?.drawImage(img, 0, 0, width, height); const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7); setEvidencePhoto(compressedDataUrl); handleGetLocation(); }; }; };
  const saveAttendanceWithEvidence = () => { if(!activeProject) return; if (!evidencePhoto) { alert("Wajib ambil foto bukti lapangan!"); return; } if (!evidenceLocation) { alert("Lokasi wajib terdeteksi!"); return; } const newLogs: any[] = []; Object.keys(attendanceData).forEach(wId => { newLogs.push({ id: Date.now() + Math.random(), date: attendanceDate, workerId: Number(wId), status: attendanceData[Number(wId)].status, note: '' }); }); let newEvidences = activeProject.attendanceEvidences || []; if (evidencePhoto || evidenceLocation) { newEvidences = [{ id: Date.now(), date: attendanceDate, photoUrl: evidencePhoto, location: evidenceLocation, uploader: user?.displayName || 'Unknown', timestamp: new Date().toISOString() }, ...newEvidences]; } updateProject({ attendanceLogs: [...activeProject.attendanceLogs, ...newLogs], attendanceEvidences: newEvidences }); setShowModal(false); };
  const getFilteredEvidence = () => { if (!activeProject || !activeProject.attendanceEvidences) return []; const start = new Date(filterStartDate); start.setHours(0,0,0,0); const end = new Date(filterEndDate); end.setHours(23,59,59,999); return activeProject.attendanceEvidences.filter(e => { const d = new Date(e.date); return d >= start && d <= end; }); };
  const calculateTotalDays = (logs: AttendanceLog[], workerId: number) => { if(!logs) return 0; return logs.filter(l => l.workerId === workerId).reduce((acc, curr) => { if (curr.status === 'Hadir') return acc + 1; if (curr.status === 'Setengah') return acc + 0.5; if (curr.status === 'Lembur') return acc + 1.5; return acc; }, 0); };
  const calculateWorkerFinancials = (p: Project, workerId: number) => { const worker = p.workers.find(w => w.id === workerId); if (!worker) return { totalDue: 0, totalPaid: 0, balance: 0 }; const days = calculateTotalDays(p.attendanceLogs, workerId); let dailyRate = worker.mandorRate; if (worker.wageUnit === 'Mingguan') dailyRate = worker.mandorRate / 7; if (worker.wageUnit === 'Bulanan') dailyRate = worker.mandorRate / 30; const totalDue = days * dailyRate; const totalPaid = (p.transactions || []).filter(t => t.workerId === workerId && t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0); return { totalDue, totalPaid, balance: totalDue - totalPaid }; };
  const getRABGroups = () => { if (!activeProject || !activeProject.rabItems) return {}; const groups: {[key: string]: RABItem[]} = {}; activeProject.rabItems.forEach(item => { if(!groups[item.category]) groups[item.category] = []; groups[item.category].push(item); }); return groups; };
  const loadDemoData = async () => { if (!user) return; setIsSyncing(true); const end = new Date(); const start = new Date(); start.setMonth(start.getMonth() - 6); 
    const d = (m: number) => { const x = new Date(start); x.setMonth(x.getMonth() + m); return x.toISOString().split('T')[0]; };
    const rabDemo: RABItem[] = [
        { id: 1, category: 'A. PEKERJAAN PERSIAPAN', name: 'Mobilisasi & Demobilisasi', unit: 'ls', volume: 1, unitPrice: 15000000, progress: 100, isAddendum: false },
        { id: 2, category: 'A. PEKERJAAN PERSIAPAN', name: 'Direksi Keet & Gudang', unit: 'ls', volume: 1, unitPrice: 20000000, progress: 100, isAddendum: false },
        { id: 3, category: 'A. PEKERJAAN PERSIAPAN', name: 'Pagar Sementara & Air Kerja', unit: 'ls', volume: 1, unitPrice: 15000000, progress: 100, isAddendum: false },
        { id: 4, category: 'B. PEKERJAAN STRUKTUR', name: 'Galian & Pondasi', unit: 'm3', volume: 50, unitPrice: 2000000, progress: 100, isAddendum: false },
        { id: 5, category: 'B. PEKERJAAN STRUKTUR', name: 'Beton Bertulang', unit: 'ls', volume: 1, unitPrice: 250000000, progress: 100, isAddendum: false },
        { id: 6, category: 'B. PEKERJAAN STRUKTUR', name: 'Rangka Atap Baja Ringan', unit: 'ls', volume: 1, unitPrice: 100000000, progress: 100, isAddendum: false },
        { id: 7, category: 'C. PEKERJAAN ARSITEKTUR', name: 'Pasangan Dinding Bata & Plester', unit: 'm2', volume: 300, unitPrice: 500000, progress: 100, isAddendum: false },
        { id: 8, category: 'C. PEKERJAAN ARSITEKTUR', name: 'Lantai Granit 60x60', unit: 'm2', volume: 200, unitPrice: 500000, progress: 100, isAddendum: false },
        { id: 9, category: 'C. PEKERJAAN ARSITEKTUR', name: 'Plafon Gypsum & List', unit: 'm2', volume: 150, unitPrice: 333333, progress: 100, isAddendum: false },
        { id: 10, category: 'C. PEKERJAAN ARSITEKTUR', name: 'Pengecatan Dinding & Plafon', unit: 'ls', volume: 1, unitPrice: 50000000, progress: 100, isAddendum: false },
        { id: 11, category: 'D. PEKERJAAN MEP', name: 'Instalasi Listrik & Titik Lampu', unit: 'titik', volume: 50, unitPrice: 1500000, progress: 100, isAddendum: false },
        { id: 12, category: 'D. PEKERJAAN MEP', name: 'Instalasi Air Bersih & Kotor', unit: 'ls', volume: 1, unitPrice: 75000000, progress: 100, isAddendum: false },
    ];
    const demo: Omit<Project, 'id'> = { name: "Rumah Mewah 1 Milyar (Selesai)", client: "Bpk Sultan", location: "Pondok Indah", status: 'Selesai', budgetLimit: 0, startDate: start.toISOString(), endDate: end.toISOString(), 
    rabItems: rabDemo,
    transactions: [
      { id: 101, date: d(0), category: 'Termin', description: 'DP 30%', amount: 300000000, type: 'income' },
      { id: 102, date: d(2), category: 'Termin', description: 'Termin 2 (40%)', amount: 400000000, type: 'income' },
      { id: 103, date: d(4), category: 'Termin', description: 'Termin 3 (25%)', amount: 250000000, type: 'income' },
      { id: 104, date: d(6), category: 'Termin', description: 'Retensi (5%)', amount: 50000000, type: 'income' },
      { id: 201, date: d(0), category: 'Material', description: 'Belanja Awal Bahan Alam', amount: 200000000, type: 'expense' },
      { id: 202, date: d(1), category: 'Upah Tukang', description: 'Gaji Bulan 1', amount: 100000000, type: 'expense' },
      { id: 203, date: d(3), category: 'Material', description: 'Granit & Cat', amount: 300000000, type: 'expense' },
      { id: 204, date: d(6), category: 'Upah Tukang', description: 'Pelunasan Gaji', amount: 150000000, type: 'expense' },
    ], 
    taskLogs: [
        {id:1, date:d(0), taskId:1, previousProgress:0, newProgress:100, note:'Start'},
        {id:2, date:d(1), taskId:4, previousProgress:0, newProgress:100, note:'Progress'},
        {id:3, date:d(2), taskId:5, previousProgress:0, newProgress:100, note:'Progress'},
        {id:4, date:d(3), taskId:7, previousProgress:0, newProgress:100, note:'Progress'},
        {id:5, date:d(4), taskId:8, previousProgress:0, newProgress:100, note:'Finish'}
    ],
    materials: [], materialLogs: [], workers: [], tasks: [], attendanceLogs: [], attendanceEvidences: [] }; try { await addDoc(collection(db, 'app_data', appId, 'projects'), demo); } catch(e) {} finally { setIsSyncing(false); } };

  const handleGenerateRAB = async () => {
    if (!aiPrompt) return alert("Masukkan deskripsi proyek dulu!");
    setIsGeneratingAI(true);
    const apiKey = ""; 
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Buatkan daftar item RAB konstruksi berdasarkan deskripsi berikut: '${aiPrompt}'.
              Output wajib format JSON murni array of objects dengan key:
              - category: (String, contoh: 'A. PEKERJAAN PERSIAPAN', 'B. PEKERJAAN STRUKTUR', dll)
              - name: (String, nama pekerjaan)
              - unit: (String, satuan ex: m2, m3, ls)
              - volume: (Number, estimasi volume)
              - unitPrice: (Number, estimasi harga satuan standar di Indonesia dalam Rupiah)
              Pastikan harga masuk akal. Jangan pakai markdown json.`
            }]
          }]
        })
      });
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const cleanJson = text.replace(/```json|```/g, '').trim();
      const items = JSON.parse(cleanJson);
      
      const newItems = items.map((i: any) => ({
        id: Date.now() + Math.random(),
        category: i.category,
        name: i.name,
        unit: i.unit,
        volume: i.volume,
        unitPrice: i.unitPrice,
        progress: 0,
        isAddendum: false
      }));

      if(activeProject) {
        updateProject({ rabItems: [...(activeProject.rabItems || []), ...newItems] });
        alert(`Berhasil menambahkan ${newItems.length} item RAB!`);
        setShowModal(false);
      }
    } catch (e) {
      console.error(e);
      alert("Gagal generate AI. Coba lagi.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const openModal = (type: any) => { setModalType(type); setShowModal(true); };

  if (!user && authStatus !== 'loading') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Lock className="text-blue-600" size={32} /></div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Kontraktor Pro</h1>
          <p className="text-slate-500 mb-8 text-sm">Hanya personel terdaftar yang dapat masuk.</p>
          {loginError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs mb-4 border border-red-200">{loginError}</div>}
          <button onClick={handleLogin} className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all"><LogIn size={20} />Masuk dengan Google</button>
        </div>
      </div>
    );
  }

  if (authStatus === 'loading') return <div className="h-screen flex flex-col items-center justify-center text-slate-500"><Loader2 className="animate-spin mb-2"/>Loading System...</div>;

  return (
    // ... (JSX Layout Sama Persis - Paste Bagian Return Anda di Sini, pastikan semua Modal dan Navigasi terhubung)
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      <style>{`
        @media print {
          @page { size: auto; margin: 0; }
          body { background: white; -webkit-print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:break-inside-avoid { break-inside: avoid; }
          .print\\:max-w-none { max-width: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:block { display: block !important; }
        }
      `}</style>
      
      {/* ... (Sidebar & Content sama seperti sebelumnya) */}
      
      {/* Pastikan Modal ada di sini: */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden max-h-[90vh] overflow-y-auto">
             <div className="p-4 border-b flex justify-between bg-slate-50 sticky top-0"><h3 className="font-bold">Input Data</h3><button onClick={() => setShowModal(false)}><X size={20}/></button></div>
             <div className="p-4 space-y-3">
               {/* SEMUA LOGIKA MODAL MASUKKAN KEMBALI DI SINI SEPERTI KODE SEBELUMNYA */}
               {modalType === 'newProject' && <><input className="w-full p-2 border rounded" placeholder="Nama Proyek" value={inputName} onChange={e => setInputName(e.target.value)} /><button onClick={() => { addDoc(collection(db, 'app_data', appId, 'projects'), { name: inputName, client: 'Client Baru', location: '-', status: 'Berjalan', budgetLimit: 0, startDate: new Date().toISOString(), isDeleted: false, transactions: [], materials: [], workers: [], rabItems: [] }); setShowModal(false); }} className="w-full bg-blue-600 text-white p-2 rounded font-bold">Simpan</button></>}
               {modalType === 'aiRAB' && (
                 <>
                   <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 mb-2"><h4 className="text-purple-700 font-bold text-sm flex items-center gap-1"><Sparkles size={14}/> AI Generator</h4><p className="text-xs text-purple-600 mt-1">Jelaskan proyek Anda, AI akan membuatkan RAB lengkap.</p></div>
                   <textarea className="w-full p-3 border rounded-lg text-sm h-32" placeholder="Contoh: Bangun pos satpam 3x3m..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}></textarea>
                   <button onClick={handleGenerateRAB} disabled={isGeneratingAI} className="w-full bg-purple-600 text-white p-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-purple-700 disabled:opacity-50">{isGeneratingAI ? <Loader2 className="animate-spin"/> : <Sparkles size={18}/>} {isGeneratingAI ? 'Sedang Membuat...' : 'Generate RAB Otomatis'}</button>
                 </>
               )}
               {/* ... (Masukkan kembali modal New RAB, Edit Project, Update Progress, Attendance, dll dari kode sebelumnya) ... */}
               {modalType === 'attendance' && activeProject && (<div><input type="date" className="w-full p-2 border rounded font-bold mb-4" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} /><div className="bg-slate-50 p-3 rounded mb-3 border border-blue-100"><h4 className="font-bold text-sm mb-2 text-slate-700 flex items-center gap-2"><Camera size={14}/> Bukti Lapangan (Wajib)</h4><div className="mb-2"><label className={`block w-full border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${evidencePhoto ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:bg-slate-100'}`}><input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />{evidencePhoto ? (<div className="relative"><img src={evidencePhoto} alt="Preview" className="h-32 mx-auto rounded shadow-sm object-cover"/><div className="text-xs text-green-600 font-bold mt-1">Foto Berhasil Diambil & Dikompres</div></div>) : (<div className="text-slate-500 text-xs flex flex-col items-center gap-1"><Camera size={24} className="text-slate-400"/><span>Klik untuk Ambil Foto</span></div>)}</label></div><div className="text-center">{isGettingLoc && <div className="text-xs text-blue-600 flex items-center justify-center gap-1 animate-pulse"><Loader2 size={12} className="animate-spin"/> Sedang mengambil titik lokasi...</div>}{!isGettingLoc && evidenceLocation && <div className="text-xs text-green-600 flex items-center justify-center gap-1 font-bold bg-green-100 py-1 rounded"><CheckCircle size={12}/> Lokasi Terkunci: {evidenceLocation}</div>}{!isGettingLoc && !evidenceLocation && evidencePhoto && <div className="text-xs text-red-500 font-bold">Gagal ambil lokasi. Pastikan GPS aktif!</div>}</div></div><div className="max-h-64 overflow-y-auto space-y-2 mb-4">{activeProject.workers.map(w => (<div key={w.id} className="p-2 border rounded bg-slate-50 text-sm flex justify-between items-center"><span>{w.name}</span><select className="p-1 border rounded bg-white" value={attendanceData[w.id]?.status} onChange={(e) => setAttendanceData({...attendanceData, [w.id]: { ...attendanceData[w.id], status: e.target.value }})}><option value="Hadir">Hadir</option><option value="Setengah">Setengah</option><option value="Lembur">Lembur</option><option value="Absen">Absen</option></select></div>))}</div><button onClick={saveAttendanceWithEvidence} disabled={!evidencePhoto || !evidenceLocation} className={`w-full text-white p-3 rounded font-bold transition-all ${(!evidencePhoto || !evidenceLocation) ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg'}`}>{(!evidencePhoto || !evidenceLocation) ? 'Lengkapi Bukti Dulu' : 'Simpan Absensi'}</button></div>)}
               {modalType === 'addUser' && (<><input className="w-full p-2 border rounded" placeholder="Nama Lengkap" value={inputName} onChange={e => setInputName(e.target.value)} /><input className="w-full p-2 border rounded" placeholder="Email Google" type="email" value={inputEmail} onChange={e => setInputEmail(e.target.value)} /><div className="flex gap-2 items-center"><label className="text-xs w-20">Role</label><select className="flex-1 p-2 border rounded" value={inputRole} onChange={e => setInputRole(e.target.value as UserRole)}><option value="pengawas">Pengawas (Absen & Tukang Only)</option><option value="keuangan">Keuangan (Uang Only)</option><option value="kontraktor">Kontraktor (Project Manager)</option><option value="super_admin">Super Admin (Owner)</option></select></div><button onClick={handleAddUser} className="w-full bg-blue-600 text-white p-2 rounded font-bold">Tambah User</button></>)}
             </div>
          </div>
        </div>
      )}
      
      {/* ... (Sisa JSX Navigation & Content sama seperti sebelumnya) */}
    </div>
  );
};

export default App;
