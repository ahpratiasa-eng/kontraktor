import React, { useState } from 'react';
import {
    Settings, FileText, Sparkles, History, Edit, Trash2, Banknote,
    ImageIcon, ExternalLink, Upload
} from 'lucide-react';
import { NumberInput, TransactionGroup } from './UIComponents';
import SCurveChart from './SCurveChart';
import {
    formatRupiah, getStats, getGroupedTransactions,
    calculateWorkerFinancials
} from '../utils/helpers';
import type { Project, RABItem, GroupedTransaction, Worker, Material } from '../types';
import ProjectGallery from './ProjectGallery';
import type { UserRole } from '../types';

interface ProjectDetailViewProps {
    activeProject: Project;
    activeTab: string;
    userRole: UserRole | null;
    setView: (view: any) => void;
    updateProject: (data: Partial<Project>) => void;
    // Modal Triggers
    openModal: (type: string) => void;
    setModalType: (type: string) => void;
    setShowModal: (show: boolean) => void;
    setSelectedRabItem: (item: RABItem | null) => void;
    setProgressInput: (val: number) => void;
    setProgressDate: (date: string) => void;
    setSelectedWorkerId: (id: number | null) => void;
    setPaymentAmount: (amount: number) => void;
    setSelectedMaterial: (m: Material | null) => void;
    // Handlers from App (those that require global state or modal state)
    deleteRABItem: (id: number) => void;
    handleEditWorker: (w: Worker) => void;
    handleDeleteWorker: (w: Worker) => void;
    // Permissions
    canAccessFinance: boolean;
    canAccessWorkers: boolean;
    canSeeMoney: boolean;
    canEditProject: boolean;
    setActiveTab: (tab: string) => void;
    prepareEditProject: () => void;
    prepareEditRABItem: (item: RABItem) => void;
    isClientView?: boolean;
    handleReportToOwner: () => void;
}

const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
    activeProject, activeTab, setView, updateProject,
    openModal, setModalType, setShowModal, setSelectedRabItem, setProgressInput, setProgressDate,
    setSelectedWorkerId, setPaymentAmount, setSelectedMaterial,
    deleteRABItem, handleEditWorker, handleDeleteWorker,
    canAccessFinance, canAccessWorkers, canSeeMoney, canEditProject,
    setActiveTab, prepareEditProject, prepareEditRABItem, isClientView, handleReportToOwner
}) => {
    // Local State moved from App.tsx
    const [rabViewMode, setRabViewMode] = useState<'internal' | 'client'>('client');

    // Enforce Client View Mode
    React.useEffect(() => {
        if (isClientView) setRabViewMode('client');
    }, [isClientView]);
    const [txType, setTxType] = useState<'expense' | 'income'>('expense');
    const [amount, setAmount] = useState(0);
    const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({});
    const [filterStartDate, setFilterStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterEndDate, setFilterEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [showAllGantt, setShowAllGantt] = useState(false);
    const [weather, setWeather] = useState<any>(null);

    React.useEffect(() => {
        if (!activeProject.location) return;
        const fetchWeather = async () => {
            try {
                const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(activeProject.location)}&count=1&language=id&format=json`);
                const geoData = await geoRes.json();
                if (!geoData.results?.[0]) return;
                const { latitude, longitude, name } = geoData.results[0];
                const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`);
                const weatherData = await weatherRes.json();
                setWeather({ temp: weatherData.current.temperature_2m, humidity: weatherData.current.relative_humidity_2m, wind: weatherData.current.wind_speed_10m, code: weatherData.current.weather_code, city: name });
            } catch (e) { console.error("Weather error", e); }
        };
        fetchWeather();
    }, [activeProject.location]);

    const getWeatherIcon = (code: number) => {
        if (code === 0) return '☀️';
        if (code <= 3) return '⛅';
        if (code <= 48) return '🌫️';
        if (code <= 67) return '🌧️';
        if (code >= 80) return '⛈️';
        return '☁️';
    };

    const getWeatherDesc = (code: number) => {
        if (code === 0) return 'Cerah';
        if (code <= 3) return 'Berawan';
        if (code <= 48) return 'Berkabut';
        if (code <= 67) return 'Hujan Ringan';
        if (code >= 80) return 'Hujan Lebat';
        return 'Mendung';
    };

    // Derived Values & Local Handlers
    const rabGroups = (() => {
        if (!activeProject.rabItems) return {};
        const groups: { [key: string]: RABItem[] } = {};
        activeProject.rabItems.forEach(item => { if (!groups[item.category]) groups[item.category] = []; groups[item.category].push(item); });
        return groups;
    })();

    const toggleGroup = (groupId: string) => { setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] })); };

    const handleTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const desc = (form.elements.namedItem('desc') as HTMLInputElement).value;
        const cat = (form.elements.namedItem('cat') as HTMLSelectElement).value;
        if (!desc || amount <= 0) { alert("Data tidak valid"); return; }
        updateProject({ transactions: [{ id: Date.now(), date: new Date().toISOString().split('T')[0], category: cat, description: desc, amount: amount, type: txType }, ...(activeProject.transactions || [])] });
        form.reset();
        setAmount(0);
    };

    const getAttendanceSummary = () => {
        const start = new Date(filterStartDate); start.setHours(0, 0, 0, 0);
        const end = new Date(filterEndDate); end.setHours(23, 59, 59, 999);

        return activeProject.workers.map(w => {
            const logs = (activeProject.attendanceLogs || []).filter((l: any) => {
                const d = new Date(l.date);
                return l.workerId === w.id && d >= start && d <= end;
            });
            const hadir = logs.filter((l: any) => l.status === 'Hadir').length;
            const lembur = logs.filter((l: any) => l.status === 'Lembur').length;

            let daily = w.realRate;
            if (w.wageUnit === 'Mingguan') daily = w.realRate / 7;
            if (w.wageUnit === 'Bulanan') daily = w.realRate / 30;

            const totalCost = (hadir * daily) + (lembur * (daily / 8) * 1.5);

            return {
                name: w.name,
                hadir,
                lembur,
                totalCost
            };
        });
    };

    const getFilteredEvidence = () => {
        if (!activeProject || !activeProject.attendanceEvidences) return [];
        const start = new Date(filterStartDate); start.setHours(0, 0, 0, 0);
        const end = new Date(filterEndDate); end.setHours(23, 59, 59, 999);
        return activeProject.attendanceEvidences.filter((e: any) => {
            const d = new Date(e.date);
            return d >= start && d <= end;
        });
    };

    const tabs = [
        { id: 'dashboard', label: 'Ringkasan', icon: <FileText size={18} /> },
        { id: 'progress', label: 'Kurva S & RAB', icon: <Sparkles size={18} /> },
        ...(!isClientView && canAccessFinance ? [{ id: 'finance', label: 'Keuangan', icon: <Banknote size={18} /> }] : []),
        ...(!isClientView && canAccessWorkers ? [{ id: 'workers', label: 'Tim & Absensi', icon: <ImageIcon size={18} /> }] : []),
        ...(!isClientView ? [{ id: 'logistics', label: 'Logistik', icon: <History size={18} /> }] : []),
        { id: 'gallery', label: 'Galeri', icon: <ImageIcon size={18} /> },
    ];

    return (
        <div className="space-y-6">
            {/* Desktop Navigation Tabs */}
            <div className="hidden md:flex items-center gap-1 border-b border-slate-200 mb-6 overflow-x-auto pb-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-3 rounded-t-lg text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${activeTab === tab.id ? 'bg-blue-50 text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50'
                            }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>
            {activeTab === 'progress' && !isClientView && (
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

                            <div className="bg-blue-50 p-4 rounded-xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <div className="bg-white p-2 rounded-full shadow-sm text-yellow-500 text-2xl">
                                        <div className="animate-pulse">{weather ? getWeatherIcon(weather.code) : '☀️'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500">Cuaca {weather ? weather.city : 'Lokasi'} (Live)</div>
                                        <div className="font-bold text-slate-700">{weather ? `${getWeatherDesc(weather.code)}, ${weather.temp}°C` : 'Memuat Cuaca...'}</div>
                                    </div>
                                </div>
                                <div className="text-left sm:text-right w-full sm:w-auto text-xs text-slate-400 pl-12 sm:pl-0">
                                    Kelembaban: {weather ? weather.humidity : '-'}%<br />Angin: {weather ? weather.wind : '-'} km/h
                                </div>
                            </div>

                            {/* OWNER REPORT BUTTON (Visible if not client view) */}
                            {!isClientView && (
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200 mb-6 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-green-800 text-sm">Laporan Sore ke Owner</h3>
                                        <p className="text-xs text-green-600">Kirim update progress & link portal.</p>
                                    </div>
                                    <button
                                        onClick={handleReportToOwner}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-green-700 shadow-sm flex items-center gap-2"
                                    >
                                        <ExternalLink size={14} /> Kirim WA
                                    </button>
                                </div>
                            )}

                            {!isClientView && canEditProject && <button onClick={prepareEditProject} className="w-full mb-4 border border-slate-200 text-blue-600 p-2 rounded-lg font-bold hover:bg-blue-50 flex items-center justify-center gap-2"><Settings size={18} /> Pengaturan Proyek</button>}

                            <div className="flex flex-col sm:flex-row gap-2">
                                {(canSeeMoney || isClientView) && (<button onClick={() => setView('report-view')} className="flex-1 bg-blue-600 text-white p-3 rounded-xl font-bold flex justify-center gap-2 hover:bg-blue-700 shadow-lg transition-transform hover:scale-105"><FileText size={20} /> Laporan</button>)}
                                {!isClientView && <button onClick={() => {
                                    const url = `${window.location.origin}?projectId=${activeProject.id}&mode=client`;
                                    navigator.clipboard.writeText(url);
                                    alert(`Link Portal Klien disalin!\nKirim link ini ke klien Anda:\n${url}`);
                                }} className="flex-1 bg-green-600 text-white p-3 rounded-xl font-bold flex justify-center gap-2 hover:bg-green-700 shadow-lg transition-transform hover:scale-105"><ExternalLink size={20} /> Portal Klien</button>}
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-2"><SCurveChart stats={getStats(activeProject)} project={activeProject} /></div>
                </div>
            )}

            {activeTab === 'progress' && (
                <div className="space-y-6">
                    {/* Gantt Chart Section */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <h3 className="font-bold text-lg text-slate-700 mb-4 flex items-center gap-2"><History size={20} /> Timeline Pekerjaan (Gantt Chart)</h3>
                        <div className="overflow-x-auto">
                            <div className="min-w-[800px]">
                                <div className="flex border-b border-slate-100 pb-2 mb-2">
                                    <div className="w-1/4 font-bold text-xs text-slate-500">Item Pekerjaan</div>
                                    <div className="w-3/4 flex relative h-6">
                                        {[...Array(12)].map((_, i) => (
                                            <div key={i} className="flex-1 border-l border-slate-100 text-[10px] text-slate-400 pl-1">
                                                Mgg {i + 1}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {activeProject.rabItems.slice(0, showAllGantt ? undefined : 5).map((item, idx) => {
                                        // Stable Gantt Calculation
                                        let startOffset = 0;
                                        let width = 0;

                                        const pStart = new Date(activeProject.startDate).getTime();
                                        const pEnd = new Date(activeProject.endDate).getTime();
                                        const totalDuration = pEnd - pStart;

                                        if (item.startDate && item.endDate && totalDuration > 0) {
                                            const iStart = new Date(item.startDate).getTime();
                                            const iEnd = new Date(item.endDate).getTime();
                                            startOffset = ((iStart - pStart) / totalDuration) * 100;
                                            width = ((iEnd - iStart) / totalDuration) * 100;
                                        } else {
                                            // Fallback: Deterministic Stagger based on Index
                                            // This ensures it never "jumps" on re-render
                                            startOffset = Math.min((idx * 15), 80);
                                            width = 15;
                                        }

                                        // Safety Clamps
                                        if (startOffset < 0) startOffset = 0;
                                        if (startOffset > 100) startOffset = 0; // Reset if out of bounds (e.g. date error)
                                        if (width < 5) width = 5;
                                        if (startOffset + width > 100) width = 100 - startOffset;

                                        return (
                                            <div key={item.id} className="flex items-center group hover:bg-slate-50 rounded-lg p-1">
                                                <div className="w-1/4 text-xs font-medium truncate pr-2">{item.name}</div>
                                                <div className="w-3/4 relative h-6 bg-slate-50 rounded-full overflow-hidden">
                                                    <div
                                                        className={`absolute top-1 bottom-1 rounded-full opacity-80 ${['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500'][idx % 4]}`}
                                                        style={{ left: `${startOffset}%`, width: `${width}%` }}
                                                    >
                                                        <span className="text-[9px] text-white px-2 font-bold flex items-center h-full">{item.progress}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {activeProject.rabItems.length > 5 && (
                                        <button
                                            onClick={() => setShowAllGantt(!showAllGantt)}
                                            className="w-full text-center text-xs font-bold text-blue-600 hover:text-blue-800 mt-2 py-2 border-t border-slate-100 transition-colors"
                                        >
                                            {showAllGantt ? 'Tutup Tampilan Ringkas' : `Lihat Semua (${activeProject.rabItems.length} items)`}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-3"><SCurveChart stats={getStats(activeProject)} project={activeProject} compact={true} /></div>
                        <div className="lg:col-span-3">
                            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg text-slate-700">Rincian RAB</h3>{!isClientView && canEditProject && <div className="flex gap-2"><button onClick={() => { setModalType('importRAB'); setShowModal(true); }} className="text-xs bg-green-100 text-green-700 px-3 py-2 rounded-lg font-bold border border-green-200 hover:bg-green-200 flex items-center gap-1"><Upload size={14} /> Import Excel</button><button onClick={() => { setModalType('aiRAB'); setShowModal(true); }} className="text-xs bg-purple-100 text-purple-700 px-3 py-2 rounded-lg font-bold border border-purple-200 hover:bg-purple-200 flex items-center gap-1"><Sparkles size={14} /> Auto RAB</button><button onClick={() => { /* handleAddCCO prop */ }} className="text-xs bg-orange-100 text-orange-700 px-3 py-2 rounded-lg font-bold border border-orange-200">+ CCO</button><button onClick={() => { setSelectedRabItem(null); setModalType('newRAB'); setShowModal(true); }} className="text-xs bg-blue-600 text-white px-3 py-2 rounded-lg font-bold">+ Item</button></div>}</div>
                            <div className="space-y-4 pb-20">
                                {Object.keys(rabGroups).sort().map(category => (
                                    <div key={category} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                                        <div className="bg-slate-50 p-4 font-bold text-sm text-slate-700 border-b flex justify-between"><span>{category}</span></div>
                                        {(!isClientView && rabViewMode === 'internal') && (
                                            <div className="divide-y divide-slate-100">{rabGroups[category].map(item => (<div key={item.id} className={`p-4 text-sm hover:bg-slate-50 ${item.isAddendum ? 'bg-orange-50' : ''}`}><div className="flex justify-between mb-2"><span className="font-bold text-slate-800">{item.name} {item.isAddendum && <span className="text-[9px] bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full ml-2">CCO</span>}</span><span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">{item.progress}%</span></div><div className="flex justify-between text-xs text-slate-500 mb-3"><span>{item.volume} {item.unit} x {formatRupiah(item.unitPrice)}</span><span className="font-bold text-slate-700">{formatRupiah(item.volume * item.unitPrice)}</span></div><div className="w-full bg-gray-200 rounded-full h-2 mb-3"><div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${item.progress}%` }}></div></div>{canEditProject && (<div className="flex justify-end gap-2"><button onClick={() => { setSelectedRabItem(item); setProgressInput(item.progress); setProgressDate(new Date().toISOString().split('T')[0]); setModalType('updateProgress'); setShowModal(true); }} className="text-xs bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg font-bold">Update Fisik</button><button onClick={() => { setSelectedRabItem(item); setModalType('taskHistory'); setShowModal(true); }} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg"><History size={14} /></button><button onClick={() => prepareEditRABItem(item)} className="text-xs bg-yellow-100 text-yellow-600 px-3 py-1.5 rounded-lg"><Edit size={14} /></button><button onClick={() => deleteRABItem(item.id)} className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-lg"><Trash2 size={14} /></button></div>)}</div>))}</div>
                                        )}
                                        {rabViewMode === 'client' && (
                                            <div className="divide-y divide-slate-100">{rabGroups[category].map(item => (<div key={item.id} className="p-4 text-sm flex justify-between items-center hover:bg-slate-50"><div><div className="font-bold text-slate-800">{item.name}</div><div className="text-xs text-slate-500">Vol: {item.volume} {item.unit}</div></div><div className="text-right"><div className={`text-xs px-3 py-1 rounded-full font-bold ${item.progress === 100 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{item.progress}%</div></div></div>))}<div className="p-4 bg-slate-50 text-right text-xs font-bold text-slate-700 border-t">Subtotal: {formatRupiah(rabGroups[category].reduce((a, b) => a + (b.volume * b.unitPrice), 0))}</div></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'finance' && canAccessFinance && (
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white p-6 rounded-2xl border shadow-sm mb-6">
                        <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-xl">
                            <button onClick={() => setTxType('expense')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${txType === 'expense' ? 'bg-white shadow text-red-600' : 'text-slate-500'}`}>Pengeluaran</button>
                            <button onClick={() => setTxType('income')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${txType === 'income' ? 'bg-white shadow text-green-600' : 'text-slate-500'}`}>Pemasukan</button>
                        </div>
                        <form onSubmit={handleTransaction} className="space-y-4">
                            <select name="cat" className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-white outline-none">
                                {txType === 'expense' ? <><option>Material</option><option>Upah Tukang</option><option>Operasional</option></> : <option>Termin/DP</option>}
                            </select>
                            <input required name="desc" placeholder="Keterangan" className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none" />
                            <NumberInput className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold outline-none" placeholder="Nominal" value={amount} onChange={setAmount} />
                            <button className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold shadow-lg">Simpan</button>
                        </form>
                    </div>
                    <div className="space-y-3">
                        {getGroupedTransactions(activeProject.transactions).map((group: GroupedTransaction) => (
                            <TransactionGroup key={group.id} group={group} isExpanded={expandedGroups[group.id]} onToggle={() => toggleGroup(group.id)} />
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'workers' && canAccessWorkers && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <button onClick={() => openModal('attendance')} className="w-full bg-blue-600 text-white p-4 rounded-2xl shadow-lg font-bold mb-6">Isi Absensi</button>
                        <div className="bg-white p-6 rounded-2xl border shadow-sm">
                            <h3 className="font-bold text-slate-700 mb-4">Rekap & Filter</h3>
                            <div className="flex gap-2 mb-4 bg-slate-50 p-2 rounded-xl border">
                                <div className="flex-1"><label className="text-[10px] block font-bold">Dari</label><input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="w-full bg-white border rounded p-1 text-xs" /></div>
                                <div className="flex-1"><label className="text-[10px] block font-bold">Sampai</label><input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="w-full bg-white border rounded p-1 text-xs" /></div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b"><th className="p-3 text-left">Nama</th><th className="p-3 text-center">Hadir</th><th className="p-3 text-center">Lembur</th>{canSeeMoney && <th className="p-3 text-right">Upah</th>}</tr>
                                    </thead>
                                    <tbody>
                                        {getAttendanceSummary().map((stat: any, idx: number) => (
                                            <tr key={idx} className="border-b"><td className="p-3 font-medium">{stat.name}</td><td className="p-3 text-center text-green-600">{stat.hadir}</td><td className="p-3 text-center text-blue-600">{stat.lembur}</td>{canSeeMoney && <td className="p-3 text-right font-bold">{formatRupiah(stat.totalCost)}</td>}</tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg text-slate-700">Tim</h3><button onClick={() => openModal('newWorker')} className="bg-white border px-4 py-2 rounded-xl text-sm font-bold shadow-sm">+ Baru</button></div>
                        <div className="space-y-3">
                            {(activeProject.workers || []).map(w => {
                                const f = calculateWorkerFinancials(activeProject, w.id);
                                return (
                                    <div key={w.id} className="bg-white p-5 rounded-2xl border shadow-sm text-sm">
                                        <div className="flex justify-between items-start mb-3 border-b pb-3">
                                            <div><p className="font-bold text-base">{w.name}</p><p className="text-xs bg-slate-100 px-2 py-0.5 rounded inline-block mt-1">{w.role} ({w.wageUnit})</p></div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            {canSeeMoney && <div><p className="text-[10px] text-slate-500 uppercase">Sisa Hutang</p><p className="font-bold text-lg">{formatRupiah(f.balance)}</p></div>}
                                            <div className="flex gap-2 ml-auto">
                                                {canSeeMoney && f.balance > 0 && <button onClick={() => { setSelectedWorkerId(w.id); setPaymentAmount(f.balance); openModal('payWorker'); }} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold"><Banknote size={14} /> Bayar</button>}
                                                {canAccessWorkers && (<><button onClick={() => handleEditWorker(w)} className="bg-blue-50 text-blue-600 p-2 rounded-lg"><Edit size={16} /></button><button onClick={() => handleDeleteWorker(w)} className="bg-red-50 text-red-600 p-2 rounded-lg"><Trash2 size={16} /></button></>)}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="bg-white p-6 rounded-2xl border shadow-sm mt-6">
                            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><ImageIcon size={20} /> Galeri Bukti</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {getFilteredEvidence().map((ev: any) => (
                                    <div key={ev.id} className="relative rounded-xl overflow-hidden border">
                                        <img src={ev.photoUrl} alt="Bukti" className="w-full h-32 object-cover" />
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-white">
                                            <div className="text-xs font-bold">{new Date(ev.date).toLocaleDateString('id-ID')}</div>
                                            {ev.location && <a href={`https://www.google.com/maps/search/?api=1&query=${ev.location}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-blue-300"><ExternalLink size={10} /> Peta</a>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'logistics' && (
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-xl text-slate-700">Stok Material</h3><button onClick={() => openModal('newMaterial')} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold shadow-md">+ Material Baru</button></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(activeProject.materials || []).map(m => (
                            <div key={m.id} className="bg-white p-5 rounded-2xl border shadow-sm relative overflow-hidden">
                                {m.stock <= m.minStock && <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] px-3 py-1 rounded-bl-xl font-bold shadow-sm">STOK MENIPIS</div>}
                                <div className="flex justify-between items-start mb-4">
                                    <div><div className="font-bold text-slate-800 text-lg mb-1">{m.name}</div><div className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded inline-block">Min: {m.minStock} {m.unit}</div></div>
                                    <div className="text-right"><div className={`text-2xl font-bold ${m.stock <= m.minStock ? 'text-red-600' : 'text-blue-600'}`}>{m.stock}</div><div className="text-xs text-slate-400">{m.unit}</div></div>
                                </div>
                                <div className="flex gap-2 border-t pt-3">
                                    <button onClick={() => { setSelectedMaterial(m); openModal('stockMovement'); }} className="flex-1 py-2 bg-slate-50 text-slate-700 text-xs font-bold rounded-lg border hover:bg-slate-50 transition-colors"><Edit size={14} /> Update Stok</button>
                                    <button onClick={() => { setSelectedMaterial(m); openModal('stockHistory'); }} className="px-3 py-2 bg-white text-slate-500 rounded-lg border hover:bg-slate-50 shadow-sm"><History size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'gallery' && (
                <ProjectGallery
                    project={activeProject}
                    updateProject={updateProject}
                    canEdit={!isClientView && (canEditProject || canAccessWorkers)}
                />
            )}
        </div>
    );
};

export default ProjectDetailView;
