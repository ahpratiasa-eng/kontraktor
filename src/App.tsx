import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Wallet, Package, Users, TrendingUp, 
  Plus, Trash2, ArrowLeft, Building2, 
  Loader2, RefreshCw, X, Calendar, FileText, 
  Rotatecce, Banknote, Edit, Settings, ChevronDown, ChevronUp, LogOut, LogIn, Lock, ShieldCheck, UserPlus,
  History, AlertTriangle, Camera, ExternalLink, Image as ImageIcon, CheckCircle, Printer
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { 
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from 'firebase/auth';
import type { User } from 'firebase/auth';

import { 
  getFirestore, collection, doc, addDoc, updateDoc, 
  deleteDoc, onSnapshot, query, setDoc, getDoc
} from 'firebase/firestore';

// --- KONFIGURASI FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyBSy6poKIVLX1BazVWxh2u7q0LlLR9V2cE",
  authDomain: "kontraktor-app.firebaseapp.com",
  projectId: "kontraktor-app",
  storageBucket: "kontraktor-app.firebasestorage.app",
  messagingSenderId: "116953182014",
  appId: "1:116953182014:web:56fe2108845033e037066f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);
const appId = 'kontraktor-pro-live'; 

// --- TYPES ---
type UserRole = 'kontraktor' | 'keuangan' | 'pengawas' | 'super_admin';

type AppUser = {
  email: string;
  role: UserRole;
  name: string;
};

type RABItem = {
  id: number;
  category: string;
  name: string;
  unit: string;
  volume: number;
  unitPrice: number;
  progress: number;
  isAddendum: boolean;
};

type Transaction = { id: number; date: string; category: string; description: string; amount: number; type: 'expense' | 'income'; workerId?: number; };
type Material = { id: number; name: string; unit: string; stock: number; minStock: number; };

type MaterialLog = {
  id: number;
  materialId: number;
  date: string;
  type: 'in' | 'out';
  quantity: number;
  notes: string;
  actor: string;
};

type Worker = { 
  id: number; 
  name: string; 
  role: 'Tukang' | 'Kenek' | 'Mandor'; 
  realRate: number; 
  mandorRate: number; 
  wageUnit: 'Harian' | 'Mingguan' | 'Bulanan'; 
};

type Task = { id: number; name: string; weight: number; progress: number; lastUpdated: string; };
type AttendanceLog = { id: number; date: string; workerId: number; status: 'Hadir' | 'Setengah' | 'Lembur' | 'Absen'; note: string; };

type AttendanceEvidence = {
  id: number;
  date: string;
  photoUrl: string;
  location: string;
  uploader: string;
  timestamp: string;
};

type TaskLog = { id: number; date: string; taskId: number; previousProgress: number; newProgress: number; note: string; };

type Project = { 
  id: string; name: string; client: string; location: string; status: string; budgetLimit: number; 
  startDate: string; endDate: string; 
  isDeleted?: boolean;
  transactions: Transaction[]; 
  materials: Material[]; 
  materialLogs: MaterialLog[]; 
  workers: Worker[]; 
  rabItems: RABItem[]; 
  tasks: Task[]; // Kept for compatibility
  attendanceLogs: AttendanceLog[]; 
  attendanceEvidences: AttendanceEvidence[];
  taskLogs: TaskLog[];
};

type GroupedTransaction = {
  id: string; date: string; category: string; type: 'expense' | 'income'; totalAmount: number; items: Transaction[];
};

// --- UTILS FORMAT NUMBER ---
const formatNumber = (num: number | string) => {
  if (!num) return '';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseNumber = (str: string) => {
  return Number(str.replace(/\./g, '').replace(/,/g, ''));
};

// --- HELPER COMPONENTS ---

// Custom Input Component untuk Angka dengan Format Ribuan
const NumberInput = ({ value, onChange, placeholder, className }: { value: number, onChange: (val: number) => void, placeholder?: string, className?: string }) => {
  const [displayValue, setDisplayValue] = useState(formatNumber(value));

  useEffect(() => {
    // Update display jika value berubah dari luar (misal reset form)
    if (parseNumber(displayValue) !== value) {
      setDisplayValue(value === 0 ? '' : formatNumber(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, ''); // Hanya angka
    const numValue = Number(rawValue);
    setDisplayValue(formatNumber(rawValue));
    onChange(numValue);
  };

  return (
    <input
      type="text"
      className={className}
      placeholder={placeholder}
      value={displayValue}
      onChange={handleChange}
      inputMode="numeric" // Agar keyboard angka muncul di HP
    />
  );
};


const SCurveChart = ({ stats, project, compact = false }: { stats: any, project: Project, compact?: boolean }) => {
  const getAxisDates = () => {
    if (!project.startDate || !project.endDate) return [];
    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    const points = [0, 0.25, 0.5, 0.75, 1];
    return points.map(p => {
      const d = new Date(start.getTime() + (diffDays * p * 24 * 60 * 60 * 1000));
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    });
  };
  const dateLabels = getAxisDates();

  // Safety check
  if (!stats.curvePoints || stats.curvePoints.includes('NaN')) {
    return <div className="text-center text-xs text-slate-400 py-10 bg-slate-50 rounded">Belum ada data progres yang cukup untuk grafik.</div>;
  }

  return (
    <div className={`w-full bg-white rounded-xl border shadow-sm ${compact ? 'p-3' : 'p-4 mb-4 break-inside-avoid'}`}>
      {!compact && <h3 className="font-bold text-sm text-slate-700 mb-4 flex items-center gap-2"><TrendingUp size={16}/> Kurva S (Bobot Biaya)</h3>}
      <div className={`relative border-l border-b border-slate-300 mx-2 ${compact ? 'h-32 mt-2' : 'h-48 mt-4'} bg-slate-50`}>
         <div className="absolute -left-6 top-0 text-[8px] text-slate-400">100%</div> 
         <div className="absolute -left-4 bottom-0 text-[8px] text-slate-400">0%</div>
         
         <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Grid Lines */}
            <line x1="0" y1="25" x2="100" y2="25" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2" vectorEffect="non-scaling-stroke"/>
            <line x1="0" y1="50" x2="100" y2="50" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2" vectorEffect="non-scaling-stroke"/>
            <line x1="0" y1="75" x2="100" y2="75" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2" vectorEffect="non-scaling-stroke"/>
            <line x1="0" y1="100" x2="100" y2="0" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2" vectorEffect="non-scaling-stroke"/>
            <line x1="0" y1="100" x2="100" y2="0" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4" vectorEffect="non-scaling-stroke"/>
            
            <polyline 
              fill="none" 
              stroke={stats.prog >= stats.timeProgress ? "#22c55e" : "#ef4444"} 
              strokeWidth="2" 
              points={stats.curvePoints} 
              vectorEffect="non-scaling-stroke" 
              strokeLinecap="round"
            />
         </svg>
         <div className="absolute top-full left-0 w-full flex justify-between mt-1 text-[9px] text-slate-500 font-medium">{dateLabels.map((date, idx) => (<span key={idx} className={idx === 0 ? '-ml-2' : idx === dateLabels.length - 1 ? '-mr-2' : ''}>{date}</span>))}</div>
      </div>
      <div className={`grid grid-cols-2 gap-2 text-xs ${compact ? 'mt-6' : 'mt-8'}`}>
         <div className="p-1.5 bg-slate-100 rounded text-center"><span className="block text-slate-500 text-[10px]">Plan (Waktu)</span><span className="font-bold">{stats.timeProgress.toFixed(1)}%</span></div>
         <div className={`p-1.5 rounded text-center ${stats.prog >= stats.timeProgress ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}><span className="block opacity-80 text-[10px]">Real (Bobot)</span><span className="font-bold">{stats.prog.toFixed(1)}%</span></div>
      </div>
    </div>
  );
};

const TransactionGroup = ({ group, isExpanded, onToggle }: any) => {
  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  return (
    <div className="bg-white rounded-xl border shadow-sm mb-2 overflow-hidden transition-all break-inside-avoid">
      <div onClick={onToggle} className="p-3 flex justify-between items-center cursor-pointer hover:bg-slate-50">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${group.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{group.type === 'income' ? <TrendingUp size={16} /> : <Banknote size={16} />}</div>
          <div><div className="font-bold text-sm text-slate-800">{group.category}</div><div className="text-xs text-slate-500 flex items-center gap-1">{group.date} • {group.items.length} Transaksi</div></div>
        </div>
        <div className="text-right"><div className={`font-bold ${group.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{group.type === 'expense' ? '-' : '+'} {formatRupiah(group.totalAmount)}</div>{isExpanded ? <ChevronUp size={16} className="ml-auto text-slate-400"/> : <ChevronDown size={16} className="ml-auto text-slate-400"/>}</div>
      </div>
      {isExpanded && (<div className="bg-slate-50 border-t border-slate-100">{group.items.map((t: any, idx: number) => (<div key={t.id} className={`p-3 flex justify-between items-center text-sm ${idx !== group.items.length - 1 ? 'border-b border-slate-100' : ''}`}><div className="flex-1"><span className="text-slate-700">{t.description}</span></div><div className="flex items-center gap-3"><span className="font-medium text-slate-600">{formatRupiah(t.amount)}</span></div></div>))}</div>)}
    </div>
  );
};

// --- MAIN APP COMPONENT ---
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
  
  // STATE BARU: Tipe Laporan (Internal vs Client)
  const [rabViewMode, setRabViewMode] = useState<'internal' | 'client'>('client');

  // FORM INPUTS
  const [inputName, setInputName] = useState('');
  const [inputEmail, setInputEmail] = useState('');
  const [inputRole, setInputRole] = useState<UserRole>('pengawas');
  const [inputClient, setInputClient] = useState('');
  const [inputDuration, setInputDuration] = useState(30);
  const [inputBudget, setInputBudget] = useState(0);
  const [inputStartDate, setInputStartDate] = useState('');
  const [inputEndDate, setInputEndDate] = useState('');
  
  // RAB & CCO Inputs
  const [rabCategory, setRabCategory] = useState('');
  const [rabItemName, setRabItemName] = useState('');
  const [rabUnit, setRabUnit] = useState('ls');
  const [rabVol, setRabVol] = useState(0);
  const [rabPrice, setRabPrice] = useState(0);
  const [selectedRabItem, setSelectedRabItem] = useState<RABItem | null>(null);

  // Worker Inputs
  const [inputRealRate, setInputRealRate] = useState(150000);
  const [inputMandorRate, setInputMandorRate] = useState(170000);
  const [inputWorkerRole, setInputWorkerRole] = useState<'Tukang' | 'Kenek' | 'Mandor'>('Tukang');
  const [inputWageUnit, setInputWageUnit] = useState<'Harian' | 'Mingguan' | 'Bulanan'>('Harian');

  // Stock Inputs
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
  
  // ATTENDANCE & REKAP
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<{[workerId: number]: {status: string, note: string}}>({});
  const [filterStartDate, setFilterStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterEndDate, setFilterEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  // EVIDENCE
  const [evidencePhoto, setEvidencePhoto] = useState<string>('');
  const [evidenceLocation, setEvidenceLocation] = useState<string>('');
  const [isGettingLoc, setIsGettingLoc] = useState(false);

  const [expandedGroups, setExpandedGroups] = useState<{[key: string]: boolean}>({}); 

  // --- PERMISSION CHECKERS ---
  const canAccessFinance = () => ['super_admin', 'kontraktor', 'keuangan'].includes(userRole || '');
  const canAccessWorkers = () => ['super_admin', 'kontraktor', 'pengawas'].includes(userRole || '');
  const canAccessManagement = () => userRole === 'super_admin';
  const canEditProject = () => ['super_admin', 'kontraktor'].includes(userRole || '');
  const canSeeMoney = () => ['super_admin', 'kontraktor', 'keuangan'].includes(userRole || '');

  // --- LOGIC AUTH ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const userDocRef = doc(db, 'app_users', u.email!);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as AppUser;
            setUser(u); setUserRole(userData.role); setAuthStatus('connected'); setLoginError('');
          } else {
            await signOut(auth); setUser(null); setUserRole(null); setAuthStatus('connected'); setLoginError(`Email ${u.email} tidak terdaftar.`);
          }
        } catch (error) { console.error("Error verifying user:", error); setAuthStatus('error'); }
      } else { setUser(null); setUserRole(null); setAuthStatus('connected'); }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userRole === 'super_admin') {
      const q = query(collection(db, 'app_users'));
      const unsub = onSnapshot(q, (snapshot) => { setAppUsers(snapshot.docs.map(d => d.data() as AppUser)); });
      return () => unsub();
    }
  }, [userRole]);

  const handleLogin = async () => { setLoginError(''); try { await signInWithPopup(auth, googleProvider); } catch (error) { setLoginError("Terjadi kesalahan saat mencoba login."); } };
  const handleLogout = async () => { if(confirm("Yakin ingin keluar?")) { await signOut(auth); setProjects([]); setView('project-list'); } };

  // --- USER MANAGEMENT ---
  const handleAddUser = async () => { if (!inputEmail || !inputName) return; try { await setDoc(doc(db, 'app_users', inputEmail), { email: inputEmail, name: inputName, role: inputRole }); alert("User berhasil ditambahkan!"); setShowModal(false); setInputEmail(''); setInputName(''); } catch (e) { alert("Gagal menambah user."); } };
  const handleDeleteUser = async (emailToDelete: string) => { if (emailToDelete === user?.email) return alert("Tidak bisa hapus diri sendiri!"); if (confirm(`Hapus akses ${emailToDelete}?`)) { try { await deleteDoc(doc(db, 'app_users', emailToDelete)); } catch (e) { alert("Gagal."); } } };

  // --- DATA SYNC ---
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'app_data', appId, 'projects'));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => {
        const data = d.data();
        return { 
          id: d.id,
          name: data.name,
          client: data.client,
          location: data.location,
          status: data.status,
          budgetLimit: data.budgetLimit,
          startDate: data.startDate,
          endDate: data.endDate || new Date(new Date(data.startDate).setDate(new Date(data.startDate).getDate() + 30)).toISOString(),
          isDeleted: data.isDeleted || false,
          
          attendanceLogs: Array.isArray(data.attendanceLogs) ? data.attendanceLogs : [], 
          attendanceEvidences: Array.isArray(data.attendanceEvidences) ? data.attendanceEvidences : [], 
          transactions: Array.isArray(data.transactions) ? data.transactions : [],
          
          // MIGRATION SUPPORT
          rabItems: Array.isArray(data.rabItems) ? data.rabItems : (data.tasks || []).map((t: any) => ({
            id: t.id, category: 'PEKERJAAN UMUM', name: t.name, unit: 'ls', volume: 1, unitPrice: 0, progress: t.progress, isAddendum: false
          })),

          tasks: [], 
          workers: Array.isArray(data.workers) ? data.workers : [], 
          materials: Array.isArray(data.materials) ? data.materials : [], 
          materialLogs: Array.isArray(data.materialLogs) ? data.materialLogs : [],
          taskLogs: Array.isArray(data.taskLogs) ? data.taskLogs : []
        } as Project;
      });
      list.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      setProjects(list);
    }, (error) => { if (error.code === 'permission-denied') { alert("Akses Ditolak."); signOut(auth); } });
  }, [user]);

  const activeProject = projects.find(p => p.id === activeProjectId);
  const formatRupiah = (num: number) => { if (!canSeeMoney()) return 'Rp ***'; if (typeof num !== 'number' || isNaN(num)) return 'Rp 0'; return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num); };
  const updateProject = async (data: Partial<Project>) => { if (!user || !activeProjectId) return; setIsSyncing(true); try { await updateDoc(doc(db, 'app_data', appId, 'projects', activeProjectId), data); } catch(e) { alert("Gagal simpan ke database"); } setIsSyncing(false); };
  const getGroupedTransactions = (transactions: Transaction[]): GroupedTransaction[] => { const groups: {[key: string]: GroupedTransaction} = {}; transactions.forEach(t => { const key = `${t.date}-${t.category}-${t.type}`; if (!groups[key]) groups[key] = { id: key, date: t.date, category: t.category, type: t.type, totalAmount: 0, items: [] }; groups[key].totalAmount += t.amount; groups[key].items.push(t); }); return Object.values(groups).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); };

  // --- EVIDENCE HELPERS ---
  const handleGetLocation = () => {
    if (!navigator.geolocation) return alert("Browser tidak support GPS");
    setIsGettingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setEvidenceLocation(`${pos.coords.latitude},${pos.coords.longitude}`);
        setIsGettingLoc(false);
      },
      (err) => {
        console.error("GPS Error:", err);
        alert("Gagal ambil lokasi. Pastikan GPS aktif dan izinkan browser.");
        setIsGettingLoc(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 800; 
        const MAX_HEIGHT = 800;

        if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
        else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setEvidencePhoto(compressedDataUrl);
        handleGetLocation();
      };
    };
  };

  const saveAttendanceWithEvidence = () => {
    if(!activeProject) return;
    if (!evidencePhoto) { alert("Wajib ambil foto bukti lapangan!"); return; }
    if (!evidenceLocation) { alert("Lokasi wajib terdeteksi!"); return; }
    const newLogs: any[] = []; Object.keys(attendanceData).forEach(wId => { newLogs.push({ id: Date.now() + Math.random(), date: attendanceDate, workerId: Number(wId), status: attendanceData[Number(wId)].status, note: '' }); });
    let newEvidences = activeProject.attendanceEvidences || [];
    if (evidencePhoto || evidenceLocation) {
      newEvidences = [{ id: Date.now(), date: attendanceDate, photoUrl: evidencePhoto, location: evidenceLocation, uploader: user?.displayName || 'Unknown', timestamp: new Date().toISOString() }, ...newEvidences];
    }
    updateProject({ attendanceLogs: [...activeProject.attendanceLogs, ...newLogs], attendanceEvidences: newEvidences });
    setShowModal(false);
  };

  const getFilteredAttendance = () => {
    if (!activeProject || !activeProject.attendanceLogs) return [];
    const start = new Date(filterStartDate); start.setHours(0,0,0,0); const end = new Date(filterEndDate); end.setHours(23,59,59,999);
    const filteredLogs = activeProject.attendanceLogs.filter(l => { const d = new Date(l.date); return d >= start && d <= end; });
    const workerStats: {[key: number]: {name: string, role: string, unit: string, hadir: number, lembur: number, setengah: number, absen: number, totalCost: number}} = {};
    activeProject.workers.forEach(w => { workerStats[w.id] = { name: w.name, role: w.role, unit: w.wageUnit || 'Harian', hadir: 0, lembur: 0, setengah: 0, absen: 0, totalCost: 0 }; });
    filteredLogs.forEach(log => {
      if (workerStats[log.workerId]) {
        const worker = activeProject.workers.find(w => w.id === log.workerId);
        let dailyRate = 0;
        if (worker) { if (worker.wageUnit === 'Mingguan') dailyRate = worker.mandorRate / 7; else if (worker.wageUnit === 'Bulanan') dailyRate = worker.mandorRate / 30; else dailyRate = worker.mandorRate; }
        if (log.status === 'Hadir') { workerStats[log.workerId].hadir++; workerStats[log.workerId].totalCost += dailyRate; }
        else if (log.status === 'Lembur') { workerStats[log.workerId].lembur++; workerStats[log.workerId].totalCost += (dailyRate * 1.5); }
        else if (log.status === 'Setengah') { workerStats[log.workerId].setengah++; workerStats[log.workerId].totalCost += (dailyRate * 0.5); }
        else if (log.status === 'Absen') { workerStats[log.workerId].absen++; }
      }
    });
    return Object.values(workerStats);
  };

  const getFilteredEvidence = () => {
    if (!activeProject || !activeProject.attendanceEvidences) return [];
    const start = new Date(filterStartDate); start.setHours(0,0,0,0); const end = new Date(filterEndDate); end.setHours(23,59,59,999);
    return activeProject.attendanceEvidences.filter(e => { const d = new Date(e.date); return d >= start && d <= end; });
  };

  const getStats = (p: Project) => {
    const tx = p.transactions || [];
    const inc = tx.filter(t => t.type === 'income').reduce((a, b) => a + (b.amount || 0), 0);
    const exp = tx.filter(t => t.type === 'expense').reduce((a, b) => a + (b.amount || 0), 0);
    
    // RAB Calculation
    const totalRAB = (p.rabItems || []).reduce((acc, item) => acc + (item.volume * item.unitPrice), 0);
    
    // Weighted Progress Calculation
    let weightedProgress = 0;
    if (totalRAB > 0) {
      (p.rabItems || []).forEach(item => {
        const itemTotal = item.volume * item.unitPrice;
        const itemWeight = (itemTotal / totalRAB) * 100;
        const itemContribution = (item.progress * itemWeight) / 100;
        weightedProgress += itemContribution;
      });
    }

    const start = new Date(p.startDate).getTime(); const end = new Date(p.endDate).getTime(); const now = new Date().getTime();
    let latestUpdate = now;
    if (p.taskLogs && p.taskLogs.length > 0) { const logsTime = p.taskLogs.map(l => new Date(l.date).getTime()); if (Math.max(...logsTime) > now) latestUpdate = Math.max(...logsTime); }
    const totalDuration = end - start; const elapsed = latestUpdate - start;
    let timeProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    if (totalDuration <= 0) timeProgress = 0;
    
    const uniqueDates = Array.from(new Set((p.taskLogs || []).map(l => l.date))).sort();
    if (!uniqueDates.includes(p.startDate.split('T')[0])) uniqueDates.unshift(p.startDate.split('T')[0]);
    const today = new Date().toISOString().split('T')[0];
    if (!uniqueDates.includes(today)) uniqueDates.push(today);
    const points: string[] = [];
    const taskProgressState: {[taskId: number]: number} = {};
    (p.rabItems || []).forEach(t => taskProgressState[t.id] = 0);
    
    uniqueDates.forEach(dateStr => {
      const dateVal = new Date(dateStr).getTime();
      const logsUntilNow = (p.taskLogs || []).filter(l => new Date(l.date).getTime() <= dateVal);
      logsUntilNow.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach(log => { taskProgressState[log.taskId] = log.newProgress; });
      
      let totalProg = 0;
      if (totalRAB > 0) {
        (p.rabItems || []).forEach(item => {
          const currentProg = taskProgressState[item.id] || 0;
          const itemTotal = item.volume * item.unitPrice;
          const itemWeight = (itemTotal / totalRAB) * 100;
          totalProg += (currentProg * itemWeight) / 100;
        });
      }
      
      let x = ((dateVal - start) / totalDuration) * 100; x = Math.max(0, Math.min(100, x));
      let y = 100 - totalProg; 
      points.push(`${x},${y}`);
    });

    return { inc, exp, prog: weightedProgress, leak: 0, timeProgress, curvePoints: points.join(" "), totalRAB };
  };

  const calculateTotalDays = (logs: AttendanceLog[], workerId: number) => {
    if(!logs) return 0;
    return logs.filter(l => l.workerId === workerId).reduce((acc, curr) => { if (curr.status === 'Hadir') return acc + 1; if (curr.status === 'Setengah') return acc + 0.5; if (curr.status === 'Lembur') return acc + 1.5; return acc; }, 0);
  };

  const calculateWorkerFinancials = (p: Project, workerId: number) => {
    const worker = p.workers.find(w => w.id === workerId); if (!worker) return { totalDue: 0, totalPaid: 0, balance: 0 };
    const days = calculateTotalDays(p.attendanceLogs, workerId); 
    let dailyRate = worker.mandorRate;
    if (worker.wageUnit === 'Mingguan') dailyRate = worker.mandorRate / 7;
    if (worker.wageUnit === 'Bulanan') dailyRate = worker.mandorRate / 30;
    const totalDue = days * dailyRate;
    const totalPaid = (p.transactions || []).filter(t => t.workerId === workerId && t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    return { totalDue, totalPaid, balance: totalDue - totalPaid };
  };

  // --- RAB HELPERS ---
  const handleSaveRAB = () => {
    if(!activeProject || !rabItemName) return;
    
    // CCO Logic: if marked as addendum, it's a CCO
    const newItem: RABItem = {
      id: selectedRabItem ? selectedRabItem.id : Date.now(),
      category: rabCategory || 'PEKERJAAN UMUM',
      name: rabItemName,
      unit: rabUnit,
      volume: rabVol,
      unitPrice: rabPrice,
      progress: selectedRabItem ? selectedRabItem.progress : 0,
      isAddendum: selectedRabItem ? selectedRabItem.isAddendum : false 
    };

    let newItems = [...(activeProject.rabItems || [])];
    if (selectedRabItem) {
      newItems = newItems.map(i => i.id === selectedRabItem.id ? newItem : i);
    } else {
      newItems.push(newItem);
    }

    updateProject({ rabItems: newItems });
    setShowModal(false);
    // Reset
    setRabItemName(''); setRabVol(0); setRabPrice(0);
  };
  
  const handleEditRABItem = (item: RABItem) => {
    setSelectedRabItem(item);
    setRabCategory(item.category);
    setRabItemName(item.name);
    setRabUnit(item.unit);
    setRabVol(item.volume);
    setRabPrice(item.unitPrice);
    setModalType('newRAB');
    setShowModal(true);
  };

  const handleAddCCO = () => {
     setRabItemName(''); setRabCategory('PEKERJAAN TAMBAH KURANG (CCO)'); 
     setSelectedRabItem(null); 
     setModalType('newRAB');
  };

  const deleteRABItem = (id: number) => {
    if(!activeProject || !confirm('Hapus item RAB ini?')) return;
    const newItems = activeProject.rabItems.filter(i => i.id !== id);
    updateProject({ rabItems: newItems });
  };

  const getRABGroups = () => {
    if (!activeProject || !activeProject.rabItems) return {};
    const groups: {[key: string]: RABItem[]} = {};
    activeProject.rabItems.forEach(item => {
      if(!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  };

  const toggleGroup = (groupId: string) => { setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] })); };
  
  const handleTransaction = (e: React.FormEvent) => { e.preventDefault(); if (!activeProject) return; const form = e.target as HTMLFormElement; const desc = (form.elements.namedItem('desc') as HTMLInputElement).value; const cat = (form.elements.namedItem('cat') as HTMLSelectElement).value; if (!desc || amount <= 0) { alert("Data tidak valid"); return; } updateProject({ transactions: [{ id: Date.now(), date: new Date().toISOString().split('T')[0], category: cat, description: desc, amount: amount, type: txType }, ...(activeProject.transactions || [])] }); form.reset(); setAmount(0); };
  
  // UPDATE PROGRESS BASED ON RAB ITEM
  const handleUpdateProgress = () => { 
    if (!activeProject || !selectedRabItem) return; 
    const updatedRAB = activeProject.rabItems.map(item => item.id === selectedRabItem.id ? { ...item, progress: progressInput } : item);
    const newLog: TaskLog = { id: Date.now(), date: progressDate, taskId: selectedRabItem.id, previousProgress: selectedRabItem.progress, newProgress: progressInput, note: progressNote };
    updateProject({ rabItems: updatedRAB, taskLogs: [newLog, ...(activeProject.taskLogs || [])] }); 
    setShowModal(false); 
  };
  
  const handleEditProject = () => { if (!activeProject) return; updateProject({ name: inputName, client: inputClient, budgetLimit: inputBudget, startDate: inputStartDate, endDate: inputEndDate }); setShowModal(false); };
  const handlePayWorker = () => { if (!activeProject || !selectedWorkerId || paymentAmount <= 0) return; const worker = activeProject.workers.find(w => w.id === selectedWorkerId); const newTx: Transaction = { id: Date.now(), date: new Date().toISOString().split('T')[0], category: 'Upah Tukang', description: `Gaji ${worker?.name || 'Tukang'}`, amount: paymentAmount, type: 'expense', workerId: selectedWorkerId }; updateProject({ transactions: [newTx, ...activeProject.transactions] }); setShowModal(false); };
  
  const handleSaveWorker = () => { if(!activeProject) return; if (selectedWorkerId) { const updatedWorkers = activeProject.workers.map(w => { if(w.id === selectedWorkerId) { return { ...w, name: inputName, role: inputWorkerRole, wageUnit: inputWageUnit, realRate: inputRealRate, mandorRate: inputMandorRate }; } return w; }); updateProject({ workers: updatedWorkers }); } else { const newWorker: Worker = { id: Date.now(), name: inputName, role: inputWorkerRole, wageUnit: inputWageUnit, realRate: inputRealRate, mandorRate: inputMandorRate }; updateProject({ workers: [...(activeProject.workers || []), newWorker] }); } setShowModal(false); };
  const handleEditWorker = (w: Worker) => { setSelectedWorkerId(w.id); setInputName(w.name); setInputWorkerRole(w.role); setInputWageUnit(w.wageUnit); setInputRealRate(w.realRate); setInputMandorRate(w.mandorRate); setModalType('newWorker'); setShowModal(true); };
  const handleDeleteWorker = (w: Worker) => { if(!activeProject) return; if(confirm(`Yakin hapus ${w.name}?`)) { const updatedWorkers = activeProject.workers.filter(worker => worker.id !== w.id); updateProject({ workers: updatedWorkers }); } };
  const handleStockMovement = () => { if (!activeProject || !selectedMaterial || stockQty <= 0) return; const updatedMaterials = activeProject.materials.map(m => { if (m.id === selectedMaterial.id) return { ...m, stock: stockType === 'in' ? m.stock + stockQty : m.stock - stockQty }; return m; }); const newLog: MaterialLog = { id: Date.now(), materialId: selectedMaterial.id, date: stockDate, type: stockType, quantity: stockQty, notes: stockNotes || '-', actor: user?.displayName || 'User' }; updateProject({ materials: updatedMaterials, materialLogs: [newLog, ...(activeProject.materialLogs || [])] }); setShowModal(false); setStockQty(0); setStockNotes(''); };
  
  // SOFT DELETE Logic
  const handleSoftDeleteProject = async (p: Project) => {
    if(confirm(`Yakin ingin memindahkan proyek "${p.name}" ke Sampah?`)) {
      try { await updateDoc(doc(db, 'app_data', appId, 'projects', p.id), { isDeleted: true }); }
      catch(e) { alert("Gagal menghapus."); }
    }
  };
  const handleRestoreProject = async (p: Project) => {
    try { await updateDoc(doc(db, 'app_data', appId, 'projects', p.id), { isDeleted: false }); }
    catch(e) { alert("Gagal restore."); }
  };
  const handlePermanentDeleteProject = async (p: Project) => {
    if(confirm(`PERINGATAN: Proyek "${p.name}" akan dihapus SELAMANYA dan tidak bisa dikembalikan. Lanjutkan?`)) {
      try { await deleteDoc(doc(db, 'app_data', appId, 'projects', p.id)); }
      catch(e) { alert("Gagal hapus permanen."); }
    }
  };

  const openModal = (type: any) => { setModalType(type); setInputName(''); if (['editProject', 'attendance', 'payWorker', 'newMaterial', 'stockMovement', 'stockHistory', 'newTask', 'updateProgress', 'taskHistory', 'newRAB'].includes(type) && !activeProject) return; if (type === 'editProject' && activeProject) { setInputName(activeProject.name); setInputClient(activeProject.client); setInputBudget(activeProject.budgetLimit); setInputStartDate(activeProject.startDate.split('T')[0]); setInputEndDate(activeProject.endDate.split('T')[0]); } if (type === 'attendance' && activeProject) { const initData: any = {}; activeProject.workers.forEach(w => initData[w.id] = { status: 'Hadir', note: '' }); setAttendanceData(initData); setEvidencePhoto(''); setEvidenceLocation(''); } if (type === 'newProject') { setInputDuration(30); } if (type === 'addUser') { setInputName(''); setInputEmail(''); setInputRole('pengawas'); } if (type === 'newWorker') { setSelectedWorkerId(null); setInputName(''); setInputRealRate(150000); setInputMandorRate(170000); setInputWorkerRole('Tukang'); setInputWageUnit('Harian'); } if(type === 'newRAB') { setRabCategory(''); setRabItemName(''); setRabVol(0); setRabPrice(0); setSelectedRabItem(null); } setStockDate(new Date().toISOString().split('T')[0]); setShowModal(true); };
  const createItem = (field: string, newItem: any) => { if(!activeProject) return; updateProject({ [field]: [...(activeProject as any)[field], newItem] }); setShowModal(false); }
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
    // Total should be around 1M
    const demo: Omit<Project, 'id'> = { name: "Rumah Mewah 1 Milyar (Selesai)", client: "Bpk Sultan", location: "Pondok Indah", status: 'Selesai', budgetLimit: 0, startDate: start.toISOString(), endDate: end.toISOString(), 
    rabItems: rabDemo,
    transactions: [
      { id: 101, date: d(0), category: 'Termin', description: 'DP 30%', amount: 18150000, type: 'income' },
      { id: 102, date: new Date(start.getTime() + 30*24*60*60*1000).toISOString().split('T')[0], category: 'Termin', description: 'Termin 2 (50%)', amount: 30250000, type: 'income' },
      { id: 103, date: end.toISOString().split('T')[0], category: 'Termin', description: 'Pelunasan (20%)', amount: 12100000, type: 'income' },
      // Expenses dummy
      { id: 201, date: start.toISOString().split('T')[0], category: 'Material', description: 'Belanja Awal Bahan Alam', amount: 15000000, type: 'expense' },
      { id: 202, date: start.toISOString().split('T')[0], category: 'Upah Tukang', description: 'Bayar Minggu 1', amount: 5000000, type: 'expense' },
    ], 
    // Add Dummy Task Logs to populate S-Curve
    taskLogs: [
        {id:1, date:d(0), taskId:1, previousProgress:0, newProgress:10, note:'Start'},
        {id:2, date:d(1), taskId:1, previousProgress:10, newProgress:30, note:'Progress'},
        {id:3, date:d(2), taskId:1, previousProgress:30, newProgress:60, note:'Progress'},
        {id:4, date:d(3), taskId:1, previousProgress:60, newProgress:80, note:'Progress'},
        {id:5, date:d(4), taskId:1, previousProgress:80, newProgress:100, note:'Finish'}
    ],
    materials: [], materialLogs: [], workers: [], tasks: [], attendanceLogs: [], attendanceEvidences: [] }; try { await addDoc(collection(db, 'app_data', appId, 'projects'), demo); } catch(e) {} finally { setIsSyncing(false); } };

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

  const rabGroups = getRABGroups();

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-20 relative">
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

      {/* MODALS */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between bg-slate-50 sticky top-0"><h3 className="font-bold">Input Data</h3><button onClick={() => setShowModal(false)}><X size={20}/></button></div>
            <div className="p-4 space-y-3">
              {modalType === 'addUser' && (<><input className="w-full p-2 border rounded" placeholder="Nama Lengkap" value={inputName} onChange={e => setInputName(e.target.value)} /><input className="w-full p-2 border rounded" placeholder="Email Google" type="email" value={inputEmail} onChange={e => setInputEmail(e.target.value)} /><div className="flex gap-2 items-center"><label className="text-xs w-20">Role</label><select className="flex-1 p-2 border rounded" value={inputRole} onChange={e => setInputRole(e.target.value as UserRole)}><option value="pengawas">Pengawas (Absen & Tukang Only)</option><option value="keuangan">Keuangan (Uang Only)</option><option value="kontraktor">Kontraktor (Project Manager)</option><option value="super_admin">Super Admin (Owner)</option></select></div><button onClick={handleAddUser} className="w-full bg-blue-600 text-white p-2 rounded font-bold">Tambah User</button></>)}
              {modalType === 'newProject' && <><input className="w-full p-2 border rounded" placeholder="Nama Proyek" value={inputName} onChange={e => setInputName(e.target.value)} /><input className="w-full p-2 border rounded" placeholder="Client" value={inputClient} onChange={e => setInputClient(e.target.value)} /><div className="flex gap-2 items-center"><label className="text-xs w-20">Durasi (Hari)</label><input className="w-20 p-2 border rounded" type="number" value={inputDuration} onChange={e => setInputDuration(Number(e.target.value))} /></div><button onClick={() => { const s = new Date(); const e = new Date(); e.setDate(s.getDate() + (inputDuration || 30)); addDoc(collection(db, 'app_data', appId, 'projects'), { name: inputName, client: inputClient, location: '-', status: 'Berjalan', budgetLimit: 0, startDate: s.toISOString(), endDate: e.toISOString(), transactions: [], materials: [], workers: [], tasks: [], attendanceLogs: [], taskLogs: [] }); setShowModal(false); }} className="w-full bg-blue-600 text-white p-2 rounded font-bold">Simpan</button></>}
              
              {/* MODAL INPUT RAB / CCO */}
              {modalType === 'newRAB' && (
                <>
                  <div className="bg-blue-50 p-2 rounded text-xs text-blue-700 mb-2">Input item pekerjaan baru atau edit CCO.</div>
                  <input className="w-full p-2 border rounded" placeholder="Kategori (mis: A. PEKERJAAN PERSIAPAN)" list="categories" value={rabCategory} onChange={e => setRabCategory(e.target.value)} />
                  <datalist id="categories"><option value="A. PEKERJAAN PERSIAPAN"/><option value="B. PEKERJAAN STRUKTUR"/><option value="C. PEKERJAAN ARSITEKTUR"/><option value="D. PEKERJAAN MEP"/></datalist>
                  <input className="w-full p-2 border rounded" placeholder="Uraian Pekerjaan" value={rabItemName} onChange={e => setRabItemName(e.target.value)} />
                  <div className="flex gap-2">
                    <input className="w-20 p-2 border rounded" placeholder="Satuan" value={rabUnit} onChange={e => setRabUnit(e.target.value)} />
                    <div className="flex-1"><label className="text-xs text-slate-500">Volume</label><NumberInput className="w-full p-2 border rounded" value={rabVol} onChange={setRabVol} /></div>
                  </div>
                  <div className="mt-2"><label className="text-xs text-slate-500">Harga Satuan (Rp)</label><NumberInput className="w-full p-2 border rounded" value={rabPrice} onChange={setRabPrice} /></div>
                  <div className="text-right font-bold text-lg mb-2 mt-2">Total: {formatRupiah(rabVol * rabPrice)}</div>
                  <button onClick={handleSaveRAB} className="w-full bg-blue-600 text-white p-2 rounded font-bold">Simpan ke RAB</button>
                </>
              )}

              {modalType === 'editProject' && <><input className="w-full p-2 border rounded" value={inputName} onChange={e => setInputName(e.target.value)} /><input className="w-full p-2 border rounded" value={inputClient} onChange={e => setInputClient(e.target.value)} /><div className="mt-2"><label className="text-xs text-slate-500">Nilai Kontrak (Budget)</label><NumberInput className="w-full p-2 border rounded" value={inputBudget} onChange={setInputBudget} /></div><input type="date" className="w-full p-2 border rounded mt-2" value={inputStartDate} onChange={e => setInputStartDate(e.target.value)} /><input type="date" className="w-full p-2 border rounded mt-2" value={inputEndDate} onChange={e => setInputEndDate(e.target.value)} /><button onClick={handleEditProject} className="w-full bg-blue-600 text-white p-2 rounded font-bold mt-2">Simpan</button></>}
              {modalType === 'updateProgress' && selectedRabItem && (
                 <>
                   <h4 className="font-bold text-slate-700">{selectedRabItem.name}</h4>
                   <div className="flex items-center gap-2 my-4">
                     <input type="range" min="0" max="100" value={progressInput} onChange={e => setProgressInput(Number(e.target.value))} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                     <span className="font-bold text-blue-600 w-12 text-right">{progressInput}%</span>
                   </div>
                   <input type="date" className="w-full p-2 border rounded" value={progressDate} onChange={e => setProgressDate(e.target.value)} />
                   <input className="w-full p-2 border rounded" placeholder="Catatan Progres" value={progressNote} onChange={e => setProgressNote(e.target.value)} />
                   <button onClick={handleUpdateProgress} className="w-full bg-blue-600 text-white p-2 rounded font-bold">Update Realisasi</button>
                 </>
              )}
              {modalType === 'taskHistory' && selectedRabItem && activeProject && (<div className="max-h-96 overflow-y-auto"><h4 className="font-bold text-slate-700 mb-4">Riwayat: {selectedRabItem.name}</h4><div className="space-y-3">{(activeProject.taskLogs || []).filter(l => l.taskId === selectedRabItem.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (<div key={log.id} className="text-sm border-b pb-2"><div className="flex justify-between items-center"><span className="font-bold text-slate-700">{log.date}</span><div className="flex items-center gap-2"><span className="text-xs text-slate-400 line-through">{log.previousProgress}%</span><span className="font-bold text-blue-600">{log.newProgress}%</span></div></div><div className="text-slate-500 text-xs mt-1">{log.note || '-'}</div></div>))}{(activeProject.taskLogs || []).filter(l => l.taskId === selectedRabItem.id).length === 0 && <p className="text-center text-slate-400 text-xs">Belum ada riwayat progres.</p>}</div></div>)}
              
              {/* Other Modals (Workers, Stock, Attendance) */}
              {modalType === 'newWorker' && (<><input className="w-full p-2 border rounded" placeholder="Nama" value={inputName} onChange={e=>setInputName(e.target.value)}/><div className="flex gap-2"><select className="flex-1 p-2 border rounded" value={inputWorkerRole} onChange={(e) => setInputWorkerRole(e.target.value as any)}><option>Tukang</option><option>Kenek</option><option>Mandor</option></select><select className="flex-1 p-2 border rounded bg-slate-50" value={inputWageUnit} onChange={(e) => setInputWageUnit(e.target.value as any)}><option value="Harian">Per Hari</option><option value="Mingguan">Per Minggu</option><option value="Bulanan">Per Bulan</option></select></div><div className="flex gap-2"><div className="flex-1"><label className="text-xs text-slate-500">Upah Asli ({inputWageUnit})</label><NumberInput className="w-full p-2 border rounded" value={inputRealRate} onChange={setInputRealRate} /></div><div className="flex-1"><label className="text-xs text-slate-500">Upah RAB ({inputWageUnit})</label><NumberInput className="w-full p-2 border rounded" value={inputMandorRate} onChange={setInputMandorRate} /></div></div><button onClick={handleSaveWorker} className="w-full bg-blue-600 text-white p-2 rounded font-bold">{selectedWorkerId ? 'Simpan Perubahan' : 'Simpan'}</button></>)}
              {modalType === 'stockMovement' && selectedMaterial && (<><h4 className="font-bold text-slate-700">{selectedMaterial.name}</h4><p className="text-xs text-slate-500 mb-2">Stok Saat Ini: {selectedMaterial.stock} {selectedMaterial.unit}</p><div className="flex gap-2 mb-2"><button onClick={() => setStockType('in')} className={`flex-1 p-2 rounded text-sm font-bold border ${stockType==='in' ? 'bg-green-100 border-green-300 text-green-700' : 'border-slate-200'}`}>Masuk (+)</button><button onClick={() => setStockType('out')} className={`flex-1 p-2 rounded text-sm font-bold border ${stockType==='out' ? 'bg-red-100 border-red-300 text-red-700' : 'border-slate-200'}`}>Keluar (-)</button></div><NumberInput className="w-full p-2 border rounded font-bold text-lg" placeholder="Jumlah" value={stockQty} onChange={setStockQty} /><input type="date" className="w-full p-2 border rounded mt-2" value={stockDate} onChange={e => setStockDate(e.target.value)}/><input className="w-full p-2 border rounded" placeholder="Keterangan (Wajib)" value={stockNotes} onChange={e => setStockNotes(e.target.value)}/><button onClick={handleStockMovement} disabled={!stockNotes || stockQty <= 0} className={`w-full text-white p-2 rounded font-bold mt-2 ${!stockNotes || stockQty <= 0 ? 'bg-slate-300' : 'bg-blue-600'}`}>Simpan Riwayat</button></>)}
              {modalType === 'stockHistory' && selectedMaterial && activeProject && (<div className="max-h-96 overflow-y-auto"><h4 className="font-bold text-slate-700 mb-4">Riwayat: {selectedMaterial.name}</h4><div className="space-y-3">{(activeProject.materialLogs || []).filter(l => l.materialId === selectedMaterial.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (<div key={log.id} className="text-sm border-b pb-2"><div className="flex justify-between"><span className="font-bold text-slate-700">{log.date}</span><span className={`font-bold ${log.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>{log.type === 'in' ? '+' : '-'}{log.quantity}</span></div><div className="text-slate-500 text-xs mt-1 flex justify-between"><span>{log.notes}</span><span className="italic">{log.actor}</span></div></div>))}{(activeProject.materialLogs || []).filter(l => l.materialId === selectedMaterial.id).length === 0 && <p className="text-center text-slate-400 text-xs">Belum ada riwayat.</p>}</div></div>)}
              {modalType === 'payWorker' && <><div className="mb-4"><label className="text-xs text-slate-500">Nominal Pembayaran</label><NumberInput className="w-full p-2 border rounded font-bold text-lg" value={paymentAmount} onChange={setPaymentAmount} /></div><button onClick={handlePayWorker} className="w-full bg-green-600 text-white p-2 rounded font-bold">Bayar</button></>}
              {modalType === 'attendance' && activeProject && (<div><input type="date" className="w-full p-2 border rounded font-bold mb-4" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} /><div className="bg-slate-50 p-3 rounded mb-3 border border-blue-100"><h4 className="font-bold text-sm mb-2 text-slate-700 flex items-center gap-2"><Camera size={14}/> Bukti Lapangan (Wajib)</h4><div className="mb-2"><label className={`block w-full border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${evidencePhoto ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:bg-slate-100'}`}><input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />{evidencePhoto ? (<div className="relative"><img src={evidencePhoto} alt="Preview" className="h-32 mx-auto rounded shadow-sm object-cover"/><div className="text-xs text-green-600 font-bold mt-1">Foto Berhasil Diambil & Dikompres</div></div>) : (<div className="text-slate-500 text-xs flex flex-col items-center gap-1"><Camera size={24} className="text-slate-400"/><span>Klik untuk Ambil Foto</span></div>)}</label></div><div className="text-center">{isGettingLoc && <div className="text-xs text-blue-600 flex items-center justify-center gap-1 animate-pulse"><Loader2 size={12} className="animate-spin"/> Sedang mengambil titik lokasi...</div>}{!isGettingLoc && evidenceLocation && <div className="text-xs text-green-600 flex items-center justify-center gap-1 font-bold bg-green-100 py-1 rounded"><CheckCircle size={12}/> Lokasi Terkunci: {evidenceLocation}</div>}{!isGettingLoc && !evidenceLocation && evidencePhoto && <div className="text-xs text-red-500 font-bold">Gagal ambil lokasi. Pastikan GPS aktif!</div>}</div></div><div className="max-h-64 overflow-y-auto space-y-2 mb-4">{activeProject.workers.map(w => (<div key={w.id} className="p-2 border rounded bg-slate-50 text-sm flex justify-between items-center"><span>{w.name}</span><select className="p-1 border rounded bg-white" value={attendanceData[w.id]?.status} onChange={(e) => setAttendanceData({...attendanceData, [w.id]: { ...attendanceData[w.id], status: e.target.value }})}><option value="Hadir">Hadir</option><option value="Setengah">Setengah</option><option value="Lembur">Lembur</option><option value="Absen">Absen</option></select></div>))}</div><button onClick={saveAttendanceWithEvidence} disabled={!evidencePhoto || !evidenceLocation} className={`w-full text-white p-3 rounded font-bold transition-all ${(!evidencePhoto || !evidenceLocation) ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg'}`}>{(!evidencePhoto || !evidenceLocation) ? 'Lengkapi Bukti Dulu' : 'Simpan Absensi'}</button></div>)}
              {modalType === 'newMaterial' && <><input className="w-full p-2 border rounded" placeholder="Material" value={inputName} onChange={e=>setInputName(e.target.value)}/><button onClick={()=>createItem('materials', {id:Date.now(), name:inputName, unit:'Unit', stock:0, minStock:5})} className="w-full bg-blue-600 text-white p-2 rounded font-bold">Simpan</button></>}
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-white px-4 py-3 sticky top-0 z-10 shadow-sm flex justify-between items-center print:hidden">
        {view === 'project-list' || view === 'user-management' || view === 'trash-bin' ? (
          <div className="flex items-center gap-2 font-bold text-slate-800">
             <Building2 className="text-blue-600"/> 
             <div className="flex flex-col">
               <span>Kontraktor App</span>
               {user && <span className="text-[10px] text-slate-400 font-normal uppercase">{userRole?.replace('_', ' ')}: {user.displayName?.split(' ')[0]}</span>}
             </div>
          </div>
        ) : (
          <button onClick={() => setView('project-list')} className="text-slate-500 flex items-center gap-1 text-sm"><ArrowLeft size={18}/> Kembali</button>
        )}
        
        <div className="flex items-center gap-2">
          {canAccessManagement() && view === 'project-list' && <button onClick={() => setView('user-management')} className="text-slate-500 p-2 bg-slate-100 rounded-full hover:bg-slate-200"><Settings size={18} /></button>}
          {view === 'user-management' && <button onClick={() => setView('project-list')} className="text-slate-500 p-2 bg-slate-100 rounded-full hover:bg-slate-200"><LayoutDashboard size={18} /></button>}
          {view === 'project-list' && canEditProject() && <button onClick={() => openModal('newProject')} className="bg-blue-600 text-white p-2 rounded-full shadow"><Plus size={20}/></button>}
          <button onClick={handleLogout} className="text-red-500 p-2 bg-red-50 rounded-full hover:bg-red-100"><LogOut size={18} /></button>
        </div>
      </header>

      {/* TRASH BIN VIEW (Menu Sampah) */}
      {view === 'trash-bin' && (
        <main className="p-4 max-w-md mx-auto space-y-4">
          <div className="flex items-center gap-2 mb-4">
             <button onClick={() => setView('project-list')} className="bg-white p-2 rounded-full shadow"><ArrowLeft size={20}/></button>
             <h2 className="font-bold text-lg text-slate-800">Tong Sampah</h2>
          </div>
          {projects.filter(p => p.isDeleted).length === 0 && <div className="text-center py-10 text-slate-400">Tong sampah kosong.</div>}
          {projects.filter(p => p.isDeleted).map(p => (
             <div key={p.id} className="bg-red-50 p-4 rounded-xl border border-red-100 flex justify-between items-center">
                 <div>
                   <h3 className="font-bold text-slate-800">{p.name}</h3>
                   <p className="text-xs text-slate-500">{p.client}</p>
                 </div>
                 <div className="flex gap-2">
                   <button onClick={() => handleRestoreProject(p)} className="bg-green-100 text-green-700 p-2 rounded-lg text-xs font-bold hover:bg-green-200 flex items-center gap-1"><RotateCcw size={14}/> Pulihkan</button>
                   {canAccessManagement() && <button onClick={() => handlePermanentDeleteProject(p)} className="bg-red-200 text-red-800 p-2 rounded-lg text-xs font-bold hover:bg-red-300 flex items-center gap-1"><Trash2 size={14}/> Hapus</button>}
                 </div>
             </div>
          ))}
        </main>
      )}

      {/* USER MANAGEMENT VIEW */}
      {view === 'user-management' && canAccessManagement() && (
        <main className="p-4 max-w-md mx-auto space-y-4">
          <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg mb-6"><h2 className="font-bold text-lg flex items-center gap-2"><ShieldCheck/> Kelola Akses</h2><p className="text-sm text-blue-100 mt-1">Hanya Super Admin yang bisa melihat halaman ini.</p></div>
          <button onClick={() => openModal('addUser')} className="w-full bg-white border-2 border-dashed border-blue-400 text-blue-600 p-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-blue-50"><UserPlus size={20}/> Tambah User Baru</button>
          <div className="space-y-2">{appUsers.map((u) => (<div key={u.email} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center"><div><p className="font-bold text-slate-800">{u.name}</p><p className="text-xs text-slate-500">{u.email}</p><span className={`text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block bg-slate-100 text-slate-700`}>{u.role.toUpperCase().replace('_', ' ')}</span></div>{u.email !== user?.email && <button onClick={() => handleDeleteUser(u.email)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18}/></button>}</div>))}</div>
        </main>
      )}

      {/* PROJECT LIST VIEW */}
      {view === 'project-list' && (
        <main className="p-4 max-w-md mx-auto space-y-4 relative">
           {/* Tombol Sampah di Bawah */}
           <button onClick={() => setView('trash-bin')} className="absolute -top-12 left-0 text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"><Trash2 size={14}/> Sampah</button>

           {projects.filter(p => !p.isDeleted).length === 0 && <div className="text-center py-10 border border-dashed rounded-xl text-slate-400"><p>Belum ada proyek.</p><button onClick={loadDemoData} disabled={isSyncing} className="bg-green-600 text-white px-4 py-2 mt-4 rounded-lg font-bold text-sm hover:bg-green-700 shadow-lg flex items-center gap-2 mx-auto">{isSyncing ? <Loader2 className="animate-spin"/> : <RefreshCw size={16}/>} Muat Demo</button></div>}
           {projects.filter(p => !p.isDeleted).map(p => (<div key={p.id} onClick={() => { setActiveProjectId(p.id); setView('project-detail'); setActiveTab('dashboard'); }} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-shadow"><div className="flex justify-between mb-2"><h3 className="font-bold text-lg">{p.name}</h3><span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{p.status}</span></div><p className="text-sm text-slate-500 mb-3">{p.client}</p><div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2"><div className="bg-blue-600 h-full" style={{ width: `${getStats(p).prog}%` }}></div></div><div className="flex justify-between text-xs text-slate-400 mt-2"><span>Progres: {getStats(p).prog.toFixed(0)}%</span>{canEditProject() && <button onClick={(e) => {e.stopPropagation(); handleSoftDeleteProject(p); }} className="hover:text-red-500 text-slate-300"><Trash2 size={16}/></button>}</div></div>))}
        </main>
      )}

      {/* REPORT VIEW */}
      {view === 'report-view' && activeProject && canSeeMoney() && (
        <div className="min-h-screen bg-white">
          <header className="bg-slate-800 text-white px-4 py-4 flex items-center justify-between sticky top-0 shadow-md z-20 print:hidden">
            <div className="flex items-center gap-3">
              <button onClick={() => setView('project-detail')} className="hover:bg-slate-700 p-1 rounded"><ArrowLeft/></button>
              <div><h2 className="font-bold uppercase tracking-wider text-sm">Laporan Detail</h2><p className="text-xs text-slate-300">{activeProject.name}</p></div>
            </div>
            
            <div className="flex items-center gap-2">
               <div className="bg-slate-700 p-1 rounded flex text-xs">
                 <button onClick={() => setRabViewMode('client')} className={`px-3 py-1 rounded transition ${rabViewMode === 'client' ? 'bg-white text-slate-800 font-bold' : 'text-slate-300 hover:text-white'}`}>Client</button>
                 <button onClick={() => setRabViewMode('internal')} className={`px-3 py-1 rounded transition ${rabViewMode === 'internal' ? 'bg-white text-slate-800 font-bold' : 'text-slate-300 hover:text-white'}`}>Internal</button>
               </div>
               <button onClick={() => window.print()} className="bg-white text-slate-800 p-2 rounded-full hover:bg-slate-100 shadow-sm"><Printer size={20}/></button>
            </div>
          </header>
          
          <main className="p-4 max-w-3xl mx-auto print:max-w-none print:p-0">
            <div className="hidden print:block mb-8 border-b-2 border-slate-800 pb-4">
              <h1 className="text-3xl font-bold uppercase mb-2">{activeProject.name}</h1>
              <div className="flex justify-between text-sm text-slate-600">
                <div><span className="font-bold">Klien:</span> {activeProject.client}</div>
                <div><span className="font-bold">Lokasi:</span> {activeProject.location}</div>
                <div><span className="font-bold">Tanggal Cetak:</span> {new Date().toLocaleDateString('id-ID')}</div>
              </div>
            </div>

            <div className="mb-8 print:break-inside-avoid">
              <h3 className="font-bold text-lg mb-4 text-slate-800 border-b pb-2">Kurva S (Progress Fisik & Biaya)</h3>
              <SCurveChart stats={getStats(activeProject)} project={activeProject} />
            </div>

            {/* CLIENT REPORT (OPSI B) */}
            {rabViewMode === 'client' && (
              <section className="mb-6">
                 <div className="grid grid-cols-2 gap-4 mb-6 text-sm print:break-inside-avoid">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-slate-500 text-xs uppercase mb-1">Total Dana Masuk (Termin)</p>
                      <p className="font-bold text-green-700 text-xl">{formatRupiah(getStats(activeProject).inc)}</p>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-slate-500 text-xs uppercase mb-1">Nilai Progress Fisik (Prestasi)</p>
                      <p className="font-bold text-blue-700 text-xl">{formatRupiah(getStats(activeProject).prog / 100 * getStats(activeProject).totalRAB)}</p>
                    </div>
                 </div>

                 <h3 className="font-bold text-lg mb-4 text-slate-800 border-b pb-2">Rincian Prestasi Pekerjaan</h3>
                 <div className="space-y-4">
                    {Object.keys(rabGroups).sort().map(category => {
                      const catTotal = rabGroups[category].reduce((a,b)=>a+(b.volume*b.unitPrice),0);
                      const catProgressVal = rabGroups[category].reduce((a,b)=>a+(b.volume*b.unitPrice * b.progress/100),0);
                      
                      return (
                      <div key={category} className="border border-slate-200 rounded-lg overflow-hidden print:break-inside-avoid">
                         <div className="bg-slate-100 p-3 font-bold text-sm text-slate-700 border-b border-slate-200 flex justify-between"><span>{category}</span><span>{formatRupiah(catTotal)}</span></div>
                         <table className="w-full text-xs text-left"><thead className="bg-slate-50 text-slate-500 border-b"><tr><th className="p-2 w-1/3">Item</th><th className="p-2 text-right">Nilai Kontrak</th><th className="p-2 text-center">Bobot</th><th className="p-2 text-center">Prog %</th><th className="p-2 text-right">Nilai Progress</th></tr></thead><tbody className="divide-y divide-slate-100">{rabGroups[category].map(item => { const itemTotal = item.volume * item.unitPrice; const weight = (itemTotal / getStats(activeProject).totalRAB) * 100; const valProgress = itemTotal * (item.progress/100); return (<tr key={item.id}><td className="p-2 font-medium text-slate-700">{item.name}</td><td className="p-2 text-right text-slate-500">{formatRupiah(itemTotal)}</td><td className="p-2 text-center text-slate-400">{weight.toFixed(2)}%</td><td className="p-2 text-center font-bold text-blue-600">{item.progress}%</td><td className="p-2 text-right font-bold text-slate-800">{formatRupiah(valProgress)}</td></tr>)})}</tbody><tfoot className="bg-slate-50 font-bold"><tr><td colSpan={4} className="p-2 text-right">Subtotal Progress:</td><td className="p-2 text-right text-blue-700">{formatRupiah(catProgressVal)}</td></tr></tfoot></table>
                      </div>
                    )})}
                 </div>
              </section>
            )}

            {/* INTERNAL REPORT (CASHFLOW) */}
            {rabViewMode === 'internal' && (
              <section className="mb-6">
                <div className="grid grid-cols-2 gap-4 mb-6 text-sm print:break-inside-avoid">
                   <div className="p-3 bg-green-50 rounded border border-green-100"><p className="text-slate-500 text-xs uppercase">Pemasukan (Termin)</p><p className="font-bold text-green-600 text-lg">{formatRupiah(getStats(activeProject).inc)}</p></div>
                   <div className="p-3 bg-red-50 rounded border border-red-100"><p className="text-slate-500 text-xs uppercase">Pengeluaran (Real Cost)</p><p className="font-bold text-red-600 text-lg">{formatRupiah(getStats(activeProject).exp)}</p></div>
                   <div className="p-3 bg-blue-50 rounded col-span-2 flex justify-between items-center border border-blue-100"><span className="text-slate-500 font-bold">SISA KAS (PROFIT)</span><span className="font-bold text-blue-600 text-xl">{formatRupiah(getStats(activeProject).inc - getStats(activeProject).exp)}</span></div>
                </div>
                <h3 className="font-bold text-lg mb-4 text-slate-800 border-b pb-2">Rincian Transaksi Keuangan</h3>
                <div className="mb-6 print:break-inside-avoid"><h4 className="text-green-700 font-bold border-b border-green-200 pb-1 mb-2">PEMASUKAN</h4><div className="space-y-1">{getGroupedTransactions(activeProject.transactions.filter(t => t.type === 'income')).map((group) => (<div key={group.id} className="border border-slate-100 rounded-lg overflow-hidden print:mb-2"><div className="p-2 bg-slate-50 flex justify-between items-center font-bold"><span className="text-sm">{group.date} • {group.category}</span><span className="text-sm text-green-600">{formatRupiah(group.totalAmount)}</span></div><div className="bg-white"><table className="w-full text-xs text-left"><tbody className="divide-y divide-slate-100">{group.items.map(t => (<tr key={t.id}><td className="p-2 pl-4 text-slate-600">{t.description}</td><td className="p-2 text-right text-slate-800 font-medium">{formatRupiah(t.amount)}</td></tr>))}</tbody></table></div></div>))}</div></div>
                <div className="print:break-inside-avoid"><h4 className="text-red-700 font-bold border-b border-red-200 pb-1 mb-2">PENGELUARAN</h4><div className="space-y-1">{getGroupedTransactions(activeProject.transactions.filter(t => t.type === 'expense')).map((group) => (<div key={group.id} className="border border-slate-100 rounded-lg overflow-hidden print:mb-2"><div className="p-2 bg-slate-50 flex justify-between items-center font-bold"><span className="text-sm">{group.date} • {group.category}</span><span className="text-sm text-red-600">{formatRupiah(group.totalAmount)}</span></div><div className="bg-white"><table className="w-full text-xs text-left"><tbody className="divide-y divide-slate-100">{group.items.map(t => (<tr key={t.id}><td className="p-2 pl-4 text-slate-600">{t.description}</td><td className="p-2 text-right text-slate-800 font-medium">{formatRupiah(t.amount)}</td></tr>))}</tbody></table></div></div>))}</div></div>
              </section>
            )}
          </main>
        </div>
      )}

      {/* PROJECT DETAIL VIEW */}
      {view === 'project-detail' && activeProject && (
        <main className="p-4 max-w-md mx-auto">
          {/* TAB NAV (TOP FOR RAB) */}
          {activeTab === 'progress' && (
             <div className="flex items-center gap-2 mb-4 bg-slate-200 p-1 rounded-lg">
                <button onClick={() => setRabViewMode('client')} className={`flex-1 text-xs font-bold py-1.5 rounded-md transition ${rabViewMode === 'client' ? 'bg-white text-blue-600 shadow' : 'text-slate-500'}`}>View Client</button>
                <button onClick={() => setRabViewMode('internal')} className={`flex-1 text-xs font-bold py-1.5 rounded-md transition ${rabViewMode === 'internal' ? 'bg-white text-blue-600 shadow' : 'text-slate-500'}`}>Internal RAB</button>
             </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="space-y-4">
               <div className="flex justify-between items-center"><h2 className="text-lg font-bold text-slate-800 truncate flex-1">{activeProject.name}</h2>{userRole === 'kontraktor' && <button onClick={() => openModal('editProject')} className="text-blue-600 p-2 rounded hover:bg-blue-50"><Settings size={20}/></button>}</div>
               {canSeeMoney() && (<div className="bg-blue-600 text-white p-5 rounded-xl shadow-lg"><p className="text-blue-200 text-xs mb-1">Saldo Kas Proyek</p><h2 className="text-3xl font-bold">{formatRupiah(getStats(activeProject).inc - getStats(activeProject).exp)}</h2></div>)}
               <SCurveChart stats={getStats(activeProject)} project={activeProject} compact={true} />
               {canSeeMoney() && <button onClick={() => setView('report-view')} className="w-full bg-white border-2 border-blue-600 text-blue-600 p-3 rounded-xl font-bold flex justify-center gap-2 hover:bg-blue-50 transition-colors"><FileText size={20}/> Lihat Laporan Detail</button>}
            </div>
          )}

          {/* TAB RAB & CURVE S (Replacing old Progress) */}
          {activeTab === 'progress' && (
             <div className="space-y-4">
                <SCurveChart stats={getStats(activeProject)} project={activeProject} compact={true} />
                
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-700">Rincian Pekerjaan (RAB)</h3>
                  {canEditProject() && <div className="flex gap-2"><button onClick={handleAddCCO} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold border border-orange-200">+ CCO</button><button onClick={() => { setSelectedRabItem(null); setModalType('newRAB'); setShowModal(true); }} className="text-xs bg-blue-600 text-white px-2 py-1 rounded font-bold">+ Item</button></div>}
                </div>

                <div className="space-y-2 pb-20">
                  {Object.keys(rabGroups).sort().map(category => (
                    <div key={category} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                       <div className="bg-slate-50 p-3 font-bold text-xs text-slate-600 border-b flex justify-between">
                         <span>{category}</span>
                       </div>
                       
                       {/* INTERNAL VIEW (DETAILED) */}
                       {rabViewMode === 'internal' && (
                         <div className="divide-y divide-slate-100">
                           {rabGroups[category].map(item => (
                             <div key={item.id} className={`p-3 text-sm ${item.isAddendum ? 'bg-orange-50' : ''}`}>
                               <div className="flex justify-between mb-1">
                                 <span className="font-bold text-slate-800">{item.name} {item.isAddendum && <span className="text-[9px] bg-orange-200 text-orange-800 px-1 rounded">CCO</span>}</span>
                                 <span className="text-xs font-mono">{item.progress}%</span>
                               </div>
                               <div className="flex justify-between text-xs text-slate-500">
                                 <span>{item.volume} {item.unit} x {formatRupiah(item.unitPrice)}</span>
                                 <span className="font-bold text-slate-700">{formatRupiah(item.volume * item.unitPrice)}</span>
                               </div>
                               <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                 <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${item.progress}%` }}></div>
                               </div>
                               {canEditProject() && (
                                 <div className="flex justify-end gap-2 mt-2">
                                    <button onClick={() => { setSelectedRabItem(item); setProgressInput(item.progress); setProgressDate(new Date().toISOString().split('T')[0]); setModalType('updateProgress'); setShowModal(true); }} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded font-bold">Update Fisik</button>
                                    <button onClick={() => { setSelectedRabItem(item); setModalType('taskHistory'); setShowModal(true); }} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"><History size={12}/></button>
                                    <button onClick={() => handleEditRABItem(item)} className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded"><Edit size={12}/></button>
                                    <button onClick={() => deleteRABItem(item.id)} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded"><Trash2 size={12}/></button>
                                 </div>
                               )}
                             </div>
                           ))}
                         </div>
                       )}

                       {/* CLIENT VIEW (SUMMARY) */}
                       {rabViewMode === 'client' && (
                         <div className="divide-y divide-slate-100">
                           {rabGroups[category].map(item => (
                             <div key={item.id} className="p-3 text-sm flex justify-between items-center">
                               <div>
                                 <div className="font-bold text-slate-800">{item.name}</div>
                                 <div className="text-xs text-slate-500">Vol: {item.volume} {item.unit}</div>
                               </div>
                               <div className="text-right">
                                  <div className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">{item.progress}%</div>
                               </div>
                             </div>
                           ))}
                           <div className="p-3 bg-blue-50 text-right text-xs font-bold text-slate-700">
                             Subtotal: {formatRupiah(rabGroups[category].reduce((a,b)=>a+(b.volume*b.unitPrice),0))}
                           </div>
                         </div>
                       )}
                    </div>
                  ))}
                </div>
             </div>
          )}

          {activeTab === 'finance' && canAccessFinance() && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border shadow-sm"><div className="flex gap-2 mb-3 bg-slate-100 p-1 rounded-lg"><button onClick={() => setTxType('expense')} className={`flex-1 py-1 text-xs font-bold rounded ${txType === 'expense' ? 'bg-white shadow text-red-600' : 'text-slate-500'}`}>Pengeluaran</button><button onClick={() => setTxType('income')} className={`flex-1 py-1 text-xs font-bold rounded ${txType === 'income' ? 'bg-white shadow text-green-600' : 'text-slate-500'}`}>Pemasukan</button></div><form onSubmit={handleTransaction} className="space-y-3"><select name="cat" className="w-full p-2 border rounded text-sm bg-white">{txType === 'expense' ? <><option>Material</option><option>Upah Tukang</option><option>Operasional</option></> : <option>Termin/DP</option>}</select><input required name="desc" placeholder="Keterangan" className="w-full p-2 border rounded text-sm"/><div className="mb-2"><NumberInput className="w-full p-2 border rounded text-sm" placeholder="Nominal (Rp)" value={amount} onChange={setAmount} /></div><button className={`w-full text-white p-2 rounded font-bold text-sm ${txType === 'expense' ? 'bg-red-600' : 'bg-green-600'}`}>Simpan</button></form></div>
              <div className="space-y-2">{getGroupedTransactions(activeProject.transactions).map(group => (<TransactionGroup key={group.id} group={group} isExpanded={expandedGroups[group.id]} onToggle={() => toggleGroup(group.id)} />))}</div>
            </div>
          )}

          {activeTab === 'workers' && canAccessWorkers() && (
            <div className="space-y-4">
               <button onClick={() => openModal('attendance')} className="w-full bg-blue-600 text-white p-3 rounded-xl shadow font-bold flex justify-center gap-2"><Calendar size={20} /> Isi Absensi</button>
               <div className="bg-white p-4 rounded-xl border shadow-sm mt-4"><h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><FileText size={16}/> Rekap & Filter</h3><div className="flex gap-2 mb-3 bg-slate-50 p-2 rounded-lg border border-slate-100"><div className="flex-1"><label className="text-[10px] text-slate-400 block mb-1">Dari</label><input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="w-full bg-white border rounded p-1 text-xs font-bold" /></div><div className="flex items-center text-slate-400">-</div><div className="flex-1"><label className="text-[10px] text-slate-400 block mb-1">Sampai</label><input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="w-full bg-white border rounded p-1 text-xs font-bold" /></div></div><div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="border-b bg-slate-50 text-slate-500"><th className="p-2 text-left">Nama</th><th className="p-2 text-center">Hadir</th><th className="p-2 text-center">Lembur</th>{canSeeMoney() && <th className="p-2 text-right">Est. Upah</th>}</tr></thead><tbody>{getFilteredAttendance().map((stat: any, idx) => (<tr key={idx} className="border-b last:border-0 hover:bg-slate-50"><td className="p-2 font-medium">{stat.name} <span className="text-[9px] text-slate-400 block">{stat.role} • {stat.unit}</span></td><td className="p-2 text-center font-bold text-green-600">{stat.hadir}</td><td className="p-2 text-center font-bold text-blue-600">{stat.lembur}</td>{canSeeMoney() && <td className="p-2 text-right font-bold">{formatRupiah(stat.totalCost)}</td>}</tr>))}{getFilteredAttendance().length === 0 && <tr><td colSpan={canSeeMoney() ? 4 : 3} className="p-4 text-center text-slate-400">Tidak ada data di periode ini.</td></tr>}</tbody></table></div></div>
               
               {/* GALERI BUKTI ABSENSI */}
               <div className="bg-white p-4 rounded-xl border shadow-sm mt-4">
                 <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><ImageIcon size={16}/> Galeri Bukti</h3>
                 <div className="grid grid-cols-2 gap-2">
                   {getFilteredEvidence().map(ev => (
                     <div key={ev.id} className="relative rounded-lg overflow-hidden border">
                       <img src={ev.photoUrl} alt="Bukti" className="w-full h-32 object-cover" />
                       <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-[10px] text-white">
                         <div className="truncate">{ev.date}</div>
                         <div className="truncate opacity-70">{ev.uploader}</div>
                         {ev.location && (
                           <a href={`https://www.google.com/maps/search/?api=1&query=${ev.location}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-200 mt-1 hover:text-blue-100">
                             <ExternalLink size={8}/> Buka Peta
                           </a>
                         )}
                       </div>
                     </div>
                   ))}
                   {getFilteredEvidence().length === 0 && <div className="col-span-2 text-center text-xs text-slate-400 py-4">Tidak ada foto di tanggal ini.</div>}
                 </div>
               </div>

               <div className="flex justify-between items-center mt-4 mb-2"><h3 className="font-bold text-slate-700">Daftar Tim</h3><button onClick={() => openModal('newWorker')} className="text-xs bg-slate-200 px-2 py-1 rounded font-bold">+ Baru</button></div>
               {(activeProject.workers || []).map(w => { const f = calculateWorkerFinancials(activeProject, w.id); return (<div key={w.id} className="bg-white p-4 rounded-xl border shadow-sm text-sm mb-3"><div className="flex justify-between items-start mb-3 border-b pb-2"><div><p className="font-bold text-base">{w.name}</p><p className="text-xs text-slate-500">{w.role} ({w.wageUnit})</p></div><div className="text-right"><p className="font-bold text-2xl text-blue-600">{calculateTotalDays(activeProject.attendanceLogs, w.id)}</p><p className="text-[10px] text-slate-400">Total Hari</p></div></div><div className="flex justify-between items-center bg-slate-50 p-2 rounded mb-3">{canSeeMoney() && <div><p className="text-[10px] text-slate-500">Sisa Hutang:</p><p className={`font-bold ${f.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatRupiah(f.balance)}</p></div>}<div className="flex gap-2">{canSeeMoney() && f.balance > 0 && <button onClick={() => { setSelectedWorkerId(w.id); setPaymentAmount(f.balance); openModal('payWorker'); }} className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1 hover:bg-green-700"><Banknote size={14}/> Bayar</button>}{canAccessWorkers() && (<><button onClick={() => handleEditWorker(w)} className="bg-blue-100 text-blue-600 p-1 rounded hover:bg-blue-200"><Edit size={14}/></button><button onClick={() => handleDeleteWorker(w)} className="bg-red-100 text-red-600 p-1 rounded hover:bg-red-200"><Trash2 size={14}/></button></>)}</div></div></div>)})}
            </div>
          )}
          
          {activeTab === 'logistics' && (
             <div className="space-y-4">
               <div className="flex justify-between items-center"><h3 className="font-bold text-slate-700">Stok Material</h3><button onClick={() => openModal('newMaterial')} className="text-xs bg-blue-600 text-white px-3 py-2 rounded-lg font-bold flex items-center gap-1 hover:bg-blue-700 shadow-sm">+ Material</button></div>
               <div className="grid grid-cols-1 gap-3">{(activeProject.materials || []).map(m => (<div key={m.id} className="bg-white p-4 rounded-xl border shadow-sm relative overflow-hidden">{m.stock <= m.minStock && <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] px-2 py-1 rounded-bl-lg font-bold flex items-center gap-1"><AlertTriangle size={10}/> STOK MENIPIS</div>}<div className="flex justify-between items-start mb-3"><div><div className="font-bold text-slate-800 text-lg">{m.name}</div><div className="text-xs text-slate-500">Min. Stok: {m.minStock} {m.unit}</div></div><div className="text-right"><div className={`text-2xl font-bold ${m.stock <= m.minStock ? 'text-red-600' : 'text-blue-600'}`}>{m.stock}</div><div className="text-xs text-slate-400">{m.unit}</div></div></div><div className="flex gap-2 border-t pt-3"><button onClick={() => { setSelectedMaterial(m); openModal('stockMovement'); }} className="flex-1 py-2 bg-slate-50 text-slate-700 text-xs font-bold rounded hover:bg-slate-100 flex items-center justify-center gap-1 border border-slate-200"><Edit size={14} /> Update Stok</button><button onClick={() => { setSelectedMaterial(m); openModal('stockHistory'); }} className="px-3 py-2 bg-slate-50 text-slate-500 rounded hover:bg-slate-100 border border-slate-200"><History size={16}/></button></div></div>))}{(activeProject.materials || []).length === 0 && <div className="text-center p-8 text-slate-400 border-2 border-dashed rounded-xl">Belum ada material.</div>}</div>
             </div>
          )}
        </main>
      )}

      {/* NAVIGATION BAR */}
      {view === 'project-detail' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t pb-safe z-40 print:hidden">
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