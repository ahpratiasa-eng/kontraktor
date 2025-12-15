import React from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import type { Project } from '../types';

interface TrashBinViewProps {
    projects: Project[];
    onRestore: (project: Project) => void;
    onDeletePermanent: (project: Project) => void;
    canAccessManagement: boolean;
}

const TrashBinView: React.FC<TrashBinViewProps> = ({
    projects,
    onRestore,
    onDeletePermanent,
    canAccessManagement
}) => {
    const deletedProjects = projects.filter(p => p.isDeleted);

    return (
        <main className="space-y-4">
            <h2 className="font-bold text-2xl text-slate-800 mb-6">Tong Sampah Proyek</h2>

            {deletedProjects.length === 0 && (
                <div className="text-center py-20 text-slate-400 bg-white rounded-xl border border-dashed">
                    Tong sampah kosong.
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deletedProjects.map(p => (
                    <div key={p.id} className="bg-red-50 p-6 rounded-xl border border-red-100 flex flex-col justify-between h-full">
                        <div className="mb-4">
                            <h3 className="font-bold text-lg text-slate-800">{p.name}</h3>
                            <p className="text-sm text-slate-500">{p.client}</p>
                        </div>
                        <div className="flex gap-2 mt-auto">
                            <button
                                onClick={() => onRestore(p)}
                                className="flex-1 bg-green-100 text-green-700 p-2 rounded-lg text-sm font-bold hover:bg-green-200 flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={16} /> Pulihkan
                            </button>
                            {canAccessManagement && (
                                <button
                                    onClick={() => onDeletePermanent(p)}
                                    className="flex-1 bg-red-200 text-red-800 p-2 rounded-lg text-sm font-bold hover:bg-red-300 flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={16} /> Hapus
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
};

export default TrashBinView;
