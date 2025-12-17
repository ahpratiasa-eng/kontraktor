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

// Compress image before sending to API
const compressImageForOCR = async (file: File, maxWidth = 1024): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Scale down if too large
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            // Get base64 without the data:image prefix
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            const base64 = dataUrl.split(',')[1];
            resolve(base64);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
    });
};

const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onScanComplete }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [statusText, setStatusText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processWithGemini = async (imageFile: File) => {
        setIsProcessing(true);
        setStatusText('Memproses gambar...');
        setPreviewUrl(URL.createObjectURL(imageFile));

        try {
            // Compress image first
            setStatusText('Mengompresi gambar...');
            const base64 = await compressImageForOCR(imageFile);

            console.log('[Gemini OCR] Image size:', Math.round(base64.length / 1024), 'KB');

            setStatusText('AI sedang membaca struk...');

            const apiKey = "AIzaSyB7ta6cVVnYp0JQMUSnv1rMSNZivr9_p4E";

            // Try multiple models in order of preference
            const models = [
                "gemini-1.5-flash",
                "gemini-1.5-flash-latest",
                "gemini-pro-vision",
                "gemini-1.5-pro"
            ];

            const requestBody = {
                contents: [{
                    parts: [
                        {
                            text: `Baca struk/nota belanja ini dan berikan hasilnya dalam JSON.

TUGAS:
1. Cari TOTAL/JUMLAH yang harus dibayar (angka paling besar di bagian bawah, setelah kata "Jumlah" atau "Total")
2. Cari TANGGAL transaksi
3. Buat DESKRIPSI singkat (nama toko + barang yang dibeli)

FORMAT ANGKA INDONESIA:
- Titik (.) = pemisah ribuan, BUKAN desimal
- Contoh: 530.000 artinya lima ratus tiga puluh ribu = 530000

RESPONSE FORMAT (JSON only, no markdown):
{"total": 530000, "date": "2020-03-23", "description": "Toko ABC - beli material"}`
                        },
                        {
                            inline_data: {
                                mime_type: 'image/jpeg',
                                data: base64
                            }
                        }
                    ]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 256
                }
            };

            console.log('[Gemini OCR] Trying multiple models...');

            let response: Response | null = null;
            let usedModel = '';

            for (const modelName of models) {
                console.log(`[Gemini OCR] Trying model: ${modelName}`);
                try {
                    response = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(requestBody)
                        }
                    );

                    if (response.ok) {
                        usedModel = modelName;
                        console.log(`[Gemini OCR] Success with model: ${modelName}`);
                        break;
                    } else {
                        console.log(`[Gemini OCR] Model ${modelName} failed with status: ${response.status}`);
                    }
                } catch (e) {
                    console.log(`[Gemini OCR] Model ${modelName} error:`, e);
                }
            }

            if (!response || !response.ok) {
                throw new Error('Semua model Gemini gagal. API mungkin tidak tersedia.');
            }

            console.log('[Gemini OCR] Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Gemini OCR] Error response:', errorText);
                throw new Error(`API Error ${response.status}: ${errorText.substring(0, 100)}`);
            }

            const data = await response.json();
            console.log('[Gemini OCR] Full response:', JSON.stringify(data, null, 2));

            // Check for blocked content or errors
            if (data.candidates?.[0]?.finishReason === 'SAFETY') {
                throw new Error('Konten diblokir oleh safety filter');
            }

            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) {
                console.error('[Gemini OCR] No text in response:', data);
                throw new Error('AI tidak mengembalikan hasil. Coba foto ulang dengan lebih jelas.');
            }

            console.log('[Gemini OCR] Raw response text:', text);

            // Clean and parse JSON
            let cleanJson = text.trim();
            // Remove markdown code blocks if present
            cleanJson = cleanJson.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

            // Try to extract JSON if there's extra text
            const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleanJson = jsonMatch[0];
            }

            console.log('[Gemini OCR] Clean JSON:', cleanJson);

            const parsed = JSON.parse(cleanJson);

            console.log('[Gemini OCR] Parsed result:', parsed);

            // Validate and convert total
            let totalValue = 0;
            if (typeof parsed.total === 'number') {
                totalValue = parsed.total;
            } else if (typeof parsed.total === 'string') {
                // Remove all non-digit characters and parse
                totalValue = parseInt(parsed.total.replace(/\D/g, '')) || 0;
            }

            const result: ScannedData = {
                total: totalValue,
                date: parsed.date || new Date().toISOString().split('T')[0],
                description: parsed.description || 'Scan struk',
                imageFile
            };

            setStatusText('Berhasil!');
            onScanComplete(result);

        } catch (error: any) {
            console.error("[Gemini OCR] Error:", error);
            setStatusText('Gagal membaca');

            // Show detailed error
            const errorMsg = error.message || 'Unknown error';
            alert(`AI gagal membaca struk.\n\nError: ${errorMsg}\n\nSilakan isi data secara manual.`);

            // Still call complete with empty data so user can fill manually
            onScanComplete({
                total: 0,
                date: new Date().toISOString().split('T')[0],
                description: '',
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
