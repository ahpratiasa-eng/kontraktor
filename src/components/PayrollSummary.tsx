import React from 'react';
import { DollarSign, Users, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';
import type { Project, Worker } from '../types';
import { calculateTotalDays, calculateWorkerFinancials, formatRupiah } from '../utils/helpers';

interface PayrollSummaryProps {
    project: Project;
    onPayWorker?: (worker: Worker) => void;
}

const PayrollSummary: React.FC<PayrollSummaryProps> = ({ project, onPayWorker }) => {
    const workers = project.workers || [];

    // Calculate summary for all workers
    const workerSummaries = workers.map(worker => {
        const days = calculateTotalDays(project.attendanceLogs || [], worker.id);
        const financials = calculateWorkerFinancials(project, worker.id);

        return {
            worker,
            daysWorked: days,
            totalDue: financials.totalDue,
            totalPaid: financials.totalPaid,
            balance: financials.balance, // Positive = still owed, Negative = overpaid
        };
    });

    // Aggregate totals
    const totalDue = workerSummaries.reduce((sum, w) => sum + w.totalDue, 0);
    const totalPaid = workerSummaries.reduce((sum, w) => sum + w.totalPaid, 0);
    const totalBalance = workerSummaries.reduce((sum, w) => sum + w.balance, 0);
    const workersWithDebt = workerSummaries.filter(w => w.balance > 0).length;

    return (
        <div className="space-y-6">
            {/* Summary Card - Single unified dark card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-5 md:p-6 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <DollarSign size={120} />
                </div>
                <h3 className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-4">Ringkasan Gaji & Hutang</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                                <Users size={16} className="text-slate-300" />
                            </div>
                        </div>
                        <p className="text-[10px] md:text-xs text-slate-400 mb-0.5">Total Tukang</p>
                        <p className="text-xl md:text-2xl font-black">{workers.length}</p>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                                <DollarSign size={16} className="text-slate-300" />
                            </div>
                        </div>
                        <p className="text-[10px] md:text-xs text-slate-400 mb-0.5">Total Upah</p>
                        <p className="text-lg md:text-xl font-bold text-blue-300">{formatRupiah(totalDue)}</p>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                                <CheckCircle size={16} className="text-green-400" />
                            </div>
                        </div>
                        <p className="text-[10px] md:text-xs text-slate-400 mb-0.5">Sudah Dibayar</p>
                        <p className="text-lg md:text-xl font-bold text-green-400">{formatRupiah(totalPaid)}</p>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                                {totalBalance > 0 ? <TrendingDown size={16} className="text-amber-400" /> : <CheckCircle size={16} className="text-green-400" />}
                            </div>
                        </div>
                        <p className="text-[10px] md:text-xs text-slate-400 mb-0.5">Sisa Hutang</p>
                        <p className={`text-lg md:text-xl font-bold ${totalBalance > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                            {formatRupiah(totalBalance)}
                        </p>
                        {workersWithDebt > 0 && (
                            <p className="text-[10px] text-slate-500 mt-0.5">{workersWithDebt} tukang belum lunas</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Alert if significant debt */}
            {totalBalance > 1000000 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <p className="font-bold text-amber-800">Perhatian: Hutang Gaji Signifikan</p>
                        <p className="text-sm text-amber-700">Total hutang gaji sudah mencapai {formatRupiah(totalBalance)}. Pastikan cashflow proyek mencukupi.</p>
                    </div>
                </div>
            )}

            {/* Worker Details - Mobile Card View */}
            <div className="md:hidden space-y-4">
                <h3 className="font-bold text-slate-700 px-2">Detail Gaji per Tukang</h3>
                {workerSummaries.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">Belum ada data tukang</div>
                ) : (
                    workerSummaries.map(({ worker, daysWorked, totalDue, totalPaid, balance }) => (
                        <div key={worker.id} className="bg-white p-4 rounded-2xl border shadow-sm space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-bold text-slate-800 text-lg">{worker.name}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold ${worker.role === 'Mandor' ? 'bg-purple-100 text-purple-700' :
                                            worker.role === 'Tukang' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                                            }`}>{worker.role}</span>
                                        <span className="text-xs text-slate-400">{daysWorked.toFixed(1)} Hari Kerja</span>
                                    </div>
                                </div>
                                {balance > 0 && onPayWorker && (
                                    <button
                                        onClick={() => onPayWorker(worker)}
                                        className="bg-green-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-green-700 active:scale-95 transition"
                                    >
                                        Bayar
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-dashed">
                                <div>
                                    <span className="block text-slate-400 mb-0.5">Total Upah</span>
                                    <span className="font-bold text-slate-700">{formatRupiah(totalDue)}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-slate-400 mb-0.5">Sudah Dibayar</span>
                                    <span className="font-bold text-green-600">{formatRupiah(totalPaid)}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl">
                                <span className="text-xs font-bold text-slate-500">Sisa Hutang</span>
                                <span className={`font-black ${balance > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                    {balance > 0 ? formatRupiah(balance) : 'Lunas'}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Worker Details - Desktop Table View */}
            <div className="hidden md:block bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b">
                    <h3 className="font-bold text-slate-700">Detail Gaji per Tukang</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 text-xs text-slate-500 uppercase">
                                <th className="text-left p-3">Nama</th>
                                <th className="text-center p-3">Jenis</th>
                                <th className="text-center p-3">Hari Kerja</th>
                                <th className="text-right p-3">Total Upah</th>
                                <th className="text-right p-3">Dibayar</th>
                                <th className="text-right p-3">Sisa</th>
                                {onPayWorker && <th className="text-center p-3">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {workerSummaries.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-400">
                                        Belum ada data tukang
                                    </td>
                                </tr>
                            ) : (
                                workerSummaries.map(({ worker, daysWorked, totalDue, totalPaid, balance }) => (
                                    <tr key={worker.id} className="hover:bg-slate-50 transition">
                                        <td className="p-3">
                                            <p className="font-bold text-slate-800">{worker.name}</p>
                                            <p className="text-xs text-slate-500">{worker.wageUnit} @ {formatRupiah(worker.mandorRate)}</p>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${worker.role === 'Mandor' ? 'bg-purple-100 text-purple-700' :
                                                worker.role === 'Tukang' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-slate-100 text-slate-700'
                                                }`}>
                                                {worker.role}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center font-mono">{daysWorked.toFixed(1)} hari</td>
                                        <td className="p-3 text-right font-medium">{formatRupiah(totalDue)}</td>
                                        <td className="p-3 text-right text-green-600 font-medium">{formatRupiah(totalPaid)}</td>
                                        <td className={`p-3 text-right font-bold ${balance > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                            {balance > 0 ? formatRupiah(balance) : 'Lunas'}
                                        </td>
                                        {onPayWorker && (
                                            <td className="p-3 text-center">
                                                {balance > 0 && (
                                                    <button
                                                        onClick={() => onPayWorker(worker)}
                                                        className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-bold hover:bg-green-700 transition"
                                                    >
                                                        Bayar
                                                    </button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {workerSummaries.length > 0 && (
                            <tfoot className="bg-slate-100 font-bold">
                                <tr>
                                    <td colSpan={3} className="p-3 text-right text-slate-600">TOTAL</td>
                                    <td className="p-3 text-right">{formatRupiah(totalDue)}</td>
                                    <td className="p-3 text-right text-green-600">{formatRupiah(totalPaid)}</td>
                                    <td className={`p-3 text-right ${totalBalance > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                                        {formatRupiah(totalBalance)}
                                    </td>
                                    {onPayWorker && <td></td>}
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PayrollSummary;
