import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { NumberInput } from '../UIComponents';
import type { PricingResource, Worker } from '../../types';
import { formatRupiah } from '../../utils/helpers';

interface WorkerModalProps {
    selectedWorkerId: number | null;
    initialData?: Worker | null;
    resources: PricingResource[];
    onSave: (data: { name: string, role: string, wageUnit: string, realRate: number, mandorRate: number }) => void;
}

const WorkerModal: React.FC<WorkerModalProps> = ({
    selectedWorkerId, initialData, resources,
    onSave
}) => {
    // Local State
    const [name, setName] = useState('');
    const [role, setRole] = useState('Tukang');
    const [wageUnit, setWageUnit] = useState('Harian');
    const [realRate, setRealRate] = useState(0);
    const [mandorRate, setMandorRate] = useState(0);

    const [showResourcePicker, setShowResourcePicker] = useState(false);
    const [resourceSearch, setResourceSearch] = useState('');

    // Initialize state when initialData changes (editing) or resets (new)
    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setRole(initialData.role);
            setWageUnit(initialData.wageUnit);
            setRealRate(initialData.realRate);
            setMandorRate(initialData.mandorRate);
        } else {
            setName('');
            setRole('Tukang');
            setWageUnit('Harian');
            setRealRate(0);
            setMandorRate(0);
        }
    }, [initialData, selectedWorkerId]);

    const handleSave = () => {
        onSave({
            name,
            role,
            wageUnit,
            realRate,
            mandorRate
        });
    };

    return (
        <div className="space-y-4 animate-in fade-in zoom-in duration-300">
            <h3 className="font-bold text-xl mb-4 text-slate-800">{selectedWorkerId ? 'Edit Pekerja' : 'Tambah Pekerja Baru'}</h3>

            {/* RESOURCE PICKER */}
            {showResourcePicker ? (
                <div className="border rounded-xl p-3 bg-slate-50 mb-4 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-sm text-slate-700">Pilih Standar Upah</h4>
                        <button onClick={() => setShowResourcePicker(false)} className="bg-slate-200 p-1 rounded hover:bg-slate-300 transition"><X size={14} /></button>
                    </div>
                    <input
                        className="w-full p-2 border rounded-lg mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Cari standar upah..."
                        value={resourceSearch}
                        onChange={e => setResourceSearch(e.target.value)}
                        autoFocus
                    />
                    <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-300">
                        {resources.filter(r => r.type === 'upah' && r.name.toLowerCase().includes(resourceSearch.toLowerCase())).map(r => (
                            <div key={r.id} onClick={() => {
                                // Auto fill
                                setRole(r.name);
                                setWageUnit(r.unit === 'OH' ? 'Harian' : 'Borongan');
                                setRealRate(r.price);
                                // Default mandor/charge rate = real rate + margin (e.g. 20%)
                                const margin = r.price * 0.2;
                                setMandorRate(r.price + margin);
                                setShowResourcePicker(false);
                            }} className="p-2 bg-white border rounded hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors">
                                <div>
                                    <div className="text-sm font-bold text-slate-700">{r.name}</div>
                                    <div className="text-xs text-slate-500">{r.category}</div>
                                </div>
                                <span className="font-mono font-bold text-blue-600 text-sm">{formatRupiah(r.price)}/{r.unit}</span>
                            </div>
                        ))}
                        {resources.filter(r => r.type === 'upah').length === 0 && <div className="text-center text-xs text-slate-400 py-4">Belum ada data upah di Library.</div>}
                    </div>
                </div>
            ) : (
                <button onClick={() => setShowResourcePicker(true)} className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors mb-4 border border-blue-100">
                    <Search size={14} /> Ambil dari Standar Upah Library
                </button>
            )}

            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold ml-1 text-slate-500">Nama Lengkap</label>
                    <input className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-100 transition-all font-medium" placeholder="Nama Lengkap" value={name} onChange={e => setName(e.target.value)} />
                </div>

                <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                        <label className="text-xs font-bold ml-1 text-slate-500">Role</label>
                        <select className="w-full p-3 border rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" value={role} onChange={e => setRole(e.target.value)}>
                            <option>Tukang</option><option>Kuli</option><option>Kepala Tukang</option><option>Mandor</option>
                            {/* Allow custom roles from picker */}
                            {!['Tukang', 'Kuli', 'Kepala Tukang', 'Mandor'].includes(role) && <option>{role}</option>}
                        </select>
                    </div>
                    <div className="flex-1 space-y-1">
                        <label className="text-xs font-bold ml-1 text-slate-500">Satuan Upah</label>
                        <select className="w-full p-3 border rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" value={wageUnit} onChange={e => setWageUnit(e.target.value)}>
                            <option>Harian</option><option>Mingguan</option><option>Bulanan</option><option>Borongan</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold ml-1 text-slate-500">Upah Asli (Rate Internal)</label>
                    <NumberInput className="w-full p-3 border rounded-xl font-mono text-slate-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" placeholder="Upah Asli" value={realRate} onChange={setRealRate} />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold ml-1 text-slate-500">Upah Mandor (Rate Charge)</label>
                    <NumberInput className="w-full p-3 border rounded-xl font-mono font-bold text-green-700 bg-green-50 focus:bg-white focus:ring-2 focus:ring-green-100 transition-all" placeholder="Upah Mandor" value={mandorRate} onChange={setMandorRate} />
                    <div className="text-[10px] text-slate-400 italic px-1 pt-1">*Upah Mandor adalah yang ditagihkan ke Owner. Selisih = Profit.</div>
                </div>

                <button onClick={handleSave} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    Simpan Data Pekerja
                </button>
            </div>
        </div>
    );
};

export default WorkerModal;
