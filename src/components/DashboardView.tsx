import React from 'react';
import {
    Users, AlertTriangle, Trash2, Loader2, RefreshCw,
    Clock, TrendingDown, CheckCircle
} from 'lucide-react';
import type { Project } from '../types';
import type { User } from 'firebase/auth';
import { calculateProjectHealth, getStats } from '../utils/helpers';

interface DashboardViewProps {
    user: User | null;
    projects: Project[];
    setActiveProjectId: (id: string) => void;
    setView: (view: any) => void;
    isSyncing: boolean;
    loadDemoData: () => void;
    canEditProject: boolean;
    handleSoftDeleteProject: (p: Project) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({
    user, projects, setActiveProjectId, setView, isSyncing,
    loadDemoData, canEditProject, handleSoftDeleteProject
}) => {
    const activeProjects = projects.filter(p => !p.isDeleted);
    const running = activeProjects.filter(p => p.status !== 'Selesai').length;
    const finished = activeProjects.filter(p => p.status === 'Selesai').length;
    const critical = activeProjects.filter(p => calculateProjectHealth(p).isCritical).length;

    return (
        <main className="pb-28">
            {/* Header / Welcome Section */}
            <div className="mb-6 flex justify-between items-start">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-800">Dashboard Proyek</h1>
                    <p className="text-sm text-slate-500">Selamat Pagi, {user?.displayName?.split(' ')[0]}</p>
                </div>
                <div className="bg-slate-100 p-2.5 rounded-full shrink-0">
                    <Users size={20} className="text-slate-600" />
                </div>
            </div>

            {/* Summary Cards - 2x2 Grid on Mobile, 4 cols on Desktop */}
            <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-start gap-1">
                    <div className="p-1.5 md:p-2 bg-blue-50 rounded-lg text-blue-600"><RefreshCw size={14} /></div>
                    <span className="text-xl md:text-2xl font-bold text-slate-800">{activeProjects.length}</span>
                    <span className="text-[9px] md:text-[10px] font-medium text-slate-400 uppercase tracking-wide">Total Proyek</span>
                </div>
                <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-start gap-1">
                    <div className="p-1.5 md:p-2 bg-blue-50 rounded-lg text-blue-600"><Loader2 size={14} /></div>
                    <span className="text-xl md:text-2xl font-bold text-blue-600">{running}</span>
                    <span className="text-[9px] md:text-[10px] font-medium text-slate-400 uppercase tracking-wide">Berjalan</span>
                </div>
                <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-start gap-1">
                    <div className="p-1.5 md:p-2 bg-green-50 rounded-lg text-green-600"><CheckCircle size={14} /></div>
                    <span className="text-xl md:text-2xl font-bold text-green-600">{finished}</span>
                    <span className="text-[9px] md:text-[10px] font-medium text-slate-400 uppercase tracking-wide">Selesai</span>
                </div>
                <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-start gap-1">
                    <div className="p-1.5 md:p-2 bg-red-50 rounded-lg text-red-600"><AlertTriangle size={14} /></div>
                    <span className="text-xl md:text-2xl font-bold text-red-600">{critical}</span>
                    <span className="text-[9px] md:text-[10px] font-medium text-slate-400 uppercase tracking-wide">Perlu Perhatian</span>
                </div>
            </div>

            {/* Empty State */}
            {activeProjects.length === 0 && (
                <div className="text-center py-12 px-6 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 bg-slate-50">
                    <TrendingDown size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="mb-6 font-medium">Belum ada proyek aktif.</p>
                    <button onClick={loadDemoData} disabled={isSyncing} className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95">
                        {isSyncing ? <Loader2 className="animate-spin" /> : <RefreshCw size={20} />} Muat Data Demo
                    </button>
                </div>
            )}

            {/* Project List */}
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="font-bold text-lg text-slate-800">Daftar Proyek</h2>
                    <span className="text-xs text-blue-600 font-bold cursor-pointer">{activeProjects.length} Proyek</span>
                </div>

                {activeProjects.map(p => {
                    const health = calculateProjectHealth(p);
                    const stats = getStats(p);
                    // Calculate budget stats
                    const totalExpense = (p.transactions || [])
                        .filter(t => t.type === 'expense')
                        .reduce((sum, t) => sum + t.amount, 0);
                    const budgetUsedPercent = p.budgetLimit > 0 ? Math.min((totalExpense / p.budgetLimit) * 100, 100) : 0;
                    const isOverbudget = totalExpense > p.budgetLimit && p.budgetLimit > 0;

                    // Mock update message if none exists
                    const lastUpdate = "Struktur atap mulai dipasang pagi ini.";

                    return (
                        <div
                            key={p.id}
                            onClick={() => { setActiveProjectId(p.id); setView('project-detail'); }}
                            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 active:scale-[0.98] transition-all cursor-pointer relative"
                        >
                            {/* Header - Name and Status */}
                            <div className="flex items-start justify-between gap-2 mb-3">
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
                                        {p.name.substring(0, 1)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-bold text-sm text-slate-800 leading-tight truncate">{p.name}</h3>
                                        <p className="text-[11px] text-slate-500 truncate">{p.client}</p>
                                    </div>
                                </div>
                                {health.issues.length === 0 ? (
                                    <span className="bg-green-100 text-green-700 text-[8px] px-2 py-1 rounded-full font-bold whitespace-nowrap shrink-0">
                                        On Track
                                    </span>
                                ) : (
                                    <span className={`text-[8px] px-2 py-1 rounded-full font-bold whitespace-nowrap shrink-0 ${health.issues.includes('Terlambat') ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {health.issues[0]}
                                    </span>
                                )}
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-2">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-slate-400 font-medium uppercase tracking-wider text-[9px]">Progress</span>
                                    <span className="font-bold text-slate-800 text-xs">{stats.prog.toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${health.isCritical ? 'bg-red-500' : 'bg-blue-600'}`}
                                        style={{ width: `${stats.prog}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Budget Bar - Only show if budget exists */}
                            {p.budgetLimit > 0 && (
                                <div className="mb-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-slate-400 font-medium uppercase tracking-wider text-[9px]">Budget</span>
                                        <span className={`font-bold text-[9px] ${isOverbudget ? 'text-red-600' : 'text-slate-600'}`}>
                                            {isOverbudget ? 'OVER!' : `${budgetUsedPercent.toFixed(0)}%`}
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${isOverbudget ? 'bg-red-500' : 'bg-green-500'}`}
                                            style={{ width: `${budgetUsedPercent}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {/* Footer / Last Update */}
                            <div className="flex items-center gap-1.5 pt-2 mt-1 border-t border-slate-100">
                                <Clock size={10} className="text-slate-400 shrink-0" />
                                <span className="text-[9px] text-slate-400 truncate">{lastUpdate}</span>
                            </div>

                            {/* Trash Button for Edit Mode */}
                            {canEditProject && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleSoftDeleteProject(p); }}
                                    className="absolute top-3 right-3 text-slate-300 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-full transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>
        </main>
    );
};

export default DashboardView;

