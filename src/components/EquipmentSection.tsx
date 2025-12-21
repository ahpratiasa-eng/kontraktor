import React, { useState } from 'react';
import { Package, Plus, RotateCcw, AlertTriangle, Phone, X, Loader2 } from 'lucide-react';
import type { Equipment, Project } from '../types';
import { formatRupiah } from '../utils/helpers';
import { NumberInput } from './UIComponents';

interface EquipmentSectionProps {
    project: Project;
    onAddEquipment: (equipment: Omit<Equipment, 'id' | 'status'>) => void;
    onReturnEquipment: (equipmentId: number) => void;
}

const EquipmentSection: React.FC<EquipmentSectionProps> = ({
    project,
    onAddEquipment,
    onReturnEquipment
}) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [vendor, setVendor] = useState('');
    const [vendorPhone, setVendorPhone] = useState('');
    const [rentDate, setRentDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [dailyRate, setDailyRate] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');

    const equipment = project.equipment || [];

    // Calculate status for each equipment
    const getEquipmentStatus = (eq: Equipment): Equipment['status'] => {
        if (eq.returnDate) return 'returned';
        const today = new Date().toISOString().split('T')[0];
        if (eq.dueDate < today) return 'overdue';
        return 'active';
    };

    // Stats
    const activeCount = equipment.filter(e => getEquipmentStatus(e) === 'active').length;
    const overdueCount = equipment.filter(e => getEquipmentStatus(e) === 'overdue').length;
    const totalDailyRent = equipment
        .filter(e => getEquipmentStatus(e) !== 'returned')
        .reduce((sum, e) => sum + (e.dailyRate * e.quantity), 0);

    const handleSave = async () => {
        if (!name || !vendor || !rentDate || !dueDate || dailyRate <= 0) {
            alert('Mohon lengkapi data alat');
            return;
        }

        setIsLoading(true);
        try {
            await onAddEquipment({
                name,
                vendor,
                vendorPhone: vendorPhone || undefined,
                rentDate,
                dueDate,
                dailyRate,
                quantity,
                notes: notes || undefined
            });
            // Reset form
            setShowAddModal(false);
            setName('');
            setVendor('');
            setVendorPhone('');
            setRentDate(new Date().toISOString().split('T')[0]);
            setDueDate('');
            setDailyRate(0);
            setQuantity(1);
            setNotes('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReturn = async (eq: Equipment) => {
        if (confirm(`Kembalikan ${eq.name} dari ${eq.vendor}?`)) {
            await onReturnEquipment(eq.id);
        }
    };

    // Calculate rental cost for an equipment
    const calculateRentalCost = (eq: Equipment): number => {
        const startDate = new Date(eq.rentDate);
        const endDate = eq.returnDate ? new Date(eq.returnDate) : new Date();
        const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        return days * eq.dailyRate * eq.quantity;
    };

    // Preset equipment names
    const presetEquipment = ['Molen Beton', 'Scaffolding', 'Genset', 'Stamper', 'Jack Hammer', 'Mesin Las', 'Concrete Mixer', 'Pompa Air'];

    return (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-5 border border-purple-200 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500 rounded-xl text-white">
                        <Package size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-purple-800">Sewa Alat</h3>
                        <p className="text-xs text-purple-600">
                            {activeCount} aktif · {overdueCount > 0 && <span className="text-red-600 font-bold">{overdueCount} jatuh tempo! · </span>}
                            {formatRupiah(totalDailyRent)}/hari
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-purple-700 transition-all shadow-md hover:shadow-lg"
                >
                    <Plus size={16} /> Tambah Alat
                </button>
            </div>

            {/* Equipment List */}
            {equipment.length === 0 ? (
                <div className="text-center py-8 text-purple-400">
                    <Package size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Belum ada alat yang disewa</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-purple-300">
                    {equipment.map(eq => {
                        const status = getEquipmentStatus(eq);
                        const cost = calculateRentalCost(eq);
                        const statusColors = {
                            active: 'bg-green-100 text-green-700 border-green-200',
                            overdue: 'bg-red-100 text-red-700 border-red-200',
                            returned: 'bg-slate-100 text-slate-500 border-slate-200'
                        };

                        return (
                            <div key={eq.id} className={`p-4 rounded-xl border-2 ${status === 'overdue' ? 'border-red-300 bg-red-50' : 'border-purple-200 bg-white'} shadow-sm`}>
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-slate-800">{eq.name}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${statusColors[status]}`}>
                                                {status === 'active' ? 'Aktif' : status === 'overdue' ? '⚠️ Jatuh Tempo' : 'Dikembalikan'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-500 space-y-0.5">
                                            <div className="flex items-center gap-1">
                                                <span>🏪 {eq.vendor}</span>
                                                {eq.vendorPhone && (
                                                    <a href={`tel:${eq.vendorPhone}`} className="text-blue-600 hover:underline flex items-center gap-0.5">
                                                        <Phone size={10} /> {eq.vendorPhone}
                                                    </a>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span>📅 {eq.rentDate} → {eq.dueDate}</span>
                                                <span>×{eq.quantity} unit</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-slate-400">{formatRupiah(eq.dailyRate)}/hari</div>
                                        <div className="font-bold text-purple-700">{formatRupiah(cost)}</div>
                                        {status !== 'returned' && (
                                            <button
                                                onClick={() => handleReturn(eq)}
                                                className="mt-2 text-xs bg-slate-100 hover:bg-green-100 text-slate-600 hover:text-green-700 px-3 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 ml-auto"
                                            >
                                                <RotateCcw size={12} /> Kembalikan
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {eq.notes && <div className="text-xs text-slate-400 mt-2 italic">📝 {eq.notes}</div>}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Overdue Alert */}
            {overdueCount > 0 && (
                <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-xl flex items-center gap-2 text-red-700 text-sm">
                    <AlertTriangle size={16} />
                    <span className="font-bold">{overdueCount} alat sudah jatuh tempo!</span> Segera kembalikan untuk menghindari biaya tambahan.
                </div>
            )}

            {/* Add Equipment Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto relative">
                        <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10 p-1">
                            <X size={20} />
                        </button>

                        <div className="p-6 space-y-4">
                            <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                                <Package className="text-purple-600" size={24} /> Tambah Sewa Alat
                            </h3>

                            {/* Quick Pick */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-2 block">Pilih Cepat:</label>
                                <div className="flex flex-wrap gap-2">
                                    {presetEquipment.map(preset => (
                                        <button
                                            key={preset}
                                            onClick={() => setName(preset)}
                                            className={`px-3 py-1 text-xs rounded-lg border transition-all ${name === preset ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 border-slate-200 hover:bg-purple-50'}`}
                                        >
                                            {preset}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500">Nama Alat</label>
                                <input
                                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-100"
                                    placeholder="Contoh: Molen Beton 500L"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500">Nama Vendor/Toko</label>
                                    <input
                                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-100"
                                        placeholder="Toko Bangunan XYZ"
                                        value={vendor}
                                        onChange={e => setVendor(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500">No HP Vendor</label>
                                    <input
                                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-100"
                                        placeholder="08123456789"
                                        value={vendorPhone}
                                        onChange={e => setVendorPhone(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500">Tanggal Sewa</label>
                                    <input
                                        type="date"
                                        className="w-full p-3 border rounded-xl"
                                        value={rentDate}
                                        onChange={e => setRentDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500">Jatuh Tempo</label>
                                    <input
                                        type="date"
                                        className="w-full p-3 border rounded-xl"
                                        value={dueDate}
                                        onChange={e => setDueDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500">Tarif per Hari (Rp)</label>
                                    <NumberInput
                                        className="w-full p-3 border rounded-xl font-mono"
                                        placeholder="0"
                                        value={dailyRate}
                                        onChange={setDailyRate}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500">Jumlah Unit</label>
                                    <input
                                        type="number"
                                        min={1}
                                        className="w-full p-3 border rounded-xl"
                                        value={quantity}
                                        onChange={e => setQuantity(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500">Catatan (Opsional)</label>
                                <textarea
                                    className="w-full p-3 border rounded-xl h-16 resize-none"
                                    placeholder="Kondisi alat, syarat sewa, dll..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3.5 rounded-xl font-bold shadow-lg hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isLoading && <Loader2 className="animate-spin" size={18} />}
                                {isLoading ? 'Menyimpan...' : 'Simpan Sewa Alat'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EquipmentSection;
