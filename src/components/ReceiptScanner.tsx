import React, { useState, useRef } from 'react';
import { Camera, Loader2, RefreshCw } from 'lucide-react';
import { scanReceiptWithGemini } from '../utils/aiScheduler';
import { compressImage } from '../utils/imageHelper';

interface ReceiptScannerProps {
    onScanComplete: (data: { date: string, amount: number, description: string, category: string, imageUrl: string }) => void;
    type: 'expense' | 'income';
}

const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onScanComplete, type }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsScanning(true);

            // 1. Compress Image for Preview & Vision API
            const compressedBase64 = await compressImage(file, 1024, 0.8);
            setPreview(compressedBase64);

            // 2. Call Gemini Vision
            const result = await scanReceiptWithGemini(compressedBase64, type);

            // 3. Callback
            onScanComplete({
                date: result.date || new Date().toISOString().split('T')[0],
                amount: result.amount || 0,
                description: result.description || '',
                category: result.category || (type === 'income' ? 'Termin' : 'Material'),
                imageUrl: compressedBase64
            });

        } catch (error: any) {
            console.error("Scan Error:", error);
            alert("Gagal scan struk: " + error.message);
            setPreview(null); // Reset on error
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="w-full">
            <div
                className={`relative border-2 border-dashed rounded-xl overflow-hidden transition-all ${preview ? 'border-green-500 bg-green-50' : 'border-slate-300 hover:bg-slate-50'}`}
            >
                {preview ? (
                    <div className="relative h-48 w-full">
                        <img src={preview} alt="Scan Preview" className="w-full h-full object-contain bg-black/5" />
                        <button
                            onClick={() => {
                                setPreview(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 transition"
                            title="Hapus / Scan Ulang"
                        >
                            <RefreshCw size={14} />
                        </button>
                        {isScanning && (
                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                                <Loader2 className="animate-spin mb-2" size={32} />
                                <span className="text-xs font-bold animate-pulse">Menganalisa AI...</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="py-6 flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-blue-500 transition-colors"
                    >
                        {isScanning ? (
                            <Loader2 className="animate-spin mb-2 text-blue-500" size={32} />
                        ) : (
                            <Camera className="mb-2" size={32} />
                        )}
                        <p className="text-sm font-bold text-slate-600">
                            {isScanning ? 'Memproses...' : (type === 'income' ? 'Scan Bukti Transfer' : 'Scan Struk / Nota')}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                            {isScanning ? 'Mohon tunggu sebentar' : 'AI akan otomatis membaca tanggal & nominal'}
                        </p>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={isScanning}
                />
            </div>
        </div>
    );
};

export default ReceiptScanner;
