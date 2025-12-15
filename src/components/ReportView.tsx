import React, { useState } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import type { Project } from '../types';
import { formatRupiah, getStats, getRABGroups } from '../utils/helpers';
import SCurveChart from './SCurveChart';

interface ReportViewProps {
    activeProject: Project;
    setView: (view: any) => void;
    isClientView?: boolean;
    canViewInternalRAB?: boolean; // Pengawas tidak bisa lihat laporan internal
}

const ReportView: React.FC<ReportViewProps> = ({ activeProject, setView, isClientView, canViewInternalRAB = true }) => {
    const [rabViewMode, setRabViewMode] = useState<'client' | 'internal'>('client');

    // Enforce Client View (pengawas & client)
    React.useEffect(() => {
        if (isClientView || !canViewInternalRAB) setRabViewMode('client');
    }, [isClientView, canViewInternalRAB]);
    const rabGroups = getRABGroups(activeProject);
    const stats = getStats(activeProject);
    const today = new Date().toLocaleDateString('id-ID', { dateStyle: 'full' });

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
                    {/* Pengawas tidak bisa lihat laporan internal */}
                    {!isClientView && canViewInternalRAB && (
                        <div className="bg-slate-700 p-1 rounded flex text-xs">
                            <button
                                onClick={() => setRabViewMode('client')}
                                className={`px-3 py-1 rounded transition ${rabViewMode === 'client' ? 'bg-white text-slate-800 font-bold' : 'text-slate-300 hover:text-white'}`}
                            >
                                Client
                            </button>
                            <button
                                onClick={() => setRabViewMode('internal')}
                                className={`px-3 py-1 rounded transition ${rabViewMode === 'internal' ? 'bg-white text-slate-800 font-bold' : 'text-slate-300 hover:text-white'}`}
                            >
                                Internal
                            </button>
                        </div>
                    )}
                    <button onClick={() => window.print()} className="bg-white text-slate-800 p-2 rounded-full hover:bg-slate-100 shadow-sm">
                        <Printer size={20} />
                    </button>
                </div>
            </header>

            <main className="p-8 max-w-4xl mx-auto">
                <div className="border-b-2 border-slate-800 pb-6 mb-8">
                    <h1 className="text-4xl font-bold uppercase mb-2">{activeProject.name}</h1>
                    <div className="flex justify-between text-sm text-slate-600 font-medium">
                        <span>Klien: {activeProject.client}</span>
                        <span>{today}</span>
                    </div>
                </div>

                <div className="mb-8 print:break-inside-avoid">
                    <h3 className="font-bold text-lg mb-4 border-b pb-2">Status Proyek</h3>
                    <SCurveChart stats={stats} project={activeProject} />
                </div>

                {rabViewMode === 'client' ? (
                    <>
                        <div className="grid grid-cols-2 gap-6 mb-8 print:break-inside-avoid">
                            <div className="bg-slate-50 p-4 border rounded-xl">
                                <p className="text-xs uppercase text-slate-500 font-bold">Nilai Kontrak</p>
                                <p className="text-2xl font-bold text-slate-800">{formatRupiah(stats.totalRAB)}</p>
                            </div>
                            <div className="bg-blue-50 p-4 border border-blue-100 rounded-xl">
                                <p className="text-xs uppercase text-slate-500 font-bold">Prestasi Fisik</p>
                                <p className="text-2xl font-bold text-blue-700">{formatRupiah(stats.prog / 100 * stats.totalRAB)}</p>
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
                        <div className="bg-orange-50 p-4 border border-orange-200 rounded-xl mb-6 print:break-inside-avoid">
                            <h3 className="font-bold text-lg text-orange-800 mb-2 flex items-center gap-2">⚠️ Laporan Internal (Cashflow & Detail)</h3>
                            <div className="grid grid-cols-3 gap-6 text-sm">
                                <div><p className="text-slate-500">Total RAB</p><p className="font-bold text-slate-800">{formatRupiah(stats.totalRAB)}</p></div>
                                <div><p className="text-slate-500">Realisasi (Input)</p><p className="font-bold text-slate-800">{formatRupiah(activeProject.transactions?.reduce((a, b) => b.type === 'expense' ? a + b.amount : a, 0) || 0)}</p></div>
                                <div><p className="text-slate-500">Estimasi Laba</p><p className="font-bold text-green-600">{formatRupiah(stats.totalRAB - (activeProject.transactions?.reduce((a, b) => b.type === 'expense' ? a + b.amount : a, 0) || 0))}</p></div>
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
                                                    <td className="border p-2 text-right font-bold text-blue-700">{formatRupiah(val)}</td>
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
