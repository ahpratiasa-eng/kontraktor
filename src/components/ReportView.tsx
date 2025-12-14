import React, { useState } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import type { Project } from '../types';
import { formatRupiah, getStats, getRABGroups } from '../utils/helpers';
import SCurveChart from './SCurveChart';

interface ReportViewProps {
    activeProject: Project;
    setView: (view: any) => void;
}

const ReportView: React.FC<ReportViewProps> = ({ activeProject, setView }) => {
    const [rabViewMode, setRabViewMode] = useState<'client' | 'internal'>('client');
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
                    <div className="bg-red-50 text-red-800 p-4 rounded-xl text-center font-bold mb-6 border border-red-200">
                        Laporan Internal (Cashflow) - RAHASIA DAPUR
                    </div>
                )}
            </main>
        </div>
    );
};

export default ReportView;
