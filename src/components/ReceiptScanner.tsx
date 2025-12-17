import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
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
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            const base64 = dataUrl.split(',')[1];
            resolve(base64);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
    });
};

// Parse receipt text with improved logic
const parseReceiptText = (text: string): { total: number; date: string; description: string } => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    let foundTotal = 0;
    let foundDate = '';
    let descriptionCandidate = '';

    // 1. Find Date
    const datePatterns = [
        /(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/,
        /(\d{1,2})\s+(jan|feb|mar|apr|mei|may|jun|jul|agu|aug|sep|okt|oct|nov|des|dec)\w*\s+(\d{2,4})/i
    ];

    for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) {
            try {
                if (pattern === datePatterns[0]) {
                    const d = match[1].padStart(2, '0');
                    const m = match[2].padStart(2, '0');
                    let y = match[3];
                    if (y.length === 2) y = '20' + y;
                    foundDate = `${y}-${m}-${d}`;
                } else {
                    // Month name format
                    const months: { [key: string]: string } = {
                        'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
                        'mei': '05', 'may': '05', 'jun': '06', 'jul': '07',
                        'agu': '08', 'aug': '08', 'sep': '09', 'okt': '10',
                        'oct': '10', 'nov': '11', 'des': '12', 'dec': '12'
                    };
                    const d = match[1].padStart(2, '0');
                    const m = months[match[2].toLowerCase().substring(0, 3)] || '01';
                    let y = match[3];
                    if (y.length === 2) y = '20' + y;
                    foundDate = `${y}-${m}-${d}`;
                }
                break;
            } catch (e) {
                console.log("Date parse error", e);
            }
        }
    }

    // 2. Find Total - look for largest number after keywords
    let maxPrice = 0;

    lines.forEach(line => {
        const isTotalLine = /total|jumlah|bayar|grand|subtotal/i.test(line);

        // Extract numbers - handle Indonesian format (530.000)
        const numbers = line.match(/\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?|\d+/g);

        if (numbers) {
            numbers.forEach(numStr => {
                // Clean: 530.000 -> 530000
                let cleanNum = numStr.replace(/\./g, '').replace(/,/g, '');
                const val = parseInt(cleanNum);

                if (!isNaN(val) && val > 100) {
                    // Skip years and small values
                    if (val >= 2020 && val <= 2030) return;

                    if (isTotalLine) {
                        if (val > maxPrice) maxPrice = val;
                    } else if (val > maxPrice) {
                        maxPrice = val;
                    }
                }
            });
        }
    });

    foundTotal = maxPrice;

    // 3. Find Description - first line as store name
    if (lines.length > 0) {
        const storeName = lines[0].substring(0, 25);
        descriptionCandidate = `Belanja di ${storeName}`;
    }

    return {
        total: foundTotal,
        date: foundDate || new Date().toISOString().split('T')[0],
        description: descriptionCandidate
    };
};

const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onScanComplete }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [statusText, setStatusText] = useState('');
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fallback OCR using Tesseract.js
    const processWithTesseract = async (imageFile: File): Promise<{ total: number; date: string; description: string }> => {
        setStatusText('OCR offline sedang memproses...');

        const result = await Tesseract.recognize(
            imageFile,
            'ind+eng',
            {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setProgress(Math.round(m.progress * 100));
                    }
                },
            }
        );

        console.log('[Tesseract OCR] Result:', result.data.text);
        return parseReceiptText(result.data.text);
    };

    // Try Gemini API first, fallback to Tesseract
    const processWithGemini = async (imageFile: File) => {
        setIsProcessing(true);
        setStatusText('Memproses gambar...');
        setPreviewUrl(URL.createObjectURL(imageFile));
        setProgress(0);

        try {
            // Compress image first
            setStatusText('Mengompresi gambar...');
            const base64 = await compressImageForOCR(imageFile);

            console.log('[Gemini OCR] Image size:', Math.round(base64.length / 1024), 'KB');
            setStatusText('AI sedang membaca struk...');

            const apiKey = "AIzaSyB7ta6cVVnYp0JQMUSnv1rMSNZivr9_p4E";

            const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-pro-vision"];

            const requestBody = {
                contents: [{
                    parts: [
                        {
                            text: `Baca struk/nota ini. Return JSON saja:
{"total": ANGKA_TOTAL, "date": "YYYY-MM-DD", "description": "NAMA_TOKO"}
Contoh: {"total": 530000, "date": "2020-03-23", "description": "UD. Budi Jaya"}`
                        },
                        {
                            inline_data: {
                                mime_type: 'image/jpeg',
                                data: base64
                            }
                        }
                    ]
                }],
                generationConfig: { temperature: 0.1, maxOutputTokens: 128 }
            };

            let geminiSuccess = false;
            let parsedResult: { total: number; date: string; description: string } | null = null;

            for (const modelName of models) {
                console.log(`[Gemini OCR] Trying: ${modelName}`);
                try {
                    const response = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(requestBody)
                        }
                    );

                    if (response.ok) {
                        const data = await response.json();
                        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

                        if (text) {
                            console.log('[Gemini OCR] Response:', text);
                            let cleanJson = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
                            const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
                            if (jsonMatch) {
                                const parsed = JSON.parse(jsonMatch[0]);
                                parsedResult = {
                                    total: typeof parsed.total === 'number' ? parsed.total : parseInt(String(parsed.total).replace(/\D/g, '')) || 0,
                                    date: parsed.date || new Date().toISOString().split('T')[0],
                                    description: parsed.description || 'Scan struk'
                                };
                                geminiSuccess = true;
                                break;
                            }
                        }
                    } else {
                        console.log(`[Gemini OCR] ${modelName} failed: ${response.status}`);
                    }
                } catch (e) {
                    console.log(`[Gemini OCR] ${modelName} error:`, e);
                }
            }

            // Fallback to Tesseract if Gemini fails
            if (!geminiSuccess) {
                console.log('[OCR] Gemini gagal, gunakan Tesseract...');
                setStatusText('AI gagal, mencoba OCR offline...');
                parsedResult = await processWithTesseract(imageFile);
            }

            if (parsedResult) {
                setStatusText('Berhasil!');
                onScanComplete({
                    ...parsedResult,
                    imageFile
                });
            }

        } catch (error: any) {
            console.error("[OCR] Error:", error);

            // Final fallback
            try {
                setStatusText('Error, mencoba OCR offline...');
                const fallbackResult = await processWithTesseract(imageFile);
                setStatusText('Berhasil (offline)!');
                onScanComplete({
                    ...fallbackResult,
                    imageFile
                });
            } catch (tessError) {
                console.error("[Tesseract] Error:", tessError);
                setStatusText('Gagal');
                alert("Gagal membaca struk. Silakan isi manual.");
                onScanComplete({
                    total: 0,
                    date: new Date().toISOString().split('T')[0],
                    description: '',
                    imageFile
                });
            }
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
        setProgress(0);
    };

    if (isProcessing) {
        return (
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border-2 border-dashed border-purple-200">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-3" />
                <p className="font-bold text-slate-700">Membaca Struk...</p>
                <p className="text-xs text-purple-500 mb-2 flex items-center gap-1">
                    <Sparkles size={12} /> AI + OCR Powered
                </p>
                <p className="text-[10px] text-slate-400">{statusText}</p>
                {progress > 0 && (
                    <div className="w-full max-w-[150px] bg-slate-200 rounded-full h-1.5 mt-2">
                        <div className="bg-purple-600 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                    </div>
                )}
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
