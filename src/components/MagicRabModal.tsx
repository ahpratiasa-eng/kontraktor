import React, { useState } from 'react';
import { X, Sparkles, ArrowRight, Save, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { generateRabFromText } from '../utils/aiScheduler';
import { formatRupiah } from '../utils/helpers';
import type { RABItem } from '../types';

interface MagicRabModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (items: RABItem[]) => void;
}

const MagicRabModal: React.FC<MagicRabModalProps> = ({ isOpen, onClose, onSave }) => {
    const [step, setStep] = useState<'input' | 'preview'>('input');
    const [inputText, setInputText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedItems, setGeneratedItems] = useState<RABItem[]>([]);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!inputText.trim()) return;
        setIsGenerating(true);
        setError('');
        try {
            const items = await generateRabFromText(inputText);
            setGeneratedItems(items);
            setStep('preview');
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Gagal memproses dengan AI. Pastikan API Key valid.");
        }
        setIsGenerating(false);
    };

    const handleUpdateItem = (id: number, field: string, value: any) => {
        setGeneratedItems(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const handleRemoveItem = (id: number) => {
        setGeneratedItems(prev => prev.filter(item => item.id !== id));
    };

    const handleSave = () => {
        onSave(generatedItems);
        onClose();
        // Reset
        setStep('input');
        setInputText('');
        setGeneratedItems([]);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative">

                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white flex justify-between items-start">
                    <div>
                        <h2 className="font-bold text-xl flex items-center gap-2">
                            <Sparkles className="text-yellow-300" /> Magic RAB Import
                        </h2>
                        <p className="text-purple-100 text-sm mt-1">
                            {step === 'input' ? 'Ceritakan proyekmu, AI yang buatkan tabelnya.' : 'Review hasil AI sebelum disimpan.'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {step === 'input' ? (
                        <div className="space-y-4">
                            <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl text-sm text-purple-800">
                                <p className="font-bold mb-1">💡 Tips:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Paste chat WA dari owner/klien di sini.</li>
                                    <li>Bisa juga ketik manual: "Renovasi dapur 3x4m, keramik 40x40, meja beton, cat tembok warna krem."</li>
                                    <li>AI akan otomatis melengkapi item pendukung (misal: semen, pasir) jika belum disebut.</li>
                                </ul>
                            </div>

                            <textarea
                                className="w-full h-48 p-4 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-700 bg-slate-50"
                                placeholder="Contoh: Tolong buatkan RAB untuk bangun pagar tembok keliling, panjang 20m tinggi 2m. Pondasi batu kali, finishing plester aci cat..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                            />

                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                                    <AlertTriangle size={16} /> {error}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg border border-green-100">
                                <div className="flex items-center gap-2 text-green-700 font-bold text-sm">
                                    <CheckCircle size={16} /> {generatedItems.length} Item Ditemukan
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-slate-500">Total Estimasi</div>
                                    <div className="font-bold text-green-700">
                                        {formatRupiah(generatedItems.reduce((acc, i) => acc + (i.unitPrice * i.volume), 0))}
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto border rounded-xl">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-slate-600">
                                        <tr>
                                            <th className="p-3 text-left">Nama Item</th>
                                            <th className="p-3 w-20">Vol</th>
                                            <th className="p-3 w-20">Sat</th>
                                            <th className="p-3 w-32">Harga</th>
                                            <th className="p-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {generatedItems.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50">
                                                <td className="p-2">
                                                    <input
                                                        className="w-full bg-transparent border-none focus:ring-0 font-medium"
                                                        value={item.name}
                                                        onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                                                    />
                                                    <div className="text-xs text-slate-400">{item.category}</div>
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="number"
                                                        className="w-full bg-slate-100 rounded px-1 py-1 text-center"
                                                        value={item.volume}
                                                        onChange={(e) => handleUpdateItem(item.id, 'volume', Number(e.target.value))}
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        className="w-full bg-transparent text-center"
                                                        value={item.unit}
                                                        onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="number"
                                                        className="w-full bg-slate-100 rounded px-2 py-1 text-right"
                                                        value={item.unitPrice}
                                                        onChange={(e) => handleUpdateItem(item.id, 'unitPrice', Number(e.target.value))}
                                                    />
                                                </td>
                                                <td className="p-2 text-center text-red-400 hover:text-red-600 cursor-pointer">
                                                    <X size={16} onClick={() => handleRemoveItem(item.id)} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
                    {step === 'input' ? (
                        <>
                            <button onClick={onClose} className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
                                Batal
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !inputText.trim()}
                                className="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl shadow-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                                {isGenerating ? 'AI Sedang Berpikir...' : 'Proses dengan AI'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setStep('input')}
                                className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-2"
                            >
                                <ArrowRight className="rotate-180" size={18} /> Ulangi
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 flex items-center gap-2"
                            >
                                <Save size={18} /> Simpan ke Proyek
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MagicRabModal;
