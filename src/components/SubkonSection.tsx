import React, { useState } from 'react';
import { Users, Plus, Phone, Calendar, DollarSign, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import type { Project, Subkon } from '../types';
import { formatRupiah } from '../utils/helpers';
import { NumberInput } from './UIComponents';

interface SubkonSectionProps {
    project: Project;
    onAddSubkon: (subkon: Omit<Subkon, 'id' | 'status' | 'payments' | 'progress'>) => void;
    onUpdateSubkon: (id: number, updates: Partial<Subkon>) => void;
    onAddPayment: (subkonId: number, amount: number, note: string) => void;
}

const SubkonSection: React.FC<SubkonSectionProps> = ({ project, onAddSubkon, onUpdateSubkon, onAddPayment }) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState<number | null>(null);

    // Form states
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [workDescription, setWorkDescription] = useState('');
    const [selectedRabItems, setSelectedRabItems] = useState<number[]>([]);
    const [totalValue, setTotalValue] = useState(0);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState('');
    const [notes, setNotes] = useState('');

    // Payment form
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentNote, setPaymentNote] = useState('');

    const subkons = project.subkons || [];

    const resetForm = () => {
        setName('');
        setPhone('');
        setWorkDescription('');
        setSelectedRabItems([]);
        setTotalValue(0);
        setStartDate(new Date().toISOString().split('T')[0]);
        setEndDate('');
        setNotes('');
    };

    const handleSubmit = () => {
        if (!name || !workDescription || totalValue <= 0) return;

        onAddSubkon({
            name,
            phone,
            workDescription,
            rabItemIds: selectedRabItems,
            totalValue,
            startDate,
            endDate: endDate || startDate,
            notes
        });

        resetForm();
        setShowAddModal(false);
    };

    const handlePayment = (subkonId: number) => {
        if (paymentAmount <= 0) return;
        onAddPayment(subkonId, paymentAmount, paymentNote);
        setPaymentAmount(0);
        setPaymentNote('');
        setShowPaymentModal(null);
    };

    const getTotalPaid = (subkon: Subkon) => subkon.payments.reduce((sum, p) => sum + p.amount, 0);
    const getRemaining = (subkon: Subkon) => subkon.totalValue - getTotalPaid(subkon);

    const getStatusBadge = (subkon: Subkon) => {
        if (subkon.status === 'completed') return <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold"><CheckCircle size={12} /> Selesai</span>;
        if (subkon.status === 'cancelled') return <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-bold"><AlertCircle size={12} /> Batal</span>;

        const today = new Date();
        const end = new Date(subkon.endDate);
        if (today > end) return <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse"><AlertCircle size={12} /> Terlambat</span>;

        return <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold"><Clock size={12} /> Berjalan</span>;
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <Users size={18} /> Subkontraktor ({subkons.length})
                </h3>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-purple-600 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-purple-700"
                >
                    <Plus size={14} /> Tambah Subkon
                </button>
            </div>

            {/* Summary Card */}
            {subkons.length > 0 && (
                <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white p-4 rounded-2xl">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-purple-200 text-[10px]">Total Nilai</p>
                            <p className="font-bold">{formatRupiah(subkons.reduce((s, sk) => s + sk.totalValue, 0))}</p>
                        </div>
                        <div>
                            <p className="text-purple-200 text-[10px]">Sudah Bayar</p>
                            <p className="font-bold text-green-300">{formatRupiah(subkons.reduce((s, sk) => s + getTotalPaid(sk), 0))}</p>
                        </div>
                        <div>
                            <p className="text-purple-200 text-[10px]">Sisa</p>
                            <p className="font-bold text-yellow-300">{formatRupiah(subkons.reduce((s, sk) => s + getRemaining(sk), 0))}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="space-y-3">
                {subkons.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed">
                        <Users className="mx-auto text-slate-300 mb-2" size={32} />
                        <p className="text-sm text-slate-400">Belum ada subkon</p>
                    </div>
                ) : (
                    subkons.map(subkon => {
                        const isExpanded = expandedId === subkon.id;
                        const paid = getTotalPaid(subkon);
                        const remaining = getRemaining(subkon);
                        const paidPercent = (paid / subkon.totalValue) * 100;

                        return (
                            <div key={subkon.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                                <button
                                    onClick={() => setExpandedId(isExpanded ? null : subkon.id)}
                                    className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-slate-800">{subkon.name}</span>
                                            {getStatusBadge(subkon)}
                                        </div>
                                        <p className="text-xs text-slate-500 truncate">{subkon.workDescription}</p>
                                        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                                            <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(subkon.startDate).toLocaleDateString('id-ID')}</span>
                                            {subkon.phone && <span className="flex items-center gap-1"><Phone size={10} /> {subkon.phone}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="font-bold text-slate-800">{formatRupiah(subkon.totalValue)}</p>
                                            <p className="text-[10px] text-slate-400">Dibayar: {paidPercent.toFixed(0)}%</p>
                                        </div>
                                        {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="border-t p-4 bg-slate-50 space-y-4">
                                        {/* Progress */}
                                        <div>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-slate-500">Progress Pekerjaan</span>
                                                <span className="font-bold">{subkon.progress}%</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="range"
                                                    min={0}
                                                    max={100}
                                                    value={subkon.progress}
                                                    onChange={e => onUpdateSubkon(subkon.id, { progress: Number(e.target.value) })}
                                                    className="flex-1"
                                                />
                                                {subkon.progress >= 100 && subkon.status === 'active' && (
                                                    <button
                                                        onClick={() => onUpdateSubkon(subkon.id, { status: 'completed' })}
                                                        className="bg-green-600 text-white px-2 py-1 rounded text-[10px] font-bold"
                                                    >
                                                        Selesaikan
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Payment Progress */}
                                        <div>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-slate-500">Pembayaran</span>
                                                <span className="font-bold">{formatRupiah(paid)} / {formatRupiah(subkon.totalValue)}</span>
                                            </div>
                                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                                <div className="bg-green-500 h-full" style={{ width: `${paidPercent}%` }} />
                                            </div>
                                            {remaining > 0 && (
                                                <p className="text-[10px] text-orange-600 mt-1">Sisa: {formatRupiah(remaining)}</p>
                                            )}
                                        </div>

                                        {/* Payment History */}
                                        {subkon.payments.length > 0 && (
                                            <div>
                                                <p className="text-xs font-bold text-slate-500 mb-2">Riwayat Pembayaran:</p>
                                                <div className="space-y-1">
                                                    {subkon.payments.map((p, idx) => (
                                                        <div key={idx} className="flex justify-between text-xs bg-white p-2 rounded border">
                                                            <span className="text-slate-500">{new Date(p.date).toLocaleDateString('id-ID')}</span>
                                                            <span className="font-bold text-green-600">+{formatRupiah(p.amount)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            {remaining > 0 && (
                                                <button
                                                    onClick={() => setShowPaymentModal(subkon.id)}
                                                    className="flex-1 bg-green-600 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                                                >
                                                    <DollarSign size={14} /> Bayar
                                                </button>
                                            )}
                                            {subkon.status === 'active' && (
                                                <button
                                                    onClick={() => onUpdateSubkon(subkon.id, { status: 'cancelled' })}
                                                    className="px-3 py-2 bg-red-100 text-red-600 rounded-xl text-xs font-bold"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="bg-purple-700 text-white p-4">
                            <h3 className="font-bold text-lg">Tambah Subkontraktor</h3>
                        </div>
                        <div className="p-4 space-y-4 overflow-y-auto flex-1">
                            <div>
                                <label className="text-xs font-bold text-slate-500">Nama Subkon/Mandor *</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full p-3 border rounded-xl"
                                    placeholder="Pak Budi"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500">No. HP</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    className="w-full p-3 border rounded-xl"
                                    placeholder="08xxx"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500">Deskripsi Pekerjaan *</label>
                                <textarea
                                    value={workDescription}
                                    onChange={e => setWorkDescription(e.target.value)}
                                    className="w-full p-3 border rounded-xl"
                                    rows={2}
                                    placeholder="Pekerjaan struktur lantai 1..."
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500">Nilai Borongan (Rp) *</label>
                                <NumberInput
                                    value={totalValue}
                                    onChange={setTotalValue}
                                    className="w-full p-3 border rounded-xl font-bold"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-500">Mulai</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        className="w-full p-3 border rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500">Selesai</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        className="w-full p-3 border rounded-xl"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500">Catatan</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full p-3 border rounded-xl"
                                    rows={2}
                                    placeholder="Catatan tambahan..."
                                />
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t flex gap-3">
                            <button onClick={() => { resetForm(); setShowAddModal(false); }} className="flex-1 py-3 rounded-xl font-bold text-slate-600">
                                Batal
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!name || !workDescription || totalValue <= 0}
                                className="flex-[2] py-3 bg-purple-600 text-white rounded-xl font-bold disabled:bg-slate-300"
                            >
                                Simpan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal !== null && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="bg-green-700 text-white p-4">
                            <h3 className="font-bold">Bayar Subkon</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500">Jumlah Pembayaran (Rp)</label>
                                <NumberInput
                                    value={paymentAmount}
                                    onChange={setPaymentAmount}
                                    className="w-full p-3 border rounded-xl font-bold text-lg"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500">Keterangan</label>
                                <input
                                    type="text"
                                    value={paymentNote}
                                    onChange={e => setPaymentNote(e.target.value)}
                                    className="w-full p-3 border rounded-xl"
                                    placeholder="DP / Progress 50% / dst"
                                />
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t flex gap-3">
                            <button onClick={() => setShowPaymentModal(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-600">
                                Batal
                            </button>
                            <button
                                onClick={() => handlePayment(showPaymentModal)}
                                disabled={paymentAmount <= 0}
                                className="flex-[2] py-3 bg-green-600 text-white rounded-xl font-bold disabled:bg-slate-300"
                            >
                                Bayar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubkonSection;
