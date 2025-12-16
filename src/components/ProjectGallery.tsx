import React, { useState } from 'react';
import { Camera, Trash2, X, Plus, Filter, Link as LinkIcon, ExternalLink, Settings as SettingsIcon } from 'lucide-react';
import type { Project, GalleryItem } from '../types';
import { compressImage } from '../utils/imageHelper';
import { calculateProjectHealth } from '../utils/helpers';

interface ProjectGalleryProps {
    project: Project;
    updateProject: (data: Partial<Project>) => void;
    canEdit: boolean;
}

const ProjectGallery: React.FC<ProjectGalleryProps> = ({ project, updateProject, canEdit }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
    const [filterStart, setFilterStart] = useState('');
    const [filterEnd, setFilterEnd] = useState('');
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [inputLink, setInputLink] = useState('');

    // GDrive Settings
    const [showSettings, setShowSettings] = useState(false);

    // Filtering Logic
    const gallery = project.gallery || [];
    const filteredGallery = gallery.filter(item => {
        if (!filterStart && !filterEnd) return true;

        const itemDate = new Date(item.date);
        itemDate.setHours(0, 0, 0, 0);

        const start = filterStart ? new Date(filterStart) : null;
        if (start) start.setHours(0, 0, 0, 0);

        const end = filterEnd ? new Date(filterEnd) : null;
        if (end) end.setHours(23, 59, 59, 999);

        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;
        return true;
    });

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const newItems: GalleryItem[] = [];
        const stats = calculateProjectHealth(project); // Capture current progress

        try {
            // Dynamic import for tree-shaking
            const { uploadGalleryPhoto } = await import('../utils/storageHelper');

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                // High Quality Compression: 1920px width, 90% quality
                const compressed = await compressImage(file, 1920, 0.9);

                // Upload to Firebase Storage OR Google Drive if script is set
                let imageUrl = compressed;
                try {
                    // Script URL is handled internally by uploadGalleryPhoto now
                    imageUrl = await uploadGalleryPhoto(compressed, project.id);
                } catch (uploadErr) {
                    console.error('Failed to upload to storage/drive, using base64 fallback:', uploadErr);
                    // Fallback to base64 if storage fails
                }

                newItems.push({
                    id: Date.now() + Math.random(),
                    url: imageUrl,
                    caption: '',
                    date: new Date().toISOString(),
                    uploader: 'User',
                    progress: stats.realProgress // Save progress
                });
            }

            const currentGallery = project.gallery || [];
            updateProject({ gallery: [...newItems, ...currentGallery] });
        } catch (error) {
            console.error(error);
            alert("Gagal mengupload foto.");
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const convertDriveLink = (url: string) => {
        // Handle Google Drive links
        if (url.includes('drive.google.com')) {
            const idMatch = url.match(/[-\w]{25,}/);
            if (idMatch) {
                return `https://drive.google.com/uc?export=view&id=${idMatch[0]}`;
            }
        }
        return url;
    };

    const handleAddLink = () => {
        if (!inputLink) return;

        const finalUrl = convertDriveLink(inputLink);
        const stats = calculateProjectHealth(project);

        const newItem: GalleryItem = {
            id: Date.now(),
            url: finalUrl,
            caption: 'External Link',
            date: new Date().toISOString(),
            uploader: 'User',
            progress: stats.realProgress
        };

        const currentGallery = project.gallery || [];
        updateProject({ gallery: [newItem, ...currentGallery] });
        setInputLink('');
        setShowLinkInput(false);
    };

    const handleDelete = (id: number) => {
        if (!confirm("Hapus foto ini?")) return;
        const currentGallery = project.gallery || [];
        updateProject({ gallery: currentGallery.filter(item => item.id !== id) });
        if (selectedImage?.id === id) setSelectedImage(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="font-bold text-lg text-slate-800">Galeri Proyek</h3>
                    <p className="text-sm text-slate-500">{filteredGallery.length} Foto Ditampilkan {gallery.length !== filteredGallery.length && `(dari ${gallery.length} total)`}</p>
                </div>
                {canEdit && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="p-2 rounded-xl transition shadow-sm bg-green-100 text-green-700"
                            title="Pengaturan Storage"
                        >
                            <SettingsIcon size={20} />
                        </button>
                        <button
                            onClick={() => setShowLinkInput(!showLinkInput)}
                            className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition shadow-sm"
                        >
                            <LinkIcon size={18} /> Link
                        </button>
                        <label className={`bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 cursor-pointer hover:bg-blue-700 transition shadow-lg ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {isUploading ? <span className="animate-spin">⌛</span> : <Plus size={18} />}
                            {isUploading ? 'Mengupload...' : 'Upload Foto'}
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={handleUpload}
                                disabled={isUploading}
                            />
                        </label>
                    </div>
                )}
            </div>

            {/* GDrive Settings */}
            {showSettings && (
                <div className="bg-green-50 p-4 rounded-xl border border-green-200 animate-in fade-in slide-in-from-top-2">
                    <h4 className="font-bold text-green-800 mb-2 text-sm flex items-center gap-2">✅ Integrasi Google Drive Terhubung</h4>
                    <p className="text-xs text-green-700 mb-2">
                        Upload foto otomatis tersimpan ke Google Drive.
                    </p>
                    <div className="flex gap-2 opacity-50 pointer-events-none">
                        <input
                            type="text"
                            className="flex-1 p-2 border rounded-lg bg-white text-sm"
                            value="https://script.google.com/macros/s/AKfy...fbY/exec"
                            readOnly
                        />
                        <button className="bg-slate-400 text-white px-3 py-2 rounded-lg font-bold text-sm">
                            Terhubung
                        </button>
                    </div>
                    <p className="text-[10px] text-green-600 mt-2 italic">
                        *URL Script sudah ditanam di sistem. Anda tidak perlu mengatur apa-apa lagi.
                    </p>
                </div>
            )}


            {/* Link Input Section */}
            {showLinkInput && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2">
                    <label className="text-xs font-bold text-blue-800 mb-2 block">Paste Link Foto (URL Langsung atau Google Drive Link)</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="https://drive.google.com/file/d/..."
                            className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={inputLink}
                            onChange={e => setInputLink(e.target.value)}
                        />
                        <button
                            onClick={handleAddLink}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700"
                        >
                            Simpan
                        </button>
                    </div>
                    <p className="text-[10px] text-blue-600 mt-2">
                        Tips: Untuk Google Drive, pastikan akses file diset ke <b>"Siapa saja yang memiliki link" (Anyone with the link)</b> agar bisa tampil di sini.
                    </p>
                </div>
            )}

            {/* Filter Bar */}
            <div className="bg-slate-50 p-4 rounded-xl border flex flex-col md:flex-row gap-4 items-end shadow-sm">
                <div className="flex-1 w-full">
                    <label className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Filter size={12} /> Dari Tanggal</label>
                    <input type="date" className="w-full p-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={filterStart} onChange={e => setFilterStart(e.target.value)} />
                </div>
                <div className="flex-1 w-full">
                    <label className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Filter size={12} /> Sampai Tanggal</label>
                    <input type="date" className="w-full p-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} />
                </div>
                {(filterStart || filterEnd) && (
                    <button onClick={() => { setFilterStart(''); setFilterEnd(''); }} className="px-4 py-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 font-bold text-sm transition">Reset Filter</button>
                )}
            </div>

            {filteredGallery.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                    <Camera className="mx-auto text-slate-300 mb-4" size={48} />
                    <p className="text-slate-500 font-bold">Tidak ada foto ditemukan</p>
                    <p className="text-xs text-slate-400">Coba atur filter tanggal atau upload foto baru</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredGallery.map((item) => (
                        <div
                            key={item.id}
                            className="group relative aspect-square bg-slate-100 rounded-xl overflow-hidden cursor-pointer border hover:border-blue-400 transition shadow-sm hover:shadow-md"
                            onClick={() => setSelectedImage(item)}
                        >
                            <img src={item.url} className="w-full h-full object-cover transition duration-300 group-hover:scale-110" loading="lazy" referrerPolicy="no-referrer" />

                            {/* Progress Badge */}
                            {item.progress !== undefined && (
                                <div className="absolute top-2 right-2 bg-blue-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                                    {item.progress.toFixed(1)}%
                                </div>
                            )}

                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition" />
                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white opacity-0 group-hover:opacity-100 transition">
                                <p className="text-[10px] font-mono">{new Date(item.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
                    <button
                        className="absolute top-4 right-4 text-white hover:text-red-400 transition p-2 bg-white/10 rounded-full"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X size={24} />
                    </button>

                    <div className="max-w-4xl w-full max-h-screen flex flex-col items-center" onClick={e => e.stopPropagation()}>
                        <img
                            src={selectedImage.url}
                            className="max-w-full max-h-[80vh] rounded-lg shadow-2xl border border-white/10"
                            referrerPolicy="no-referrer"
                        />
                        <div className="mt-4 flex items-center gap-4 bg-black/50 px-6 py-3 rounded-full backdrop-blur-xl border border-white/10">
                            <div className="text-white text-center">
                                <p className="font-bold text-sm">Diambil pada {new Date(selectedImage.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                {selectedImage.progress !== undefined && <p className="text-xs text-blue-300 font-bold mt-1">Progress Proyek: {selectedImage.progress.toFixed(2)}%</p>}
                                {selectedImage.url.includes('google') && (
                                    <a href={selectedImage.url} target="_blank" rel="noreferrer" className="block text-[10px] text-blue-400 mt-1 hover:underline flex items-center justify-center gap-1">
                                        <ExternalLink size={10} /> Buka Original Link
                                    </a>
                                )}
                            </div>
                            {canEdit && (
                                <button
                                    onClick={() => handleDelete(selectedImage.id)}
                                    className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition"
                                    title="Hapus Foto"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectGallery;
