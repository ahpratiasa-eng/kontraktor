import React from 'react';
import {
    Users, AlertTriangle, Trash2, Loader2, RefreshCw,
    Clock, TrendingDown
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
        <main className="pb-24">
            {/* Header / Welcome Section */}
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Dashboard Proyek</h1>
                    <p className="text-sm text-slate-500">Selamat Pagi, {user?.displayName?.split(' ')[0]}</p>
                </div>
                <div className="bg-slate-100 p-2 rounded-full">
                    <Users size={20} className="text-slate-600" />
                </div>
            </div>

            {/* Summary Cards - Horizontal Scroll on Mobile */}
            <div className="mb-8 overflow-x-auto pb-4 -mx-4 px-4 flex gap-4 snap-x hide-scrollbar">
                <div className="min-w-[140px] bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-start gap-2 snap-start">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600 mb-1"><RefreshCw size={18} /></div>
                    <span className="text-3xl font-bold text-slate-800">{activeProjects.length}</span>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Total Proyek</span>
                </div>
                <div className="min-w-[140px] bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-start gap-2 snap-start">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600 mb-1"><Loader2 size={18} /></div>
                    <span className="text-3xl font-bold text-blue-600">{running}</span>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Sedang Berjalan</span>
                </div>
                <div className="min-w-[140px] bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-start gap-2 snap-start">
                    <div className="p-2 bg-green-50 rounded-lg text-green-600 mb-1"><RefreshCw size={18} /></div>
                    <span className="text-3xl font-bold text-green-600">{finished}</span>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Selesai</span>
                </div>
                <div className="min-w-[140px] bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-start gap-2 snap-start">
                    <div className="p-2 bg-red-50 rounded-lg text-red-600 mb-1"><AlertTriangle size={18} /></div>
                    <span className="text-3xl font-bold text-red-600">{critical}</span>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Perlu Perhatian</span>
                </div>
            </div>

            {/* Empty State */}
            {activeProjects.length === 0 && (
                <div className="text-center py-12 px-6 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 bg-slate-50 mx-4">
                    <TrendingDown size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="mb-6 font-medium">Belum ada proyek aktif.</p>
                    <button onClick={loadDemoData} disabled={isSyncing} className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95">
                        {isSyncing ? <Loader2 className="animate-spin" /> : <RefreshCw size={20} />} Muat Data Demo
                    </button>
                </div>
            )}

            {/* Project List */}
            <div className="space-y-4 px-1">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="font-bold text-lg text-slate-800">Daftar Proyek</h2>
                    <span className="text-xs text-blue-600 font-bold cursor-pointer">Lihat Semua</span>
                </div>

                {activeProjects.map(p => {
                    const health = calculateProjectHealth(p);
                    const stats = getStats(p);
                    // Mock update message if none exists
                    const lastUpdate = "Struktur atap mulai dipasang pagi ini.";

                    return (
                        <div
                            key={p.id}
                            onClick={() => { setActiveProjectId(p.id); setView('project-detail'); }}
                            className="bg-white p-5 rounded-3xl shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] border border-slate-100 active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden group"
                        >
                            {/* Card Decoration */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full -mr-4 -mt-4 opacity-50"></div>

                            {/* Header */}
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                        {p.name.substring(0, 1)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800 leading-tight">{p.name}</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">{p.client}</p>
                                    </div>
                                </div>

                                {health.issues.length === 0 ? (
                                    <span className="bg-green-100 text-green-700 text-[10px] px-3 py-1.5 rounded-full font-bold shadow-sm">
                                        On Schedule
                                    </span>
                                ) : (
                                    <span className={`text-[10px] px-3 py-1.5 rounded-full font-bold shadow-sm flex items-center gap-1 ${health.issues.includes('Terlambat') ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {health.issues[0]}
                                    </span>
                                )}
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-4 relative z-10">
                                <div className="flex justify-between text-xs mb-2">
                                    <span className="text-slate-400 font-medium uppercase tracking-wider">Progress Fisik</span>
                                    <span className="font-bold text-slate-800 text-lg">{stats.prog.toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${health.isCritical ? 'bg-red-500' : 'bg-blue-600'}`}
                                        style={{ width: `${stats.prog}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Footer / Last Update */}
                            <div className="flex items-center gap-2 pt-4 border-t border-slate-50 relative z-10">
                                <Clock size={14} className="text-slate-400" />
                                <span className="text-xs text-slate-500 line-clamp-1 italic">{lastUpdate}</span>
                            </div>

                            {/* Trash Button for Edit Mode */}
                            {canEditProject && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleSoftDeleteProject(p); }}
                                    className="absolute bottom-4 right-4 text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors z-20"
                                >
                                    <Trash2 size={18} />
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
