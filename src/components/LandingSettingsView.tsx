import React from 'react';
import { Palette, Loader2 } from 'lucide-react';
import type { LandingPageConfig } from '../types';

interface LandingSettingsViewProps {
    config: LandingPageConfig | null;
    onEdit: () => void;
}

const LandingSettingsView: React.FC<LandingSettingsViewProps> = ({ config, onEdit }) => {
    return (
        <main className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 rounded-2xl shadow-lg mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="font-bold text-2xl flex items-center gap-2">
                        <Palette size={28} /> Kelola Landing Page
                    </h2>
                    <p className="text-indigo-100 mt-1">Edit konten halaman depan website</p>
                </div>
                <button
                    onClick={onEdit}
                    className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-50 shadow-md"
                >
                    <Palette size={20} /> Edit Landing Page
                </button>
            </div>

            {/* Preview Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-lg text-slate-800">Preview Konfigurasi</h3>
                </div>
                <div className="p-6 space-y-4">
                    {config ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">Nama Perusahaan</p>
                                    <p className="text-lg font-bold text-slate-800">{config.companyName}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">Nomor WhatsApp</p>
                                    <p className="text-lg font-bold text-green-600">+{config.whatsappNumber}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">Instagram</p>
                                    <p className="text-lg font-bold text-pink-600">@{config.instagramHandle}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">Jumlah Portofolio</p>
                                    <p className="text-lg font-bold text-blue-600">{config.portfolioItems.length} Item</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl">
                                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Tagline</p>
                                <p className="text-lg font-bold text-slate-800">{config.tagline}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl">
                                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Deskripsi</p>
                                <p className="text-sm text-slate-600">{config.subtitle}</p>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8 text-slate-400">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                            <p>Memuat konfigurasi...</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default LandingSettingsView;
