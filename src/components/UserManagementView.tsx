import React from 'react';
import { ShieldCheck, UserPlus, Trash2 } from 'lucide-react';
import type { AppUser } from '../types';

interface UserManagementViewProps {
    appUsers: AppUser[];
    currentUser: any; // Using any to match current App usage securely
    onDeleteUser: (email: string) => void;
    onAddUser: () => void;
}

const UserManagementView: React.FC<UserManagementViewProps> = ({
    appUsers,
    currentUser,
    onDeleteUser,
    onAddUser
}) => {
    return (
        <main className="space-y-6">
            <div className="bg-blue-600 text-white p-8 rounded-2xl shadow-lg mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="font-bold text-2xl flex items-center gap-2">
                        <ShieldCheck size={28} /> Kelola Akses Pengguna
                    </h2>
                </div>
                <button
                    onClick={onAddUser}
                    className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-50 shadow-md"
                >
                    <UserPlus size={20} /> Tambah User
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {appUsers.map((u) => (
                    <div key={u.email} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-lg mb-2">
                                    {u.name.charAt(0)}
                                </div>
                                <p className="font-bold text-lg text-slate-800">{u.name}</p>
                                <p className="text-sm text-slate-500">{u.email}</p>
                            </div>
                            {u.email !== currentUser?.email && (
                                <button
                                    onClick={() => onDeleteUser(u.email)}
                                    className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors"
                                >
                                    <Trash2 size={20} />
                                </button>
                            )}
                        </div>
                        <span className="self-start text-xs px-3 py-1 rounded-full font-bold bg-blue-100 text-blue-700 uppercase">
                            {u.role.replace('_', ' ')}
                        </span>
                    </div>
                ))}
            </div>
        </main>
    );
};

export default UserManagementView;
