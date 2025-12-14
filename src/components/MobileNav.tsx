import React from 'react';
import { LayoutDashboard, Wallet, Users, Package, TrendingUp } from 'lucide-react';
import type { UserRole } from '../types';

interface MobileNavProps {
    view: string;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    userRole: UserRole | null;
}

const MobileNav: React.FC<MobileNavProps> = ({ view, activeTab, setActiveTab, userRole }) => {
    if (view !== 'project-detail') return null;

    const canAccessFinance = () => ['super_admin', 'kontraktor', 'keuangan'].includes(userRole || '');
    const canAccessWorkers = () => ['super_admin', 'kontraktor', 'pengawas'].includes(userRole || '');

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t pb-safe z-40 print:hidden">
            <div className="max-w-md mx-auto flex justify-between px-2">
                <button onClick={() => setActiveTab('dashboard')} className={`p-2 flex-1 flex flex-col items-center ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}>
                    <LayoutDashboard size={20} /><span className="text-[10px]">Home</span>
                </button>
                {canAccessFinance() && (
                    <button onClick={() => setActiveTab('finance')} className={`p-2 flex-1 flex flex-col items-center ${activeTab === 'finance' ? 'text-blue-600' : 'text-slate-400'}`}>
                        <Wallet size={20} /><span className="text-[10px]">Uang</span>
                    </button>
                )}
                {canAccessWorkers() && (
                    <button onClick={() => setActiveTab('workers')} className={`p-2 flex-1 flex flex-col items-center ${activeTab === 'workers' ? 'text-blue-600' : 'text-slate-400'}`}>
                        <Users size={20} /><span className="text-[10px]">Tim</span>
                    </button>
                )}
                <button onClick={() => setActiveTab('logistics')} className={`p-2 flex-1 flex flex-col items-center ${activeTab === 'logistics' ? 'text-blue-600' : 'text-slate-400'}`}>
                    <Package size={20} /><span className="text-[10px]">Stok</span>
                </button>
                <button onClick={() => setActiveTab('progress')} className={`p-2 flex-1 flex flex-col items-center ${activeTab === 'progress' ? 'text-blue-600' : 'text-slate-400'}`}>
                    <TrendingUp size={20} /><span className="text-[10px]">Kurva S</span>
                </button>
            </div>
        </nav>
    );
};

export default MobileNav;
