import React, { useMemo, useState } from 'react';
import { BarChart3, PieChart, Download, Calendar, AlertTriangle } from 'lucide-react';
import type { Project } from '../types';
import { formatRupiah } from '../utils/helpers';
import * as XLSX from 'xlsx';

interface AnalyticsViewProps {
    projects: Project[];
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ projects }) => {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const activeProjects = projects.filter(p => !p.isDeleted);

    // Calculate monthly spending data
    const monthlyData = useMemo(() => {
        const months = Array.from({ length: 12 }, (_, i) => ({
            month: i,
            name: new Date(selectedYear, i).toLocaleString('id-ID', { month: 'short' }),
            expense: 0,
            income: 0
        }));

        activeProjects.forEach(p => {
            (p.transactions || []).forEach(t => {
                const date = new Date(t.date);
                if (date.getFullYear() === selectedYear) {
                    const monthIdx = date.getMonth();
                    if (t.type === 'expense') {
                        months[monthIdx].expense += t.amount;
                    } else {
                        months[monthIdx].income += t.amount;
                    }
                }
            });
        });

        return months;
    }, [activeProjects, selectedYear]);

    // Max value for chart scaling
    const maxValue = Math.max(...monthlyData.map(m => Math.max(m.expense, m.income)), 1);

    // Project comparison data
    const projectComparison = useMemo(() => {
        return activeProjects.map(p => {
            const rabTotal = (p.rabItems || []).reduce((sum, r) => sum + (r.unitPrice * r.volume), 0);
            const totalExpense = (p.transactions || []).filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            const profit = rabTotal - totalExpense;
            const profitMargin = rabTotal > 0 ? (profit / rabTotal) * 100 : 0;

            return {
                id: p.id,
                name: p.name,
                client: p.client,
                rabTotal,
                totalExpense,
                profit,
                profitMargin,
                status: p.status
            };
        }).sort((a, b) => b.profitMargin - a.profitMargin);
    }, [activeProjects]);

    // Budget forecasting
    const forecasting = useMemo(() => {
        return activeProjects.map(p => {
            const budgetLimit = p.budgetLimit || 0;
            const totalExpense = (p.transactions || []).filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            const remaining = budgetLimit - totalExpense;

            // Calculate burn rate (average daily spending over last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const recentExpenses = (p.transactions || [])
                .filter(t => t.type === 'expense' && new Date(t.date) >= thirtyDaysAgo)
                .reduce((sum, t) => sum + t.amount, 0);

            const dailyBurnRate = recentExpenses / 30;
            const daysUntilEmpty = dailyBurnRate > 0 ? Math.floor(remaining / dailyBurnRate) : 999;

            const estimatedEmptyDate = new Date();
            estimatedEmptyDate.setDate(estimatedEmptyDate.getDate() + daysUntilEmpty);

            return {
                id: p.id,
                name: p.name,
                budgetLimit,
                totalExpense,
                remaining,
                usedPercent: budgetLimit > 0 ? (totalExpense / budgetLimit) * 100 : 0,
                dailyBurnRate,
                daysUntilEmpty,
                estimatedEmptyDate: daysUntilEmpty < 999 ? estimatedEmptyDate : null,
                isOverBudget: totalExpense > budgetLimit && budgetLimit > 0,
                isCritical: daysUntilEmpty < 14 && daysUntilEmpty > 0
            };
        }).filter(p => p.budgetLimit > 0);
    }, [activeProjects]);

    // Export to Excel
    const handleExportExcel = () => {
        const workbook = XLSX.utils.book_new();

        // Sheet 1: Summary
        const summaryData = activeProjects.map(p => ({
            'Nama Proyek': p.name,
            'Klien': p.client,
            'Lokasi': p.location,
            'Status': p.status,
            'Tanggal Mulai': p.startDate,
            'Tanggal Selesai': p.endDate,
            'Budget Limit': p.budgetLimit || 0,
            'Total RAB': (p.rabItems || []).reduce((s, r) => s + (r.unitPrice * r.volume), 0),
            'Total Pengeluaran': (p.transactions || []).filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
            'Total Pemasukan': (p.transactions || []).filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        }));
        const ws1 = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, ws1, 'Ringkasan Proyek');

        // Sheet 2: All Transactions
        const allTransactions: any[] = [];
        activeProjects.forEach(p => {
            (p.transactions || []).forEach(t => {
                allTransactions.push({
                    'Proyek': p.name,
                    'Tanggal': t.date,
                    'Tipe': t.type === 'expense' ? 'Pengeluaran' : 'Pemasukan',
                    'Kategori': t.category,
                    'Deskripsi': t.description,
                    'Jumlah': t.amount
                });
            });
        });
        const ws2 = XLSX.utils.json_to_sheet(allTransactions);
        XLSX.utils.book_append_sheet(workbook, ws2, 'Semua Transaksi');

        // Sheet 3: Monthly Summary
        const monthlySheet = monthlyData.map(m => ({
            'Bulan': m.name,
            'Pengeluaran': m.expense,
            'Pemasukan': m.income,
            'Net': m.income - m.expense
        }));
        const ws3 = XLSX.utils.json_to_sheet(monthlySheet);
        XLSX.utils.book_append_sheet(workbook, ws3, 'Ringkasan Bulanan');

        // Sheet 4: Profit Comparison
        const profitSheet = projectComparison.map(p => ({
            'Proyek': p.name,
            'Klien': p.client,
            'Nilai RAB': p.rabTotal,
            'Total Pengeluaran': p.totalExpense,
            'Profit': p.profit,
            'Margin (%)': p.profitMargin.toFixed(1)
        }));
        const ws4 = XLSX.utils.json_to_sheet(profitSheet);
        XLSX.utils.book_append_sheet(workbook, ws4, 'Perbandingan Profit');

        XLSX.writeFile(workbook, `Guna_Karya_Analytics_${selectedYear}.xlsx`);
    };

    // Export for Accurate/Jurnal (CSV format)
    const handleExportAccounting = () => {
        const accountingData: any[] = [];

        activeProjects.forEach(p => {
            (p.transactions || []).forEach(t => {
                // Format for Accurate/Jurnal import
                accountingData.push({
                    'Tanggal': t.date,
                    'No. Bukti': `GK-${p.id.slice(0, 6)}-${t.id}`,
                    'Keterangan': `${p.name} - ${t.description || t.category}`,
                    'Akun Debit': t.type === 'expense' ? t.category : 'Kas/Bank',
                    'Akun Kredit': t.type === 'expense' ? 'Kas/Bank' : t.category,
                    'Jumlah': t.amount,
                    'Proyek': p.name
                });
            });
        });

        const ws = XLSX.utils.json_to_sheet(accountingData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Jurnal');
        XLSX.writeFile(wb, `Guna_Karya_Jurnal_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const years = [2023, 2024, 2025, 2026];

    return (
        <div className="space-y-4 md:space-y-6 pb-24 px-1">
            {/* Header */}
            <div className="flex flex-col gap-3">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-800">Analytics & Insight</h1>
                    <p className="text-sm text-slate-500">Analisis keuangan dan performa proyek</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="px-3 py-2 bg-white border rounded-xl text-sm font-medium flex-1 min-w-[80px]"
                    >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button
                        onClick={handleExportExcel}
                        className="bg-green-600 text-white px-3 py-2 rounded-xl font-bold text-xs md:text-sm flex items-center gap-1.5 hover:bg-green-700 flex-1 justify-center min-w-[100px]"
                    >
                        <Download size={14} /> Excel
                    </button>
                    <button
                        onClick={handleExportAccounting}
                        className="bg-purple-600 text-white px-3 py-2 rounded-xl font-bold text-xs md:text-sm flex items-center gap-1.5 hover:bg-purple-700 flex-1 justify-center min-w-[100px]"
                    >
                        <Download size={14} /> Jurnal
                    </button>
                </div>
            </div>

            {/* Monthly Trend Chart */}
            <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4 md:mb-6">
                    <div>
                        <h2 className="font-bold text-base md:text-lg text-slate-800 flex items-center gap-2">
                            <BarChart3 size={18} className="text-blue-600" />
                            Trend {selectedYear}
                        </h2>
                        <p className="text-xs md:text-sm text-slate-500">Grafik bulanan semua proyek</p>
                    </div>
                    <div className="flex gap-3 text-[10px] md:text-xs">
                        <div className="flex items-center gap-1">
                            <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-red-500 rounded"></div>
                            <span>Pengeluaran</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 rounded"></div>
                            <span>Pemasukan</span>
                        </div>
                    </div>
                </div>

                {/* Simple Bar Chart */}
                <div className="flex items-end justify-between gap-1 md:gap-2 h-40 md:h-64 px-0 md:px-2 overflow-x-auto">
                    {monthlyData.map((m, idx) => (
                        <div key={idx} className="flex-1 min-w-[20px] flex flex-col items-center gap-0.5 md:gap-1">
                            <div className="w-full flex gap-0.5 items-end justify-center h-32 md:h-52">
                                {/* Expense Bar */}
                                <div
                                    className="w-2 md:w-4 bg-red-500 rounded-t transition-all hover:bg-red-600"
                                    style={{ height: `${(m.expense / maxValue) * 100}%`, minHeight: m.expense > 0 ? '4px' : '0' }}
                                    title={`Pengeluaran: ${formatRupiah(m.expense)}`}
                                />
                                {/* Income Bar */}
                                <div
                                    className="w-2 md:w-4 bg-green-500 rounded-t transition-all hover:bg-green-600"
                                    style={{ height: `${(m.income / maxValue) * 100}%`, minHeight: m.income > 0 ? '4px' : '0' }}
                                    title={`Pemasukan: ${formatRupiah(m.income)}`}
                                />
                            </div>
                            <span className="text-[8px] md:text-[10px] font-bold text-slate-500">{m.name}</span>
                        </div>
                    ))}
                </div>

                {/* Summary row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mt-4 md:mt-6 pt-3 md:pt-4 border-t">
                    <div className="text-center p-2 bg-red-50 rounded-xl">
                        <div className="text-sm md:text-xl font-bold text-red-600 truncate">{formatRupiah(monthlyData.reduce((s, m) => s + m.expense, 0))}</div>
                        <div className="text-[10px] md:text-xs text-slate-500">Total Pengeluaran</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded-xl">
                        <div className="text-sm md:text-xl font-bold text-green-600 truncate">{formatRupiah(monthlyData.reduce((s, m) => s + m.income, 0))}</div>
                        <div className="text-[10px] md:text-xs text-slate-500">Total Pemasukan</div>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded-xl">
                        <div className="text-sm md:text-xl font-bold text-blue-600 truncate">{formatRupiah(monthlyData.reduce((s, m) => s + m.income - m.expense, 0))}</div>
                        <div className="text-[10px] md:text-xs text-slate-500">Net Cash Flow</div>
                    </div>
                    <div className="text-center p-2 bg-slate-50 rounded-xl">
                        <div className="text-sm md:text-xl font-bold text-slate-700 truncate">{formatRupiah(monthlyData.reduce((s, m) => s + m.expense, 0) / 12)}</div>
                        <div className="text-[10px] md:text-xs text-slate-500">Rata-rata/Bulan</div>
                    </div>
                </div>
            </div>

            {/* Project Profit Comparison */}
            <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border">
                <h2 className="font-bold text-base md:text-lg text-slate-800 flex items-center gap-2 mb-2 md:mb-4">
                    <PieChart size={18} className="text-purple-600" />
                    Profit Margin
                </h2>
                <p className="text-xs md:text-sm text-slate-500 mb-4 md:mb-6">Ranking proyek berdasarkan margin keuntungan</p>

                <div className="space-y-2 md:space-y-3">
                    {projectComparison.length === 0 ? (
                        <div className="text-center py-6 md:py-8 text-slate-400 text-sm">Tidak ada data proyek</div>
                    ) : (
                        projectComparison.map((p, idx) => (
                            <div key={p.id} className="flex items-center gap-2 md:gap-4 p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl">
                                <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-white text-xs md:text-sm shrink-0 ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-orange-400' : 'bg-slate-300'
                                    }`}>
                                    {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-xs md:text-sm text-slate-800 truncate">{p.name}</div>
                                    <div className="text-[10px] md:text-xs text-slate-500 truncate">{p.client}</div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className={`text-sm md:text-lg font-bold ${p.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {p.profitMargin.toFixed(1)}%
                                    </div>
                                    <div className="text-[9px] md:text-[10px] text-slate-400 truncate max-w-[80px] md:max-w-none">
                                        {p.profit >= 0 ? '+' : ''}{formatRupiah(p.profit)}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Budget Forecasting */}
            <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border">
                <h2 className="font-bold text-base md:text-lg text-slate-800 flex items-center gap-2 mb-2 md:mb-4">
                    <Calendar size={18} className="text-orange-600" />
                    Budget Forecasting
                </h2>
                <p className="text-xs md:text-sm text-slate-500 mb-4 md:mb-6">Prediksi kapan budget habis</p>

                {forecasting.length === 0 ? (
                    <div className="text-center py-6 md:py-8 text-slate-400 text-sm">
                        Tidak ada proyek dengan budget limit
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 md:gap-4">
                        {forecasting.map(p => (
                            <div
                                key={p.id}
                                className={`p-3 md:p-4 rounded-xl md:rounded-2xl border ${p.isOverBudget ? 'bg-red-50 border-red-200' :
                                    p.isCritical ? 'bg-yellow-50 border-yellow-200' :
                                        'bg-slate-50 border-slate-100'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-2 md:mb-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="font-bold text-xs md:text-sm text-slate-800 truncate">{p.name}</div>
                                        <div className="text-[10px] md:text-xs text-slate-500">Budget: {formatRupiah(p.budgetLimit)}</div>
                                    </div>
                                    {(p.isOverBudget || p.isCritical) && (
                                        <AlertTriangle size={16} className={`shrink-0 ml-2 ${p.isOverBudget ? 'text-red-500' : 'text-yellow-500'}`} />
                                    )}
                                </div>

                                {/* Progress bar */}
                                <div className="mb-2 md:mb-3">
                                    <div className="flex justify-between text-[10px] md:text-xs mb-1">
                                        <span className="text-slate-500">Terpakai</span>
                                        <span className={`font-bold ${p.isOverBudget ? 'text-red-600' : 'text-slate-700'}`}>
                                            {p.usedPercent.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-1.5 md:h-2">
                                        <div
                                            className={`h-full rounded-full ${p.isOverBudget ? 'bg-red-500' : p.isCritical ? 'bg-yellow-500' : 'bg-blue-500'}`}
                                            style={{ width: `${Math.min(p.usedPercent, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-[10px] md:text-xs">
                                    <div>
                                        <div className="text-slate-400">Burn/Hari</div>
                                        <div className="font-bold text-slate-700 truncate">{formatRupiah(p.dailyBurnRate)}</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-400">Sisa</div>
                                        <div className={`font-bold truncate ${p.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {formatRupiah(p.remaining)}
                                        </div>
                                    </div>
                                    <div className="col-span-2 mt-1 md:mt-2 pt-1 md:pt-2 border-t border-slate-200">
                                        <div className="text-slate-400">Estimasi Habis</div>
                                        <div className={`font-bold text-[10px] md:text-xs ${p.isCritical ? 'text-red-600' : 'text-slate-700'}`}>
                                            {p.isOverBudget ? '⚠️ Over Budget!' :
                                                p.estimatedEmptyDate ?
                                                    `${p.daysUntilEmpty} hari (${p.estimatedEmptyDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})` :
                                                    '∞ Aman'
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalyticsView;
