import React, { useState } from 'react';
import {
    X,
    Plus,
    Trash2,
    Save,
    Image,
    Building2,
    Phone,
    Instagram,
    MapPin,
    FileText,
    Loader2,
    Palette,
    Check
} from 'lucide-react';
import type { LandingPageConfig, PortfolioItem, LandingTheme } from '../types';
import { compressImage } from '../utils/imageHelper';

interface LandingEditorProps {
    config: LandingPageConfig;
    onSave: (config: LandingPageConfig) => Promise<void>;
    onClose: () => void;
}

const LandingEditor: React.FC<LandingEditorProps> = ({ config, onSave, onClose }) => {
    const [formData, setFormData] = useState<LandingPageConfig>(config);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'portfolio' | 'theme'>('general');

    const themes: { id: LandingTheme; name: string; desc: string; colors: string[] }[] = [
        { id: 'dark-orange', name: 'Bold Orange', desc: 'Tema gelap dengan aksen orange/amber yang bold dan profesional', colors: ['#0f172a', '#f97316', '#fbbf24'] },
        { id: 'light-blue', name: 'Clean Blue', desc: 'Tema terang dengan warna biru yang bersih dan modern', colors: ['#ffffff', '#3b82f6', '#0ea5e9'] },
        { id: 'dark-green', name: 'Nature Green', desc: 'Tema gelap dengan aksen hijau yang natural dan elegan', colors: ['#0f172a', '#22c55e', '#10b981'] },
        { id: 'light-elegant', name: 'Elegant White', desc: 'Tema terang minimalis dengan warna netral yang elegan', colors: ['#fafafa', '#1e293b', '#64748b'] },
    ];

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(formData);
            onClose();
        } catch (e) {
            alert('Gagal menyimpan. Coba lagi.');
        }
        setIsSaving(false);
    };

    const addPortfolioItem = () => {
        const newItem: PortfolioItem = {
            id: Date.now(),
            imageUrl: '',
            title: 'Proyek Baru',
            status: 'Sedang Berjalan',
            location: 'Lokasi'
        };
        setFormData({
            ...formData,
            portfolioItems: [...formData.portfolioItems, newItem]
        });
    };

    const updatePortfolioItem = (id: number, field: keyof PortfolioItem, value: string) => {
        setFormData({
            ...formData,
            portfolioItems: formData.portfolioItems.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        });
    };

    const deletePortfolioItem = (id: number) => {
        if (confirm('Hapus item portofolio ini?')) {
            setFormData({
                ...formData,
                portfolioItems: formData.portfolioItems.filter(item => item.id !== id)
            });
        }
    };

    const handleImageUpload = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // High Quality: 1920px (Full HD) @ 90% quality
            const compressed = await compressImage(file, 1920, 0.9);

            // Try uploading to Storage
            let imageUrl = compressed;
            try {
                const { uploadPortfolioPhoto } = await import('../utils/storageHelper');
                imageUrl = await uploadPortfolioPhoto(compressed);
            } catch (storageErr) {
                console.error("Storage upload failed, falling back to base64:", storageErr);
            }

            updatePortfolioItem(id, 'imageUrl', imageUrl);
        } catch (err) {
            alert('Gagal memproses gambar');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Building2 className="w-6 h-6" />
                            Kelola Landing Page
                        </h2>
                        <p className="text-blue-100 text-sm mt-1">Edit konten halaman depan website</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`flex-1 py-4 text-center font-bold transition-colors ${activeTab === 'general'
                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <FileText className="w-4 h-4 inline mr-2" />
                        Umum
                    </button>
                    <button
                        onClick={() => setActiveTab('portfolio')}
                        className={`flex-1 py-4 text-center font-bold transition-colors ${activeTab === 'portfolio'
                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Image className="w-4 h-4 inline mr-2" />
                        Portofolio
                    </button>
                    <button
                        onClick={() => setActiveTab('theme')}
                        className={`flex-1 py-4 text-center font-bold transition-colors ${activeTab === 'theme'
                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Palette className="w-4 h-4 inline mr-2" />
                        Tema
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            {/* Company Name */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    <Building2 className="w-4 h-4 inline mr-1" />
                                    Nama Perusahaan
                                </label>
                                <input
                                    type="text"
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Nama Perusahaan"
                                />
                            </div>

                            {/* Tagline */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Tagline (Judul Utama)
                                </label>
                                <input
                                    type="text"
                                    value={formData.tagline}
                                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Wujudkan Hunian Impian Anda"
                                />
                            </div>

                            {/* Subtitle */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Deskripsi Singkat
                                </label>
                                <textarea
                                    value={formData.subtitle}
                                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                    rows={3}
                                    placeholder="Layanan konstruksi profesional untuk rumah tinggal..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* WhatsApp */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        <Phone className="w-4 h-4 inline mr-1 text-green-600" />
                                        Nomor WhatsApp
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.whatsappNumber}
                                        onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                                        className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="6281234567890"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Format: 628xxx (tanpa + atau spasi)</p>
                                </div>

                                {/* Instagram */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        <Instagram className="w-4 h-4 inline mr-1 text-pink-600" />
                                        Username Instagram
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.instagramHandle}
                                        onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
                                        className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="guna.karya"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Tanpa simbol @</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'portfolio' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-slate-600">Tambahkan foto proyek untuk ditampilkan di landing page.</p>
                                <button
                                    onClick={addPortfolioItem}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700"
                                >
                                    <Plus className="w-4 h-4" />
                                    Tambah
                                </button>
                            </div>

                            {formData.portfolioItems.length === 0 && (
                                <div className="text-center py-12 text-slate-400 border-2 border-dashed rounded-xl">
                                    <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Belum ada portofolio. Klik "Tambah" untuk menambahkan.</p>
                                </div>
                            )}

                            {formData.portfolioItems.map((item, index) => (
                                <div key={item.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <div className="flex items-start gap-4">
                                        {/* Image Preview */}
                                        <div className="w-32 h-24 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0 relative">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                    <Image className="w-8 h-8" />
                                                </div>
                                            )}
                                            <label className="absolute inset-0 cursor-pointer hover:bg-black/20 transition-colors flex items-center justify-center">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => handleImageUpload(item.id, e)}
                                                />
                                                <span className="text-xs text-white bg-black/50 px-2 py-1 rounded opacity-0 hover:opacity-100">Upload</span>
                                            </label>
                                        </div>

                                        {/* Form Fields */}
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                                                <input
                                                    type="text"
                                                    value={item.title}
                                                    onChange={(e) => updatePortfolioItem(item.id, 'title', e.target.value)}
                                                    className="flex-1 p-2 border border-slate-300 rounded-lg text-sm"
                                                    placeholder="Judul Proyek"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-1 text-slate-500 text-xs mb-1">
                                                        <MapPin className="w-3 h-3" /> Lokasi
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={item.location}
                                                        onChange={(e) => updatePortfolioItem(item.id, 'location', e.target.value)}
                                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                                        placeholder="Jakarta Selatan"
                                                    />
                                                </div>
                                                <div className="w-40">
                                                    <div className="text-slate-500 text-xs mb-1">Status</div>
                                                    <select
                                                        value={item.status}
                                                        onChange={(e) => updatePortfolioItem(item.id, 'status', e.target.value)}
                                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                                    >
                                                        <option value="Selesai">Selesai</option>
                                                        <option value="Sedang Berjalan">Sedang Berjalan</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Delete Button */}
                                        <button
                                            onClick={() => deletePortfolioItem(item.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'theme' && (
                        <div className="space-y-4">
                            <p className="text-slate-600 mb-6">Pilih tema untuk tampilan landing page Anda.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {themes.map((theme) => (
                                    <button
                                        key={theme.id}
                                        onClick={() => setFormData({ ...formData, theme: theme.id })}
                                        className={`relative p-4 rounded-2xl border-2 text-left transition-all ${(formData.theme || 'dark-orange') === theme.id
                                            ? 'border-blue-500 bg-blue-50 shadow-lg'
                                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        {/* Selected Indicator */}
                                        {(formData.theme || 'dark-orange') === theme.id && (
                                            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                        )}

                                        {/* Theme Preview */}
                                        <div className="flex gap-2 mb-3">
                                            {theme.colors.map((color, idx) => (
                                                <div
                                                    key={idx}
                                                    className="w-10 h-10 rounded-lg shadow-sm border border-slate-200"
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>

                                        {/* Theme Info */}
                                        <h3 className="font-bold text-slate-800">{theme.name}</h3>
                                        <p className="text-sm text-slate-500 mt-1">{theme.desc}</p>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <p className="text-sm text-amber-800">
                                    💡 <strong>Tips:</strong> Tema "Bold Orange" cocok untuk kesan profesional dan modern. "Clean Blue" lebih formal dan bersih. "Nature Green" memberikan kesan ramah lingkungan.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-200 p-4 flex items-center justify-end gap-3 bg-slate-50">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-100"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Simpan Perubahan
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LandingEditor;
