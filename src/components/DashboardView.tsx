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
    // State for Search and Filter
    const [searchQuery, setSearchQuery] = React.useState('');
    const [filterStatus, setFilterStatus] = React.useState<'all' | 'active' | 'completed' | 'critical'>('all');
    const [visibleCount, setVisibleCount] = React.useState(10); // Simple pagination: Show 10 initially

    const activeProjects = projects.filter(p => !p.isDeleted);

    // Calculate stats outside to ensure they are correct regardless of filters
    const runningCount = activeProjects.filter(p => p.status !== 'Selesai').length;
    const finishedCount = activeProjects.filter(p => p.status === 'Selesai').length;
    const criticalCount = activeProjects.filter(p => calculateProjectHealth(p).isCritical).length;

    // Apply Filters and Search
    const filteredProjects = activeProjects.filter(p => {
        // 1. Search Filter
        const query = searchQuery.toLowerCase();
        const matchesSearch = p.name.toLowerCase().includes(query) ||
            p.client.toLowerCase().includes(query) ||
            p.location?.toLowerCase().includes(query);

        // 2. Status Filter
        let matchesStatus = true;
        if (filterStatus === 'active') matchesStatus = p.status !== 'Selesai';
        if (filterStatus === 'completed') matchesStatus = p.status === 'Selesai';
        if (filterStatus === 'critical') matchesStatus = calculateProjectHealth(p).isCritical;

        return matchesSearch && matchesStatus;
    });

    const displayedProjects = filteredProjects.slice(0, visibleCount);

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

            {/* Smart Filtering Summary Cards */}
            <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                    onClick={() => setFilterStatus('all')}
                    className={`p-3 md:p-4 rounded-2xl shadow-sm border text-left transition-all ${filterStatus === 'all' ? 'bg-slate-800 border-slate-800 ring-2 ring-slate-200' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                >
                    <div className={`p-1.5 md:p-2 rounded-lg w-fit mb-1 ${filterStatus === 'all' ? 'bg-slate-700 text-white' : 'bg-blue-50 text-blue-600'}`}><RefreshCw size={14} /></div>
                    <span className={`text-xl md:text-2xl font-bold ${filterStatus === 'all' ? 'text-white' : 'text-slate-800'}`}>{activeProjects.length}</span>
                    <span className={`text-[9px] md:text-[10px] font-medium uppercase tracking-wide ${filterStatus === 'all' ? 'text-slate-400' : 'text-slate-400'}`}>Total Proyek</span>
                </button>

                <button
                    onClick={() => setFilterStatus('active')}
                    className={`p-3 md:p-4 rounded-2xl shadow-sm border text-left transition-all ${filterStatus === 'active' ? 'bg-blue-600 border-blue-600 ring-2 ring-blue-100' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                >
                    <div className={`p-1.5 md:p-2 rounded-lg w-fit mb-1 ${filterStatus === 'active' ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-600'}`}><Loader2 size={14} /></div>
                    <span className={`text-xl md:text-2xl font-bold ${filterStatus === 'active' ? 'text-white' : 'text-blue-600'}`}>{runningCount}</span>
                    <span className={`text-[9px] md:text-[10px] font-medium uppercase tracking-wide ${filterStatus === 'active' ? 'text-blue-100' : 'text-slate-400'}`}>Berjalan</span>
                </button>

                <button
                    onClick={() => setFilterStatus('completed')}
                    className={`p-3 md:p-4 rounded-2xl shadow-sm border text-left transition-all ${filterStatus === 'completed' ? 'bg-green-600 border-green-600 ring-2 ring-green-100' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                >
                    <div className={`p-1.5 md:p-2 rounded-lg w-fit mb-1 ${filterStatus === 'completed' ? 'bg-green-500 text-white' : 'bg-green-50 text-green-600'}`}><CheckCircle size={14} /></div>
                    <span className={`text-xl md:text-2xl font-bold ${filterStatus === 'completed' ? 'text-white' : 'text-green-600'}`}>{finishedCount}</span>
                    <span className={`text-[9px] md:text-[10px] font-medium uppercase tracking-wide ${filterStatus === 'completed' ? 'text-green-100' : 'text-slate-400'}`}>Selesai</span>
                </button>

                <button
                    onClick={() => setFilterStatus('critical')}
                    className={`p-3 md:p-4 rounded-2xl shadow-sm border text-left transition-all ${filterStatus === 'critical' ? 'bg-red-600 border-red-600 ring-2 ring-red-100' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                >
                    <div className={`p-1.5 md:p-2 rounded-lg w-fit mb-1 ${filterStatus === 'critical' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-600'}`}><AlertTriangle size={14} /></div>
                    <span className={`text-xl md:text-2xl font-bold ${filterStatus === 'critical' ? 'text-white' : 'text-red-600'}`}>{criticalCount}</span>
                    <span className={`text-[9px] md:text-[10px] font-medium uppercase tracking-wide ${filterStatus === 'critical' ? 'text-red-100' : 'text-slate-400'}`}>Perlu Perhatian</span>
                </button>
            </div>

            {/* Empty State (Global) */}
            {activeProjects.length === 0 && (
                <div className="text-center py-12 px-6 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 bg-slate-50">
                    <TrendingDown size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="mb-6 font-medium">Belum ada proyek aktif.</p>
                    <button onClick={loadDemoData} disabled={isSyncing} className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95">
                        {isSyncing ? <Loader2 className="animate-spin" /> : <RefreshCw size={20} />} Muat Data Demo
                    </button>
                </div>
            )}

            {/* Search and Project List */}
            {activeProjects.length > 0 && (
                <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
                        <div className="relative w-full md:w-96">
                            <input
                                type="text"
                                placeholder="Cari proyek, klien, atau lokasi..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
                            />
                            <div className="absolute left-4 top-3.5 text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            </div>
                        </div>
                        <span className="text-xs text-slate-500 font-bold self-end md:self-auto hidden md:block">
                            Menampilkan {displayedProjects.length} dari {activeProjects.length} Proyek
                        </span>
                    </div>

                    {/* Filtered Empty State */}
                    {displayedProjects.length === 0 && (
                        <div className="text-center py-12 px-6 rounded-2xl bg-white border border-dashed border-slate-200 text-slate-400">
                            <p>Tidak ditemukan proyek dengan kata kunci "{searchQuery}"</p>
                            <button onClick={() => { setSearchQuery(''); setFilterStatus('all'); }} className="text-blue-600 font-bold text-sm mt-2 hover:underline">Reset Filter</button>
                        </div>
                    )}

                    {displayedProjects.map(p => {
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
                                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 active:scale-[0.98] transition-all cursor-pointer relative hover:shadow-md"
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

                    {/* Load More Button */}
                    {filteredProjects.length > visibleCount && (
                        <button
                            onClick={() => setVisibleCount(prev => prev + 10)}
                            className="w-full py-3 text-sm font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all"
                        >
                            Tampilkan Lebih Banyak ({filteredProjects.length - visibleCount} lagi)
                        </button>
                    )}
                </div>
            )}
        </main>
    );
};


export default DashboardView;

