import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Wallet, Package, Users, TrendingUp, 
  Plus, Trash2, ArrowLeft, Building2, 
  Loader2, RefreshCw, X, Calendar, FileText, Printer, 
  CheckCircle, Banknote, Edit, Settings, ChevronDown, ChevronUp, LogOut, LogIn, Lock, ShieldCheck, UserPlus,
  History, AlertTriangle
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
type UserRole = 'kontraktor' | 'keuangan' | 'pengawas';

type AppUser = {
  email: string;
  role: UserRole;
  name: string;
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
type TaskLog = { id: number; date: string; taskId: number; previousProgress: number; newProgress: number; note: string; };

type Project = { 
  id: string; name: string; client: string; location: string; status: string; budgetLimit: number; 
  startDate: string; endDate: string; 
  transactions: Transaction[]; 
  materials: Material[]; 
  materialLogs: MaterialLog[]; 
  workers: Worker[]; 
  tasks: Task[]; 
  attendanceLogs: AttendanceLog[]; 
  taskLogs: TaskLog[];
};

type GroupedTransaction = {
  id: string; date: string; category: string; type: 'expense' | 'income'; totalAmount: number; items: Transaction[];
};

// --- HELPER COMPONENTS (OUTSIDE APP) ---

// 1. SCurve Chart Component
const SCurveChart = ({ stats, compact = false }: { stats: any, compact?: boolean }) => (
  <div className={`w-full bg-white rounded-xl border shadow-sm ${compact ? 'p-3' : 'p-4 mb-4'}`}>
    {!compact && <h3 className="font-bold text-sm text-slate-700 mb-4 flex items-center gap-2"><TrendingUp size={16}/> Visualisasi Proyek</h3>}
    <div className={`relative border-l border-b border-slate-300 mx-2 ${compact ? 'h-32 mt-2' : 'h-48 mt-4'} bg-slate-50`}>
       <div className="absolute -left-6 top-0 text-[8px] text-slate-400">100%</div> <div className="absolute -left-4 bottom-0 text-[8px] text-slate-400">0%</div>
       <svg className="absolute inset-0 w-full h-full overflow-visible">
          <line x1="0" y1="100%" x2="100%" y2="0" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5" />
          <polyline fill="none" stroke={stats.prog >= stats.timeProgress ? "#22c55e" : "#ef4444"} strokeWidth="3" points={stats.curvePoints} />
          <circle cx={`${stats.timeProgress}%`} cy={`${100 - stats.prog}%`} r="4" fill="white" stroke="black" strokeWidth="2" />
       </svg>
    </div>
    <div className={`grid grid-cols-2 gap-2 text-xs ${compact ? 'mt-2' : 'mt-6'}`}>
       <div className="p-1.5 bg-slate-100 rounded text-center"><span className="block text-slate-500 text-[10px]">Waktu</span><span className="font-bold">{stats.timeProgress.toFixed(0)}%</span></div>
       <div className={`p-1.5 rounded text-center ${stats.prog >= stats.timeProgress ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}><span className="block opacity-80 text-[10px]">Fisik</span><span className="font-bold">{stats.prog.toFixed(0)}%</span></div>
    </div>
  </div>
);

// 2. Transaction Group Component
const TransactionGroup = ({ group, isExpanded, onToggle }: any) => {
  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  return (
    <div className="bg-white rounded-xl border shadow-sm mb-2 overflow-hidden transition-all">
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
  const [view, setView] = useState<'project-list' | 'project-detail' | 'report-view' | 'user-management'>('project-list');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<any>(null);
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [loginError, setLoginError] = useState('');
  
  // FORM INPUTS
  const [inputName, setInputName] = useState('');
  const [inputEmail, setInputEmail] = useState('');
  const [inputRole, setInputRole] = useState<UserRole>('pengawas');
  const [inputClient, setInputClient] = useState('');
  const [inputDuration, setInputDuration] = useState(30);
  const [inputBudget, setInputBudget] = useState(0);
  const [inputStartDate, setInputStartDate] = useState('');
  const [inputEndDate, setInputEndDate] = useState('');
  const [inputWeight, setInputWeight] = useState(0);
  
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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [progressInput, setProgressInput] = useState(0);
  const [progressDate, setProgressDate] = useState(new Date().toISOString().split('T')[0]);
  const [progressNote, setProgressNote] = useState('');
  
  // ATTENDANCE & REKAP
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<{[workerId: number]: {status: string, note: string}}>({});
  
  // FILTER RANGE
  const [filterStartDate, setFilterStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterEndDate, setFilterEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [expandedGroups, setExpandedGroups] = useState<{[key: string]: boolean}>({}); 
  const [expandedReportIds, setExpandedReportIds] = useState<{[id: string]: boolean}>({});

  // --- PERMISSION CHECKERS ---
  const canAccessFinance = () => ['kontraktor', 'keuangan'].includes(userRole || '');
  const canAccessWorkers = () => ['kontraktor', 'pengawas'].includes(userRole || '');
  const canAccessManagement = () => userRole === 'kontraktor';
  const canSeeMoney = () => ['kontraktor', 'keuangan'].includes(userRole || '');

  // --- LOGIC AUTH ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const userDocRef = doc(db, 'app_users', u.email!);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as AppUser;
            setUser(u);
            setUserRole(userData.role); 
            setAuthStatus('connected');
            setLoginError('');
          } else {
            await signOut(auth);
            setUser(null);
            setUserRole(null);
            setAuthStatus('connected');
            setLoginError(`Email ${u.email} tidak terdaftar.`);
          }
        } catch (error) {
          console.error("Error verifying user:", error);
          setAuthStatus('error');
        }
      } else {
        setUser(null);
        setUserRole(null);
        setAuthStatus('connected');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userRole === 'kontraktor') {
      const q = query(collection(db, 'app_users'));
      const unsub = onSnapshot(q, (snapshot) => {
        const users = snapshot.docs.map(d => d.data() as AppUser);
        setAppUsers(users);
      });
      return () => unsub();
    }
  }, [userRole]);

  const handleLogin = async () => {
    setLoginError('');
    try { await signInWithPopup(auth, googleProvider); } 
    catch (error) { setLoginError("Terjadi kesalahan saat mencoba login."); }
  };

  const handleLogout = async () => {
    if(confirm("Yakin ingin keluar?")) { await signOut(auth); setProjects([]); setView('project-list'); }
  };

  // --- USER MANAGEMENT ---
  const handleAddUser = async () => {
    if (!inputEmail || !inputName) return;
    try {
      await setDoc(doc(db, 'app_users', inputEmail), { email: inputEmail, name: inputName, role: inputRole });
      alert("User berhasil ditambahkan!"); setShowModal(false); setInputEmail(''); setInputName('');
    } catch (e) { alert("Gagal menambah user."); }
  };

  const handleDeleteUser = async (emailToDelete: string) => {
    if (emailToDelete === user?.email) return alert("Tidak bisa hapus diri sendiri!");
    if (confirm(`Hapus akses ${emailToDelete}?`)) {
      try { await deleteDoc(doc(db, 'app_users', emailToDelete)); } catch (e) { alert("Gagal."); }
    }
  };

  // --- DATA SYNC ---
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'app_data', appId, 'projects'));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => {
        const data = d.data();
        return { 
          id: d.id, ...data, 
          attendanceLogs: Array.isArray(data.attendanceLogs) ? data.attendanceLogs : [], 
          transactions: Array.isArray(data.transactions) ? data.transactions : [],
          tasks: Array.isArray(data.tasks) ? data.tasks : [], 
          workers: Array.isArray(data.workers) ? data.workers : [], 
          materials: Array.isArray(data.materials) ? data.materials : [], 
          materialLogs: Array.isArray(data.materialLogs) ? data.materialLogs : [],
          taskLogs: Array.isArray(data.taskLogs) ? data.taskLogs : [],
          endDate: data.endDate || new Date(new Date(data.startDate).setDate(new Date(data.startDate).getDate() + 30)).toISOString()
        } as Project;
      });
      list.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      setProjects(list);
    }, (error) => {
      if (error.code === 'permission-denied') { alert("Akses Ditolak."); signOut(auth); }
    });
  }, [user]);

  const activeProject = projects.find(p => p.id === activeProjectId);
  const formatRupiah = (num: number) => {
    if (!canSeeMoney()) return 'Rp ***'; 
    if (typeof num !== 'number' || isNaN(num)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };
  
  const updateProject = async (data: Partial<Project>) => {
    if (!user || !activeProjectId) return;
    setIsSyncing(true);
    try { await updateDoc(doc(db, 'app_data', appId, 'projects', activeProjectId), data); } 
    catch(e) { alert("Gagal simpan ke database"); }
    setIsSyncing(false);
  };

  const getGroupedTransactions = (transactions: Transaction[]): GroupedTransaction[] => {
    const groups: {[key: string]: GroupedTransaction} = {};
    transactions.forEach(t => {
      const key = `${t.date}-${t.category}-${t.type}`;
      if (!groups[key]) groups[key] = { id: key, date: t.date, category: t.category, type: t.type, totalAmount: 0, items: [] };
      groups[key].totalAmount += t.amount;
      groups[key].items.push(t);
    });
    return Object.values(groups).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // --- LOGIC REKAP ABSENSI ---
  const getFilteredAttendance = () => {
    if (!activeProject || !activeProject.attendanceLogs) return [];
    
    const start = new Date(filterStartDate); start.setHours(0,0,0,0);
    const end = new Date(filterEndDate); end.setHours(23,59,59,999);

    const filteredLogs = activeProject.attendanceLogs.filter(l => {
      const d = new Date(l.date);
      return d >= start && d <= end;
    });

    const workerStats: {[key: number]: {name: string, role: string, unit: string, hadir: number, lembur: number, setengah: number, absen: number, totalCost: number}} = {};
    
    activeProject.workers.forEach(w => {
      workerStats[w.id] = { name: w.name, role: w.role, unit: w.wageUnit || 'Harian', hadir: 0, lembur: 0, setengah: 0, absen: 0, totalCost: 0 };
    });

    filteredLogs.forEach(log => {
      if (workerStats[log.workerId]) {
        const worker = activeProject.workers.find(w => w.id === log.workerId);
        let dailyRate = 0;
        if (worker) {
          if (worker.wageUnit === 'Mingguan') dailyRate = worker.mandorRate / 7;
          else if (worker.wageUnit === 'Bulanan') dailyRate = worker.mandorRate / 30;
          else dailyRate = worker.mandorRate; 
        }

        if (log.status === 'Hadir') { workerStats[log.workerId].hadir++; workerStats[log.workerId].totalCost += dailyRate; }
        else if (log.status === 'Lembur') { workerStats[log.workerId].lembur++; workerStats[log.workerId].totalCost += (dailyRate * 1.5); }
        else if (log.status === 'Setengah') { workerStats[log.workerId].setengah++; workerStats[log.workerId].totalCost += (dailyRate * 0.5); }
        else if (log.status === 'Absen') { workerStats[log.workerId].absen++; }
      }
    });

    return Object.values(workerStats);
  };

  const generateSCurvePoints = (p: Project) => {
    if (!p.taskLogs || p.taskLogs.length === 0) return "0,100"; 
    const start = new Date(p.startDate).getTime(); const end = new Date(p.endDate).getTime(); const totalDuration = end - start;
    if (totalDuration <= 0) return "0,100";
    const uniqueDates = Array.from(new Set(p.taskLogs.map(l => l.date))).sort();
    if (!uniqueDates.includes(p.startDate.split('T')[0])) uniqueDates.unshift(p.startDate.split('T')[0]);
    const today = new Date().toISOString().split('T')[0];
    if (!uniqueDates.includes(today)) uniqueDates.push(today);
    const points: string[] = [];
    const taskProgressState: {[taskId: number]: number} = {};
    p.tasks.forEach(t => taskProgressState[t.id] = 0);
    uniqueDates.forEach(dateStr => {
      const dateVal = new Date(dateStr).getTime();
      const logsUntilNow = p.taskLogs.filter(l => new Date(l.date).getTime() <= dateVal);
      logsUntilNow.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach(log => { taskProgressState[log.taskId] = log.newProgress; });
      let totalProg = 0;
      p.tasks.forEach(t => { const currentProg = taskProgressState[t.id] || 0; totalProg += (currentProg * t.weight / 100); });
      let x = ((dateVal - start) / totalDuration) * 100; x = Math.max(0, Math.min(100, x));
      let y = 100 - totalProg; points.push(`${x},${y}`);
    });
    return points.join(" ");
  };

  const getStats = (p: Project) => {
    const tx = p.transactions || [];
    const inc = tx.filter(t => t.type === 'income').reduce((a, b) => a + (b.amount || 0), 0);
    const exp = tx.filter(t => t.type === 'expense').reduce((a, b) => a + (b.amount || 0), 0);
    const prog = (p.tasks || []).reduce((a, b) => a + (b.progress * b.weight / 100), 0);
    const start = new Date(p.startDate).getTime(); const end = new Date(p.endDate).getTime(); const now = new Date().getTime();
    let latestUpdate = now;
    if (p.taskLogs && p.taskLogs.length > 0) { const logsTime = p.taskLogs.map(l => new Date(l.date).getTime()); if (Math.max(...logsTime) > now) latestUpdate = Math.max(...logsTime); }
    const totalDuration = end - start; const elapsed = latestUpdate - start;
    let timeProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    if (totalDuration <= 0) timeProgress = 0;
    
    let mandorCost = 0; let realCost = 0;
    (p.workers || []).forEach(w => { 
      const logs = p.attendanceLogs || []; 
      const days = logs.filter(l => l.workerId === w.id && ['Hadir','Lembur','Setengah'].includes(l.status)).reduce((acc, curr) => {
        if(curr.status === 'Hadir') return acc + 1;
        if(curr.status === 'Lembur') return acc + 1.5;
        if(curr.status === 'Setengah') return acc + 0.5;
        return acc;
      }, 0);
      
      let divider = 1;
      if(w.wageUnit === 'Mingguan') divider = 7;
      if(w.wageUnit === 'Bulanan') divider = 30;

      mandorCost += days * (w.mandorRate / divider); 
      realCost += days * (w.realRate / divider); 
    });

    return { inc, exp, prog, leak: mandorCost - realCost, timeProgress, curvePoints: generateSCurvePoints(p) };
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

  // --- HANDLERS ---
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const toggleReportGroup = (groupId: string) => {
    setExpandedReportIds(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleTransaction = (e: React.FormEvent) => {
    e.preventDefault(); if (!activeProject) return;
    const form = e.target as HTMLFormElement;
    const desc = (form.elements.namedItem('desc') as HTMLInputElement).value;
    const amount = Number((form.elements.namedItem('amount') as HTMLInputElement).value);
    const cat = (form.elements.namedItem('cat') as HTMLSelectElement).value;
    if (!desc || isNaN(amount) || amount <= 0) { alert("Data tidak valid"); return; }
    updateProject({ transactions: [{ id: Date.now(), date: new Date().toISOString().split('T')[0], category: cat, description: desc, amount, type: txType }, ...(activeProject.transactions || [])] });
    form.reset();
  };

  const handleUpdateProgress = () => {
    if (!activeProject || !selectedTask) return;
    const updatedTasks = activeProject.tasks.map(t => t.id === selectedTask.id ? { ...t, progress: progressInput, lastUpdated: progressDate } : t);
    const newLog: TaskLog = { id: Date.now(), date: progressDate, taskId: selectedTask.id, previousProgress: selectedTask.progress, newProgress: progressInput, note: progressNote };
    updateProject({ tasks: updatedTasks, taskLogs: [newLog, ...(activeProject.taskLogs || [])] }); setShowModal(false);
  };

  const handleEditProject = () => {
    if (!activeProject) return;
    updateProject({ name: inputName, client: inputClient, budgetLimit: inputBudget, startDate: inputStartDate, endDate: inputEndDate }); setShowModal(false);
  };

  const handlePayWorker = () => {
    if (!activeProject || !selectedWorkerId || paymentAmount <= 0) return;
    const worker = activeProject.workers.find(w => w.id === selectedWorkerId);
    const newTx: Transaction = { id: Date.now(), date: new Date().toISOString().split('T')[0], category: 'Upah Tukang', description: `Gaji ${worker?.name || 'Tukang'}`, amount: paymentAmount, type: 'expense', workerId: selectedWorkerId };
    updateProject({ transactions: [newTx, ...activeProject.transactions] }); setShowModal(false);
  };

  // LOGIC UPDATE STOK
  const handleStockMovement = () => {
    if (!activeProject || !selectedMaterial || stockQty <= 0) return;
    
    // 1. Update Stok di Array Material
    const updatedMaterials = activeProject.materials.map(m => {
      if (m.id === selectedMaterial.id) {
        return {
          ...m,
          stock: stockType === 'in' ? m.stock + stockQty : m.stock - stockQty
        };
      }
      return m;
    });

    // 2. Catat Log
    const newLog: MaterialLog = {
      id: Date.now(),
      materialId: selectedMaterial.id,
      date: stockDate,
      type: stockType,
      quantity: stockQty,
      notes: stockNotes || '-',
      actor: user?.displayName || 'User'
    };

    updateProject({ 
      materials: updatedMaterials, 
      materialLogs: [newLog, ...(activeProject.materialLogs || [])] 
    });
    
    setShowModal(false);
    // Reset form
    setStockQty(0);
    setStockNotes('');
  };

  const openModal = (type: any) => {
    setModalType(type); setInputName(''); setInputWeight(0); 
    
    // SAFEGUARD: Ensure activeProject exists for project-specific modals
    if (['editProject', 'attendance', 'payWorker', 'newMaterial', 'stockMovement', 'stockHistory'].includes(type) && !activeProject) {
      return; 
    }

    if (type === 'editProject' && activeProject) { setInputName(activeProject.name); setInputClient(activeProject.client); setInputBudget(activeProject.budgetLimit); setInputStartDate(activeProject.startDate.split('T')[0]); setInputEndDate(activeProject.endDate.split('T')[0]); }
    if (type === 'attendance' && activeProject) { const initData: any = {}; activeProject.workers.forEach(w => initData[w.id] = { status: 'Hadir', note: '' }); setAttendanceData(initData); }
    if (type === 'newProject') { setInputDuration(30); } 
    if (type === 'addUser') { setInputName(''); setInputEmail(''); setInputRole('pengawas'); }
    if (type === 'newWorker') { 
      setInputName(''); 
      setInputRealRate(150000); 
      setInputMandorRate(170000); 
      setInputWorkerRole('Tukang'); 
      setInputWageUnit('Harian'); 
    }
    // Set default stock date to today
    setStockDate(new Date().toISOString().split('T')[0]);
    setShowModal(true);
  };

  const createItem = (field: string, newItem: any) => { if(!activeProject) return; updateProject({ [field]: [...(activeProject as any)[field], newItem] }); setShowModal(false); }

  const loadDemoData = async () => {
    if (!user) return; setIsSyncing(true);
    const end = new Date(); const start = new Date(); start.setMonth(start.getMonth() - 6);
    const d = (m: number) => { const x = new Date(start); x.setMonth(x.getMonth() + m); return x.toISOString().split('T')[0]; };

    const demo: Omit<Project, 'id'> = {
      name: "Rumah Mewah 2 Lantai (Full Demo)", client: "Bpk Sultan", location: "Pondok Indah", status: 'Selesai', budgetLimit: 1000000000, 
      startDate: start.toISOString(), endDate: end.toISOString(),
      transactions: [
        {id:1, date:d(0), category:'Termin', description:'DP 30%', amount:300000000, type:'income'},
        {id:5, date:d(0), category:'Material', description:'Besi Beton & Semen', amount:150000000, type:'expense'},
        {id:6, date:d(1), category:'Material', description:'Bata Merah 50rb Pcs', amount:45000000, type:'expense'},
        {id:7, date:d(3), category:'Material', description:'Granit Lantai', amount:120000000, type:'expense'},
        {id:80, date:d(6), category:'Upah Tukang', description:'Gaji Pak Mamat', amount:2500000, type:'expense', workerId:1},
        {id:81, date:d(6), category:'Upah Tukang', description:'Gaji Kang Ujang', amount:2000000, type:'expense', workerId:2},
      ],
      materials: [
        {id:1, name:'Semen Tiga Roda', unit:'Sak', stock:50, minStock:20}, 
        {id:2, name:'Bata Merah', unit:'Pcs', stock:5000, minStock:1000}
      ],
      materialLogs: [
        {id:1, materialId:1, date:d(0), type:'in', quantity:100, notes:'Beli Awal', actor:'Admin'},
        {id:2, materialId:1, date:d(2), type:'out', quantity:50, notes:'Cor Pondasi', actor:'Admin'}
      ],
      workers: [
        {id:1, name:'Pak Mamat (Mandor)', role:'Mandor', realRate:200000, mandorRate:250000, wageUnit:'Harian'}, 
        {id:2, name:'Kang Ujang', role:'Tukang', realRate:170000, mandorRate:200000, wageUnit:'Harian'},
      ],
      tasks: [
        {id:1, name:'Persiapan & Gali', weight:5, progress:100, lastUpdated: d(1)}, {id:2, name:'Struktur Beton', weight:25, progress:100, lastUpdated: d(3)},
        {id:3, name:'Dinding & Plester', weight:20, progress:100, lastUpdated: d(4)}, 
      ],
      taskLogs: [
        {id:1, date:d(0.5), taskId:1, previousProgress:0, newProgress:50, note:'Gali'}, {id:2, date:d(1), taskId:1, previousProgress:50, newProgress:100, note:'Selesai Gali'},
        {id:3, date:d(1.5), taskId:2, previousProgress:0, newProgress:30, note:'Sloof'}, {id:4, date:d(2), taskId:2, previousProgress:30, newProgress:60, note:'Lantai 2'},
        {id:5, date:d(3), taskId:2, previousProgress:60, newProgress:100, note:'Atap Dak'}, {id:6, date:d(3.5), taskId:3, previousProgress:0, newProgress:50, note:'Bata'},
      ],
      attendanceLogs: Array.from({length: 10}).map((_, i) => ({id: i, date: d(6), workerId: i+1, status: 'Hadir' as const, note: 'Closingan'}))
    };
    try { await addDoc(collection(db, 'app_data', appId, 'projects'), demo); } catch(e) {} finally { setIsSyncing(false); }
  };

  // --- LOGIN SCREEN ---
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
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-20 relative">
      {/* MODALS */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between bg-slate-50 sticky top-0"><h3 className="font-bold">Input Data</h3><button onClick={() => setShowModal(false)}><X size={20}/></button></div>
            <div className="p-4 space-y-3">
              {/* MODAL USER MANAGEMENT */}
              {modalType === 'addUser' && (
                <>
                  <input className="w-full p-2 border rounded" placeholder="Nama Lengkap" value={inputName} onChange={e => setInputName(e.target.value)} />
                  <input className="w-full p-2 border rounded" placeholder="Email Google" type="email" value={inputEmail} onChange={e => setInputEmail(e.target.value)} />
                  <div className="flex gap-2 items-center">
                    <label className="text-xs w-20">Role</label>
                    <select className="flex-1 p-2 border rounded" value={inputRole} onChange={e => setInputRole(e.target.value as UserRole)}>
                      <option value="pengawas">Pengawas (Absen & Tukang Only)</option>
                      <option value="keuangan">Keuangan (Uang Only)</option>
                      <option value="kontraktor">Kontraktor (Full Access)</option>
                    </select>
                  </div>
                  <button onClick={handleAddUser} className="w-full bg-blue-600 text-white p-2 rounded font-bold">Tambah User</button>
                </>
              )}

              {/* MODAL LAINNYA */}
              {modalType === 'newProject' && <><input className="w-full p-2 border rounded" placeholder="Nama Proyek" value={inputName} onChange={e => setInputName(e.target.value)} /><input className="w-full p-2 border rounded" placeholder="Client" value={inputClient} onChange={e => setInputClient(e.target.value)} /><div className="flex gap-2 items-center"><label className="text-xs w-20">Durasi (Hari)</label><input className="w-20 p-2 border rounded" type="number" value={inputDuration} onChange={e => setInputDuration(Number(e.target.value))} /></div><button onClick={() => { const s = new Date(); const e = new Date(); e.setDate(s.getDate() + (inputDuration || 30)); addDoc(collection(db, 'app_data', appId, 'projects'), { name: inputName, client: inputClient, location: '-', status: 'Berjalan', budgetLimit: 0, startDate: s.toISOString(), endDate: e.toISOString(), transactions: [], materials: [], workers: [], tasks: [], attendanceLogs: [], taskLogs: [] }); setShowModal(false); }} className="w-full bg-blue-600 text-white p-2 rounded font-bold">Simpan</button></>}
              {modalType === 'editProject' && <><input className="w-full p-2 border rounded" value={inputName} onChange={e => setInputName(e.target.value)} /><input className="w-full p-2 border rounded" value={inputClient} onChange={e => setInputClient(e.target.value)} /><input className="w-full p-2 border rounded" type="number" value={inputBudget} onChange={e => setInputBudget(Number(e.target.value))} /><input type="date" className="w-full p-2 border rounded" value={inputStartDate} onChange={e => setInputStartDate(e.target.value)} /><input type="date" className="w-full p-2 border rounded" value={inputEndDate} onChange={e => setInputEndDate(e.target.value)} /><button onClick={handleEditProject} className="w-full bg-blue-600 text-white p-2 rounded font-bold">Simpan</button></>}
              {modalType === 'newTask' && <><input className="w-full p-2 border rounded" placeholder="Pekerjaan" value={inputName} onChange={e => setInputName(e.target.value)} /><div className="flex gap-2"><input type="number" className="w-24 p-2 border rounded" placeholder="Bobot %" value={inputWeight || ''} onChange={e => setInputWeight(Number(e.target.value))} /></div><button onClick={() => createItem('tasks', { id: Date.now(), name: inputName, weight: inputWeight, progress: 0, lastUpdated: new Date().toISOString() })} className="w-full bg-blue-600 text-white p-2 rounded font-bold">Simpan</button></>}
              {modalType === 'updateProgress' && <><input type="number" className="w-full p-2 border rounded font-bold text-lg" value={progressInput} onChange={e => setProgressInput(Number(e.target.value))} /><input type="date" className="w-full p-2 border rounded" value={progressDate} onChange={e => setProgressDate(e.target.value)} /><input className="w-full p-2 border rounded" placeholder="Catatan" value={progressNote} onChange={e => setProgressNote(e.target.value)} /><button onClick={handleUpdateProgress} className="w-full bg-blue-600 text-white p-2 rounded font-bold">Update</button></>}
              
              {/* MODAL PEKERJA DENGAN INPUT GAJI & SATUAN */}
              {modalType === 'newWorker' && (
                <>
                  <input className="w-full p-2 border rounded" placeholder="Nama" value={inputName} onChange={e=>setInputName(e.target.value)}/>
                  <div className="flex gap-2">
                    <select className="flex-1 p-2 border rounded" value={inputWorkerRole} onChange={(e) => setInputWorkerRole(e.target.value as any)}>
                      <option>Tukang</option><option>Kenek</option><option>Mandor</option>
                    </select>
                    <select className="flex-1 p-2 border rounded bg-slate-50" value={inputWageUnit} onChange={(e) => setInputWageUnit(e.target.value as any)}>
                      <option value="Harian">Per Hari</option>
                      <option value="Mingguan">Per Minggu</option>
                      <option value="Bulanan">Per Bulan</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-slate-500">Upah Asli ({inputWageUnit})</label>
                      <input type="number" className="w-full p-2 border rounded" value={inputRealRate} onChange={e=>setInputRealRate(Number(e.target.value))}/>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-slate-500">Upah RAB ({inputWageUnit})</label>
                      <input type="number" className="w-full p-2 border rounded" value={inputMandorRate} onChange={e=>setInputMandorRate(Number(e.target.value))}/>
                    </div>
                  </div>
                  <button onClick={()=>createItem('workers', {id:Date.now(), name:inputName, role:inputWorkerRole, wageUnit:inputWageUnit, realRate:inputRealRate, mandorRate:inputMandorRate})} className="w-full bg-blue-600 text-white p-2 rounded font-bold">Simpan</button>
                </>
              )}

              {/* MODAL STOCK MOVEMENT */}
              {modalType === 'stockMovement' && selectedMaterial && (
                <>
                  <h4 className="font-bold text-slate-700">{selectedMaterial.name}</h4>
                  <p className="text-xs text-slate-500 mb-2">Stok Saat Ini: {selectedMaterial.stock} {selectedMaterial.unit}</p>
                  
                  <div className="flex gap-2 mb-2">
                    <button onClick={() => setStockType('in')} className={`flex-1 p-2 rounded text-sm font-bold border ${stockType==='in' ? 'bg-green-100 border-green-300 text-green-700' : 'border-slate-200'}`}>Masuk (+)</button>
                    <button onClick={() => setStockType('out')} className={`flex-1 p-2 rounded text-sm font-bold border ${stockType==='out' ? 'bg-red-100 border-red-300 text-red-700' : 'border-slate-200'}`}>Keluar (-)</button>
                  </div>

                  <input type="number" className="w-full p-2 border rounded font-bold text-lg" placeholder="Jumlah" value={stockQty} onChange={e => setStockQty(Number(e.target.value))}/>
                  <input type="date" className="w-full p-2 border rounded" value={stockDate} onChange={e => setStockDate(e.target.value)}/>
                  <input className="w-full p-2 border rounded" placeholder="Keterangan (Wajib)" value={stockNotes} onChange={e => setStockNotes(e.target.value)}/>
                  
                  <button onClick={handleStockMovement} disabled={!stockNotes || stockQty <= 0} className={`w-full text-white p-2 rounded font-bold ${!stockNotes || stockQty <= 0 ? 'bg-slate-300' : 'bg-blue-600'}`}>Simpan Riwayat</button>
                </>
              )}

              {/* MODAL HISTORY LOGS */}
              {modalType === 'stockHistory' && selectedMaterial && activeProject && (
                <div className="max-h-96 overflow-y-auto">
                  <h4 className="font-bold text-slate-700 mb-4">Riwayat: {selectedMaterial.name}</h4>
                  <div className="space-y-3">
                    {(activeProject.materialLogs || []).filter(l => l.materialId === selectedMaterial.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (
                      <div key={log.id} className="text-sm border-b pb-2">
                        <div className="flex justify-between">
                          <span className="font-bold text-slate-700">{log.date}</span>
                          <span className={`font-bold ${log.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                            {log.type === 'in' ? '+' : '-'}{log.quantity}
                          </span>
                        </div>
                        <div className="text-slate-500 text-xs mt-1 flex justify-between">
                          <span>{log.notes}</span>
                          <span className="italic">{log.actor}</span>
                        </div>
                      </div>
                    ))}
                    {(activeProject.materialLogs || []).filter(l => l.materialId === selectedMaterial.id).length === 0 && <p className="text-center text-slate-400 text-xs">Belum ada riwayat.</p>}
                  </div>
                </div>
              )}

              {modalType === 'payWorker' && <><input type="number" className="w-full p-2 border rounded font-bold text-lg" value={paymentAmount} onChange={e => setPaymentAmount(Number(e.target.value))} /><button onClick={handlePayWorker} className="w-full bg-green-600 text-white p-2 rounded font-bold">Bayar</button></>}
              {modalType === 'attendance' && activeProject && <div><input type="date" className="w-full p-2 border rounded font-bold mb-4" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} /><div className="max-h-64 overflow-y-auto space-y-2 mb-4">{activeProject.workers.map(w => (<div key={w.id} className="p-2 border rounded bg-slate-50 text-sm flex justify-between items-center"><span>{w.name}</span><select className="p-1 border rounded bg-white" value={attendanceData[w.id]?.status} onChange={(e) => setAttendanceData({...attendanceData, [w.id]: { ...attendanceData[w.id], status: e.target.value }})}><option value="Hadir">Hadir</option><option value="Setengah">Setengah</option><option value="Lembur">Lembur</option><option value="Absen">Absen</option></select></div>))}</div><button onClick={() => { const newLogs: any[] = []; Object.keys(attendanceData).forEach(wId => newLogs.push({ id: Date.now() + Math.random(), date: attendanceDate, workerId: Number(wId), status: attendanceData[Number(wId)].status, note: '' })); updateProject({ attendanceLogs: [...activeProject.attendanceLogs, ...newLogs] }); setShowModal(false); }} className="w-full bg-blue-600 text-white p-2 rounded font-bold">Simpan Absensi</button></div>}
              {modalType === 'newMaterial' && <><input className="w-full p-2 border rounded" placeholder="Material" value={inputName} onChange={e=>setInputName(e.target.value)}/><button onClick={()=>createItem('materials', {id:Date.now(), name:inputName, unit:'Unit', stock:0, minStock:5})} className="w-full bg-blue-600 text-white p-2 rounded font-bold">Simpan</button></>}
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-white px-4 py-3 sticky top-0 z-10 shadow-sm flex justify-between items-center print:hidden">
        {view === 'project-list' || view === 'user-management' ? (
          <div className="flex items-center gap-2 font-bold text-slate-800">
             <Building2 className="text-blue-600"/> 
             <div className="flex flex-col">
               <span>Kontraktor App</span>
               {user && <span className="text-[10px] text-slate-400 font-normal uppercase">{userRole}: {user.displayName?.split(' ')[0]}</span>}
             </div>
          </div>
        ) : (
          <button onClick={() => setView('project-list')} className="text-slate-500 flex items-center gap-1 text-sm"><ArrowLeft size={18}/> Kembali</button>
        )}
        
        <div className="flex items-center gap-2">
          {canAccessManagement() && view === 'project-list' && (
             <button onClick={() => setView('user-management')} className="text-slate-500 p-2 bg-slate-100 rounded-full hover:bg-slate-200">
               <Settings size={18} />
             </button>
          )}
          {view === 'user-management' && (
            <button onClick={() => setView('project-list')} className="text-slate-500 p-2 bg-slate-100 rounded-full hover:bg-slate-200">
              <LayoutDashboard size={18} />
            </button>
          )}

          {view === 'project-list' && canAccessManagement() && <button onClick={() => openModal('newProject')} className="bg-blue-600 text-white p-2 rounded-full shadow"><Plus size={20}/></button>}
          <button onClick={handleLogout} className="text-red-500 p-2 bg-red-50 rounded-full hover:bg-red-100"><LogOut size={18} /></button>
        </div>
      </header>

      {/* USER MANAGEMENT VIEW */}
      {view === 'user-management' && canAccessManagement() && (
        <main className="p-4 max-w-md mx-auto space-y-4">
          <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg mb-6">
            <h2 className="font-bold text-lg flex items-center gap-2"><ShieldCheck/> Kelola Akses</h2>
            <p className="text-sm text-blue-100 mt-1">Atur role: Kontraktor, Keuangan, atau Pengawas.</p>
          </div>
          <button onClick={() => openModal('addUser')} className="w-full bg-white border-2 border-dashed border-blue-400 text-blue-600 p-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-blue-50">
            <UserPlus size={20}/> Tambah User Baru
          </button>
          <div className="space-y-2">
            {appUsers.map((u) => (
              <div key={u.email} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
                <div><p className="font-bold text-slate-800">{u.name}</p><p className="text-xs text-slate-500">{u.email}</p><span className={`text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block ${u.role === 'kontraktor' ? 'bg-purple-100 text-purple-700' : u.role === 'keuangan' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{u.role.toUpperCase()}</span></div>
                {u.email !== user?.email && <button onClick={() => handleDeleteUser(u.email)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18}/></button>}
              </div>
            ))}
          </div>
        </main>
      )}

      {/* PROJECT LIST VIEW */}
      {view === 'project-list' && (
        <main className="p-4 max-w-md mx-auto space-y-4">
           {projects.length === 0 && <div className="text-center py-10 border border-dashed rounded-xl text-slate-400"><p>Belum ada proyek.</p><button onClick={loadDemoData} disabled={isSyncing} className="bg-green-600 text-white px-4 py-2 mt-4 rounded-lg font-bold text-sm hover:bg-green-700 shadow-lg flex items-center gap-2 mx-auto">{isSyncing ? <Loader2 className="animate-spin"/> : <RefreshCw size={16}/>} Muat Demo</button></div>}
           {projects.map(p => (
             <div key={p.id} onClick={() => { setActiveProjectId(p.id); setView('project-detail'); setActiveTab('dashboard'); }} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-shadow">
                 <div className="flex justify-between mb-2"><h3 className="font-bold text-lg">{p.name}</h3><span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{p.status}</span></div>
                 <p className="text-sm text-slate-500 mb-3">{p.client}</p>
                 <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2"><div className="bg-blue-600 h-full" style={{ width: `${getStats(p).prog}%` }}></div></div>
                 <div className="flex justify-between text-xs text-slate-400 mt-2"><span>Progres: {getStats(p).prog.toFixed(0)}%</span>{userRole === 'kontraktor' && <button onClick={(e) => {e.stopPropagation(); deleteDoc(doc(db, 'app_data', appId, 'projects', p.id))}} className="hover:text-red-500"><Trash2 size={14}/></button>}</div>
             </div>
           ))}
        </main>
      )}

      {/* REPORT VIEW (GROUP BY CATEGORY) */}
      {view === 'report-view' && activeProject && canSeeMoney() && (
        <div className="min-h-screen bg-white">
          <header className="bg-slate-800 text-white px-4 py-4 flex items-center gap-3 sticky top-0 shadow-md z-20 print:hidden"><button onClick={() => setView('project-detail')} className="hover:bg-slate-700 p-1 rounded"><ArrowLeft/></button><div><h2 className="font-bold uppercase tracking-wider text-sm">Laporan Detail</h2><p className="text-xs text-slate-300">{activeProject.name}</p></div></header>
          
          <main className="p-4 max-w-3xl mx-auto print:max-w-none print:p-0">
            <div className="hidden print:block mb-4 text-center">
              <h1 className="text-2xl font-bold uppercase">{activeProject.name}</h1>
              <p className="text-sm text-slate-500">Laporan Keuangan Proyek</p>
            </div>

            {/* Summary Box */}
            <section className="mb-6 grid grid-cols-2 gap-4 text-sm border-b pb-6 print:border-none print:pb-2">
               <div className="p-3 bg-green-50 rounded border border-green-100 print:bg-transparent print:border-black"><p className="text-slate-500 text-xs uppercase">Pemasukan</p><p className="font-bold text-green-600 text-lg print:text-black">{formatRupiah(getStats(activeProject).inc)}</p></div>
               <div className="p-3 bg-red-50 rounded border border-red-100 print:bg-transparent print:border-black"><p className="text-slate-500 text-xs uppercase">Pengeluaran</p><p className="font-bold text-red-600 text-lg print:text-black">{formatRupiah(getStats(activeProject).exp)}</p></div>
               <div className="p-3 bg-blue-50 rounded col-span-2 flex justify-between items-center border border-blue-100 print:bg-transparent print:border-black"><span className="text-slate-500 font-bold">SISA SALDO</span><span className="font-bold text-blue-600 text-xl print:text-black">{formatRupiah(getStats(activeProject).inc - getStats(activeProject).exp)}</span></div>
            </section>
            
            {/* Detailed Lists Grouped by Category */}
            <section className="mb-6">
              
              {/* PEMASUKAN */}
              <div className="mb-6">
                <h4 className="text-green-700 font-bold border-b border-green-200 pb-1 mb-2 print:text-black print:border-black">PEMASUKAN</h4>
                <div className="space-y-1">
                  {getGroupedTransactions(activeProject.transactions.filter(t => t.type === 'income')).map((group) => (
                    <div key={group.id} className="border border-slate-100 rounded-lg overflow-hidden print:border-none print:rounded-none">
                      <div onClick={() => toggleReportGroup(group.id)} className="p-2 bg-slate-50 flex justify-between items-center cursor-pointer hover:bg-slate-100 print:bg-transparent print:p-0 print:border-b print:border-slate-300 print:font-bold">
                        <span className="text-sm font-medium">{group.date} • {group.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-green-600 print:text-black">{formatRupiah(group.totalAmount)}</span>
                          <span className="print:hidden">{expandedReportIds[group.id] ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</span>
                        </div>
                      </div>
                      <div className={`${expandedReportIds[group.id] ? 'block' : 'hidden'} print:block bg-white`}>
                        <table className="w-full text-xs text-left">
                          <tbody className="divide-y divide-slate-100">
                            {group.items.map(t => (
                              <tr key={t.id}>
                                <td className="p-2 pl-4 text-slate-600 print:pl-0 print:text-[10px]">{t.description}</td>
                                <td className="p-2 text-right text-slate-800 font-medium print:text-[10px]">{formatRupiah(t.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PENGELUARAN */}
              <div>
                <h4 className="text-red-700 font-bold border-b border-red-200 pb-1 mb-2 print:text-black print:border-black">PENGELUARAN</h4>
                <div className="space-y-1">
                  {getGroupedTransactions(activeProject.transactions.filter(t => t.type === 'expense')).map((group) => (
                    <div key={group.id} className="border border-slate-100 rounded-lg overflow-hidden print:border-none print:rounded-none">
                      <div onClick={() => toggleReportGroup(group.id)} className="p-2 bg-slate-50 flex justify-between items-center cursor-pointer hover:bg-slate-100 print:bg-transparent print:p-0 print:border-b print:border-slate-300 print:font-bold">
                        <span className="text-sm font-medium">{group.date} • {group.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-red-600 print:text-black">{formatRupiah(group.totalAmount)}</span>
                          <span className="print:hidden">{expandedReportIds[group.id] ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</span>
                        </div>
                      </div>
                      <div className={`${expandedReportIds[group.id] ? 'block' : 'hidden'} print:block bg-white`}>
                        <table className="w-full text-xs text-left">
                          <tbody className="divide-y divide-slate-100">
                            {group.items.map(t => (
                              <tr key={t.id}>
                                <td className="p-2 pl-4 text-slate-600 print:pl-0 print:text-[10px]">{t.description}</td>
                                <td className="p-2 text-right text-slate-800 font-medium print:text-[10px]">{formatRupiah(t.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </section>
            <button onClick={() => window.print()} className="w-full bg-slate-800 text-white p-3 rounded font-bold mb-10 flex justify-center gap-2 print:hidden"><Printer size={18}/> Cetak Laporan</button>
          </main>
        </div>
      )}

      {/* PROJECT DETAIL VIEW */}
      {view === 'project-detail' && activeProject && (
        <main className="p-4 max-w-md mx-auto">
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
               <div className="flex justify-between items-center"><h2 className="text-lg font-bold text-slate-800 truncate flex-1">{activeProject.name}</h2>{userRole === 'kontraktor' && <button onClick={() => openModal('editProject')} className="text-blue-600 p-2 rounded hover:bg-blue-50"><Settings size={20}/></button>}</div>
               
               {canSeeMoney() && (
                 <div className="bg-blue-600 text-white p-5 rounded-xl shadow-lg">
                   <p className="text-blue-200 text-xs mb-1">Saldo Kas Proyek</p>
                   <h2 className="text-3xl font-bold">{formatRupiah(getStats(activeProject).inc - getStats(activeProject).exp)}</h2>
                 </div>
               )}

               <SCurveChart stats={getStats(activeProject)} compact={true} />
               
               {canSeeMoney() && (
                 <button onClick={() => setView('report-view')} className="w-full bg-white border-2 border-blue-600 text-blue-600 p-3 rounded-xl font-bold flex justify-center gap-2 hover:bg-blue-50 transition-colors"><FileText size={20}/> Lihat Laporan Detail</button>
               )}
            </div>
          )}

          {activeTab === 'finance' && canAccessFinance() && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex gap-2 mb-3 bg-slate-100 p-1 rounded-lg"><button onClick={() => setTxType('expense')} className={`flex-1 py-1 text-xs font-bold rounded ${txType === 'expense' ? 'bg-white shadow text-red-600' : 'text-slate-500'}`}>Pengeluaran</button><button onClick={() => setTxType('income')} className={`flex-1 py-1 text-xs font-bold rounded ${txType === 'income' ? 'bg-white shadow text-green-600' : 'text-slate-500'}`}>Pemasukan</button></div>
                <form onSubmit={handleTransaction} className="space-y-3"><select name="cat" className="w-full p-2 border rounded text-sm bg-white">{txType === 'expense' ? <><option>Material</option><option>Upah Tukang</option><option>Operasional</option></> : <option>Termin/DP</option>}</select><input required name="desc" placeholder="Keterangan" className="w-full p-2 border rounded text-sm"/><input required name="amount" type="number" placeholder="Nominal" className="w-full p-2 border rounded text-sm"/><button className={`w-full text-white p-2 rounded font-bold text-sm ${txType === 'expense' ? 'bg-red-600' : 'bg-green-600'}`}>Simpan</button></form>
              </div>
              <div className="space-y-2">{getGroupedTransactions(activeProject.transactions).map(group => (<TransactionGroup key={group.id} group={group} isExpanded={expandedGroups[group.id]} onToggle={() => toggleGroup(group.id)} />))}</div>
            </div>
          )}

          {activeTab === 'workers' && canAccessWorkers() && (
            <div className="space-y-4">
               <button onClick={() => openModal('attendance')} className="w-full bg-blue-600 text-white p-3 rounded-xl shadow font-bold flex justify-center gap-2"><Calendar size={20} /> Isi Absensi</button>
               
               {/* MODUL REKAP ABSENSI BARU: RANGE DATE PICKER */}
               <div className="bg-white p-4 rounded-xl border shadow-sm mt-4">
                 <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><FileText size={16}/> Rekap & Filter</h3>
                 
                 {/* DATE RANGE FILTER UI */}
                 <div className="flex gap-2 mb-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                   <div className="flex-1">
                     <label className="text-[10px] text-slate-400 block mb-1">Dari</label>
                     <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="w-full bg-white border rounded p-1 text-xs font-bold" />
                   </div>
                   <div className="flex items-center text-slate-400">-</div>
                   <div className="flex-1">
                     <label className="text-[10px] text-slate-400 block mb-1">Sampai</label>
                     <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="w-full bg-white border rounded p-1 text-xs font-bold" />
                   </div>
                 </div>
                 
                 <div className="overflow-x-auto">
                   <table className="w-full text-xs">
                     <thead>
                       <tr className="border-b bg-slate-50 text-slate-500">
                         <th className="p-2 text-left">Nama</th>
                         <th className="p-2 text-center">Hadir</th>
                         <th className="p-2 text-center">Lembur</th>
                         {canSeeMoney() && <th className="p-2 text-right">Est. Upah</th>}
                       </tr>
                     </thead>
                     <tbody>
                       {getFilteredAttendance().map((stat: any, idx) => (
                         <tr key={idx} className="border-b last:border-0 hover:bg-slate-50">
                           <td className="p-2 font-medium">
                             {stat.name} 
                             <span className="text-[9px] text-slate-400 block">{stat.role} • {stat.unit}</span>
                           </td>
                           <td className="p-2 text-center font-bold text-green-600">{stat.hadir}</td>
                           <td className="p-2 text-center font-bold text-blue-600">{stat.lembur}</td>
                           {canSeeMoney() && <td className="p-2 text-right font-bold">{formatRupiah(stat.totalCost)}</td>}
                         </tr>
                       ))}
                       {getFilteredAttendance().length === 0 && <tr><td colSpan={canSeeMoney() ? 4 : 3} className="p-4 text-center text-slate-400">Tidak ada data di periode ini.</td></tr>}
                     </tbody>
                   </table>
                 </div>
               </div>

               <div className="flex justify-between items-center mt-4 mb-2"><h3 className="font-bold text-slate-700">Daftar Tim</h3><button onClick={() => openModal('newWorker')} className="text-xs bg-slate-200 px-2 py-1 rounded font-bold">+ Baru</button></div>
               {(activeProject.workers || []).map(w => { const f = calculateWorkerFinancials(activeProject, w.id); return (<div key={w.id} className="bg-white p-4 rounded-xl border shadow-sm text-sm mb-3"><div className="flex justify-between items-start mb-3 border-b pb-2"><div><p className="font-bold text-base">{w.name}</p><p className="text-xs text-slate-500">{w.role} ({w.wageUnit})</p></div><div className="text-right"><p className="font-bold text-2xl text-blue-600">{calculateTotalDays(activeProject.attendanceLogs, w.id)}</p><p className="text-[10px] text-slate-400">Total Hari</p></div></div>{canSeeMoney() && (<div className="flex justify-between items-center bg-slate-50 p-2 rounded mb-3"><div><p className="text-[10px] text-slate-500">Sisa Hutang:</p><p className={`font-bold ${f.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatRupiah(f.balance)}</p></div>{f.balance > 0 ? (<button onClick={() => { setSelectedWorkerId(w.id); setPaymentAmount(f.balance); openModal('payWorker'); }} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 hover:bg-green-700"><Banknote size={14}/> Bayar</button>) : (<span className="text-xs font-bold text-green-600 flex items-center gap-1"><CheckCircle size={14}/> Lunas</span>)}</div>)}</div>)})}
            </div>
          )}
          
          {/* TAB LOGISTICS - NOW WITH HISTORY & CARDS */}
          {activeTab === 'logistics' && (
             <div className="space-y-4">
               <div className="flex justify-between items-center">
                 <h3 className="font-bold text-slate-700">Stok Material</h3>
                 <button onClick={() => openModal('newMaterial')} className="text-xs bg-blue-600 text-white px-3 py-2 rounded-lg font-bold flex items-center gap-1 hover:bg-blue-700 shadow-sm">+ Material</button>
               </div>
               
               <div className="grid grid-cols-1 gap-3">
                 {(activeProject.materials || []).map(m => (
                   <div key={m.id} className="bg-white p-4 rounded-xl border shadow-sm relative overflow-hidden">
                     {/* Low Stock Indicator */}
                     {m.stock <= m.minStock && <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] px-2 py-1 rounded-bl-lg font-bold flex items-center gap-1"><AlertTriangle size={10}/> STOK MENIPIS</div>}
                     
                     <div className="flex justify-between items-start mb-3">
                       <div>
                         <div className="font-bold text-slate-800 text-lg">{m.name}</div>
                         <div className="text-xs text-slate-500">Min. Stok: {m.minStock} {m.unit}</div>
                       </div>
                       <div className="text-right">
                         <div className={`text-2xl font-bold ${m.stock <= m.minStock ? 'text-red-600' : 'text-blue-600'}`}>{m.stock}</div>
                         <div className="text-xs text-slate-400">{m.unit}</div>
                       </div>
                     </div>

                     <div className="flex gap-2 border-t pt-3">
                       <button onClick={() => { setSelectedMaterial(m); openModal('stockMovement'); }} className="flex-1 py-2 bg-slate-50 text-slate-700 text-xs font-bold rounded hover:bg-slate-100 flex items-center justify-center gap-1 border border-slate-200">
                         <Edit size={14} /> Update Stok
                       </button>
                       <button onClick={() => { setSelectedMaterial(m); openModal('stockHistory'); }} className="px-3 py-2 bg-slate-50 text-slate-500 rounded hover:bg-slate-100 border border-slate-200">
                         <History size={16}/>
                       </button>
                     </div>
                   </div>
                 ))}
                 
                 {(activeProject.materials || []).length === 0 && <div className="text-center p-8 text-slate-400 border-2 border-dashed rounded-xl">Belum ada material.</div>}
               </div>
             </div>
          )}

          {activeTab === 'progress' && (
             <div className="space-y-4">
                <SCurveChart stats={getStats(activeProject)} compact={true} />
                <button onClick={() => openModal('newTask')} className="text-sm font-bold text-blue-600">+ Tambah Pekerjaan</button>
                {(activeProject.tasks || []).map(t => (
                  <div key={t.id} className="bg-white p-3 rounded-xl border shadow-sm">
                    <div className="flex justify-between text-sm mb-2"><div><p className="font-bold">{t.name}</p><p className="text-xs text-slate-500">Bobot: {t.weight}%</p></div><div className="text-right"><span className="font-bold text-blue-600 text-lg">{t.progress}%</span><p className="text-[10px] text-slate-400">Last: {t.lastUpdated ? new Date(t.lastUpdated).toLocaleDateString() : '-'}</p></div></div>
                    <button onClick={() => { setSelectedTask(t); setProgressInput(t.progress); setProgressDate(new Date().toISOString().split('T')[0]); openModal('updateProgress'); }} className="w-full py-2 bg-slate-50 text-slate-600 text-xs font-bold rounded hover:bg-slate-100 flex items-center justify-center gap-2 border border-slate-200"><Edit size={14} /> Update Progres</button>
                  </div>
                ))}
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