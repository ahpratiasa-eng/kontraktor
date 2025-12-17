import React, { useState } from 'react';
import { X, Camera, Loader2, Save, Upload, Download, FileText as FileType, Search, Package, ChevronDown, Calendar, Wallet } from 'lucide-react';
import { NumberInput } from './UIComponents';

import * as XLSX from 'xlsx';
import type { UserRole, Material, RABItem, Project, AHSItem, PricingResource } from '../types';
import { calculateAHSTotal } from '../types';
import { formatRupiah } from '../utils/helpers';

interface ModalManagerProps {
    modalType: string | null;
    setModalType: (t: string | null) => void;
    showModal: boolean;
    setShowModal: (s: boolean) => void;
    // Handlers
    handleEditProject: () => void;
    handleSaveRAB: () => void;
    handleUpdateProgress: () => void;
    handlePayWorker: () => void;
    handleSaveWorker: () => void;
    handleStockMovement: () => void;
    handleSaveMaterial: () => void;
    handleEditMaterial: () => void;
    handleAddUser: () => void;
    handleGenerateRAB: () => void;
    saveAttendanceWithEvidence: () => void;
    handleImportRAB: (items: any[]) => void;
    handleSaveSchedule: () => void;
    getFilteredEvidence: () => any[]; // For gallery
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

    rabCategory: string; setRabCategory: (s: string) => void;
    rabItemName: string; setRabItemName: (s: string) => void;
    rabUnit: string; setRabUnit: (s: string) => void;
    rabVol: number; setRabVol: (n: number) => void;
    rabPrice: number; setRabPrice: (n: number) => void;

    progressInput: number; setProgressInput: (n: number) => void;
    progressDate: string; setProgressDate: (s: string) => void;
    progressNote: string; setProgressNote: (s: string) => void;

    paymentAmount: number; setPaymentAmount: (n: number) => void;

    // NEW: Transaction States
    transactionDesc: string; setTransactionDesc: (s: string) => void;
    transactionAmount: number; setTransactionAmount: (n: number) => void;
    transactionDate: string; setTransactionDate: (s: string) => void;
    transactionType?: 'expense' | 'income'; setTransactionType?: (t: 'expense' | 'income') => void;
    transactionCategory?: string; setTransactionCategory?: (s: string) => void;

    inputWorkerRole: string; setInputWorkerRole: (s: string) => void;
    inputWageUnit: string; setInputWageUnit: (s: string) => void;
    inputRealRate: number; setInputRealRate: (n: number) => void;
    inputMandorRate: number; setInputMandorRate: (n: number) => void;

    stockType: 'in' | 'out'; setStockType: (t: 'in' | 'out') => void;
    stockQty: number; setStockQty: (n: number) => void;
    stockDate: string; setStockDate: (s: string) => void;
    stockNotes: string; setStockNotes: (s: string) => void;
    selectedMaterial: Material | null;

    inputMaterialName: string; setInputMaterialName: (s: string) => void;
    inputMaterialUnit: string; setInputMaterialUnit: (s: string) => void;
    inputMinStock: number; setInputMinStock: (n: number) => void;
    inputInitialStock: number; setInputInitialStock: (n: number) => void;

    inputEmail: string; setInputEmail: (s: string) => void;
    inputRole: UserRole; setInputRole: (r: UserRole) => void;

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
    selectedAhsId: string | null;
    setSelectedAhsId: (id: string | null) => void;

    transactionProof?: string | null;
    setTransactionProof?: (s: string | null) => void;
}

const ModalManager: React.FC<ModalManagerProps> = (props) => {
    const {
        modalType, showModal, setShowModal,
        handleEditProject, handleSaveRAB, handleUpdateProgress, handlePayWorker, handleSaveWorker, handleStockMovement, handleSaveMaterial, handleEditMaterial, handleAddUser, handleGenerateRAB, saveAttendanceWithEvidence, handleImportRAB, handleSaveSchedule,
        handleSaveTransaction, // NEW
        inputName, setInputName, inputClient, setInputClient, inputLocation, setInputLocation, inputOwnerPhone, setInputOwnerPhone, inputBudget, setInputBudget, inputStartDate, setInputStartDate, inputEndDate, setInputEndDate, inputHeroImage, setInputHeroImage,
        rabCategory, setRabCategory, rabItemName, setRabItemName, rabUnit, setRabUnit, rabVol, setRabVol, rabPrice, setRabPrice,
        progressInput, setProgressInput, progressDate, setProgressDate, progressNote, setProgressNote,
        paymentAmount, setPaymentAmount,
        transactionDesc, setTransactionDesc, transactionAmount, setTransactionAmount, transactionDate, setTransactionDate,
        transactionType = 'expense', transactionCategory, setTransactionCategory,
        transactionProof, setTransactionProof,
        inputWorkerRole, setInputWorkerRole, inputWageUnit, setInputWageUnit, inputRealRate, setInputRealRate, inputMandorRate, setInputMandorRate,
        stockType, setStockType, stockQty, setStockQty, stockDate, setStockDate, stockNotes, setStockNotes, selectedMaterial,
        inputMaterialName, setInputMaterialName, inputMaterialUnit, setInputMaterialUnit, inputMinStock, setInputMinStock, inputInitialStock, setInputInitialStock,
        inputEmail, setInputEmail, inputRole, setInputRole,
        aiPrompt, setAiPrompt, isGeneratingAI,
        attendanceDate, setAttendanceDate, attendanceData, setAttendanceData, evidencePhoto, evidenceLocation, handlePhotoUpload, isGettingLoc,
        activeProject, selectedRabItem, selectedWorkerId,
        ahsItems, resources,
        setSelectedAhsId
    } = props;

    // State for AHS picker in RAB modal
    const [showAhsPicker, setShowAhsPicker] = useState(false);
    const [ahsSearch, setAhsSearch] = useState('');

    // State for Resource picker in Worker modal


    // State for Resource picker in Worker modal
    const [showResourcePicker, setShowResourcePicker] = useState(false);
    const [resourceSearch, setResourceSearch] = useState('');
    const [isManualInput, setIsManualInput] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleSaveAttendanceWrapper = async () => {
        try {
            setIsUploading(true);
            // Simulate delay only if needed to show animation, but actual handler is async usually
            // Wait, saveAttendanceWithEvidence is void in props but likely async in implementation.
            // We can't await void. But if we assume it's fire-and-forget, we might just show loading for a few seconds?
            // No, passed functions are usually async.
            await (saveAttendanceWithEvidence as any)();
        } catch (e) {
            console.error(e);
            alert("Gagal menyimpan absensi");
        } finally {
            setIsUploading(false);
        }
    };

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



    const handleSelectAHS = (ahs: AHSItem) => {
        setRabCategory(ahs.category);
        setRabItemName(ahs.name);
        setRabUnit(ahs.unit);
        setRabPrice(calculateAHSTotal(ahs));
        setSelectedAhsId(ahs.id);  // Save which AHS item was used
        setShowAhsPicker(false);
        setAhsSearch('');
    };

    const filteredAHS = ahsItems.filter(item =>
        item.name.toLowerCase().includes(ahsSearch.toLowerCase()) ||
        item.code.toLowerCase().includes(ahsSearch.toLowerCase()) ||
        item.category.toLowerCase().includes(ahsSearch.toLowerCase())
    );

    const downloadTemplate = () => {
        const ws = XLSX.utils.json_to_sheet([
            { "Kategori": "A. PERSIAPAN", "Nama Item": "Pembersihan Lahan", "Satuan": "m2", "Volume": 100, "Harga Satuan": 15000 },
            { "Kategori": "B. STRUKTUR", "Nama Item": "Galian Tanah", "Satuan": "m3", "Volume": 50, "Harga Satuan": 75000 }
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template RAB");
        XLSX.writeFile(wb, "Template_RAB_KontraktorPro.xlsx");
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);
            handleImportRAB(data);
        };
        reader.readAsBinaryString(file);
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
                            <h3 className="font-bold text-xl mb-4">Proyek Baru</h3>
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
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-xl">{selectedRabItem ? 'Edit Item RAB' : 'Tambah Item RAB'}</h3>
                                {!selectedRabItem && ahsItems.length > 0 && (
                                    <button
                                        onClick={() => setShowAhsPicker(!showAhsPicker)}
                                        className={`text-sm px-3 py-2 rounded-lg font-bold flex items-center gap-1 ${showAhsPicker ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600 border border-blue-200'}`}
                                    >
                                        <Package size={14} />
                                        {showAhsPicker ? 'Input Manual' : 'Pilih dari AHS'}
                                    </button>
                                )}
                            </div>

                            {/* AHS Picker */}
                            {showAhsPicker && !selectedRabItem && (
                                <div className="border rounded-xl overflow-hidden">
                                    <div className="bg-blue-50 p-3 border-b">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="text"
                                                placeholder="Cari item AHS..."
                                                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
                                                value={ahsSearch}
                                                onChange={e => setAhsSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto divide-y">
                                        {filteredAHS.length === 0 ? (
                                            <div className="p-4 text-center text-slate-400 text-sm">
                                                Tidak ada item AHS ditemukan
                                            </div>
                                        ) : (
                                            filteredAHS.slice(0, 10).map(ahs => (
                                                <button
                                                    key={ahs.id}
                                                    onClick={() => handleSelectAHS(ahs)}
                                                    className="w-full p-3 text-left hover:bg-blue-50 transition-colors"
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <span className="text-xs bg-slate-200 px-1.5 py-0.5 rounded font-mono mr-2">{ahs.code}</span>
                                                            <span className="font-bold text-sm">{ahs.name}</span>
                                                            <div className="text-xs text-slate-500 mt-0.5">{ahs.category}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-bold text-blue-600 text-sm">{formatRupiah(calculateAHSTotal(ahs))}</div>
                                                            <div className="text-xs text-slate-400">/{ahs.unit}</div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                    {filteredAHS.length > 10 && (
                                        <div className="p-2 bg-slate-50 text-center text-xs text-slate-500 border-t">
                                            Menampilkan 10 dari {filteredAHS.length} item. Gunakan pencarian untuk filter.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Manual Input Form */}
                            {(!showAhsPicker || selectedRabItem) && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold ml-1">Kategori Pekerjaan</label>
                                        {/* Get existing categories from project */}
                                        {(() => {
                                            const existingCategories = activeProject?.rabItems
                                                ? [...new Set(activeProject.rabItems.map(item => item.category))].sort()
                                                : [];
                                            return (
                                                <div className="relative">
                                                    <select
                                                        className="w-full p-3 border rounded-xl bg-white appearance-none pr-10"
                                                        value={existingCategories.includes(rabCategory) ? rabCategory : '_custom'}
                                                        onChange={e => {
                                                            if (e.target.value !== '_custom') {
                                                                setRabCategory(e.target.value);
                                                            }
                                                        }}
                                                    >
                                                        <option value="_custom">-- Ketik Kategori Baru --</option>
                                                        {existingCategories.map((cat, idx) => (
                                                            <option key={idx} value={cat}>{cat}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                        {/* Show text input if custom or editing */}
                                        {(!activeProject?.rabItems?.some(item => item.category === rabCategory) || rabCategory === '' || rabCategory === '_custom') && (
                                            <input
                                                className="w-full p-3 border rounded-xl mt-2"
                                                placeholder="Contoh: A. PERSIAPAN"
                                                value={rabCategory === '_custom' ? '' : rabCategory}
                                                onChange={e => setRabCategory(e.target.value)}
                                            />
                                        )}
                                    </div>
                                    <input className="w-full p-3 border rounded-xl" placeholder="Nama Item / Uraian Pekerjaan" value={rabItemName} onChange={e => setRabItemName(e.target.value)} />
                                    <div className="flex gap-2">
                                        <input className="w-24 p-3 border rounded-xl text-center" placeholder="Satuan" value={rabUnit} onChange={e => setRabUnit(e.target.value)} />
                                        <input type="number" step="0.01" className="flex-1 p-3 border rounded-xl" placeholder="Volume" value={rabVol || ''} onChange={e => setRabVol(parseFloat(e.target.value) || 0)} />
                                    </div>
                                    <NumberInput className="w-full p-3 border rounded-xl" placeholder="Harga Satuan (Rp)" value={rabPrice} onChange={setRabPrice} />
                                    <button onClick={handleSaveRAB} className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold shadow-lg hover:bg-blue-700">Simpan Item</button>
                                </>
                            )}
                        </div>
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
                            <textarea className="w-full p-3 border rounded-xl h-24" placeholder="Catatan progress..." value={progressNote} onChange={e => setProgressNote(e.target.value)} />
                            <button onClick={handleUpdateProgress} className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold shadow-lg">Simpan Progress</button>
                        </div>
                    )}

                    {modalType === 'payWorker' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-xl mb-4">Bayar Upah Pekerja</h3>
                            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 mb-4">
                                <p className="text-sm">Pembayaran ini akan dicatat sebagai Pengeluaran (Upah Tukang).</p>
                            </div>
                            <NumberInput className="w-full p-3 border rounded-xl font-bold text-lg" placeholder="Nominal Pembayaran" value={paymentAmount} onChange={setPaymentAmount} />
                            <button onClick={handlePayWorker} className="w-full bg-green-600 text-white p-3 rounded-xl font-bold shadow-lg hover:bg-green-700">Bayar Sekarang</button>
                        </div>
                    )}

                    {modalType === 'newWorker' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-xl mb-4">{selectedWorkerId ? 'Edit Pekerja' : 'Tambah Pekerja Baru'}</h3>

                            {/* RESOURCE PICKER */}
                            {showResourcePicker ? (
                                <div className="border rounded-xl p-3 bg-slate-50">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-bold text-sm text-slate-700">Pilih Standar Upah</h4>
                                        <button onClick={() => setShowResourcePicker(false)} className="bg-slate-200 p-1 rounded hover:bg-slate-300"><X size={14} /></button>
                                    </div>
                                    <input
                                        className="w-full p-2 border rounded-lg mb-2 text-sm"
                                        placeholder="Cari standar upah..."
                                        value={resourceSearch}
                                        onChange={e => setResourceSearch(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="max-h-48 overflow-y-auto space-y-1">
                                        {resources.filter(r => r.type === 'upah' && r.name.toLowerCase().includes(resourceSearch.toLowerCase())).map(r => (
                                            <div key={r.id} onClick={() => {
                                                // Auto fill
                                                setInputWorkerRole(r.name);
                                                setInputWageUnit(r.unit === 'OH' ? 'Harian' : 'Borongan');
                                                setInputRealRate(r.price);
                                                // Default mandor/charge rate = real rate + margin (e.g. 20%) or same for now?
                                                const margin = r.price * 0.2; // Example 20% margin
                                                setInputMandorRate(r.price + margin);
                                                setShowResourcePicker(false);
                                            }} className="p-2 bg-white border rounded hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors">
                                                <div>
                                                    <div className="text-sm font-bold text-slate-700">{r.name}</div>
                                                    <div className="text-xs text-slate-500">{r.category}</div>
                                                </div>
                                                <span className="font-mono font-bold text-blue-600 text-sm">{formatRupiah(r.price)}/{r.unit}</span>
                                            </div>
                                        ))}
                                        {resources.filter(r => r.type === 'upah').length === 0 && <div className="text-center text-xs text-slate-400 py-4">Belum ada data upah di Library.</div>}
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => setShowResourcePicker(true)} className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors">
                                    <Search size={14} /> Ambil dari Standar Upah
                                </button>
                            )}

                            <input className="w-full p-3 border rounded-xl" placeholder="Nama Lengkap" value={inputName} onChange={e => setInputName(e.target.value)} />
                            <div className="flex gap-2">
                                <select className="flex-1 p-3 border rounded-xl bg-white" value={inputWorkerRole} onChange={e => setInputWorkerRole(e.target.value)}>
                                    <option>Tukang</option><option>Kuli</option><option>Kepala Tukang</option><option>Mandor</option>
                                    {/* Allow custom roles from picker */}
                                    {!['Tukang', 'Kuli', 'Kepala Tukang', 'Mandor'].includes(inputWorkerRole) && <option>{inputWorkerRole}</option>}
                                </select>
                                <select className="flex-1 p-3 border rounded-xl bg-white" value={inputWageUnit} onChange={e => setInputWageUnit(e.target.value)}>
                                    <option>Harian</option><option>Mingguan</option><option>Bulanan</option><option>Borongan</option>
                                </select>
                            </div>
                            <NumberInput className="w-full p-3 border rounded-xl" placeholder="Upah Asli (Rate Internal)" value={inputRealRate} onChange={setInputRealRate} />
                            <NumberInput className="w-full p-3 border rounded-xl" placeholder="Upah Mandor (Rate Charge)" value={inputMandorRate} onChange={setInputMandorRate} />
                            <div className="text-xs text-slate-400 italic px-1">*Upah Mandor adalah yang ditagihkan ke Owner/Klien. Selisih = Profit.</div>
                            <button onClick={handleSaveWorker} className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold shadow-lg">Simpan Data Pekerja</button>
                        </div>
                    )}

                    {modalType === 'attendance' && activeProject && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-xl mb-4">Absensi Harian</h3>
                            <input type="date" className="w-full p-3 border rounded-xl mb-4" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} />

                            <div className="bg-slate-50 p-4 rounded-xl border mb-4">
                                <h4 className="font-bold text-sm mb-3 flex items-center gap-2"><Camera size={16} /> Bukti Lapangan (Wajib)</h4>
                                <label className="w-full cursor-pointer bg-white border-2 border-dashed border-slate-300 rounded-xl h-48 flex flex-col items-center justify-center hover:bg-slate-50 transition relative overflow-hidden">
                                    {evidencePhoto ? (
                                        <>
                                            <img src={evidencePhoto} className="w-full h-full object-cover" />
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 text-center">
                                                {evidenceLocation ? '📍 Lokasi Terdeteksi' : (isGettingLoc ? '📡 Mencari Lokasi...' : 'Lokasi Belum Ada')}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <Camera className="text-slate-400 mb-2" size={32} />
                                            <span className="font-bold text-slate-500">Ambil Foto & Tag Lokasi</span>
                                            <span className="text-xs text-slate-400 mt-1">Otomatis GPS aktif saat upload</span>
                                        </>
                                    )}
                                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
                                </label>
                            </div>

                            <div className="max-h-60 overflow-y-auto space-y-2">
                                {activeProject.workers.map(w => (
                                    <div key={w.id} className="flex items-center justify-between p-3 bg-white border rounded-xl">
                                        <span className="font-bold text-sm">{w.name}</span>
                                        <select
                                            className="p-2 border rounded-lg text-sm bg-slate-50"
                                            value={attendanceData[w.id]?.status || 'Hadir'}
                                            onChange={(e) => {
                                                setAttendanceData((prev: any) => ({ ...prev, [w.id]: { status: e.target.value } }));
                                            }}
                                        >
                                            <option value="Hadir">Hadir (1)</option>
                                            <option value="Setengah">Setengah (0.5)</option>
                                            <option value="Lembur">Lembur (1.5)</option>
                                            <option value="Absen">Absen (0)</option>
                                        </select>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={handleSaveAttendanceWrapper}
                                disabled={(!evidencePhoto || !evidenceLocation) || isUploading}
                                className={`w-full p-3 rounded-xl font-bold shadow-lg mt-4 transition-colors flex items-center justify-center gap-2 ${(!evidencePhoto || !evidenceLocation) || isUploading ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                            >
                                {isUploading && <Loader2 className="animate-spin" size={20} />}
                                {isUploading ? 'Menyimpan & Mengupload...' : ((!evidencePhoto || !evidenceLocation) ? 'Foto & Lokasi Wajib Diisi' : 'Simpan Absensi')}
                            </button>
                        </div>
                    )}

                    {modalType === 'stockMovement' && selectedMaterial && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-xl mb-4">Update Stok: {selectedMaterial.name}</h3>
                            <div className="flex gap-2">
                                <button onClick={() => setStockType('in')} className={`flex-1 p-4 rounded-xl font-bold border ${stockType === 'in' ? 'bg-green-100 border-green-200 text-green-700' : 'bg-white'}`}>Barang Masuk (+)</button>
                                <button onClick={() => setStockType('out')} className={`flex-1 p-4 rounded-xl font-bold border ${stockType === 'out' ? 'bg-red-100 border-red-200 text-red-700' : 'bg-white'}`}>Barang Keluar (-)</button>
                            </div>
                            <NumberInput className="w-full p-3 border rounded-xl text-lg font-bold" placeholder="Jumlah (Qty)" value={stockQty} onChange={setStockQty} />
                            <input type="date" className="w-full p-3 border rounded-xl" value={stockDate} onChange={e => setStockDate(e.target.value)} />
                            <input className="w-full p-3 border rounded-xl" placeholder="Catatan / Keterangan" value={stockNotes} onChange={e => setStockNotes(e.target.value)} />
                            <button onClick={handleStockMovement} className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold shadow-lg">Simpan Stok</button>
                        </div>
                    )}

                    {modalType === 'newMaterial' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-xl mb-4">{selectedMaterial ? 'Edit Material' : 'Tambah Material Baru'}</h3>
                            <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 mb-2">
                                <p>Material yang ditambahkan di sini akan masuk ke Stok Lapangan.</p>
                            </div>

                            {/* Material Source Selection */}
                            {!selectedMaterial && activeProject?.rabItems && activeProject.rabItems.length > 0 && (
                                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-4">
                                    <button
                                        onClick={() => setIsManualInput(false)}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isManualInput ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Ambil dari RAB
                                    </button>
                                    <button
                                        onClick={() => setIsManualInput(true)}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${isManualInput ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Input Manual
                                    </button>
                                </div>
                            )}

                            {!isManualInput && !selectedMaterial && activeProject?.rabItems ? (
                                <div className="relative">
                                    <select
                                        className="w-full p-3 border rounded-xl bg-white appearance-none pr-10 font-medium text-slate-700"
                                        value={inputMaterialName}
                                        onChange={(e) => {
                                            const name = e.target.value;
                                            setInputMaterialName(name);
                                            const item = activeProject.rabItems.find(r => r.name === name);
                                            if (item) setInputMaterialUnit(item.unit);
                                        }}
                                    >
                                        <option value="">-- Pilih Material dari RAB --</option>
                                        {[...new Set(activeProject.rabItems.filter(i => !['oh', 'hari', 'jam', 'ls', 'unit', 'org'].includes(i.unit.toLowerCase())).map(i => i.name))].sort().map((name, idx) => {
                                            const item = activeProject.rabItems.find(r => r.name === name);
                                            return <option key={idx} value={name}>{name} ({item?.unit})</option>;
                                        })}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={20} />
                                </div>
                            ) : (
                                <input className="w-full p-3 border rounded-xl" placeholder="Nama Material (misal: Semen Tiga Roda)" value={inputMaterialName} onChange={e => setInputMaterialName(e.target.value)} />
                            )}
                            <div className="flex gap-2">
                                <input className="flex-1 p-3 border rounded-xl" placeholder="Satuan (misal: sak, m3)" value={inputMaterialUnit} onChange={e => setInputMaterialUnit(e.target.value)} />
                                <NumberInput className="flex-1 p-3 border rounded-xl" placeholder="Min. Stock Alert" value={inputMinStock} onChange={setInputMinStock} />
                            </div>
                            {!selectedMaterial && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold ml-1">Stok Awal (Opsional)</label>
                                    <NumberInput className="w-full p-3 border rounded-xl" placeholder="Stok saat ini" value={inputInitialStock} onChange={setInputInitialStock} />
                                </div>
                            )}
                            <button
                                onClick={selectedMaterial ? handleEditMaterial : handleSaveMaterial}
                                className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold shadow-lg hover:bg-blue-700"
                            >
                                {selectedMaterial ? 'Simpan Perubahan' : 'Simpan Material'}
                            </button>
                        </div>
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
                                    <li>Gunakan format template yang disediakan.</li>
                                    <li>Pastikan kolom <b>Kategori, Nama Item, Satuan, Volume, Harga Satuan</b> terisi.</li>
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

                    {modalType === 'newTransaction' && (
                        <div className="space-y-4">
                            <h3 className={`font-bold text-xl mb-2 flex items-center gap-2 ${transactionType === 'income' ? 'text-green-700' : 'text-slate-800'}`}>
                                <Wallet className={transactionType === 'income' ? 'text-green-600' : 'text-red-600'} />
                                {transactionType === 'income' ? 'Catat Pemasukan' : 'Catat Pengeluaran'}
                            </h3>


                            <div className="space-y-3">
                                {/* CATEGORY SELECTOR */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 ml-1">Kategori</label>
                                    <select
                                        className="w-full p-3 border rounded-xl bg-white"
                                        value={transactionCategory}
                                        onChange={e => setTransactionCategory && setTransactionCategory(e.target.value)}
                                    >
                                        {transactionType === 'expense' ? (
                                            <>
                                                <option value="Material">Material</option>
                                                <option value="Upah Tukang">Upah Tukang</option>
                                                <option value="Operasional">Operasional</option>
                                                <option value="Sewa Alat">Sewa Alat</option>
                                                <option value="Lainnya">Lainnya</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="Termin">Termin</option>
                                                <option value="DP">Uang Muka (DP)</option>
                                                <option value="Pelunasan">Pelunasan</option>
                                                <option value="Tambahan">Tambahan</option>
                                            </>
                                        )}
                                    </select>
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

                                {/* BUKTI TRANSAKSI UPLOAD */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 ml-1">
                                        Bukti Transaksi (Opsional)
                                    </label>
                                    <div className="mt-1 border-2 border-dashed border-slate-200 rounded-xl p-3 hover:bg-slate-50 transition relative overflow-hidden">
                                        {transactionProof ? (
                                            <div className="relative">
                                                <img
                                                    src={transactionProof}
                                                    alt="Bukti"
                                                    className="w-full h-32 object-cover rounded-lg"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setTransactionProof && setTransactionProof(null)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex flex-col items-center justify-center py-4 cursor-pointer">
                                                <Camera className="text-slate-400 mb-1" size={24} />
                                                <span className="text-xs text-slate-500 font-medium">
                                                    {transactionType === 'income' ? 'Upload bukti transfer / mutasi' : 'Upload foto struk / nota'}
                                                </span>
                                                <span className="text-[10px] text-slate-400 mt-0.5">Tap untuk pilih foto</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file || !setTransactionProof) return;
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => setTransactionProof(reader.result as string);
                                                        reader.readAsDataURL(file);
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
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
