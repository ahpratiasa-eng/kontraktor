import React, { useState } from 'react';
import { CheckCircle, Camera, X, Loader2 } from 'lucide-react';
import type { RABItem } from '../../types';

interface QCModalProps {
    selectedRabItem: RABItem;
    onSave: (checklist: { items: any[], photoUrl?: string }) => void;
    onClose: () => void;
}

const QCModal: React.FC<QCModalProps> = ({ selectedRabItem, onSave, onClose }) => {
    const [qcItems, setQcItems] = useState([
        { id: 1, label: 'Dimensi Sesuai Gambar', isChecked: false },
        { id: 2, label: 'Kerapihan Pekerjaan', isChecked: false },
        { id: 3, label: 'Material Sesuai Spesifikasi', isChecked: false },
        { id: 4, label: 'Kebersihan Area', isChecked: false },
        { id: 5, label: 'Fungsi Berjalan Baik', isChecked: false }
    ]);
    const [qcPhoto, setQcPhoto] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const toggleQCItem = (id: number) => {
        setQcItems(prev => prev.map(item => item.id === id ? { ...item, isChecked: !item.isChecked } : item));
    };

    const handleSaveWrapper = async () => {
        try {
            setIsUploading(true);
            await onSave({ items: qcItems, photoUrl: qcPhoto || undefined });
        } catch (e) {
            console.error(e);
            alert("Gagal menyimpan QC");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in zoom-in duration-300">
            <h3 className="font-bold text-xl mb-4 flex items-center gap-2 text-slate-800">
                <CheckCircle className="text-green-600" /> Quality Control (QC)
            </h3>
            <div className="bg-green-50 p-4 rounded-xl mb-2 text-sm text-green-900 border border-green-100">
                <p className="font-bold">{selectedRabItem.name}</p>
                <p className="text-xs mt-1">Pastikan item pekerjaan ini memenuhi standar kualitas sebelum diserah-terimakan.</p>
            </div>

            {/* Checklist Area */}
            <div className="border rounded-xl p-4 space-y-3 bg-white">
                <h4 className="font-bold text-sm text-slate-700 mb-2">Checklist Standar</h4>
                {qcItems.map((item) => (
                    <label key={item.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-100">
                        <input
                            type="checkbox"
                            checked={item.isChecked}
                            onChange={() => toggleQCItem(item.id)}
                            className="w-5 h-5 rounded text-green-600 focus:ring-green-500 border-slate-300 transition-all"
                        />
                        <span className={`text-sm font-medium transition-colors ${item.isChecked ? 'text-green-700 font-bold' : 'text-slate-700'}`}>{item.label}</span>
                    </label>
                ))}
            </div>

            {/* Evidence Photo */}
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 ml-1">Bukti Foto QC (Wajib)</label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-slate-50 hover:border-green-300 transition-all relative overflow-hidden bg-slate-50 min-h-[150px] group">
                    {qcPhoto ? (
                        <>
                            <img src={qcPhoto} className="h-40 object-contain rounded-lg shadow-sm" />
                            <button
                                onClick={() => setQcPhoto(null)}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md transition-transform hover:scale-110"
                            >
                                <X size={14} />
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                <Camera className="text-slate-400 group-hover:text-green-500 transition-colors" size={32} />
                            </div>
                            <p className="text-sm font-bold text-slate-500 group-hover:text-green-600 transition-colors">Upload Foto Inspeksi</p>
                            <p className="text-xs text-slate-400 mt-1">Klik untuk ambil foto / upload</p>
                        </>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                                const { compressImage } = await import('../../utils/imageHelper');
                                setIsUploading(true);
                                const compressed = await compressImage(file, 1024, 0.8);
                                setQcPhoto(compressed);
                            } catch (err) {
                                console.error(err);
                                alert('Gagal proses foto.');
                            } finally {
                                setIsUploading(false);
                            }
                        }}
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
                <button
                    onClick={onClose}
                    className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                >
                    Batal
                </button>
                <button
                    className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-green-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    disabled={!qcPhoto || isUploading}
                    onClick={handleSaveWrapper}
                >
                    {isUploading ? <Loader2 className="animate-spin mx-auto" /> : 'Simpan Laporan QC'}
                </button>
            </div>
        </div>
    );
};

export default QCModal;
