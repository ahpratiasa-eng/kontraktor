import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Wallet, Package, Users, TrendingUp, 
  Plus, Trash2, ArrowLeft, Building2, 
  Loader2, RefreshCw, X, Calendar, FileText, 
  Banknote, Edit, Settings, LogOut, LogIn, Lock, ShieldCheck, UserPlus,
  History, AlertTriangle, Camera, ExternalLink, Image as ImageIcon, CheckCircle, Printer, RotateCcw, Sparkles
} from 'lucide-react';

import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';

import { 
  collection, doc, addDoc, updateDoc, 
  deleteDoc, onSnapshot, query, getDoc, setDoc 
} from 'firebase/firestore';

// --- IMPORTS DARI FILE TERPISAH (MODULAR) ---
import { auth, db, googleProvider, appId } from './lib/firebase';
import type { 
  Project, AppUser, RABItem, Transaction, Material, 
  MaterialLog, Worker, AttendanceLog, TaskLog, GroupedTransaction, UserRole
} from './types'; 
import { 
  formatRupiah, getGroupedTransactions, calculateProjectHealth, getStats 
} from './utils/helpers'; 
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
  const [inputName, setInputName] = useState(''); 
  const [inputEmail, setInputEmail] = useState(''); 
  const [inputRole, setInputRole] = useState<UserRole>('pengawas'); 
  const [inputClient, setInputClient] = useState(''); 
  const [inputDuration, setInputDuration] = useState(30); 
  const [inputBudget, setInputBudget] = useState(0); 
  const [inputStartDate, setInputStartDate] = useState(''); 
  const [inputEndDate, setInputEndDate] = useState('');
  
  const [rabCategory, setRabCategory] = useState(''); 
  const [rabItemName, setRabItemName] = useState(''); 
  const [rabUnit, setRabUnit] = useState('ls'); 
  const [rabVol, setRabVol] = useState(0); 
  const [rabPrice, setRabPrice] = useState(0); 
  const [selectedRabItem, setSelectedRabItem] = useState<RABItem | null>(null);

  const [inputRealRate, setInputRealRate] = useState(150000); 
  const [inputMandorRate, setInputMandorRate] = useState(170000); 
  const [inputWorkerRole, setInputWorkerRole] = useState<'Tukang' | 'Kenek' | 'Mandor'>('Tukang'); 
  const [inputWageUnit, setInputWageUnit] = useState<'Harian' | 'Mingguan' | 'Bulanan'>('Harian');

  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null); 
  const [stockType, setStockType] = useState<'in' | 'out'>('in'); 
  const [stockQty, setStockQty] = useState(0); 
  const [stockDate, setStockDate] = useState(new Date().toISOString().split('T')[0]); 
  const [stockNotes, setStockNotes] = useState('');

  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null); 
  const [paymentAmount, setPaymentAmount] = useState(0); 
  const [amount, setAmount] = useState(0); 
  
  const [progressInput, setProgressInput] = useState(0); 
  const [progressDate, setProgressDate] = useState(new Date().toISOString().split('T')[0]); 
  const [progressNote, setProgressNote] = useState('');
  
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]); 
  const [attendanceData, setAttendanceData] = useState<{[workerId: number]: {status: string, note: string}}>({}); 
  const [filterStartDate, setFilterStartDate] = useState(new Date().toISOString().split('T')[0]); 
  const [filterEndDate, setFilterEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [evidencePhoto, setEvidencePhoto] = useState<string>(''); 
  const [evidenceLocation, setEvidenceLocation] = useState<string>(''); 
  const [isGettingLoc, setIsGettingLoc] = useState(false);

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
  
  const getRABGroups = () => { 
      if (!activeProject || !activeProject.rabItems) return {}; 
      const groups: {[key: string]: RABItem[]} = {}; 
      activeProject.rabItems.forEach(item => { if(!groups[item.category]) groups[item.category] = []; groups[item.category].push(item); }); 
      return groups; 
  };
  const rabGroups = getRABGroups();

  // Helper Functions inside App
  const updateProject = async (data: Partial<Project>) => { if (!user || !activeProjectId) return; setIsSyncing(true); try { await updateDoc(doc(db, 'app_data', appId, 'projects', activeProjectId), data); } catch(e) { alert("Gagal simpan."); } setIsSyncing(false); };
  const handleLogin = async () => { setLoginError(''); try { await signInWithPopup(auth, googleProvider); } catch (e) { setLoginError("Login gagal."); } };
  const handleLogout = async () => { if(confirm("Keluar?")) await signOut(auth); setProjects([]); setView('project-list'); };
  const handleAddUser = async () => { if (!inputEmail || !inputName) return; try { await setDoc(doc(db, 'app_users', inputEmail), { email: inputEmail, name: inputName, role: inputRole }); alert("User berhasil ditambahkan!"); setShowModal(false); setInputEmail(''); setInputName(''); } catch (e) { alert("Gagal menambah user."); } };
  const handleDeleteUser = async (emailToDelete: string) => { if (emailToDelete === user?.email) return alert("Tidak bisa hapus diri sendiri!"); if (confirm(`Hapus akses ${emailToDelete}?`)) { try { await deleteDoc(doc(db, 'app_users', emailToDelete)); } catch (e) { alert("Gagal."); } } };
  
  const handleSaveRAB = () => { 
     if(!activeProject || !rabItemName) return; 
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
  
  const handlePayWorker = () => { 
    if (!activeProject || !selectedWorkerId || paymentAmount <= 0) return; 
    // worker variable is not needed here as we just use ID for transaction
    const newTx: Transaction = { id: Date.now(), date: new Date().toISOString().split('T')[0], category: 'Upah Tukang', description: `Gaji Tukang`, amount: paymentAmount, type: 'expense', workerId: selectedWorkerId }; 
    updateProject({ transactions: [newTx, ...activeProject.transactions] }); 
    setShowModal(false); 
  };

  const handleSaveWorker = () => { if(!activeProject) return; if (selectedWorkerId) { const updatedWorkers = activeProject.workers.map(w => { if(w.id === selectedWorkerId) { return { ...w, name: inputName, role: inputWorkerRole, wageUnit: inputWageUnit, realRate: inputRealRate, mandorRate: inputMandorRate }; } return w; }); updateProject({ workers: updatedWorkers }); } else { const newWorker: Worker = { id: Date.now(), name: inputName, role: inputWorkerRole, wageUnit: inputWageUnit, realRate: inputRealRate, mandorRate: inputMandorRate }; updateProject({ workers: [...(activeProject.workers || []), newWorker] }); } setShowModal(false); };
  const handleEditWorker = (w: Worker) => { setSelectedWorkerId(w.id); setInputName(w.name); setInputWorkerRole(w.role); setInputWageUnit(w.wageUnit); setInputRealRate(w.realRate); setInputMandorRate(w.mandorRate); setModalType('newWorker'); setShowModal(true); };
  const handleDeleteWorker = (w: Worker) => { if(!activeProject) return; if(confirm(`Yakin hapus ${w.name}?`)) { const updatedWorkers = activeProject.workers.filter(worker => worker.id !== w.id); updateProject({ workers: updatedWorkers }); } };
  
  const handleStockMovement = () => { if (!activeProject || !selectedMaterial || stockQty <= 0) return; const updatedMaterials = activeProject.materials.map(m => { if (m.id === selectedMaterial.id) return { ...m, stock: stockType === 'in' ? m.stock + stockQty : m.stock - stockQty }; return m; }); const newLog: MaterialLog = { id: Date.now(), materialId: selectedMaterial.id, date: stockDate, type: stockType, quantity: stockQty, notes: stockNotes || '-', actor: user?.displayName || 'User' }; updateProject({ materials: updatedMaterials, materialLogs: [newLog, ...(activeProject.materialLogs || [])] }); setShowModal(false); setStockQty(0); setStockNotes(''); };
  const handleSoftDeleteProject = async (p: Project) => { if(confirm(`Yakin ingin memindahkan proyek "${p.name}" ke Sampah?`)) { try { await updateDoc(doc(db, 'app_data', appId, 'projects', p.id), { isDeleted: true }); } catch(e) { alert("Gagal menghapus."); } } };
  const handleRestoreProject = async (p: Project) => { try { await updateDoc(doc(db, 'app_data', appId, 'projects', p.id), { isDeleted: false }); } catch(e) { alert("Gagal restore."); } };
  const handlePermanentDeleteProject = async (p: Project) => { if(confirm(`PERINGATAN: Proyek "${p.name}" akan dihapus SELAMANYA dan tidak bisa dikembalikan. Lanjutkan?`)) { try { await deleteDoc(doc(db, 'app_data', appId, 'projects', p.id)); } catch(e) { alert("Gagal hapus permanen."); } } };
  
  const toggleGroup = (groupId: string) => { setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] })); };
  const toggleReportGroup = (groupId: string) => { setExpandedReportIds(prev => ({ ...prev, [groupId]: !prev[groupId] })); };
  
  const handleGetLocation = () => { 
    if (!navigator.geolocation) return alert("Browser tidak support GPS"); 
    setIsGettingLoc(true); 
    navigator.geolocation.getCurrentPosition(
      (pos) => { setEvidenceLocation(`${pos.coords.latitude},${pos.coords.longitude}`); setIsGettingLoc(false); }, 
      (err) => { console.error("GPS Error:", err); alert("Gagal ambil lokasi."); setIsGettingLoc(false); }, 
      { enableHighAccuracy: true }
    ); 
  };
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = (event) => { const img = new Image(); img.src = event.target?.result as string; img.onload = () => { const canvas = document.createElement('canvas'); let width = img.width; let height = img.height; const MAX_WIDTH = 800; const MAX_HEIGHT = 800; if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } } canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx?.drawImage(img, 0, 0, width, height); const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7); setEvidencePhoto(compressedDataUrl); handleGetLocation(); }; }; };
  const saveAttendanceWithEvidence = () => { if(!activeProject) return; if (!evidencePhoto) { alert("Wajib ambil foto bukti lapangan!"); return; } if (!evidenceLocation) { alert("Lokasi wajib terdeteksi!"); return; } const newLogs: any[] = []; Object.keys(attendanceData).forEach(wId => { newLogs.push({ id: Date.now() + Math.random(), date: attendanceDate, workerId: Number(wId), status: attendanceData[Number(wId)].status, note: '' }); }); let newEvidences = activeProject.attendanceEvidences || []; if (evidencePhoto || evidenceLocation) { newEvidences = [{ id: Date.now(), date: attendanceDate, photoUrl: evidencePhoto, location: evidenceLocation, uploader: user?.displayName || 'Unknown', timestamp: new Date().toISOString() }, ...newEvidences]; } updateProject({ attendanceLogs: [...activeProject.attendanceLogs, ...newLogs], attendanceEvidences: newEvidences }); setShowModal(false); };
  
  const getFilteredEvidence = () => { if (!activeProject || !activeProject.attendanceEvidences) return []; const start = new Date(filterStartDate); start.setHours(0,0,0,0); const end = new Date(filterEndDate); end.setHours(23,59,59,999); return activeProject.attendanceEvidences.filter(e => { const d = new Date(e.date); return d >= start && d <= end; }); };
  const calculateTotalDays = (logs: AttendanceLog[], workerId: number) => { if(!logs) return 0; return logs.filter(l => l.workerId === workerId).reduce((acc, curr) => { if (curr.status === 'Hadir') return acc + 1; if (curr.status === 'Setengah') return acc + 0.5; if (curr.status === 'Lembur') return acc + 1.5; return acc; }, 0); };
  const calculateWorkerFinancials = (p: Project, workerId: number) => { const worker = p.workers.find(w => w.id === workerId); if (!worker) return { totalDue: 0, totalPaid: 0, balance: 0 }; const days = calculateTotalDays(p.attendanceLogs, workerId); let dailyRate = worker.mandorRate; if (worker.wageUnit === 'Mingguan') dailyRate = worker.mandorRate / 7; if (worker.wageUnit === 'Bulanan') dailyRate = worker.mandorRate / 30; const totalDue = days * dailyRate; const totalPaid = (p.transactions || []).filter(t => t.workerId === workerId && t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0); return { totalDue, totalPaid, balance: totalDue - totalPaid }; };
  
  const createItem = (field: string, newItem: any) => { if(!activeProject) return; updateProject({ [field]: [...(activeProject as any)[field], newItem] }); setShowModal(false); }
  const openModal = (type: any) => { setModalType(type); setShowModal(true); };

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
              text: `Buatkan daftar item RAB konstruksi berdasarkan deskripsi berikut: '${aiPrompt}'. Output wajib format JSON murni array of objects dengan key: category, name, unit, volume, unitPrice. No markdown.`
            }]
          }]
        })
      });
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const cleanJson = text.replace(/```json|```/g, '').trim();
      const items = JSON.parse(cleanJson);
      const newItems = items.map((i: any) => ({ ...i, id: Date.now() + Math.random(), progress: 0, isAddendum: false }));
      if(activeProject) { updateProject({ rabItems: [...(activeProject.rabItems || []), ...newItems] }); alert(`Berhasil menambahkan ${newItems.length} item RAB!`); setShowModal(false); }
    } catch (e) { console.error(e); alert("Gagal generate AI. Coba lagi."); } finally { setIsGeneratingAI(false); }
  };

  const loadDemoData = async () => { if (!user) return; setIsSyncing(true); const start = new Date(); start.setMonth(start.getMonth() - 6); const d = (m: number) => { const x = new Date(start); x.setMonth(x.getMonth() + m); return x.toISOString().split('T')[0]; }; const demo: any = { name: "Rumah Mewah 2 Lantai (Full Demo)", client: "Bpk Sultan", location: "PIK 2", status: 'Selesai', budgetLimit: 0, startDate: d(-30), endDate: d(30), rabItems: [ {id:1, category:'A. PERSIAPAN', name:'Pembersihan Lahan', unit:'ls', volume:1, unitPrice:15000000, progress:100, isAddendum:false} ], transactions: [], workers: [], materials: [], materialLogs: [], taskLogs: [], attendanceLogs: [], attendanceEvidences: [] }; await addDoc(collection(db, 'app_data', appId, 'projects'), demo); setIsSyncing(false); };

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
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      <style>{`@media print { body { background: white; } .print\\:hidden { display: none !important; } .print\\:break-inside-avoid { break-inside: avoid; } }`}</style>
      
      {/* SIDEBAR (Desktop Only) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r fixed inset-y-0 z-20 print:hidden">
        <div className="p-6 border-b flex items-center gap-2 font-bold text-xl text-slate-800"><Building2 className="text-blue-600"/> Kontraktor Pro</div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
           <button onClick={() => openModal('newProject')} className="w-full bg-blue-600 text-white p-3 rounded-lg flex items-center gap-2 font-bold hover:bg-blue-700 mb-4"><Plus size={20}/> Proyek Baru</button>
           <button onClick={() => setView('project-list')} className={`w-full text-left p-3 rounded-lg flex items-center gap-2 ${view === 'project-list' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}><LayoutDashboard size={20}/> Dashboard</button>
           {canAccessManagement() && <button onClick={() => setView('user-management')} className={`w-full text-left p-3 rounded-lg flex items-center gap-2 ${view === 'user-management' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}><Users size={20}/> User Management</button>}
           <button onClick={() => setView('trash-bin')} className={`w-full text-left p-3 rounded-lg flex items-center gap-2 ${view === 'trash-bin' ? 'bg-red-50 text-red-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}><Trash2 size={20}/> Tong Sampah</button>
        </div>
        <div className="p-4 border-t"><button onClick={handleLogout} className="w-full border border-red-200 text-red-600 p-2 rounded-lg text-sm flex items-center justify-center gap-2"><LogOut size={16}/> Logout</button></div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 md:ml-64 flex flex-col relative pb-20 md:pb-0">
        
        {/* HEADER (Desktop: Offset left, Mobile: Full) */}
        <header className="bg-white px-4 py-3 sticky top-0 z-10 shadow-sm flex justify-between items-center print:hidden">
            {view === 'project-list' || view === 'user-management' || view === 'trash-bin' ? (
            <div className="flex items-center gap-2 font-bold text-slate-800 md:hidden"><Building2 className="text-blue-600"/> <div className="flex flex-col"><span>Kontraktor App</span>{user && <span className="text-[10px] text-slate-400 font-normal uppercase">{userRole?.replace('_', ' ')}: {user.displayName?.split(' ')[0]}</span>}</div></div>
            ) : (<button onClick={() => setView('project-list')} className="text-slate-500 flex items-center gap-1 text-sm"><ArrowLeft size={18}/> Kembali</button>)}
            <div className="flex items-center gap-2 ml-auto">
             <button onClick={() => setView('trash-bin')} className="md:hidden text-slate-400 p-2 hover:text-red-500"><Trash2 size={20}/></button>
            {canAccessManagement() && view === 'project-list' && <button onClick={() => setView('user-management')} className="text-slate-500 p-2 bg-slate-100 rounded-full hover:bg-slate-200 md:hidden"><Settings size={18} /></button>}
            {view === 'project-list' && canEditProject() && <button onClick={() => openModal('newProject')} className="bg-blue-600 text-white px-3 py-2 rounded-full shadow flex items-center gap-2 text-sm font-bold md:hidden"><Plus size={18}/> <span className="hidden sm:inline">Proyek Baru</span></button>}
            <button onClick={handleLogout} className="text-red-500 p-2 bg-red-50 rounded-full hover:bg-red-100 md:hidden"><LogOut size={18} /></button>
            </div>
        </header>

        {/* CONTENT */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            
            {/* TRASH BIN VIEW */}
            {view === 'trash-bin' && (
                <main className="space-y-4">
                <h2 className="font-bold text-2xl text-slate-800 mb-6">Tong Sampah Proyek</h2>
                {projects.filter(p => p.isDeleted).length === 0 && <div className="text-center py-20 text-slate-400 bg-white rounded-xl border border-dashed">Tong sampah kosong.</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{projects.filter(p => p.isDeleted).map(p => (<div key={p.id} className="bg-red-50 p-6 rounded-xl border border-red-100 flex flex-col justify-between h-full"><div className="mb-4"><h3 className="font-bold text-lg text-slate-800">{p.name}</h3><p className="text-sm text-slate-500">{p.client}</p></div><div className="flex gap-2 mt-auto"><button onClick={() => handleRestoreProject(p)} className="flex-1 bg-green-100 text-green-700 p-2 rounded-lg text-sm font-bold hover:bg-green-200 flex items-center justify-center gap-2"><RotateCcw size={16}/> Pulihkan</button>{canAccessManagement() && <button onClick={() => handlePermanentDeleteProject(p)} className="flex-1 bg-red-200 text-red-800 p-2 rounded-lg text-sm font-bold hover:bg-red-300 flex items-center justify-center gap-2"><Trash2 size={16}/> Hapus</button>}</div></div>))}</div>
                </main>
            )}

            {/* USER MANAGEMENT VIEW */}
            {view === 'user-management' && canAccessManagement() && (
                <main className="space-y-6">
                    <div className="bg-blue-600 text-white p-8 rounded-2xl shadow-lg mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4"><div><h2 className="font-bold text-2xl flex items-center gap-2"><ShieldCheck size={28}/> Kelola Akses Pengguna</h2></div><button onClick={() => openModal('addUser')} className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-50 shadow-md"><UserPlus size={20}/> Tambah User</button></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{appUsers.map((u) => (<div key={u.email} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4"><div className="flex items-start justify-between"><div><div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-lg mb-2">{u.name.charAt(0)}</div><p className="font-bold text-lg text-slate-800">{u.name}</p><p className="text-sm text-slate-500">{u.email}</p></div>{u.email !== user?.email && <button onClick={() => handleDeleteUser(u.email)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={20}/></button>}</div><span className="self-start text-xs px-3 py-1 rounded-full font-bold bg-blue-100 text-blue-700 uppercase">{u.role.replace('_', ' ')}</span></div>))}</div>
                </main>
            )}

            {view === 'project-list' && (
                <main className="space-y-6">
                    <div className="hidden md:block mb-8"><h1 className="text-3xl font-bold text-slate-800">Dashboard Proyek</h1><p className="text-slate-500">Selamat datang kembali, {user?.displayName}</p></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col"><span className="text-xs text-slate-500 uppercase font-bold">Total Proyek</span><span className="text-2xl font-bold text-slate-800">{projects.filter(p => !p.isDeleted).length}</span></div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col"><span className="text-xs text-slate-500 uppercase font-bold">Berjalan</span><span className="text-2xl font-bold text-blue-600">{projects.filter(p => !p.isDeleted && p.status !== 'Selesai').length}</span></div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col"><span className="text-xs text-slate-500 uppercase font-bold">Selesai</span><span className="text-2xl font-bold text-green-600">{projects.filter(p => !p.isDeleted && p.status === 'Selesai').length}</span></div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col"><span className="text-xs text-slate-500 uppercase font-bold">Perlu Perhatian</span><span className="text-2xl font-bold text-red-600">{projects.filter(p => !p.isDeleted && calculateProjectHealth(p).isCritical).length}</span></div>
                    </div>
                    {projects.filter(p => !p.isDeleted).length === 0 && <div className="text-center py-20 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 bg-slate-50"><p className="mb-4">Belum ada proyek aktif.</p><button onClick={loadDemoData} disabled={isSyncing} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-green-700 shadow-lg flex items-center gap-2 mx-auto transition-transform hover:scale-105">{isSyncing ? <Loader2 className="animate-spin"/> : <RefreshCw size={18}/>} Muat Data Demo 1 Milyar</button></div>}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.filter(p => !p.isDeleted).map(p => {
                            const health = calculateProjectHealth(p);
                            return (
                            <div key={p.id} onClick={() => { setActiveProjectId(p.id); setView('project-detail'); }} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all group relative overflow-hidden">
                                {health.isCritical && <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-3 py-1 rounded-bl-xl font-bold flex items-center gap-1 shadow-sm"><AlertTriangle size={12}/> PERHATIAN</div>}
                                <div className="flex justify-between items-start mb-4"><div><h3 className="font-bold text-xl text-slate-800 group-hover:text-blue-600 transition-colors">{p.name}</h3><p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><Users size={14}/> {p.client}</p></div></div>
                                <div className="space-y-2"><div className="flex justify-between text-xs text-slate-600"><span>Progress Fisik</span><span className="font-bold">{getStats(p).prog.toFixed(0)}%</span></div><div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-1000 ${health.isCritical ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${getStats(p).prog}%` }}></div></div></div>
                                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center"><div className="text-xs text-slate-400">Update: {new Date().toLocaleDateString('id-ID')}</div>{canEditProject() && <button onClick={(e) => {e.stopPropagation(); handleSoftDeleteProject(p); }} className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={18}/></button>}</div>
                            </div>
                        )})}
                    </div>
                </main>
            )}

            {view === 'project-detail' && activeProject && (
                <div className="space-y-6">
                    {activeTab === 'progress' && (
                        <div className="flex items-center gap-2 mb-4 bg-slate-200 p-1 rounded-lg w-full md:w-auto md:inline-flex">
                            <button onClick={() => setRabViewMode('client')} className={`flex-1 md:flex-none px-4 text-xs font-bold py-2 rounded-md transition ${rabViewMode === 'client' ? 'bg-white text-blue-600 shadow' : 'text-slate-500'}`}>View Client</button>
                            <button onClick={() => setRabViewMode('internal')} className={`flex-1 md:flex-none px-4 text-xs font-bold py-2 rounded-md transition ${rabViewMode === 'internal' ? 'bg-white text-blue-600 shadow' : 'text-slate-500'}`}>Internal RAB</button>
                        </div>
                    )}
                    {activeTab === 'dashboard' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                    <h2 className="text-xl font-bold text-slate-800 mb-1">{activeProject.name}</h2>
                                    <p className="text-sm text-slate-500 mb-6">{activeProject.location}</p>
                                    {userRole === 'kontraktor' && <button onClick={() => openModal('editProject')} className="w-full mb-4 border border-slate-200 text-blue-600 p-2 rounded-lg font-bold hover:bg-blue-50 flex items-center justify-center gap-2"><Settings size={18}/> Pengaturan Proyek</button>}
                                    {canSeeMoney() && (<button onClick={() => setView('report-view')} className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold flex justify-center gap-2 hover:bg-blue-700 shadow-lg transition-transform hover:scale-105"><FileText size={20}/> Lihat Laporan Detail</button>)}
                                </div>
                            </div>
                            <div className="lg:col-span-2"><SCurveChart stats={getStats(activeProject)} project={activeProject} /></div>
                        </div>
                    )}
                    {activeTab === 'progress' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-3"><SCurveChart stats={getStats(activeProject)} project={activeProject} compact={true} /></div>
                            <div className="lg:col-span-3">
                                <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg text-slate-700">Rincian RAB</h3>{canEditProject() && <div className="flex gap-2"><button onClick={() => { setModalType('aiRAB'); setShowModal(true); }} className="text-xs bg-purple-100 text-purple-700 px-3 py-2 rounded-lg font-bold border border-purple-200 hover:bg-purple-200 flex items-center gap-1"><Sparkles size={14}/> Auto RAB</button><button onClick={handleAddCCO} className="text-xs bg-orange-100 text-orange-700 px-3 py-2 rounded-lg font-bold border border-orange-200">+ CCO</button><button onClick={() => { setSelectedRabItem(null); setModalType('newRAB'); setShowModal(true); }} className="text-xs bg-blue-600 text-white px-3 py-2 rounded-lg font-bold">+ Item</button></div>}</div>
                                <div className="space-y-4 pb-20">
                                    {Object.keys(rabGroups).sort().map(category => (
                                        <div key={category} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                                        <div className="bg-slate-50 p-4 font-bold text-sm text-slate-700 border-b flex justify-between"><span>{category}</span></div>
                                        {rabViewMode === 'internal' && (
                                            <div className="divide-y divide-slate-100">{rabGroups[category].map(item => (<div key={item.id} className={`p-4 text-sm hover:bg-slate-50 ${item.isAddendum ? 'bg-orange-50' : ''}`}><div className="flex justify-between mb-2"><span className="font-bold text-slate-800">{item.name} {item.isAddendum && <span className="text-[9px] bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full ml-2">CCO</span>}</span><span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">{item.progress}%</span></div><div className="flex justify-between text-xs text-slate-500 mb-3"><span>{item.volume} {item.unit} x {formatRupiah(item.unitPrice)}</span><span className="font-bold text-slate-700">{formatRupiah(item.volume * item.unitPrice)}</span></div><div className="w-full bg-gray-200 rounded-full h-2 mb-3"><div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${item.progress}%` }}></div></div>{canEditProject() && (<div className="flex justify-end gap-2"><button onClick={() => { setSelectedRabItem(item); setProgressInput(item.progress); setProgressDate(new Date().toISOString().split('T')[0]); setModalType('updateProgress'); setShowModal(true); }} className="text-xs bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg font-bold">Update Fisik</button><button onClick={() => { setSelectedRabItem(item); setModalType('taskHistory'); setShowModal(true); }} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg"><History size={14}/></button><button onClick={() => handleEditRABItem(item)} className="text-xs bg-yellow-100 text-yellow-600 px-3 py-1.5 rounded-lg"><Edit size={14}/></button><button onClick={() => deleteRABItem(item.id)} className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-lg"><Trash2 size={14}/></button></div>)}</div>))}</div>
                                        )}
                                        {rabViewMode === 'client' && (
                                            <div className="divide-y divide-slate-100">{rabGroups[category].map(item => (<div key={item.id} className="p-4 text-sm flex justify-between items-center hover:bg-slate-50"><div><div className="font-bold text-slate-800">{item.name}</div><div className="text-xs text-slate-500">Vol: {item.volume} {item.unit}</div></div><div className="text-right"><div className={`text-xs px-3 py-1 rounded-full font-bold ${item.progress === 100 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{item.progress}%</div></div></div>))}<div className="p-4 bg-slate-50 text-right text-xs font-bold text-slate-700 border-t">Subtotal: {formatRupiah(rabGroups[category].reduce((a,b)=>a+(b.volume*b.unitPrice),0))}</div></div>
                                        )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'finance' && canAccessFinance() && (
                        <div className="max-w-2xl mx-auto"><div className="bg-white p-6 rounded-2xl border shadow-sm mb-6"><div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-xl"><button onClick={() => setTxType('expense')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${txType === 'expense' ? 'bg-white shadow text-red-600' : 'text-slate-500'}`}>Pengeluaran</button><button onClick={() => setTxType('income')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${txType === 'income' ? 'bg-white shadow text-green-600' : 'text-slate-500'}`}>Pemasukan</button></div><form onSubmit={handleTransaction} className="space-y-4"><select name="cat" className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-white outline-none">{txType === 'expense' ? <><option>Material</option><option>Upah Tukang</option><option>Operasional</option></> : <option>Termin/DP</option>}</select><input required name="desc" placeholder="Keterangan" className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none"/><NumberInput className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold outline-none" placeholder="Nominal" value={amount} onChange={setAmount} /><button className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold shadow-lg">Simpan</button></form></div><div className="space-y-3">{getGroupedTransactions(activeProject.transactions).map((group: GroupedTransaction) => (<TransactionGroup key={group.id} group={group} isExpanded={expandedGroups[group.id]} onToggle={() => toggleGroup(group.id)} />))}</div></div>
                    )}
                    {activeTab === 'workers' && canAccessWorkers() && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div><button onClick={() => openModal('attendance')} className="w-full bg-blue-600 text-white p-4 rounded-2xl shadow-lg font-bold mb-6">Isi Absensi</button><div className="bg-white p-6 rounded-2xl border shadow-sm"><h3 className="font-bold text-slate-700 mb-4">Rekap & Filter</h3><div className="flex gap-2 mb-4 bg-slate-50 p-2 rounded-xl border"><div className="flex-1"><label className="text-[10px] block font-bold">Dari</label><input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="w-full bg-white border rounded p-1 text-xs" /></div><div className="flex-1"><label className="text-[10px] block font-bold">Sampai</label><input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="w-full bg-white border rounded p-1 text-xs" /></div></div><div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="border-b"><th className="p-3 text-left">Nama</th><th className="p-3 text-center">Hadir</th><th className="p-3 text-center">Lembur</th>{canSeeMoney() && <th className="p-3 text-right">Upah</th>}</tr></thead><tbody>{getFilteredAttendance().map((stat: any, idx) => (<tr key={idx} className="border-b"><td className="p-3 font-medium">{stat.name}</td><td className="p-3 text-center text-green-600">{stat.hadir}</td><td className="p-3 text-center text-blue-600">{stat.lembur}</td>{canSeeMoney() && <td className="p-3 text-right font-bold">{formatRupiah(stat.totalCost)}</td>}</tr>))}</tbody></table></div></div></div><div><div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg text-slate-700">Tim</h3><button onClick={() => openModal('newWorker')} className="bg-white border px-4 py-2 rounded-xl text-sm font-bold shadow-sm">+ Baru</button></div><div className="space-y-3">{(activeProject.workers || []).map(w => { const f = calculateWorkerFinancials(activeProject, w.id); return (<div key={w.id} className="bg-white p-5 rounded-2xl border shadow-sm text-sm"><div className="flex justify-between items-start mb-3 border-b pb-3"><div><p className="font-bold text-base">{w.name}</p><p className="text-xs bg-slate-100 px-2 py-0.5 rounded inline-block mt-1">{w.role} ({w.wageUnit})</p></div></div><div className="flex justify-between items-center">{canSeeMoney() && <div><p className="text-[10px] text-slate-500 uppercase">Sisa Hutang</p><p className="font-bold text-lg">{formatRupiah(f.balance)}</p></div>}<div className="flex gap-2 ml-auto">{canSeeMoney() && f.balance > 0 && <button onClick={() => { setSelectedWorkerId(w.id); setPaymentAmount(f.balance); openModal('payWorker'); }} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold"><Banknote size={14}/> Bayar</button>}{canAccessWorkers() && (<><button onClick={() => handleEditWorker(w)} className="bg-blue-50 text-blue-600 p-2 rounded-lg"><Edit size={16}/></button><button onClick={() => handleDeleteWorker(w)} className="bg-red-50 text-red-600 p-2 rounded-lg"><Trash2 size={16}/></button></>)}</div></div></div>)})}</div><div className="bg-white p-6 rounded-2xl border shadow-sm mt-6"><h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><ImageIcon size={20}/> Galeri Bukti</h3><div className="grid grid-cols-2 gap-3">{getFilteredEvidence().map(ev => (<div key={ev.id} className="relative rounded-xl overflow-hidden border"><img src={ev.photoUrl} alt="Bukti" className="w-full h-32 object-cover"/><div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-white"><div className="text-xs font-bold">{new Date(ev.date).toLocaleDateString('id-ID')}</div>{ev.location && <a href={`https://www.google.com/maps/search/?api=1&query=${ev.location}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-blue-300"><ExternalLink size={10}/> Peta</a>}</div></div>))}</div></div></div></div>
                    )}
                    {activeTab === 'logistics' && (
                        <div className="max-w-4xl mx-auto"><div className="flex justify-between items-center mb-6"><h3 className="font-bold text-xl text-slate-700">Stok Material</h3><button onClick={() => openModal('newMaterial')} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold shadow-md">+ Material Baru</button></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{(activeProject.materials || []).map(m => (<div key={m.id} className="bg-white p-5 rounded-2xl border shadow-sm relative overflow-hidden">{m.stock <= m.minStock && <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] px-3 py-1 rounded-bl-xl font-bold shadow-sm">STOK MENIPIS</div>}<div className="flex justify-between items-start mb-4"><div><div className="font-bold text-slate-800 text-lg mb-1">{m.name}</div><div className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded inline-block">Min: {m.minStock} {m.unit}</div></div><div className="text-right"><div className={`text-2xl font-bold ${m.stock <= m.minStock ? 'text-red-600' : 'text-blue-600'}`}>{m.stock}</div><div className="text-xs text-slate-400">{m.unit}</div></div></div><div className="flex gap-2 border-t pt-3"><button onClick={() => { setSelectedMaterial(m); openModal('stockMovement'); }} className="flex-1 py-2 bg-slate-50 text-slate-700 text-xs font-bold rounded-lg border hover:bg-slate-50 transition-colors"><Edit size={14} /> Update Stok</button><button onClick={() => { setSelectedMaterial(m); openModal('stockHistory'); }} className="px-3 py-2 bg-white text-slate-500 rounded-lg border hover:bg-slate-50 shadow-sm"><History size={18}/></button></div></div>))}</div></div>
                    )}
                </div>
            )}
        </div>
      </div>
      
      {/* MODAL WRAPPER */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between bg-slate-50 sticky top-0"><h3 className="font-bold">Input Data</h3><button onClick={() => setShowModal(false)}><X size={20}/></button></div>
            <div className="p-4 space-y-3">
               {modalType === 'newProject' && <><input className="w-full p-2 border rounded" placeholder="Nama Proyek" value={inputName} onChange={e => setInputName(e.target.value)} /><button onClick={() => { addDoc(collection(db, 'app_data', appId, 'projects'), { name: inputName, client: 'Client Baru', location: '-', status: 'Berjalan', budgetLimit: 0, startDate: new Date().toISOString(), isDeleted: false, transactions: [], materials: [], workers: [], rabItems: [] }); setShowModal(false); }} className="w-full bg-blue-600 text-white p-2 rounded font-bold">Simpan</button></>}
               {modalType === 'aiRAB' && (
                 <>
                   <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 mb-2"><h4 className="text-purple-700 font-bold text-sm flex items-center gap-1"><Sparkles size={14}/> AI Generator</h4><p className="text-xs text-purple-600 mt-1">Jelaskan proyek Anda, AI akan membuatkan RAB lengkap.</p></div>
                   <textarea className="w-full p-3 border rounded-lg text-sm h-32" placeholder="Contoh: Bangun pos satpam 3x3m..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}></textarea>
                   <button onClick={handleGenerateRAB} disabled={isGeneratingAI} className="w-full bg-purple-600 text-white p-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-purple-700 disabled:opacity-50">{isGeneratingAI ? <Loader2 className="animate-spin"/> : <Sparkles size={18}/>} {isGeneratingAI ? 'Sedang Membuat...' : 'Generate RAB Otomatis'}</button>
                 </>
               )}
               {modalType === 'newRAB' && (<><div className="bg-blue-50 p-2 rounded text-xs text-blue-700 mb-2">Input item pekerjaan baru atau edit CCO.</div><input className="w-full p-2 border rounded" placeholder="Kategori (mis: A. PEKERJAAN PERSIAPAN)" list="categories" value={rabCategory} onChange={e => setRabCategory(e.target.value)} /><datalist id="categories"><option value="A. PEKERJAAN PERSIAPAN"/><option value="B. PEKERJAAN STRUKTUR"/><option value="C. PEKERJAAN ARSITEKTUR"/><option value="D. PEKERJAAN MEP"/></datalist><input className="w-full p-2 border rounded" placeholder="Uraian Pekerjaan" value={rabItemName} onChange={e => setRabItemName(e.target.value)} /><div className="flex gap-2"><input className="w-20 p-2 border rounded" placeholder="Satuan" value={rabUnit} onChange={e => setRabUnit(e.target.value)} /><div className="flex-1"><label className="text-xs text-slate-500">Volume</label><NumberInput className="w-full p-2 border rounded" value={rabVol} onChange={setRabVol} /></div></div><div className="mt-2"><label className="text-xs text-slate-500">Harga Satuan (Rp)</label><NumberInput className="w-full p-2 border rounded" value={rabPrice} onChange={setRabPrice} /></div><div className="text-right font-bold text-lg mb-2 mt-2">Total: {formatRupiah(rabVol * rabPrice)}</div><button onClick={handleSaveRAB} className="w-full bg-blue-600 text-white p-2 rounded font-bold">Simpan ke RAB</button></>)}
               {modalType === 'editProject' && <><input className="w-full p-2 border rounded" value={inputName} onChange={e => setInputName(e.target.value)} /><input className="w-full p-2 border rounded" value={inputClient} onChange={e => setInputClient(e.target.value)} /><div className="mt-2"><label className="text-xs text-slate-500">Nilai Kontrak (Budget)</label><NumberInput className="w-full p-2 border rounded" value={inputBudget} onChange={setInputBudget} /></div><input type="date" className="w-full p-2 border rounded mt-2" value={inputStartDate} onChange={e => setInputStartDate(e.target.value)} /><input type="date" className="w-full p-2 border rounded mt-2" value={inputEndDate} onChange={e => setInputEndDate(e.target.value)} /><button onClick={handleEditProject} className="w-full bg-blue-600 text-white p-2 rounded font-bold mt-2">Simpan</button></>}
               {modalType === 'updateProgress' && selectedRabItem && (<><h4 className="font-bold text-slate-700">{selectedRabItem.name}</h4><div className="flex items-center gap-2 my-4"><input type="range" min="0" max="100" value={progressInput} onChange={e => setProgressInput(Number(e.target.value))} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" /><span className="font-bold text-blue-600 w-12 text-right">{progressInput}%</span></div><input type="date" className="w-full p-2 border rounded" value={progressDate} onChange={e => setProgressDate(e.target.value)} /><input className="w-full p-2 border rounded" placeholder="Catatan Progres" value={progressNote} onChange={e => setProgressNote(e.target.value)} /><button onClick={handleUpdateProgress} className="w-full bg-blue-600 text-white p-2 rounded font-bold">Update Realisasi</button></>)}
               {modalType === 'taskHistory' && selectedRabItem && activeProject && (<div className="max-h-96 overflow-y-auto"><h4 className="font-bold text-slate-700 mb-4">Riwayat: {selectedRabItem.name}</h4><div className="space-y-3">{(activeProject.taskLogs || []).filter(l => l.taskId === selectedRabItem.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (<div key={log.id} className="text-sm border-b pb-2"><div className="flex justify-between items-center"><span className="font-bold text-slate-700">{log.date}</span><div className="flex items-center gap-2"><span className="text-xs text-slate-400 line-through">{log.previousProgress}%</span><span className="font-bold text-blue-600">{log.newProgress}%</span></div></div><div className="text-slate-500 text-xs mt-1">{log.note || '-'}</div></div>))}{(activeProject.taskLogs || []).filter(l => l.taskId === selectedRabItem.id).length === 0 && <p className="text-center text-slate-400 text-xs">Belum ada riwayat progres.</p>}</div></div>)}
               {modalType === 'newWorker' && (<><input className="w-full p-2 border rounded" placeholder="Nama" value={inputName} onChange={e=>setInputName(e.target.value)}/><div className="flex gap-2"><select className="flex-1 p-2 border rounded" value={inputWorkerRole} onChange={(e) => setInputWorkerRole(e.target.value as any)}><option>Tukang</option><option>Kenek</option><option>Mandor</option></select><select className="flex-1 p-2 border rounded bg-slate-50" value={inputWageUnit} onChange={(e) => setInputWageUnit(e.target.value as any)}><option value="Harian">Per Hari</option><option value="Mingguan">Per Minggu</option><option value="Bulanan">Per Bulan</option></select></div><div className="flex gap-2"><div className="flex-1"><label className="text-xs text-slate-500">Upah Asli ({inputWageUnit})</label><NumberInput className="w-full p-2 border rounded" value={inputRealRate} onChange={setInputRealRate} /></div><div className="flex-1"><label className="text-xs text-slate-500">Upah RAB ({inputWageUnit})</label><NumberInput className="w-full p-2 border rounded" value={inputMandorRate} onChange={setInputMandorRate} /></div></div><button onClick={handleSaveWorker} className="w-full bg-blue-600 text-white p-2 rounded font-bold">{selectedWorkerId ? 'Simpan Perubahan' : 'Simpan'}</button></>)}
               {modalType === 'stockMovement' && selectedMaterial && (<><h4 className="font-bold text-slate-700">{selectedMaterial.name}</h4><p className="text-xs text-slate-500 mb-2">Stok Saat Ini: {selectedMaterial.stock} {selectedMaterial.unit}</p><div className="flex gap-2 mb-2"><button onClick={() => setStockType('in')} className={`flex-1 p-2 rounded text-sm font-bold border ${stockType==='in' ? 'bg-green-100 border-green-300 text-green-700' : 'border-slate-200'}`}>Masuk (+)</button><button onClick={() => setStockType('out')} className={`flex-1 p-2 rounded text-sm font-bold border ${stockType==='out' ? 'bg-red-100 border-red-300 text-red-700' : 'border-slate-200'}`}>Keluar (-)</button></div><NumberInput className="w-full p-2 border rounded font-bold text-lg" placeholder="Jumlah" value={stockQty} onChange={setStockQty} /><input type="date" className="w-full p-2 border rounded mt-2" value={stockDate} onChange={e => setStockDate(e.target.value)}/><input className="w-full p-2 border rounded" placeholder="Keterangan (Wajib)" value={stockNotes} onChange={e => setStockNotes(e.target.value)}/><button onClick={handleStockMovement} disabled={!stockNotes || stockQty <= 0} className={`w-full text-white p-2 rounded font-bold mt-2 ${!stockNotes || stockQty <= 0 ? 'bg-slate-300' : 'bg-blue-600'}`}>Simpan Riwayat</button></>)}
               {modalType === 'stockHistory' && selectedMaterial && activeProject && (<div className="max-h-96 overflow-y-auto"><h4 className="font-bold text-slate-700 mb-4">Riwayat: {selectedMaterial.name}</h4><div className="space-y-3">{(activeProject.materialLogs || []).filter(l => l.materialId === selectedMaterial.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (<div key={log.id} className="text-sm border-b pb-2"><div className="flex justify-between"><span className="font-bold text-slate-700">{log.date}</span><span className={`font-bold ${log.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>{log.type === 'in' ? '+' : '-'}{log.quantity}</span></div><div className="text-slate-500 text-xs mt-1 flex justify-between"><span>{log.notes}</span><span className="italic">{log.actor}</span></div></div>))}{(activeProject.materialLogs || []).filter(l => l.materialId === selectedMaterial.id).length === 0 && <p className="text-center text-slate-400 text-xs">Belum ada riwayat.</p>}</div></div>)}
               {modalType === 'payWorker' && <><div className="mb-4"><label className="text-xs text-slate-500">Nominal Pembayaran</label><NumberInput className="w-full p-2 border rounded font-bold text-lg" value={paymentAmount} onChange={setPaymentAmount} /></div><button onClick={handlePayWorker} className="w-full bg-green-600 text-white p-2 rounded font-bold">Bayar</button></>}
               {modalType === 'attendance' && activeProject && (<div><input type="date" className="w-full p-2 border rounded font-bold mb-4" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} /><div className="bg-slate-50 p-3 rounded mb-3 border border-blue-100"><h4 className="font-bold text-sm mb-2 text-slate-700 flex items-center gap-2"><Camera size={14}/> Bukti Lapangan (Wajib)</h4><div className="mb-2"><label className={`block w-full border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${evidencePhoto ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:bg-slate-100'}`}><input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />{evidencePhoto ? (<div className="relative"><img src={evidencePhoto} alt="Preview" className="h-32 mx-auto rounded shadow-sm object-cover"/><div className="text-xs text-green-600 font-bold mt-1">Foto Berhasil Diambil & Dikompres</div></div>) : (<div className="text-slate-500 text-xs flex flex-col items-center gap-1"><Camera size={24} className="text-slate-400"/><span>Klik untuk Ambil Foto</span></div>)}</label></div><div className="text-center">{isGettingLoc && <div className="text-xs text-blue-600 flex items-center justify-center gap-1 animate-pulse"><Loader2 size={12} className="animate-spin"/> Sedang mengambil titik lokasi...</div>}{!isGettingLoc && evidenceLocation && <div className="text-xs text-green-600 flex items-center justify-center gap-1 font-bold bg-green-100 py-1 rounded"><CheckCircle size={12}/> Lokasi Terkunci: {evidenceLocation}</div>}{!isGettingLoc && !evidenceLocation && evidencePhoto && <div className="text-xs text-red-500 font-bold">Gagal ambil lokasi. Pastikan GPS aktif!</div>}</div></div><div className="max-h-64 overflow-y-auto space-y-2 mb-4">{activeProject.workers.map(w => (<div key={w.id} className="p-2 border rounded bg-slate-50 text-sm flex justify-between items-center"><span>{w.name}</span><select className="p-1 border rounded bg-white" value={attendanceData[w.id]?.status} onChange={(e) => setAttendanceData({...attendanceData, [w.id]: { ...attendanceData[w.id], status: e.target.value }})}><option value="Hadir">Hadir</option><option value="Setengah">Setengah</option><option value="Lembur">Lembur</option><option value="Absen">Absen</option></select></div>))}</div><button onClick={saveAttendanceWithEvidence} disabled={!evidencePhoto || !evidenceLocation} className={`w-full text-white p-3 rounded font-bold transition-all ${(!evidencePhoto || !evidenceLocation) ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg'}`}>{(!evidencePhoto || !evidenceLocation) ? 'Lengkapi Bukti Dulu' : 'Simpan Absensi'}</button></div>)}
               {modalType === 'addUser' && (<><input className="w-full p-2 border rounded" placeholder="Nama Lengkap" value={inputName} onChange={e => setInputName(e.target.value)} /><input className="w-full p-2 border rounded" placeholder="Email Google" type="email" value={inputEmail} onChange={e => setInputEmail(e.target.value)} /><div className="flex gap-2 items-center"><label className="text-xs w-20">Role</label><select className="flex-1 p-2 border rounded" value={inputRole} onChange={e => setInputRole(e.target.value as UserRole)}><option value="pengawas">Pengawas (Absen & Tukang Only)</option><option value="keuangan">Keuangan (Uang Only)</option><option value="kontraktor">Kontraktor (Project Manager)</option><option value="super_admin">Super Admin (Owner)</option></select></div><button onClick={handleAddUser} className="w-full bg-blue-600 text-white p-2 rounded font-bold">Tambah User</button></>)}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE NAV */}
      {view === 'project-detail' && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t pb-safe z-40 print:hidden">
           <div className="max-w-md mx-auto flex justify-between px-2">
             <button onClick={() => setActiveTab('dashboard')} className={`p-2 flex-1 flex flex-col items-center ${activeTab==='dashboard'?'text-blue-600':'text-slate-400'}`}><LayoutDashboard size={20}/><span className="text-[10px]">Home</span></button>
             {canAccessFinance() && <button onClick={() => setActiveTab('finance')} className={`p-2 flex-1 flex flex-col items-center ${activeTab==='finance'?'text-blue-600':'text-slate-400'}`}><Wallet size={20}/><span className="text-[10px]">Uang</span></button>}
             {canAccessWorkers() && <button onClick={() => setActiveTab('workers')} className={`p-2 flex-1 flex flex-col items-center ${activeTab==='workers'?'text-blue-600':'text-slate-400'}`}><Users size={20}/><span className="text-[10px]">Tim</span></button>}
             <button onClick={() => setActiveTab('logistics')} className={`p-2 flex-1 flex flex-col items-center ${activeTab==='logistics'?'text-blue-600':'text-slate-400'}`}><Package size={20}/><span className="text-[10px]">Stok</span></button>
             <button onClick={() => setActiveTab('progress')} className={`p-2 flex-1 flex flex-col items-center ${activeTab==='progress'?'text-blue-600':'text-slate-400'}`}><TrendingUp size={20}/><span className="text-[10px]">Kurva S</span></button>
           </div>
        </nav>
      )}
    </div>
  );
};

export default App;