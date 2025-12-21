import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, Send, ThumbsUp, ThumbsDown } from 'lucide-react';
import type { Project } from '../types';
import { formatRupiah } from '../utils/helpers';

interface ClientApprovalProps {
    project: Project;
    onApprove?: (type: string, itemId: string | number, note: string) => void;
    onReject?: (type: string, itemId: string | number, reason: string) => void;
    isClientView?: boolean;
}

interface ApprovalItem {
    id: string;
    type: 'progress' | 'invoice' | 'change_order';
    title: string;
    description: string;
    value?: number;
    date: string;
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
}

const ClientApproval: React.FC<ClientApprovalProps> = ({ project, onApprove, onReject, isClientView = false }) => {
    const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
    const [note, setNote] = useState('');
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);

    // Generate pending approvals from project data
    const pendingApprovals: ApprovalItem[] = [];

    // Progress updates that haven't been confirmed
    const progressLogs = project.tasks?.flatMap(t =>
        project.taskLogs?.filter(log => log.taskId === t.id).map(log => ({
            id: `progress-${log.id}`,
            type: 'progress' as const,
            title: `Progress: ${t.name}`,
            description: `Progress diperbarui menjadi ${log.newProgress}%`,
            date: log.date,
            status: 'pending' as const
        })) || []
    ) || [];

    // Invoice submissions pending approval
    const invoiceItems = project.paymentTerms?.filter(t => t.status === 'invoiced').map(term => ({
        id: `invoice-${term.id}`,
        type: 'invoice' as const,
        title: `Invoice Termin ${term.percentage}%`,
        description: `Pembayaran untuk progress ${term.percentage}%`,
        value: (project.contractValue || project.budgetLimit || 0) * term.percentage / 100,
        date: term.invoiceDate || new Date().toISOString().split('T')[0],
        status: 'pending' as const
    })) || [];

    pendingApprovals.push(...progressLogs);
    pendingApprovals.push(...invoiceItems);

    const handleApprove = (item: ApprovalItem) => {
        if (onApprove) {
            onApprove(item.type, item.id, note);
            setNote('');
            setSelectedItem(null);
        }
    };

    const handleReject = (item: ApprovalItem) => {
        if (onReject && rejectReason) {
            onReject(item.type, item.id, rejectReason);
            setRejectReason('');
            setShowRejectModal(false);
            setSelectedItem(null);
        }
    };

    const getStatusBadge = (status: string) => {
        if (status === 'approved') return <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><CheckCircle size={10} /> Disetujui</span>;
        if (status === 'rejected') return <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><XCircle size={10} /> Ditolak</span>;
        return <span className="bg-yellow-100 text-yellow-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Clock size={10} /> Menunggu</span>;
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <CheckCircle size={18} /> Approval Klien
                </h3>
                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">
                    {pendingApprovals.filter(a => a.status === 'pending').length} Menunggu
                </span>
            </div>

            {/* Info for project owner (not client) */}
            {!isClientView && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                    <p className="font-bold mb-1">💡 Cara Kerja Approval:</p>
                    <ul className="text-xs space-y-1 text-blue-600">
                        <li>• Kirim link proyek ke klien untuk approval</li>
                        <li>• Klien bisa setujui atau tolak progress/invoice</li>
                        <li>• Notifikasi masuk saat ada aksi dari klien</li>
                    </ul>
                </div>
            )}

            {/* Pending Approvals List */}
            {pendingApprovals.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed">
                    <CheckCircle className="mx-auto text-green-300 mb-2" size={32} />
                    <p className="text-sm text-slate-400">Semua item sudah disetujui</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {pendingApprovals.map(item => (
                        <div key={item.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                            <div className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-slate-800">{item.title}</span>
                                            {getStatusBadge(item.status)}
                                        </div>
                                        <p className="text-xs text-slate-500">{item.description}</p>
                                        {item.value && (
                                            <p className="text-sm font-bold text-emerald-600 mt-1">{formatRupiah(item.value)}</p>
                                        )}
                                        <p className="text-[10px] text-slate-400 mt-1">{new Date(item.date).toLocaleDateString('id-ID')}</p>
                                    </div>
                                </div>

                                {/* Actions for client */}
                                {isClientView && item.status === 'pending' && (
                                    <div className="flex gap-2 mt-4 pt-4 border-t">
                                        <button
                                            onClick={() => handleApprove(item)}
                                            className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                                        >
                                            <ThumbsUp size={14} /> Setuju
                                        </button>
                                        <button
                                            onClick={() => { setSelectedItem(item); setShowRejectModal(true); }}
                                            className="flex-1 bg-red-100 text-red-600 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                                        >
                                            <ThumbsDown size={14} /> Tolak
                                        </button>
                                    </div>
                                )}

                                {/* Rejection reason */}
                                {item.status === 'rejected' && item.rejectionReason && (
                                    <div className="mt-3 p-3 bg-red-50 rounded-xl">
                                        <p className="text-xs text-red-600"><strong>Alasan penolakan:</strong> {item.rejectionReason}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Request Approval Button (for project owner) */}
            {!isClientView && pendingApprovals.length > 0 && (
                <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
                    <Send size={18} /> Kirim Reminder ke Klien
                </button>
            )}

            {/* Reject Modal */}
            {showRejectModal && selectedItem && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="bg-red-600 text-white p-4">
                            <h3 className="font-bold flex items-center gap-2"><XCircle size={18} /> Tolak Item</h3>
                        </div>
                        <div className="p-4">
                            <p className="text-sm text-slate-600 mb-3">Berikan alasan penolakan untuk <strong>{selectedItem.title}</strong>:</p>
                            <textarea
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                className="w-full p-3 border rounded-xl"
                                rows={3}
                                placeholder="Alasan penolakan..."
                            />
                        </div>
                        <div className="p-4 bg-slate-50 border-t flex gap-3">
                            <button onClick={() => setShowRejectModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-600">
                                Batal
                            </button>
                            <button
                                onClick={() => handleReject(selectedItem)}
                                disabled={!rejectReason}
                                className="flex-[2] py-3 bg-red-600 text-white rounded-xl font-bold disabled:bg-slate-300"
                            >
                                Tolak
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientApproval;
