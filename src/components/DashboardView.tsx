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
        <main className="space-y-6">
            <div className="hidden md:block mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Dashboard Proyek</h1>
                <p className="text-slate-500">Selamat datang kembali, {user?.displayName}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col">
                    <span className="text-xs text-slate-500 uppercase font-bold">Total Proyek</span>
                    <span className="text-2xl font-bold text-slate-800">{activeProjects.length}</span>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col">
                    <span className="text-xs text-slate-500 uppercase font-bold">Berjalan</span>
                    <span className="text-2xl font-bold text-blue-600">{running}</span>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col">
                    <span className="text-xs text-slate-500 uppercase font-bold">Selesai</span>
                    <span className="text-2xl font-bold text-green-600">{finished}</span>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col">
                    <span className="text-xs text-slate-500 uppercase font-bold">Perlu Perhatian</span>
                    <span className="text-2xl font-bold text-red-600">{critical}</span>
                </div>
            </div>

            {activeProjects.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 bg-slate-50">
                    <p className="mb-4">Belum ada proyek aktif.</p>
                    <button onClick={loadDemoData} disabled={isSyncing} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-green-700 shadow-lg flex items-center gap-2 mx-auto transition-transform hover:scale-105">
                        {isSyncing ? <Loader2 className="animate-spin" /> : <RefreshCw size={18} />} Muat Data Demo 1 Milyar
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeProjects.map(p => {
                    const health = calculateProjectHealth(p);
                    const stats = getStats(p);
                    return (
                        <div key={p.id} onClick={() => { setActiveProjectId(p.id); setView('project-detail'); }} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all group relative overflow-hidden">
                            <div className="absolute top-2 right-2 flex flex-col gap-1 items-end pt-1">
                                {health.issues.length === 0 && <span className="bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded font-bold border border-green-200 shadow-sm">AMAN</span>}
                                {health.issues.includes('Terlambat') && <span className="bg-yellow-100 text-yellow-800 text-[10px] px-2 py-1 rounded font-bold border border-yellow-200 shadow-sm flex items-center gap-1"><Clock size={10} /> TERLAMBAT</span>}
                                {health.issues.includes('Boncos') && <span className="bg-red-100 text-red-700 text-[10px] px-2 py-1 rounded font-bold border border-red-200 shadow-sm flex items-center gap-1"><TrendingDown size={10} /> BONCOS</span>}
                                {health.issues.includes('Overdue') && <span className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded font-bold border border-slate-600 shadow-sm flex items-center gap-1"><AlertTriangle size={10} /> OVERDUE</span>}
                            </div>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-xl text-slate-800 group-hover:text-blue-600 transition-colors">{p.name}</h3>
                                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><Users size={14} /> {p.client}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-slate-600"><span>Progress Fisik</span><span className="font-bold">{stats.prog.toFixed(0)}%</span></div>
                                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-1000 ${health.isCritical ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${stats.prog}%` }}></div>
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                                <div className="text-xs text-slate-400">Update: {new Date().toLocaleDateString('id-ID')}</div>
                                {canEditProject && (
                                    <button onClick={(e) => { e.stopPropagation(); handleSoftDeleteProject(p); }} className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </main>
    );
};

export default DashboardView;
