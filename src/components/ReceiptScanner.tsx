import React, { useState, useRef } from 'react';
import { Camera, Loader2, X, RefreshCw, Sparkles } from 'lucide-react';

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
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [statusText, setStatusText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processWithGemini = async (imageFile: File) => {
        setIsProcessing(true);
        setStatusText('Mengupload gambar...');
        setPreviewUrl(URL.createObjectURL(imageFile));

        try {
            // Convert image to base64
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const result = reader.result as string;
                    // Remove data:image/...;base64, prefix
                    const base64Data = result.split(',')[1];
                    resolve(base64Data);
                };
                reader.onerror = reject;
                reader.readAsDataURL(imageFile);
            });

            setStatusText('AI sedang membaca struk...');

            const apiKey = "AIzaSyB7ta6cVVnYp0JQMUSnv1rMSNZivr9_p4E";
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                {
                                    text: `Kamu adalah AI pembaca struk/nota belanja Indonesia.
                                    
Analisa gambar struk/nota ini dengan teliti dan extract informasi berikut:

1. **TOTAL**: Cari angka TOTAL/JUMLAH/GRAND TOTAL yang biasanya ada di bagian bawah struk. Jika ada baris "Jumlah" atau "Total" dengan angka di sampingnya, itu yang dicari. Return sebagai angka bulat tanpa titik/koma (contoh: 530000, bukan 530.000).

2. **TANGGAL**: Cari tanggal transaksi. Format bisa DD/MM/YYYY, DD-MM-YYYY, atau "DD Bulan YYYY". Convert ke format YYYY-MM-DD.

3. **DESKRIPSI**: Tulis nama toko/merchant dan ringkasan singkat apa yang dibeli (max 50 karakter).

PENTING:
- Untuk TOTAL, cari nilai yang ditulis setelah kata "Jumlah" atau "Total" (biasanya di bagian bawah)
- Jangan ambil harga per item, tapi jumlah keseluruhan
- Perhatikan format angka Indonesia: titik adalah pemisah ribuan (530.000 = 530000)

Response dalam format JSON saja, tanpa markdown:
{"total": 530000, "date": "2020-03-23", "description": "UD. Budi Jaya - Material bangunan"}`
                                },
                                {
                                    inline_data: {
                                        mime_type: imageFile.type || 'image/jpeg',
                                        data: base64
                                    }
                                }
                            ]
                        }]
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            console.log('[Gemini OCR] Raw response:', text);

            // Clean and parse JSON
            let cleanJson = text.trim();
            // Remove markdown code blocks if present
            cleanJson = cleanJson.replace(/```json\s*/g, '').replace(/```\s*/g, '');

            const parsed = JSON.parse(cleanJson);

            console.log('[Gemini OCR] Parsed:', parsed);

            const result: ScannedData = {
                total: typeof parsed.total === 'number' ? parsed.total : parseInt(String(parsed.total).replace(/\D/g, '')) || 0,
                date: parsed.date || new Date().toISOString().split('T')[0],
                description: parsed.description || 'Scan struk',
                imageFile
            };

            setStatusText('Berhasil!');
            onScanComplete(result);

        } catch (error: any) {
            console.error("[Gemini OCR] Error:", error);
            setStatusText('Gagal membaca');

            // Fallback to basic values
            alert("AI gagal membaca struk. Silakan isi manual.\nError: " + (error.message || 'Unknown error'));

            // Still call complete with empty data so user can fill manually
            onScanComplete({
                total: 0,
                date: new Date().toISOString().split('T')[0],
                description: 'Scan gagal - isi manual',
                imageFile
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processWithGemini(e.target.files[0]);
        }
    };

    const resetScanner = () => {
        setPreviewUrl(null);
        setStatusText('');
    };

    if (isProcessing) {
        return (
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border-2 border-dashed border-purple-200">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-3" />
                <p className="font-bold text-slate-700">Membaca Struk...</p>
                <p className="text-xs text-purple-500 mb-2 flex items-center gap-1">
                    <Sparkles size={12} /> Powered by Gemini AI
                </p>
                <p className="text-[10px] text-slate-400">{statusText}</p>
            </div>
        );
    }

    if (previewUrl) {
        return (
            <div className="relative mb-2 group">
                <img
                    src={previewUrl}
                    alt="Preview Struk"
                    className="w-32 h-32 object-cover rounded-xl border border-slate-200 shadow-sm mx-auto"
                />
                <button
                    onClick={resetScanner}
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
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>
        );
    }

    return (
        <div className="mb-2">
            <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-xl text-purple-700 font-bold hover:shadow-md transition-all active:scale-95 border-dashed border-2"
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
