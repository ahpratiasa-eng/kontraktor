import React, { useState, useEffect } from 'react';
import { Key, X, Loader2 } from 'lucide-react';
import { addApiKey, getStoredApiKeys, clearApiKeys } from '../utils/aiScheduler';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
    const [apiKeys, setApiKeys] = useState<string[]>([]);
    const [newApiKey, setNewApiKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const loadKeys = async () => {
        setIsLoading(true);
        try {
            const keys = await getStoredApiKeys();
            setApiKeys(keys);
        } catch (err) {
            console.error('Failed to load keys:', err);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (isOpen) {
            loadKeys();
        }
    }, [isOpen]);

    const handleAddKey = async () => {
        if (!newApiKey.trim()) return;
        setError('');
        setIsLoading(true);
        try {
            await addApiKey(newApiKey.trim());
            await loadKeys();
            setNewApiKey('');
            alert('✅ API Key berhasil ditambahkan ke database!');
        } catch (err: any) {
            setError(err.message || 'Gagal menambahkan API Key');
        }
        setIsLoading(false);
    };

    const handleClearKeys = async () => {
        if (!confirm('Hapus semua API Keys dari database?')) return;
        setIsLoading(true);
        try {
            await clearApiKeys();
            setApiKeys([]);
            alert('Semua API Keys dihapus dari database.');
        } catch (err: any) {
            setError(err.message || 'Gagal menghapus API Keys');
        }
        setIsLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Key size={20} className="text-amber-500" />
                            API Keys Gemini
                        </h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Disimpan di Firebase. Maks 3 keys untuk rotasi otomatis.
                    </p>
                </div>

                <div className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 text-xs p-2 rounded-lg">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">API Keys Tersimpan:</label>
                        {isLoading ? (
                            <div className="flex items-center gap-2 text-slate-400 text-xs">
                                <Loader2 size={14} className="animate-spin" /> Memuat...
                            </div>
                        ) : apiKeys.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">Belum ada API Key. Tambahkan di bawah.</p>
                        ) : (
                            apiKeys.map((k, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                                    <span className="text-xs font-mono bg-slate-200 px-2 py-1 rounded flex-1 truncate">
                                        {k.slice(0, 10)}...{k.slice(-4)}
                                    </span>
                                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                                        Key #{idx + 1}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>

                    {apiKeys.length < 3 && (
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600">Tambah API Key Baru:</label>
                            <input
                                type="text"
                                value={newApiKey}
                                onChange={(e) => setNewApiKey(e.target.value)}
                                placeholder="AIzaSy..."
                                className="w-full p-3 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            />
                            <button
                                onClick={handleAddKey}
                                disabled={!newApiKey.trim() || isLoading}
                                className="w-full bg-amber-500 text-white py-2 rounded-lg font-bold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                {isLoading && <Loader2 size={16} className="animate-spin" />}
                                Simpan ke Database
                            </button>
                        </div>
                    )}

                    {apiKeys.length > 0 && (
                        <button
                            onClick={handleClearKeys}
                            disabled={isLoading}
                            className="w-full text-xs text-rose-500 hover:text-rose-700 py-2"
                        >
                            🗑️ Hapus Semua Keys
                        </button>
                    )}

                    <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center text-xs text-blue-500 hover:underline"
                    >
                        🔑 Dapatkan API Key Gratis di Google AI Studio →
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyModal;
