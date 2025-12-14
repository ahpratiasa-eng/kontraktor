import React, { useState } from 'react';
import { Camera, Trash2, X, Plus } from 'lucide-react';
import type { Project, GalleryItem } from '../types';
import { compressImage } from '../utils/imageHelper';

interface ProjectGalleryProps {
    project: Project;
    updateProject: (data: Partial<Project>) => void;
    canEdit: boolean;
}

const ProjectGallery: React.FC<ProjectGalleryProps> = ({ project, updateProject, canEdit }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const newItems: GalleryItem[] = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const compressed = await compressImage(file, 1200, 0.7); // 1200px max, 70% quality

                newItems.push({
                    id: Date.now() + Math.random(),
                    url: compressed,
                    caption: '',
                    date: new Date().toISOString(),
                    uploader: 'User' // We could pass user info if needed, but keeping it simple
                });
            }

            const currentGallery = project.gallery || [];
            updateProject({ gallery: [...newItems, ...currentGallery] });
        } catch (error) {
            console.error(error);
            alert("Gagal mengupload foto.");
        } finally {
            setIsUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleDelete = (id: number) => {
        if (!confirm("Hapus foto ini?")) return;
        const currentGallery = project.gallery || [];
        updateProject({ gallery: currentGallery.filter(item => item.id !== id) });
        if (selectedImage?.id === id) setSelectedImage(null);
    };

    const gallery = project.gallery || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-lg text-slate-800">Galeri Proyek</h3>
                    <p className="text-sm text-slate-500">{gallery.length} Foto Tersimpan</p>
                </div>
                {canEdit && (
                    <label className={`bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 cursor-pointer hover:bg-blue-700 transition shadow-lg ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {isUploading ? <span className="animate-spin">⌛</span> : <Plus size={18} />}
                        {isUploading ? 'Mengupload...' : 'Tambah Foto'}
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={handleUpload}
                            disabled={isUploading}
                        />
                    </label>
                )}
            </div>

            {gallery.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                    <Camera className="mx-auto text-slate-300 mb-4" size={48} />
                    <p className="text-slate-500 font-bold">Belum ada foto dokumentasi</p>
                    <p className="text-xs text-slate-400">Foto progress proyek akan muncul disini</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {gallery.map((item) => (
                        <div
                            key={item.id}
                            className="group relative aspect-square bg-slate-100 rounded-xl overflow-hidden cursor-pointer border hover:border-blue-400 transition"
                            onClick={() => setSelectedImage(item)}
                        >
                            <img src={item.url} className="w-full h-full object-cover transition duration-300 group-hover:scale-110" loading="lazy" />
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
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
                    <button
                        className="absolute top-4 right-4 text-white hover:text-red-400 transition"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X size={32} />
                    </button>

                    <div className="max-w-4xl w-full max-h-screen flex flex-col items-center" onClick={e => e.stopPropagation()}>
                        <img
                            src={selectedImage.url}
                            className="max-w-full max-h-[80vh] rounded-lg shadow-2xl"
                        />
                        <div className="mt-4 flex items-center gap-4">
                            <div className="text-white text-center">
                                <p className="font-bold text-sm">Diambil pada {new Date(selectedImage.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            {canEdit && (
                                <button
                                    onClick={() => handleDelete(selectedImage.id)}
                                    className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition"
                                    title="Hapus Foto"
                                >
                                    <Trash2 size={20} />
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
