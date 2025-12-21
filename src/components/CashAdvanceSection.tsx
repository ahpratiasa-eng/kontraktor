import React, { useState } from 'react';
import { Wallet, Plus, AlertTriangle, CheckCircle, Clock, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { Project, Worker, CashAdvance } from '../types';
import { formatRupiah } from '../utils/helpers';

const DEFAULT_CASH_ADVANCE_LIMIT = 1000000; // Rp 1.000.000

interface CashAdvanceSectionProps {
    project: Project;
    onAddCashAdvance: (workerId: number, amount: number, description: string) => void;
    onPayCashAdvance: (cashAdvanceId: number, amount: number) => void;
}

const CashAdvanceSection: React.FC<CashAdvanceSectionProps> = ({
    project,
    onAddCashAdvance,
    onPayCashAdvance
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showPayModal, setShowPayModal] = useState(false);
    const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);
    const [selectedCashAdvance, setSelectedCashAdvance] = useState<CashAdvance | null>(null);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [payAmount, setPayAmount] = useState('');
    const [error, setError] = useState('');

    const workers = project.workers || [];
    const cashAdvances = project.cashAdvances || [];

    // Calculate totals
    const activeCashAdvances = cashAdvances.filter(ca => ca.status !== 'paid');
    const totalActiveKasbon = activeCashAdvances.reduce((sum, ca) => sum + ca.remainingAmount, 0);
    const workersWithKasbon = [...new Set(activeCashAdvances.map(ca => ca.workerId))].length;

    // Get worker's current kasbon balance
    const getWorkerKasbonBalance = (workerId: number) => {
        return cashAdvances
            .filter(ca => ca.workerId === workerId && ca.status !== 'paid')
            .reduce((sum, ca) => sum + ca.remainingAmount, 0);
    };

    // Get worker's kasbon limit
    const getWorkerLimit = (worker: Worker) => {
        return worker.cashAdvanceLimit ?? DEFAULT_CASH_ADVANCE_LIMIT;
    };

    // Validate and add kasbon
    const handleAddKasbon = () => {
        if (!selectedWorkerId) {
            setError('Pilih tukang terlebih dahulu');
            return;
        }
        const amountNum = parseInt(amount.replace(/\D/g, ''), 10);
        if (!amountNum || amountNum <= 0) {
            setError('Masukkan jumlah kasbon yang valid');
            return;
        }
        const worker = workers.find(w => w.id === selectedWorkerId);
        if (!worker) return;

        const currentBalance = getWorkerKasbonBalance(selectedWorkerId);
        const limit = getWorkerLimit(worker);

        if (currentBalance + amountNum > limit) {
            setError(`Melebihi limit kasbon! Sisa limit: ${formatRupiah(limit - currentBalance)}`);
            return;
        }

        onAddCashAdvance(selectedWorkerId, amountNum, description || 'Kasbon');
        resetForm();
    };

    // Pay kasbon
    const handlePayKasbon = () => {
        if (!selectedCashAdvance) return;
        const payAmountNum = parseInt(payAmount.replace(/\D/g, ''), 10);
        if (!payAmountNum || payAmountNum <= 0) {
            setError('Masukkan jumlah bayar yang valid');
            return;
        }
        if (payAmountNum > selectedCashAdvance.remainingAmount) {
            setError(`Jumlah melebihi sisa kasbon (${formatRupiah(selectedCashAdvance.remainingAmount)})`);
            return;
        }
        onPayCashAdvance(selectedCashAdvance.id, payAmountNum);
        resetPayForm();
    };

    const resetForm = () => {
        setShowAddModal(false);
        setSelectedWorkerId(null);
        setAmount('');
        setDescription('');
        setError('');
    };

    const resetPayForm = () => {
        setShowPayModal(false);
        setSelectedCashAdvance(null);
        setPayAmount('');
        setError('');
    };

    const openPayModal = (ca: CashAdvance) => {
        setSelectedCashAdvance(ca);
        setPayAmount(ca.remainingAmount.toString());
        setShowPayModal(true);
    };

    const getStatusBadge = (status: CashAdvance['status']) => {
        switch (status) {
            case 'paid':
                return <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full flex items-center gap-1"><CheckCircle size={10} /> Lunas</span>;
            case 'partial':
                return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full flex items-center gap-1"><Clock size={10} /> Sebagian</span>;
            default:
                return <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full flex items-center gap-1"><AlertTriangle size={10} /> Belum Bayar</span>;
        }
    };

    return (
        <div className="mt-6">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 rounded-2xl shadow-md hover:shadow-lg transition-all"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Wallet size={20} />
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-lg">Kasbon Tukang</h3>
                        <p className="text-white/80 text-xs">
                            {workersWithKasbon} tukang · Total {formatRupiah(totalActiveKasbon)}
                        </p>
                    </div>
                </div>
                {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>

            {/* Content */}
            {isExpanded && (
                <div className="mt-4 space-y-4">
                    {/* Add Button */}
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-orange-300 text-orange-600 rounded-xl hover:bg-orange-50 transition font-bold"
                    >
                        <Plus size={18} />
                        Tambah Kasbon Baru
                    </button>

                    {/* Active Kasbon List */}
                    {activeCashAdvances.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <Wallet size={40} className="mx-auto mb-2 opacity-50" />
                            <p>Belum ada kasbon aktif</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activeCashAdvances.map(ca => {
                                const worker = workers.find(w => w.id === ca.workerId);
                                const paidAmount = ca.amount - ca.remainingAmount;
                                const progress = (paidAmount / ca.amount) * 100;

                                return (
                                    <div key={ca.id} className="bg-white border rounded-2xl p-4 shadow-sm">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="font-bold text-slate-800">{worker?.name || 'Unknown'}</p>
                                                <p className="text-xs text-slate-500">{ca.description}</p>
                                                <p className="text-[10px] text-slate-400">{new Date(ca.date).toLocaleDateString('id-ID')}</p>
                                            </div>
                                            {getStatusBadge(ca.status)}
                                        </div>

                                        {/* Progress bar */}
                                        <div className="mb-3">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-slate-500">Terbayar: {formatRupiah(paidAmount)}</span>
                                                <span className="font-bold text-slate-700">Sisa: {formatRupiah(ca.remainingAmount)}</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-1 text-right">Total: {formatRupiah(ca.amount)}</p>
                                        </div>

                                        {/* Pay button */}
                                        <button
                                            onClick={() => openPayModal(ca)}
                                            className="w-full py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 active:scale-[0.98] transition"
                                        >
                                            Potong Kasbon
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Add Kasbon Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-800">Tambah Kasbon</h3>
                            <button onClick={resetForm} className="p-2 hover:bg-slate-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
                                <AlertTriangle size={16} />
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Worker Selection */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Pilih Tukang</label>
                                <select
                                    value={selectedWorkerId || ''}
                                    onChange={(e) => {
                                        setSelectedWorkerId(parseInt(e.target.value, 10));
                                        setError('');
                                    }}
                                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                >
                                    <option value="">-- Pilih Tukang --</option>
                                    {workers.map(w => {
                                        const balance = getWorkerKasbonBalance(w.id);
                                        const limit = getWorkerLimit(w);
                                        const remaining = limit - balance;
                                        return (
                                            <option key={w.id} value={w.id}>
                                                {w.name} ({w.role}) - Sisa limit: {formatRupiah(remaining)}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Jumlah Kasbon</label>
                                <input
                                    type="text"
                                    value={amount}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        setAmount(val ? parseInt(val, 10).toLocaleString('id-ID') : '');
                                        setError('');
                                    }}
                                    placeholder="Contoh: 500.000"
                                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Keterangan (Opsional)</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Contoh: Untuk keperluan keluarga"
                                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={resetForm}
                                className="flex-1 py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleAddKasbon}
                                className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 active:scale-[0.98] transition"
                            >
                                Simpan Kasbon
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pay Kasbon Modal */}
            {showPayModal && selectedCashAdvance && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-800">Potong Kasbon</h3>
                            <button onClick={resetPayForm} className="p-2 hover:bg-slate-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl mb-4">
                            <p className="text-sm text-slate-500">Sisa Kasbon</p>
                            <p className="text-2xl font-black text-slate-800">{formatRupiah(selectedCashAdvance.remainingAmount)}</p>
                            <p className="text-xs text-slate-400">{selectedCashAdvance.description}</p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
                                <AlertTriangle size={16} />
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Jumlah Potongan</label>
                            <input
                                type="text"
                                value={payAmount}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    setPayAmount(val ? parseInt(val, 10).toLocaleString('id-ID') : '');
                                    setError('');
                                }}
                                placeholder="Masukkan jumlah"
                                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                            <button
                                onClick={() => setPayAmount(selectedCashAdvance.remainingAmount.toLocaleString('id-ID'))}
                                className="mt-2 text-xs text-green-600 font-bold hover:underline"
                            >
                                Lunas sekaligus ({formatRupiah(selectedCashAdvance.remainingAmount)})
                            </button>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={resetPayForm}
                                className="flex-1 py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handlePayKasbon}
                                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 active:scale-[0.98] transition"
                            >
                                Potong Kasbon
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CashAdvanceSection;
