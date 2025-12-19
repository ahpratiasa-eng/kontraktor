import React from 'react';
import { Building2, Plus, LayoutDashboard, Users, Trash2, LogOut, FileSpreadsheet, FolderKanban, BarChart3, Key } from 'lucide-react';
import type { UserRole } from '../types';

interface SidebarProps {
    view: string;
    setView: (view: any) => void;
    openModal: (type: string) => void;
    handleLogout: () => void;
    userRole: UserRole | null;
    originalRole?: UserRole | null; // New prop
    impersonateRole?: (role: UserRole | null) => void; // New prop
}

const Sidebar: React.FC<SidebarProps> = ({ view, setView, openModal, handleLogout, userRole, originalRole, impersonateRole }) => {
    const canAccessManagement = () => userRole === 'super_admin';
    const canEditProject = () => userRole === 'super_admin' || userRole === 'kontraktor';
    const canAccessFinance = () => ['super_admin', 'kontraktor', 'keuangan'].includes(userRole || '');

    // Only show switcher if the REAL user is super_admin
    const showRoleSwitcher = originalRole === 'super_admin' || userRole === 'super_admin';

    return (
        <aside className="hidden md:flex flex-col w-64 bg-white border-r fixed inset-y-0 z-20 print:hidden">
            <div className="p-6 border-b flex items-center gap-2 font-bold text-xl text-slate-800">
                <Building2 className="text-blue-600" /> Guna Karya
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {canEditProject() && (
                    <button onClick={() => openModal('newProject')} className="w-full bg-blue-600 text-white p-3 rounded-lg flex items-center gap-2 font-bold hover:bg-blue-700 mb-4">
                        <Plus size={20} /> Proyek Baru
                    </button>
                )}
                {userRole !== 'pengawas' && (
                    <button onClick={() => setView('dashboard')} className={`w-full text-left p-3 rounded-lg flex items-center gap-2 ${view === 'dashboard' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                        <LayoutDashboard size={20} /> Dashboard
                    </button>
                )}
                <button onClick={() => setView('project-list')} className={`w-full text-left p-3 rounded-lg flex items-center gap-2 ${view === 'project-list' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <FolderKanban size={20} /> Daftar Proyek
                </button>
                {canAccessFinance() && (
                    <button onClick={() => setView('analytics')} className={`w-full text-left p-3 rounded-lg flex items-center gap-2 ${view === 'analytics' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                        <BarChart3 size={20} /> Analytics
                    </button>
                )}
                {canEditProject() && (
                    <button onClick={() => setView('ahs-library')} className={`w-full text-left p-3 rounded-lg flex items-center gap-2 ${view === 'ahs-library' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                        <FileSpreadsheet size={20} /> Library AHS
                    </button>
                )}
                {canAccessManagement() && (
                    <button onClick={() => setView('user-management')} className={`w-full text-left p-3 rounded-lg flex items-center gap-2 ${view === 'user-management' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                        <Users size={20} /> User Management
                    </button>
                )}
                {canAccessManagement() && (
                    <button onClick={() => setView('landing-settings')} className={`w-full text-left p-3 rounded-lg flex items-center gap-2 ${view === 'landing-settings' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                        <Building2 size={20} /> Landing Page
                    </button>
                )}
                {canAccessManagement() && (
                    <button onClick={() => setView('api-keys')} className={`w-full text-left p-3 rounded-lg flex items-center gap-2 ${view === 'api-keys' ? 'bg-amber-50 text-amber-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                        <Key size={20} /> API Keys
                    </button>
                )}
                {userRole !== 'pengawas' && (
                    <button onClick={() => setView('trash-bin')} className={`w-full text-left p-3 rounded-lg flex items-center gap-2 ${view === 'trash-bin' ? 'bg-red-50 text-red-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                        <Trash2 size={20} /> Tong Sampah
                    </button>
                )}
            </div>

            <div className="p-4 border-t space-y-3">
                {/* Role Switcher for Super Admin */}
                {showRoleSwitcher && impersonateRole && (
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                        <p className="text-xs text-slate-500 font-bold mb-1 uppercase">Impersonate Role</p>
                        <select
                            value={userRole || ''}
                            onChange={(e) => impersonateRole(e.target.value as UserRole)}
                            className="w-full text-xs p-1 border rounded bg-white"
                        >
                            <option value="super_admin">Super Admin</option>
                            <option value="kontraktor">Kontraktor</option>
                            <option value="pengawas">Pengawas</option>
                            <option value="keuangan">Keuangan</option>
                        </select>
                    </div>
                )}

                <button onClick={handleLogout} className="w-full border border-red-200 text-red-600 p-2 rounded-lg text-sm flex items-center justify-center gap-2">
                    <LogOut size={16} /> Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
