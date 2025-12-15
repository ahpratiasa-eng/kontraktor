import React, { useState } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import type { Project, LandingPageConfig } from '../types';
import { formatRupiah, getStats, getRABGroups } from '../utils/helpers';
import SCurveChart from './SCurveChart';

interface ReportViewProps {
    activeProject: Project;
    setView: (view: any) => void;
    isClientView?: boolean;
    canViewInternalRAB?: boolean;
    landingConfig?: LandingPageConfig | null;
}

const ReportView: React.FC<ReportViewProps> = ({ activeProject, setView, isClientView, canViewInternalRAB = true, landingConfig }) => {
    const [rabViewMode, setRabViewMode] = useState<'client' | 'internal'>('client');

    // Enforce Client View (pengawas & client)
    React.useEffect(() => {
        if (isClientView || !canViewInternalRAB) setRabViewMode('client');
    }, [isClientView, canViewInternalRAB]);
    const rabGroups = getRABGroups(activeProject);
    const stats = getStats(activeProject);
    const today = new Date().toLocaleDateString('id-ID', { dateStyle: 'full' });

    // Recent Photos (Top 6 latest)
    const recentPhotos = [...(activeProject.attendanceEvidences || []), ...(activeProject.gallery || [])]
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 6);

    return (
        <div className="min-h-screen bg-white">
            <header className="bg-slate-800 text-white px-4 py-4 flex items-center justify-between sticky top-0 shadow-md z-20 print:hidden">
                <div className="flex items-center gap-3">
                    <button onClick={() => setView('project-detail')} className="hover:bg-slate-700 p-1 rounded">
                        <ArrowLeft />
                    </button>
                    <div>
                        <h2 className="font-bold uppercase tracking-wider text-sm">Laporan Detail</h2>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!isClientView && canViewInternalRAB && (
                        <div className="bg-slate-700 p-1 rounded flex text-xs">
                            <button onClick={() => setRabViewMode('client')} className={`px-3 py-1 rounded transition ${rabViewMode === 'client' ? 'bg-white text-slate-800 font-bold' : 'text-slate-300 hover:text-white'}`}>Client</button>
                            <button onClick={() => setRabViewMode('internal')} className={`px-3 py-1 rounded transition ${rabViewMode === 'internal' ? 'bg-white text-slate-800 font-bold' : 'text-slate-300 hover:text-white'}`}>Internal</button>
                        </div>
                    )}
                    <button onClick={() => window.print()} className="bg-white text-slate-800 p-2 rounded-full hover:bg-slate-100 shadow-sm">
                        <Printer size={20} />
                    </button>
                </div>
            </header>

            {/* PRINT ONLY HEADER (KOP SURAT) */}
            <div className="hidden print:block mb-8 border-b-4 border-slate-800 pb-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold uppercase text-slate-800">{landingConfig?.companyName || 'KONTRAKTOR PRO'}</h1>
                        <p className="text-sm text-slate-600 max-w-sm">{landingConfig?.subtitle || 'Layanan Konstruksi & Renovasi Profesional'}</p>
                        <p className="text-xs text-slate-500 mt-1">
                            {landingConfig?.whatsappNumber && `WA: ${landingConfig.whatsappNumber} | `}
                            {landingConfig?.instagramHandle && `IG: @${landingConfig.instagramHandle}`}
                        </p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold text-slate-400 uppercase">Laporan Proyek</h2>
                        <p className="text-sm font-bold">{today}</p>
                    </div>
                </div>
            </div>

            <main className="p-8 max-w-4xl mx-auto print:p-0 print:max-w-none">
                <div className="border-b-2 border-slate-800 pb-6 mb-8 print:border-b-2 print:mb-4">
                    <h1 className="text-4xl font-bold uppercase mb-2 print:text-2xl">{activeProject.name}</h1>
                    <div className="flex justify-between text-sm text-slate-600 font-medium">
                        <span>Klien: {activeProject.client}</span>
                        <span className="print:hidden">{today}</span>
                        <span className="hidden print:inline">Lokasi: {activeProject.location}</span>
                    </div>
                </div>

                <div className="mb-8 print:break-inside-avoid">
                    <h3 className="font-bold text-lg mb-4 border-b pb-2">Status Proyek</h3>
                    <SCurveChart stats={stats} project={activeProject} />
                </div>

                {rabViewMode === 'client' ? (
                    <>
                        <div className="grid grid-cols-2 gap-6 mb-8 print:break-inside-avoid">
                            <div className="bg-slate-50 p-4 border rounded-xl print:border-slate-300">
                                <p className="text-xs uppercase text-slate-500 font-bold">Nilai Kontrak</p>
                                <p className="text-2xl font-bold text-slate-800">{formatRupiah(stats.totalRAB)}</p>
                            </div>
                            <div className="bg-blue-50 p-4 border border-blue-100 rounded-xl print:border-slate-300 print:bg-slate-50">
                                <p className="text-xs uppercase text-slate-500 font-bold">Prestasi Fisik</p>
                                <p className="text-2xl font-bold text-blue-700 print:text-black">{formatRupiah(stats.prog / 100 * stats.totalRAB)}</p>
                            </div>
                        </div>

                        {/* DOCUMENTATION GALLERY (PRINT ONLY) */}
                        <div className="mb-8 hidden print:block print:break-inside-avoid">
                            <h3 className="font-bold text-lg mb-4 border-b pb-2">Dokumentasi Terbaru</h3>
                            <div className="grid grid-cols-3 gap-4">
                                {recentPhotos.map((photo: any, idx) => (
                                    <div key={idx} className="border p-1 rounded">
                                        <img src={photo.photoUrl || photo.url} className="w-full h-32 object-cover" alt="Dokumentasi" />
                                        <p className="text-[10px] text-center mt-1 text-slate-500">{new Date(photo.date).toLocaleDateString('id-ID')}</p>
                                    </div>
                                ))}
                                {recentPhotos.length === 0 && <p className="text-xs text-slate-400 italic">Tidak ada foto dokumentasi.</p>}
                            </div>
                        </div>

                        <h3 className="font-bold text-lg mb-4 border-b pb-2">Rincian Prestasi</h3>
                        {Object.keys(rabGroups).map(cat => (
                            <div key={cat} className="mb-6 print:break-inside-avoid">
                                <div className="bg-slate-100 p-2 font-bold text-sm border">{cat}</div>
                                <table className="w-full text-xs border border-t-0">
                                    <thead>
                                        <tr className="bg-slate-50">
                                            <th className="border p-2 w-1/3 text-left">Item</th>
                                            <th className="border p-2 text-right">Nilai</th>
                                            <th className="border p-2 text-center">Bobot</th>
                                            <th className="border p-2 text-center">Prog %</th>
                                            <th className="border p-2 text-right">Prestasi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rabGroups[cat].map(item => {
                                            const total = item.volume * item.unitPrice;
                                            const val = total * (item.progress / 100);
                                            return (
                                                <tr key={item.id}>
                                                    <td className="border p-2">{item.name}</td>
                                                    <td className="border p-2 text-right">{formatRupiah(total)}</td>
                                                    <td className="border p-2 text-center">{((total / stats.totalRAB) * 100).toFixed(2)}%</td>
                                                    <td className="border p-2 text-center font-bold">{item.progress}%</td>
                                                    <td className="border p-2 text-right font-bold">{formatRupiah(val)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </>
                ) : (
                    <>
                        <div className="bg-orange-50 p-4 border border-orange-200 rounded-xl mb-6 print:break-inside-avoid print:bg-white print:border-black">
                            <h3 className="font-bold text-lg text-orange-800 mb-2 flex items-center gap-2 print:text-black">⚠️ Laporan Internal (Cashflow & Detail)</h3>
                            <div className="grid grid-cols-3 gap-6 text-sm">
                                <div><p className="text-slate-500">Total RAB</p><p className="font-bold text-slate-800">{formatRupiah(stats.totalRAB)}</p></div>
                                <div><p className="text-slate-500">Realisasi (Input)</p><p className="font-bold text-slate-800">{formatRupiah(activeProject.transactions?.reduce((a, b) => b.type === 'expense' ? a + b.amount : a, 0) || 0)}</p></div>
                                <div><p className="text-slate-500">Estimasi Laba</p><p className="font-bold text-green-600 print:text-black">{formatRupiah(stats.totalRAB - (activeProject.transactions?.reduce((a, b) => b.type === 'expense' ? a + b.amount : a, 0) || 0))}</p></div>
                            </div>
                        </div>

                        {Object.keys(rabGroups).map(cat => (
                            <div key={cat} className="mb-6 print:break-inside-avoid">
                                <div className="bg-slate-100 p-2 font-bold text-sm border">{cat}</div>
                                <table className="w-full text-xs border border-t-0">
                                    <thead>
                                        <tr className="bg-slate-50">
                                            <th className="border p-2 w-1/4 text-left">Item</th>
                                            <th className="border p-2 text-center">Vol</th>
                                            <th className="border p-2 text-right">Hrg Satuan</th>
                                            <th className="border p-2 text-right">Total RAB</th>
                                            <th className="border p-2 text-center">Bobot</th>
                                            <th className="border p-2 text-center">Prog %</th>
                                            <th className="border p-2 text-right">Nilai Prog</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rabGroups[cat].map(item => {
                                            const total = item.volume * item.unitPrice;
                                            const val = total * (item.progress / 100);
                                            return (
                                                <tr key={item.id}>
                                                    <td className="border p-2">{item.name}</td>
                                                    <td className="border p-2 text-center">{item.volume} {item.unit}</td>
                                                    <td className="border p-2 text-right text-slate-500">{formatRupiah(item.unitPrice)}</td>
                                                    <td className="border p-2 text-right font-bold">{formatRupiah(total)}</td>
                                                    <td className="border p-2 text-center">{((total / stats.totalRAB) * 100).toFixed(2)}%</td>
                                                    <td className="border p-2 text-center">{item.progress}%</td>
                                                    <td className="border p-2 text-right font-bold text-blue-700 print:text-black">{formatRupiah(val)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </>
                )}
            </main>
        </div>
    );
};

export default ReportView;
