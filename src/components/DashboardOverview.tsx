import React from 'react';
import { TrendingUp, TrendingDown, Building2, Package, Wallet, ArrowRight } from 'lucide-react';
import type { Project } from '../types';
import type { ViewType } from '../hooks/useModalManager';
import { formatRupiah, getStats } from '../utils/helpers';

interface DashboardOverviewProps {
    projects: Project[];
    setView: (view: ViewType) => void;
    setActiveProjectId: (id: string) => void;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ projects, setView, setActiveProjectId }) => {
    // Filter active projects (not deleted)
    const activeProjects = projects.filter(p => !p.isDeleted);

    // Calculate statistics
    const totalProjects = activeProjects.length;
    const ongoingProjects = activeProjects.filter(p => p.status === 'Berjalan').length;
    const completedProjects = activeProjects.filter(p => p.status === 'Selesai').length;

    // Financial stats
    const totalBudget = activeProjects.reduce((sum, p) => sum + (p.budgetLimit || 0), 0);
    const totalIncome = activeProjects.reduce((sum, p) =>
        sum + (p.transactions || []).filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0), 0
    );
    const totalExpense = activeProjects.reduce((sum, p) =>
        sum + (p.transactions || []).filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0), 0
    );

    // Average progress
    const avgProgress = totalProjects > 0
        ? activeProjects.reduce((sum, p) => sum + getStats(p).prog, 0) / totalProjects
        : 0;

    // Low stock materials across all projects
    const lowStockItems = activeProjects.flatMap(p =>
        (p.materials || [])
            .filter(m => m.stock <= m.minStock)
            .map(m => ({ ...m, projectName: p.name, projectId: p.id }))
    );

    // Recent projects (last 5)
    const recentProjects = activeProjects.slice(0, 5);

    return (
        <div className="space-y-6 pb-20">
            {/* Page Title */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
                <p className="text-slate-500">Ringkasan bisnis konstruksi Anda</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3">
                        <div className="bg-blue-100 p-2 sm:p-2.5 rounded-xl shrink-0">
                            <Building2 size={18} className="text-blue-600" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Total Proyek</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-800">{totalProjects}</div>
                    <div className="text-[10px] sm:text-xs text-slate-500 mt-1">
                        <span className="text-green-600 font-bold">{ongoingProjects}</span> berjalan ·
                        <span className="text-blue-600 font-bold ml-1">{completedProjects}</span> selesai
                    </div>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3">
                        <div className="bg-green-100 p-2 sm:p-2.5 rounded-xl shrink-0">
                            <TrendingUp size={18} className="text-green-600" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pemasukan</span>
                    </div>
                    <div className="text-base sm:text-2xl font-black text-green-600 truncate">{formatRupiah(totalIncome)}</div>
                    <div className="text-[10px] sm:text-xs text-slate-500 mt-1">Dari semua proyek</div>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3">
                        <div className="bg-red-100 p-2 sm:p-2.5 rounded-xl shrink-0">
                            <TrendingDown size={18} className="text-red-600" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pengeluaran</span>
                    </div>
                    <div className="text-base sm:text-2xl font-black text-red-600 truncate">{formatRupiah(totalExpense)}</div>
                    <div className="text-[10px] sm:text-xs text-slate-500 mt-1">Dari semua proyek</div>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3">
                        <div className="bg-purple-100 p-2 sm:p-2.5 rounded-xl shrink-0">
                            <Wallet size={18} className="text-purple-600" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Sisa Kas</span>
                    </div>
                    <div className={`text-base sm:text-2xl font-black truncate ${totalIncome - totalExpense >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                        {formatRupiah(totalIncome - totalExpense)}
                    </div>
                    <div className="text-[10px] sm:text-xs text-slate-500 mt-1">Pemasukan - Pengeluaran</div>
                </div>
            </div>

            {/* Progress & Alerts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Average Progress */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-3xl shadow-lg text-white">
                    <h3 className="text-sm font-bold text-blue-200 uppercase tracking-wider mb-4">Rata-rata Progress</h3>
                    <div className="flex items-end gap-4">
                        <div className="text-5xl font-black">{avgProgress.toFixed(0)}%</div>
                        <div className="flex-1">
                            <div className="w-full bg-blue-500/50 rounded-full h-3 mb-2">
                                <div
                                    className="bg-white rounded-full h-3 transition-all duration-500"
                                    style={{ width: `${avgProgress}%` }}
                                />
                            </div>
                            <p className="text-xs text-blue-200">Dari {totalProjects} proyek aktif</p>
                        </div>
                    </div>
                </div>

                {/* Low Stock Alert */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <Package size={18} className="text-orange-500" />
                            Stok Menipis
                        </h3>
                        {lowStockItems.length > 0 && (
                            <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                                {lowStockItems.length} item
                            </span>
                        )}
                    </div>
                    {lowStockItems.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {lowStockItems.slice(0, 5).map((item, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-2 bg-red-50 rounded-xl cursor-pointer hover:bg-red-100 transition-colors"
                                    onClick={() => { setActiveProjectId(item.projectId); setView('project-detail'); }}
                                >
                                    <div>
                                        <div className="font-bold text-slate-700 text-sm">{item.name}</div>
                                        <div className="text-[10px] text-slate-500">{item.projectName}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-red-600 font-bold text-sm">{item.stock} {item.unit}</div>
                                        <div className="text-[10px] text-slate-400">Min: {item.minStock}</div>
                                    </div>
                                </div>
                            ))}
                            {lowStockItems.length > 5 && (
                                <div className="text-center text-xs text-slate-400 pt-2">
                                    +{lowStockItems.length - 5} item lainnya
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-slate-400">
                            <Package size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Semua stok aman</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Projects */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-700">Proyek Terbaru</h3>
                    <button
                        onClick={() => setView('project-list')}
                        className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:text-blue-800"
                    >
                        Lihat Semua <ArrowRight size={14} />
                    </button>
                </div>
                <div className="space-y-3">
                    {recentProjects.map(project => {
                        const stats = getStats(project);
                        return (
                            <div
                                key={project.id}
                                onClick={() => { setActiveProjectId(project.id); setView('project-detail'); }}
                                className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-800 truncate">{project.name}</div>
                                    <div className="text-xs text-slate-500">{project.client} · {project.location}</div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-lg font-bold ${stats.prog >= 100 ? 'text-green-600' : 'text-blue-600'}`}>
                                        {stats.prog.toFixed(0)}%
                                    </div>
                                    <div className="text-[10px] text-slate-400 uppercase font-bold">{project.status}</div>
                                </div>
                            </div>
                        );
                    })}
                    {recentProjects.length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                            <Building2 size={40} className="mx-auto mb-2 opacity-50" />
                            <p>Belum ada proyek</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Stats Footer */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-3xl text-white">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Nilai Kontrak Total</h3>
                <div className="text-3xl font-black">{formatRupiah(totalBudget)}</div>
                <p className="text-sm text-slate-400 mt-1">Dari {totalProjects} proyek</p>
            </div>
        </div>
    );
};

export default DashboardOverview;
