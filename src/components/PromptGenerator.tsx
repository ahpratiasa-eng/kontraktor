import React, { useState } from 'react';
import { Copy, Sparkles, X, Check } from 'lucide-react';
import type { Project } from '../types';

interface PromptGeneratorProps {
    project: Project;
}

const PromptGenerator: React.FC<PromptGeneratorProps> = ({ project }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const generatePrompt = () => {
        const rabSummary = (project.rabItems || [])
            .map(i => `- ${i.name} (Vol: ${i.volume} ${i.unit}, Harga: ${i.unitPrice?.toLocaleString('id-ID')}, Progress: ${i.progress}%)`)
            .join('\n');

        const totalBudget = (project.rabItems || []).reduce((acc, i) => acc + ((i.unitPrice || 0) * i.volume), 0);
        const avgProgress = (project.rabItems || []).reduce((acc, i) => acc + (i.progress || 0), 0) / (project.rabItems?.length || 1);

        return `Saya sedang menangani proyek konstruksi berikut:

DATA PROYEK:
- Nama: ${project.name}
- Lokasi: ${project.location}
- Budget Total (RAB): Rp ${totalBudget.toLocaleString('id-ID')}
- Rata-rata Progress: ${avgProgress.toFixed(1)}%

DETAIL PEKERJAAN:
${rabSummary}

DATA WORKER:
${(project.workers || []).map(w => `- ${w.name} (${w.role})`).join('\n')}

PERMINTAAN SAYA:
[Tulis pertanyaan anda disini, misal: Tolong buatkan strategi percepatan untuk item yang masih 0%]`;
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatePrompt());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 rounded-full shadow-xl hover:scale-110 transition-transform group"
                    title="Generate Prompt buat Gemini/ChatGPT"
                >
                    <Sparkles size={24} />
                    <span className="absolute right-0 top-0 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
                    </span>
                    <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white text-slate-700 px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                        Copy Data Proyek (Prompt)
                    </div>
                </button>
            )}

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Sparkles className="text-emerald-500" size={20} />
                                Generate Context Prompt
                            </h3>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <p className="text-sm text-slate-500 mb-4">
                                Salin data proyek ini dan paste ke <strong>Gemini, ChatGPT, atau Claude</strong> untuk diskusi tanpa mengurangi kuota API aplikasi.
                            </p>

                            <div className="relative">
                                <textarea
                                    readOnly
                                    className="w-full h-64 p-4 bg-slate-800 text-slate-300 font-mono text-xs rounded-xl focus:outline-none resize-none"
                                    value={generatePrompt()}
                                />
                                <button
                                    onClick={handleCopy}
                                    className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-md transition-all flex items-center gap-2"
                                >
                                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                    {copied ? 'Disalin!' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        <div className="p-4 border-t bg-slate-50 rounded-b-2xl flex justify-end">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-6 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PromptGenerator;
