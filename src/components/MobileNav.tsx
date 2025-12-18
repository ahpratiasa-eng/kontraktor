import React from 'react';
import { LayoutDashboard, FolderKanban, FileSpreadsheet, BarChart3 } from 'lucide-react';
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

const MobileNav: React.FC<MobileNavProps> = ({ view, setView, userRole, isClientView, isHidden = false }) => {
    if (isHidden) return null; // Hide if requested (e.g. modal open)

    const canAccessFinance = () => ['super_admin', 'kontraktor', 'keuangan'].includes(userRole || '');
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
    return null;
};

export default MobileNav;

