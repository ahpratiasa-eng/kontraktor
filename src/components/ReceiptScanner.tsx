import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { Camera, Loader2, X, RefreshCw } from 'lucide-react';

export interface ScannedData {
    total: number;
    date: string;
    description: string;
    imageFile: File;
}

interface ReceiptScannerProps {
    onScanComplete: (data: ScannedData) => void;
}

const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onScanComplete }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processImage = async (imageFile: File) => {
        setIsProcessing(true);
        setProgress(0);
        setPreviewUrl(URL.createObjectURL(imageFile));

        try {
            const result = await Tesseract.recognize(
                imageFile,
                'ind', // Bahasa Indonesia
                {
                    logger: (m) => {
                        if (m.status === 'recognizing text') {
                            setProgress(Math.round(m.progress * 100));
                        }
                    },
                }
            );

            const text = result.data.text;
            console.log("OCR Result:", text);

            const parsedData = parseReceiptText(text);
            onScanComplete({ ...parsedData, imageFile });
        } catch (error) {
            console.error("OCR Error:", error);
            alert("Gagal membaca gambar. Pastikan gambar jelas.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Logic Pintar Parsing Teks Struk
    const parseReceiptText = (text: string): Omit<ScannedData, 'imageFile'> => {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        let foundTotal = 0;
        let foundDate = '';
        let descriptionCandidate = '';

        // 1. Cari Tanggal (Format: DD/MM/YYYY, DD-MM-YYYY, DD MMM YYYY)
        const dateRegex = /(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/;
        const dateMatch = text.match(dateRegex);
        if (dateMatch) {
            // Convert to ISO format YYYY-MM-DD for input field
            try {
                const d = dateMatch[1].padStart(2, '0');
                const m = dateMatch[2].padStart(2, '0');
                let y = dateMatch[3];
                if (y.length === 2) y = '20' + y;
                foundDate = `${y}-${m}-${d}`;
            } catch (e) {
                console.log("Date parse error", e);
            }
        }

        // 2. Cari Total Harga
        // Struk biasanya punya kata "Total", "Jumlah", "Bayar", "Tagihan" diikuti angka
        // Strategy: Cari angka terbesar yang muncul setelah kata kunci, atau angka terbesar di paruh bawah teks.

        // Clean text to easily find prices (remove Rp, dots, etc but keep meaningful delimiters)
        // RegExp to find patterns like "Total Rp 50.000" or "50.000"

        let maxPrice = 0;

        lines.forEach(line => {
            // Hapus karakter non-angka kecuali koma dan titik
            // Contoh: "Rp 150.000,00" -> "150000"

            // Deteksi baris yang mengandung 'Total' atau 'Jumlah' punya prioritas
            const isTotalLine = /total|jumlah|bayar|grand/i.test(line);

            // Extract all numbers from line
            const numbers = line.match(/\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?\b/g);

            if (numbers) {
                numbers.forEach(numStr => {
                    // Bersihkan format (150.000 -> 150000, 150,000.00 -> 150000)
                    // Asumsi Indonesia: Titik = Ribuan, Koma = Desimal
                    let cleanNum = numStr.replace(/\./g, '').split(',')[0];
                    const val = parseInt(cleanNum);

                    if (!isNaN(val) && val > 0) {
                        if (isTotalLine) {
                            // Kalau di baris total, kemungkinan besar ini jawabannya
                            if (val > maxPrice) maxPrice = val;
                        } else {
                            // Kalau bukan baris total/tanggal, kumpulkan kandidat
                            // Filter harga yang masuk akal (misal bukan tahun 2024)
                            if (val > maxPrice && val !== 2023 && val !== 2024 && val !== 2025) {
                                maxPrice = val;
                            }
                        }
                    }
                });
            }
        });

        foundTotal = maxPrice;

        // 3. Cari Deskripsi
        // Ambil baris pertama yang bukan nama toko (biasanya baris ke-2 atau ke-3 yang panjang)
        // Atau ambil toko nya saja sebagai deskripsi default "Belanja di [Toko]"
        if (lines.length > 0) {
            descriptionCandidate = `Belanja di ${lines[0].substring(0, 20)}...`;
        }

        return {
            total: foundTotal,
            date: foundDate || new Date().toISOString().split('T')[0],
            description: descriptionCandidate
        };
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processImage(e.target.files[0]);
        }
    };

    if (isProcessing) {
        return (
            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl border-2 border-dashed border-blue-200 animate-pulse">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
                <p className="font-bold text-slate-700">Membaca Struk...</p>
                <p className="text-xs text-slate-400 mb-2">Menggunakan AI (Tesseract.js)</p>
                <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-gray-700 max-w-[200px]">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-xs font-bold text-blue-600 mt-1">{progress}%</p>
            </div>
        );
    }

    if (previewUrl) {
        return (
            <div className="relative mb-4 group">
                <img src={previewUrl} alt="Preview Struk" className="w-32 h-32 object-cover rounded-xl border border-slate-200 shadow-sm mx-auto" />
                <button
                    onClick={() => setPreviewUrl(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600"
                >
                    <X size={14} />
                </button>
                <div className="text-center mt-2">
                    <p className="text-xs text-green-600 font-bold flex items-center justify-center gap-1">
                        <RefreshCw size={10} /> Scan Selesai
                    </p>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[10px] text-blue-500 underline"
                    >
                        Scan Ulang
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-4">
            <input
                type="file"
                accept="image/*"
                capture="environment" // Memaksa buka kamera di HP
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl text-blue-700 font-bold hover:shadow-md transition-all active:scale-95 border-dashed border-2"
            >
                <Camera size={20} />
                <span>Scan Struk (AI Powered)</span>
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-1">
                Otomatis isi Total & Tanggal dari foto
            </p>
        </div>
    );
};

export default ReceiptScanner;
