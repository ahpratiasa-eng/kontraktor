import React, { useState } from 'react';
import { FileText, Upload, Download, Trash2, FileCheck, FilePlus } from 'lucide-react';
import type { Project, ProjectDocument } from '../types';
import { generateSPKPDF, getDefaultSPKData, angkaTerbilang } from '../utils/spkGenerator';
import type { SPKData } from '../utils/spkGenerator';

interface DocumentsTabProps {
    activeProject: Project;
    updateProject: (data: Partial<Project>) => void;
    canEditProject: boolean;
    user?: { displayName?: string | null };
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ activeProject, updateProject, canEditProject, user }) => {
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showSPKModal, setShowSPKModal] = useState(false);

    // Upload form state
    const [docName, setDocName] = useState('');
    const [docType, setDocType] = useState<ProjectDocument['type']>('kontrak');
    const [docUrl, setDocUrl] = useState('');
    const [docNotes, setDocNotes] = useState('');

    // SPK form state
    const [spkData, setSpkData] = useState<SPKData>(getDefaultSPKData(activeProject));

    const documents = activeProject.documents || [];

    const handleUploadDocument = () => {
        if (!docName || !docUrl) {
            alert('Nama dan URL dokumen wajib diisi');
            return;
        }

        const newDoc: ProjectDocument = {
            id: Date.now(),
            name: docName,
            type: docType,
            url: docUrl,
            uploadDate: new Date().toISOString().split('T')[0],
            uploader: user?.displayName || 'User',
            notes: docNotes
        };

        updateProject({
            documents: [...documents, newDoc]
        });

        // Reset form
        setShowUploadModal(false);
        setDocName('');
        setDocUrl('');
        setDocNotes('');
    };

    const handleDeleteDocument = (id: number) => {
        if (!window.confirm('Hapus dokumen ini?')) return;
        updateProject({
            documents: documents.filter(d => d.id !== id)
        });
    };

    const handleGenerateSPK = () => {
        // Validate required fields
        if (!spkData.pihakKeduaNama || !spkData.pihakKeduaAlamat) {
            alert('Mohon isi data Pihak Kedua (Pelaksana)');
            return;
        }

        // Update terbilang
        spkData.terbilang = angkaTerbilang(spkData.nilaiKontrak).trim();

        generateSPKPDF(activeProject, spkData);
        setShowSPKModal(false);
    };

    const getDocTypeLabel = (type: ProjectDocument['type']) => {
        switch (type) {
            case 'kontrak': return 'Kontrak';
            case 'spk': return 'SPK';
            case 'addendum': return 'Addendum';
            case 'bast': return 'BAST';
            case 'lainnya': return 'Lainnya';
        }
    };

    const getDocTypeColor = (type: ProjectDocument['type']) => {
        switch (type) {
            case 'kontrak': return 'bg-blue-100 text-blue-700';
            case 'spk': return 'bg-purple-100 text-purple-700';
            case 'addendum': return 'bg-yellow-100 text-yellow-700';
            case 'bast': return 'bg-green-100 text-green-700';
            case 'lainnya': return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Dokumen Proyek</h2>
                    <p className="text-sm text-slate-500">Kelola kontrak, SPK, dan dokumen pendukung</p>
                </div>
                {canEditProject && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowSPKModal(true)}
                            className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-purple-700"
                        >
                            <FilePlus size={16} /> Buat SPK
                        </button>
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700"
                        >
                            <Upload size={16} /> Upload Dokumen
                        </button>
                    </div>
                )}
            </div>

            {/* Document List */}
            {documents.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                    <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="font-bold text-slate-600 mb-2">Belum ada dokumen</h3>
                    <p className="text-sm text-slate-400 mb-4">Upload dokumen kontrak, SPK, atau dokumen pendukung lainnya</p>
                    {canEditProject && (
                        <button
                            onClick={() => setShowSPKModal(true)}
                            className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-purple-700"
                        >
                            <FilePlus size={16} className="inline mr-2" /> Buat SPK Otomatis
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid gap-3">
                    {documents.map(doc => (
                        <div key={doc.id} className="bg-white p-4 rounded-2xl border flex items-center gap-4 hover:shadow-sm transition-shadow">
                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                                <FileCheck size={24} className="text-slate-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-slate-800 truncate">{doc.name}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getDocTypeColor(doc.type)}`}>
                                        {getDocTypeLabel(doc.type)}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-400">
                                    <span>{doc.uploader}</span> • <span>{new Date(doc.uploadDate).toLocaleDateString('id-ID')}</span>
                                    {doc.notes && <span> • {doc.notes}</span>}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100"
                                >
                                    <Download size={18} />
                                </a>
                                {canEditProject && (
                                    <button
                                        onClick={() => handleDeleteDocument(doc.id)}
                                        className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Upload Dokumen</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-slate-600 mb-1 block">Nama Dokumen *</label>
                                <input
                                    type="text"
                                    value={docName}
                                    onChange={(e) => setDocName(e.target.value)}
                                    placeholder="Contoh: Kontrak Kerja"
                                    className="w-full border rounded-xl p-3"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-bold text-slate-600 mb-1 block">Jenis Dokumen</label>
                                <select
                                    value={docType}
                                    onChange={(e) => setDocType(e.target.value as ProjectDocument['type'])}
                                    className="w-full border rounded-xl p-3"
                                >
                                    <option value="kontrak">Kontrak</option>
                                    <option value="spk">SPK</option>
                                    <option value="addendum">Addendum</option>
                                    <option value="bast">BAST</option>
                                    <option value="lainnya">Lainnya</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-bold text-slate-600 mb-1 block">URL Dokumen *</label>
                                <input
                                    type="url"
                                    value={docUrl}
                                    onChange={(e) => setDocUrl(e.target.value)}
                                    placeholder="https://drive.google.com/..."
                                    className="w-full border rounded-xl p-3"
                                />
                                <p className="text-xs text-slate-400 mt-1">Upload ke Google Drive, lalu paste link-nya di sini</p>
                            </div>

                            <div>
                                <label className="text-sm font-bold text-slate-600 mb-1 block">Catatan</label>
                                <input
                                    type="text"
                                    value={docNotes}
                                    onChange={(e) => setDocNotes(e.target.value)}
                                    placeholder="Catatan tambahan (opsional)"
                                    className="w-full border rounded-xl p-3"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="flex-1 border border-slate-300 text-slate-600 p-3 rounded-xl font-bold"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleUploadDocument}
                                className="flex-1 bg-blue-600 text-white p-3 rounded-xl font-bold"
                            >
                                Simpan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SPK Generator Modal */}
            {showSPKModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Generate SPK (Surat Perjanjian Kerja)</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Pihak Pertama */}
                            <div className="md:col-span-2">
                                <h4 className="font-bold text-slate-700 mb-2 text-sm uppercase tracking-wider">Pihak Pertama (Pemberi Kerja)</h4>
                            </div>
                            <div>
                                <label className="text-sm text-slate-600 mb-1 block">Nama *</label>
                                <input
                                    type="text"
                                    value={spkData.pihakPertamaNama}
                                    onChange={(e) => setSpkData({ ...spkData, pihakPertamaNama: e.target.value })}
                                    className="w-full border rounded-xl p-2.5 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-slate-600 mb-1 block">Jabatan</label>
                                <input
                                    type="text"
                                    value={spkData.pihakPertamaJabatan}
                                    onChange={(e) => setSpkData({ ...spkData, pihakPertamaJabatan: e.target.value })}
                                    className="w-full border rounded-xl p-2.5 text-sm"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-sm text-slate-600 mb-1 block">Alamat</label>
                                <input
                                    type="text"
                                    value={spkData.pihakPertamaAlamat}
                                    onChange={(e) => setSpkData({ ...spkData, pihakPertamaAlamat: e.target.value })}
                                    className="w-full border rounded-xl p-2.5 text-sm"
                                />
                            </div>

                            {/* Pihak Kedua */}
                            <div className="md:col-span-2 mt-4">
                                <h4 className="font-bold text-slate-700 mb-2 text-sm uppercase tracking-wider">Pihak Kedua (Pelaksana/Kontraktor)</h4>
                            </div>
                            <div>
                                <label className="text-sm text-slate-600 mb-1 block">Nama Direktur *</label>
                                <input
                                    type="text"
                                    value={spkData.pihakKeduaNama}
                                    onChange={(e) => setSpkData({ ...spkData, pihakKeduaNama: e.target.value })}
                                    placeholder="Nama penanggung jawab"
                                    className="w-full border rounded-xl p-2.5 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-slate-600 mb-1 block">Nama Perusahaan</label>
                                <input
                                    type="text"
                                    value={spkData.pihakKeduaPerusahaan}
                                    onChange={(e) => setSpkData({ ...spkData, pihakKeduaPerusahaan: e.target.value })}
                                    className="w-full border rounded-xl p-2.5 text-sm"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-sm text-slate-600 mb-1 block">Alamat Perusahaan *</label>
                                <input
                                    type="text"
                                    value={spkData.pihakKeduaAlamat}
                                    onChange={(e) => setSpkData({ ...spkData, pihakKeduaAlamat: e.target.value })}
                                    placeholder="Alamat kantor"
                                    className="w-full border rounded-xl p-2.5 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-slate-600 mb-1 block">NPWP</label>
                                <input
                                    type="text"
                                    value={spkData.pihakKeduaNPWP || ''}
                                    onChange={(e) => setSpkData({ ...spkData, pihakKeduaNPWP: e.target.value })}
                                    placeholder="00.000.000.0-000.000"
                                    className="w-full border rounded-xl p-2.5 text-sm"
                                />
                            </div>

                            {/* Detail Kontrak */}
                            <div className="md:col-span-2 mt-4">
                                <h4 className="font-bold text-slate-700 mb-2 text-sm uppercase tracking-wider">Detail Kontrak</h4>
                            </div>
                            <div>
                                <label className="text-sm text-slate-600 mb-1 block">Nomor SPK</label>
                                <input
                                    type="text"
                                    value={spkData.nomorSPK}
                                    onChange={(e) => setSpkData({ ...spkData, nomorSPK: e.target.value })}
                                    className="w-full border rounded-xl p-2.5 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-slate-600 mb-1 block">Tanggal SPK</label>
                                <input
                                    type="date"
                                    value={spkData.tanggalSPK}
                                    onChange={(e) => setSpkData({ ...spkData, tanggalSPK: e.target.value })}
                                    className="w-full border rounded-xl p-2.5 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-slate-600 mb-1 block">Nilai Kontrak (Rp)</label>
                                <input
                                    type="number"
                                    value={spkData.nilaiKontrak}
                                    onChange={(e) => setSpkData({ ...spkData, nilaiKontrak: parseInt(e.target.value) || 0 })}
                                    className="w-full border rounded-xl p-2.5 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-slate-600 mb-1 block">Jangka Waktu (Hari)</label>
                                <input
                                    type="number"
                                    value={spkData.jangkaWaktu}
                                    onChange={(e) => setSpkData({ ...spkData, jangkaWaktu: parseInt(e.target.value) || 0 })}
                                    className="w-full border rounded-xl p-2.5 text-sm"
                                />
                            </div>

                            {/* Termin Pembayaran */}
                            <div className="md:col-span-2 mt-4">
                                <h4 className="font-bold text-slate-700 mb-2 text-sm uppercase tracking-wider">Termin Pembayaran (%)</h4>
                            </div>
                            <div>
                                <label className="text-sm text-slate-600 mb-1 block">DP</label>
                                <input
                                    type="number"
                                    value={spkData.dpPercent}
                                    onChange={(e) => setSpkData({ ...spkData, dpPercent: parseInt(e.target.value) || 0 })}
                                    className="w-full border rounded-xl p-2.5 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-slate-600 mb-1 block">Termin 1 (50%)</label>
                                <input
                                    type="number"
                                    value={spkData.termin1Percent}
                                    onChange={(e) => setSpkData({ ...spkData, termin1Percent: parseInt(e.target.value) || 0 })}
                                    className="w-full border rounded-xl p-2.5 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-slate-600 mb-1 block">Termin 2 (80%)</label>
                                <input
                                    type="number"
                                    value={spkData.termin2Percent}
                                    onChange={(e) => setSpkData({ ...spkData, termin2Percent: parseInt(e.target.value) || 0 })}
                                    className="w-full border rounded-xl p-2.5 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-slate-600 mb-1 block">Pelunasan (100%)</label>
                                <input
                                    type="number"
                                    value={spkData.pelunasanPercent}
                                    onChange={(e) => setSpkData({ ...spkData, pelunasanPercent: parseInt(e.target.value) || 0 })}
                                    className="w-full border rounded-xl p-2.5 text-sm"
                                />
                            </div>

                            {/* Lainnya */}
                            <div>
                                <label className="text-sm text-slate-600 mb-1 block">Denda per Hari (Rp)</label>
                                <input
                                    type="number"
                                    value={spkData.dendaPerHari}
                                    onChange={(e) => setSpkData({ ...spkData, dendaPerHari: parseInt(e.target.value) || 0 })}
                                    className="w-full border rounded-xl p-2.5 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-slate-600 mb-1 block">Lokasi TTD</label>
                                <input
                                    type="text"
                                    value={spkData.lokasiTTD}
                                    onChange={(e) => setSpkData({ ...spkData, lokasiTTD: e.target.value })}
                                    placeholder="Jakarta"
                                    className="w-full border rounded-xl p-2.5 text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowSPKModal(false)}
                                className="flex-1 border border-slate-300 text-slate-600 p-3 rounded-xl font-bold"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleGenerateSPK}
                                className="flex-1 bg-purple-600 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2"
                            >
                                <Download size={18} /> Generate PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentsTab;
