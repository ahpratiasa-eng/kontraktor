import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, BarChart3, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import type { Project } from '../types';
import { formatRupiah } from '../utils/helpers';

interface ProfitAnalyzerProps {
    project: Project;
}

interface CategoryAnalysis {
    category: string;
    estimatedCost: number;
    actualCost: number;
    variance: number;
    variancePercent: number;
    itemNames: string[]; // Just names for reference, no fake realisasi
}

const ProfitAnalyzer: React.FC<ProfitAnalyzerProps> = ({ project }) => {
    const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

    // Calculate profit analysis
    const analysis = useMemo(() => {
        const rabItems = project.rabItems || [];
        const transactions = (project.transactions || []).filter(t => t.type === 'expense');

        // Group RAB items by category
        const categoryMap = new Map<string, CategoryAnalysis>();

        rabItems.forEach(item => {
            const estimated = item.volume * item.unitPrice;
            const cat = item.category || 'Lain-lain';

            if (!categoryMap.has(cat)) {
                categoryMap.set(cat, {
                    category: cat,
                    estimatedCost: 0,
                    actualCost: 0,
                    variance: 0,
                    variancePercent: 0,
                    itemNames: []
                });
            }

            const catData = categoryMap.get(cat)!;
            catData.estimatedCost += estimated;
            catData.itemNames.push(item.name);
        });

        // Sum transactions by category
        transactions.forEach(tx => {
            const cat = tx.category || 'Lain-lain';

            if (!categoryMap.has(cat)) {
                // Transaction category doesn't match any RAB category
                categoryMap.set(cat, {
                    category: cat,
                    estimatedCost: 0,
                    actualCost: 0,
                    variance: 0,
                    variancePercent: 0,
                    itemNames: []
                });
            }

            const catData = categoryMap.get(cat)!;
            catData.actualCost += tx.amount;
        });

        // Calculate variances
        categoryMap.forEach(catData => {
            catData.variance = catData.estimatedCost - catData.actualCost;
            catData.variancePercent = catData.estimatedCost > 0
                ? ((catData.variance / catData.estimatedCost) * 100)
                : (catData.actualCost > 0 ? -100 : 0);
        });

        const categories = Array.from(categoryMap.values())
            .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));

        const totalEstimated = categories.reduce((sum, c) => sum + c.estimatedCost, 0);
        const totalActual = categories.reduce((sum, c) => sum + c.actualCost, 0);
        const totalVariance = totalEstimated - totalActual;
        const totalVariancePercent = totalEstimated > 0 ? (totalVariance / totalEstimated) * 100 : 0;

        // Identify problems
        const lossCategories = categories.filter(c => c.variance < 0);
        const biggestLoss = lossCategories.length > 0
            ? lossCategories.sort((a, b) => a.variance - b.variance)[0]
            : null;

        return {
            categories,
            totalEstimated,
            totalActual,
            totalVariance,
            totalVariancePercent,
            biggestLoss,
            isProfit: totalVariance >= 0
        };
    }, [project.rabItems, project.transactions]);

    const toggleCategory = (cat: string) => {
        setExpandedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    return (
        <div className="space-y-6">
            {/* Summary Card */}
            <div className={`p-6 rounded-3xl shadow-lg relative overflow-hidden ${analysis.isProfit
                ? 'bg-gradient-to-br from-emerald-600 to-emerald-800'
                : 'bg-gradient-to-br from-red-600 to-red-800'
                } text-white`}>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    {analysis.isProfit ? <TrendingUp size={100} /> : <TrendingDown size={100} />}
                </div>

                <h3 className="text-white/80 text-xs font-bold uppercase tracking-widest mb-4">
                    Analisa Margin Proyek
                </h3>

                <div className="grid grid-cols-3 gap-4 mb-4 relative z-10">
                    <div>
                        <p className="text-white/70 text-xs mb-1">Estimasi RAB</p>
                        <p className="text-lg font-bold">{formatRupiah(analysis.totalEstimated)}</p>
                    </div>
                    <div>
                        <p className="text-white/70 text-xs mb-1">Realisasi</p>
                        <p className="text-lg font-bold">{formatRupiah(analysis.totalActual)}</p>
                    </div>
                    <div>
                        <p className="text-white/70 text-xs mb-1">{analysis.isProfit ? 'Margin' : 'Kerugian'}</p>
                        <p className="text-2xl font-black flex items-center gap-2">
                            {analysis.isProfit ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                            {formatRupiah(Math.abs(analysis.totalVariance))}
                        </p>
                        <p className="text-xs text-white/60">
                            {analysis.totalVariancePercent >= 0 ? '+' : ''}{analysis.totalVariancePercent.toFixed(1)}%
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ${analysis.isProfit ? 'bg-green-400' : 'bg-red-400'}`}
                        style={{ width: `${Math.min(100, analysis.totalEstimated > 0 ? (analysis.totalActual / analysis.totalEstimated) * 100 : 0)}%` }}
                    />
                </div>
                <p className="text-xs text-white/60 mt-2 text-right">
                    {analysis.totalEstimated > 0 ? ((analysis.totalActual / analysis.totalEstimated) * 100).toFixed(1) : 0}% dari estimasi
                </p>
            </div>

            {/* Alert for biggest loss */}
            {analysis.biggestLoss && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <p className="font-bold text-red-700 text-sm">Perhatian: Kategori Boncos!</p>
                        <p className="text-xs text-red-600 mt-1">
                            <span className="font-bold">{analysis.biggestLoss.category}</span> melebihi budget sebesar{' '}
                            <span className="font-bold">{formatRupiah(Math.abs(analysis.biggestLoss.variance))}</span>
                        </p>
                    </div>
                </div>
            )}

            {/* Category Breakdown */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b">
                    <h4 className="font-bold text-slate-700 flex items-center gap-2">
                        <BarChart3 size={18} /> Breakdown per Kategori
                    </h4>
                </div>

                <div className="divide-y">
                    {analysis.categories.map(cat => {
                        const isExpanded = expandedCategories.includes(cat.category);
                        const isLoss = cat.variance < 0;
                        const hasNoRAB = cat.estimatedCost === 0 && cat.actualCost > 0;

                        return (
                            <div key={cat.category}>
                                <button
                                    onClick={() => toggleCategory(cat.category)}
                                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-slate-800 truncate">{cat.category}</span>
                                            {isLoss && (
                                                <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded font-bold">
                                                    BONCOS
                                                </span>
                                            )}
                                            {hasNoRAB && (
                                                <span className="bg-orange-100 text-orange-700 text-[10px] px-1.5 py-0.5 rounded font-bold">
                                                    TIDAK ADA DI RAB
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            Realisasi: {formatRupiah(cat.actualCost)} / Estimasi: {formatRupiah(cat.estimatedCost)}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className={`text-right ${isLoss ? 'text-red-600' : 'text-green-600'}`}>
                                            <div className="font-bold text-sm flex items-center gap-1 justify-end">
                                                {isLoss ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                                                {isLoss ? '-' : '+'}{formatRupiah(Math.abs(cat.variance))}
                                            </div>
                                            <div className="text-[10px]">
                                                {cat.variancePercent >= 0 ? '+' : ''}{cat.variancePercent.toFixed(1)}%
                                            </div>
                                        </div>
                                        {cat.itemNames.length > 0 && (
                                            isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />
                                        )}
                                    </div>
                                </button>

                                {/* Expanded Items - Just list of RAB items for reference */}
                                {isExpanded && cat.itemNames.length > 0 && (
                                    <div className="bg-slate-50 px-4 py-3 border-t">
                                        <p className="text-xs font-bold text-slate-500 mb-2">Item RAB dalam kategori ini:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {cat.itemNames.map((name, idx) => (
                                                <span key={idx} className="bg-white px-2 py-1 rounded border text-xs text-slate-600">
                                                    {name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {analysis.categories.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                        <BarChart3 size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Belum ada data RAB atau transaksi</p>
                    </div>
                )}
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                <p className="font-bold mb-1">💡 Tips:</p>
                <ul className="text-xs space-y-1 text-blue-600">
                    <li>• Pastikan kategori transaksi <b>match persis</b> dengan kategori RAB</li>
                    <li>• Kategori "TIDAK ADA DI RAB" = ada pengeluaran tapi tidak dibudgetkan</li>
                    <li>• Kategori "BONCOS" = pengeluaran melebihi estimasi RAB</li>
                </ul>
            </div>
        </div>
    );
};

export default ProfitAnalyzer;
