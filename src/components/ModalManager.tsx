import React, { useState } from 'react';
import { X, Camera, Loader2, Save, Upload, Download, FileText as FileType, Calendar, Wallet, AlertTriangle } from 'lucide-react';
import { NumberInput } from './UIComponents';
import VoiceInput from './VoiceInput';
import ReceiptScanner from './ReceiptScanner';

import RABModal from './modals/RABModal';
import WorkerModal from './modals/WorkerModal';
import AttendanceModal from './modals/AttendanceModal';
import StockMovementModal from './modals/StockMovementModal';
import MaterialModal from './modals/MaterialModal';
import QCModal from './modals/QCModal';
import TemplatePicker from './TemplatePicker';

import * as XLSX from 'xlsx';
import type { UserRole, Material, RABItem, Project, AHSItem, PricingResource } from '../types';



interface ModalManagerProps {
    modalType: string | null;
    setModalType: (t: string | null) => void;
    showModal: boolean;
    setShowModal: (s: boolean) => void;
    // Handlers
    handleEditProject: () => void;
    handleSaveRAB: (data: { category: string, name: string, unit: string, vol: number, price: number, ahsId?: string | null }) => void;
    handleUpdateProgress: () => void;
    handlePayWorker: () => void;
    handleSaveWorker: (data: { name: string, role: string, wageUnit: string, realRate: number, mandorRate: number, cashAdvanceLimit: number }) => void;
    handleStockMovement: (material: Material, type: 'in' | 'out', qty: number, date: string, notes: string) => void;
    handleSaveMaterial: (name: string, unit: string, minStock: number, initialStock: number) => void;
    handleEditMaterial: (name: string, unit: string, minStock: number) => void;
    handleAddUser: () => void;
    handleGenerateRAB: () => void;
    saveAttendanceWithEvidence: () => void;
    handleImportRAB: (items: any[]) => void;
    handleSaveSchedule: () => void;
    getFilteredEvidence: () => any[]; // For gallery

    openModal: (type: string) => void;
    handleSaveTransaction: () => void; // NEW: Save general transaction

    // State Setters & Values
    inputName: string; setInputName: (s: string) => void;
    inputClient: string; setInputClient: (s: string) => void;
    inputLocation: string; setInputLocation: (s: string) => void;
    inputOwnerPhone: string; setInputOwnerPhone: (s: string) => void;
    inputBudget: number; setInputBudget: (n: number) => void;
    inputStartDate: string; setInputStartDate: (s: string) => void;
    inputEndDate: string; setInputEndDate: (s: string) => void;
    inputHeroImage: string; setInputHeroImage: (s: string) => void;

    progressInput: number; setProgressInput: (n: number) => void;
    progressDate: string; setProgressDate: (s: string) => void;
    progressNote: string; setProgressNote: (s: string) => void;
    paymentAmount: number; setPaymentAmount: (n: number) => void;

    // Transaction States
    transactionDesc: string; setTransactionDesc: (s: string) => void;
    transactionAmount: number; setTransactionAmount: (n: number) => void;
    transactionDate: string; setTransactionDate: (s: string) => void;
    transactionType?: 'expense' | 'income'; setTransactionType?: (t: 'expense' | 'income') => void;
    transactionCategory?: string; setTransactionCategory?: (s: string) => void;


    inputEmail: string; setInputEmail: (s: string) => void;
    inputRole: UserRole; setInputRole: (r: UserRole) => void;

    selectedMaterial: Material | null;

    aiPrompt: string; setAiPrompt: (s: string) => void;
    isGeneratingAI: boolean;

    attendanceDate: string; setAttendanceDate: (s: string) => void;
    attendanceData: any; setAttendanceData: (d: any) => void;
    evidencePhoto: string | null;
    evidenceLocation: string | null;
    isGettingLoc: boolean;
    handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;

    activeProject: Project | null;
    selectedRabItem: RABItem | null;
    selectedWorkerId: number | null;

    // AHS Integration
    ahsItems: AHSItem[];
    resources: PricingResource[]; // Standard prices (SHD)

    transactionProof?: string | null;
    setTransactionProof?: (s: string | null) => void;
    handleSaveQC?: (checklist: { items: any[], photoUrl?: string }) => void;
    handleSaveDefect?: (defect: any) => void;
}

const ModalManager: React.FC<ModalManagerProps> = (props) => {
    const {
        modalType, setModalType, showModal, setShowModal,
        handleEditProject, handleSaveRAB, handleUpdateProgress, handlePayWorker, handleSaveWorker, handleStockMovement, handleSaveMaterial, handleEditMaterial, handleAddUser, handleGenerateRAB, saveAttendanceWithEvidence, handleImportRAB, handleSaveSchedule,
        handleSaveTransaction, handleSaveQC, handleSaveDefect,
        inputName, setInputName, inputClient, setInputClient, inputLocation, setInputLocation, inputOwnerPhone, setInputOwnerPhone, inputBudget, setInputBudget, inputStartDate, setInputStartDate, inputEndDate, setInputEndDate, inputHeroImage, setInputHeroImage,
        progressInput, setProgressInput, progressDate, setProgressDate, progressNote, setProgressNote,
        paymentAmount, setPaymentAmount,
        transactionDesc, setTransactionDesc, transactionAmount, setTransactionAmount, transactionDate, setTransactionDate,
        transactionType = 'expense', transactionCategory, setTransactionCategory,
        transactionProof, setTransactionProof,
        inputEmail, setInputEmail, inputRole, setInputRole,
        aiPrompt, setAiPrompt, isGeneratingAI,
        attendanceDate, setAttendanceDate, attendanceData, setAttendanceData, evidencePhoto, evidenceLocation, handlePhotoUpload, isGettingLoc,
        activeProject, selectedRabItem, selectedWorkerId, selectedMaterial,
        ahsItems, resources,
    } = props;

    // Defect State
    const [defectDesc, setDefectDesc] = useState('');
    const [defectLoc, setDefectLoc] = useState('');
    const [defectPhoto, setDefectPhoto] = useState<string | null>(null);






    // State for Resource picker in Worker modal


    // State for Resource picker in Worker modal
    // State for Resource picker moved to WorkerModal
    const [isUploading, setIsUploading] = useState(false);



    const handleSaveTransactionWrapper = async () => {
        try {
            setIsUploading(true);
            await (handleSaveTransaction as any)();
        } catch (e) {
            console.error(e);
            alert("Gagal menyimpan transaksi");
        } finally {
            setIsUploading(false);
        }
    };





    const downloadTemplate = () => {
        const ws = XLSX.utils.json_to_sheet([
            { "Kategori": "A. PERSIAPAN", "Nama Item": "Pembersihan Lahan", "Satuan": "m2", "Volume": 100, "Harga Satuan": 15000 },
            { "Kategori": "B. STRUKTUR", "Nama Item": "Galian Tanah", "Satuan": "m3", "Volume": 50, "Harga Satuan": 75000 }
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template RAB");
        XLSX.writeFile(wb, "Template_RAB_KontraktorPro.xlsx");
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // Dynamic import the new utility
            const { parseRABExcel } = await import('../utils/excelImport');
            const items = await parseRABExcel(file);
            handleImportRAB(items);
            alert(`Berhasil mengimpor ${items.length} item pekerjaan!`);
            setShowModal(false);
        } catch (error) {
            console.error(error);
            alert('Gagal membaca file Excel. Pastikan format sesuai.');
        }
    };

    if (!showModal) return null;

    const closeModal = () => setShowModal(false);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative flex flex-col">
                <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10 p-1 bg-white rounded-full"><X size={20} /></button>

                <div className="p-6">
                    {modalType === 'newProject' && (
                        <div className="space-y-4">
                            <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                                <h3 className="font-bold text-xl">Proyek Baru</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setModalType('selectTemplate')}
                                        className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-200 font-bold flex items-center gap-1 hover:bg-indigo-100"
                                    >
                                        <Download size={14} /> Dari Template
                                    </button>
                                    <button
                                        onClick={() => setModalType('importRAB')}
                                        className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded-lg border border-green-200 font-bold flex items-center gap-1 hover:bg-green-100"
                                    >
                                        <Upload size={14} /> Import Excel
                                    </button>
                                </div>
                            </div>
                            <input className="w-full p-3 border rounded-xl" placeholder="Nama Proyek (Wajib)" value={inputName} onChange={e => setInputName(e.target.value)} />
                            <input className="w-full p-3 border rounded-xl" placeholder="Klien / Pemilik" value={inputClient} onChange={e => setInputClient(e.target.value)} />
                            <input className="w-full p-3 border rounded-xl" placeholder="No WA Owner (Contoh: 62812345678)" value={inputOwnerPhone} onChange={e => setInputOwnerPhone(e.target.value)} />
                            <input className="w-full p-3 border rounded-xl" placeholder="Lokasi Proyek (Kota/Daerah) - Penting untuk Cuaca" value={inputLocation} onChange={e => setInputLocation(e.target.value)} />
                            <div className="flex gap-2">
                                <div className="flex-1"><label className="text-xs font-bold ml-1">Mulai</label><input type="date" className="w-full p-3 border rounded-xl" value={inputStartDate} onChange={e => setInputStartDate(e.target.value)} /></div>
                                <div className="flex-1"><label className="text-xs font-bold ml-1">Selesai</label><input type="date" className="w-full p-3 border rounded-xl" value={inputEndDate} onChange={e => setInputEndDate(e.target.value)} /></div>
                            </div>

                            {/* Hero Image Upload */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold ml-1">Foto Sampul Proyek</label>
                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-slate-50 transition relative overflow-hidden bg-slate-50">
                                    {inputHeroImage ? (
                                        <>
                                            <img src={inputHeroImage} className="w-full h-40 object-cover rounded-lg mb-2" />
                                            <button
                                                onClick={() => setInputHeroImage('')}
                                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md"
                                                title="Hapus Foto"
                                            >
                                                <X size={14} />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="py-8 text-center pointer-events-none">
                                            <Camera className="mx-auto text-slate-400 mb-2" size={32} />
                                            <p className="text-sm text-slate-500">Upload Foto Sampul</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            try {
                                                // Dynamic imports
                                                const { compressImage } = await import('../utils/imageHelper');
                                                const { uploadProjectCover } = await import('../utils/storageHelper');

                                                // Show loading state if needed (optional since we don't have local loading state here easily without adding it)
                                                // For now, simple alert or blocking might be needed or just let it run
                                                // Let's add a temporary loading text

                                                const compressed = await compressImage(file, 1920, 0.9);
                                                const url = await uploadProjectCover(compressed);
                                                setInputHeroImage(url);
                                            } catch (err) {
                                                console.error(err);
                                                alert('Gagal upload foto sampul.');
                                            }
                                        }}
                                    />
                                    {/* Overlay for "Change" if image exists */}
                                    {inputHeroImage && (
                                        <div className="absolute bottom-2 right-2 pointer-events-none">
                                            <span className="bg-black/50 text-white text-xs px-2 py-1 rounded">Ganti</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <NumberInput placeholder="Budget Limit (Opsional)" className="w-full p-3 border rounded-xl" value={inputBudget} onChange={setInputBudget} />
                            <button onClick={handleEditProject} className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold shadow-lg hover:bg-blue-700">Buat Proyek</button>
                        </div>
                    )}

                    {modalType === 'editProject' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-xl mb-4">Edit Proyek</h3>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 ml-1">Nama Proyek</label>
                                <input className="w-full p-3 border rounded-xl" placeholder="Nama Proyek" value={inputName} onChange={e => setInputName(e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 ml-1">Nama Klien</label>
                                <input className="w-full p-3 border rounded-xl" placeholder="Klien" value={inputClient} onChange={e => setInputClient(e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 ml-1">No. WhatsApp Owner</label>
                                <input className="w-full p-3 border rounded-xl" placeholder="628xxxxxxxxxx" value={inputOwnerPhone} onChange={e => setInputOwnerPhone(e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 ml-1">Lokasi Proyek</label>
                                <input className="w-full p-3 border rounded-xl" placeholder="Lokasi Proyek" value={inputLocation} onChange={e => setInputLocation(e.target.value)} />
                            </div>
                            <div className="flex gap-3">
                                <div className="flex-1 space-y-1">
                                    <label className="text-xs font-bold text-slate-600 ml-1">Tanggal Mulai</label>
                                    <input type="date" className="w-full p-3 border rounded-xl" value={inputStartDate} onChange={e => setInputStartDate(e.target.value)} />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <label className="text-xs font-bold text-slate-600 ml-1">Tanggal Selesai</label>
                                    <input type="date" className="w-full p-3 border rounded-xl" value={inputEndDate} onChange={e => setInputEndDate(e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 ml-1">Budget Limit (Rp)</label>
                                <NumberInput placeholder="Masukkan budget limit" className="w-full p-3 border rounded-xl" value={inputBudget} onChange={setInputBudget} />
                            </div>

                            {/* Hero Image Check/Upload */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 ml-1">Foto Sampul</label>
                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-slate-50 transition relative overflow-hidden bg-slate-50">
                                    {inputHeroImage ? (
                                        <>
                                            <img src={inputHeroImage} className="w-full h-40 object-cover rounded-lg mb-2" />
                                            <button
                                                onClick={() => setInputHeroImage('')}
                                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md z-10"
                                                title="Hapus Foto"
                                            >
                                                <X size={14} />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="py-8 text-center pointer-events-none">
                                            <Camera className="mx-auto text-slate-400 mb-2" size={32} />
                                            <p className="text-sm text-slate-500">Upload Foto Sampul</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            try {
                                                const { compressImage } = await import('../utils/imageHelper');
                                                const { uploadProjectCover } = await import('../utils/storageHelper');

                                                const compressed = await compressImage(file, 1920, 0.9);
                                                const url = await uploadProjectCover(compressed, activeProject?.id);
                                                setInputHeroImage(url);
                                            } catch (err) {
                                                console.error(err);
                                                alert('Gagal upload foto sampul.');
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <button onClick={handleEditProject} className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 mt-2">Simpan Perubahan</button>
                        </div>
                    )}

                    {modalType === 'newRAB' && (
                        <RABModal
                            activeProject={activeProject}
                            selectedRabItem={selectedRabItem}
                            ahsItems={ahsItems}
                            onSave={handleSaveRAB}
                        />
                    )}

                    {modalType === 'updateProgress' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-xl mb-4">Update Progress Fisik</h3>
                            <div className="bg-slate-50 p-4 rounded-xl mb-4">
                                <p className="font-bold">{selectedRabItem?.name}</p>
                                <p className="text-sm text-slate-500">Progress saat ini: {selectedRabItem?.progress}%</p>
                            </div>
                            <label className="block text-sm font-bold">Progress Baru (%)</label>
                            <input type="range" min="0" max="100" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" value={progressInput} onChange={e => setProgressInput(Number(e.target.value))} />
                            <div className="flex justify-between font-bold text-lg text-blue-600"><span>0%</span><span>{progressInput}%</span><span>100%</span></div>
                            <input type="date" className="w-full p-3 border rounded-xl" value={progressDate} onChange={e => setProgressDate(e.target.value)} />
                            <VoiceInput
                                value={progressNote}
                                onChange={setProgressNote}
                                placeholder="Catatan progress (Gunakan tombol Mic untuk dikte suara)..."
                                className="h-24"
                            />
                            <button onClick={handleUpdateProgress} className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold shadow-lg">Simpan Progress</button>
                        </div>
                    )}

                    {modalType === 'payWorker' && (
                        (() => {
                            // Calculate kasbon balance for selected worker
                            const workerKasbon = (activeProject?.cashAdvances || [])
                                .filter(ca => ca.workerId === selectedWorkerId && ca.status !== 'paid')
                                .reduce((sum, ca) => sum + ca.remainingAmount, 0);
                            const selectedWorker = activeProject?.workers?.find(w => w.id === selectedWorkerId);

                            return (
                                <div className="space-y-4">
                                    <h3 className="font-bold text-xl mb-4">Bayar Upah Pekerja</h3>

                                    {selectedWorker && (
                                        <div className="bg-slate-50 p-4 rounded-xl border mb-2">
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-slate-700">{selectedWorker.name}</span>
                                                <span className="text-xs text-slate-500">{selectedWorker.role}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Kasbon Balance Info */}
                                    {workerKasbon > 0 && (
                                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-bold text-orange-700">💰 Saldo Kasbon</span>
                                                <span className="text-lg font-black text-orange-600">
                                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(workerKasbon)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-orange-600">
                                                Tukang ini punya kasbon aktif. Anda bisa potong dari pembayaran di menu Kasbon Tukang.
                                            </p>
                                        </div>
                                    )}

                                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                                        <p className="text-sm">Pembayaran ini akan dicatat sebagai Pengeluaran (Upah Tukang).</p>
                                    </div>

                                    <NumberInput className="w-full p-3 border rounded-xl font-bold text-lg" placeholder="Nominal Pembayaran" value={paymentAmount} onChange={setPaymentAmount} />
                                    <button onClick={handlePayWorker} className="w-full bg-green-600 text-white p-3 rounded-xl font-bold shadow-lg hover:bg-green-700">Bayar Sekarang</button>
                                </div>
                            );
                        })()
                    )}

                    {modalType === 'newWorker' && (
                        <WorkerModal
                            selectedWorkerId={selectedWorkerId}
                            initialData={selectedWorkerId && activeProject ? activeProject.workers.find(w => w.id === selectedWorkerId) : null}
                            resources={resources}
                            onSave={handleSaveWorker}
                        />
                    )}

                    {modalType === 'attendance' && activeProject && (
                        <AttendanceModal
                            activeProject={activeProject}
                            attendanceDate={attendanceDate}
                            setAttendanceDate={setAttendanceDate}
                            attendanceData={attendanceData}
                            setAttendanceData={setAttendanceData}
                            evidencePhoto={evidencePhoto}
                            evidenceLocation={evidenceLocation}
                            isGettingLoc={isGettingLoc}
                            handlePhotoUpload={handlePhotoUpload}
                            onSave={saveAttendanceWithEvidence}
                        />
                    )}

                    {modalType === 'stockMovement' && selectedMaterial && (
                        <StockMovementModal
                            selectedMaterial={selectedMaterial}
                            onSave={handleStockMovement}
                        />
                    )}

                    {modalType === 'newMaterial' && (
                        <MaterialModal
                            activeProject={activeProject!}
                            selectedMaterial={selectedMaterial}
                            onSave={handleSaveMaterial}
                            onEdit={handleEditMaterial}
                        />
                    )}

                    {modalType === 'addUser' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-xl mb-4">Tambah Pengguna App</h3>
                            <input className="w-full p-3 border rounded-xl" placeholder="Nama Lengkap" value={inputName} onChange={e => setInputName(e.target.value)} />
                            <input className="w-full p-3 border rounded-xl" type="email" placeholder="Email Google" value={inputEmail} onChange={e => setInputEmail(e.target.value)} />
                            <div className="space-y-2">
                                <label className="text-xs font-bold">Akses Role</label>
                                <select className="w-full p-3 border rounded-xl bg-white" value={inputRole} onChange={e => setInputRole(e.target.value as UserRole)}>
                                    <option value="pengawas">Pengawas (Absen & Tukang Only)</option>
                                    <option value="keuangan">Keuangan (Uang Only)</option>
                                    <option value="kontraktor">Kontraktor (Project Manager)</option>
                                    <option value="super_admin">Super Admin (Owner)</option>
                                </select>
                            </div>
                            <button onClick={handleAddUser} className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold shadow-lg">Beri Akses</button>
                        </div>
                    )}

                    {modalType === 'aiRAB' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-xl mb-4 flex items-center gap-2"><Save className="text-purple-600" /> AI Generator RAB</h3>
                            <div className="bg-purple-50 p-4 rounded-xl text-sm text-purple-800">
                                Ketik deskripsi proyek Anda, AI akan membuatkan daftar item RAB secara otomatis.
                            </div>
                            <textarea className="w-full p-4 border rounded-xl h-32" placeholder="Contoh: Renovasi kamar mandi ukuran 2x3 meter, keramik dinding full, closet duduk toto, shower..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} />
                            <button onClick={handleGenerateRAB} disabled={isGeneratingAI} className="w-full bg-purple-600 text-white p-3 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 disabled:bg-slate-400">
                                {isGeneratingAI ? <><Loader2 className="animate-spin" /> Sedang Berpikir...</> : 'Generate RAB Otomatis'}
                            </button>
                        </div>
                    )}

                    {modalType === 'importRAB' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-xl mb-4 flex items-center gap-2"><Upload size={24} className="text-green-600" /> Import RAB Excel</h3>

                            <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 space-y-2">
                                <p className="font-bold">Panduan:</p>
                                <ul className="list-disc pl-5">
                                    <li>Sistem cerdas akan mencari kolom: <b>Uraian, Volume, Satuan, Harga Satuan</b>.</li>
                                    <li>Format Excel bebas (tidak harus template), asalkan ada header kolom tersebut.</li>
                                    <li>Baris tanpa volume akan dianggap sebagai Kategori Pekerjaan.</li>
                                </ul>
                            </div>

                            <button onClick={downloadTemplate} className="w-full border border-green-600 text-green-600 p-3 rounded-xl font-bold hover:bg-green-50 flex items-center justify-center gap-2">
                                <Download size={18} /> Download Template Excel
                            </button>

                            <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center hover:bg-slate-50 transition cursor-pointer">
                                <FileType size={32} className="text-slate-400 mb-2" />
                                <p className="text-sm text-slate-500 mb-2">Upload file .xlsx atau .xls</p>
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleFileUpload}
                                />
                            </div>
                        </div>
                    )}

                    {/* SELECT TEMPLATE MODAL */}
                    {modalType === 'selectTemplate' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-xl mb-4 flex items-center gap-2"><Download size={24} className="text-indigo-600" /> Pilih Template</h3>

                            <div className="bg-indigo-50 p-4 rounded-xl text-sm text-indigo-800 mb-4">
                                <p>Pilih template untuk mengisi RAB dan tim secara otomatis:</p>
                            </div>

                            <TemplatePicker
                                onSelect={(template) => {
                                    // Apply template data and go back to newProject
                                    handleImportRAB(template.rabItems.map((item, idx) => ({
                                        ...item,
                                        id: idx + 1,
                                        progress: 0,
                                    })) as any);
                                    setModalType('newProject');
                                    alert(`✅ Template "${template.name}" berhasil diterapkan!\n\nRAB sudah terisi otomatis. Lengkapi info proyek lalu klik Buat Proyek.`);
                                }}
                                onBack={() => setModalType('newProject')}
                            />
                        </div>
                    )}

                    {modalType === 'itemSchedule' && selectedRabItem && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-xl mb-4 flex items-center gap-2"><Calendar className="text-blue-600" /> Atur Jadwal Pekerjaan</h3>
                            <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 mb-2">
                                <p className="font-bold">{selectedRabItem.name}</p>
                                <p className="text-xs mt-1">Tentukan kapan pekerjaan ini dimulai dan berakhir (Rencana).</p>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Tanggal Mulai (Start Date)</label>
                                    <input type="date" className="w-full p-3 border rounded-xl" value={inputStartDate} onChange={e => setInputStartDate(e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Tanggal Selesai (End Date)</label>
                                    <input type="date" className="w-full p-3 border rounded-xl" value={inputEndDate} onChange={e => setInputEndDate(e.target.value)} />
                                </div>
                            </div>

                            <button onClick={handleSaveSchedule} className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 mt-4">
                                Simpan Jadwal
                            </button>
                        </div>
                    )}

// ...
                    {modalType === 'qcModal' && selectedRabItem && (
                        <QCModal
                            selectedRabItem={selectedRabItem}
                            onSave={handleSaveQC || ((() => alert("Fungsi simpan QC tidak tersedia")) as any)}
                            onClose={closeModal}
                        />
                    )}

                    {modalType === 'newDefect' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-xl mb-4 flex items-center gap-2 text-red-600">
                                <AlertTriangle /> Catat Temuan (Defect)
                            </h3>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 ml-1">Deskripsi Temuan / Komplain</label>
                                    <textarea
                                        className="w-full p-3 border rounded-xl bg-white focus:ring-2 focus:ring-red-500 min-h-[80px]"
                                        placeholder="Contoh: Dinding retak rambut, Cat tidak rata, dll..."
                                        value={defectDesc}
                                        onChange={e => setDefectDesc(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 ml-1">Lokasi Detail</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border rounded-xl bg-white"
                                        placeholder="Contoh: Kamar Tidur Utama, Lantai 2"
                                        value={defectLoc}
                                        onChange={e => setDefectLoc(e.target.value)}
                                    />
                                </div>

                                {/* Photo Upload */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 ml-1">Foto Temuan (Opsional tapi disarankan)</label>
                                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-slate-50 transition relative overflow-hidden bg-slate-50 min-h-[120px]">
                                        {defectPhoto ? (
                                            <>
                                                <img src={defectPhoto} className="h-32 object-contain rounded mb-2" />
                                                <button
                                                    onClick={() => setDefectPhoto(null)}
                                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <Camera className="mx-auto text-slate-400 mb-2" size={24} />
                                                <p className="text-xs text-slate-500">Upload Foto</p>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                try {
                                                    const { compressImage } = await import('../utils/imageHelper');
                                                    setIsUploading(true);
                                                    const compressed = await compressImage(file, 1024, 0.8);
                                                    setDefectPhoto(compressed);
                                                } catch (err) {
                                                    console.error(err);
                                                    alert('Gagal upload foto');
                                                } finally {
                                                    setIsUploading(false);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button onClick={() => closeModal()} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl">
                                    Batal
                                </button>
                                <button
                                    className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 disabled:bg-slate-300"
                                    disabled={!defectDesc || isUploading}
                                    onClick={() => {
                                        if (handleSaveDefect) {
                                            handleSaveDefect({ description: defectDesc, location: defectLoc, photoUrl: defectPhoto || undefined });
                                        }
                                    }}
                                >
                                    Simpan Temuan
                                </button>
                            </div>
                        </div>
                    )}

                    {modalType === 'newTransaction' && (
                        <div className="space-y-4">
                            <h3 className={`font-bold text-xl mb-2 flex items-center gap-2 ${transactionType === 'income' ? 'text-green-700' : 'text-slate-800'}`}>
                                <Wallet className={transactionType === 'income' ? 'text-green-600' : 'text-red-600'} />
                                {transactionType === 'income' ? 'Catat Pemasukan' : 'Catat Pengeluaran'}
                            </h3>


                            <div className="space-y-3">
                                {/* CATEGORY SELECTOR - Select with RAB categories + Lainnya */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 ml-1">Kategori</label>
                                    {transactionType === 'expense' ? (
                                        <>
                                            <select
                                                className="w-full p-3 border rounded-xl bg-white"
                                                value={transactionCategory === '__LAINNYA__' ||
                                                    (transactionCategory && ![
                                                        ...(activeProject?.rabItems?.map(r => r.category).filter(Boolean) || []),
                                                        'Material', 'Upah Tukang', 'Operasional', 'Sewa Alat', 'Kasbon Tukang'
                                                    ].includes(transactionCategory)) ? '__LAINNYA__' : transactionCategory}
                                                onChange={e => {
                                                    if (setTransactionCategory) {
                                                        if (e.target.value === '__LAINNYA__') {
                                                            setTransactionCategory('__LAINNYA__');
                                                        } else {
                                                            setTransactionCategory(e.target.value);
                                                        }
                                                    }
                                                }}
                                            >
                                                {/* RAB Categories from project */}
                                                {activeProject?.rabItems &&
                                                    [...new Set(activeProject.rabItems.map(r => r.category))].filter(Boolean).length > 0 && (
                                                        <optgroup label="📋 Kategori RAB">
                                                            {[...new Set(activeProject.rabItems.map(r => r.category))].filter(Boolean).map(cat => (
                                                                <option key={`rab-${cat}`} value={cat}>{cat}</option>
                                                            ))}
                                                        </optgroup>
                                                    )}
                                                {/* Default categories */}
                                                <optgroup label="📁 Kategori Umum">
                                                    <option value="Material">Material</option>
                                                    <option value="Upah Tukang">Upah Tukang</option>
                                                    <option value="Operasional">Operasional</option>
                                                    <option value="Sewa Alat">Sewa Alat</option>
                                                    <option value="Kasbon Tukang">Kasbon Tukang</option>
                                                </optgroup>
                                                <option value="__LAINNYA__">✏️ Lainnya (ketik manual)</option>
                                            </select>

                                            {/* Custom input when Lainnya is selected */}
                                            {(transactionCategory === '__LAINNYA__' ||
                                                (transactionCategory && ![
                                                    ...(activeProject?.rabItems?.map(r => r.category).filter(Boolean) || []),
                                                    'Material', 'Upah Tukang', 'Operasional', 'Sewa Alat', 'Kasbon Tukang', '__LAINNYA__'
                                                ].includes(transactionCategory))) && (
                                                    <input
                                                        type="text"
                                                        className="w-full p-3 border rounded-xl bg-white mt-2"
                                                        placeholder="Ketik nama kategori..."
                                                        value={transactionCategory === '__LAINNYA__' ? '' : transactionCategory}
                                                        onChange={e => setTransactionCategory && setTransactionCategory(e.target.value)}
                                                        autoFocus
                                                    />
                                                )}

                                            <p className="text-[10px] text-slate-400 ml-1 mt-1">
                                                💡 Pilih kategori RAB agar Analisa Profit akurat
                                            </p>
                                        </>
                                    ) : (
                                        <select
                                            className="w-full p-3 border rounded-xl bg-white"
                                            value={transactionCategory}
                                            onChange={e => setTransactionCategory && setTransactionCategory(e.target.value)}
                                        >
                                            <option value="Termin">Termin</option>
                                            <option value="DP">Uang Muka (DP)</option>
                                            <option value="Pelunasan">Pelunasan</option>
                                            <option value="Tambahan">Tambahan</option>
                                        </select>
                                    )}
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 ml-1">Total Nominal (Rp)</label>
                                    <NumberInput
                                        className="w-full p-3 border rounded-xl font-bold text-lg"
                                        placeholder="0"
                                        value={transactionAmount}
                                        onChange={setTransactionAmount}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 ml-1">Tanggal Transaksi</label>
                                    <input
                                        type="date"
                                        className="w-full p-3 border rounded-xl"
                                        value={transactionDate}
                                        onChange={e => setTransactionDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 ml-1">Keterangan / Deskripsi</label>
                                    <textarea
                                        className="w-full p-3 border rounded-xl h-20"
                                        placeholder={transactionType === 'income' ? "Contoh: Pembayaran Termin 1 (30%)" : "Contoh: Beli Semen 50 Sak"}
                                        value={transactionDesc}
                                        onChange={e => setTransactionDesc(e.target.value)}
                                    />
                                </div>

                                {/* BUKTI TRANSAKSI & AI SCANNER */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 ml-1 mb-2 block">
                                        Scan Bukti / Upload Foto (AI Powered)
                                    </label>
                                    <ReceiptScanner
                                        type={transactionType}
                                        onScanComplete={(data) => {
                                            setTransactionAmount && setTransactionAmount(data.amount);
                                            setTransactionDate && setTransactionDate(data.date);
                                            setTransactionDesc && setTransactionDesc(`${data.description} (Auto-Scan)`);
                                            setTransactionCategory && setTransactionCategory(data.category);
                                            setTransactionProof && setTransactionProof(data.imageUrl);
                                            // Handle potential 'category' mismatch if exact string doesn't match options
                                            // Ideally we might want to map AI category to known categories here
                                        }}
                                    />

                                    {/* Proof Preview (Restored) */}
                                    {transactionProof && (
                                        <div className="mt-2 flex items-center gap-3 bg-green-50 p-2 rounded-lg border border-green-200 animate-in fade-in slide-in-from-top-1">
                                            <img src={transactionProof} className="w-10 h-10 object-cover rounded bg-white border" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-bold text-green-700 truncate">Bukti Terlampir</p>
                                                <p className="text-[9px] text-green-600">Siap disimpan</p>
                                            </div>
                                            <button
                                                onClick={() => setTransactionProof && setTransactionProof(null)}
                                                className="p-1 bg-white text-slate-400 hover:text-red-500 rounded-full border shadow-sm transition"
                                                title="Hapus Bukti"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleSaveTransactionWrapper}
                                disabled={isUploading}
                                className={`w-full text-white p-3 rounded-xl font-bold shadow-lg mt-2 flex items-center justify-center gap-2 ${transactionType === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                            >
                                {isUploading && <Loader2 className="animate-spin" size={20} />}
                                {isUploading ? 'Memproses...' : `Simpan ${transactionType === 'income' ? 'Pemasukan' : 'Pengeluaran'}`}
                            </button>
                        </div>
                    )}
                </div>
            </div >
        </div >
    );
};

export default ModalManager;
