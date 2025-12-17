import React from 'react';
import { LayoutDashboard, Wallet, Users, Package, TrendingUp, ImageIcon, FolderKanban, FileSpreadsheet, BarChart3, FileText } from 'lucide-react';
import type { UserRole } from '../types';
import type { ViewType } from '../hooks/useModalManager';

interface MobileNavProps {
    view: string;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    setView?: (view: ViewType) => void;
    userRole: UserRole | null;
    isClientView?: boolean;
    canViewKurvaS?: boolean; // Pengawas tidak bisa lihat Kurva S
    isHidden?: boolean;
}

const MobileNav: React.FC<MobileNavProps> = ({ view, activeTab, setActiveTab, setView, userRole, isClientView, canViewKurvaS = true, isHidden = false }) => {
    if (isHidden) return null; // Hide if requested (e.g. modal open)

    const canAccessFinance = () => ['super_admin', 'kontraktor', 'keuangan'].includes(userRole || '');
    const canAccessWorkers = () => ['super_admin', 'kontraktor', 'pengawas'].includes(userRole || '');
    const canEditProject = () => userRole === 'super_admin' || userRole === 'kontraktor';

    // Main views (dashboard, project-list, analytics): Show main navigation
    if ((view === 'dashboard' || view === 'project-list' || view === 'analytics') && !isClientView && setView) {
        return (
            <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-white/10 z-50 print:hidden transition-all duration-300 safe-area-bottom">
                <div className="flex justify-around items-center px-4 py-3">
                    <button
                        onClick={() => setView('dashboard')}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 ${view === 'dashboard' ? 'text-blue-400 scale-110' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <LayoutDashboard size={view === 'dashboard' ? 24 : 20} strokeWidth={view === 'dashboard' ? 2.5 : 2} />
                        <span className={`text-[10px] font-bold ${view === 'dashboard' ? '' : 'opacity-70'}`}>Dashboard</span>
                    </button>

                    <button
                        onClick={() => setView('project-list')}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 ${view === 'project-list' ? 'text-blue-400 scale-110' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <FolderKanban size={view === 'project-list' ? 24 : 20} strokeWidth={view === 'project-list' ? 2.5 : 2} />
                        <span className={`text-[10px] font-bold ${view === 'project-list' ? '' : 'opacity-70'}`}>Proyek</span>
                    </button>

                    {canAccessFinance() && (
                        <button
                            onClick={() => setView('analytics')}
                            className={`flex flex-col items-center gap-1 transition-all duration-300 ${view === 'analytics' ? 'text-blue-400 scale-110' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <BarChart3 size={view === 'analytics' ? 24 : 20} strokeWidth={view === 'analytics' ? 2.5 : 2} />
                            <span className={`text-[10px] font-bold ${view === 'analytics' ? '' : 'opacity-70'}`}>Analytics</span>
                        </button>
                    )}

                    {canEditProject() && (
                        <button
                            onClick={() => setView('ahs-library')}
                            className="flex flex-col items-center gap-1 transition-all duration-300 text-slate-400 hover:text-slate-200"
                        >
                            <FileSpreadsheet size={20} strokeWidth={2} />
                            <span className="text-[10px] font-bold opacity-70">AHS</span>
                        </button>
                    )}
                </div>
            </nav>
        );
    }

    // Non project-detail views don't need bottom nav
    if (view !== 'project-detail') return null;

    // Client View: Only show Ringkasan, Kurva S, and Galeri
    if (isClientView) {
        return (
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t pb-safe z-40 print:hidden shadow-lg">
                <div className="max-w-md mx-auto flex justify-around px-2">
                    <button onClick={() => setActiveTab('dashboard')} className={`p-3 flex-1 flex flex-col items-center ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}>
                        <LayoutDashboard size={22} /><span className="text-[10px] mt-1 font-medium">Ringkasan</span>
                    </button>
                    <button onClick={() => setActiveTab('progress')} className={`p-3 flex-1 flex flex-col items-center ${activeTab === 'progress' ? 'text-blue-600' : 'text-slate-400'}`}>
                        <TrendingUp size={22} /><span className="text-[10px] mt-1 font-medium">Kurva S</span>
                    </button>
                    <button onClick={() => setActiveTab('gallery')} className={`p-3 flex-1 flex flex-col items-center ${activeTab === 'gallery' ? 'text-blue-600' : 'text-slate-400'}`}>
                        <ImageIcon size={22} /><span className="text-[10px] mt-1 font-medium">Galeri</span>
                    </button>
                </div>
            </nav>
        );
    }

    // Regular View: Full navigation (with Kurva S restriction for pengawas)
    return (
        <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-white/10 z-50 print:hidden transition-all duration-300 safe-area-bottom overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 overflow-x-auto no-scrollbar gap-2">
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'dashboard' ? 'text-blue-400 scale-110' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <LayoutDashboard size={activeTab === 'dashboard' ? 24 : 20} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
                    {activeTab === 'dashboard' && <span className="text-[10px] font-bold">Home</span>}
                </button>

                {canAccessFinance() && (
                    <button
                        onClick={() => setActiveTab('finance')}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'finance' ? 'text-blue-400 scale-110' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <Wallet size={activeTab === 'finance' ? 24 : 20} strokeWidth={activeTab === 'finance' ? 2.5 : 2} />
                        {activeTab === 'finance' && <span className="text-[10px] font-bold">Uang</span>}
                    </button>
                )}

                {canAccessWorkers() && (
                    <button
                        onClick={() => setActiveTab('workers')}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'workers' ? 'text-blue-400 scale-110' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <Users size={activeTab === 'workers' ? 24 : 20} strokeWidth={activeTab === 'workers' ? 2.5 : 2} />
                        {activeTab === 'workers' && <span className="text-[10px] font-bold">Tim</span>}
                    </button>
                )}

                <button
                    onClick={() => setActiveTab('logistics')}
                    className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'logistics' ? 'text-blue-400 scale-110' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <Package size={activeTab === 'logistics' ? 24 : 20} strokeWidth={activeTab === 'logistics' ? 2.5 : 2} />
                    {activeTab === 'logistics' && <span className="text-[10px] font-bold">Stok</span>}
                </button>

                {/* Pengawas tidak bisa lihat Kurva S */}
                {canViewKurvaS && (
                    <button
                        onClick={() => setActiveTab('progress')}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'progress' ? 'text-blue-400 scale-110' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <TrendingUp size={activeTab === 'progress' ? 24 : 20} strokeWidth={activeTab === 'progress' ? 2.5 : 2} />
                        {activeTab === 'progress' && <span className="text-[10px] font-bold">Kurva S</span>}
                    </button>
                )}

                <button
                    onClick={() => setActiveTab('gallery')}
                    className={`flex flex-col items-center gap-1 transition-all duration-300 min-w-[50px] ${activeTab === 'gallery' ? 'text-blue-400 scale-110' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <ImageIcon size={activeTab === 'gallery' ? 24 : 20} strokeWidth={activeTab === 'gallery' ? 2.5 : 2} />
                    {activeTab === 'gallery' && <span className="text-[10px] font-bold">Galeri</span>}
                </button>

                {canEditProject() && (
                    <button
                        onClick={() => setActiveTab('documents')}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 min-w-[50px] ${activeTab === 'documents' ? 'text-blue-400 scale-110' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <FileText size={activeTab === 'documents' ? 24 : 20} strokeWidth={activeTab === 'documents' ? 2.5 : 2} />
                        {activeTab === 'documents' && <span className="text-[10px] font-bold">Dokumen</span>}
                    </button>
                )}
            </div>
        </nav>
    );
};

export default MobileNav;

