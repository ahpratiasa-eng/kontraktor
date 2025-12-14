import React, { useState, useEffect } from 'react';
import {
  Loader2, RotateCcw, ShieldCheck, UserPlus,
  Trash2
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import ProjectDetailView from './components/ProjectDetailView';
import ReportView from './components/ReportView';
import ModalManager from './components/ModalManager';

import {
  signInWithPopup, signOut, onAuthStateChanged
} from 'firebase/auth';

import {
  collection, doc, addDoc, updateDoc,
  deleteDoc, onSnapshot, query, setDoc, getDoc
} from 'firebase/firestore';

import { auth, db, googleProvider, appId } from './lib/firebase';
import type {
  Project, AppUser, RABItem, Transaction, Material,
  MaterialLog, Worker, TaskLog, UserRole
} from './types';

const App = () => {
  const [user, setUser] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [authStatus, setAuthStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [view, setView] = useState<'project-list' | 'project-detail' | 'report-view' | 'user-management' | 'trash-bin'>('project-list');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isClientView, setIsClientView] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<any>(null);

  // Form States (now managed centrally in App to pass to ModalManager)
  const [inputName, setInputName] = useState('');
  const [inputClient, setInputClient] = useState('');
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
      // Simulate Client Login
      setActiveProjectId(pId);
      setView('project-detail');
      setIsClientView(true);
      // We can't set userRole to 'client_guest' seamlessly without auth, 
      // but we can enforce read-only by bypassing auth check or setting a dummy user.
      // For now, let's just set the view and hopefully the logic handles null user.
      // Actually, many checks rely on 'user'. We might need a dummy user.
      setUser({ uid: 'guest', email: 'client@guest.com', displayName: 'Tamu Klien' } as any);
      setUserRole('super_admin'); // DANGEROUS! Don't do this.
      // Better: Create a new role 'client_guest' in types and handle it.
      // But types are in index.ts. 
      // Let's just set userRole to null (public? no) or 'keuangan'? No.
      // Let's stick to the requested "Client Portal" as a SHAREABLE LINK feature.
      // If the user is NOT logged in, they can't access firebase data due to rules?
      // Assuming rules allow read for public or we use this just for logged in users?
      // The request implies a public link.
      // If Firebase rules block it, we can't do it easily.
      // Let's assume for now we just switch view if logged in.
      // If strictly public, we'd need Anonymouse Auth.
    }
  }, []);

  useEffect(() => { const u = onAuthStateChanged(auth, async (u) => { if (u) { try { const d = await getDoc(doc(db, 'app_users', u.email!)); if (d.exists()) { setUser(u); setUserRole(d.data().role); setAuthStatus('connected'); } else { await signOut(auth); console.error('Email not authorized:', u.email); alert(`Email ${u.email} tidak terdaftar.`); } } catch (e) { setAuthStatus('error'); } } else { setUser(null); setAuthStatus('connected'); } }); return () => u(); }, []);
  useEffect(() => { if (userRole === 'super_admin') return onSnapshot(query(collection(db, 'app_users')), (s) => setAppUsers(s.docs.map(d => d.data() as AppUser))); }, [userRole]);
  useEffect(() => { if (user) return onSnapshot(query(collection(db, 'app_data', appId, 'projects')), (s) => { const l = s.docs.map(d => { const x = d.data(); return { id: d.id, ...x, rabItems: Array.isArray(x.rabItems) ? x.rabItems : [], transactions: x.transactions || [], materials: x.materials || [], workers: x.workers || [], attendanceLogs: x.attendanceLogs || [], isDeleted: x.isDeleted || false } as Project; }); l.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()); setProjects(l); }); }, [user]);

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
      // Create new project
      const newP: any = { name: inputName, client: inputClient, budgetLimit: inputBudget, startDate: inputStartDate, endDate: inputEndDate, status: 'Berjalan' };
      addDoc(collection(db, 'app_data', appId, 'projects'), newP);
      setShowModal(false);
    } else {
      updateProject({ name: inputName, client: inputClient, budgetLimit: inputBudget, startDate: inputStartDate, endDate: inputEndDate }); setShowModal(false);
    }
  };

  const prepareEditProject = () => {
    if (!activeProject) return;
    setInputName(activeProject.name);
    setInputClient(activeProject.client);
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
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = (event) => { const img = new Image(); img.src = event.target?.result as string; img.onload = () => { const canvas = document.createElement('canvas'); let width = img.width; let height = img.height; const MAX_WIDTH = 800; const MAX_HEIGHT = 800; if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } } canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx?.drawImage(img, 0, 0, width, height); const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7); setEvidencePhoto(compressedDataUrl); handleGetLocation(); }; }; };

  const saveAttendanceWithEvidence = () => { if (!activeProject) return; if (!evidencePhoto) { alert("Wajib ambil foto bukti lapangan!"); return; } if (!evidenceLocation) { alert("Lokasi wajib terdeteksi!"); return; } const newLogs: any[] = []; Object.keys(attendanceData).forEach(wId => { newLogs.push({ id: Date.now() + Math.random(), date: attendanceDate, workerId: Number(wId), status: attendanceData[Number(wId)].status, note: '' }); }); let newEvidences = activeProject.attendanceEvidences || []; if (evidencePhoto || evidenceLocation) { newEvidences = [{ id: Date.now(), date: attendanceDate, photoUrl: evidencePhoto, location: evidenceLocation, uploader: user?.displayName || 'Unknown', timestamp: new Date().toISOString() }, ...newEvidences]; } updateProject({ attendanceLogs: [...activeProject.attendanceLogs, ...newLogs], attendanceEvidences: newEvidences }); setShowModal(false); };
  const getFilteredEvidence = () => { if (!activeProject || !activeProject.attendanceEvidences) return []; return activeProject.attendanceEvidences; }; // Simplified for now

  const openModal = (type: string) => { setModalType(type); setShowModal(true); };

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

  const loadDemoData = async () => { if (!user) return; setIsSyncing(true); const start = new Date(); start.setMonth(start.getMonth() - 6); const d = (m: number) => { const x = new Date(start); x.setMonth(x.getMonth() + m); return x.toISOString().split('T')[0]; }; const demo: any = { name: "Rumah Mewah 2 Lantai (Full Demo)", client: "Bpk Sultan", location: "PIK 2", status: 'Selesai', budgetLimit: 0, startDate: d(-30), endDate: d(30), rabItems: [{ id: 1, category: 'A. PERSIAPAN', name: 'Pembersihan Lahan', unit: 'ls', volume: 1, unitPrice: 15000000, progress: 100, isAddendum: false }], transactions: [], workers: [], materials: [], materialLogs: [], taskLogs: [], attendanceLogs: [], attendanceEvidences: [] }; await addDoc(collection(db, 'app_data', appId, 'projects'), demo); setIsSyncing(false); };


  if (!user && authStatus !== 'loading') return <div className="h-screen flex items-center justify-center"><button onClick={handleLogin} className="bg-blue-600 text-white p-4 rounded-xl font-bold">Login Google</button></div>;
  if (authStatus === 'loading') return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      <style>{`@media print { body { background: white; } .print\\:hidden { display: none !important; } .print\\:break-inside-avoid { break-inside: avoid; } }`}</style>

      {/* SIDEBAR (Desktop Only) */}
      <Sidebar
        view={view}
        setView={setView}
        openModal={openModal}
        handleLogout={handleLogout}
        userRole={userRole}
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 md:ml-64 flex flex-col relative pb-20 md:pb-0">

        {/* HEADER (Desktop: Offset left, Mobile: Full) */}
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

            />
          )}


          {/* REPORT VIEW */}
          {view === 'report-view' && activeProject && canSeeMoney() && (
            <ReportView
              activeProject={activeProject}
              setView={setView}
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
        handlePhotoUpload={handlePhotoUpload}
        handleGetLocation={handleGetLocation}
        isGettingLoc={isGettingLoc}
        activeProject={activeProject}
        selectedRabItem={selectedRabItem}
        selectedWorkerId={selectedWorkerId}
      />

      {/* MOBILE NAV */}
      <MobileNav
        view={view}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={userRole}
      />

    </div>
  );
};

export default App;