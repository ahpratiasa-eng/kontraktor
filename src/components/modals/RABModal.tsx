import React, { useState, useEffect } from 'react';
import { Package, Search } from 'lucide-react';
import { NumberInput } from '../UIComponents';
import type { AHSItem, Project, RABItem } from '../../types';
import { formatRupiah } from '../../utils/helpers';
import { calculateAHSTotal } from '../../types';

interface RABModalProps {
    activeProject: Project | null;
    selectedRabItem: RABItem | null;
    ahsItems: AHSItem[];
    onSave: (data: {
        category: string;
        name: string;
        unit: string;
        vol: number;
        price: number;
        ahsId?: string | null;
    }) => void;
}

const RABModal: React.FC<RABModalProps> = ({
    activeProject, selectedRabItem, ahsItems,
    onSave
}) => {
    // Local form state
    const [category, setCategory] = useState('');
    const [name, setName] = useState('');
    const [unit, setUnit] = useState('');
    const [vol, setVol] = useState<number>(0);
    const [price, setPrice] = useState<number>(0);
    const [selectedAhsId, setSelectedAhsId] = useState<string | null>(null);

    // UI state
    const [showAhsPicker, setShowAhsPicker] = useState(false);
    const [ahsSearch, setAhsSearch] = useState('');

    // Initialize state
    useEffect(() => {
        if (selectedRabItem) {
            setCategory(selectedRabItem.category);
            setName(selectedRabItem.name);
            setUnit(selectedRabItem.unit);
            setVol(selectedRabItem.volume);
            setPrice(selectedRabItem.unitPrice);
            setSelectedAhsId(selectedRabItem.ahsId || null);
        } else {
            // Reset for new item
            setCategory('');
            setName('');
            setUnit('');
            setVol(0);
            setPrice(0);
            setSelectedAhsId(null);
        }
    }, [selectedRabItem]);

    const handleSelectAHS = (ahs: AHSItem) => {
        setCategory(ahs.category);
        setName(ahs.name);
        setUnit(ahs.unit);
        setPrice(calculateAHSTotal(ahs));
        setSelectedAhsId(ahs.id);
        setShowAhsPicker(false);
        setAhsSearch('');
    };

    const handleSave = () => {
        onSave({
            category,
            name,
            unit,
            vol,
            price,
            ahsId: selectedAhsId
        });
    };

    const filteredAHS = ahsItems.filter(item =>
        item.name.toLowerCase().includes(ahsSearch.toLowerCase()) ||
        item.code.toLowerCase().includes(ahsSearch.toLowerCase()) ||
        item.category.toLowerCase().includes(ahsSearch.toLowerCase())
    );

    return (
        <div className="space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-xl text-slate-800">{selectedRabItem ? 'Edit Item RAB' : 'Tambah Item RAB'}</h3>
                {!selectedRabItem && ahsItems.length > 0 && (
                    <button
                        onClick={() => setShowAhsPicker(!showAhsPicker)}
                        className={`text-sm px-3 py-2 rounded-lg font-bold flex items-center gap-1 transition-all ${showAhsPicker ? 'bg-blue-600 text-white shadow-md' : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100'}`}
                    >
                        <Package size={14} />
                        {showAhsPicker ? 'Input Manual' : 'Pilih dari AHS'}
                    </button>
                )}
            </div>

            {/* AHS Picker */}
            {showAhsPicker && !selectedRabItem && (
                <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
                    <div className="bg-blue-50 p-3 border-b">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Cari item AHS (Contoh: Galian, Pasang Bata)..."
                                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={ahsSearch}
                                onChange={e => setAhsSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto divide-y scrollbar-thin scrollbar-thumb-slate-200">
                        {filteredAHS.length === 0 ? (
                            <div className="p-4 text-center text-slate-400 text-sm">
                                Tidak ada item AHS ditemukan
                            </div>
                        ) : (
                            filteredAHS.slice(0, 10).map(ahs => (
                                <button
                                    key={ahs.id}
                                    onClick={() => handleSelectAHS(ahs)}
                                    className="w-full p-3 text-left hover:bg-blue-50 transition-colors group"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono mr-2 group-hover:bg-white">{ahs.code}</span>
                                            <span className="font-bold text-sm text-slate-700 group-hover:text-blue-700">{ahs.name}</span>
                                            <div className="text-xs text-slate-500 mt-0.5">{ahs.category}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-blue-600 text-sm">{formatRupiah(calculateAHSTotal(ahs))}</div>
                                            <div className="text-xs text-slate-400">/{ahs.unit}</div>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                    {filteredAHS.length > 10 && (
                        <div className="p-2 bg-slate-50 text-center text-xs text-slate-500 border-t">
                            Menampilkan 10 dari {filteredAHS.length} item.
                        </div>
                    )}
                </div>
            )}

            {/* Manual Input Form */}
            {(!showAhsPicker || selectedRabItem) && (
                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-xs font-bold ml-1 text-slate-500">Kategori Pekerjaan</label>
                        {/* Get existing categories from project */}
                        {(() => {
                            const existingCategories = activeProject?.rabItems
                                ? [...new Set(activeProject.rabItems.map(item => item.category))].sort()
                                : [];
                            return (
                                <div className="relative">
                                    <select
                                        className="w-full p-3 border rounded-xl bg-slate-50 appearance-none pr-10 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                                        value={existingCategories.includes(category) ? category : '_custom'}
                                        onChange={e => {
                                            if (e.target.value !== '_custom') {
                                                setCategory(e.target.value);
                                            }
                                        }}
                                    >
                                        <option value="_custom">-- Ketik Kategori Baru --</option>
                                        {existingCategories.map((cat, idx) => (
                                            <option key={idx} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            );
                        })()}
                        {/* Show text input if custom or editing */}
                        {(!activeProject?.rabItems?.some(item => item.category === category) || category === '' || category === '_custom') && (
                            <input
                                className="w-full p-3 border rounded-xl mt-2 animate-in fade-in slide-in-from-top-1"
                                placeholder="Contoh: A. PERSIAPAN"
                                value={category === '_custom' ? '' : category}
                                onChange={e => setCategory(e.target.value)}
                            />
                        )}
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold ml-1 text-slate-500">Uraian Pekerjaan</label>
                        <input className="w-full p-3 border rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" placeholder="Nama Item / Uraian Pekerjaan" value={name} onChange={e => setName(e.target.value)} />
                    </div>

                    <div className="flex gap-3">
                        <div className="w-28 space-y-1">
                            <label className="text-xs font-bold ml-1 text-slate-500">Satuan</label>
                            <input className="w-full p-3 border rounded-xl text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" placeholder="Unit" value={unit} onChange={e => setUnit(e.target.value)} />
                        </div>
                        <div className="flex-1 space-y-1">
                            <label className="text-xs font-bold ml-1 text-slate-500">Volume</label>
                            <input type="number" step="0.01" className="w-full p-3 border rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" placeholder="0.0" value={vol || ''} onChange={e => setVol(parseFloat(e.target.value) || 0)} />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold ml-1 text-slate-500">Harga Satuan (Rp)</label>
                        <NumberInput className="w-full p-3 border rounded-xl font-mono text-lg font-bold text-slate-700 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" placeholder="0" value={price} onChange={setPrice} />
                    </div>

                    <div className="pt-2">
                        <button onClick={handleSave} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all">
                            {selectedRabItem ? 'Simpan Perubahan' : 'Simpan Item RAB'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RABModal;
