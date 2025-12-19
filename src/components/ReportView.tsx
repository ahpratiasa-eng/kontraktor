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
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
            <header className="bg-slate-800 text-white px-3 py-2.5 flex items-center justify-between sticky top-0 shadow-md z-20 print:hidden">
                <div className="flex items-center gap-2">
                    <button onClick={() => setView('project-detail')} className="hover:bg-slate-700 p-1.5 rounded">
                        <ArrowLeft size={18} />
                    </button>
                    <h2 className="font-bold uppercase tracking-wider text-[11px]">Laporan</h2>
                </div>
                <div className="flex items-center gap-1.5">
                    {!isClientView && canViewInternalRAB && (
                        <div className="bg-slate-700 p-0.5 rounded flex text-[9px]">
                            <button onClick={() => setRabViewMode('client')} className={`px-2 py-0.5 rounded transition ${rabViewMode === 'client' ? 'bg-white text-slate-800 font-bold' : 'text-slate-300'}`}>Client</button>
                            <button onClick={() => setRabViewMode('internal')} className={`px-2 py-0.5 rounded transition ${rabViewMode === 'internal' ? 'bg-white text-slate-800 font-bold' : 'text-slate-300'}`}>Internal</button>
                        </div>
                    )}
                    <button onClick={() => window.print()} className="bg-white text-slate-800 p-1.5 rounded-full hover:bg-slate-100 shadow-sm">
                        <Printer size={14} />
                    </button>
                </div>
            </header>

            {/* PRINT ONLY HEADER (KOP SURAT) */}
            <div className="hidden print:block mb-8 border-b-4 border-slate-800 pb-4 px-8">
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

            <main className="p-4 print:p-8 pb-20">
                {/* Project Header */}
                <div className="border-b-2 border-slate-300 pb-3 mb-4">
                    <h1 className="text-lg font-bold uppercase mb-1 leading-tight text-slate-800">{activeProject.name}</h1>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-slate-500">
                        <span>Klien: {activeProject.client}</span>
                        <span className="print:hidden">{today}</span>
                    </div>
                </div>

                {/* S-Curve Chart */}
                <div className="mb-6 print:break-inside-avoid">
                    <h3 className="font-bold text-base md:text-lg mb-3 border-b pb-2">Status Proyek</h3>
                    <div className="overflow-x-auto -mx-4 px-4">
                        <div className="min-w-[300px]">
                            <SCurveChart stats={stats} project={activeProject} />
                        </div>
                    </div>
                </div>

                {rabViewMode === 'client' ? (
                    <>
                        <div className="grid grid-cols-2 gap-3 md:gap-6 mb-6 print:break-inside-avoid">
                            <div className="bg-slate-50 p-3 md:p-4 border rounded-xl print:border-slate-300">
                                <p className="text-[10px] md:text-xs uppercase text-slate-500 font-bold">Nilai Kontrak</p>
                                <p className="text-lg md:text-2xl font-bold text-slate-800">{formatRupiah(activeProject.contractValue || activeProject.budgetLimit || stats.totalRAB)}</p>
                            </div>
                            <div className="bg-blue-50 p-3 md:p-4 border border-blue-100 rounded-xl print:border-slate-300 print:bg-slate-50">
                                <p className="text-[10px] md:text-xs uppercase text-slate-500 font-bold">Prestasi Fisik</p>
                                <p className="text-lg md:text-2xl font-bold text-blue-700 print:text-black">{formatRupiah(stats.prog / 100 * stats.totalRAB)}</p>
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

                        <h3 className="font-bold text-base md:text-lg mb-3 border-b pb-2">Rincian Prestasi</h3>
                        {Object.keys(rabGroups).map(cat => (
                            <div key={cat} className="mb-4 print:break-inside-avoid">
                                <div className="bg-slate-100 p-2 font-bold text-xs md:text-sm border rounded-t-lg">{cat}</div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-[10px] md:text-xs border border-t-0 min-w-[400px]">
                                        <thead>
                                            <tr className="bg-slate-50">
                                                <th className="border p-1.5 md:p-2 text-left">Item</th>
                                                <th className="border p-1.5 md:p-2 text-right">Nilai</th>
                                                <th className="border p-1.5 md:p-2 text-center">Bobot</th>
                                                <th className="border p-1.5 md:p-2 text-center">Prog</th>
                                                <th className="border p-1.5 md:p-2 text-right">Prestasi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rabGroups[cat].map(item => {
                                                const total = item.volume * item.unitPrice;
                                                const val = total * (item.progress / 100);
                                                return (
                                                    <tr key={item.id}>
                                                        <td className="border p-1.5 md:p-2">{item.name}</td>
                                                        <td className="border p-1.5 md:p-2 text-right whitespace-nowrap">{formatRupiah(total)}</td>
                                                        <td className="border p-1.5 md:p-2 text-center">{((total / stats.totalRAB) * 100).toFixed(1)}%</td>
                                                        <td className="border p-1.5 md:p-2 text-center font-bold">{item.progress}%</td>
                                                        <td className="border p-1.5 md:p-2 text-right font-bold whitespace-nowrap">{formatRupiah(val)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </>
                ) : (
                    <>
                        <div className="bg-orange-50 p-3 md:p-4 border border-orange-200 rounded-xl mb-4 print:break-inside-avoid print:bg-white print:border-black">
                            <h3 className="font-bold text-sm md:text-base text-orange-800 mb-2 flex items-center gap-2 print:text-black">⚠️ Laporan Internal</h3>
                            <div className="grid grid-cols-3 gap-2 md:gap-6 text-[10px] md:text-sm">
                                <div><p className="text-slate-500">Total RAB</p><p className="font-bold text-slate-800 text-xs md:text-base">{formatRupiah(stats.totalRAB)}</p></div>
                                <div><p className="text-slate-500">Realisasi</p><p className="font-bold text-slate-800 text-xs md:text-base">{formatRupiah(activeProject.transactions?.reduce((a, b) => b.type === 'expense' ? a + b.amount : a, 0) || 0)}</p></div>
                                <div><p className="text-slate-500">Est. Laba</p><p className="font-bold text-green-600 print:text-black text-xs md:text-base">{formatRupiah(stats.totalRAB - (activeProject.transactions?.reduce((a, b) => b.type === 'expense' ? a + b.amount : a, 0) || 0))}</p></div>
                            </div>
                        </div>

                        {Object.keys(rabGroups).map(cat => (
                            <div key={cat} className="mb-4 print:break-inside-avoid">
                                <div className="bg-slate-100 p-2 font-bold text-xs md:text-sm border rounded-t-lg">{cat}</div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-[9px] md:text-xs border border-t-0 min-w-[500px]">
                                        <thead>
                                            <tr className="bg-slate-50">
                                                <th className="border p-1.5 text-left">Item</th>
                                                <th className="border p-1.5 text-center">Vol</th>
                                                <th className="border p-1.5 text-right">Satuan</th>
                                                <th className="border p-1.5 text-right">Total</th>
                                                <th className="border p-1.5 text-center">Bobot</th>
                                                <th className="border p-1.5 text-center">Prog</th>
                                                <th className="border p-1.5 text-right">Nilai</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rabGroups[cat].map(item => {
                                                const total = item.volume * item.unitPrice;
                                                const val = total * (item.progress / 100);
                                                return (
                                                    <tr key={item.id}>
                                                        <td className="border p-1.5">{item.name}</td>
                                                        <td className="border p-1.5 text-center whitespace-nowrap">{item.volume} {item.unit}</td>
                                                        <td className="border p-1.5 text-right text-slate-500 whitespace-nowrap">{formatRupiah(item.unitPrice)}</td>
                                                        <td className="border p-1.5 text-right font-bold whitespace-nowrap">{formatRupiah(total)}</td>
                                                        <td className="border p-1.5 text-center">{((total / stats.totalRAB) * 100).toFixed(1)}%</td>
                                                        <td className="border p-1.5 text-center">{item.progress}%</td>
                                                        <td className="border p-1.5 text-right font-bold text-blue-700 print:text-black whitespace-nowrap">{formatRupiah(val)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </main>
        </div>
    );
};

export default ReportView;
