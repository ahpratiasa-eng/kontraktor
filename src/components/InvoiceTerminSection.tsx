import React, { useState, useMemo } from 'react';
import { FileText, CheckCircle, Clock, AlertCircle, Plus, Download, Receipt } from 'lucide-react';
import type { Project, PaymentTerm } from '../types';
import { formatRupiah, getStats } from '../utils/helpers';
import { generateInvoice } from '../utils/invoiceGenerator';
import { NumberInput } from './UIComponents';

interface InvoiceTerminSectionProps {
    project: Project;
    updateProject: (data: Partial<Project>) => void;
}

// Default payment terms template
const DEFAULT_TERMS: Omit<PaymentTerm, 'id' | 'amount'>[] = [
    { name: 'DP (Down Payment)', percentage: 30, targetProgress: 0, status: 'pending' },
    { name: 'Termin 1', percentage: 30, targetProgress: 50, status: 'pending' },
    { name: 'Pelunasan', percentage: 40, targetProgress: 100, status: 'pending' },
];

const InvoiceTerminSection: React.FC<InvoiceTerminSectionProps> = ({ project, updateProject }) => {
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [contractValue, setContractValue] = useState(project.contractValue || project.budgetLimit || 0);
    const [editableTerms, setEditableTerms] = useState<Omit<PaymentTerm, 'id' | 'amount'>[]>(
        project.paymentTerms?.map(t => ({
            name: t.name,
            percentage: t.percentage,
            targetProgress: t.targetProgress,
            status: t.status
        })) || DEFAULT_TERMS
    );

    const stats = getStats(project);
    const currentProgress = stats.prog;

    // Calculate payment terms with amounts
    const paymentTerms = useMemo(() => {
        const terms = project.paymentTerms || [];
        return terms.map(term => ({
            ...term,
            amount: term.amount || (project.contractValue || project.budgetLimit || 0) * term.percentage / 100,
            // Determine if this term is now due based on progress
            isDue: currentProgress >= term.targetProgress && term.status === 'pending'
        }));
    }, [project.paymentTerms, project.contractValue, project.budgetLimit, currentProgress]);

    // Summary calculations
    const totalContract = project.contractValue || project.budgetLimit || 0;
    const totalPaid = paymentTerms.filter(t => t.status === 'paid').reduce((s, t) => s + (t.paidAmount || t.amount), 0);
    const totalPending = totalContract - totalPaid;

    // Setup payment terms
    const handleSetupTerms = () => {
        const newTerms: PaymentTerm[] = editableTerms.map((term, idx) => ({
            id: idx + 1,
            name: term.name,
            percentage: term.percentage,
            targetProgress: term.targetProgress,
            amount: contractValue * term.percentage / 100,
            status: term.status || 'pending'
        }));

        updateProject({
            contractValue: contractValue,
            paymentTerms: newTerms
        });
        setShowSetupModal(false);
    };

    // Generate invoice for a term
    const handleGenerateInvoice = (term: PaymentTerm) => {
        try {
            const invoiceNumber = generateInvoice(project, term);

            // Update term status
            const updatedTerms = (project.paymentTerms || []).map(t =>
                t.id === term.id
                    ? { ...t, status: 'invoiced' as const, invoiceNumber, invoiceDate: new Date().toISOString().split('T')[0] }
                    : t
            );
            updateProject({ paymentTerms: updatedTerms });
        } catch (error: any) {
            console.error("Invoice Error:", error);
            alert("Gagal memproses invoice: " + (error.message || "Terjadi kesalahan sistem"));
        }
    };

    // Mark as paid
    const handleMarkPaid = (term: PaymentTerm) => {
        const updatedTerms = (project.paymentTerms || []).map(t =>
            t.id === term.id
                ? { ...t, status: 'paid' as const, paidDate: new Date().toISOString().split('T')[0], paidAmount: t.amount }
                : t
        );
        updateProject({ paymentTerms: updatedTerms });
    };

    // Update editable term
    const updateEditableTerm = (index: number, field: string, value: any) => {
        const updated = [...editableTerms];
        updated[index] = { ...updated[index], [field]: value };
        setEditableTerms(updated);
    };

    // Add new term
    const addTerm = () => {
        setEditableTerms([...editableTerms, { name: `Termin ${editableTerms.length}`, percentage: 0, targetProgress: 0, status: 'pending' }]);
    };

    // Remove term
    const removeTerm = (index: number) => {
        setEditableTerms(editableTerms.filter((_, i) => i !== index));
    };

    // Get status badge
    const getStatusBadge = (term: PaymentTerm & { isDue?: boolean }) => {
        if (term.status === 'paid') {
            return <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded-full font-bold"><CheckCircle size={12} /> Lunas</span>;
        }
        if (term.status === 'invoiced') {
            return <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-[10px] px-2 py-1 rounded-full font-bold"><Receipt size={12} /> Sudah Invoice</span>;
        }
        if (term.isDue) {
            return <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-[10px] px-2 py-1 rounded-full font-bold animate-pulse"><AlertCircle size={12} /> Jatuh Tempo!</span>;
        }
        return <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 text-[10px] px-2 py-1 rounded-full font-bold"><Clock size={12} /> Menunggu</span>;
    };

    // Check if no terms set up
    const noTermsSetUp = !project.paymentTerms || project.paymentTerms.length === 0;

    return (
        <div className="max-w-2xl mx-auto w-full px-1 md:px-0">
            {/* Summary Card */}
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-5 md:p-6 rounded-3xl shadow-md mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Receipt size={100} />
                </div>
                <h3 className="text-emerald-100 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-4">Ringkasan Tagihan</h3>
                <div className="grid grid-cols-3 gap-4 mb-4 relative z-10">
                    <div>
                        <p className="text-[10px] md:text-xs text-emerald-200 mb-1">Nilai Kontrak</p>
                        <p className="text-sm md:text-lg font-bold">{formatRupiah(totalContract)}</p>
                    </div>
                    <div>
                        <p className="text-[10px] md:text-xs text-emerald-200 mb-1">Sudah Dibayar</p>
                        <p className="text-sm md:text-lg font-bold text-green-300">{formatRupiah(totalPaid)}</p>
                    </div>
                    <div>
                        <p className="text-[10px] md:text-xs text-emerald-200 mb-1">Sisa Tagihan</p>
                        <p className="text-sm md:text-lg font-bold text-yellow-300">{formatRupiah(totalPending)}</p>
                    </div>
                </div>
                <div className="w-full bg-emerald-900/50 h-2 rounded-full overflow-hidden">
                    <div
                        className="bg-green-400 h-full transition-all duration-500"
                        style={{ width: `${totalContract > 0 ? (totalPaid / totalContract) * 100 : 0}%` }}
                    />
                </div>
                <p className="text-[10px] text-emerald-200 mt-2 text-right">
                    {totalContract > 0 ? ((totalPaid / totalContract) * 100).toFixed(1) : 0}% terbayar
                </p>
            </div>

            {/* No Terms Setup */}
            {noTermsSetUp ? (
                <div className="bg-white p-8 rounded-3xl border shadow-sm text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Receipt size={32} className="text-slate-400" />
                    </div>
                    <h3 className="font-bold text-slate-800 mb-2">Belum Ada Termin</h3>
                    <p className="text-sm text-slate-500 mb-6">Atur termin pembayaran untuk proyek ini agar bisa generate invoice otomatis.</p>
                    <button
                        onClick={() => setShowSetupModal(true)}
                        className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition inline-flex items-center gap-2"
                    >
                        <Plus size={18} /> Setup Termin Pembayaran
                    </button>
                </div>
            ) : (
                <>
                    {/* Action Bar */}
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-700">Daftar Termin</h3>
                        <button
                            onClick={() => setShowSetupModal(true)}
                            className="text-xs text-blue-600 font-bold hover:underline"
                        >
                            Edit Termin
                        </button>
                    </div>

                    {/* Terms List */}
                    <div className="space-y-4">
                        {paymentTerms.map((term) => (
                            <div
                                key={term.id}
                                className={`bg-white p-5 rounded-2xl border shadow-sm transition-all ${term.isDue ? 'border-orange-300 ring-2 ring-orange-100' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="font-bold text-slate-800">{term.name}</h4>
                                        <p className="text-xs text-slate-400">Target Progress: {term.targetProgress}%</p>
                                    </div>
                                    {getStatusBadge(term)}
                                </div>

                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <span className="text-2xl font-black text-slate-800">{formatRupiah(term.amount)}</span>
                                        <span className="text-xs text-slate-400 ml-2">({term.percentage}%)</span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-4">
                                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                        <span>Progress Proyek</span>
                                        <span>{currentProgress.toFixed(1)}% / {term.targetProgress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${currentProgress >= term.targetProgress ? 'bg-green-500' : 'bg-blue-500'}`}
                                            style={{ width: `${Math.min(100, (currentProgress / term.targetProgress) * 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    {term.status === 'pending' && (
                                        <button
                                            onClick={() => handleGenerateInvoice(term)}
                                            disabled={currentProgress < term.targetProgress && term.targetProgress > 0}
                                            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${currentProgress >= term.targetProgress || term.targetProgress === 0
                                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                }`}
                                        >
                                            <FileText size={16} /> Generate Invoice
                                        </button>
                                    )}
                                    {term.status === 'invoiced' && (
                                        <>
                                            <button
                                                onClick={() => generateInvoice(project, term)}
                                                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center gap-2"
                                            >
                                                <Download size={16} /> Download Ulang
                                            </button>
                                            <button
                                                onClick={() => handleMarkPaid(term)}
                                                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-sm bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle size={16} /> Tandai Lunas
                                            </button>
                                        </>
                                    )}
                                    {term.status === 'paid' && term.paidDate && (
                                        <div className="flex-1 py-2.5 px-4 rounded-xl bg-green-50 text-green-700 text-sm text-center">
                                            ✓ Dibayar {new Date(term.paidDate).toLocaleDateString('id-ID')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Setup Modal */}
            {showSetupModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="bg-emerald-700 text-white p-5">
                            <h3 className="font-bold text-lg">Setup Termin Pembayaran</h3>
                            <p className="text-emerald-100 text-sm mt-1">Atur nilai kontrak dan pembagian termin</p>
                        </div>
                        <div className="p-5 space-y-4 overflow-y-auto flex-1">
                            {/* Contract Value */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nilai Kontrak</label>
                                <NumberInput
                                    value={contractValue}
                                    onChange={setContractValue}
                                    placeholder="Nilai Kontrak"
                                    className="w-full p-3 border border-slate-200 rounded-xl"
                                />
                                <p className="text-xs text-slate-400 mt-1">Total nilai proyek yang disepakati dengan klien</p>
                            </div>

                            {/* Terms List */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Pembagian Termin</label>
                                <div className="space-y-3">
                                    {editableTerms.map((term, idx) => (
                                        <div key={idx} className="flex gap-2 items-center bg-slate-50 p-3 rounded-xl">
                                            <input
                                                type="text"
                                                value={term.name}
                                                onChange={(e) => updateEditableTerm(idx, 'name', e.target.value)}
                                                className="flex-1 p-2 border rounded-lg text-sm"
                                                placeholder="Nama Termin"
                                            />
                                            <div className="w-20">
                                                <input
                                                    type="number"
                                                    value={term.percentage}
                                                    onChange={(e) => updateEditableTerm(idx, 'percentage', Number(e.target.value))}
                                                    className="w-full p-2 border rounded-lg text-sm text-center"
                                                    placeholder="%"
                                                />
                                            </div>
                                            <div className="w-20">
                                                <input
                                                    type="number"
                                                    value={term.targetProgress}
                                                    onChange={(e) => updateEditableTerm(idx, 'targetProgress', Number(e.target.value))}
                                                    className="w-full p-2 border rounded-lg text-sm text-center"
                                                    placeholder="Target %"
                                                />
                                            </div>
                                            {editableTerms.length > 1 && (
                                                <button
                                                    onClick={() => removeTerm(idx)}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={addTerm}
                                    className="mt-2 text-sm text-blue-600 font-bold hover:underline flex items-center gap-1"
                                >
                                    <Plus size={14} /> Tambah Termin
                                </button>
                                <div className="mt-3 p-3 bg-slate-100 rounded-xl">
                                    <div className="flex justify-between text-sm">
                                        <span>Total Persentase:</span>
                                        <span className={`font-bold ${editableTerms.reduce((s, t) => s + t.percentage, 0) === 100 ? 'text-green-600' : 'text-red-600'}`}>
                                            {editableTerms.reduce((s, t) => s + t.percentage, 0)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t flex gap-3">
                            <button
                                onClick={() => setShowSetupModal(false)}
                                className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSetupTerms}
                                disabled={editableTerms.reduce((s, t) => s + t.percentage, 0) !== 100}
                                className={`flex-[2] py-3 px-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 ${editableTerms.reduce((s, t) => s + t.percentage, 0) === 100
                                    ? 'bg-emerald-600 hover:bg-emerald-700'
                                    : 'bg-slate-300 cursor-not-allowed'
                                    }`}
                            >
                                <CheckCircle size={18} /> Simpan Termin
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoiceTerminSection;
