import React, { useState } from 'react';
import { Camera, Loader2, CloudRain, Sun, Cloud, CloudLightning, Users, AlertTriangle } from 'lucide-react';
import type { Project } from '../../types';
import VoiceInput from '../VoiceInput';

interface AttendanceModalProps {
    activeProject: Project;
    attendanceDate: string;
    setAttendanceDate: (date: string) => void;
    attendanceData: any;
    setAttendanceData: (data: any) => void;
    evidencePhoto: string | null;
    evidenceLocation: string | null;
    isGettingLoc: boolean;
    handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSave: (dailyNotes?: { weather: string; issues: string; visitors: string }) => Promise<void> | void;
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({
    activeProject,
    attendanceDate, setAttendanceDate,
    attendanceData, setAttendanceData,
    evidencePhoto, evidenceLocation,
    isGettingLoc, handlePhotoUpload,
    onSave
}) => {
    const [isUploading, setIsUploading] = useState(false);

    // Daily notes / Site Diary fields
    const [weather, setWeather] = useState('cerah');
    const [issues, setIssues] = useState('');
    const [visitors, setVisitors] = useState('');

    const handleSaveWrapper = async () => {
        try {
            setIsUploading(true);
            await onSave({ weather, issues, visitors });
        } catch (e) {
            console.error(e);
            alert("Gagal menyimpan absensi");
        } finally {
            setIsUploading(false);
        }
    };

    const weatherOptions = [
        { value: 'cerah', label: 'Cerah', icon: Sun, color: 'text-yellow-500' },
        { value: 'mendung', label: 'Mendung', icon: Cloud, color: 'text-slate-400' },
        { value: 'hujan', label: 'Hujan', icon: CloudRain, color: 'text-blue-500' },
        { value: 'hujan_lebat', label: 'Hujan Lebat', icon: CloudLightning, color: 'text-indigo-600' },
    ];

    return (
        <div className="space-y-4 animate-in fade-in zoom-in duration-300">
            <h3 className="font-bold text-xl mb-4 text-slate-800">Absensi & Catatan Harian</h3>
            <input
                type="date"
                className="w-full p-3 border rounded-xl mb-4 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-700"
                value={attendanceDate}
                onChange={e => setAttendanceDate(e.target.value)}
            />

            {/* Weather Selector */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <h4 className="font-bold text-sm mb-3 flex items-center gap-2 text-blue-700">
                    <Sun size={16} /> Kondisi Cuaca
                </h4>
                <div className="grid grid-cols-4 gap-2">
                    {weatherOptions.map(opt => {
                        const Icon = opt.icon;
                        return (
                            <button
                                key={opt.value}
                                onClick={() => setWeather(opt.value)}
                                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${weather === opt.value
                                        ? 'bg-white border-blue-500 shadow-md'
                                        : 'bg-white/50 border-transparent hover:bg-white'
                                    }`}
                            >
                                <Icon size={20} className={opt.color} />
                                <span className="text-[10px] font-bold text-slate-600">{opt.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-sm mb-3 flex items-center gap-2 text-slate-700"><Camera size={16} /> Bukti Lapangan (Wajib)</h4>
                <label className="w-full cursor-pointer bg-white border-2 border-dashed border-slate-300 rounded-xl h-40 flex flex-col items-center justify-center hover:bg-blue-50 hover:border-blue-300 transition-all relative overflow-hidden group">
                    {evidencePhoto ? (
                        <>
                            <img src={evidencePhoto} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 text-center backdrop-blur-sm">
                                {evidenceLocation ? '📍 Lokasi Terdeteksi' : (isGettingLoc ? '📡 Mencari Lokasi...' : 'Lokasi Belum Ada')}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-blue-100 p-3 rounded-full mb-2 group-hover:bg-blue-200 transition-colors">
                                <Camera className="text-blue-500" size={24} />
                            </div>
                            <span className="font-bold text-slate-600 group-hover:text-blue-600 transition-colors">Ambil Foto & Tag Lokasi</span>
                            <span className="text-xs text-slate-400 mt-1">Otomatis GPS aktif saat upload</span>
                        </>
                    )}
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
                </label>
            </div>

            {/* Worker Attendance */}
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-300">
                {activeProject.workers.map(w => (
                    <div key={w.id} className="flex items-center justify-between p-3 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <span className="font-bold text-sm text-slate-700">{w.name}</span>
                        <select
                            className={`p-2 border rounded-lg text-sm font-bold transition-colors ${(attendanceData[w.id]?.status || 'Hadir') === 'Hadir' ? 'bg-green-50 text-green-700 border-green-200' :
                                (attendanceData[w.id]?.status) === 'Setengah' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                    (attendanceData[w.id]?.status) === 'Lembur' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                        'bg-red-50 text-red-700 border-red-200'
                                }`}
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
                {activeProject.workers.length === 0 && (
                    <div className="text-center py-4 text-slate-400 text-sm">
                        Belum ada pekerja di proyek ini.
                    </div>
                )}
            </div>

            {/* Issues / Kendala */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <AlertTriangle size={12} /> Kendala / Masalah Hari Ini (Opsional)
                </label>
                <VoiceInput
                    value={issues}
                    onChange={setIssues}
                    placeholder="Contoh: Material semen terlambat, hujan deras pagi..."
                    className="h-16"
                    rows={2}
                />
            </div>

            {/* Visitors */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <Users size={12} /> Pengunjung Proyek (Opsional)
                </label>
                <VoiceInput
                    value={visitors}
                    onChange={setVisitors}
                    placeholder="Contoh: Pak Budi (Owner), Konsultan struktur..."
                    className="h-16"
                    rows={2}
                />
            </div>

            <button
                onClick={handleSaveWrapper}
                disabled={(!evidencePhoto || !evidenceLocation) || isUploading}
                className={`w-full p-3.5 rounded-xl font-bold shadow-lg mt-4 transition-all flex items-center justify-center gap-2 ${(!evidencePhoto || !evidenceLocation) || isUploading
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:scale-[1.02] hover:shadow-blue-500/30 active:scale-[0.98]'
                    }`}
            >
                {isUploading && <Loader2 className="animate-spin" size={20} />}
                {isUploading ? 'Menyimpan & Mengupload...' : ((!evidencePhoto || !evidenceLocation) ? 'Foto & Lokasi Wajib Diisi' : 'Simpan Absensi & Catatan')}
            </button>
        </div>
    );
};

export default AttendanceModal;

