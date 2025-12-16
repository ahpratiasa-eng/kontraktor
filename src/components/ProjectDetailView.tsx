import React, { useState, useMemo } from 'react';
import {
    Settings, FileText, Sparkles, History, Edit, Trash2, Banknote, Calendar, TrendingUp,
    ImageIcon, ExternalLink, Upload, Lock, AlertTriangle, ShoppingCart, Users, Package, ChevronDown, Plus, CheckCircle
} from 'lucide-react';
import { NumberInput } from './UIComponents';
import SCurveChart from './SCurveChart';
import {
    formatRupiah, getStats, getMonthlyGroupedTransactions, formatNumber,
    calculateWorkerFinancials, calculateProjectHealth
} from '../utils/helpers';
import type { Project, RABItem, Worker, Material, AHSItem } from '../types';
import ProjectGallery from './ProjectGallery';
import PayrollSummary from './PayrollSummary';
import { generateDailyReport } from '../utils/pdfGenerator';
import type { UserRole } from '../types';

interface ProjectDetailViewProps {
    activeProject: Project;
    activeTab: string;
    // ... existing props ...
    userRole: UserRole | null;
    setView: (view: any) => void;
    updateProject: (data: Partial<Project>) => void;
    // ... existing props ...
    openModal: (type: string) => void;
    setModalType: (type: string) => void;
    setShowModal: (show: boolean) => void;
    setSelectedRabItem: (item: RABItem | null) => void;
    setProgressInput: (val: number) => void;
    setProgressDate: (date: string) => void;
    setSelectedWorkerId: (id: number | null) => void;
    setPaymentAmount: (amount: number) => void;
    setSelectedMaterial: (m: Material | null) => void;
    // ... existing props ...
    deleteRABItem: (id: number) => void;
    handleEditWorker: (w: Worker) => void;
    handleDeleteWorker: (w: Worker) => void;
    handleDeleteMaterial: (id: number) => void;
    handlePrepareEditMaterial: (m: Material) => void;
    handleReportToOwner: () => void;
    // ... existing props ...
    canAccessFinance: boolean;
    canAccessWorkers: boolean;
    canSeeMoney: boolean;
    canEditProject: boolean;
    // ... existing props ...
    canViewKurvaS?: boolean;            // Pengawas tidak bisa lihat Kurva S
    canViewInternalRAB?: boolean;       // Pengawas tidak bisa lihat detail RAB internal
    canAddWorkers?: boolean;            // Pengawas tidak bisa tambah tukang sendiri
    setActiveTab: (tab: string) => void;
    prepareEditProject: () => void;
    prepareEditRABItem: (item: RABItem) => void;
    prepareEditSchedule: (item: RABItem) => void;
    isClientView?: boolean;
    ahsItems: AHSItem[];
}

const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
    activeProject, activeTab, updateProject, setView,
    openModal, setModalType, setShowModal, setSelectedRabItem, setProgressInput, setProgressDate,
    setSelectedWorkerId, setPaymentAmount, setSelectedMaterial,
    deleteRABItem, handleEditWorker, handleDeleteWorker,
    handleDeleteMaterial, handlePrepareEditMaterial,
    canAccessFinance, canAccessWorkers, canSeeMoney, canEditProject,
    canViewKurvaS = true, canViewInternalRAB = true, canAddWorkers = true, // Defaults for backward compat
    setActiveTab, prepareEditProject, prepareEditRABItem, prepareEditSchedule, isClientView, handleReportToOwner,
    ahsItems
}) => {
    // Local State moved from App.tsx
    const [rabViewMode, setRabViewMode] = useState<'internal' | 'client'>('client');
    const [logisticsTab, setLogisticsTab] = useState<'stock' | 'recap'>('stock');
    const [financeMonthTab, setFinanceMonthTab] = useState<string>(''); // '' means latest or all
    const [financeTab, setFinanceTab] = useState<'transactions' | 'payroll'>('transactions');

    // Enforce Client View Mode
    React.useEffect(() => {
        if (isClientView) setRabViewMode('client');
    }, [isClientView]);
    const [txType, setTxType] = useState<'expense' | 'income'>('expense');
    const [amount, setAmount] = useState(0);
    const [filterStartDate, setFilterStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterEndDate, setFilterEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [showAllGantt, setShowAllGantt] = useState(false);
    const [weather, setWeather] = useState<any>(null);
    const [workerSubTab, setWorkerSubTab] = useState<'attendance' | 'list' | 'evidence'>('attendance');
    const [reorderItems, setReorderItems] = useState<number[]>([]);
    const [showReorderModal, setShowReorderModal] = useState(false);

    // Daily Report PDF Export State
    const [showDailyReportModal, setShowDailyReportModal] = useState(false);
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportNote, setReportNote] = useState('');

    React.useEffect(() => {
        if (!activeProject.location) return;
        const fetchWeather = async () => {
            try {
                const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(activeProject.location)}&count=1&language=id&format=json`);
                const geoData = await geoRes.json();
                if (!geoData.results?.[0]) return;
                const { latitude, longitude, name } = geoData.results[0];
                const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`);
                const weatherData = await weatherRes.json();

                setWeather({
                    temp: weatherData.current.temperature_2m,
                    humidity: weatherData.current.relative_humidity_2m,
                    wind: weatherData.current.wind_speed_10m,
                    code: weatherData.current.weather_code,
                    city: name,
                    daily: weatherData.daily
                });
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

    const isSafeToCast = (code: number, precipProb: number) => {
        // Aman jika tidak hujan (code < 50) dan probabilitas hujan < 40%
        if (code < 50 && precipProb < 40) return { status: 'Aman', color: 'text-green-500', bg: 'bg-green-100' };
        if (code < 60 && precipProb < 70) return { status: 'Waspada', color: 'text-yellow-600', bg: 'bg-yellow-100' };
        return { status: 'Tunda Cor', color: 'text-red-500', bg: 'bg-red-100' };
    };

    // Derived Values & Local Handlers
    const rabGroups = (() => {
        if (!activeProject.rabItems) return {};
        const groups: { [key: string]: RABItem[] } = {};
        activeProject.rabItems.forEach(item => { if (!groups[item.category]) groups[item.category] = []; groups[item.category].push(item); });
        return groups;
    })();



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

    const recapData = useMemo(() => {
        const recap: Record<string, {
            name: string;
            unit: string;
            type: string;
            totalCoefficient: number;
            items: string[];
        }> = {};

        activeProject.rabItems.forEach(rab => {
            let ahs = ahsItems.find(a => a.id === rab.ahsItemId);
            // Fallback match by Name if imported/generated
            if (!ahs) ahs = ahsItems.find(a => a.name.trim().toLowerCase() === rab.name.trim().toLowerCase());

            if (!ahs) return;

            ahs.components.forEach(comp => {
                const totalNeed = comp.coefficient * rab.volume;
                const key = `${comp.name.toLowerCase()}_${comp.unit.toLowerCase()}`;

                if (!recap[key]) {
                    recap[key] = {
                        name: comp.name,
                        unit: comp.unit,
                        type: comp.type,
                        totalCoefficient: 0,
                        items: []
                    };
                }

                recap[key].totalCoefficient += totalNeed;
                if (!recap[key].items.includes(rab.name)) {
                    recap[key].items.push(rab.name);
                }
            });
        });

        return Object.values(recap).sort((a, b) => {
            const typeOrder = { 'bahan': 1, 'alat': 2, 'upah': 3 };
            const ta = typeOrder[a.type as keyof typeof typeOrder] || 99;
            const tb = typeOrder[b.type as keyof typeof typeOrder] || 99;
            if (ta !== tb) return ta - tb;
            return a.name.localeCompare(b.name);
        });
    }, [activeProject.rabItems, ahsItems]);

    const tabs = [
        { id: 'dashboard', label: 'Ringkasan', icon: <FileText size={18} /> },
        // Pengawas tidak bisa lihat Kurva S (mencegah manipulasi data)
        ...(canViewKurvaS ? [{ id: 'progress', label: 'Kurva S & RAB', icon: <Sparkles size={18} /> }] : []),
        ...(!isClientView && canAccessFinance ? [{ id: 'finance', label: 'Keuangan', icon: <Banknote size={18} /> }] : []),
        ...(!isClientView && canAccessWorkers ? [{ id: 'workers', label: 'Tim & Absensi', icon: <ImageIcon size={18} /> }] : []),
        ...(!isClientView ? [{ id: 'logistics', label: 'Logistik', icon: <History size={18} /> }] : []),
        { id: 'gallery', label: 'Galeri', icon: <ImageIcon size={18} /> },
    ];

    return (
        <div className="space-y-6 w-full max-w-full overflow-x-hidden pt-1">
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
            {/* RAB View Mode Toggle - Pengawas tidak bisa lihat Internal RAB */}
            {activeTab === 'progress' && !isClientView && canViewInternalRAB && (
                <div className="flex items-center gap-2 mb-4 bg-slate-200 p-1 rounded-lg w-full md:w-auto md:inline-flex">
                    <button onClick={() => setRabViewMode('client')} className={`flex-1 md:flex-none px-4 text-xs font-bold py-2 rounded-md transition ${rabViewMode === 'client' ? 'bg-white text-blue-600 shadow' : 'text-slate-500'}`}>View Client</button>
                    <button onClick={() => setRabViewMode('internal')} className={`flex-1 md:flex-none px-4 text-xs font-bold py-2 rounded-md transition ${rabViewMode === 'internal' ? 'bg-white text-blue-600 shadow' : 'text-slate-500'}`}>Internal RAB</button>
                </div>
            )}

            {activeTab === 'dashboard' && (
                <div className="pb-20">
                    {/* Hero Section */}
                    <div className="relative min-h-[320px] rounded-3xl overflow-hidden shadow-lg mb-6 group">
                        <img
                            src={activeProject.heroImage || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1000&q=80"}
                            alt="Project Hero"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6">
                            <div className="flex justify-between items-end">
                                <div>
                                    <span className="inline-flex items-center gap-1 bg-green-500 text-white text-[10px] px-2 py-1 rounded-full w-fit font-bold mb-2">
                                        <Sparkles size={10} /> On Schedule
                                    </span>
                                    <div className="flex items-center gap-1 text-white/80 text-xs mb-1">
                                        <AlertTriangle size={12} className="text-white" /> LOKASI PROYEK
                                    </div>
                                    <h2 className="text-2xl font-bold text-white leading-tight mb-2 max-w-lg">{activeProject.name}</h2>

                                    <div className="flex items-center gap-4 text-white text-xs font-medium mb-4">
                                        <div className="flex items-center gap-1">
                                            {weather ? getWeatherIcon(weather.code) : '☀️'} {weather ? `${weather.temp}°C, ${getWeatherDesc(weather.code)}` : 'Memuat...'}
                                        </div>
                                        <div className="w-1 h-1 bg-white rounded-full"></div>
                                        <div>Minggu ke-{Math.ceil((new Date().getTime() - new Date(activeProject.startDate).getTime()) / (1000 * 60 * 60 * 24 * 7))}</div>
                                    </div>
                                </div>

                                {/* Weather Forecast Cards */}
                                {weather && weather.daily && (
                                    <div className="hidden md:flex gap-2">
                                        {[0, 1, 2].map(i => {
                                            const date = new Date();
                                            date.setDate(date.getDate() + i);
                                            const dayName = i === 0 ? 'Hari Ini' : date.toLocaleDateString('id-ID', { weekday: 'short' });
                                            const code = weather.daily.weather_code[i];
                                            const prob = weather.daily.precipitation_probability_max[i];
                                            const safety = isSafeToCast(code, prob);

                                            return (
                                                <div key={i} className="flex flex-col items-center bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-xl w-20 text-center shadow-lg transition hover:bg-white/20">
                                                    <span className="text-[10px] font-bold text-white/80 mb-1">{dayName}</span>
                                                    <span className="text-xl mb-1 filter drop-shadow-md">{getWeatherIcon(code)}</span>
                                                    <span className="text-[10px] font-medium text-white">{Math.round(weather.daily.temperature_2m_max[i])}°C</span>
                                                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold mt-1 ${safety.bg} ${safety.color}`}>{safety.status}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Mobile Forecast (Vertical Stack below title on mobile) */}
                            {weather && weather.daily && (
                                <div className="md:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-hide pt-2 border-t border-white/10 mt-2">
                                    {[0, 1, 2].map(i => {
                                        const date = new Date();
                                        date.setDate(date.getDate() + i);
                                        const dayName = i === 0 ? 'Hari Ini' : date.toLocaleDateString('id-ID', { weekday: 'short' });
                                        const code = weather.daily.weather_code[i];
                                        const prob = weather.daily.precipitation_probability_max[i];
                                        const safety = isSafeToCast(code, prob);

                                        return (
                                            <div key={i} className="flex flex-col items-center bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-xl min-w-[70px] text-center">
                                                <span className="text-[10px] font-bold text-white/80 mb-1">{dayName}</span>
                                                <span className="text-lg mb-1">{getWeatherIcon(code)}</span>
                                                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold mt-1 ${safety.bg} ${safety.color}`}>{safety.status}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {!isClientView && (
                            <>
                                <button
                                    onClick={handleReportToOwner}
                                    className="bg-green-600 text-white p-3 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
                                >
                                    <FileText size={18} /> Lapor via WA
                                </button>
                                <button
                                    onClick={() => setView('report-view')}
                                    className="bg-blue-600 text-white p-3 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
                                >
                                    <FileText size={18} /> Laporan Detail
                                </button>
                                <button
                                    onClick={() => setShowDailyReportModal(true)}
                                    className="bg-orange-600 text-white p-3 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
                                >
                                    <FileText size={18} /> Export PDF
                                </button>
                                <button
                                    onClick={() => {
                                        const url = `${window.location.origin}?projectId=${activeProject.id}&mode=client`;
                                        navigator.clipboard.writeText(url);
                                        alert(`Link Portal Klien berhasil disalin!\n\nKirim link ini ke pemilik proyek via WhatsApp:\n${url}`);
                                    }}
                                    className="bg-purple-600 text-white p-3 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
                                >
                                    <ExternalLink size={18} /> Portal Klien
                                </button>
                                {canEditProject && (
                                    <button
                                        onClick={prepareEditProject}
                                        className="bg-white text-slate-700 border border-slate-200 p-3 rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
                                    >
                                        <Settings size={18} /> Pengaturan
                                    </button>
                                )}
                            </>
                        )}
                        {isClientView && (
                            <button
                                onClick={() => setView('report-view')}
                                className="col-span-2 bg-blue-600 text-white p-3 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
                            >
                                <FileText size={18} /> Lihat Laporan Detail
                            </button>
                        )}
                    </div>

                    {/* Progress Summary Card */}
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-6 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">Progress & Kurva-S</h3>
                                <p className="text-xs text-slate-400">Realisasi vs Rencana</p>
                            </div>
                            <button onClick={() => setActiveTab('progress')} className="bg-slate-50 p-2 rounded-lg text-slate-400 hover:text-blue-600">
                                <ExternalLink size={18} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-4xl font-bold text-slate-800">{getStats(activeProject).prog.toFixed(0)}%</span>
                                <div className="flex gap-3 text-xs font-bold mb-1">
                                    <span className="flex items-center gap-1 text-blue-600"><div className="w-2 h-2 rounded-full bg-blue-600"></div> Realisasi</span>
                                    <span className="flex items-center gap-1 text-slate-400"><div className="w-2 h-2 rounded-full bg-slate-300"></div> Rencana</span>
                                </div>
                            </div>
                            <div className="inline-block bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold">
                                +{((getStats(activeProject).prog - (calculateProjectHealth(activeProject).planProgress || 0))).toFixed(1)}% Ahead
                            </div>
                        </div>

                        {/* Mini SCurve */}
                        <div className="w-full">
                            <SCurveChart stats={getStats(activeProject)} project={activeProject} compact={true} />
                        </div>
                    </div>

                    {/* Summary Cards Grid - Hide on Client View (already has bottom nav) */}
                    {!isClientView && (
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div
                                onClick={() => setActiveTab('finance')}
                                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2 cursor-pointer active:scale-95 transition-transform"
                            >
                                <div className="p-2 bg-orange-50 rounded-lg w-fit text-orange-600"><Banknote size={20} /></div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">Keuangan & RAB</h4>
                                    <p className="text-xs text-slate-400">Sisa: Rp {formatNumber(Math.max(0, activeProject.budgetLimit - (getStats(activeProject).exp || 0)))}</p>
                                    <div className="w-full bg-slate-100 h-1 mt-2 rounded-full overflow-hidden">
                                        <div className="bg-orange-500 h-full w-1/2"></div>
                                    </div>
                                </div>
                            </div>
                            <div
                                onClick={() => setActiveTab('workers')}
                                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2 cursor-pointer active:scale-95 transition-transform"
                            >
                                <div className="p-2 bg-blue-50 rounded-lg w-fit text-blue-600"><Users size={20} /></div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">Tim & Absensi</h4>
                                    <p className="text-xs text-slate-400">{activeProject.workers?.length || 0} Pekerja Aktif</p>
                                    <div className="flex -space-x-2 mt-2">
                                        {(activeProject.workers || []).slice(0, 3).map(w => (
                                            <div key={w.id} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-600">
                                                {w.name.charAt(0)}
                                            </div>
                                        ))}
                                        {(activeProject.workers?.length || 0) > 3 && (
                                            <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] text-slate-400">
                                                +{(activeProject.workers?.length || 0) - 3}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div
                                onClick={() => setActiveTab('logistics')}
                                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2 cursor-pointer active:scale-95 transition-transform"
                            >
                                <div className="p-2 bg-purple-50 rounded-lg w-fit text-purple-600"><Package size={20} /></div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">Logistik</h4>
                                    <p className="text-xs text-slate-400">{(activeProject.materials || []).length} Item Stock</p>
                                </div>
                            </div>
                            <div
                                onClick={() => setActiveTab('gallery')}
                                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2 cursor-pointer active:scale-95 transition-transform"
                            >
                                <div className="p-2 bg-slate-50 rounded-lg w-fit text-slate-600"><ImageIcon size={20} /></div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">Galeri Proyek</h4>
                                    <p className="text-xs text-slate-400">Update foto terbaru</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'progress' && (
                <div className="space-y-6 pb-24">
                    {/* Gantt Chart Section */}
                    {canViewInternalRAB && (
                        <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
                                <h3 className="font-bold text-base md:text-lg text-slate-700 flex items-center gap-2"><History size={20} /> Timeline Pekerjaan</h3>
                                {!isClientView && (
                                    <div className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold">
                                        Tips: Klik baris item untuk atur jadwal (Start/End Date)
                                    </div>
                                )}
                            </div>

                            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 pb-2">
                                <div className="min-w-[600px] md:min-w-full">
                                    <div className="flex border-b border-slate-100 pb-2 mb-2 sticky top-0 bg-white z-10">
                                        <div className="w-1/3 md:w-1/4 font-bold text-xs text-slate-500 shrink-0">Item Pekerjaan</div>
                                        <div className="w-2/3 md:w-3/4 flex relative h-6">
                                            {[...Array(8)].map((_, i) => (
                                                <div key={i} className="flex-1 border-l border-slate-100 text-[9px] text-slate-400 pl-0.5 whitespace-nowrap">
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
                                                startOffset = Math.min((idx * 15), 80);
                                                width = 15;
                                            }

                                            // Safety Clamps
                                            if (startOffset < 0) startOffset = 0;
                                            if (startOffset > 100) startOffset = 100;
                                            if (width < 5) width = 5;
                                            if (startOffset + width > 100) width = 100 - startOffset;

                                            return (
                                                <div
                                                    key={item.id}
                                                    onClick={() => !isClientView && prepareEditSchedule(item)}
                                                    className={`flex items-center rounded-lg p-1 transition-colors ${!isClientView ? 'cursor-pointer hover:bg-blue-50 group' : ''}`}
                                                >
                                                    <div className="w-1/3 md:w-1/4 text-xs font-medium truncate pr-2 shrink-0">{item.name}</div>
                                                    <div className="w-2/3 md:w-3/4 relative h-6 bg-slate-50 rounded-full overflow-hidden">
                                                        {/* Plan Bar (Lighter) */}
                                                        <div
                                                            className={`absolute top-1 bottom-1 rounded-full opacity-30 ${['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500'][idx % 4]}`}
                                                            style={{ left: `${startOffset}%`, width: `${width}%` }}
                                                        />
                                                        {/* Progress/Realization Bar (Darker & Animated) */}
                                                        <div
                                                            className={`absolute top-1 bottom-1 rounded-full ${['bg-blue-600', 'bg-green-600', 'bg-orange-600', 'bg-purple-600'][idx % 4]}`}
                                                            style={{
                                                                left: `${startOffset}%`,
                                                                width: `${width * (item.progress / 100)}%`
                                                            }}
                                                        >
                                                            {width * (item.progress / 100) > 10 && (
                                                                <span className="text-[8px] text-white px-1 font-bold flex items-center h-full overflow-hidden whitespace-nowrap">
                                                                    {item.progress}%
                                                                </span>
                                                            )}
                                                        </div>
                                                        {/* If progress is 0 or very small, show label outside or just on hover? For now keep simple. */}
                                                        {!isClientView && (
                                                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] font-bold text-slate-500 bg-white/80 transition-opacity">
                                                                Atur Jadwal
                                                            </div>
                                                        )}
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
                    )}

                    {/* Mobile Progress Summary for Client View */}
                    {isClientView && (
                        <div className="md:hidden bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-base text-slate-700 mb-3 flex items-center gap-2">
                                <History size={18} /> Progress Pekerjaan
                            </h3>
                            <div className="space-y-3">
                                {activeProject.rabItems.slice(0, 5).map((item, idx) => (
                                    <div key={item.id} className="flex items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-slate-700 truncate">{item.name}</div>
                                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                                <div
                                                    className={`h-2 rounded-full transition-all ${['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500'][idx % 4]}`}
                                                    style={{ width: `${item.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${item.progress === 100 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {item.progress}%
                                        </span>
                                    </div>
                                ))}
                                {activeProject.rabItems.length > 5 && (
                                    <div className="text-center text-xs text-slate-400 pt-2 border-t">
                                        +{activeProject.rabItems.length - 5} item lainnya
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-24">
                        <div className="lg:col-span-3">
                            <SCurveChart stats={getStats(activeProject)} project={activeProject} />
                        </div>
                        <div className="lg:col-span-3">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 px-1">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-700">Rincian Pekerjaan (RAB)</h3>
                                    <p className="text-xs text-slate-400">Update progres pekerjaan di sini.</p>
                                </div>
                                {!isClientView && canEditProject && (
                                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                        <button onClick={() => { setSelectedRabItem(null); openModal('newRAB'); }} className="flex-1 sm:flex-none text-xs bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-md active:scale-95 transition-transform flex items-center justify-center gap-1">
                                            <Plus size={16} /> Item Baru
                                        </button>
                                        <button onClick={() => { setModalType('importRAB'); setShowModal(true); }} className="text-xs bg-white text-slate-600 px-3 py-2.5 rounded-xl font-bold border shadow-sm hover:bg-slate-50 flex items-center gap-1"><Upload size={14} /></button>
                                        <button onClick={() => { setModalType('aiRAB'); setShowModal(true); }} className="text-xs bg-purple-50 text-purple-600 px-3 py-2.5 rounded-xl font-bold border border-purple-100 hover:bg-purple-100 flex items-center gap-1"><Sparkles size={14} /></button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6">
                                {Object.keys(rabGroups).sort().map(category => (
                                    <div key={category} className="bg-white rounded-3xl border shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] overflow-hidden">
                                        <div className="bg-slate-50/80 p-4 border-b flex justify-between items-center backdrop-blur-sm sticky top-0 z-10">
                                            <span className="font-bold text-slate-700 text-sm uppercase tracking-wide">{category}</span>
                                            <span className="text-[10px] font-bold bg-white px-2 py-1 rounded-lg text-slate-400 border shadow-sm">
                                                {rabGroups[category].length} Item
                                            </span>
                                        </div>

                                        {(!isClientView && rabViewMode === 'internal') && (
                                            <div className="divide-y divide-slate-100">
                                                {rabGroups[category].map(item => (
                                                    <div key={item.id} className={`p-4 hover:bg-slate-50 transition-colors ${item.isAddendum ? 'bg-orange-50/50' : ''}`}>
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="flex-1 pr-2">
                                                                <div className="font-bold text-slate-800 text-sm mb-1 leading-snug">
                                                                    {item.name}
                                                                    {item.isAddendum && <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded ml-1 align-middle font-bold border border-orange-200">CCO</span>}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">Vol: {item.volume} {item.unit}</span>
                                                                    <span>x</span>
                                                                    <span className="font-mono">{formatRupiah(item.unitPrice)}</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-right flex flex-col items-end">
                                                                <div className="font-bold text-slate-700 text-sm mb-1">{formatRupiah(item.volume * item.unitPrice)}</div>
                                                                {item.priceLockedAt && <Lock size={10} className="text-amber-500" />}
                                                            </div>
                                                        </div>

                                                        <div className="mb-4">
                                                            <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5">
                                                                <span>Progress Fisik</span>
                                                                <span className={item.progress === 100 ? 'text-green-600' : 'text-blue-600'}>{item.progress}%</span>
                                                            </div>
                                                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-700 ${item.progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                                                    style={{ width: `${item.progress}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>

                                                        {canEditProject && (
                                                            <div className="flex gap-2 border-t pt-3 border-dashed border-slate-200">
                                                                <button
                                                                    onClick={() => { setSelectedRabItem(item); setProgressInput(item.progress); setProgressDate(new Date().toISOString().split('T')[0]); setModalType('updateProgress'); setShowModal(true); }}
                                                                    className="flex-1 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl active:scale-95 transition-all hover:bg-blue-100"
                                                                >
                                                                    Update
                                                                </button>
                                                                <button onClick={() => { setSelectedRabItem(item); setModalType('taskHistory'); setShowModal(true); }} className="px-3 py-2 bg-slate-50 text-slate-500 rounded-xl active:scale-95 hover:bg-slate-100"><History size={16} /></button>
                                                                <button onClick={() => prepareEditRABItem(item)} className="px-3 py-2 bg-white text-slate-400 border rounded-xl active:scale-95 hover:text-yellow-500 hover:border-yellow-200"><Edit size={16} /></button>
                                                                <button onClick={() => deleteRABItem(item.id)} className="px-3 py-2 bg-white text-slate-400 border rounded-xl active:scale-95 hover:text-red-500 hover:border-red-200"><Trash2 size={16} /></button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {rabViewMode === 'client' && (
                                            <div className="divide-y divide-slate-100">
                                                {rabGroups[category].map(item => (
                                                    <div key={item.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                                                        <div className="min-w-0 flex-1 pr-4">
                                                            <div className="font-bold text-slate-800 text-sm truncate mb-0.5">{item.name}</div>
                                                            <div className="text-[10px] text-slate-400 font-medium bg-slate-50 px-2 py-0.5 rounded w-fit">Vol: {item.volume} {item.unit}</div>
                                                        </div>
                                                        <div className="text-right flex-shrink-0">
                                                            <div className={`text-xs px-3 py-1.5 rounded-lg font-bold border ${item.progress === 100 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                                                {item.progress}%
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="p-4 bg-slate-50 text-right text-xs font-bold text-slate-700 border-t flex justify-between items-center">
                                                    <span className="uppercase text-[10px] text-slate-400 tracking-wider">Subtotal</span>
                                                    <span className="text-sm">{formatRupiah(rabGroups[category].reduce((a, b) => a + (b.volume * b.unitPrice), 0))}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'finance' && canAccessFinance && (
                <div className="max-w-5xl mx-auto pb-24">
                    {/* Sub Navigation */}
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-full md:w-fit mb-6 mx-auto md:mx-0">
                        <button
                            onClick={() => setFinanceTab('transactions')}
                            className={`flex-1 md:flex-none px-4 py-3 text-xs font-bold rounded-xl transition-all shadow-sm ${financeTab === 'transactions' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Transaksi Harian
                        </button>
                        <button
                            onClick={() => setFinanceTab('payroll')}
                            className={`flex-1 md:flex-none px-4 py-3 text-xs font-bold rounded-xl transition-all shadow-sm ${financeTab === 'payroll' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Gaji & Hutang
                        </button>
                    </div>

                    {financeTab === 'transactions' && (
                        <div className="max-w-2xl mx-auto w-full px-1 md:px-0 overflow-hidden">
                            {/* NEW: Total Cash Flow Summary Card (Restored) */}
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-5 md:p-6 rounded-3xl shadow-md mb-6 relative overflow-hidden w-full">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <TrendingUp size={100} />
                                </div>
                                <h3 className="text-slate-300 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-4">Total Arus Kas (Cash Flow)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-6 relative z-10 w-full">
                                    <div className="min-w-0 overflow-hidden">
                                        <p className="text-[10px] md:text-xs text-slate-400 mb-1">Total Pemasukan</p>
                                        <p className="text-lg md:text-xl font-bold text-green-400 break-all whitespace-normal">
                                            + {formatRupiah((activeProject.transactions || []).filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0)).replace(/\u00A0/g, ' ')}
                                        </p>
                                    </div>
                                    <div className="min-w-0 overflow-hidden">
                                        <p className="text-[10px] md:text-xs text-slate-400 mb-1">Total Pengeluaran</p>
                                        <p className="text-lg md:text-xl font-bold text-red-400 break-all whitespace-normal">
                                            - {formatRupiah((activeProject.transactions || []).filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0)).replace(/\u00A0/g, ' ')}
                                        </p>
                                    </div>
                                </div>
                                <div className="border-t border-slate-700 pt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-0 relative z-10 w-full">
                                    <span className="text-xs md:text-sm font-medium text-slate-300">Sisa Kas (Balance)</span>
                                    {(() => {
                                        const inc = (activeProject.transactions || []).filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
                                        const exp = (activeProject.transactions || []).filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
                                        const bal = inc - exp;
                                        return (
                                            <div className="min-w-0 w-full md:w-auto text-left md:text-right overflow-hidden">
                                                <span className={`text-xl md:text-2xl font-black break-all whitespace-normal ${bal >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                                                    {bal >= 0 ? '+' : '-'} {formatRupiah(Math.abs(bal)).replace(/\u00A0/g, ' ')}
                                                </span>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-3xl border shadow-sm mb-6 w-full overflow-hidden">
                                <h3 className="font-bold text-slate-800 mb-4">Catat Transaksi Baru</h3>
                                <div className="flex gap-2 mb-4 bg-slate-50 p-1.5 rounded-2xl border w-full overflow-hidden">
                                    <button onClick={() => setTxType('expense')} className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${txType === 'expense' ? 'bg-white shadow text-red-600' : 'text-slate-400'}`}>Pengeluaran</button>
                                    <button onClick={() => setTxType('income')} className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${txType === 'income' ? 'bg-white shadow text-green-600' : 'text-slate-400'}`}>Pemasukan</button>
                                </div>
                                <form onSubmit={handleTransaction} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 ml-2">Kategori</label>
                                        <div className="relative">
                                            <select name="cat" className="w-full p-4 bg-slate-50 border-0 rounded-2xl text-sm font-bold text-slate-700 outline-none appearance-none">
                                                {txType === 'expense' ? <><option>Material</option><option>Upah Tukang</option><option>Operasional</option></> : <option>Termin/DP</option>}
                                            </select>
                                            <div className="absolute right-4 top-4 text-slate-400 pointer-events-none"><ChevronDown size={16} /></div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 ml-2">Keterangan</label>
                                        <input required name="desc" placeholder="Contoh: Beli Semen 50 Sak" className="w-full p-4 bg-slate-50 border-0 rounded-2xl text-sm font-bold text-slate-700 outline-none placeholder:font-normal" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 ml-2">Nominal (Rp)</label>
                                        <NumberInput className="w-full p-4 bg-slate-50 border-0 rounded-2xl text-lg font-bold text-slate-800 outline-none" placeholder="0" value={amount} onChange={setAmount} />
                                    </div>
                                    <button className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                                        <Banknote size={20} /> Simpan Transaksi
                                    </button>
                                </form>
                            </div>

                            <div className="space-y-6 pb-20 w-full overflow-hidden">
                                <h3 className="font-bold text-slate-700 px-2">Riwayat Transaksi</h3>

                                {/* MONTHLY TABS LOGIC */}
                                {(() => {
                                    const groups = getMonthlyGroupedTransactions(activeProject.transactions || []);

                                    if (groups.length === 0) return (
                                        <div className="text-center py-12 text-slate-400 border-2 border-dashed rounded-3xl bg-slate-50/50">
                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                                                <History size={24} />
                                            </div>
                                            <p className="text-sm font-bold">Belum ada transaksi</p>
                                        </div>
                                    );

                                    // Determine active tab
                                    const activeKey = financeMonthTab || groups[0].monthLabel;

                                    // Extract unique years and selected year state
                                    // We'll infer the displayed year from the active tab or default to the latest
                                    const availableYears = Array.from(new Set(groups.map(g => g.monthLabel.split(' ')[1]))).sort().reverse();

                                    // Find which year the active tab belongs to
                                    const activeGroupRaw = groups.find(g => g.monthLabel === activeKey) || groups[0];
                                    const currentYear = activeGroupRaw.monthLabel.split(' ')[1];

                                    // Filter groups by the current year to show in tabs
                                    const filteredGroups = groups.filter(g => g.monthLabel.endsWith(currentYear));

                                    const activeGroup = groups.find(g => g.monthLabel === activeKey) || groups[0];

                                    return (
                                        <>
                                            {/* Year Filter & Tabs Container */}
                                            <div className="flex flex-col gap-3">
                                                {/* Year Selector (Only show if multiple years exist) */}
                                                {availableYears.length > 1 && (
                                                    <div className="flex justify-end px-2">
                                                        <div className="bg-slate-100 p-1 rounded-lg flex gap-1">
                                                            {availableYears.map(year => (
                                                                <button
                                                                    key={year}
                                                                    onClick={() => {
                                                                        // Switch to the first month of this year
                                                                        const firstMonthOfYear = groups.find(g => g.monthLabel.endsWith(year));
                                                                        if (firstMonthOfYear) setFinanceMonthTab(firstMonthOfYear.monthLabel);
                                                                    }}
                                                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${currentYear === year
                                                                        ? 'bg-white text-slate-800 shadow-sm'
                                                                        : 'text-slate-400 hover:text-slate-600'
                                                                        }`}
                                                                >
                                                                    {year}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Horizontal Scrollable Tabs (Filtered by Year) */}
                                                <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar snap-x px-2 w-full max-w-full">
                                                    {filteredGroups.map((g) => (
                                                        <button
                                                            key={g.monthLabel}
                                                            onClick={() => setFinanceMonthTab(g.monthLabel)}
                                                            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border snap-start whitespace-nowrap ${activeKey === g.monthLabel
                                                                ? 'bg-slate-800 text-white border-slate-800 shadow-md'
                                                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                                                }`}
                                                        >
                                                            {/* Show only Month Name (remove Year) for cleaner tabs */}
                                                            {g.monthLabel.split(' ')[0]}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Active Month Content */}
                                            <div className="bg-white rounded-3xl border shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 w-full max-w-full">
                                                <div className="bg-slate-50 p-4 border-b flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <div className="bg-white p-2 rounded-xl border shadow-sm text-slate-500"><Calendar size={18} /></div>
                                                        <span className="font-bold text-slate-700 text-sm md:text-base">{activeGroup.monthLabel}</span>
                                                    </div>
                                                    <div className="text-right text-[10px] md:text-xs">
                                                        <span className="text-green-600 block font-bold mb-0.5">+ {formatRupiah(activeGroup.totalIncome)}</span>
                                                        <span className="text-red-500 block font-bold">- {formatRupiah(activeGroup.totalExpense)}</span>
                                                    </div>
                                                </div>

                                                <div className="p-2 md:p-4 space-y-6 relative">
                                                    {activeGroup.days.map((day, dIdx) => (
                                                        <div key={day.date} className="relative">
                                                            {dIdx !== activeGroup.days.length - 1 && (
                                                                <div className="absolute left-[19px] top-8 bottom-[-24px] w-0.5 bg-slate-100"></div>
                                                            )}
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.1)] ml-3.5"></div>
                                                                <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider bg-white pr-2">
                                                                    {day.displayDate}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2.5 pl-4 md:pl-10">
                                                                {day.transactions.map((t) => (
                                                                    <div key={t.id} className="flex justify-between items-center p-3 md:p-4 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] group">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={`p-2.5 rounded-2xl flex-shrink-0 transition-colors ${t.type === 'income' ? 'bg-green-50 text-green-600 group-hover:bg-green-100' : 'bg-red-50 text-red-600 group-hover:bg-red-100'}`}>
                                                                                {t.type === 'income' ? <TrendingUp size={18} /> : <Banknote size={18} />}
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <div className="font-bold text-slate-700 text-xs md:text-sm line-clamp-1">{t.category}</div>
                                                                                <div className="text-[10px] md:text-xs text-slate-400 line-clamp-1 truncate">{t.description}</div>
                                                                            </div>
                                                                        </div>
                                                                        <div className={`font-bold text-xs md:text-sm whitespace-nowrap pl-2 ${t.type === 'expense' ? 'text-slate-800' : 'text-green-600'}`}>
                                                                            {t.type === 'expense' ? '-' : '+'} {formatRupiah(t.amount)}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {financeTab === 'payroll' && (
                        <PayrollSummary
                            project={activeProject}
                            onPayWorker={(worker) => {
                                setSelectedWorkerId(worker.id);
                                const f = calculateWorkerFinancials(activeProject, worker.id);
                                setPaymentAmount(f.balance > 0 ? f.balance : 0);
                                openModal('payWorker');
                            }}
                        />
                    )}
                </div>
            )}

            {activeTab === 'workers' && canAccessWorkers && (
                <div className="pb-24">
                    {/* Mobile Sub-Navigation */}
                    <div className="md:hidden flex gap-1 bg-slate-100 p-1 rounded-2xl w-full mb-6">
                        <button
                            onClick={() => setWorkerSubTab('attendance')}
                            className={`flex-1 px-3 py-2.5 text-[10px] font-bold rounded-xl transition-all shadow-sm ${workerSubTab === 'attendance' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Absensi
                        </button>
                        <button
                            onClick={() => setWorkerSubTab('list')}
                            className={`flex-1 px-3 py-2.5 text-[10px] font-bold rounded-xl transition-all shadow-sm ${workerSubTab === 'list' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Pekerja
                        </button>
                        <button
                            onClick={() => setWorkerSubTab('evidence')}
                            className={`flex-1 px-3 py-2.5 text-[10px] font-bold rounded-xl transition-all shadow-sm ${workerSubTab === 'evidence' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Bukti Foto
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className={`md:block ${workerSubTab === 'attendance' ? 'block' : 'hidden'}`}>
                            <button onClick={() => openModal('attendance')} className="w-full bg-blue-600 text-white p-4 rounded-2xl shadow-lg font-bold mb-6 active:scale-95 transition-transform flex items-center justify-center gap-2">
                                <Users size={20} /> Isi Absensi Hari Ini
                            </button>

                            <div className="bg-white p-5 rounded-3xl border shadow-sm mb-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-slate-700">Rekapitulasi Tim</h3>
                                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">Last 30 Days</span>
                                </div>

                                <div className="flex gap-2 mb-4 bg-slate-50 p-1.5 rounded-2xl border">
                                    <div className="flex-1"><label className="text-[10px] block font-bold text-slate-400 ml-1 mb-1">Dari</label><input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="w-full bg-white border-0 rounded-xl p-2 text-xs font-bold shadow-sm" /></div>
                                    <div className="flex-1"><label className="text-[10px] block font-bold text-slate-400 ml-1 mb-1">Sampai</label><input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="w-full bg-white border-0 rounded-xl p-2 text-xs font-bold shadow-sm" /></div>
                                </div>

                                <div className="space-y-3">
                                    {getAttendanceSummary().map((stat: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-white border flex items-center justify-center font-bold text-slate-600 text-sm shadow-sm">
                                                    {stat.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-sm">{stat.name}</h4>
                                                    <div className="flex gap-2 text-[10px] mt-0.5">
                                                        <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">{stat.hadir} Hadir</span>
                                                        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">{stat.lembur} Lembur</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {canSeeMoney && (
                                                <div className="text-right">
                                                    <div className="text-[10px] text-slate-400">Total Upah</div>
                                                    <div className="font-bold text-slate-700">{formatRupiah(stat.totalCost)}</div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {getAttendanceSummary().length === 0 && (
                                        <div className="text-center py-8 text-slate-400 text-sm italic">Belum ada data absensi pada periode ini.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={`md:block ${workerSubTab !== 'attendance' ? 'block' : 'hidden'}`}>

                            {/* Worker List Section */}
                            <div className={`mb-6 ${workerSubTab === 'evidence' ? 'hidden md:block' : ''}`}>
                                <div className="flex justify-between items-center mb-4 px-1">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-700">Daftar Pekerja</h3>
                                        <p className="text-xs text-slate-400">{activeProject.workers?.length || 0} orang terdaftar</p>
                                    </div>
                                    {canAddWorkers && (
                                        <button onClick={() => openModal('newWorker')} className="bg-white border text-slate-700 px-4 py-2 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-transform">
                                            + Tambah Baru
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {(activeProject.workers || []).map(w => {
                                        const f = calculateWorkerFinancials(activeProject, w.id);
                                        return (
                                            <div key={w.id} className="bg-white p-4 rounded-3xl border shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex gap-3">
                                                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                                                            {w.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-800 text-sm">{w.name}</h4>
                                                            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{w.role}</span>
                                                        </div>
                                                    </div>
                                                    {canAccessWorkers && (
                                                        <button onClick={() => handleEditWorker(w)} className="text-slate-300 hover:text-blue-500">
                                                            <Edit size={14} />
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="bg-slate-50 rounded-xl p-3 mb-3">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-[10px] text-slate-400 uppercase font-bold">Upah / {w.wageUnit}</span>
                                                        <span className="text-xs font-bold text-slate-700">{formatRupiah(w.realRate)}</span>
                                                    </div>
                                                    {canSeeMoney && (
                                                        <div className="flex justify-between items-center border-t border-slate-200 pt-1 mt-1">
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold">Sisa Hutang</span>
                                                            <span className={`text-sm font-bold ${f.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>{formatRupiah(f.balance)}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex gap-2">
                                                    {canSeeMoney && f.balance > 0 && (
                                                        <button
                                                            onClick={() => { setSelectedWorkerId(w.id); setPaymentAmount(f.balance); openModal('payWorker'); }}
                                                            className="flex-1 bg-green-500 text-white py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-green-600 active:scale-95 transition-all"
                                                        >
                                                            Bayar Gaji
                                                        </button>
                                                    )}
                                                    {canAccessWorkers && (
                                                        <button onClick={() => handleDeleteWorker(w)} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-100 active:scale-90 transition-all">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Evidence Gallery Section */}
                            <div className={`bg-white p-5 rounded-3xl border shadow-sm ${workerSubTab === 'list' ? 'hidden md:block' : ''}`}>
                                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><ImageIcon size={18} /> Galeri Bukti Absensi</h3>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                    {getFilteredEvidence().map((ev: any) => (
                                        <div key={ev.id} className="relative rounded-2xl overflow-hidden border aspect-square group">
                                            <img src={ev.photoUrl} alt="Bukti" className="w-full h-full object-cover" />
                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-6 text-white translate-y-2 group-hover:translate-y-0 transition-transform">
                                                <div className="text-[10px] font-medium opacity-80">{new Date(ev.date).toLocaleDateString('id-ID')}</div>
                                                {ev.location && <div className="text-[10px] font-bold truncate flex items-center gap-1"><ExternalLink size={8} /> Lokasi</div>}
                                            </div>
                                        </div>
                                    ))}
                                    {getFilteredEvidence().length === 0 && (
                                        <div className="col-span-full py-8 text-center text-xs text-slate-400 border-2 border-dashed rounded-2xl">
                                            Belum ada foto bukti absensi.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'logistics' && (
                <div className="max-w-5xl mx-auto pb-24">
                    {/* Sub Navigation */}
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-full md:w-fit mb-6 mx-auto md:mx-0">
                        <button onClick={() => setLogisticsTab('stock')} className={`flex-1 md:flex-none px-4 py-3 text-xs font-bold rounded-xl transition-all shadow-sm ${logisticsTab === 'stock' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Stok Lapangan</button>
                        <button onClick={() => setLogisticsTab('recap')} className={`flex-1 md:flex-none px-4 py-3 text-xs font-bold rounded-xl transition-all shadow-sm ${logisticsTab === 'recap' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Rekap Kebutuhan</button>
                    </div>

                    {logisticsTab === 'stock' && (
                        <div>
                            {/* SMART RESTOCK ALERT */}
                            {(activeProject.materials?.filter(m => m.stock <= m.minStock) || []).length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-3xl p-5 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm animate-pulse-slow">
                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                        <div className="bg-white p-3 rounded-2xl shadow-sm text-red-500">
                                            <AlertTriangle size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-red-800 text-lg">Stok Menipis!</h4>
                                            <p className="text-xs text-red-600 font-medium">Ada {(activeProject.materials?.filter(m => m.stock <= m.minStock) || []).length} item perlu distock ulang.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const lowStock = activeProject.materials!.filter(m => m.stock <= m.minStock);
                                            setReorderItems(lowStock.map(m => m.id));
                                            setShowReorderModal(true);
                                        }}
                                        className="w-full sm:w-auto bg-red-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <ShoppingCart size={20} />
                                        Order via WhatsApp
                                    </button>
                                </div>
                            )}

                            {/* REORDER MODAL */}
                            {showReorderModal && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden">
                                        <div className="p-6 border-b flex justify-between items-center">
                                            <h3 className="font-bold text-xl text-slate-800">Pilih Item Restock</h3>
                                            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                                                {reorderItems.length} Dipilih
                                            </div>
                                        </div>

                                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
                                            <p className="text-sm text-slate-500 mb-4">
                                                Centang material yang ingin dipesan. Material yang tidak dicentang (misal: sisa proyek sebelumnya) tidak akan masuk list order.
                                            </p>

                                            {activeProject.materials?.filter(m => m.stock <= m.minStock).map(m => (
                                                <div
                                                    key={m.id}
                                                    onClick={() => {
                                                        if (reorderItems.includes(m.id)) {
                                                            setReorderItems(prev => prev.filter(id => id !== m.id));
                                                        } else {
                                                            setReorderItems(prev => [...prev, m.id]);
                                                        }
                                                    }}
                                                    className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${reorderItems.includes(m.id) ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                                                >
                                                    <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${reorderItems.includes(m.id) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'}`}>
                                                        {reorderItems.includes(m.id) && <CheckCircle size={14} />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-bold text-slate-800">{m.name}</div>
                                                        <div className="text-xs text-slate-500">
                                                            Sisa: <span className="text-red-500 font-bold">{m.stock} {m.unit}</span> (Min: {m.minStock})
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {activeProject.materials?.filter(m => m.stock <= m.minStock).length === 0 && (
                                                <div className="text-center py-8 text-slate-400">Tidak ada item low stock.</div>
                                            )}
                                        </div>

                                        <div className="p-4 bg-slate-50 border-t flex gap-3">
                                            <button
                                                onClick={() => setShowReorderModal(false)}
                                                className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                disabled={reorderItems.length === 0}
                                                onClick={() => {
                                                    const selectedMaterials = activeProject.materials!.filter(m => reorderItems.includes(m.id));

                                                    const shopName = prompt("Nama Toko Bangunan / Supplier:", "Toko Langganan");
                                                    if (shopName === null) return;

                                                    const shopPhone = prompt("Nomor WA Toko (Opsional, awali 628...):", "");

                                                    const list = selectedMaterials
                                                        .map(m => `- ${m.name}: butuh estimasi ${(m.minStock * 2) - m.stock > 0 ? (m.minStock * 2) - m.stock : 10} ${m.unit}`)
                                                        .join('\n');

                                                    const msg = `Halo ${shopName},\nSaya mau pesan material untuk proyek *${activeProject.name}*:\n\n${list}\n\nMohon info ketersediaan & harga total. Terima kasih.`;

                                                    const targetUrl = shopPhone ? `https://wa.me/${shopPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;

                                                    window.open(targetUrl, '_blank');
                                                    setShowReorderModal(false);
                                                }}
                                                className="flex-[2] py-3 px-4 rounded-xl font-bold text-white bg-green-600 shadow-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                <ShoppingCart size={18} />
                                                Lanjut ke WhatsApp
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-center mb-6 px-1">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-700">Stok Material</h3>
                                    <p className="text-xs text-slate-400">Inventory & Gudang</p>
                                </div>
                                <button onClick={() => openModal('newMaterial')} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-transform flex items-center gap-2">
                                    <Package size={16} /> Baru
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(activeProject.materials || []).map(m => (
                                    <div key={m.id} className="bg-white p-5 rounded-3xl border shadow-sm relative overflow-hidden group">
                                        {m.stock <= m.minStock && <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] px-3 py-1 rounded-bl-xl font-bold shadow-sm z-10">LOW STOCK</div>}
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="font-bold text-slate-800 text-lg mb-1 leading-tight">{m.name}</div>
                                                <div className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg inline-block">Min: {m.minStock} {m.unit}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-3xl font-black ${m.stock <= m.minStock ? 'text-red-600' : 'text-blue-600'}`}>{m.stock}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase">{m.unit}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 border-t border-dashed border-slate-200 pt-3">
                                            <button onClick={() => { setSelectedMaterial(m); openModal('stockMovement'); }} className="flex-1 py-2.5 bg-green-50 text-green-700 text-xs font-bold rounded-xl border border-green-200 hover:bg-green-100 active:scale-95 transition-all">Update Stok</button>
                                            <button onClick={() => handlePrepareEditMaterial(m)} className="p-2.5 bg-white text-blue-600 rounded-xl border hover:bg-blue-50 active:scale-95 transition-all shadow-sm" title="Edit Material"><Edit size={16} /></button>
                                            <button onClick={() => handleDeleteMaterial(m.id)} className="p-2.5 bg-white text-red-600 rounded-xl border hover:bg-red-50 active:scale-95 transition-all shadow-sm" title="Hapus Material"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                                {activeProject.materials.length === 0 && <div className="col-span-full text-center py-12 text-slate-400 border-2 border-dashed rounded-3xl bg-slate-50/50">Belum ada data stok material. Klik + Material Baru.</div>}
                            </div>
                        </div>
                    )}

                    {logisticsTab === 'recap' && (
                        <div className="bg-white rounded-3xl shadow-sm border p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-700">Rekapitulasi Sumber Daya</h3>
                                    <p className="text-sm text-slate-500">Estimasi total kebutuhan berdasarkan koefisien AHS & Volume RAB.</p>
                                </div>
                                <button onClick={() => window.print()} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors w-full sm:w-auto">Print / PDF</button>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-4">
                                {recapData.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 italic border-2 border-dashed rounded-2xl bg-slate-50">
                                        Tidak ada data rekap. Pastikan Item RAB Anda menggunakan AHS & memiliki volume.
                                    </div>
                                ) : (
                                    recapData.map((item, idx) => (
                                        <div key={idx} className="border rounded-2xl p-4 bg-slate-50 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-bold text-slate-800 text-lg leading-tight">{item.name}</div>
                                                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold ${item.type === 'bahan' ? 'bg-blue-100 text-blue-700' : item.type === 'upah' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {item.type}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-black text-slate-700">{item.totalCoefficient.toLocaleString('id-ID', { maximumFractionDigits: 2 })}</div>
                                                    <div className="text-xs font-bold text-slate-400 uppercase">{item.unit}</div>
                                                </div>
                                            </div>

                                            <div className="pt-3 border-t border-dashed border-slate-200">
                                                <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Digunakan Pada (Analisa):</div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {item.items.slice(0, 5).map((r, i) => (
                                                        <span key={i} className="bg-white px-2 py-1 rounded-md border text-[10px] text-slate-600 shadow-sm">{r}</span>
                                                    ))}
                                                    {item.items.length > 5 && <span className="text-slate-400 text-[10px] self-center">+{item.items.length - 5} lainnya</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto -mx-6 px-6 pb-2 scrollbar-hide">
                                <table className="w-full text-sm min-w-[600px]">
                                    <thead className="bg-slate-50 text-slate-600 border-b">
                                        <tr>
                                            <th className="p-3 text-left first:rounded-tl-xl whitespace-nowrap">Nama Sumber Daya</th>
                                            <th className="p-3 text-center w-32 whitespace-nowrap">Jenis</th>
                                            <th className="p-3 text-right w-32 whitespace-nowrap">Total Kebutuhan</th>
                                            <th className="p-3 text-center w-24 whitespace-nowrap">Satuan</th>
                                            <th className="p-3 text-left w-1/3 last:rounded-tr-xl min-w-[200px]">Digunakan Pada (Analisa)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {recapData.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="p-3 font-bold text-slate-700">{item.name}</td>
                                                <td className="p-3 text-center">
                                                    <span className={`px-2 py-1 rounded-lg text-[10px] uppercase font-bold ${item.type === 'bahan' ? 'bg-blue-100 text-blue-700' : item.type === 'upah' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {item.type}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right font-mono font-bold text-lg">{item.totalCoefficient.toLocaleString('id-ID', { maximumFractionDigits: 2 })}</td>
                                                <td className="p-3 text-center text-slate-500">{item.unit}</td>
                                                <td className="p-3 text-xs text-slate-500">
                                                    <div className="flex flex-wrap gap-1">
                                                        {item.items.slice(0, 3).map((r, i) => <span key={i} className="bg-slate-100 px-2 py-0.5 rounded-md border text-[10px] whitespace-nowrap">{r}</span>)}
                                                        {item.items.length > 3 && <span className="text-slate-400 text-[10px]">+{item.items.length - 3} lainnya</span>}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {recapData.length === 0 && (
                                            <tr><td colSpan={5} className="p-8 text-center text-slate-400 italic">Tidak ada data rekap. Pastikan Item RAB Anda menggunakan AHS & memiliki volume.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'gallery' && (
                <ProjectGallery
                    project={activeProject}
                    updateProject={updateProject}
                    canEdit={!isClientView && (canEditProject || canAccessWorkers)}
                />
            )}

            {/* Daily Report PDF Export Modal */}
            {showDailyReportModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="bg-slate-800 text-white p-5">
                            <h3 className="font-bold text-lg">Export Laporan Harian (PDF)</h3>
                            <p className="text-slate-300 text-sm mt-1">Pilih tanggal dan masukkan catatan tambahan</p>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Tanggal Laporan</label>
                                <input
                                    type="date"
                                    value={reportDate}
                                    onChange={(e) => setReportDate(e.target.value)}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Catatan Harian (Opsional)</label>
                                <textarea
                                    value={reportNote}
                                    onChange={(e) => setReportNote(e.target.value)}
                                    placeholder="Contoh: Cuaca cerah, pengerjaan berjalan lancar. Material semen tiba siang hari."
                                    rows={4}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                />
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDailyReportModal(false);
                                    setReportNote('');
                                }}
                                className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => {
                                    generateDailyReport(activeProject, reportDate, reportNote);
                                    setShowDailyReportModal(false);
                                    setReportNote('');
                                }}
                                className="flex-[2] py-3 px-4 rounded-xl font-bold text-white bg-orange-600 shadow-lg hover:bg-orange-700 flex items-center justify-center gap-2"
                            >
                                <FileText size={18} /> Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetailView;
