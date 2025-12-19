import React, { useState, useMemo, useEffect } from 'react';
import {
    Settings, FileText, Sparkles, History, Edit, Trash2, Banknote, Calendar, TrendingUp,
    ImageIcon, ExternalLink, Upload, Lock, AlertTriangle, ShoppingCart, Users, Package, Plus, CheckCircle,
    ShieldAlert, Minimize2, X, Camera
} from 'lucide-react';
import ProjectHeader from './project-detail/ProjectHeader';
import SCurveChart from './SCurveChart';
import {
    formatRupiah, getStats, getMonthlyGroupedTransactions,
    calculateWorkerFinancials, calculateProjectHealth
} from '../utils/helpers';
import { getEstimatedTeamDays, getRecommendedWorkers } from '../utils/scheduleGenerator';
import { generateScheduleWithGemini, generateAnalysisWithGemini, generateRiskReportWithGemini } from '../utils/aiScheduler';
import { transformGDriveUrl } from '../utils/storageHelper';
import type { Project, RABItem, Worker, Material, AHSItem } from '../types';
import ProjectGallery from './ProjectGallery';
import PayrollSummary from './PayrollSummary';
import InvoiceTerminSection from './InvoiceTerminSection';
import DocumentsTab from './DocumentsTab';
import { generateDailyReport } from '../utils/pdfGenerator';
import MaterialTransferModal from './MaterialTransferModal';
import PromptGenerator from './PromptGenerator';
import MagicRabModal from './MagicRabModal';

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
    modalType: string | null;
    showModal: boolean;
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
    // ... existing props ...
    canAccessFinance: boolean;
    canAccessWorkers: boolean;
    canSeeMoney: boolean;
    canEditProject: boolean;
    // ... existing props ...
    canViewKurvaS?: boolean;            // Pengawas tidak bisa lihat Kurva S
    canViewInternalRAB?: boolean;       // Pengawas tidak bisa lihat detail RAB internal
    canAddWorkers?: boolean;            // Pengawas tidak bisa tambah tukang sendiri
    canViewProgressTab?: boolean;       // Controls tab visibility
    setActiveTab: (tab: string) => void;
    prepareEditProject: () => void;
    prepareEditRABItem: (item: RABItem) => void;
    prepareEditSchedule: (item: RABItem) => void;
    isClientView?: boolean;
    ahsItems: AHSItem[];
    setTransactionType?: (type: 'expense' | 'income') => void;
    setTransactionCategory?: (cat: string) => void;
    handleUpdateDefectStatus?: (id: number, status: 'Fixed' | 'Verified') => void;

    // Transfer Material
    projects?: Project[];
    handleTransferMaterial?: (sourceProjectId: string, targetProjectId: string, item: Material, qty: number, notes: string, date: string, targetProjectName: string) => Promise<void>;
    handleAutoSchedule?: () => void;
    handleGenerateWeeklyReport?: (notes: string) => void;
    handleUpdateWeeklyReport?: (id: string, notes: string) => void;
}

const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
    activeProject, activeTab, updateProject, setView,
    openModal, setModalType, setShowModal, showModal, modalType, setSelectedRabItem, setProgressInput, setProgressDate,
    setSelectedWorkerId, setPaymentAmount, setSelectedMaterial,
    handleEditWorker, handleDeleteWorker,
    handleDeleteMaterial, handlePrepareEditMaterial,
    canAccessFinance, canAccessWorkers, canSeeMoney, canEditProject,
    canViewKurvaS = true, canViewInternalRAB = true, canAddWorkers = true, canViewProgressTab = true, // Defaults for backward compat
    setActiveTab, prepareEditProject, prepareEditRABItem, prepareEditSchedule, isClientView,
    ahsItems, setTransactionType, setTransactionCategory, handleUpdateDefectStatus,
    projects = [], handleTransferMaterial, userRole, handleAutoSchedule,
    handleGenerateWeeklyReport, handleUpdateWeeklyReport
}) => {
    // Local State moved from App.tsx
    const [rabViewMode, setRabViewMode] = useState<'internal' | 'client'>('client');
    const [logisticsTab, setLogisticsTab] = useState<'stock' | 'recap'>('stock');
    const [financeMonthTab, setFinanceMonthTab] = useState<string>(''); // '' means latest or all
    const [financeTab, setFinanceTab] = useState<'transactions' | 'payroll' | 'invoices'>('transactions');

    // Enforce Client View Mode
    React.useEffect(() => {
        if (isClientView) setRabViewMode('client');
    }, [isClientView]);
    const [filterStartDate, setFilterStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterEndDate, setFilterEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [showAllGantt, setShowAllGantt] = useState(false);
    const [showFullscreenTimeline, setShowFullscreenTimeline] = useState(false);

    // Journal State
    const [journalFilter, setJournalFilter] = useState<'all' | 'manpower' | 'risk'>('all');
    const [journalDateFilter, setJournalDateFilter] = useState('');
    const [journalExpanded, setJournalExpanded] = useState(false);
    const [showDeviationDetail, setShowDeviationDetail] = useState(false);
    // const [weather, setWeather] = useState<any>(null); // Removed: moved to ProjectHeader
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    // Schedule Analysis Editing State
    const [isEditingAnalysis, setIsEditingAnalysis] = useState(false);
    const [localAnalysis, setLocalAnalysis] = useState('');
    const [workerSubTab, setWorkerSubTab] = useState<'attendance' | 'list' | 'evidence'>('attendance');
    const [reorderItems, setReorderItems] = useState<number[]>([]);
    const [showReorderModal, setShowReorderModal] = useState(false);

    // Daily Report PDF Export State
    const [showDailyReportModal, setShowDailyReportModal] = useState(false);
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportNote, setReportNote] = useState('');
    const [showMagicRab, setShowMagicRab] = useState(false);

    // Transfer Material Modal State
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferMaterial, setTransferMaterial] = useState<Material | null>(null);
    const [transferQty, setTransferQty] = useState(0);
    const [transferTargetProject, setTransferTargetProject] = useState('');
    const [isTransferring, setIsTransferring] = useState(false);

    // Delete Confirmation Modal State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
    const [deleteItemName, setDeleteItemName] = useState('');




    // Derived Values & Local Handlers
    const rabGroups = (() => {
        if (!activeProject.rabItems) return {};
        const groups: { [key: string]: RABItem[] } = {};
        activeProject.rabItems.forEach(item => { if (!groups[item.category]) groups[item.category] = []; groups[item.category].push(item); });
        return groups;
    })();

    // Gantt Collapse State
    const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
    const toggleCategory = (cat: string) => {
        setCollapsedCategories(prev => ({
            ...prev,
            [cat]: !prev[cat]
        }));
    };

    // Report Settings State
    const [showReportSettings, setShowReportSettings] = useState(false);
    const [reportConfig, setReportConfig] = useState({
        showAbsensi: true,
        showMaterial: true,
        showCashflow: true,
        showLocation: true
    });

    // Load report config
    useEffect(() => {
        const saved = localStorage.getItem('wa_report_config');
        if (saved) setReportConfig(JSON.parse(saved));
    }, []);

    const saveReportConfig = (newConfig: any) => {
        setReportConfig(newConfig);
        localStorage.setItem('wa_report_config', JSON.stringify(newConfig));
        setShowReportSettings(false);
    };

    // DELETE CONFIRMATION - Show custom modal
    const openDeleteConfirm = (id: number, name: string) => {
        setDeleteItemId(id);
        setDeleteItemName(name);
        setShowDeleteConfirm(true);
    };

    // Confirm delete action
    const confirmDeleteRAB = async () => {
        if (!deleteItemId) return;

        const newItems = (activeProject.rabItems || []).filter(
            (item: RABItem) => String(item.id) !== String(deleteItemId)
        );

        try {
            await updateProject({ rabItems: newItems });
        } catch (err: any) {
            alert('Gagal menghapus: ' + (err.message || 'Error'));
        }

        setShowDeleteConfirm(false);
        setDeleteItemId(null);
        setDeleteItemName('');
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
        { id: 'dashboard', label: 'Ringkasan', icon: <Sparkles size={18} /> },
        // Pengawas bisa lihat tab ini, tapi isinya terbatas
        ...(canViewProgressTab ? [{ id: 'progress', label: 'Kurva S & RAB', icon: <TrendingUp size={18} /> }] : []),
        ...(!isClientView && canAccessFinance ? [{ id: 'finance', label: 'Keuangan', icon: <Banknote size={18} /> }] : []),
        ...(!isClientView && canAccessWorkers ? [{ id: 'workers', label: 'Tim & Absensi', icon: <Users size={18} /> }] : []),
        ...(!isClientView ? [{ id: 'logistics', label: 'Logistik', icon: <Package size={18} /> }] : []),
        { id: 'gallery', label: 'Galeri', icon: <ImageIcon size={18} /> },
        { id: 'quality', label: 'Mutu (QC)', icon: <CheckCircle size={18} /> },
        ...(!isClientView && canEditProject ? [{ id: 'documents', label: 'Dokumen', icon: <FileText size={18} /> }] : []),
    ];

    return (<>
        <div className="flex flex-col w-full max-w-full pt-0 md:pt-1">
            {/* Tab Navigation - Wrap-able Pills (1 click, no dropdown) */}
            <div className="w-full mb-4 bg-white border-b border-slate-200 pb-4">
                <div className="flex flex-wrap items-center gap-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                                }`}
                        >
                            {tab.icon}
                            <span className="hidden sm:inline">{tab.label.replace(' (QC)', '').replace(' & RAB', '')}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area - overflow hidden to prevent horizontal scroll */}
            <div className="flex flex-col gap-4 md:gap-6 w-full max-w-full overflow-x-hidden">
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
                        {/* Hero Section */}
                        <ProjectHeader project={activeProject} />

                        {/* Quick Actions (Minimalist) */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                            {!isClientView && (
                                <>
                                    <button
                                        onClick={() => setShowDailyReportModal(true)}
                                        className="bg-white text-slate-700 border border-slate-200 hover:border-green-500 hover:text-green-600 p-3 rounded-xl font-bold text-xs md:text-sm shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center justify-center gap-2 group"
                                    >
                                        <div className="p-2 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-colors">
                                            <FileText size={18} />
                                        </div>
                                        <span>Laporan Harian</span>
                                    </button>

                                    {userRole !== 'pengawas' && (
                                        <button
                                            onClick={() => setView('report-view')}
                                            className="bg-white text-slate-700 border border-slate-200 hover:border-blue-500 hover:text-blue-600 p-3 rounded-xl font-bold text-xs md:text-sm shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center justify-center gap-2 group"
                                        >
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <FileText size={18} />
                                            </div>
                                            <span>Laporan Detail</span>
                                        </button>
                                    )}

                                    {userRole !== 'pengawas' && (
                                        <button
                                            onClick={() => setShowReportSettings(true)}
                                            className="bg-white text-slate-700 border border-slate-200 hover:border-emerald-500 hover:text-emerald-600 p-3 rounded-xl font-bold text-xs md:text-sm shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center justify-center gap-2 group"
                                        >
                                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                                <Settings size={18} />
                                            </div>
                                            <span>Config WA</span>
                                        </button>
                                    )}

                                    {userRole !== 'pengawas' && (
                                        <button
                                            onClick={() => {
                                                const url = `${window.location.origin}?projectId=${activeProject.id}&mode=client`;
                                                navigator.clipboard.writeText(url);
                                                alert(`Link Portal Klien berhasil disalin!\n\nKirim link ini ke pemilik proyek via WhatsApp:\n${url}`);
                                            }}
                                            className="bg-white text-slate-700 border border-slate-200 hover:border-purple-500 hover:text-purple-600 p-3 rounded-xl font-bold text-xs md:text-sm shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center justify-center gap-2 group"
                                        >
                                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                                <ExternalLink size={18} />
                                            </div>
                                            <span>Portal Klien</span>
                                        </button>
                                    )}

                                    {canEditProject && (
                                        <button
                                            onClick={prepareEditProject}
                                            className="col-span-2 md:col-span-4 mt-2 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 border border-transparent p-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Settings size={14} /> Pengaturan Proyek & Data
                                        </button>
                                    )}
                                </>
                            )}
                            {isClientView && (
                                <button
                                    onClick={() => setView('report-view')}
                                    className="col-span-2 md:col-span-4 bg-blue-600 text-white p-3 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
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

                                {/* DEVIATION INDICATOR - More Prominent */}
                                {(() => {
                                    const planProgress = calculateProjectHealth(activeProject).planProgress || 0;
                                    const actualProgress = getStats(activeProject).prog;
                                    const deviation = actualProgress - planProgress;
                                    const isAhead = deviation >= 0;
                                    const isCritical = deviation < -10;
                                    const isWarning = deviation < -5 && deviation >= -10;

                                    return (
                                        <div className={`mt-3 p-4 rounded-2xl border-2 ${isCritical ? 'bg-red-50 border-red-300' :
                                            isWarning ? 'bg-orange-50 border-orange-300' :
                                                isAhead ? 'bg-green-50 border-green-300' :
                                                    'bg-slate-50 border-slate-200'
                                            }`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-xl ${isCritical ? 'bg-red-100' :
                                                        isWarning ? 'bg-orange-100' :
                                                            isAhead ? 'bg-green-100' :
                                                                'bg-slate-100'
                                                        }`}>
                                                        {isCritical || isWarning ? (
                                                            <AlertTriangle size={24} className={isCritical ? 'text-red-600' : 'text-orange-600'} />
                                                        ) : (
                                                            <TrendingUp size={24} className="text-green-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className={`font-bold text-sm ${isCritical ? 'text-red-700' :
                                                            isWarning ? 'text-orange-700' :
                                                                isAhead ? 'text-green-700' :
                                                                    'text-slate-700'
                                                            }`}>
                                                            {isCritical ? '⚠️ KRITIS - Sangat Terlambat' :
                                                                isWarning ? '⚠️ PERINGATAN - Terlambat' :
                                                                    isAhead && deviation > 5 ? '🚀 Lebih Cepat dari Jadwal' :
                                                                        isAhead ? '✅ Sesuai Jadwal' :
                                                                            '📊 Progress Normal'}
                                                        </h4>
                                                        <p className="text-xs text-slate-500 mt-0.5">
                                                            Rencana: {planProgress.toFixed(1)}% • Realisasi: {actualProgress.toFixed(1)}%
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-2xl font-black ${isCritical ? 'text-red-600' :
                                                        isWarning ? 'text-orange-600' :
                                                            isAhead ? 'text-green-600' :
                                                                'text-slate-600'
                                                        }`}>
                                                        {isAhead ? '+' : ''}{deviation.toFixed(1)}%
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                                                        Deviasi
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Progress comparison bar */}
                                            <div className="mt-3 flex gap-2 items-center">
                                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-slate-400 rounded-full"
                                                        style={{ width: `${Math.min(planProgress, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] text-slate-400 w-10 text-right">Plan</span>
                                            </div>
                                            <div className="mt-1 flex gap-2 items-center">
                                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${isCritical ? 'bg-red-500' :
                                                            isWarning ? 'bg-orange-500' :
                                                                'bg-green-500'
                                                            }`}
                                                        style={{ width: `${Math.min(actualProgress, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] text-slate-400 w-10 text-right">Aktual</span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>


                            {/* Mini SCurve - Hide from Pengawas */}
                            {canViewKurvaS && (
                                <div className="w-full mt-4">
                                    <SCurveChart stats={getStats(activeProject)} project={activeProject} compact={true} />
                                </div>
                            )}

                            {/* CATEGORY DEVIATION BREAKDOWN - with Toggle */}
                            {activeProject.rabItems && activeProject.rabItems.length > 0 && (
                                <div className="mt-4 border-t border-dashed border-slate-200 pt-3">
                                    <button
                                        onClick={() => setShowDeviationDetail(!showDeviationDetail)}
                                        className="w-full flex items-center justify-between py-2 px-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
                                    >
                                        <span className="font-bold text-xs text-slate-600 flex items-center gap-2">
                                            📊 Lihat Detail Deviasi per Kategori
                                        </span>
                                        <span className={`transform transition-transform duration-200 text-slate-400 ${showDeviationDetail ? 'rotate-180' : ''}`}>
                                            ▼
                                        </span>
                                    </button>

                                    {showDeviationDetail && (
                                        <div className="mt-3 space-y-2">
                                            {(() => {
                                                // Group items by category and calculate deviation
                                                const groups = activeProject.rabItems.reduce((acc: any, item: any) => {
                                                    const cat = item.category || 'Tanpa Kategori';
                                                    if (!acc[cat]) acc[cat] = { items: [], totalValue: 0, weightedProgress: 0, hasSchedule: false };
                                                    acc[cat].items.push(item);
                                                    // Calculate item value: use totalPrice if exists, otherwise calculate from volume * unitPrice
                                                    const itemValue = item.totalPrice || ((item.volume || 1) * (item.unitPrice || 0));
                                                    acc[cat].totalValue += itemValue;
                                                    acc[cat].weightedProgress += (item.progress || 0) * itemValue;
                                                    if (item.startDate && item.endDate) acc[cat].hasSchedule = true;
                                                    return acc;
                                                }, {});

                                                // Calculate overall plan progress based on project timeline
                                                const pStart = new Date(activeProject.startDate).getTime();
                                                const pEnd = new Date(activeProject.endDate).getTime();
                                                const now = Date.now();
                                                const projectTimeProgress = Math.min(100, Math.max(0, ((now - pStart) / (pEnd - pStart)) * 100));

                                                // Create category stats
                                                const categoryStats = Object.entries(groups).map(([cat, data]: [string, any]) => {
                                                    const actualProgress = data.totalValue > 0 ? data.weightedProgress / data.totalValue : 0;

                                                    // For each category, calculate plan based on scheduled items
                                                    let totalWeightedPlan = 0;
                                                    let totalScheduledValue = 0;

                                                    data.items.forEach((item: any) => {
                                                        const itemValue = item.totalPrice || ((item.volume || 1) * (item.unitPrice || 0)) || 1;

                                                        if (item.startDate && item.endDate) {
                                                            const iStart = new Date(item.startDate).getTime();
                                                            const iEnd = new Date(item.endDate).getTime();
                                                            let itemPlan = 0;

                                                            if (now >= iEnd) {
                                                                itemPlan = 100;
                                                            } else if (now > iStart && iEnd > iStart) {
                                                                itemPlan = Math.min(100, ((now - iStart) / (iEnd - iStart)) * 100);
                                                            } else if (now <= iStart) {
                                                                itemPlan = 0; // Item hasn't started yet
                                                            }

                                                            totalWeightedPlan += itemPlan * itemValue;
                                                            totalScheduledValue += itemValue;
                                                        }
                                                    });

                                                    // If no items have schedules, use project timeline progress as plan
                                                    // If some items have schedules, use weighted average plan
                                                    let planProgress = 0;
                                                    if (totalScheduledValue > 0) {
                                                        planProgress = totalWeightedPlan / totalScheduledValue;
                                                    } else {
                                                        // No schedules set - plan based on project timeline
                                                        planProgress = projectTimeProgress;
                                                    }

                                                    const deviation = actualProgress - planProgress;

                                                    return {
                                                        name: cat,
                                                        actual: actualProgress,
                                                        plan: planProgress,
                                                        deviation,
                                                        itemCount: data.items.length,
                                                        value: data.totalValue,
                                                        hasSchedule: data.hasSchedule
                                                    };
                                                });

                                                // Sort by deviation (worst first)
                                                categoryStats.sort((a, b) => a.deviation - b.deviation);

                                                return categoryStats.map((cat) => {
                                                    const isCritical = cat.deviation < -10;
                                                    const isWarning = cat.deviation < -5 && cat.deviation >= -10;
                                                    const isAhead = cat.deviation >= 0;

                                                    return (
                                                        <div
                                                            key={cat.name}
                                                            className={`p-3 rounded-xl border ${isCritical ? 'bg-red-50 border-red-200' :
                                                                isWarning ? 'bg-orange-50 border-orange-200' :
                                                                    isAhead ? 'bg-green-50 border-green-200' :
                                                                        'bg-slate-50 border-slate-200'
                                                                }`}
                                                        >
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className={`text-xs font-bold ${isCritical ? 'text-red-700' :
                                                                            isWarning ? 'text-orange-700' :
                                                                                isAhead ? 'text-green-700' :
                                                                                    'text-slate-700'
                                                                            }`}>
                                                                            {isCritical ? '🔴' : isWarning ? '🟠' : isAhead ? '🟢' : '⚪'}
                                                                        </span>
                                                                        <span className="font-bold text-xs text-slate-800 truncate">{cat.name}</span>
                                                                        <span className="text-[10px] text-slate-400">({cat.itemCount} item)</span>
                                                                        {!cat.hasSchedule && (
                                                                            <span className="text-[9px] bg-yellow-100 text-yellow-600 px-1.5 py-0.5 rounded font-medium">
                                                                                Belum ada jadwal
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                                                        Plan: {cat.plan.toFixed(0)}% • Aktual: {cat.actual.toFixed(0)}%
                                                                    </div>
                                                                    <div className="mt-1 flex gap-1 items-center">
                                                                        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                                            <div
                                                                                className={`h-full rounded-full ${isCritical ? 'bg-red-500' :
                                                                                    isWarning ? 'bg-orange-500' :
                                                                                        'bg-green-500'
                                                                                    }`}
                                                                                style={{ width: `${Math.min(cat.actual, 100)}%` }}
                                                                            />
                                                                        </div>
                                                                        <span className="text-[10px] text-slate-500 w-8 text-right">{cat.actual.toFixed(0)}%</span>
                                                                    </div>
                                                                </div>
                                                                <div className={`text-right px-2 py-1 rounded-lg ${isCritical ? 'bg-red-100' :
                                                                    isWarning ? 'bg-orange-100' :
                                                                        isAhead ? 'bg-green-100' :
                                                                            'bg-slate-100'
                                                                    }`}>
                                                                    <div className={`text-sm font-black ${isCritical ? 'text-red-600' :
                                                                        isWarning ? 'text-orange-600' :
                                                                            isAhead ? 'text-green-600' :
                                                                                'text-slate-600'
                                                                        }`}>
                                                                        {isAhead ? '+' : ''}{cat.deviation.toFixed(1)}%
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                )}

                {activeTab === 'progress' && (
                    <div className="space-y-6 pb-24">
                        {/* Empty State when no RAB items - MUST be at top level */}
                        {(!activeProject.rabItems || activeProject.rabItems.length === 0) && (
                            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200 text-center">
                                <Sparkles size={48} className="mx-auto text-slate-300 mb-4" />
                                <h3 className="font-bold text-lg text-slate-700 mb-2">Belum Ada Item Pekerjaan</h3>
                                <p className="text-sm text-slate-500 mb-6">Tambahkan item RAB untuk melihat progress dan Kurva-S</p>
                                {!isClientView && canEditProject && (
                                    <button
                                        onClick={() => { setSelectedRabItem(null); openModal('newRAB'); }}
                                        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm inline-flex items-center gap-2 hover:bg-blue-700"
                                    >
                                        <Plus size={18} /> Tambah Item RAB
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Gantt Chart Section - Allow Pengawas but restrict edits/money */}
                        {activeProject.rabItems && activeProject.rabItems.length > 0 && canViewProgressTab && (
                            <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-200 w-full max-w-full overflow-hidden">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
                                    <h3 className="font-bold text-base md:text-lg text-slate-700 flex items-center gap-2"><History size={20} /> Timeline Pekerjaan</h3>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {/* Fullscreen Button - Mobile Only */}
                                        {!isClientView && (
                                            <>
                                                <button
                                                    onClick={() => setModalType('importRAB')}
                                                    className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-green-100"
                                                >
                                                    <Upload className="w-4 h-4" /> Import Excel
                                                </button>
                                                <button
                                                    onClick={() => setShowMagicRab(true)}
                                                    className="px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border border-purple-200 rounded-xl font-bold text-sm flex items-center gap-2 hover:from-purple-200 hover:to-indigo-200"
                                                >
                                                    <Sparkles className="w-4 h-4" /> Magic Import
                                                </button>
                                            </>
                                        )}
                                        {!isClientView && rabViewMode !== 'client' && (
                                            <>
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm("AI akan mendesain ulang jadwal semua item secara otomatis berdasarkan logika konstruksi.\n\nJadwal manual yang sudah ada akan di-update.\nLanjutkan?")) return;

                                                        const performScheduleGen = async () => {
                                                            try {
                                                                setIsGeneratingAI(true);

                                                                // 1. Generate Schedule (JSON Structure)
                                                                const updatedItems = await generateScheduleWithGemini(activeProject, activeProject.rabItems || []);

                                                                // 2. Automatically Generate Manpower Explanation (Header ONLY)
                                                                const analysisRes = await generateAnalysisWithGemini(activeProject, updatedItems);

                                                                // 3. Save to dedicated headerAnalysis field (SEPARATE from Journal)
                                                                const headerData = {
                                                                    content: analysisRes,
                                                                    date: new Date().toISOString(),
                                                                    itemCount: updatedItems.length
                                                                };

                                                                // 4. Update Project (Header is SEPARATE field, not aiLogs)
                                                                updateProject({
                                                                    rabItems: updatedItems,
                                                                    headerAnalysis: headerData
                                                                } as any);

                                                                alert("✅ SUKSES!\n\n1. Jadwal Proyek telah disusun ulang oleh AI.\n2. Penjelasan Tenaga Kerja telah diperbarui di Header.\n\n💡 Jurnal terpisah: klik tombol Analisa jika perlu arsip detail.");
                                                            } catch (err: any) {
                                                                console.error(err);
                                                                alert("Gagal generate schedule: " + err.message);
                                                            } finally {
                                                                setIsGeneratingAI(false);
                                                            }
                                                        };

                                                        performScheduleGen();
                                                    }}

                                                    disabled={isGeneratingAI}
                                                    className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1 disabled:opacity-50"
                                                    title="Generate Jadwal Otomatis dengan Google Gemini AI"
                                                >
                                                    {isGeneratingAI ? <Sparkles size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                                    {isGeneratingAI ? 'Meracik...' : 'AI Schedule'}
                                                </button>
                                                <div className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold hidden md:block">
                                                    Tips: Klik baris item untuk atur jadwal (Start/End Date)
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {(() => {
                                    // Calculate project duration
                                    const pStart = new Date(activeProject.startDate).getTime();
                                    const pEnd = new Date(activeProject.endDate).getTime();
                                    const durationDays = Math.ceil((pEnd - pStart) / (1000 * 60 * 60 * 24));
                                    const totalWeeks = Math.max(4, Math.ceil(durationDays / 7));
                                    const needsScroll = totalWeeks > 8;

                                    // GROUPING LOGIC
                                    const groups = activeProject.rabItems.reduce((acc: any, item: any) => {
                                        const cat = item.category || 'Tanpa Kategori';
                                        if (!acc[cat]) acc[cat] = [];
                                        acc[cat].push(item);
                                        return acc;
                                    }, {});

                                    // Calculate aggregate timeline per category
                                    const categoryTimelines: Record<string, { startOffset: number, width: number, avgProgress: number, teamsNeeded?: number }> = {};
                                    const totalDuration = pEnd - pStart;

                                    Object.keys(groups).forEach(cat => {
                                        const items = groups[cat];
                                        let minStart = Infinity;
                                        let maxEnd = -Infinity;
                                        let totalProgress = 0;
                                        let itemCount = 0;
                                        let totalTeamDays = 0; // Accumulated Team-Days (ideal effort)

                                        items.forEach((item: any) => {
                                            if (item.startDate && item.endDate) {
                                                const iStart = new Date(item.startDate).getTime();
                                                const iEnd = new Date(item.endDate).getTime();
                                                if (iStart < minStart) minStart = iStart;
                                                if (iEnd > maxEnd) maxEnd = iEnd;

                                                const idealDays = getEstimatedTeamDays(item);
                                                totalTeamDays += idealDays;
                                            }
                                            totalProgress += (item.progress || 0);
                                            itemCount++;
                                        });

                                        let teamsNeeded = 0;
                                        if (minStart !== Infinity && maxEnd !== -Infinity && totalDuration > 0) {
                                            const startOffset = Math.max(0, ((minStart - pStart) / totalDuration) * 100);
                                            const width = Math.min(100 - startOffset, ((maxEnd - minStart) / totalDuration) * 100);

                                            // Calculate Schedule Duration in Days
                                            const scheduledDays = Math.max(1, Math.ceil((maxEnd - minStart) / (1000 * 60 * 60 * 24)));

                                            // New Robust Logic via Shared Function (Synced with AI)
                                            const recommendedWorkers = getRecommendedWorkers(cat, totalTeamDays, scheduledDays);
                                            teamsNeeded = recommendedWorkers / 2; // Convert to teams (UI expects teams)

                                            categoryTimelines[cat] = {
                                                startOffset,
                                                width: Math.max(5, width),
                                                avgProgress: itemCount > 0 ? totalProgress / itemCount : 0,
                                                teamsNeeded
                                            };
                                        } else {
                                            // Default / Fallback
                                            const recommendedWorkers = getRecommendedWorkers(cat, totalTeamDays, 7);
                                            categoryTimelines[cat] = {
                                                startOffset: 0,
                                                width: 20,
                                                avgProgress: itemCount > 0 ? totalProgress / itemCount : 0,
                                                teamsNeeded: recommendedWorkers / 2
                                            };
                                        }
                                    });

                                    // DEFAULT: All categories collapsed (use undefined check to default to true)
                                    const timelineRows: Array<{ type: 'header' | 'item', data: any, id: string, catTimeline?: any }> = [];
                                    Object.keys(groups).sort().forEach(cat => {
                                        // Default collapsed = true (if not explicitly set to false)
                                        const isCollapsed = collapsedCategories[cat] !== false;
                                        timelineRows.push({
                                            type: 'header',
                                            data: cat,
                                            id: `cat-${cat}`,
                                            catTimeline: categoryTimelines[cat]
                                        });
                                        if (!isCollapsed) {
                                            groups[cat].forEach((item: any) => {
                                                timelineRows.push({ type: 'item', data: item, id: item.id });
                                            });
                                        }
                                    });

                                    const displayedRows = showAllGantt ? timelineRows : timelineRows.slice(0, 8);

                                    return (
                                        <div className="relative w-full border border-slate-200 rounded-2xl overflow-hidden grid grid-cols-[9rem_minmax(0,1fr)] md:grid-cols-[14rem_minmax(0,1fr)]">

                                            {/* SCROLL HINT (Right Side) */}
                                            {needsScroll && (
                                                <div className="md:hidden absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-20 flex items-center justify-center col-start-2">
                                                    <span className="text-blue-500 text-lg font-bold animate-pulse">›</span>
                                                </div>
                                            )}

                                            {/* --- LEFT COLUMN: FIXED LABELS --- */}
                                            <div className="bg-white border-r border-slate-100 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                                                {/* Header Label */}
                                                <div className="h-10 border-b border-slate-100 px-4 flex items-center font-bold text-xs text-slate-500 bg-slate-50/50">
                                                    Item Pekerjaan
                                                </div>
                                                {/* Row List */}
                                                <div className="bg-white pb-2">
                                                    {displayedRows.map((row) => {
                                                        if (row.type === 'header') {
                                                            const peopleNeeded = row.catTimeline?.teamsNeeded ? Math.ceil(row.catTimeline.teamsNeeded * 2) : 0;
                                                            return (
                                                                <div
                                                                    key={row.id}
                                                                    onClick={() => toggleCategory(row.data)}
                                                                    className="h-8 flex items-center px-4 text-[10px] font-bold text-slate-500 bg-slate-100/50 uppercase tracking-wider border-b border-white hover:bg-slate-200 cursor-pointer select-none"
                                                                    title={row.data}
                                                                >
                                                                    <div className="flex items-center gap-2 w-full min-w-0">
                                                                        <span className="transform transition-transform duration-200 flex-shrink-0" style={{ transform: collapsedCategories[row.data] === false ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                                                                            ▼
                                                                        </span>
                                                                        <div className="flex items-center gap-1 overflow-hidden">
                                                                            <span className="truncate">{row.data}</span>
                                                                            {!isClientView && peopleNeeded > 0 && (
                                                                                <span
                                                                                    className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-[9px] font-extrabold whitespace-nowrap flex-shrink-0 cursor-help"
                                                                                    title={`Rata-rata beban kerja harian kategori ini butuh ${peopleNeeded} orang (Akumulasi item yang berjalan paralel).`}
                                                                                >
                                                                                    Rata²: {peopleNeeded} Org
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        } else {
                                                            const item = row.data;
                                                            // Calculate Daily Workers for Item
                                                            let dailyWorkersStr = '';
                                                            if (!isClientView && item.startDate && item.endDate) {
                                                                const iStart = new Date(item.startDate).getTime();
                                                                const iEnd = new Date(item.endDate).getTime();
                                                                const durationDays = Math.max(1, Math.ceil((iEnd - iStart) / (1000 * 60 * 60 * 24)));
                                                                const idealDays = getEstimatedTeamDays(item);
                                                                // 1 Team = 2 People
                                                                const w = Math.ceil((idealDays / durationDays) * 2);
                                                                if (w > 0) dailyWorkersStr = `${w}`;
                                                            }

                                                            return (
                                                                <div
                                                                    key={row.id}
                                                                    onClick={() => {
                                                                        if (isClientView) return;
                                                                        // Modified: Pengawas click opens Progress Modal, others open Schedule Edit
                                                                        if (userRole === 'pengawas') {
                                                                            setSelectedRabItem(row.data);
                                                                            openModal('updateProgress');
                                                                        } else if (rabViewMode !== 'client') {
                                                                            prepareEditSchedule(row.data);
                                                                        }
                                                                    }}
                                                                    className={`h-8 flex items-center px-4 text-xs font-medium text-slate-700 border-b border-transparent ${(!isClientView && (userRole === 'pengawas' || rabViewMode !== 'client')) ? 'cursor-pointer hover:text-blue-600 group' : ''}`}
                                                                    title={row.data.name}
                                                                >
                                                                    <div className="flex items-center justify-between w-full min-w-0 gap-2">
                                                                        <span className="truncate">{row.data.name}</span>
                                                                        {dailyWorkersStr && (
                                                                            <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-1 rounded flex-shrink-0" title={`Estimasi: Butuh ${dailyWorkersStr} Tukang/Hari agar selesai tepat waktu`}>
                                                                                👥{dailyWorkersStr}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                    })}
                                                    {/* Button Spacer */}
                                                    {timelineRows.length > 8 && (
                                                        <div className="h-10 mt-2" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* --- RIGHT COLUMN: SCROLLABLE GANTT CHART --- */}
                                            <div className="overflow-x-auto timeline-scroll bg-white relative w-full">
                                                {/* Inner responsive container */}
                                                <div className="min-w-full w-max">

                                                    {/* Header Weeks */}
                                                    <div className="h-10 border-b border-slate-100 flex items-center bg-slate-50/30">
                                                        <div className="flex-1 flex px-2 md:px-4">
                                                            {[...Array(totalWeeks)].map((_, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="flex-1 min-w-[50px] md:min-w-[70px] border-l border-slate-100 first:border-l-0 text-[10px] text-slate-400 pl-2 py-1 flex items-center"
                                                                >
                                                                    {totalWeeks <= 12 ? `Mgg ${i + 1}` : (i + 1)}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Data Rows */}
                                                    <div className="pb-2">
                                                        {displayedRows.map((row, idx) => {
                                                            if (row.type === 'header') {
                                                                // Category aggregate timeline bar
                                                                const catTimeline = row.catTimeline || { startOffset: 0, width: 20, avgProgress: 0 };
                                                                return (
                                                                    <div
                                                                        key={row.id}
                                                                        className="h-8 bg-slate-50/50 border-b border-slate-100 w-full flex items-center px-2 md:px-4 cursor-pointer hover:bg-slate-100"
                                                                        onClick={() => toggleCategory(row.data)}
                                                                    >
                                                                        <div className="flex-1 relative h-5 bg-slate-200/80 rounded-full overflow-hidden w-full">
                                                                            {/* Plan Bar (full width for category) */}
                                                                            <div
                                                                                className="absolute top-0 bottom-0 bg-slate-400 opacity-40"
                                                                                style={{ left: `${catTimeline.startOffset}%`, width: `${catTimeline.width}%` }}
                                                                            />
                                                                            {/* Realization Bar */}
                                                                            <div
                                                                                className="absolute top-0 bottom-0 bg-slate-600"
                                                                                style={{
                                                                                    left: `${catTimeline.startOffset}%`,
                                                                                    width: `${catTimeline.width * (catTimeline.avgProgress / 100)}%`
                                                                                }}
                                                                            >
                                                                                {catTimeline.width * (catTimeline.avgProgress / 100) > 10 && (
                                                                                    <span className="text-[9px] text-white px-1 font-bold flex items-center h-full overflow-hidden whitespace-nowrap">
                                                                                        {catTimeline.avgProgress.toFixed(0)}%
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }

                                                            const item = row.data;
                                                            // Progress Calculation
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
                                                                startOffset = Math.min((idx * 15), 80);
                                                                width = 15;
                                                            }

                                                            if (startOffset < 0) startOffset = 0;
                                                            if (startOffset > 100) startOffset = 100;
                                                            if (width < 5) width = 5;
                                                            if (startOffset + width > 100) width = 100 - startOffset;

                                                            return (
                                                                <div
                                                                    key={item.id}
                                                                    onClick={() => !isClientView && rabViewMode !== 'client' && prepareEditSchedule(item)}
                                                                    className={`h-8 flex items-center px-2 md:px-4 transition-colors border-b border-transparent ${!isClientView && rabViewMode !== 'client' ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                                                                >
                                                                    <div className="flex-1 relative h-5 bg-slate-100/80 rounded-full overflow-hidden w-full">
                                                                        {/* Plan Bar */}
                                                                        <div
                                                                            className={`absolute top-0 bottom-0 opacity-30 ${['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500'][idx % 4]}`}
                                                                            style={{ left: `${startOffset}%`, width: `${width}%` }}
                                                                        />
                                                                        {/* Realization Bar */}
                                                                        <div
                                                                            className={`absolute top-0 bottom-0 ${['bg-blue-600', 'bg-green-600', 'bg-orange-600', 'bg-purple-600'][idx % 4]}`}
                                                                            style={{
                                                                                left: `${startOffset}%`,
                                                                                width: `${width * (item.progress / 100)}%`
                                                                            }}
                                                                        >
                                                                            {width * (item.progress / 100) > 10 && (
                                                                                <span className="text-[9px] text-white px-1 font-bold flex items-center h-full overflow-hidden whitespace-nowrap">
                                                                                    {item.progress}%
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}

                                                        {timelineRows.length > 8 && (
                                                            <div className="h-10 mt-2 flex items-center pl-4 border-t border-slate-100">
                                                                <button
                                                                    onClick={() => setShowAllGantt(!showAllGantt)}
                                                                    className="text-xs font-bold text-blue-600 hover:text-blue-800 whitespace-nowrap z-10 relative"
                                                                >
                                                                    {showAllGantt ? 'Tutup Ringkas' : `+ ${timelineRows.length - 8} baris lainnya`}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {/* --- AI INTELLIGENCE DASHBOARD (GEMINI 3 FLASH) --- */}
                        {!isClientView && rabViewMode !== 'client' && (
                            <div className="mt-8 bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-indigo-100 shadow-sm overflow-hidden mx-1">
                                <div className="p-4 border-b border-indigo-50 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-indigo-50/30">
                                    <div>
                                        <h3 className="font-bold text-indigo-900 flex items-center gap-2 text-sm md:text-base">
                                            <Sparkles size={18} className="text-indigo-600" />
                                            Jurnal Evaluasi Cerdas
                                            <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-mono border border-indigo-200">Gemini 3 Flash</span>
                                        </h3>
                                        <p className="text-[10px] text-indigo-400 mt-1 pl-7 hidden md:block">
                                            Analisa mendalam untuk arsip evaluasi proyek & pembelajaran.
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={async () => {
                                                const confirm = window.confirm("Mulai Analisa Manpower?");
                                                if (!confirm) return;

                                                const context = window.prompt("Informasi Tambahan Lapangan (Opsional):\nContoh: 'Hujan deras kemarin', 'Progress item X melambat'");

                                                try {
                                                    setIsGeneratingAI(true);
                                                    const res = await generateAnalysisWithGemini(activeProject, activeProject.rabItems || [], context || "");

                                                    // Save to Log
                                                    const newLog: any = {
                                                        id: Date.now().toString(),
                                                        date: new Date().toISOString(),
                                                        type: 'manpower',
                                                        content: res
                                                    };

                                                    const currentLogs = (activeProject as any).aiLogs || [];
                                                    const updatedLogs = [...currentLogs, newLog];
                                                    const updatedProject = { ...activeProject, aiLogs: updatedLogs };

                                                    // Handle Update
                                                    if (updateProject) updateProject(updatedProject);

                                                    alert("Analisa Berhasil Disimpan di Jurnal!");
                                                } catch (e: any) { alert("Gagal: " + e.message); }
                                                finally { setIsGeneratingAI(false); }
                                            }}
                                            disabled={isGeneratingAI}
                                            className="px-3 py-2 bg-white border border-indigo-200 text-indigo-700 text-xs rounded-lg font-semibold hover:bg-indigo-50 hover:shadow-sm transition flex items-center gap-2"
                                        >
                                            {isGeneratingAI ? <Sparkles size={14} className="animate-spin" /> : <Users size={14} />}
                                            Analisa Manpower
                                        </button>
                                        <button
                                            onClick={async () => {
                                                const confirm = window.confirm("Mulai Analisa Risiko?");
                                                if (!confirm) return;

                                                const context = window.prompt("Informasi Kondisi Lapangan (Opsional):\nContoh: 'Akses jalan sempit', 'Dekat selokan', 'Musim hujan'");

                                                try {
                                                    setIsGeneratingAI(true);
                                                    const res = await generateRiskReportWithGemini(activeProject, activeProject.rabItems || [], context || "");

                                                    const newLog: any = {
                                                        id: Date.now().toString(),
                                                        date: new Date().toISOString(),
                                                        type: 'risk',
                                                        content: res
                                                    };

                                                    const currentLogs = (activeProject as any).aiLogs || [];
                                                    const updatedLogs = [...currentLogs, newLog];
                                                    const updatedProject = { ...activeProject, aiLogs: updatedLogs };

                                                    if (updateProject) updateProject(updatedProject);

                                                    alert("Analisa Berhasil Disimpan di Jurnal!");
                                                } catch (e: any) { alert("Gagal: " + e.message); }
                                                finally { setIsGeneratingAI(false); }
                                            }}
                                            disabled={isGeneratingAI}
                                            className="px-3 py-2 bg-white border border-rose-200 text-rose-700 text-xs rounded-lg font-semibold hover:bg-rose-50 hover:shadow-sm transition flex items-center gap-2"
                                        >
                                            {isGeneratingAI ? <AlertTriangle size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
                                            Analisa Risiko
                                        </button>
                                    </div>
                                </div>

                                {/* Filter Bar */}
                                <div className="px-4 py-3 bg-white border-b border-indigo-50 flex items-center gap-2 overflow-x-auto">
                                    <button
                                        onClick={() => { setJournalFilter('all'); setJournalExpanded(false); }}
                                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition whitespace-nowrap ${journalFilter === 'all' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        Semua
                                    </button>
                                    <button
                                        onClick={() => { setJournalFilter('manpower'); setJournalExpanded(false); }}
                                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition whitespace-nowrap flex items-center gap-1 ${journalFilter === 'manpower' ? 'bg-indigo-100 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        <Users size={12} /> Manpower
                                    </button>
                                    <button
                                        onClick={() => { setJournalFilter('risk'); setJournalExpanded(false); }}
                                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition whitespace-nowrap flex items-center gap-1 ${journalFilter === 'risk' ? 'bg-rose-100 border-rose-200 text-rose-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        <AlertTriangle size={12} /> Risiko
                                    </button>

                                    <div className="w-px h-5 bg-slate-200 mx-1 flex-shrink-0"></div>

                                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 hover:border-indigo-300 transition flex-shrink-0">
                                        <Calendar size={12} className="text-slate-400" />
                                        <input
                                            type="date"
                                            value={journalDateFilter}
                                            onChange={(e) => { setJournalDateFilter(e.target.value); setJournalExpanded(false); }}
                                            className="text-[10px] text-slate-600 focus:outline-none w-24 bg-transparent"
                                        />
                                        {journalDateFilter && (
                                            <button onClick={() => setJournalDateFilter('')} className="bg-slate-100 text-slate-400 hover:text-rose-500 rounded-full p-0.5 ml-1"><X size={10} /></button>
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50/50 min-h-[100px]">
                                    {/* Filtering Logic */}
                                    {(() => {
                                        const allLogs = (activeProject as any).aiLogs || [];
                                        const filteredLogs = allLogs
                                            .filter((l: any) => {
                                                const matchesType = journalFilter === 'all' || l.type === journalFilter;

                                                // Timezone Fix: Compare using Local Time
                                                const d = new Date(l.date);
                                                const logDateLocal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

                                                const matchesDate = journalDateFilter ? logDateLocal === journalDateFilter : true;
                                                return matchesType && matchesDate;
                                            })
                                            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

                                        const displayedLogs = journalExpanded ? filteredLogs : filteredLogs.slice(0, 5);
                                        const hasMore = filteredLogs.length > 5;

                                        if (filteredLogs.length === 0) {
                                            return (
                                                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                                    <div className="bg-slate-100 p-3 rounded-full mb-3">
                                                        <History size={24} className="opacity-50" />
                                                    </div>
                                                    <p className="text-xs italic">Belum ada riwayat {journalFilter !== 'all' ? journalFilter : ''}.</p>
                                                    <p className="text-[10px] mt-1">Klik tombol di atas untuk mulai analisa AI.</p>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div className="space-y-3">
                                                {displayedLogs.map((log: any, index: number) => (
                                                    <details key={log.id} open={index === 0} className="bg-white rounded-xl border border-slate-200 shadow-sm group">
                                                        <summary className="list-none cursor-pointer p-4 bg-white hover:bg-slate-50 rounded-xl transition-colors select-none">
                                                            <div className="flex justify-between items-center">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`p-2 rounded-lg flex-shrink-0 ${log.type === 'manpower' ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600'}`}>
                                                                        {log.type === 'manpower' ? <Users size={16} /> : <AlertTriangle size={16} />}
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <h4 className="text-sm font-bold text-slate-700">
                                                                                {log.type === 'manpower' ? 'Analisa Tenaga Kerja' : 'Analisa Risiko'}
                                                                            </h4>
                                                                            {index === 0 && journalFilter === 'all' && (
                                                                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Terbaru</span>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                                                                            <Calendar size={10} />
                                                                            {new Date(log.date).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                                                                            <span className="text-slate-300">•</span>
                                                                            <span className="group-open:hidden italic transition-opacity">Klik untuk perbesar</span>
                                                                            <span className="hidden group-open:inline italic text-blue-500">Membaca...</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <button
                                                                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition"
                                                                        title="Hapus Log"
                                                                        onClick={(e) => {
                                                                            e.preventDefault(); // Prevent accordion toggle
                                                                            if (window.confirm('Hapus log ini?')) {
                                                                                const currentLogs = (activeProject as any).aiLogs || [];
                                                                                const newLogs = currentLogs.filter((l: any) => l.id !== log.id);
                                                                                const updated = { ...activeProject, aiLogs: newLogs };
                                                                                if (updateProject) updateProject(updated);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                    <div className="text-slate-400 group-open:rotate-180 transition-transform duration-200">
                                                                        <TrendingUp size={16} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </summary>
                                                        <div className="px-4 pb-4 pt-0 border-t border-slate-100 mt-2">
                                                            <div className="mt-3 text-sm text-slate-600 whitespace-pre-wrap font-sans leading-relaxed animate-in fade-in slide-in-from-top-1">
                                                                {log.content}
                                                            </div>
                                                        </div>
                                                    </details>
                                                ))}

                                                {/* Show More Button */}
                                                {!journalExpanded && hasMore && (
                                                    <button
                                                        onClick={() => setJournalExpanded(true)}
                                                        className="w-full py-3 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition dashed border-dashed flex items-center justify-center gap-2"
                                                    >
                                                        <History size={14} />
                                                        Tampilkan {filteredLogs.length - 5} Analisa Lama Lainnya...
                                                    </button>
                                                )}

                                                {/* Collapse Button */}
                                                {journalExpanded && filteredLogs.length > 5 && (
                                                    <button
                                                        onClick={() => setJournalExpanded(false)}
                                                        className="w-full py-2 text-xs text-indigo-500 hover:text-indigo-700 transition"
                                                    >
                                                        Lipat Kembali
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })()}
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

                            {/* SCHEDULE ANALYSIS SECTION (HEADER - Separate from Journal) */}
                            {(activeProject.scheduleAnalysis || (activeProject as any).headerAnalysis) && (
                                <div className="lg:col-span-3">
                                    {(() => {
                                        // 1. Determine Content Source: headerAnalysis (auto) vs Manual
                                        const headerData = (activeProject as any).headerAnalysis;

                                        const contentToShow = headerData?.content || activeProject.scheduleAnalysis;
                                        const isAI = !!headerData;

                                        // Detect if data has changed since last generation
                                        const lastItemCount = headerData?.itemCount || 0;
                                        const currentItemCount = activeProject.rabItems?.length || 0;
                                        const isDataChanged = isAI && lastItemCount !== currentItemCount;


                                        return (
                                            <div className={`p-6 rounded-3xl border ${isAI ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-50 border-slate-200'} transition-all`}>
                                                <details className="group" open={true}>
                                                    <summary className="flex justify-between items-center font-bold text-slate-700 cursor-pointer list-none">
                                                        <div className="flex items-center gap-2">
                                                            {isAI ? <Sparkles size={20} className="text-indigo-600" /> : <Users size={20} className="text-orange-500" />}
                                                            <div className="flex flex-col">
                                                                <span className={isAI ? 'text-indigo-900' : 'text-slate-700'}>
                                                                    {isAI ? 'Analisa Kebutuhan Tenaga Kerja (AI)' : 'Analisa Manpower & Durasi (Estimasi Manual)'}
                                                                </span>
                                                                {isAI && <span className="text-[10px] font-normal text-indigo-500">{new Date(headerData.date).toLocaleString()} • Gemini AI</span>}
                                                                {isDataChanged && (
                                                                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold animate-pulse flex items-center gap-1">
                                                                        <AlertTriangle size={10} /> Data Berubah ({lastItemCount} → {currentItemCount} item)
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {/* AI Trigger Button in Header */}
                                                            {!isClientView && rabViewMode !== 'client' && (
                                                                <button
                                                                    onClick={async (e) => {
                                                                        e.preventDefault();
                                                                        const confirm = window.confirm("Refresh Analisa Kebutuhan Tenaga Kerja?\n\n(Disarankan jika ada perubahan item RAB)");
                                                                        if (!confirm) return;

                                                                        try {
                                                                            setIsGeneratingAI(true);
                                                                            const res = await generateAnalysisWithGemini(activeProject, activeProject.rabItems || []);

                                                                            // Save to headerAnalysis (SEPARATE from Journal)
                                                                            const headerData = {
                                                                                content: res,
                                                                                date: new Date().toISOString(),
                                                                                itemCount: activeProject.rabItems?.length || 0
                                                                            };

                                                                            if (updateProject) updateProject({ headerAnalysis: headerData } as any);
                                                                            alert("✅ Penjelasan Tenaga Kerja Diperbarui!");
                                                                        } catch (err: any) { alert("Gagal: " + err.message); }
                                                                        finally { setIsGeneratingAI(false); }
                                                                    }}
                                                                    disabled={isGeneratingAI}
                                                                    className={`px-3 py-1 rounded-full text-[10px] font-bold border transition flex items-center gap-1 ${isAI
                                                                        ? 'bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                                                                        : 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 shadow-md animate-pulse'}`}
                                                                >
                                                                    <Sparkles size={10} />
                                                                    {isGeneratingAI ? 'Thinking...' : (isAI ? 'Update Analisa' : '✨ Mulai Analisa AI')}
                                                                </button>
                                                            )}

                                                            {!isClientView && rabViewMode !== 'client' && !isEditingAnalysis && !isAI && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        setLocalAnalysis(activeProject.scheduleAnalysis || '');
                                                                        setIsEditingAnalysis(true);
                                                                    }}
                                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition"
                                                                    title="Edit Teks Manual"
                                                                >
                                                                    <Edit size={16} />
                                                                </button>
                                                            )}
                                                            <span className="transition group-open:rotate-180">
                                                                <TrendingUp size={16} />
                                                            </span>
                                                        </div>
                                                    </summary>

                                                    <div className="mt-4 pt-4 border-t border-slate-200/50">
                                                        {isEditingAnalysis && !isAI ? (
                                                            <div className="space-y-3">
                                                                <textarea
                                                                    value={localAnalysis}
                                                                    onChange={(e) => setLocalAnalysis(e.target.value)}
                                                                    className="w-full p-4 border border-slate-300 rounded-xl text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                    rows={12}
                                                                />
                                                                <div className="flex justify-end gap-2">
                                                                    <button
                                                                        onClick={() => setIsEditingAnalysis(false)}
                                                                        className="px-4 py-2 text-slate-600 font-bold text-xs hover:bg-white rounded-lg transition"
                                                                    >
                                                                        Batal
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            updateProject({ scheduleAnalysis: localAnalysis });
                                                                            setIsEditingAnalysis(false);
                                                                            alert("Analisa berhasil diperbarui.");
                                                                        }}
                                                                        className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 transition shadow-sm"
                                                                    >
                                                                        Simpan
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className={`text-sm ${isAI ? 'font-sans text-indigo-900 leading-relaxed' : 'font-mono text-slate-600'} whitespace-pre-wrap`}>
                                                                {contentToShow || (
                                                                    <div className="text-center py-4 text-slate-400 italic">
                                                                        Belum ada analisa. Klik tombol AI di atas untuk generate.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </details>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* WEEKLY REPORTS SECTION (NEW) */}
                            <div className="lg:col-span-3">
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                                <FileText size={20} className="text-blue-600" /> Laporan Progress Mingguan
                                            </h3>
                                            <p className="text-sm text-slate-500">Rekap deviasi dan trend progress proyek</p>
                                        </div>
                                        {(!isClientView && rabViewMode !== 'client' && handleGenerateWeeklyReport) && (
                                            <button
                                                onClick={() => {
                                                    const note = prompt("Masukkan Catatan / Evaluasi Minggu Ini:", "Progress berjalan lancar.");
                                                    if (note !== null) handleGenerateWeeklyReport(note);
                                                }}
                                                className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-blue-700 transition flex items-center gap-2 shadow-md active:scale-95"
                                            >
                                                <Plus size={16} /> Buat Laporan Minggu Ini
                                            </button>
                                        )}
                                    </div>

                                    {(!activeProject.weeklyReports || activeProject.weeklyReports.length === 0) ? (
                                        <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                            <p className="text-sm text-slate-400 font-medium">Belum ada laporan mingguan.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {[...activeProject.weeklyReports].sort((a, b) => b.weekNumber - a.weekNumber).map((report) => (
                                                <div key={report.id} className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-shadow relative overflow-hidden group">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="bg-slate-100 p-2 rounded-lg">
                                                                <Calendar size={18} className="text-slate-500" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-sm text-slate-800">Minggu ke-{report.weekNumber}</h4>
                                                                <span className="text-[10px] text-slate-500">{new Date(report.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {new Date(report.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                                            </div>
                                                        </div>
                                                        <div className={`text-[10px] font-bold px-2 py-1 rounded-full border ${report.trend === 'Improving' ? 'bg-green-50 text-green-700 border-green-200' :
                                                            report.trend === 'Worsening' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                'bg-slate-50 text-slate-600 border-slate-200'
                                                            }`}>
                                                            {report.trend === 'Improving' ? '📈 Membaik' :
                                                                report.trend === 'Worsening' ? '📉 Memburuk' : '➡️ Stabil'}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 mb-3 bg-slate-50 p-2 rounded-xl">
                                                        <div className="text-center">
                                                            <div className="text-[10px] text-slate-400 uppercase font-bold">Plan</div>
                                                            <div className="font-bold text-slate-700">{report.planProgress.toFixed(1)}%</div>
                                                        </div>
                                                        <div className="text-center border-l border-slate-200">
                                                            <div className="text-[10px] text-slate-400 uppercase font-bold">Real</div>
                                                            <div className="font-bold text-blue-600">{report.realProgress.toFixed(1)}%</div>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between items-center">
                                                        <div className="text-[10px] text-slate-400">
                                                            Deviasi: <span className={`font-bold ${report.deviation >= 0 ? 'text-green-600' : 'text-red-500'}`}>{report.deviation > 0 ? '+' : ''}{report.deviation.toFixed(1)}%</span>
                                                        </div>
                                                        {report.previousDeviation !== undefined && (
                                                            <div className="text-[10px] text-slate-400">
                                                                Prev: {report.previousDeviation.toFixed(1)}%
                                                            </div>
                                                        )}
                                                    </div>

                                                    {report.notes && (
                                                        <div className="mt-2 pt-2 border-t border-slate-100">
                                                            <p className="text-[10px] text-slate-500 italic">" {report.notes} "</p>
                                                        </div>
                                                    )}

                                                    {!isClientView && handleUpdateWeeklyReport && (
                                                        <button
                                                            onClick={() => {
                                                                const newNote = prompt("Edit Catatan Evaluasi:", report.notes || "");
                                                                if (newNote !== null) handleUpdateWeeklyReport(report.id, newNote);
                                                            }}
                                                            className="absolute top-2 right-2 p-1 text-slate-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Edit size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="lg:col-span-3">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 px-1">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-700">Rincian Pekerjaan (RAB)</h3>
                                        <p className="text-xs text-slate-400">Update progres pekerjaan di sini.</p>
                                    </div>
                                    {!isClientView && rabViewMode !== 'client' && canEditProject && (
                                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                            <button onClick={() => { setSelectedRabItem(null); openModal('newRAB'); }} className="flex-1 sm:flex-none text-xs bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-md active:scale-95 transition-transform flex items-center justify-center gap-1">
                                                <Plus size={16} /> Item Baru
                                            </button>
                                            <button onClick={() => { setModalType('importRAB'); setShowModal(true); }} className="text-xs bg-white text-slate-600 px-3 py-2.5 rounded-xl font-bold border shadow-sm hover:bg-slate-50 flex items-center gap-1"><Upload size={14} /></button>
                                            <button onClick={() => { setModalType('aiRAB'); setShowModal(true); }} className="text-xs bg-purple-50 text-purple-600 px-3 py-2.5 rounded-xl font-bold border border-purple-100 hover:bg-purple-100 flex items-center gap-1"><Sparkles size={14} /></button>
                                            {handleAutoSchedule && (
                                                <button onClick={handleAutoSchedule} className="text-xs bg-orange-50 text-orange-600 px-3 py-2.5 rounded-xl font-bold border border-orange-100 hover:bg-orange-100 flex items-center gap-1" title="Buat Jadwal Otomatis"><Calendar size={14} /></button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    {/* Empty State when no RAB items */}
                                    {(!activeProject.rabItems || activeProject.rabItems.length === 0) && (
                                        <div className="bg-white p-8 md:p-12 rounded-3xl border border-dashed border-slate-200 text-center">
                                            <Sparkles size={48} className="mx-auto text-slate-300 mb-4" />
                                            <h3 className="font-bold text-lg text-slate-700 mb-2">Belum Ada Item Pekerjaan</h3>
                                            <p className="text-sm text-slate-500 mb-6">Tambahkan item RAB untuk melihat progress dan Kurva-S</p>
                                            {!isClientView && canEditProject && (
                                                <button
                                                    onClick={() => { setSelectedRabItem(null); openModal('newRAB'); }}
                                                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm inline-flex items-center gap-2 hover:bg-blue-700"
                                                >
                                                    <Plus size={18} /> Tambah Item RAB
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    {(() => {
                                        // GROUPING LOGIC: Merge "Main - Sub" categories back together for display
                                        const mainCategories: Record<string, string[]> = {};
                                        const sortedKeys = Object.keys(rabGroups).sort();

                                        sortedKeys.forEach(cat => {
                                            const parts = cat.split(' - ');
                                            const main = parts[0];
                                            if (!mainCategories[main]) mainCategories[main] = [];
                                            mainCategories[main].push(cat);
                                        });

                                        return Object.keys(mainCategories).sort().map(mainCat => {
                                            const subCats = mainCategories[mainCat]; // Array of full category names belonging to this Main Header
                                            const totalMainItems = subCats.reduce((acc, sub) => acc + rabGroups[sub].length, 0);

                                            return (
                                                <div key={mainCat} className="bg-white rounded-3xl border shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] overflow-hidden mb-4">
                                                    {/* MAIN CATEGORY HEADER */}
                                                    <div className="bg-slate-50/80 p-4 border-b flex justify-between items-center backdrop-blur-sm">
                                                        <span className="font-bold text-slate-800 text-sm uppercase tracking-wide">{mainCat}</span>
                                                        <span className="text-[10px] font-bold bg-white px-2 py-1 rounded-lg text-slate-400 border shadow-sm">
                                                            {totalMainItems} Item
                                                        </span>
                                                    </div>

                                                    {/* SUB CATEGORIES LOOP */}
                                                    {subCats.map(fullCategoryName => {
                                                        const isSub = fullCategoryName.includes(' - ');
                                                        let subName = isSub ? fullCategoryName.split(' - ').slice(1).join(' - ') : '';
                                                        if (subName.includes('||')) subName = subName.split('||')[1];

                                                        return (
                                                            <div key={fullCategoryName}>
                                                                {/* SUB HEADER (Only show if it's a sub-category and there are multiple subgroups, or just styling preference) */}
                                                                {isSub && (
                                                                    <div className="bg-blue-50/30 px-4 py-2 border-b border-t border-slate-100 text-[11px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-2">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                                                        {subName}
                                                                    </div>
                                                                )}

                                                                {/* ITEMS LIST */}
                                                                {(!isClientView && rabViewMode === 'internal') && (
                                                                    <div className="divide-y divide-slate-100">
                                                                        {rabGroups[fullCategoryName].map(item => (
                                                                            <div key={item.id} className={`p-4 hover:bg-slate-50 transition-colors ${item.isAddendum ? 'bg-orange-50/50' : ''}`}>
                                                                                <div className="flex justify-between items-start mb-3">
                                                                                    <div className="flex-1 pr-2">
                                                                                        <div className="font-bold text-slate-800 text-sm mb-1 leading-snug">
                                                                                            {item.name}
                                                                                            {item.isAddendum && <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded ml-1 align-middle font-bold border border-orange-200">CCO</span>}
                                                                                            {(() => {
                                                                                                const logs = activeProject?.qcLogs?.filter(l => l.rabItemId === item.id).sort((a, b) => b.id - a.id);
                                                                                                const latest = logs?.[0];
                                                                                                if (!latest) return null;
                                                                                                return (
                                                                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ml-2 align-middle font-bold border flex-inline items-center gap-1 ${latest.status === 'Passed' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                                                                        {latest.status === 'Passed' ? <CheckCircle size={10} /> : <X size={10} />} QC {latest.status === 'Passed' ? 'OK' : 'Gagal'}
                                                                                                    </span>
                                                                                                );
                                                                                            })()}
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
                                                                                            className="flex-1 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl active:scale-95 transition-all hover:bg-blue-700 shadow-md shadow-blue-200 flex items-center justify-center gap-2"
                                                                                        >
                                                                                            <TrendingUp size={14} /> Update Progress
                                                                                        </button>
                                                                                        <button onClick={() => { setSelectedRabItem(item); setModalType('qcModal'); setShowModal(true); }} className="px-3 py-2 bg-green-50 text-green-600 rounded-xl active:scale-95 hover:bg-green-100 border border-green-200" title="Quality Control"><CheckCircle size={16} /></button>
                                                                                        <button onClick={() => { setSelectedRabItem(item); setModalType('taskHistory'); setShowModal(true); }} className="px-3 py-2 bg-slate-50 text-slate-500 rounded-xl active:scale-95 hover:bg-slate-100"><History size={16} /></button>
                                                                                        <button onClick={() => prepareEditRABItem(item)} className="px-3 py-2 bg-white text-slate-400 border rounded-xl active:scale-95 hover:text-yellow-500 hover:border-yellow-200"><Edit size={16} /></button>
                                                                                        <button onClick={(e) => { e.stopPropagation(); openDeleteConfirm(item.id, item.name); }} className="px-3 py-2 bg-white text-slate-400 border rounded-xl active:scale-95 hover:text-red-500 hover:border-red-200"><Trash2 size={16} /></button>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                {rabViewMode === 'client' && (
                                                                    <div className="divide-y divide-slate-100">
                                                                        {rabGroups[fullCategoryName].map(item => (
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
                                                                            <span className="text-sm">{formatRupiah(rabGroups[fullCategoryName].reduce((a, b) => a + (b.volume * b.unitPrice), 0))}</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Config WA Modal */}
                {showReportSettings && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl animate-in fade-in zoom-in duration-200">
                            <h3 className="font-bold text-lg text-slate-800 mb-4">Pengaturan Laporan WA</h3>
                            <div className="space-y-3 mb-6">
                                <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100">
                                    <input
                                        type="checkbox"
                                        checked={reportConfig.showAbsensi}
                                        onChange={(e) => setReportConfig({ ...reportConfig, showAbsensi: e.target.checked })}
                                        className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="font-medium text-slate-700">Tampilkan Absensi</span>
                                </label>
                                <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100">
                                    <input
                                        type="checkbox"
                                        checked={reportConfig.showMaterial}
                                        onChange={(e) => setReportConfig({ ...reportConfig, showMaterial: e.target.checked })}
                                        className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="font-medium text-slate-700">Tampilkan Material Masuk</span>
                                </label>
                                <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100">
                                    <input
                                        type="checkbox"
                                        checked={reportConfig.showCashflow}
                                        onChange={(e) => setReportConfig({ ...reportConfig, showCashflow: e.target.checked })}
                                        className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="font-medium text-slate-700">Tampilkan Cashflow Harian</span>
                                </label>
                                <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100">
                                    <input
                                        type="checkbox"
                                        checked={reportConfig.showLocation}
                                        onChange={(e) => setReportConfig({ ...reportConfig, showLocation: e.target.checked })}
                                        className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="font-medium text-slate-700">Tampilkan Link Lokasi</span>
                                </label>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowReportSettings(false)}
                                    className="flex-1 py-2.5 text-slate-500 font-bold hover:bg-slate-50 rounded-xl"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={() => saveReportConfig(reportConfig)}
                                    className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700"
                                >
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {
                    activeTab === 'finance' && canAccessFinance && (
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
                                <button
                                    onClick={() => setFinanceTab('invoices')}
                                    className={`flex-1 md:flex-none px-4 py-3 text-xs font-bold rounded-xl transition-all shadow-sm ${financeTab === 'invoices' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Invoice & Termin
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

                                    {/* SMART FINANCE ACTIONS */}
                                    {!isClientView && (
                                        <div className="bg-white p-5 rounded-3xl border shadow-sm mb-6 w-full overflow-hidden">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="font-bold text-slate-800">Aksi Keuangan</h3>
                                            </div>
                                            <div className="flex gap-4">
                                                <button
                                                    onClick={() => {
                                                        if (setTransactionType) setTransactionType('expense');
                                                        if (setTransactionCategory) setTransactionCategory('Material');
                                                        setModalType('newTransaction');
                                                        setShowModal(true);
                                                    }}
                                                    className="flex-1 bg-gradient-to-br from-red-600 to-red-700 text-white p-4 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex flex-col items-center justify-center gap-2 group"
                                                >
                                                    <div className="p-3 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
                                                        <Camera size={24} />
                                                    </div>
                                                    <div>
                                                        <span className="block text-sm">Catat Pengeluaran</span>
                                                        <span className="text-[10px] font-normal opacity-80">(Material/Upah)</span>
                                                    </div>
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        if (setTransactionType) setTransactionType('income');
                                                        if (setTransactionCategory) setTransactionCategory('Termin');
                                                        setModalType('newTransaction');
                                                        setShowModal(true);
                                                    }}
                                                    className="flex-1 bg-gradient-to-br from-green-600 to-green-700 text-white p-4 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex flex-col items-center justify-center gap-2 group"
                                                >
                                                    <div className="p-3 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
                                                        <TrendingUp size={24} />
                                                    </div>
                                                    <div>
                                                        <span className="block text-sm">Catat Pemasukan</span>
                                                        <span className="text-[10px] font-normal opacity-80">(DP/Termin)</span>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    )}

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

                                                        {/* Month Tabs - Flex Wrap (like navigation menu) */}
                                                        <div className="flex flex-wrap gap-2 px-2">
                                                            {filteredGroups.map((g) => (
                                                                <button
                                                                    key={g.monthLabel}
                                                                    onClick={() => setFinanceMonthTab(g.monthLabel)}
                                                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${activeKey === g.monthLabel
                                                                        ? 'bg-slate-800 text-white border-slate-800 shadow-md'
                                                                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                                                        }`}
                                                                >
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

                            {financeTab === 'invoices' && (
                                <InvoiceTerminSection
                                    project={activeProject}
                                    updateProject={updateProject}
                                />
                            )}
                        </div>
                    )
                }

                {
                    activeTab === 'workers' && canAccessWorkers && (
                        <div className="pb-24">
                            {/* Mobile Sub-Navigation */}
                            <div className="md:hidden flex gap-1 bg-slate-100 p-1 rounded-2xl w-full mb-6">
                                <button
                                    onClick={() => setWorkerSubTab('attendance')}
                                    className={`flex-1 px-3 py-2.5 text-[10px] font-bold rounded-xl transition-all shadow-sm ${workerSubTab === 'attendance' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Absensi
                                </button>
                                {userRole !== 'pengawas' && (
                                    <button
                                        onClick={() => setWorkerSubTab('list')}
                                        className={`flex-1 px-3 py-2.5 text-[10px] font-bold rounded-xl transition-all shadow-sm ${workerSubTab === 'list' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Pekerja
                                    </button>
                                )}
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
                                    {/* Worker List Section - Hidden for Pengawas */}
                                    {userRole !== 'pengawas' && (
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
                                    )}

                                    {/* Evidence Gallery Section */}
                                    <div className={`bg-white p-5 rounded-3xl border shadow-sm ${workerSubTab === 'list' ? 'hidden md:block' : ''}`}>
                                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><ImageIcon size={18} /> Galeri Bukti Absensi</h3>
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                            {getFilteredEvidence().map((ev: any) => (
                                                <div key={ev.id} className="relative rounded-2xl overflow-hidden border aspect-square group">
                                                    <img src={transformGDriveUrl(ev.photoUrl)} alt="Bukti" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-6 text-white translate-y-2 group-hover:translate-y-0 transition-transform">
                                                        <div className="text-[10px] font-medium opacity-80">{new Date(ev.date).toLocaleDateString('id-ID')}</div>
                                                        {ev.location && (
                                                            <a
                                                                href={`https://maps.google.com/?q=${ev.location}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-[10px] font-bold truncate flex items-center gap-1 hover:text-blue-300 transition-colors cursor-pointer"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <ExternalLink size={10} /> Lokasi
                                                            </a>
                                                        )}
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
                    )
                }

                {
                    activeTab === 'logistics' && (
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
                                                    <button
                                                        onClick={() => { setTransferMaterial(m); setTransferQty(1); setTransferTargetProject(''); setShowTransferModal(true); }}
                                                        className="p-2.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-200 hover:bg-purple-100 active:scale-95 transition-all shadow-sm"
                                                        title="Transfer ke Proyek Lain"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8L22 12L18 16" /><path d="M2 12H22" /><path d="M6 16L2 12L6 8" /></svg>
                                                    </button>
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
                    )
                }

                {
                    activeTab === 'gallery' && (
                        <ProjectGallery
                            project={activeProject}
                            updateProject={updateProject}
                            canEdit={!isClientView && (canEditProject || canAccessWorkers)}
                        />
                    )
                }

                {/* QUALITY CONTROL TAB */}
                {activeTab === 'quality' && (
                    <div className="space-y-6 pb-20 w-full max-w-full overflow-hidden">
                        {/* Defect List Section */}
                        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 w-full max-w-full overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                                <div>
                                    <h3 className="font-bold text-xl text-slate-800">Daftar Temuan (Defect List)</h3>
                                    <p className="text-sm text-slate-500">Catatan perbaikan dan komplain lapangan</p>
                                </div>
                                <button
                                    onClick={() => { setModalType('newDefect'); setShowModal(true); }}
                                    className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg hover:bg-red-700 flex items-center justify-center gap-2 w-full sm:w-auto"
                                >
                                    <Plus size={16} /> Tambah Catatan
                                </button>
                            </div>

                            <div className="space-y-3">
                                {activeProject.defects?.map((defect: any) => (
                                    <div key={defect.id} className="border rounded-2xl p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row gap-4">
                                        {defect.photoUrl && (
                                            <div className="shrink-0">
                                                <img src={defect.photoUrl} className="w-24 h-24 object-cover rounded-xl bg-slate-100 cursor-pointer hover:opacity-90" onClick={() => window.open(defect.photoUrl, '_blank')} />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${defect.status === 'Open' ? 'bg-red-100 text-red-600' : defect.status === 'Fixed' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                                    {defect.status}
                                                </span>
                                                <span className="text-xs text-slate-400">{new Date(defect.reportedDate).toLocaleDateString('id-ID')}</span>
                                            </div>
                                            <p className="font-bold text-slate-800 mb-1">{defect.description}</p>
                                            <div className="text-xs text-slate-500 flex flex-wrap gap-4 mb-3">
                                                <span>📍 {defect.location || '-'}</span>
                                                <span>👤 {defect.reportedBy}</span>
                                            </div>
                                            {/* Actions for Status Change */}
                                            <div className="flex gap-2">
                                                {defect.status === 'Open' && (
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Tandai sudah diperbaiki?')) {
                                                                handleUpdateDefectStatus?.(defect.id, 'Fixed');
                                                            }
                                                        }}
                                                        className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200"
                                                    >
                                                        Tandai Diperbaiki
                                                    </button>
                                                )}
                                                {defect.status === 'Fixed' && (
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Verifikasi OK?')) {
                                                                handleUpdateDefectStatus?.(defect.id, 'Verified');
                                                            }
                                                        }}
                                                        className="text-xs font-bold text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-lg border border-green-200"
                                                    >
                                                        Verifikasi Selesai
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!activeProject.defects || activeProject.defects.length === 0) && (
                                    <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border-dashed border-2 border-slate-200">
                                        <CheckCircle className="mx-auto mb-2 opacity-50" size={32} />
                                        <p>Tidak ada temuan defect. Kerja bagus!</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* QC Logs History */}
                        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 overflow-hidden max-w-full">
                            <h3 className="font-bold text-xl text-slate-800 mb-4">Riwayat Inspeksi QC</h3>
                            <div className="overflow-x-auto timeline-scroll -mx-4 sm:mx-0 px-4 sm:px-0">
                                <table className="w-full text-sm text-left min-w-[600px]">
                                    <thead className="bg-slate-50 text-slate-500 font-bold">
                                        <tr>
                                            <th className="p-3 rounded-l-xl whitespace-nowrap">Tanggal</th>
                                            <th className="p-3 whitespace-nowrap">Item Pekerjaan</th>
                                            <th className="p-3 whitespace-nowrap">Status</th>
                                            <th className="p-3 whitespace-nowrap">Inspektor</th>
                                            <th className="p-3 rounded-r-xl whitespace-nowrap">Catatan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {activeProject.qcLogs?.sort((a, b) => b.id - a.id).map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50">
                                                <td className="p-3 whitespace-nowrap">{new Date(log.date).toLocaleDateString()}</td>
                                                <td className="p-3 font-bold">{activeProject.rabItems?.find(r => r.id === log.rabItemId)?.name || '-'}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${log.status === 'Passed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {log.status === 'Passed' ? 'Lulus' : 'Gagal'}
                                                    </span>
                                                </td>
                                                <td className="p-3 whitespace-nowrap">{log.inspector}</td>
                                                <td className="p-3 text-slate-500 max-w-[200px] truncate">{log.notes}</td>
                                            </tr>
                                        ))}
                                        {(!activeProject.qcLogs || activeProject.qcLogs.length === 0) && (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-slate-400 italic">Belum ada data quality control.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {
                    activeTab === 'documents' && (
                        <DocumentsTab
                            activeProject={activeProject}
                            updateProject={updateProject}
                            canEditProject={canEditProject}
                        />
                    )
                }

                {/* Daily Report Modal - Combined PDF + WA */}
                {
                    showDailyReportModal && (
                        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
                                <div className="bg-green-700 text-white p-5">
                                    <h3 className="font-bold text-lg">Laporan Harian</h3>
                                    <p className="text-green-100 text-sm mt-1">Pilih tanggal, isi catatan, lalu pilih kirim via WA atau download PDF</p>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Tanggal Laporan</label>
                                        <input
                                            type="date"
                                            value={reportDate}
                                            onChange={(e) => setReportDate(e.target.value)}
                                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Catatan Harian (Opsional)</label>
                                        <textarea
                                            value={reportNote}
                                            onChange={(e) => setReportNote(e.target.value)}
                                            placeholder="Contoh: Cuaca cerah, pengerjaan berjalan lancar. Material semen tiba siang hari."
                                            rows={3}
                                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                                        />
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 border-t space-y-3">
                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                // Send via WhatsApp
                                                if (!activeProject.ownerPhone) {
                                                    alert("Nomor WA Owner belum diisi di Pengaturan Proyek!");
                                                    return;
                                                }
                                                const stats = calculateProjectHealth(activeProject);
                                                const clientLink = `${window.location.origin}?projectId=${activeProject.id}&mode=client`;
                                                let phone = activeProject.ownerPhone.replace(/\D/g, '');
                                                if (phone.startsWith('0')) phone = '62' + phone.substring(1);

                                                const dateFormatted = new Date(reportDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                                                const noteSection = reportNote ? `\n\n📝 *Catatan:*\n${reportNote}` : '';

                                                const msg = `*Laporan Harian: ${activeProject.name}*\n📅 ${dateFormatted}\n\n📈 Progress: ${stats.realProgress.toFixed(1)}%\n⚠️ Status: ${stats.issues.length ? stats.issues.join(', ') : 'On Track'}${noteSection}\n\n🔗 Portal Klien:\n${clientLink}`;

                                                window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                                                setShowDailyReportModal(false);
                                                setReportNote('');
                                            }}
                                            className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-green-600 shadow-lg hover:bg-green-700 flex items-center justify-center gap-2"
                                        >
                                            <ExternalLink size={16} /> Kirim WA
                                        </button>
                                        <button
                                            onClick={() => {
                                                generateDailyReport(activeProject, reportDate, reportNote);
                                                setShowDailyReportModal(false);
                                                setReportNote('');
                                            }}
                                            className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-orange-600 shadow-lg hover:bg-orange-700 flex items-center justify-center gap-2"
                                        >
                                            <FileText size={16} /> Download PDF
                                        </button>
                                    </div>
                                    {/* Cancel Button */}
                                    <button
                                        onClick={() => {
                                            setShowDailyReportModal(false);
                                            setReportNote('');
                                        }}
                                        className="w-full py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors text-sm"
                                    >
                                        Batal
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Transfer Material Modal */}
                {
                    showTransferModal && transferMaterial && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
                                <div className="p-6 border-b bg-purple-50">
                                    <h3 className="font-bold text-xl text-slate-800">Transfer Material</h3>
                                    <p className="text-sm text-slate-500">Pindahkan stok ke proyek lain</p>
                                </div>

                                <div className="p-6 space-y-4">
                                    {/* Material Info */}
                                    <div className="bg-slate-50 p-4 rounded-2xl">
                                        <div className="text-sm text-slate-500 mb-1">Material</div>
                                        <div className="font-bold text-slate-800 text-lg">{transferMaterial.name}</div>
                                        <div className="text-sm text-slate-500">Stok tersedia: <span className="font-bold text-blue-600">{transferMaterial.stock} {transferMaterial.unit}</span></div>
                                    </div>

                                    {/* Quantity Input */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 mb-2 block">Jumlah yang akan ditransfer</label>
                                        <input
                                            type="number"
                                            value={transferQty}
                                            onChange={(e) => setTransferQty(Math.min(transferMaterial.stock, Math.max(0, parseInt(e.target.value) || 0)))}
                                            className="w-full p-3 border rounded-xl text-sm focus:border-purple-400 focus:outline-none"
                                            min={1}
                                            max={transferMaterial.stock}
                                        />
                                    </div>

                                    {/* Target Project Selection */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 mb-2 block">Proyek Tujuan</label>
                                        <select
                                            value={transferTargetProject}
                                            onChange={(e) => setTransferTargetProject(e.target.value)}
                                            className="w-full p-3 border rounded-xl text-sm focus:border-purple-400 focus:outline-none bg-white"
                                        >
                                            <option value="">-- Pilih Proyek --</option>
                                            {projects
                                                .filter(p => p.id !== activeProject.id && !p.isDeleted)
                                                .map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))
                                            }
                                        </select>
                                        {projects.filter(p => p.id !== activeProject.id && !p.isDeleted).length === 0 && (
                                            <p className="text-xs text-red-500 mt-2">Tidak ada proyek lain yang tersedia untuk transfer.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 border-t flex gap-3">
                                    <button
                                        onClick={() => setShowTransferModal(false)}
                                        className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        disabled={!transferTargetProject || transferQty <= 0 || isTransferring}
                                        onClick={async () => {
                                            if (!handleTransferMaterial || !transferMaterial) return;
                                            const targetProject = projects.find(p => p.id === transferTargetProject);
                                            if (!targetProject) return;

                                            setIsTransferring(true);
                                            try {
                                                await handleTransferMaterial(
                                                    activeProject.id,
                                                    transferTargetProject,
                                                    transferMaterial,
                                                    transferQty,
                                                    `Transfer ke ${targetProject.name}`,
                                                    new Date().toISOString().split('T')[0],
                                                    targetProject.name
                                                );
                                                setShowTransferModal(false);
                                            } catch (e) {
                                                console.error(e);
                                            }
                                            setIsTransferring(false);
                                        }}
                                        className="flex-[2] py-3 px-4 rounded-xl font-bold text-white bg-purple-600 shadow-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isTransferring ? (
                                            <><Package size={16} className="animate-spin" /> Memproses...</>
                                        ) : (
                                            <><Package size={16} /> Transfer Sekarang</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div>

            {/* FULLSCREEN TIMELINE MODAL - Landscape Mode for Mobile */}
            {
                showFullscreenTimeline && (
                    <div className="fixed inset-0 z-[100] bg-white">
                        {/* Rotated container for landscape view on portrait phone */}
                        <div
                            className="absolute inset-0 origin-center"
                            style={{
                                // Rotate 90deg on portrait phones, use viewport height as width
                                transform: 'rotate(90deg)',
                                width: '100vh',
                                height: '100vw',
                                top: 'calc((100vh - 100vw) / 2)',
                                left: 'calc((100vw - 100vh) / 2)',
                            }}
                        >
                            {/* Header */}
                            <div className="h-12 bg-slate-800 text-white flex items-center justify-between px-4 shadow-lg">
                                <h3 className="font-bold flex items-center gap-2">
                                    <History size={18} /> Timeline: {activeProject.name}
                                </h3>
                                <button
                                    onClick={() => setShowFullscreenTimeline(false)}
                                    className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold"
                                >
                                    <Minimize2 size={16} /> Tutup
                                </button>
                            </div>

                            {/* Timeline Content */}
                            <div className="flex-1 overflow-auto bg-white" style={{ height: 'calc(100% - 48px)' }}>
                                {(() => {
                                    const pStart = new Date(activeProject.startDate).getTime();
                                    const pEnd = new Date(activeProject.endDate).getTime();
                                    const durationDays = Math.ceil((pEnd - pStart) / (1000 * 60 * 60 * 24));
                                    const totalWeeks = Math.max(4, Math.ceil(durationDays / 7));
                                    const totalDuration = pEnd - pStart;

                                    const groups = activeProject.rabItems.reduce((acc: any, item: any) => {
                                        const cat = item.category || 'Tanpa Kategori';
                                        if (!acc[cat]) acc[cat] = [];
                                        acc[cat].push(item);
                                        return acc;
                                    }, {});

                                    // Calculate aggregate timeline per category
                                    const categoryTimelines: Record<string, { startOffset: number, width: number, avgProgress: number }> = {};
                                    Object.keys(groups).forEach(cat => {
                                        const items = groups[cat];
                                        let minStart = Infinity;
                                        let maxEnd = -Infinity;
                                        let totalProgress = 0;
                                        let itemCount = 0;

                                        items.forEach((item: any) => {
                                            if (item.startDate && item.endDate) {
                                                const iStart = new Date(item.startDate).getTime();
                                                const iEnd = new Date(item.endDate).getTime();
                                                if (iStart < minStart) minStart = iStart;
                                                if (iEnd > maxEnd) maxEnd = iEnd;
                                            }
                                            totalProgress += (item.progress || 0);
                                            itemCount++;
                                        });

                                        if (minStart !== Infinity && maxEnd !== -Infinity && totalDuration > 0) {
                                            const startOffset = Math.max(0, ((minStart - pStart) / totalDuration) * 100);
                                            const width = Math.min(100 - startOffset, ((maxEnd - minStart) / totalDuration) * 100);
                                            categoryTimelines[cat] = {
                                                startOffset,
                                                width: Math.max(5, width),
                                                avgProgress: itemCount > 0 ? totalProgress / itemCount : 0
                                            };
                                        } else {
                                            categoryTimelines[cat] = { startOffset: 0, width: 20, avgProgress: itemCount > 0 ? totalProgress / itemCount : 0 };
                                        }
                                    });

                                    // Build rows with collapse state (reuse main collapsedCategories state)
                                    const allRows: Array<{ type: 'header' | 'item', data: any, catTimeline?: any }> = [];
                                    Object.keys(groups).sort().forEach(cat => {
                                        const isCollapsed = collapsedCategories[cat] !== false;
                                        allRows.push({
                                            type: 'header',
                                            data: cat,
                                            catTimeline: categoryTimelines[cat]
                                        });
                                        if (!isCollapsed) {
                                            groups[cat].forEach((item: any) => {
                                                allRows.push({ type: 'item', data: item });
                                            });
                                        }
                                    });

                                    return (
                                        <div className="grid grid-cols-[140px_1fr] h-full">
                                            {/* Left Column - Labels */}
                                            <div className="bg-slate-50 border-r border-slate-200 overflow-y-auto">
                                                <div className="h-10 border-b border-slate-200 px-3 flex items-center font-bold text-xs text-slate-500 bg-slate-100 sticky top-0">
                                                    Item Pekerjaan
                                                </div>
                                                {allRows.map((row, idx) => (
                                                    row.type === 'header' ? (
                                                        <div
                                                            key={`h-${idx}`}
                                                            onClick={() => toggleCategory(row.data)}
                                                            className="h-7 flex items-center px-3 text-[10px] font-bold text-slate-500 bg-slate-200/50 uppercase tracking-wider cursor-pointer hover:bg-slate-300/50 select-none"
                                                        >
                                                            <span className="transform transition-transform duration-200 mr-2" style={{ transform: collapsedCategories[row.data] === false ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                                                                ▼
                                                            </span>
                                                            <span className="truncate">{row.data}</span>
                                                        </div>
                                                    ) : (
                                                        <div key={row.data.id} className="h-7 flex items-center px-3 pl-6 text-[11px] font-medium text-slate-700 truncate border-b border-slate-100">
                                                            {row.data.name}
                                                        </div>
                                                    )
                                                ))}
                                            </div>

                                            {/* Right Column - Gantt Bars */}
                                            <div className="overflow-auto">
                                                <div className="min-w-max">
                                                    {/* Week Headers */}
                                                    <div className="h-10 border-b border-slate-200 flex items-center bg-slate-50 sticky top-0">
                                                        {[...Array(totalWeeks)].map((_, i) => (
                                                            <div key={i} className="w-16 flex-shrink-0 border-l border-slate-200 first:border-l-0 text-[10px] text-slate-400 pl-2 py-1">
                                                                Mgg {i + 1}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Data Rows */}
                                                    {allRows.map((row, idx) => {
                                                        if (row.type === 'header') {
                                                            // Category aggregate timeline bar
                                                            const catTimeline = row.catTimeline || { startOffset: 0, width: 20, avgProgress: 0 };
                                                            return (
                                                                <div
                                                                    key={`h-${idx}`}
                                                                    className="h-7 bg-slate-100/50 border-b border-slate-100 flex items-center px-2 cursor-pointer hover:bg-slate-200/50"
                                                                    style={{ width: `${totalWeeks * 64}px` }}
                                                                    onClick={() => toggleCategory(row.data)}
                                                                >
                                                                    <div className="flex-1 relative h-4 bg-slate-200/80 rounded-full overflow-hidden">
                                                                        <div
                                                                            className="absolute top-0 bottom-0 bg-slate-400 opacity-40"
                                                                            style={{ left: `${catTimeline.startOffset}%`, width: `${catTimeline.width}%` }}
                                                                        />
                                                                        <div
                                                                            className="absolute top-0 bottom-0 bg-slate-600"
                                                                            style={{ left: `${catTimeline.startOffset}%`, width: `${catTimeline.width * (catTimeline.avgProgress / 100)}%` }}
                                                                        >
                                                                            {catTimeline.width * (catTimeline.avgProgress / 100) > 10 && (
                                                                                <span className="text-[8px] text-white px-1 font-bold flex items-center h-full">
                                                                                    {catTimeline.avgProgress.toFixed(0)}%
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }

                                                        const item = row.data;
                                                        let startOffset = 0;
                                                        let width = 15;

                                                        if (item.startDate && item.endDate && totalDuration > 0) {
                                                            const iStart = new Date(item.startDate).getTime();
                                                            const iEnd = new Date(item.endDate).getTime();
                                                            startOffset = Math.max(0, ((iStart - pStart) / totalDuration) * 100);
                                                            width = Math.max(5, ((iEnd - iStart) / totalDuration) * 100);
                                                            if (startOffset + width > 100) width = 100 - startOffset;
                                                        }

                                                        return (
                                                            <div key={item.id} className="h-7 flex items-center px-2 border-b border-slate-100" style={{ width: `${totalWeeks * 64}px` }}>
                                                                <div className="flex-1 relative h-4 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`absolute top-0 bottom-0 opacity-40 ${['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500'][idx % 4]}`}
                                                                        style={{ left: `${startOffset}%`, width: `${width}%` }}
                                                                    />
                                                                    <div
                                                                        className={`absolute top-0 bottom-0 ${['bg-blue-600', 'bg-green-600', 'bg-orange-600', 'bg-purple-600'][idx % 4]}`}
                                                                        style={{ left: `${startOffset}%`, width: `${width * (item.progress / 100)}%` }}
                                                                    >
                                                                        {width * (item.progress / 100) > 10 && (
                                                                            <span className="text-[8px] text-white px-1 font-bold flex items-center h-full">
                                                                                {item.progress}%
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Material Transfer Modal */}
            <MaterialTransferModal
                isOpen={showModal && modalType === 'transferMaterial'}
                onClose={() => setShowModal(false)}
                activeProject={activeProject}
                projects={projects}
                onTransfer={handleTransferMaterial || (async () => { })}
            />

            {/* NEW: Magic RAB Modal */}
            <MagicRabModal
                isOpen={showMagicRab}
                onClose={() => setShowMagicRab(false)}
                onSave={(newItems) => {
                    updateProject({ rabItems: [...(activeProject.rabItems || []), ...newItems] });
                }}
            />

            {/* Prompt Generator (Floating) */}
            <PromptGenerator project={activeProject} />

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} className="text-red-600" />
                            </div>
                            <h3 className="font-bold text-lg text-slate-800 mb-2">Hapus Item RAB?</h3>
                            <p className="text-sm text-slate-500">
                                <span className="font-semibold text-slate-700">"{deleteItemName}"</span>
                                <br />akan dihapus permanen. Lanjutkan?
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowDeleteConfirm(false); setDeleteItemId(null); setDeleteItemName(''); }}
                                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmDeleteRAB}
                                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors shadow-md"
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    </>);
};

export default ProjectDetailView;

