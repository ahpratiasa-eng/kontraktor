import React, { useState } from 'react';
import { X, Camera, Loader2, Save, Upload, Download, FileText as FileType, Search, Package } from 'lucide-react';
import { NumberInput } from './UIComponents';
import * as XLSX from 'xlsx';
import type { UserRole, Material, RABItem, Project, AHSItem } from '../types';
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
    handleAddUser: () => void;
    handleGenerateRAB: () => void;
    saveAttendanceWithEvidence: () => void;
    handleImportRAB: (items: any[]) => void;
    getFilteredEvidence: () => any[]; // For gallery
    // State Setters & Values
    inputName: string; setInputName: (s: string) => void;
    inputClient: string; setInputClient: (s: string) => void;
    inputLocation: string; setInputLocation: (s: string) => void;
    inputOwnerPhone: string; setInputOwnerPhone: (s: string) => void;
    inputBudget: number; setInputBudget: (n: number) => void;
    inputStartDate: string; setInputStartDate: (s: string) => void;
    inputEndDate: string; setInputEndDate: (s: string) => void;

    rabCategory: string; setRabCategory: (s: string) => void;
    rabItemName: string; setRabItemName: (s: string) => void;
    rabUnit: string; setRabUnit: (s: string) => void;
    rabVol: number; setRabVol: (n: number) => void;
    rabPrice: number; setRabPrice: (n: number) => void;

    progressInput: number; setProgressInput: (n: number) => void;
    progressDate: string; setProgressDate: (s: string) => void;
    progressNote: string; setProgressNote: (s: string) => void;

    paymentAmount: number; setPaymentAmount: (n: number) => void;

    inputWorkerRole: string; setInputWorkerRole: (s: string) => void;
    inputWageUnit: string; setInputWageUnit: (s: string) => void;
    inputRealRate: number; setInputRealRate: (n: number) => void;
    inputMandorRate: number; setInputMandorRate: (n: number) => void;

    stockType: 'in' | 'out'; setStockType: (t: 'in' | 'out') => void;
    stockQty: number; setStockQty: (n: number) => void;
    stockDate: string; setStockDate: (s: string) => void;
    stockNotes: string; setStockNotes: (s: string) => void;
    selectedMaterial: Material | null;

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
    selectedAhsId: string | null;
    setSelectedAhsId: (id: string | null) => void;
}

const ModalManager: React.FC<ModalManagerProps> = (props) => {
    const {
        modalType, showModal, setShowModal,
        handleEditProject, handleSaveRAB, handleUpdateProgress, handlePayWorker, handleSaveWorker, handleStockMovement, handleAddUser, handleGenerateRAB, saveAttendanceWithEvidence, handleImportRAB,
        inputName, setInputName, inputClient, setInputClient, inputLocation, setInputLocation, inputOwnerPhone, setInputOwnerPhone, inputBudget, setInputBudget, inputStartDate, setInputStartDate, inputEndDate, setInputEndDate,
        rabCategory, setRabCategory, rabItemName, setRabItemName, rabUnit, setRabUnit, rabVol, setRabVol, rabPrice, setRabPrice,
        progressInput, setProgressInput, progressDate, setProgressDate, progressNote, setProgressNote,
        paymentAmount, setPaymentAmount,
        inputWorkerRole, setInputWorkerRole, inputWageUnit, setInputWageUnit, inputRealRate, setInputRealRate, inputMandorRate, setInputMandorRate,
        stockType, setStockType, stockQty, setStockQty, stockDate, setStockDate, stockNotes, setStockNotes, selectedMaterial,
        inputEmail, setInputEmail, inputRole, setInputRole,
        aiPrompt, setAiPrompt, isGeneratingAI,
        attendanceDate, setAttendanceDate, attendanceData, setAttendanceData, evidencePhoto, evidenceLocation, handlePhotoUpload, isGettingLoc,
        activeProject, selectedRabItem, selectedWorkerId,
        ahsItems
    } = props;

    // State for AHS picker in RAB modal
    const [showAhsPicker, setShowAhsPicker] = useState(false);
    const [ahsSearch, setAhsSearch] = useState('');
    const { setSelectedAhsId } = props;

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
                            <NumberInput placeholder="Budget Limit (Opsional)" className="w-full p-3 border rounded-xl" value={inputBudget} onChange={setInputBudget} />
                            <button onClick={handleEditProject} className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold shadow-lg hover:bg-blue-700">Buat Proyek</button>
                        </div>
                    )}

                    {modalType === 'editProject' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-xl mb-4">Edit Proyek</h3>
                            <input className="w-full p-3 border rounded-xl" placeholder="Nama Proyek" value={inputName} onChange={e => setInputName(e.target.value)} />
                            <input className="w-full p-3 border rounded-xl" placeholder="Klien" value={inputClient} onChange={e => setInputClient(e.target.value)} />
                            <input className="w-full p-3 border rounded-xl" placeholder="No WA Owner" value={inputOwnerPhone} onChange={e => setInputOwnerPhone(e.target.value)} />
                            <input className="w-full p-3 border rounded-xl" placeholder="Lokasi Proyek" value={inputLocation} onChange={e => setInputLocation(e.target.value)} />
                            <div className="flex gap-2">
                                <div className="flex-1"><label className="text-xs font-bold ml-1">Mulai</label><input type="date" className="w-full p-3 border rounded-xl" value={inputStartDate} onChange={e => setInputStartDate(e.target.value)} /></div>
                                <div className="flex-1"><label className="text-xs font-bold ml-1">Selesai</label><input type="date" className="w-full p-3 border rounded-xl" value={inputEndDate} onChange={e => setInputEndDate(e.target.value)} /></div>
                            </div>
                            <NumberInput placeholder="Budget Limit" className="w-full p-3 border rounded-xl" value={inputBudget} onChange={setInputBudget} />
                            <button onClick={handleEditProject} className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700">Simpan Perubahan</button>
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
                                        <NumberInput className="flex-1 p-3 border rounded-xl" placeholder="Volume" value={rabVol} onChange={setRabVol} />
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
                            <input className="w-full p-3 border rounded-xl" placeholder="Nama Lengkap" value={inputName} onChange={e => setInputName(e.target.value)} />
                            <div className="flex gap-2">
                                <select className="flex-1 p-3 border rounded-xl bg-white" value={inputWorkerRole} onChange={e => setInputWorkerRole(e.target.value)}>
                                    <option>Tukang</option><option>Kuli</option><option>Kepala Tukang</option><option>Mandor</option>
                                </select>
                                <select className="flex-1 p-3 border rounded-xl bg-white" value={inputWageUnit} onChange={e => setInputWageUnit(e.target.value)}>
                                    <option>Harian</option><option>Mingguan</option><option>Bulanan</option><option>Borongan</option>
                                </select>
                            </div>
                            <NumberInput className="w-full p-3 border rounded-xl" placeholder="Upah Asli (Rate Internal)" value={inputRealRate} onChange={setInputRealRate} />
                            <NumberInput className="w-full p-3 border rounded-xl" placeholder="Upah Mandor (Rate Charge)" value={inputMandorRate} onChange={setInputMandorRate} />
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
                                onClick={saveAttendanceWithEvidence}
                                disabled={!evidencePhoto || !evidenceLocation}
                                className={`w-full p-3 rounded-xl font-bold shadow-lg mt-4 transition-colors ${(!evidencePhoto || !evidenceLocation) ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                            >
                                {(!evidencePhoto || !evidenceLocation) ? 'Foto & Lokasi Wajib Diisi' : 'Simpan Absensi'}
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
                </div>
            </div >
        </div >
    );
};

export default ModalManager;
