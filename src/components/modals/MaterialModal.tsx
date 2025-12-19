import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Material, Project } from '../../types';
import { NumberInput } from '../UIComponents';

interface MaterialModalProps {
    activeProject: Project;
    selectedMaterial: Material | null;
    onSave: (name: string, unit: string, minStock: number, initialStock: number) => void;
    onEdit: (name: string, unit: string, minStock: number) => void;
}

const MaterialModal: React.FC<MaterialModalProps> = ({ activeProject, selectedMaterial, onSave, onEdit }) => {
    const [name, setName] = useState('');
    const [unit, setUnit] = useState('');
    const [minStock, setMinStock] = useState(0);
    const [initialStock, setInitialStock] = useState(0);
    const [isManualInput, setIsManualInput] = useState(false);

    useEffect(() => {
        if (selectedMaterial) {
            setName(selectedMaterial.name);
            setUnit(selectedMaterial.unit);
            setMinStock(selectedMaterial.minStock || 0);
        } else {
            setName('');
            setUnit('');
            setMinStock(0);
            setInitialStock(0);
        }
    }, [selectedMaterial]);

    const handleSaveWrapper = () => {
        if (selectedMaterial) {
            onEdit(name, unit, minStock);
        } else {
            onSave(name, unit, minStock, initialStock);
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in zoom-in duration-300">
            <h3 className="font-bold text-xl mb-4 text-slate-800">{selectedMaterial ? 'Edit Material' : 'Tambah Material Baru'}</h3>
            <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 mb-2 border border-blue-100">
                <p>Material yang ditambahkan di sini akan masuk ke Stok Lapangan.</p>
            </div>

            {/* Material Source Selection (Only for New) */}
            {!selectedMaterial && activeProject?.rabItems && activeProject.rabItems.length > 0 && (
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-4">
                    <button
                        onClick={() => setIsManualInput(false)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isManualInput ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Ambil dari RAB
                    </button>
                    <button
                        onClick={() => setIsManualInput(true)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${isManualInput ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Input Manual
                    </button>
                </div>
            )}

            {!isManualInput && !selectedMaterial && activeProject?.rabItems ? (
                <div className="relative">
                    <label className="text-xs font-bold text-slate-500 mb-1 ml-1 block">Pilih Item dari RAB</label>
                    <div className="relative">
                        <select
                            className="w-full p-3 border rounded-xl bg-white appearance-none pr-10 font-medium text-slate-700 focus:ring-2 focus:ring-blue-100 transition-all"
                            value={name}
                            onChange={(e) => {
                                const selectedName = e.target.value;
                                setName(selectedName);
                                const item = activeProject.rabItems.find(r => r.name === selectedName);
                                if (item) setUnit(item.unit);
                            }}
                        >
                            <option value="">-- Pilih Material dari RAB --</option>
                            {[...new Set(activeProject.rabItems.filter(i => !['oh', 'hari', 'jam', 'ls', 'unit', 'org'].includes(i.unit.toLowerCase())).map(i => i.name))].sort().map((name, idx) => {
                                const item = activeProject.rabItems.find(r => r.name === name);
                                return <option key={idx} value={name}>{name} ({item?.unit})</option>;
                            })}
                        </select>
                        <ChevronDown className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={20} />
                    </div>
                </div>
            ) : (
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 ml-1 block">Nama Material</label>
                    <input
                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                        placeholder="Contoh: Semen Tiga Roda"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                </div>
            )}

            <div className="flex gap-2">
                <div className="flex-1">
                    <label className="text-xs font-bold text-slate-500 mb-1 ml-1 block">Satuan</label>
                    <input
                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                        placeholder="Contoh: sak, m3"
                        value={unit}
                        onChange={e => setUnit(e.target.value)}
                    />
                </div>
                <div className="flex-1">
                    <label className="text-xs font-bold text-slate-500 mb-1 ml-1 block">Min. Stock Alert</label>
                    <NumberInput
                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-100 transition-all"
                        placeholder="0"
                        value={minStock}
                        onChange={setMinStock}
                    />
                </div>
            </div>

            {!selectedMaterial && (
                <div className="space-y-1">
                    <label className="text-xs font-bold ml-1 text-slate-500">Stok Awal (Opsional)</label>
                    <NumberInput
                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-100 transition-all"
                        placeholder="Stok saat ini"
                        value={initialStock}
                        onChange={setInitialStock}
                    />
                </div>
            )}

            <button
                onClick={handleSaveWrapper}
                disabled={!name}
                className={`w-full text-white p-3.5 rounded-xl font-bold shadow-lg hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all bg-gradient-to-r from-blue-600 to-indigo-600 ${!name ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {selectedMaterial ? 'Simpan Perubahan' : 'Simpan Material'}
            </button>
        </div>
    );
};

export default MaterialModal;
