import React from 'react';
import { Building2, ArrowLeft, Trash2, Settings, Plus, LogOut } from 'lucide-react';
import type { User } from 'firebase/auth'; // Importing type-only
import type { UserRole } from '../types';

interface HeaderProps {
    view: string;
    setView: (view: any) => void;
    activeTab?: string;
    setActiveTab?: (tab: string) => void;
    user: User | null;
    userRole: UserRole | null;
    openModal: (type: string) => void;
    handleLogout: () => void;
    canAccessManagement: boolean;
    canEditProject: boolean;
}

const Header: React.FC<HeaderProps> = ({
    view, setView, activeTab, setActiveTab, user, userRole, openModal, handleLogout,
    canAccessManagement, canEditProject
}) => {
    const handleBack = () => {
        if (view === 'project-detail' && activeTab && activeTab !== 'dashboard' && setActiveTab) {
            setActiveTab('dashboard');
        } else {
            setView('project-list');
        }
    };

    return (
        <header className="bg-white px-4 py-3 sticky top-0 z-10 shadow-sm flex justify-between items-center print:hidden">
            {view === 'project-list' ? (
                <div className="flex items-center gap-2 font-bold text-slate-800 md:hidden">
                    <Building2 className="text-blue-600" />
                    <div className="flex flex-col">
                        <span>Kontraktor App</span>
                        {user && <span className="text-[10px] text-slate-400 font-normal uppercase">{userRole?.replace('_', ' ')}: {user.displayName?.split(' ')[0]}</span>}
                    </div>
                </div>
            ) : (
                <button onClick={handleBack} className="text-slate-500 flex items-center gap-1 text-sm">
                    <ArrowLeft size={18} /> Kembali
                </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
                {view === 'project-list' && userRole !== 'pengawas' && (
                    <button onClick={() => setView('trash-bin')} className="md:hidden text-slate-400 p-2 hover:text-red-500">
                        <Trash2 size={20} />
                    </button>
                )}
                {canAccessManagement && view === 'project-list' && (
                    <button onClick={() => setView('user-management')} className="text-slate-500 p-2 bg-slate-100 rounded-full hover:bg-slate-200 md:hidden">
                        <Settings size={18} />
                    </button>
                )}
                {view === 'project-list' && canEditProject && (
                    <button onClick={() => openModal('newProject')} className="bg-blue-600 text-white px-3 py-2 rounded-full shadow flex items-center gap-2 text-sm font-bold md:hidden">
                        <Plus size={18} /> <span className="hidden sm:inline">Proyek Baru</span>
                    </button>
                )}
                <button onClick={handleLogout} className="text-red-500 p-2 bg-red-50 rounded-full hover:bg-red-100 md:hidden">
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
};

export default Header;
