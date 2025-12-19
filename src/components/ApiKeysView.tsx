import React, { useState, useEffect } from 'react';
import { Key, ArrowLeft, Loader2, ExternalLink, Shield, BarChart3 } from 'lucide-react';
import { addApiKey, getStoredApiKeys, clearApiKeys, getApiUsageStats } from '../utils/aiScheduler';
import type { ViewType } from '../hooks/useModalManager';

interface ApiKeysViewProps {
    setView: (view: ViewType) => void;
}

const ApiKeysView: React.FC<ApiKeysViewProps> = ({ setView }) => {
    const [apiKeys, setApiKeys] = useState<string[]>([]);
    const [usageStats, setUsageStats] = useState<any>({});
    const [newApiKey, setNewApiKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const loadKeys = async () => {
        setIsLoading(true);
        setError('');
        try {
            const keys = await getStoredApiKeys();
            setApiKeys(keys);

            // Load stats
            const stats = await getApiUsageStats();
            // Transform stats { key_0: 5, key_1: 2 } to { 0: 5, 1: 2 }
            const formattedStats: any = {};
            keys.forEach((_, idx) => {
                formattedStats[idx] = stats[`key_${idx} `] || 0;
            });
            setUsageStats(formattedStats);
        } catch (err: any) {
            setError(err.message || 'Gagal memuat API Keys dari database');
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadKeys();
    }, []);

    const handleAddKey = async () => {
        if (!newApiKey.trim()) return;
        setError('');
        setSuccess('');
        setIsLoading(true);
        try {
            await addApiKey(newApiKey.trim());
            await loadKeys();
            setNewApiKey('');
            setSuccess('✅ API Key berhasil disimpan ke database!');
        } catch (err: any) {
            setError(err.message || 'Gagal menambahkan API Key');
        }
        setIsLoading(false);
    };

    const handleClearKeys = async () => {
        if (!confirm('Hapus semua API Keys dari database? Fitur AI tidak akan berfungsi tanpa API Key.')) return;
        setIsLoading(true);
        setError('');
        setSuccess('');
        try {
            await clearApiKeys();
            setApiKeys([]);
            setSuccess('Semua API Keys berhasil dihapus.');
        } catch (err: any) {
            setError(err.message || 'Gagal menghapus API Keys');
        }
        setIsLoading(false);
    };

    return (
        <main className="space-y-6 pb-24">
            {/* Back Button */}
            <button
                onClick={() => setView('dashboard')}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-800 font-medium mb-2"
            >
                <ArrowLeft size={18} /> Kembali ke Dashboard
            </button>

            {/* Header */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-6 rounded-2xl shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                    <div className="bg-white/20 p-3 rounded-xl">
                        <Key size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">API Keys Gemini</h1>
                        <p className="text-amber-100 text-sm">Kelola API Keys untuk fitur AI</p>
                    </div>
                </div>
            </div>

            {/* Info Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                    <div className="flex items-start gap-3">
                        <Shield size={20} className="text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-bold mb-1">Keamanan API Keys</p>
                            <ul className="list-disc list-inside space-y-1 text-blue-700">
                                <li>Keys disimpan di Firestore (Aman)</li>
                                <li>Hanya Super Admin yang akses</li>
                                <li>Sistem Auto-Rotate saat limit habis</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl">
                    <div className="flex items-start gap-3">
                        <BarChart3 size={20} className="text-purple-600 mt-0.5" />
                        <div className="text-sm text-purple-800 w-full">
                            <p className="font-bold mb-1">Total Kapasitas Harian (RPD)</p>
                            <div className="flex justify-between items-end">
                                <div>
                                    <span className="text-2xl font-bold">{Object.values(usageStats).reduce((a: any, b: any) => a + b, 0) as number}</span>
                                    <span className="text-purple-600 opacity-70"> / {apiKeys.length * 20} Request</span>
                                </div>
                                <div className="text-right text-xs">
                                    <p>Reset tiap 00:00</p>
                                </div>
                            </div>
                            <div className="w-full bg-purple-200 h-1.5 rounded-full mt-2">
                                <div
                                    className="bg-purple-600 h-1.5 rounded-full transition-all"
                                    style={{ width: `${Math.min(100, ((Object.values(usageStats).reduce((a: any, b: any) => a + b, 0) as number) / (apiKeys.length * 20 || 1)) * 100)}% ` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
                    ⚠️ {error}
                </div>
            )}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl">
                    {success}
                </div>
            )}

            {/* Current Keys */}
            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-slate-50">
                    <h2 className="font-bold text-slate-800">API Keys Tersimpan ({apiKeys.length}/3)</h2>
                </div>
                <div className="p-4 space-y-3">
                    {isLoading && apiKeys.length === 0 ? (
                        <div className="flex items-center gap-2 text-slate-400 py-4 justify-center">
                            <Loader2 size={20} className="animate-spin" /> Memuat dari database...
                        </div>
                    ) : apiKeys.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <Key size={40} className="mx-auto mb-2 opacity-30" />
                            <p className="font-medium">Belum ada API Key</p>
                            <p className="text-sm">Tambahkan API Key untuk menggunakan fitur AI</p>
                        </div>
                    ) : (
                        apiKeys.map((k, idx) => {
                            const stats = usageStats[idx] || 0; // Usage for this key index
                            const limit = 20; // Hardcoded limit based on screenshot
                            const percent = Math.min(100, (stats / limit) * 100);
                            const isLimit = stats >= limit;

                            return (
                                <div key={idx} className="bg-slate-50 p-4 rounded-xl space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-amber-100 text-amber-700 p-2 rounded-lg">
                                            <Key size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <code className="text-sm font-mono bg-slate-200 px-2 py-1 rounded">
                                                {k.slice(0, 12)}...{k.slice(-6)}
                                            </code>
                                        </div>
                                        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">
                                            Key #{idx + 1}
                                        </span>
                                    </div>

                                    {/* Usage Bar */}
                                    <div>
                                        <div className="flex justify-between text-xs font-bold mb-1">
                                            <span className={isLimit ? 'text-red-500' : 'text-slate-500'}>
                                                {isLimit ? '⚠️ QUOTA HABIS' : 'Kuota Harian'}
                                            </span>
                                            <span className={isLimit ? 'text-red-500' : 'text-slate-700'}>
                                                {stats} / {limit} Request
                                            </span>
                                        </div>
                                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h - full transition - all ${isLimit ? 'bg-red-500' : percent > 80 ? 'bg-orange-500' : 'bg-green-500'} `}
                                                style={{ width: `${percent}% ` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {apiKeys.length > 0 && (
                        <button
                            onClick={handleClearKeys}
                            disabled={isLoading}
                            className="w-full text-sm text-rose-500 hover:text-rose-700 py-3 border-t mt-4"
                        >
                            🗑️ Hapus Semua Keys
                        </button>
                    )}
                </div>
            </div>

            {/* Add New Key */}
            {apiKeys.length < 3 && (
                <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b bg-slate-50">
                        <h2 className="font-bold text-slate-800">Tambah API Key Baru</h2>
                    </div>
                    <div className="p-4 space-y-4">
                        <input
                            type="text"
                            value={newApiKey}
                            onChange={(e) => setNewApiKey(e.target.value)}
                            placeholder="AIzaSy..."
                            className="w-full p-4 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                        <button
                            onClick={handleAddKey}
                            disabled={!newApiKey.trim() || isLoading}
                            className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {isLoading && <Loader2 size={18} className="animate-spin" />}
                            Simpan ke Database
                        </button>
                    </div>
                </div>
            )}

            {/* Get API Key Link */}
            <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 p-4 rounded-xl font-medium transition-colors"
            >
                <ExternalLink size={18} />
                Dapatkan API Key Gratis di Google AI Studio
            </a>
        </main>
    );
};

export default ApiKeysView;
