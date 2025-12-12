import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Wallet, Package, Users, TrendingUp, 
  Plus, Minus, Trash2, ArrowLeft, Building2, 
  Loader2, RefreshCw, X, Calendar, FileText, Printer, 
  CheckCircle, Banknote, Edit, Settings, ChevronDown, ChevronUp, LogOut, LogIn, Lock, ShieldCheck, UserPlus
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
type Transaction = { id: number; date: string; category: string; description: string; amount: number; type: 'expense' | 'income'; workerId?: number; };
type Material = { id: number; name: string; unit: string; stock: number; minStock: number; };
type Worker = { id: number; name: string; role: 'Tukang' | 'Kenek' | 'Mandor'; realRate: number; mandorRate: number; };
type Task = { id: number; name: string; weight: number; progress: number; lastUpdated: string; };
type AttendanceLog = { id: number; date: string; workerId: number; status: 'Hadir' | 'Setengah' | 'Lembur' | 'Absen'; note: string; };
type TaskLog = { id: number; date: string; taskId: number; previousProgress: number; newProgress: number; note: string; };

type Project = { 
  id: string; name: string; client: string; location: string; status: string; budgetLimit: number; 
  startDate: string; endDate: string; 
  transactions: Transaction[]; materials: Material[]; workers: Worker[]; tasks: Task[]; 
  attendanceLogs: AttendanceLog[]; taskLogs: TaskLog[];
};

// Tipe Data untuk User Aplikasi
type AppUser = {
  email: string;
  role: 'admin' | 'staff';
  name: string;
};

type GroupedTransaction = {
  id: string; date: string; category: string; type: 'expense' | 'income'; totalAmount: number; items: Transaction[];
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'staff' | null>(null); // State Role User
  const [authStatus, setAuthStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [view, setView] = useState<'project-list' | 'project-detail' | 'report-view' | 'user-management'>('project-list');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]); // State list user aplikasi
  const [isSyncing, setIsSyncing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<any>(null);
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [loginError, setLoginError] = useState('');
  
  // FORM INPUTS
  const [inputName, setInputName] = useState('');
  const [inputEmail, setInputEmail] = useState('');
  const [inputRole, setInputRole] = useState<'admin' | 'staff'>('staff');
  const [inputClient, setInputClient] = useState('');
  const [inputDuration, setInputDuration] = useState(30);
  const [inputBudget, setInputBudget] = useState(0);
  const [inputStartDate, setInputStartDate] = useState('');
  const [inputEndDate, setInputEndDate] = useState('');
  const [inputWeight, setInputWeight] = useState(0);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [progressInput, setProgressInput] = useState(0);
  const [progressDate, setProgressDate] = useState(new Date().toISOString().split('T')[0]);
  const [progressNote, setProgressNote] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<{[workerId: number]: {status: string, note: string}}>({});
  const [expandedGroups, setExpandedGroups] = useState<{[key: string]: boolean}>({});

  // --- LOGIC AUTHENTICATION DENGAN DB CHECK ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // Cek ke Firestore collection 'app_users'
        try {
          // Kita pakai email sebagai ID dokumen agar pencarian cepat
          const userDocRef = doc(db, 'app_users', u.email!);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as AppUser;
            setUser(u);
            setUserRole(userData.role); // Set role dari database
            setAuthStatus('connected');
            setLoginError('');
          } else {
            // Jika user Google login tapi tidak ada di database -> Logout
            await signOut(auth);
            setUser(null);
            setUserRole(null);
            setAuthStatus('connected');
            setLoginError(`Email ${u.email} tidak terdaftar di sistem. Hubungi Admin.`);
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

  // Sync Daftar User Aplikasi (Hanya jika admin)
  useEffect(() => {
    if (userRole === 'admin') {
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
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login gagal", error);
      setLoginError("Terjadi kesalahan saat mencoba login.");
    }
  };

  const handleLogout = async () => {
    if(confirm("Yakin ingin keluar?")) {
      await signOut(auth);
      setProjects([]); 
      setView('project-list');
    }
  };

  // --- USER MANAGEMENT HANDLERS ---
  const handleAddUser = async () => {
    if (!inputEmail || !inputName) return;
    try {
      // Simpan dengan Email sebagai Document ID agar unik
      await setDoc(doc(db, 'app_users', inputEmail), {
        email: inputEmail,
        name: inputName,
        role: inputRole
      });
      alert("User berhasil ditambahkan!");
      setShowModal(false);
      setInputEmail(''); setInputName('');
    } catch (e) {
      alert("Gagal menambah user.");
      console.error(e);
    }
  };

  const handleDeleteUser = async (emailToDelete: string) => {
    if (emailToDelete === user?.email) {
      alert("Anda tidak bisa menghapus akun sendiri!");
      return;
    }
    if (confirm(`Yakin hapus akses untuk ${emailToDelete}?`)) {
      try {
        await deleteDoc(doc(db, 'app_users', emailToDelete));
      } catch (e) {
        alert("Gagal menghapus user.");
      }
    }
  };

  // --- FIRESTORE SYNC ---
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
          taskLogs: Array.isArray(data.taskLogs) ? data.taskLogs : [],
          endDate: data.endDate || new Date(new Date(data.startDate).setDate(new Date(data.startDate).getDate() + 30)).toISOString()
        } as Project;
      });
      list.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      setProjects(list);
    }, (error) => {
      if (error.code === 'permission-denied') {
        alert("Sesi Anda tidak valid atau Anda tidak memiliki izin database.");
        signOut(auth);
      }
    });
  }, [user]);

  const activeProject = projects.find(p => p.id === activeProjectId);
  const formatRupiah = (num: number) => {
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
    (p.workers || []).forEach(w => { const logs = p.attendanceLogs || []; const days = logs.filter(l => l.workerId === w.id && ['Hadir','Lembur','Setengah'].includes(l.status)).length; mandorCost += days * w.mandorRate; realCost += days * w.realRate; });
    return { inc, exp, prog, leak: mandorCost - realCost, timeProgress, curvePoints: generateSCurvePoints(p) };
  };

  const calculateTotalDays = (logs: AttendanceLog[], workerId: number) => {
    if(!logs) return 0;
    return logs.filter(l => l.workerId === workerId).reduce((acc, curr) => { if (curr.status === 'Hadir') return acc + 1; if (curr.status === 'Setengah') return acc + 0.5; if (curr.status === 'Lembur') return acc + 1.5; return acc; }, 0);
  };

  const calculateWorkerFinancials = (p: Project, workerId: number) => {
    const worker = p.workers.find(w => w.id === workerId); if (!worker) return { totalDue: 0, totalPaid: 0, balance: 0 };
    const days = calculateTotalDays(p.attendanceLogs, workerId); const totalDue = days * worker.mandorRate;
    const totalPaid = (p.transactions || []).filter(t => t.workerId === workerId && t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    return { totalDue, totalPaid, balance: totalDue - totalPaid };
  };

  // --- HANDLERS ---
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
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

  const openModal = (type: any) => {
    setModalType(type); setInputName(''); setInputWeight(0); 
    if (type === 'editProject' && activeProject) { setInputName(activeProject.name); setInputClient(activeProject.client); setInputBudget(activeProject.budgetLimit); setInputStartDate(activeProject.startDate.split('T')[0]); setInputEndDate(activeProject.endDate.split('T')[0]); }
    if (type === 'attendance' && activeProject) { const initData: any = {}; activeProject.workers.forEach(w => initData[w.id] = { status: 'Hadir', note: '' }); setAttendanceData(initData); }
    if (type === 'newProject') { setInputDuration(30); } // FIX UNUSED VAR
    if (type === 'addUser') { setInputName(''); setInputEmail(''); setInputRole('staff'); }
    setShowModal(true);
  };

  const createItem = (field: string, newItem: any) => { if(!activeProject) return; updateProject({ [field]: [...(activeProject as any)[field], newItem] }); setShowModal(false); }

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

  const TransactionGroup = ({ group, isExpanded, onToggle }: any) => (
    <div className="bg-white rounded-xl border shadow-sm mb-2 overflow-hidden transition-all">
      <div onClick={onToggle} className="p-3 flex justify-between items-center cursor-pointer hover:bg-slate-50">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${group.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{group.type === 'income' ? <TrendingUp size={16} /> : <Banknote size={16} />}</div>
          <div><div className="font-bold text-sm text-slate-800">{group.category}</div><div className="text-xs text-slate-500 flex items-center gap-1">{group.date} • {group.items.length} Transaksi</div></div>
        </div>
        <div className="text-right"><div className={`font-bold ${group.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{group.type === 'expense' ? '-' : '+'} {formatRupiah(group.totalAmount)}</div>{isExpanded ? <ChevronUp size={16} className="ml-auto text-slate-400"/> : <ChevronDown size={16} className="ml-auto text-slate-400"/>}</div>
      </div>
      {isExpanded && (<div className="bg-slate-50 border-t border-slate-100">{group.items.map((t: any, idx: number) => (<div key={t.id} className={`p-3 flex justify-between items-center text-sm ${idx !== group.items.length - 1 ? 'border-b border-slate-100' : ''}`}><div className="flex-1"><span className="text-slate-700">{t.description}</span></div><div className="flex items-center gap-3"><span className="font-medium text-slate-600">{formatRupiah(t.amount)}</span><button onClick={() => { if(confirm("Hapus transaksi ini?")) updateProject({ transactions: activeProject!.transactions.filter(x => x.id !== t.id) }) }} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button></div></div>))}</div>)}
    </div>
  );

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
        {id:82, date:d(6), category:'Upah Tukang', description:'Gaji Mas Joko', amount:1750000, type:'expense', workerId:3},
        {id:83, date:d(6), category:'Upah Tukang', description:'Gaji Dani', amount:1400000, type:'expense', workerId:6},
      ],
      materials: [
        {id:1, name:'Semen Tiga Roda', unit:'Sak', stock:50, minStock:20}, {id:2, name:'Besi 13mm Ulir', unit:'Batang', stock:200, minStock:50},
        {id:3, name:'Bata Merah', unit:'Pcs', stock:5000, minStock:1000}, {id:4, name:'Pasir Bangka', unit:'Truk', stock:2, minStock:1},
        {id:5, name:'Granit 60x60', unit:'Dus', stock:10, minStock:10}, {id:6, name:'Cat Dulux', unit:'Pail', stock:5, minStock:2},
      ],
      workers: [
        {id:1, name:'Pak Mamat (Mandor)', role:'Mandor', realRate:200000, mandorRate:250000}, {id:2, name:'Kang Ujang', role:'Tukang', realRate:170000, mandorRate:200000},
        {id:3, name:'Mas Joko', role:'Tukang', realRate:150000, mandorRate:175000}, {id:4, name:'Kang Asep', role:'Tukang', realRate:150000, mandorRate:175000},
        {id:5, name:'Mas Budi', role:'Tukang', realRate:150000, mandorRate:175000}, {id:6, name:'Dani', role:'Kenek', realRate:120000, mandorRate:140000},
        {id:7, name:'Rudi', role:'Kenek', realRate:120000, mandorRate:140000}, {id:8, name:'Iwan', role:'Kenek', realRate:120000, mandorRate:140000},
        {id:9, name:'Dodo', role:'Kenek', realRate:120000, mandorRate:140000}, {id:10, name:'Yanto', role:'Kenek', realRate:130000, mandorRate:150000},
      ],
      tasks: [
        {id:1, name:'Persiapan & Gali', weight:5, progress:100, lastUpdated: d(1)}, {id:2, name:'Struktur Beton', weight:25, progress:100, lastUpdated: d(3)},
        {id:3, name:'Dinding & Plester', weight:20, progress:100, lastUpdated: d(4)}, {id:4, name:'Atap & Plafond', weight:15, progress:100, lastUpdated: d(5)},
        {id:5, name:'Lantai & Keramik', weight:15, progress:100, lastUpdated: d(5)}, {id:6, name:'MEP', weight:10, progress:100, lastUpdated: d(6)},
        {id:7, name:'Finishing', weight:10, progress:100, lastUpdated: d(6)},
      ],
      taskLogs: [
        {id:1, date:d(0.5), taskId:1, previousProgress:0, newProgress:50, note:'Gali'}, {id:2, date:d(1), taskId:1, previousProgress:50, newProgress:100, note:'Selesai Gali'},
        {id:3, date:d(1.5), taskId:2, previousProgress:0, newProgress:30, note:'Sloof'}, {id:4, date:d(2), taskId:2, previousProgress:30, newProgress:60, note:'Lantai 2'},
        {id:5, date:d(3), taskId:2, previousProgress:60, newProgress:100, note:'Atap Dak'}, {id:6, date:d(3.5), taskId:3, previousProgress:0, newProgress:50, note:'Bata'},
        {id:7, date:d(4), taskId:3, previousProgress:50, newProgress:100, note:'Plester'}, {id:8, date:d(4.5), taskId:4, previousProgress:0, newProgress:100, note:'Rangka'},
        {id:9, date:d(5), taskId:5, previousProgress:0, newProgress:100, note:'Granit'}, {id:10, date:d(5.5), taskId:6, previousProgress:0, newProgress:100, note:'Lampu'},
        {id:11, date:d(6), taskId:7, previousProgress:0, newProgress:100, note:'Serah Terima'},
      ],
      attendanceLogs: Array.from({length: 10}).map((_, i) => ({id: i, date: d(6), workerId: i+1, status: 'Hadir' as const, note: 'Closingan'}))
    };
    try { await addDoc(collection(db, 'app_data', appId, 'projects'), demo); } catch(e) {} finally { setIsSyncing(false); }
  };

  // --- TAMPILAN LOGIN (JIKA BELUM LOGIN) ---
  if (!user && authStatus !== 'loading') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="text-blue-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Kontraktor Pro</h1>
          <p className="text-slate-500 mb-8 text-sm">Hanya personel terdaftar yang dapat masuk.</p>
          
          {loginError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs mb-4 border border-red-200">
              {loginError}
            </div>
          )}

          <button 
            onClick={handleLogin}
            className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all"
          >
            <LogIn size={20} />
            Masuk dengan Google
          </button>
          <p className="mt-6 text-xs text-slate-400">Hubungi admin jika butuh akses.</p>
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
              {/* FORM TAMBAH USER (ADMIN ONLY) */}
              {modalType === 'addUser' && (
                <>
                  <input className="w-full p-2 border rounded" placeholder="Nama Lengkap" value={inputName} onChange={e => setInputName(e.target.value)} />
                  <input className="w-full p-2 border rounded" placeholder="Email Google" type="email" value={inputEmail} onChange={e => setInputEmail(e.target.value)} />
                  <div className="flex gap-2 items-center">
                    <label className="text-xs w-20">Role</label>
                    <select className="flex-1 p-2 border rounded" value={inputRole} onChange={e => setInputRole(e.target.value as 'admin'|'staff')}>
                      <option value="staff">Staff (Kerja Saja)</option>
                      <option value="admin">Admin (Bisa Add User)</option>
                    </select>
                  </div>
                  <button onClick={handleAddUser} className="w-full bg-blue-600 text-white p-2 rounded font-bold">Tambah User</button>
                </>
              )}

              {modalType === 'newProject' && <><input className="w-full p-2 border rounded" placeholder="Nama Proyek" value={inputName} onChange={e => setInputName(e.target.value)} /><input className="w-full p-2 border rounded" placeholder="Client" value={inputClient} onChange={e => setInputClient(e.target.value)} /><div className="flex gap-2 items-center"><label className="text-xs w-20">Durasi (Hari)</label><input className="w-20 p-2 border rounded" type="number" value={inputDuration} onChange={e => setInputDuration(Number(e.target.value))} /></div><button onClick={() => { const s = new Date(); const e = new Date(); e.setDate(s.getDate() + (inputDuration || 30)); addDoc(collection(db, 'app_data', appId, 'projects'), { name: inputName, client: inputClient, location: '-', status: 'Berjalan', budgetLimit: 0, startDate: s.toISOString(), endDate: e.toISOString(), transactions: [], materials: [], workers: [], tasks: [], attendanceLogs: [], taskLogs: [] }); setShowModal(false); }} className="w-full bg-blue-600 text-white p-2 rounded font-bold">Simpan</button></>}
              {modalType === 'editProject' && <><input className="w-full p-2 border rounded" value={inputName} onChange={e => setInputName(e.target.value)} /><input className="w-full p-2 border rounded" value={inputClient} onChange={e => setInputClient(e.target.value)} /><input className="w-full p-2 border rounded" type="number" value={inputBudget} onChange={e => setInputBudget(Number(e.target.value))} /><input type="date" className="w-full p-2 border rounded" value={inputStartDate} onChange={e => setInputStartDate(e.target.value)} /><input type="date" className="w-full p-2 border rounded" value={inputEndDate} onChange={e => setInputEndDate(e.target.value)} /><button onClick={handleEditProject} className="w-full bg-blue-600 text-white p-2 rounded font-bold">Simpan</button></>}
              {modalType === 'newTask' && <><input className="w-full p-2 border rounded" placeholder="Pekerjaan" value={inputName} onChange={e => setInputName(e.target.value)} /><div className="flex gap-2"><input type="number" className="w-24 p-2 border rounded" placeholder="Bobot %" value={inputWeight || ''} onChange={e => setInputWeight(Number(e.target.value))} /></div><button onClick={() => createItem('tasks', { id: Date.now(), name: inputName, weight: inputWeight, progress: 0, lastUpdated: new Date().toISOString() })} className="w-full bg-blue-600 text-white p-2 rounded font-bold">Simpan</button></>}
              {modalType === 'updateProgress' && <><input type="number" className="w-full p-2 border rounded font-bold text-lg" value={progressInput} onChange={e => setProgressInput(Number(e.target.value))} /><input type="date" className="w-full p-2 border rounded" value={progressDate} onChange={e => setProgressDate(e.target.value)} /><input className="w-full p-2 border rounded" placeholder="Catatan" value={progressNote} onChange={e => setProgressNote(e.target.value)} /><button onClick={handleUpdateProgress} className="w-full bg-blue-600 text-white p-2 rounded font-bold">Update</button></>}
              {modalType === 'newWorker' && <><input className="w-full p-2 border rounded" placeholder="Nama" value={inputName} onChange={e=>setInputName(e.target.value)}/><button onClick={()=>createItem('workers', {id:Date.now(), name:inputName, role:'Tukang', realRate:150000, mandorRate:170000})} className="w-full bg-blue-600 text-white p-2 rounded font-bold">Simpan</button></>}
              {modalType === 'payWorker' && <><input type="number" className="w-full p-2 border rounded font-bold text-lg" value={paymentAmount} onChange={e => setPaymentAmount(Number(e.target.value))} /><button onClick={handlePayWorker} className="w-full bg-green-600 text-white p-2 rounded font-bold">Bayar</button></>}
              {modalType === 'attendance' && activeProject && <div><input type="date" className="w-full p-2 border rounded font-bold mb-4" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} /><div className="max-h-64 overflow-y-auto space-y-2 mb-4">{activeProject.workers.map(w => (<div key={w.id} className="p-2 border rounded bg-slate-50 text-sm flex justify-between items-center"><span>{w.name}</span><select className="p-1 border rounded bg-white" value={attendanceData[w.id]?.status} onChange={(e) => setAttendanceData({...attendanceData, [w.id]: { ...attendanceData[w.id], status: e.target.value }})}><option value="Hadir">Hadir</option><option value="Setengah">Setengah</option><option value="Lembur">Lembur</option><option value="Absen">Absen</option></select></div>))}</div><button onClick={() => { const newLogs: any[] = []; Object.keys(attendanceData).forEach(wId => newLogs.push({ id: Date.now() + Math.random(), date: attendanceDate, workerId: Number(wId), status: attendanceData[Number(wId)].status, note: '' })); updateProject({ attendanceLogs: [...activeProject.attendanceLogs, ...newLogs] }); setShowModal(false); }} className="w-full bg-blue-600 text-white p-2 rounded font-bold">Simpan Absensi</button></div>}
              {modalType === 'newMaterial' && <><input className="w-full p-2 border rounded" placeholder="Material" value={inputName} onChange={e=>setInputName(e.target.value)}/><button onClick={()=>createItem('materials', {id:Date.now(), name:inputName, unit:'Unit', stock:0, minStock:5})} className="w-full bg-blue-600 text-white p-2 rounded font-bold">Simpan</button></>}
            </div>
          </div>
        </div>
      )}

      <header className="bg-white px-4 py-3 sticky top-0 z-10 shadow-sm flex justify-between items-center">
        {view === 'project-list' || view === 'user-management' ? (
          <div className="flex items-center gap-2 font-bold text-slate-800">
             <Building2 className="text-blue-600"/> 
             <div className="flex flex-col">
               <span>Kontraktor App</span>
               {user && <span className="text-[10px] text-slate-400 font-normal">{userRole === 'admin' ? '👑 Admin' : 'Staff'}: {user.displayName?.split(' ')[0]}</span>}
             </div>
          </div>
        ) : (
          <button onClick={() => setView('project-list')} className="text-slate-500 flex items-center gap-1 text-sm"><ArrowLeft size={18}/> Kembali</button>
        )}
        
        <div className="flex items-center gap-2">
          {userRole === 'admin' && view === 'project-list' && (
             <button onClick={() => setView('user-management')} className="text-slate-500 p-2 bg-slate-100 rounded-full hover:bg-slate-200">
               <Settings size={18} />
             </button>
          )}
          {view === 'user-management' && (
            <button onClick={() => setView('project-list')} className="text-slate-500 p-2 bg-slate-100 rounded-full hover:bg-slate-200">
              <LayoutDashboard size={18} />
            </button>
          )}

          {view === 'project-list' && <button onClick={() => openModal('newProject')} className="bg-blue-600 text-white p-2 rounded-full shadow"><Plus size={20}/></button>}
          <button onClick={handleLogout} className="text-red-500 p-2 bg-red-50 rounded-full hover:bg-red-100"><LogOut size={18} /></button>
        </div>
      </header>

      {view === 'user-management' && userRole === 'admin' && (
        <main className="p-4 max-w-md mx-auto space-y-4">
          <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg mb-6">
            <h2 className="font-bold text-lg flex items-center gap-2"><ShieldCheck/> Kelola Akses</h2>
            <p className="text-sm text-blue-100 mt-1">Tambah atau hapus email karyawan yang boleh login ke aplikasi.</p>
          </div>

          <button onClick={() => openModal('addUser')} className="w-full bg-white border-2 border-dashed border-blue-400 text-blue-600 p-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-blue-50">
            <UserPlus size={20}/> Tambah User Baru
          </button>

          <div className="space-y-2">
            {appUsers.map((u) => (
              <div key={u.email} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-800">{u.name}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                    {u.role.toUpperCase()}
                  </span>
                </div>
                {u.email !== user?.email && (
                  <button onClick={() => handleDeleteUser(u.email)} className="text-red-400 hover:text-red-600 p-2">
                    <Trash2 size={18}/>
                  </button>
                )}
              </div>
            ))}
          </div>
        </main>
      )}

      {view === 'project-list' && (
        <main className="p-4 max-w-md mx-auto space-y-4">
           {projects.length === 0 && <div className="text-center py-10 border border-dashed rounded-xl text-slate-400"><p>Belum ada proyek.</p><button onClick={loadDemoData} disabled={isSyncing} className="bg-green-600 text-white px-4 py-2 mt-4 rounded-lg font-bold text-sm hover:bg-green-700 shadow-lg flex items-center gap-2 mx-auto">{isSyncing ? <Loader2 className="animate-spin"/> : <RefreshCw size={16}/>} Muat Demo 1 Milyar</button></div>}
           {projects.map(p => (
             <div key={p.id} onClick={() => { setActiveProjectId(p.id); setView('project-detail'); setActiveTab('dashboard'); }} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-shadow">
                 <div className="flex justify-between mb-2"><h3 className="font-bold text-lg">{p.name}</h3><span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{p.status}</span></div>
                 <p className="text-sm text-slate-500 mb-3">{p.client}</p>
                 <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2"><div className="bg-blue-600 h-full" style={{ width: `${getStats(p).prog}%` }}></div></div>
                 <div className="flex justify-between text-xs text-slate-400 mt-2"><span>Progres: {getStats(p).prog.toFixed(0)}%</span><button onClick={(e) => {e.stopPropagation(); deleteDoc(doc(db, 'app_data', appId, 'projects', p.id))}} className="hover:text-red-500"><Trash2 size={14}/></button></div>
             </div>
           ))}
        </main>
      )}

      {view === 'report-view' && activeProject && (
        <div className="min-h-screen bg-white">
          <header className="bg-slate-800 text-white px-4 py-4 flex items-center gap-3 sticky top-0 shadow-md z-20"><button onClick={() => setView('project-detail')} className="hover:bg-slate-700 p-1 rounded"><ArrowLeft/></button><div><h2 className="font-bold uppercase tracking-wider text-sm">Laporan Proyek</h2><p className="text-xs text-slate-300">{activeProject.name}</p></div></header>
          <main className="p-4 max-w-2xl mx-auto">
            <section className="mb-6 grid grid-cols-2 gap-4 text-sm">
               <div className="p-3 bg-green-50 rounded"><p className="text-slate-500">Pemasukan</p><p className="font-bold text-green-600 text-lg">{formatRupiah(getStats(activeProject).inc)}</p></div>
               <div className="p-3 bg-red-50 rounded"><p className="text-slate-500">Pengeluaran</p><p className="font-bold text-red-600 text-lg">{formatRupiah(getStats(activeProject).exp)}</p></div>
               <div className="p-3 bg-blue-50 rounded col-span-2 flex justify-between items-center"><span className="text-slate-500">Saldo Kas</span><span className="font-bold text-blue-600 text-xl">{formatRupiah(getStats(activeProject).inc - getStats(activeProject).exp)}</span></div>
            </section>
            
            <section className="mb-6">
              <h3 className="font-bold text-lg mb-2 border-l-4 border-blue-600 pl-2">Arus Kas (Grouped)</h3>
              <div className="space-y-1 border-t border-slate-200">
                {getGroupedTransactions(activeProject.transactions).map(group => (
                  <div key={group.id} className="py-2 border-b border-slate-100 flex justify-between text-sm">
                    <div>
                      <div className="font-bold text-slate-700">{group.category}</div>
                      <div className="text-xs text-slate-500">{group.date} • {group.items.length} Item</div>
                    </div>
                    <div className={group.type === 'income' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                      {group.type === 'expense' ? '-' : '+'} {formatRupiah(group.totalAmount)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <button onClick={() => window.print()} className="w-full bg-slate-800 text-white p-3 rounded font-bold mb-10 flex justify-center gap-2"><Printer size={18}/> Cetak PDF</button>
          </main>
        </div>
      )}

      {view === 'project-detail' && activeProject && (
        <main className="p-4 max-w-md mx-auto">
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
               <div className="flex justify-between items-center"><h2 className="text-lg font-bold text-slate-800 truncate flex-1">{activeProject.name}</h2><button onClick={() => openModal('editProject')} className="text-blue-600 p-2 rounded hover:bg-blue-50"><Settings size={20}/></button></div>
               <div className="bg-blue-600 text-white p-5 rounded-xl shadow-lg"><p className="text-blue-200 text-xs mb-1">Saldo Kas</p><h2 className="text-3xl font-bold">{formatRupiah(getStats(activeProject).inc - getStats(activeProject).exp)}</h2></div>
               <SCurveChart stats={getStats(activeProject)} compact={true} />
               <button onClick={() => setView('report-view')} className="w-full bg-white border-2 border-blue-600 text-blue-600 p-3 rounded-xl font-bold flex justify-center gap-2 hover:bg-blue-50 transition-colors"><FileText size={20}/> Lihat Laporan Lengkap</button>
            </div>
          )}
          {activeTab === 'finance' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex gap-2 mb-3 bg-slate-100 p-1 rounded-lg"><button onClick={() => setTxType('expense')} className={`flex-1 py-1 text-xs font-bold rounded ${txType === 'expense' ? 'bg-white shadow text-red-600' : 'text-slate-500'}`}>Pengeluaran</button><button onClick={() => setTxType('income')} className={`flex-1 py-1 text-xs font-bold rounded ${txType === 'income' ? 'bg-white shadow text-green-600' : 'text-slate-500'}`}>Pemasukan</button></div>
                <form onSubmit={handleTransaction} className="space-y-3"><select name="cat" className="w-full p-2 border rounded text-sm bg-white">{txType === 'expense' ? <><option>Material</option><option>Upah Tukang</option><option>Operasional</option></> : <option>Termin/DP</option>}</select><input required name="desc" placeholder="Keterangan" className="w-full p-2 border rounded text-sm"/><input required name="amount" type="number" placeholder="Nominal" className="w-full p-2 border rounded text-sm"/><button className={`w-full text-white p-2 rounded font-bold text-sm ${txType === 'expense' ? 'bg-red-600' : 'bg-green-600'}`}>Simpan</button></form>
              </div>
              
              {/* GROUPED TRANSACTIONS */}
              <div className="space-y-2">
                {getGroupedTransactions(activeProject.transactions).map(group => (
                  <TransactionGroup key={group.id} group={group} isExpanded={expandedGroups[group.id]} onToggle={() => toggleGroup(group.id)} />
                ))}
                {(!activeProject.transactions || activeProject.transactions.length === 0) && <div className="text-center p-8 text-slate-400">Belum ada transaksi</div>}
              </div>
            </div>
          )}
          {/* Other Tabs (Workers, Logistics, Progress) remain similar */}
          {activeTab === 'workers' && (
            <div className="space-y-4">
               <button onClick={() => openModal('attendance')} className="w-full bg-blue-600 text-white p-3 rounded-xl shadow font-bold flex justify-center gap-2"><Calendar size={20} /> Isi Absensi</button>
               <div className="flex justify-between items-center mt-4 mb-2"><h3 className="font-bold text-slate-700">Tim & Gaji</h3><button onClick={() => openModal('newWorker')} className="text-xs bg-slate-200 px-2 py-1 rounded font-bold">+ Baru</button></div>
               {(activeProject.workers || []).map(w => { const f = calculateWorkerFinancials(activeProject, w.id); return (<div key={w.id} className="bg-white p-4 rounded-xl border shadow-sm text-sm mb-3"><div className="flex justify-between items-start mb-3 border-b pb-2"><div><p className="font-bold text-base">{w.name}</p><p className="text-xs text-slate-500">{w.role}</p></div><div className="text-right"><p className="font-bold text-2xl text-blue-600">{calculateTotalDays(activeProject.attendanceLogs, w.id)}</p><p className="text-[10px] text-slate-400">Total Hari</p></div></div><div className="flex justify-between items-center bg-slate-50 p-2 rounded mb-3"><div><p className="text-[10px] text-slate-500">Sisa Hutang:</p><p className={`font-bold ${f.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatRupiah(f.balance)}</p></div>{f.balance > 0 ? (<button onClick={() => { setSelectedWorkerId(w.id); setPaymentAmount(f.balance); openModal('payWorker'); }} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 hover:bg-green-700"><Banknote size={14}/> Bayar</button>) : (<span className="text-xs font-bold text-green-600 flex items-center gap-1"><CheckCircle size={14}/> Lunas</span>)}</div></div>)})}
            </div>
          )}
          {activeTab === 'logistics' && (
             <div className="space-y-3"><button onClick={() => openModal('newMaterial')} className="w-full py-2 border border-dashed rounded text-sm font-bold text-slate-500">+ Tambah Material</button>{(activeProject.materials || []).map(m => (<div key={m.id} className="bg-white p-3 rounded border flex justify-between items-center"><div><div className="font-bold text-sm">{m.name}</div><div className="text-xs text-slate-500">Stok: {m.stock} {m.unit}</div></div><div className="flex gap-2"><button onClick={() => updateProject({materials: activeProject.materials.map(x=>x.id===m.id?{...x,stock:x.stock-1}:x)})} className="w-8 h-8 bg-red-100 text-red-600 rounded flex items-center justify-center"><Minus size={14}/></button><button onClick={() => updateProject({materials: activeProject.materials.map(x=>x.id===m.id?{...x,stock:x.stock+1}:x)})} className="w-8 h-8 bg-green-100 text-green-600 rounded flex items-center justify-center"><Plus size={14}/></button></div></div>))}</div>
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

      {view === 'project-detail' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t pb-safe z-40">
           <div className="max-w-md mx-auto flex justify-between px-2"><button onClick={() => setActiveTab('dashboard')} className={`p-2 flex-1 flex flex-col items-center ${activeTab==='dashboard'?'text-blue-600':'text-slate-400'}`}><LayoutDashboard size={20}/><span className="text-[10px]">Home</span></button><button onClick={() => setActiveTab('finance')} className={`p-2 flex-1 flex flex-col items-center ${activeTab==='finance'?'text-blue-600':'text-slate-400'}`}><Wallet size={20}/><span className="text-[10px]">Uang</span></button><button onClick={() => setActiveTab('workers')} className={`p-2 flex-1 flex flex-col items-center ${activeTab==='workers'?'text-blue-600':'text-slate-400'}`}><Users size={20}/><span className="text-[10px]">Tim</span></button><button onClick={() => setActiveTab('logistics')} className={`p-2 flex-1 flex flex-col items-center ${activeTab==='logistics'?'text-blue-600':'text-slate-400'}`}><Package size={20}/><span className="text-[10px]">Stok</span></button><button onClick={() => setActiveTab('progress')} className={`p-2 flex-1 flex flex-col items-center ${activeTab==='progress'?'text-blue-600':'text-slate-400'}`}><TrendingUp size={20}/><span className="text-[10px]">Kurva S</span></button></div>
        </nav>
      )}
    </div>
  );
};

export default App;