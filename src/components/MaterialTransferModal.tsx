import React, { useState } from 'react';
import { Truck, X, Loader2, ArrowRight } from 'lucide-react';
import type { Project, Material, MaterialLog } from '../types';

interface MaterialTransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeProject: Project;
    projects: Project[];
    onTransfer: (
        sourceProjectId: string,
        targetProjectId: string,
        item: Material,
        qty: number,
        notes: string,
        date: string
    ) => Promise<void>;
}

const MaterialTransferModal: React.FC<MaterialTransferModalProps> = ({ isOpen, onClose, activeProject, projects, onTransfer }) => {
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
    const [targetProjectId, setTargetProjectId] = useState<string>('');
    const [quantity, setQuantity] = useState<number>(0);
    const [notes, setNotes] = useState<string>('');
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    // Filter projects: can't transfer to self
    const targetProjects = projects.filter(p => p.id !== activeProject.id);

    const handleSubmit = async () => {
        if (!selectedMaterial || !targetProjectId || quantity <= 0) return;

        // Validation: Stock check
        if (quantity > selectedMaterial.stock) {
            alert('Stok tidak cukup!');
            return;
        }

        setIsSubmitting(true);
        try {
            await onTransfer(activeProject.id, targetProjectId, selectedMaterial, quantity, notes, date);
            onClose();
            // Reset form
            setSelectedMaterial(null);
            setTargetProjectId('');
            setQuantity(0);
            setNotes('');
        } catch (error) {
            alert('Gagal transfer material.');
            console.error(error);
        }
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Truck className="text-blue-600" />
                        Transfer Material
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Source Info */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">Dari Proyek</p>
                        <p className="font-bold text-slate-700">{activeProject.name}</p>
                    </div>

                    {/* Material Selection */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Pilih Material</label>
                        <select
                            className="w-full p-3 border border-slate-200 rounded-xl"
                            onChange={(e) => {
                                const m = activeProject.materials.find(mat => mat.id === Number(e.target.value));
                                setSelectedMaterial(m || null);
                            }}
                            value={selectedMaterial?.id || ''}
                        >
                            <option value="">-- Pilih Material --</option>
                            {activeProject.materials.map(m => (
                                <option key={m.id} value={m.id}>
                                    {m.name} (Stok: {m.stock} {m.unit})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Target Project */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Ke Proyek Tujuan</label>
                        <select
                            className="w-full p-3 border border-slate-200 rounded-xl"
                            value={targetProjectId}
                            onChange={(e) => setTargetProjectId(e.target.value)}
                        >
                            <option value="">-- Pilih Proyek Tujuan --</option>
                            {targetProjects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Quantity & Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Jumlah</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    className="w-full p-3 border border-slate-200 rounded-xl pr-12"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Number(e.target.value))}
                                    min={0}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                                    {selectedMaterial?.unit || '-'}
                                </span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Tanggal Transfer</label>
                            <input
                                type="date"
                                className="w-full p-3 border border-slate-200 rounded-xl"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Catatan</label>
                        <textarea
                            className="w-full p-3 border border-slate-200 rounded-xl"
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Alasan transfer..."
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !selectedMaterial || !targetProjectId || quantity <= 0}
                        className="px-5 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                        Transfer Sekarang
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MaterialTransferModal;
