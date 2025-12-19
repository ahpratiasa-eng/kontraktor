import React, { useState, useMemo } from 'react';
import { FileText, CheckCircle, Clock, AlertCircle, Plus, Download, Receipt, Trash2 } from 'lucide-react';
import type { Project, PaymentTerm } from '../types';
import { formatRupiah, getStats } from '../utils/helpers';
import { generateInvoice } from '../utils/invoiceGenerator';
import { NumberInput } from './UIComponents';

interface InvoiceTerminSectionProps {
    project: Project;
    updateProject: (data: Partial<Project>) => void;
}

// Default payment terms template
const DEFAULT_TERMS: Omit<PaymentTerm, 'id'>[] = [
    { name: 'DP (Down Payment)', percentage: 30, targetProgress: 0, status: 'pending', type: 'main', amount: 0 },
    { name: 'Termin 1', percentage: 30, targetProgress: 50, status: 'pending', type: 'main', amount: 0 },
    { name: 'Pelunasan', percentage: 40, targetProgress: 100, status: 'pending', type: 'main', amount: 0 },
];

const InvoiceTerminSection: React.FC<InvoiceTerminSectionProps> = ({ project, updateProject }) => {
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [contractValue, setContractValue] = useState(project.contractValue || project.budgetLimit || 0);

    // Initial State for Modal
    const [editableTerms, setEditableTerms] = useState<Omit<PaymentTerm, 'id'>[]>([]);

    const stats = getStats(project);
    const currentProgress = stats.prog;

    // Open Modal Handlers
    const handleOpenSetup = () => {
        let termsToEdit: Omit<PaymentTerm, 'id'>[] = [];

        if (project.paymentTerms && project.paymentTerms.length > 0) {
            termsToEdit = project.paymentTerms.map(t => {
                const { id, ...rest } = t;
                return {
                    ...rest,
                    type: t.type || 'main',
                    amount: t.amount || 0
                };
            });
        } else {
            termsToEdit = DEFAULT_TERMS;
        }

        setEditableTerms(termsToEdit);
        setShowSetupModal(true);
    };

    // Calculate details for display (Main View)
    const { paymentTerms, totalContract, totalPaid, totalPending } = useMemo(() => {
        const terms = project.paymentTerms || [];
        const baseContractValue = project.contractValue || project.budgetLimit || 0;

        const processedTerms = terms.map(term => {
            const isAddendum = term.type === 'addendum';
            const amount = isAddendum ? (term.amount || 0) : (baseContractValue * term.percentage / 100);

            return {
                ...term,
                amount,
                isDue: (currentProgress >= (term.targetProgress - 0.1) || term.targetProgress === 0) && term.status === 'pending'
            };
        });

        const calculatedTotalContract = processedTerms.reduce((sum, t) => sum + t.amount, 0);
        // Note: For total contract, we might want to stick to the base contract value + addendums
        // But for "Tagihan", summation is correct.

        const paid = processedTerms.filter(t => t.status === 'paid').reduce((s, t) => s + (t.paidAmount || t.amount), 0);
        const pending = calculatedTotalContract - paid;

        return {
            paymentTerms: processedTerms,
            totalContract: calculatedTotalContract,
            totalPaid: paid,
            totalPending: pending
        };
    }, [project.paymentTerms, project.contractValue, project.budgetLimit, currentProgress]);


    // --- Setup Modal Logic ---

    // Derived state for modal
    const mainTerms = editableTerms.filter(t => t.type !== 'addendum');
    // const addendumTerms = editableTerms.filter(t => t.type === 'addendum'); // Unused
    const totalPercentage = mainTerms.reduce((s, t) => s + t.percentage, 0);

    const updateEditableTerm = (index: number, field: string, value: any) => {
        const updated = [...editableTerms];
        updated[index] = { ...updated[index], [field]: value };
        setEditableTerms(updated);
    };

    const addMainTerm = () => {
        setEditableTerms([...editableTerms, { name: `Termin ${mainTerms.length + 1}`, percentage: 0, targetProgress: 0, status: 'pending', type: 'main', amount: 0 }]);
    };

    const addAddendumTerm = () => {
        setEditableTerms([...editableTerms, { name: 'Pekerjaan Tambah', percentage: 0, targetProgress: 0, amount: 0, status: 'pending', type: 'addendum' }]);
    };

    const removeTerm = (index: number) => {
        setEditableTerms(editableTerms.filter((_, i) => i !== index));
    };

    const handleSetupTerms = () => {
        const newTerms: PaymentTerm[] = editableTerms.map((term, idx) => ({
            ...term, // Spread existing properties to preserve invoiceNumber, paidDate, etc.
            id: idx + 1,
            amount: term.type === 'addendum' ? (term.amount || 0) : (contractValue * term.percentage / 100),
            // Ensure essential fields are set/updated
            name: term.name,
            percentage: term.percentage,
            targetProgress: term.targetProgress,
            status: term.status || 'pending',
            type: term.type || 'main'
        }));

        updateProject({
            contractValue: contractValue,
            paymentTerms: newTerms
        });
        setShowSetupModal(false);
    };

    // --- Actions ---

    const handleGenerateInvoice = (term: PaymentTerm) => {
        try {
            const invoiceNumber = generateInvoice(project, term);
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

    const handleMarkPaid = (term: PaymentTerm) => {
        const updatedTerms = (project.paymentTerms || []).map(t =>
            t.id === term.id
                ? { ...t, status: 'paid' as const, paidDate: new Date().toISOString().split('T')[0], paidAmount: t.amount }
                : t
        );
        updateProject({ paymentTerms: updatedTerms });
    };




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
                        <p className="text-[10px] md:text-xs text-emerald-200 mb-1">Total Nilai Proyek</p>
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
                        onClick={handleOpenSetup}
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
                            onClick={handleOpenSetup}
                            className="text-xs text-blue-600 font-bold hover:underline"
                        >
                            Edit Termin / Addendum
                        </button>
                    </div>

                    {/* Terms List - Grouped */}
                    <div className="space-y-6">
                        {/* Main Terms */}
                        <div className="space-y-4">
                            {paymentTerms.filter(t => t.type !== 'addendum').map((term) => (
                                <PaymentTermCard
                                    key={term.id}
                                    term={term}
                                    currentProgress={currentProgress}
                                    onGenerateInvoice={handleGenerateInvoice}
                                    onMarkPaid={handleMarkPaid}
                                    onDownloadInvoice={(t) => generateInvoice(project, t)}
                                />
                            ))}
                        </div>

                        {/* Addendum Terms */}
                        {paymentTerms.some(t => t.type === 'addendum') && (
                            <div className="pt-4 border-t-2 border-dashed border-slate-200">
                                <h4 className="font-bold text-slate-500 text-xs uppercase tracking-wider mb-3">Addendum / Tambah Kurang</h4>
                                <div className="space-y-4">
                                    {paymentTerms.filter(t => t.type === 'addendum').map((term) => (
                                        <PaymentTermCard
                                            key={term.id}
                                            term={term}
                                            currentProgress={currentProgress}
                                            onGenerateInvoice={handleGenerateInvoice}
                                            onMarkPaid={handleMarkPaid}
                                            onDownloadInvoice={(t) => generateInvoice(project, t)}
                                            isAddendum
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Setup Modal */}
            {showSetupModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="bg-emerald-700 text-white p-5">
                            <h3 className="font-bold text-lg">Setup Termin & Addendum</h3>
                            <p className="text-emerald-100 text-sm mt-1">Atur nilai kontrak utama dan pekerjaan tambahan</p>
                        </div>
                        <div className="p-5 space-y-6 overflow-y-auto flex-1">
                            {/* Contract Value */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Nilai Kontrak Utama</label>
                                <NumberInput
                                    value={contractValue}
                                    onChange={setContractValue}
                                    placeholder="Nilai Kontrak"
                                    className="w-full p-3 border border-slate-200 rounded-xl font-bold text-lg text-slate-800"
                                />
                                <p className="text-xs text-slate-400 mt-1">Nilai dasar kontrak sebelum addendum.</p>
                            </div>

                            {/* Main Terms List */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-bold text-slate-700">Termin Utama (Berdasarkan %)</label>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${totalPercentage === 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        Total: {totalPercentage}%
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {editableTerms.map((term, idx) => {
                                        if (term.type === 'addendum') return null;
                                        return (
                                            <div key={idx} className="flex gap-2 items-center bg-white border border-slate-200 p-2 rounded-xl">
                                                <input
                                                    type="text"
                                                    value={term.name}
                                                    onChange={(e) => updateEditableTerm(idx, 'name', e.target.value)}
                                                    className="flex-1 p-2 border rounded-lg text-sm"
                                                    placeholder="Nama Termin"
                                                />
                                                <div className="w-20 relative">
                                                    <input
                                                        type="number"
                                                        value={term.percentage}
                                                        onChange={(e) => updateEditableTerm(idx, 'percentage', Number(e.target.value))}
                                                        className="w-full p-2 border rounded-lg text-sm text-center"
                                                        placeholder="%"
                                                    />
                                                    <span className="absolute right-6 top-2 text-slate-400 text-xs">%</span>
                                                </div>
                                                <div className="w-20 relative">
                                                    <input
                                                        type="number"
                                                        value={term.targetProgress}
                                                        onChange={(e) => updateEditableTerm(idx, 'targetProgress', Number(e.target.value))}
                                                        className="w-full p-2 border rounded-lg text-sm text-center"
                                                        placeholder="Prog"
                                                    />
                                                </div>
                                                <button onClick={() => removeTerm(idx)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                                            </div>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={addMainTerm}
                                    className="mt-2 text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                                >
                                    <Plus size={14} /> Tambah Termin Utama
                                </button>
                            </div>

                            <hr className="border-slate-200" />

                            {/* Addendum List */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Addendum / Tambah Kurang (Nominal)</label>
                                <div className="space-y-3">
                                    {editableTerms.map((term, idx) => {
                                        if (term.type !== 'addendum') return null;
                                        return (
                                            <div key={idx} className="flex gap-2 items-center bg-blue-50 border border-blue-100 p-2 rounded-xl">
                                                <div className="flex-1 space-y-1">
                                                    <input
                                                        type="text"
                                                        value={term.name}
                                                        onChange={(e) => updateEditableTerm(idx, 'name', e.target.value)}
                                                        className="w-full p-2 border rounded-lg text-sm"
                                                        placeholder="Nama Pekerjaan Tambah/Kurang"
                                                    />
                                                    <NumberInput
                                                        value={term.amount || 0}
                                                        onChange={(val) => updateEditableTerm(idx, 'amount', val)}
                                                        className="w-full p-2 border rounded-lg text-sm font-bold text-slate-700"
                                                        placeholder="Nominal (Rp)"
                                                    />
                                                </div>
                                                <button onClick={() => removeTerm(idx)} className="text-red-400 hover:text-red-600 p-1 self-start mt-2"><Trash2 size={16} /></button>
                                            </div>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={addAddendumTerm}
                                    className="mt-2 text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                                >
                                    <Plus size={14} /> Tambah Item Addendum
                                </button>
                                <p className="text-[10px] text-slate-500 mt-2">* Gunakan nilai negatif untuk pekerjaan kurang (potongan).</p>
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
                                disabled={totalPercentage !== 100}
                                className={`flex-[2] py-3 px-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 ${totalPercentage === 100
                                    ? 'bg-emerald-600 hover:bg-emerald-700'
                                    : 'bg-slate-300 cursor-not-allowed'
                                    }`}
                            >
                                <CheckCircle size={18} /> Simpan Semua
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Sub-component for Term Card to keep code clean
const PaymentTermCard: React.FC<{
    term: PaymentTerm & { isDue?: boolean, amount: number };
    currentProgress: number;
    onGenerateInvoice: (t: PaymentTerm) => void;
    onMarkPaid: (t: PaymentTerm) => void;
    onDownloadInvoice: (t: PaymentTerm) => void;
    isAddendum?: boolean;
}> = ({ term, currentProgress, onGenerateInvoice, onMarkPaid, onDownloadInvoice, isAddendum }) => {

    const getStatusBadge = () => {
        if (term.status === 'paid') return <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded-full font-bold"><CheckCircle size={12} /> Lunas</span>;
        if (term.status === 'invoiced') return <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-[10px] px-2 py-1 rounded-full font-bold"><Receipt size={12} /> Sudah Invoice</span>;
        if (term.isDue && !isAddendum) return <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-[10px] px-2 py-1 rounded-full font-bold animate-pulse"><AlertCircle size={12} /> Jatuh Tempo!</span>;
        return <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 text-[10px] px-2 py-1 rounded-full font-bold"><Clock size={12} /> Menunggu</span>;
    };

    return (
        <div className={`bg-white p-5 rounded-2xl border shadow-sm transition-all ${term.isDue && !isAddendum ? 'border-orange-300 ring-2 ring-orange-100' : ''} ${isAddendum ? 'border-l-4 border-l-blue-400' : ''}`}>
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        {term.name}
                        {isAddendum && <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-normal">Addendum</span>}
                    </h4>
                    {!isAddendum && <p className="text-xs text-slate-400">Target Progress: {term.targetProgress}%</p>}
                </div>
                {getStatusBadge()}
            </div>

            <div className="flex justify-between items-center mb-4">
                <div>
                    <span className={`text-2xl font-black ${term.amount < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                        {formatRupiah(term.amount)}
                    </span>
                    {!isAddendum && <span className="text-xs text-slate-400 ml-2">({term.percentage}%)</span>}
                </div>
            </div>

            {/* Progress Bar for Main Terms Only */}
            {!isAddendum && (
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
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
                {term.status === 'pending' && (
                    <button
                        onClick={() => onGenerateInvoice(term)}
                        // Main terms need progress validation, Addendums are free to invoice anytime
                        disabled={!isAddendum && (currentProgress < (term.targetProgress - 0.1) && term.targetProgress > 0)}
                        className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${isAddendum || (currentProgress >= (term.targetProgress - 0.1) || term.targetProgress === 0)
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
                            onClick={() => onDownloadInvoice(term)}
                            className="flex-1 py-2.5 px-4 rounded-xl font-bold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center gap-2"
                        >
                            <Download size={16} /> Download
                        </button>
                        <button
                            onClick={() => onMarkPaid(term)}
                            className="flex-1 py-2.5 px-4 rounded-xl font-bold text-sm bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-2"
                        >
                            <CheckCircle size={16} /> Mark Lunas
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
    );
};

export default InvoiceTerminSection;
