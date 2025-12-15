import React, { useState } from 'react';
import {
    Search, Plus, Edit, Trash2, Package, Users, Wrench,
    ChevronDown, ChevronRight, Copy, FileSpreadsheet, X
} from 'lucide-react';
import type { AHSItem, AHSComponent, AHSComponentType } from '../types';
import { calculateAHSTotal, calculateAHSSubtotal } from '../types';
import { formatRupiah } from '../utils/helpers';

interface AHSLibraryViewProps {
    ahsItems: AHSItem[];
    onSave: (items: AHSItem[]) => void;
    onSelectForRAB?: (item: AHSItem) => void;
    isSelectMode?: boolean;
}

const AHSLibraryView: React.FC<AHSLibraryViewProps> = ({
    ahsItems, onSave, onSelectForRAB, isSelectMode = false
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [showEditor, setShowEditor] = useState(false);
    const [editingItem, setEditingItem] = useState<AHSItem | null>(null);

    // Get unique categories
    const categories = [...new Set(ahsItems.map(item => item.category))].sort();

    // Filter items
    const filteredItems = ahsItems.filter(item => {
        const matchesSearch = searchQuery === '' ||
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.code.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !selectedCategory || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Group by category
    const groupedItems: Record<string, AHSItem[]> = {};
    filteredItems.forEach(item => {
        if (!groupedItems[item.category]) groupedItems[item.category] = [];
        groupedItems[item.category].push(item);
    });

    const toggleExpanded = (id: string) => {
        const newSet = new Set(expandedItems);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedItems(newSet);
    };

    const handleAddNew = () => {
        const newItem: AHSItem = {
            id: `ahs_${Date.now()}`,
            code: '',
            category: '',
            name: '',
            unit: '',
            components: [],
            isCustom: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        setEditingItem(newItem);
        setShowEditor(true);
    };

    const handleEdit = (item: AHSItem) => {
        setEditingItem({ ...item, components: [...item.components] });
        setShowEditor(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Yakin hapus item ini?')) {
            onSave(ahsItems.filter(item => item.id !== id));
        }
    };

    const handleDuplicate = (item: AHSItem) => {
        const newItem: AHSItem = {
            ...item,
            id: `ahs_${Date.now()}`,
            code: `${item.code}-COPY`,
            name: `${item.name} (Copy)`,
            isCustom: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            components: item.components.map(c => ({ ...c, id: Date.now() + Math.random() }))
        };
        onSave([...ahsItems, newItem]);
    };

    const handleSaveItem = (item: AHSItem) => {
        const existingIndex = ahsItems.findIndex(i => i.id === item.id);
        if (existingIndex >= 0) {
            const updated = [...ahsItems];
            updated[existingIndex] = { ...item, updatedAt: new Date().toISOString() };
            onSave(updated);
        } else {
            onSave([...ahsItems, item]);
        }
        setShowEditor(false);
        setEditingItem(null);
    };

    const getTypeIcon = (type: AHSComponentType) => {
        switch (type) {
            case 'bahan': return <Package size={14} className="text-blue-500" />;
            case 'upah': return <Users size={14} className="text-green-500" />;
            case 'alat': return <Wrench size={14} className="text-orange-500" />;
        }
    };

    const getTypeLabel = (type: AHSComponentType) => {
        switch (type) {
            case 'bahan': return 'Bahan';
            case 'upah': return 'Upah';
            case 'alat': return 'Alat';
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">📋 Library AHS</h2>
                    <p className="text-slate-500 text-sm">Analisa Harga Satuan Pekerjaan</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleAddNew}
                        className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700"
                    >
                        <Plus size={18} /> Tambah AHS
                    </button>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cari nama atau kode item..."
                        className="w-full pl-10 pr-4 py-3 border rounded-xl"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <select
                    className="px-4 py-3 border rounded-xl bg-white min-w-[200px]"
                    value={selectedCategory || ''}
                    onChange={e => setSelectedCategory(e.target.value || null)}
                >
                    <option value="">Semua Kategori</option>
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <div className="text-2xl font-bold text-blue-600">{ahsItems.length}</div>
                    <div className="text-sm text-slate-600">Total Item</div>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <div className="text-2xl font-bold text-green-600">{categories.length}</div>
                    <div className="text-sm text-slate-600">Kategori</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                    <div className="text-2xl font-bold text-purple-600">{ahsItems.filter(i => !i.isCustom).length}</div>
                    <div className="text-sm text-slate-600">Item SNI</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                    <div className="text-2xl font-bold text-orange-600">{ahsItems.filter(i => i.isCustom).length}</div>
                    <div className="text-sm text-slate-600">Item Custom</div>
                </div>
            </div>

            {/* Items List */}
            <div className="space-y-4">
                {Object.keys(groupedItems).sort().map(category => (
                    <div key={category} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        <div className="bg-slate-50 p-4 font-bold text-slate-700 border-b">
                            {category} ({groupedItems[category].length} item)
                        </div>
                        <div className="divide-y">
                            {groupedItems[category].map(item => (
                                <div key={item.id} className="p-4">
                                    {/* Item Header */}
                                    <div className="flex items-start gap-3">
                                        <button
                                            onClick={() => toggleExpanded(item.id)}
                                            className="p-1 hover:bg-slate-100 rounded mt-1"
                                        >
                                            {expandedItems.has(item.id)
                                                ? <ChevronDown size={18} />
                                                : <ChevronRight size={18} />
                                            }
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs bg-slate-200 px-2 py-0.5 rounded font-mono">
                                                    {item.code}
                                                </span>
                                                {item.isCustom && (
                                                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded">
                                                        Custom
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="font-bold text-slate-800 mt-1">{item.name}</h4>
                                            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                                <span>Satuan: <strong>{item.unit}</strong></span>
                                                <span>Komponen: <strong>{item.components.length}</strong></span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-blue-600">
                                                {formatRupiah(calculateAHSTotal(item))}
                                            </div>
                                            <div className="text-xs text-slate-500">per {item.unit}</div>
                                        </div>
                                        <div className="flex gap-1">
                                            {isSelectMode && onSelectForRAB ? (
                                                <button
                                                    onClick={() => onSelectForRAB(item)}
                                                    className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-bold"
                                                >
                                                    Pilih
                                                </button>
                                            ) : (
                                                <>
                                                    <button onClick={() => handleDuplicate(item)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500" title="Duplikat">
                                                        <Copy size={16} />
                                                    </button>
                                                    <button onClick={() => handleEdit(item)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600" title="Edit">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500" title="Hapus">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedItems.has(item.id) && (
                                        <div className="mt-4 ml-8 space-y-3">
                                            {(['bahan', 'upah', 'alat'] as AHSComponentType[]).map(type => {
                                                const comps = item.components.filter(c => c.type === type);
                                                if (comps.length === 0) return null;
                                                return (
                                                    <div key={type} className="bg-slate-50 rounded-lg p-3">
                                                        <div className="flex items-center gap-2 font-bold text-sm mb-2">
                                                            {getTypeIcon(type)}
                                                            {getTypeLabel(type)}
                                                            <span className="text-slate-400 font-normal ml-auto">
                                                                Subtotal: {formatRupiah(calculateAHSSubtotal(item, type))}
                                                            </span>
                                                        </div>
                                                        <table className="w-full text-sm">
                                                            <thead>
                                                                <tr className="text-slate-500 text-xs">
                                                                    <th className="text-left py-1">Uraian</th>
                                                                    <th className="text-center py-1 w-20">Koef</th>
                                                                    <th className="text-center py-1 w-16">Satuan</th>
                                                                    <th className="text-right py-1 w-28">Harga</th>
                                                                    <th className="text-right py-1 w-28">Jumlah</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {comps.map(comp => (
                                                                    <tr key={comp.id} className="border-t border-slate-200">
                                                                        <td className="py-1.5">{comp.name}</td>
                                                                        <td className="text-center py-1.5 font-mono text-xs">{comp.coefficient}</td>
                                                                        <td className="text-center py-1.5">{comp.unit}</td>
                                                                        <td className="text-right py-1.5">{formatRupiah(comp.unitPrice)}</td>
                                                                        <td className="text-right py-1.5 font-bold">{formatRupiah(comp.coefficient * comp.unitPrice)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                );
                                            })}

                                            {/* Total */}
                                            <div className="bg-blue-50 rounded-lg p-3 flex justify-between items-center">
                                                <span className="font-bold">TOTAL HARGA SATUAN</span>
                                                <span className="text-xl font-bold text-blue-600">
                                                    {formatRupiah(calculateAHSTotal(item))} / {item.unit}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {filteredItems.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                        <FileSpreadsheet size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Tidak ada item AHS ditemukan</p>
                        <button onClick={handleAddNew} className="mt-4 text-blue-600 font-bold">
                            + Tambah Item Pertama
                        </button>
                    </div>
                )}
            </div>

            {/* Editor Modal */}
            {showEditor && editingItem && (
                <AHSEditorModal
                    item={editingItem}
                    existingCategories={categories}
                    onSave={handleSaveItem}
                    onClose={() => { setShowEditor(false); setEditingItem(null); }}
                />
            )}
        </div>
    );
};

// ============ AHS EDITOR MODAL ============
interface AHSEditorModalProps {
    item: AHSItem;
    existingCategories: string[];
    onSave: (item: AHSItem) => void;
    onClose: () => void;
}

const AHSEditorModal: React.FC<AHSEditorModalProps> = ({ item, existingCategories, onSave, onClose }) => {
    const [formData, setFormData] = useState<AHSItem>(item);
    const [newCompType, setNewCompType] = useState<AHSComponentType>('bahan');

    const updateField = (field: keyof AHSItem, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const addComponent = () => {
        const newComp: AHSComponent = {
            id: Date.now(),
            type: newCompType,
            name: '',
            unit: newCompType === 'upah' ? 'OH' : '',
            coefficient: 0,
            unitPrice: 0
        };
        setFormData(prev => ({ ...prev, components: [...prev.components, newComp] }));
    };

    const updateComponent = (id: number, field: keyof AHSComponent, value: any) => {
        setFormData(prev => ({
            ...prev,
            components: prev.components.map(c =>
                c.id === id ? { ...c, [field]: value } : c
            )
        }));
    };

    const deleteComponent = (id: number) => {
        setFormData(prev => ({
            ...prev,
            components: prev.components.filter(c => c.id !== id)
        }));
    };

    const handleSubmit = () => {
        if (!formData.code || !formData.name || !formData.category || !formData.unit) {
            alert('Lengkapi semua field yang wajib!');
            return;
        }
        onSave(formData);
    };

    const getTypeIcon = (type: AHSComponentType) => {
        switch (type) {
            case 'bahan': return <Package size={14} className="text-blue-500" />;
            case 'upah': return <Users size={14} className="text-green-500" />;
            case 'alat': return <Wrench size={14} className="text-orange-500" />;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">{item.id.startsWith('ahs_') && !item.code ? 'Tambah AHS Baru' : 'Edit AHS'}</h2>
                        <p className="text-blue-100 text-sm">Analisa Harga Satuan Pekerjaan</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Kode Item *</label>
                            <input
                                type="text"
                                className="w-full p-3 border rounded-xl"
                                placeholder="Contoh: A.1.1"
                                value={formData.code}
                                onChange={e => updateField('code', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Satuan Pekerjaan *</label>
                            <input
                                type="text"
                                className="w-full p-3 border rounded-xl"
                                placeholder="Contoh: m², m³, unit"
                                value={formData.unit}
                                onChange={e => updateField('unit', e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Kategori *</label>
                        <div className="flex gap-2">
                            <select
                                className="flex-1 p-3 border rounded-xl bg-white"
                                value={existingCategories.includes(formData.category) ? formData.category : '_custom'}
                                onChange={e => {
                                    if (e.target.value !== '_custom') updateField('category', e.target.value);
                                }}
                            >
                                <option value="_custom">-- Ketik Kategori Baru --</option>
                                {existingCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        {!existingCategories.includes(formData.category) && (
                            <input
                                type="text"
                                className="w-full p-3 border rounded-xl mt-2"
                                placeholder="Contoh: Pekerjaan Pasangan"
                                value={formData.category}
                                onChange={e => updateField('category', e.target.value)}
                            />
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Nama Pekerjaan *</label>
                        <input
                            type="text"
                            className="w-full p-3 border rounded-xl"
                            placeholder="Contoh: Pasang 1m² Dinding Bata Merah 1:4"
                            value={formData.name}
                            onChange={e => updateField('name', e.target.value)}
                        />
                    </div>

                    {/* Components */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-bold text-slate-700">Komponen Analisa</label>
                            <div className="flex gap-2">
                                <select
                                    className="p-2 border rounded-lg text-sm bg-white"
                                    value={newCompType}
                                    onChange={e => setNewCompType(e.target.value as AHSComponentType)}
                                >
                                    <option value="bahan">Bahan</option>
                                    <option value="upah">Upah</option>
                                    <option value="alat">Alat</option>
                                </select>
                                <button
                                    onClick={addComponent}
                                    className="bg-blue-100 text-blue-600 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1"
                                >
                                    <Plus size={14} /> Tambah
                                </button>
                            </div>
                        </div>

                        {formData.components.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 border-2 border-dashed rounded-xl">
                                Belum ada komponen. Tambahkan bahan, upah, atau alat.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {(['bahan', 'upah', 'alat'] as AHSComponentType[]).map(type => {
                                    const comps = formData.components.filter(c => c.type === type);
                                    if (comps.length === 0) return null;
                                    return (
                                        <div key={type} className="border rounded-xl overflow-hidden">
                                            <div className="bg-slate-50 px-4 py-2 font-bold text-sm flex items-center gap-2 border-b">
                                                {getTypeIcon(type)}
                                                {type === 'bahan' ? 'BAHAN' : type === 'upah' ? 'UPAH' : 'ALAT'}
                                            </div>
                                            <div className="divide-y">
                                                {comps.map(comp => (
                                                    <div key={comp.id} className="p-3 flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            className="flex-1 p-2 border rounded-lg text-sm"
                                                            placeholder="Nama komponen"
                                                            value={comp.name}
                                                            onChange={e => updateComponent(comp.id, 'name', e.target.value)}
                                                        />
                                                        <input
                                                            type="number"
                                                            step="0.001"
                                                            className="w-20 p-2 border rounded-lg text-sm text-center"
                                                            placeholder="Koef"
                                                            value={comp.coefficient || ''}
                                                            onChange={e => updateComponent(comp.id, 'coefficient', parseFloat(e.target.value) || 0)}
                                                        />
                                                        <input
                                                            type="text"
                                                            className="w-16 p-2 border rounded-lg text-sm text-center"
                                                            placeholder="Sat"
                                                            value={comp.unit}
                                                            onChange={e => updateComponent(comp.id, 'unit', e.target.value)}
                                                        />
                                                        <input
                                                            type="number"
                                                            className="w-28 p-2 border rounded-lg text-sm text-right"
                                                            placeholder="Harga"
                                                            value={comp.unitPrice || ''}
                                                            onChange={e => updateComponent(comp.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                        />
                                                        <div className="w-28 text-right font-bold text-sm text-blue-600">
                                                            {formatRupiah(comp.coefficient * comp.unitPrice)}
                                                        </div>
                                                        <button
                                                            onClick={() => deleteComponent(comp.id)}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Summary */}
                    {formData.components.length > 0 && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="text-sm text-slate-600">
                                        Bahan: {formatRupiah(calculateAHSSubtotal(formData, 'bahan'))} |
                                        Upah: {formatRupiah(calculateAHSSubtotal(formData, 'upah'))} |
                                        Alat: {formatRupiah(calculateAHSSubtotal(formData, 'alat'))}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-slate-500">Total Harga Satuan</div>
                                    <div className="text-2xl font-bold text-blue-600">
                                        {formatRupiah(calculateAHSTotal(formData))}
                                        <span className="text-sm text-slate-500 font-normal"> / {formData.unit || '...'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t p-4 flex justify-end gap-3 bg-slate-50">
                    <button onClick={onClose} className="px-6 py-3 rounded-xl border font-bold text-slate-600 hover:bg-slate-100">
                        Batal
                    </button>
                    <button onClick={handleSubmit} className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700">
                        Simpan AHS
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AHSLibraryView;
