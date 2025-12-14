import React from 'react';
import { X, Camera, MapPin, Loader2, Save } from 'lucide-react';
import { NumberInput } from './UIComponents';
import type { UserRole, Material, RABItem, Project } from '../types';

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
    getFilteredEvidence: () => any[]; // For gallery
    // State Setters & Values
    inputName: string; setInputName: (s: string) => void;
    inputClient: string; setInputClient: (s: string) => void;
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
    isGettingLoc: boolean;
    handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleGetLocation: () => void;

    activeProject: Project | null;
    selectedRabItem: RABItem | null;
    selectedWorkerId: number | null;
}

const ModalManager: React.FC<ModalManagerProps> = (props) => {
    const {
        modalType, showModal, setShowModal,
        handleEditProject, handleSaveRAB, handleUpdateProgress, handlePayWorker, handleSaveWorker, handleStockMovement, handleAddUser, handleGenerateRAB, saveAttendanceWithEvidence,
        inputName, setInputName, inputClient, setInputClient, inputBudget, setInputBudget, inputStartDate, setInputStartDate, inputEndDate, setInputEndDate,
        rabCategory, setRabCategory, rabItemName, setRabItemName, rabUnit, setRabUnit, rabVol, setRabVol, rabPrice, setRabPrice,
        progressInput, setProgressInput, progressDate, setProgressDate, progressNote, setProgressNote,
        paymentAmount, setPaymentAmount,
        inputWorkerRole, setInputWorkerRole, inputWageUnit, setInputWageUnit, inputRealRate, setInputRealRate, inputMandorRate, setInputMandorRate,
        stockType, setStockType, stockQty, setStockQty, stockDate, setStockDate, stockNotes, setStockNotes, selectedMaterial,
        inputEmail, setInputEmail, inputRole, setInputRole,
        aiPrompt, setAiPrompt, isGeneratingAI,
        attendanceDate, setAttendanceDate, attendanceData, setAttendanceData, evidencePhoto, handlePhotoUpload, handleGetLocation, isGettingLoc,
        activeProject, selectedRabItem, selectedWorkerId
    } = props;

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
                            <h3 className="font-bold text-xl mb-4">{selectedRabItem ? 'Edit Item RAB' : 'Tambah Item RAB'}</h3>
                            <div className="space-y-1">
                                <label className="text-xs font-bold ml-1">Kategori Pekerjaan</label>
                                <input list="categories" className="w-full p-3 border rounded-xl" placeholder="Contoh: A. PERSIAPAN" value={rabCategory} onChange={e => setRabCategory(e.target.value)} />
                                <datalist id="categories"><option value="A. PERSIAPAN" /><option value="B. PEKERJAAN TANAH" /><option value="C. PEKERJAAN STRUKTUR" /></datalist>
                            </div>
                            <input className="w-full p-3 border rounded-xl" placeholder="Nama Item / Uraian Pekerjaan" value={rabItemName} onChange={e => setRabItemName(e.target.value)} />
                            <div className="flex gap-2">
                                <input className="w-24 p-3 border rounded-xl text-center" placeholder="Satuan" value={rabUnit} onChange={e => setRabUnit(e.target.value)} />
                                <NumberInput className="flex-1 p-3 border rounded-xl" placeholder="Volume" value={rabVol} onChange={setRabVol} />
                            </div>
                            <NumberInput className="w-full p-3 border rounded-xl" placeholder="Harga Satuan (Rp)" value={rabPrice} onChange={setRabPrice} />
                            <button onClick={handleSaveRAB} className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold shadow-lg hover:bg-blue-700">Simpan Item</button>
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
                                <div className="flex items-center gap-4">
                                    <label className="flex-1 cursor-pointer bg-white border-2 border-dashed border-slate-300 rounded-xl h-32 flex flex-col items-center justify-center hover:bg-slate-50 transition">
                                        {evidencePhoto ? <img src={evidencePhoto} className="w-full h-full object-cover rounded-xl" /> : <><Camera className="text-slate-400 mb-2" /><span className="text-xs text-slate-500">Ambil Foto</span></>}
                                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
                                    </label>
                                    <button onClick={handleGetLocation} className="flex-1 h-32 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 flex flex-col items-center justify-center font-bold text-xs hover:bg-blue-100 transition">
                                        {isGettingLoc ? <Loader2 className="animate-spin mb-2" /> : <MapPin className="mb-2" />}
                                        Tag Lokasi GPS
                                    </button>
                                </div>
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
                            <button onClick={saveAttendanceWithEvidence} className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold shadow-lg mt-4">Simpan Absensi</button>
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
                </div>
            </div>
        </div>
    );
};

export default ModalManager;
