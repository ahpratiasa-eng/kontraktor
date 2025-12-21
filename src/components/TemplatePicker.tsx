import React, { useState, useEffect } from 'react';
import { Loader2, Trash2, FileText, ArrowLeft } from 'lucide-react';
import { collection, query, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ProjectTemplate } from '../types';

interface TemplatePickerProps {
    onSelect: (template: ProjectTemplate) => void;
    onBack: () => void;
}

const TemplatePicker: React.FC<TemplatePickerProps> = ({ onSelect, onBack }) => {
    const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'project_templates'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedTemplates: ProjectTemplate[] = [];
            snapshot.forEach((docSnapshot) => {
                loadedTemplates.push({ id: docSnapshot.id, ...docSnapshot.data() } as ProjectTemplate);
            });
            loadedTemplates.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setTemplates(loadedTemplates);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleDelete = async (templateId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Hapus template ini?')) return;

        setIsDeleting(templateId);
        try {
            await deleteDoc(doc(db, 'project_templates', templateId));
        } catch (err) {
            alert('Gagal menghapus template');
        }
        setIsDeleting(null);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="animate-spin text-indigo-600 mb-3" size={32} />
                <p className="text-sm text-slate-500">Memuat template...</p>
            </div>
        );
    }

    if (templates.length === 0) {
        return (
            <div className="text-center py-12">
                <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                <h4 className="font-bold text-lg text-slate-600 mb-2">Belum Ada Template</h4>
                <p className="text-sm text-slate-400 mb-6">
                    Buat proyek terlebih dahulu, lalu simpan sebagai template dari halaman Ringkasan proyek.
                </p>
                <button
                    onClick={onBack}
                    className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200"
                >
                    <ArrowLeft size={16} className="inline mr-2" />
                    Kembali
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {templates.map((template) => (
                <button
                    key={template.id}
                    onClick={() => onSelect(template)}
                    className="w-full text-left p-4 bg-white border-2 border-slate-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-800 group-hover:text-indigo-700 truncate">
                                {template.name}
                            </h4>
                            {template.description && (
                                <p className="text-xs text-slate-500 mt-0.5 truncate">{template.description}</p>
                            )}
                            <div className="flex gap-3 mt-2 text-[10px] text-slate-400">
                                <span className="bg-slate-100 px-2 py-0.5 rounded">{template.rabItems.length} item RAB</span>
                                <span className="bg-slate-100 px-2 py-0.5 rounded">{template.workers.length} pekerja</span>
                                <span className="bg-slate-100 px-2 py-0.5 rounded">{template.materials.length} material</span>
                            </div>
                        </div>
                        <button
                            onClick={(e) => handleDelete(template.id, e)}
                            disabled={isDeleting === template.id}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                            title="Hapus template"
                        >
                            {isDeleting === template.id ? (
                                <Loader2 className="animate-spin" size={16} />
                            ) : (
                                <Trash2 size={16} />
                            )}
                        </button>
                    </div>
                </button>
            ))}

            <div className="pt-2">
                <button
                    onClick={onBack}
                    className="w-full py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 flex items-center justify-center gap-2"
                >
                    <ArrowLeft size={16} /> Kembali
                </button>
            </div>
        </div>
    );
};

export default TemplatePicker;
