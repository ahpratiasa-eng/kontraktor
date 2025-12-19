import React, { useState, useEffect } from 'react';
import type { Material } from '../../types';
import { NumberInput } from '../UIComponents';

interface StockMovementModalProps {
    selectedMaterial: Material;
    onSave: (material: Material, type: 'in' | 'out', qty: number, date: string, notes: string) => void;
}

const StockMovementModal: React.FC<StockMovementModalProps> = ({ selectedMaterial, onSave }) => {
    const [stockType, setStockType] = useState<'in' | 'out'>('in');
    const [stockQty, setStockQty] = useState(0);
    const [stockDate, setStockDate] = useState(new Date().toISOString().split('T')[0]);
    const [stockNotes, setStockNotes] = useState('');

    useEffect(() => {
        // Reset when material changes if needed, but component usually remounts
        setStockQty(0);
        setStockNotes('');
        setStockType('in');
    }, [selectedMaterial.id]);

    const handleSave = () => {
        onSave(selectedMaterial, stockType, stockQty, stockDate, stockNotes);
    };

    return (
        <div className="space-y-4 animate-in fade-in zoom-in duration-300">
            <h3 className="font-bold text-xl mb-4 text-slate-800">Update Stok: {selectedMaterial.name}</h3>

            <div className="bg-slate-50 p-3 rounded-xl mb-4 border border-slate-200">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Stok Saat Ini</span>
                    <span className="font-bold text-slate-800">{selectedMaterial.stock} {selectedMaterial.unit}</span>
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => setStockType('in')}
                    className={`flex-1 p-4 rounded-xl font-bold border transition-all ${stockType === 'in'
                            ? 'bg-green-100 border-green-200 text-green-700 shadow-sm ring-2 ring-green-500/20'
                            : 'bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                >
                    Barang Masuk (+)
                </button>
                <button
                    onClick={() => setStockType('out')}
                    className={`flex-1 p-4 rounded-xl font-bold border transition-all ${stockType === 'out'
                            ? 'bg-red-100 border-red-200 text-red-700 shadow-sm ring-2 ring-red-500/20'
                            : 'bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                >
                    Barang Keluar (-)
                </button>
            </div>

            <div className="space-y-3">
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 ml-1 block">Jumlah ({selectedMaterial.unit})</label>
                    <NumberInput
                        className="w-full p-4 border rounded-xl text-lg font-bold focus:ring-2 focus:ring-blue-100 transition-all placeholder:font-normal"
                        placeholder="0"
                        value={stockQty}
                        onChange={setStockQty}
                    />
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 ml-1 block">Tanggal</label>
                    <input
                        type="date"
                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-700"
                        value={stockDate}
                        onChange={e => setStockDate(e.target.value)}
                    />
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 ml-1 block">Catatan</label>
                    <input
                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-100 transition-all"
                        placeholder="Contoh: Beli di TB Maju Jaya / Dipakai untuk cor"
                        value={stockNotes}
                        onChange={e => setStockNotes(e.target.value)}
                    />
                </div>
            </div>

            <button
                onClick={handleSave}
                className={`w-full text-white p-3.5 rounded-xl font-bold shadow-lg mt-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${stockType === 'in'
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 shadow-green-500/30'
                        : 'bg-gradient-to-r from-red-600 to-rose-600 shadow-red-500/30'
                    }`}
            >
                {stockType === 'in' ? 'Simpan Stok Masuk' : 'Simpan Stok Keluar'}
            </button>
        </div>
    );
};

export default StockMovementModal;
