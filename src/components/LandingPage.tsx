import React, { useState, useEffect } from 'react';
import {
    Building2,
    BarChart3,
    Wallet,
    FileCheck,
    Users,
    ShieldCheck,
    ArrowRight,
    Menu,
    X,
    Smartphone
} from 'lucide-react';

interface LandingPageProps {
    onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden">

            {/* NAVBAR */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Building2 className="text-white w-6 h-6" />
                        </div>
                        <span className={`text-2xl font-bold tracking-tight ${isScrolled ? 'text-slate-900' : 'text-slate-900'}`}>Guna Karya</span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Fitur</a>
                        <a href="#benefits" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Keunggulan</a>
                        <a href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Testimoni</a>
                        <button
                            onClick={onLogin}
                            className="px-6 py-2.5 rounded-full bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-slate-900/20"
                        >
                            Masuk / Daftar
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-slate-600"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Mobile Menu Dropdown */}
                {mobileMenuOpen && (
                    <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-100 p-6 flex flex-col gap-4 shadow-xl md:hidden">
                        <a href="#features" className="text-lg font-medium text-slate-600">Fitur</a>
                        <a href="#benefits" className="text-lg font-medium text-slate-600">Keunggulan</a>
                        <button
                            onClick={onLogin}
                            className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold"
                        >
                            Masuk Sekarang
                        </button>
                    </div>
                )}
            </nav>

            {/* HERO SECTION */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
                {/* Background Elements */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-orange-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wide mb-6 animate-fade-in-up">
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                        Platform Manajemen Konstruksi #1
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-8 tracking-tight">
                        Kelola Proyek Konstruksi <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Lebih Cerdas & Efisien</span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Satu aplikasi untuk memantau progress lapangan, mengatur cashflow, laporan harian, hingga manajemen tukang. Tinggalkan cara lama yang ribet.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                        <button
                            onClick={onLogin}
                            className="w-full md:w-auto px-8 py-4 rounded-xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition-all hover:-translate-y-1 shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2"
                        >
                            Coba Gratis Sekarang
                            <ArrowRight className="w-5 h-5" />
                        </button>
                        <button
                            className="w-full md:w-auto px-8 py-4 rounded-xl bg-white text-slate-700 border border-slate-200 font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                        >
                            <Smartphone className="w-5 h-5 text-slate-400" />
                            Download Aplikasi
                        </button>
                    </div>

                    {/* Hero Image / Dashboard Mockup */}
                    <div className="mt-16 md:mt-24 relative mx-auto max-w-5xl">
                        <div className="rounded-2xl bg-slate-900 p-2 md:p-4 shadow-2xl border border-slate-800 rotate-x-12 perspective-1000">
                            {/* Abstract UI Representation */}
                            <div className="bg-slate-800 rounded-xl overflow-hidden aspect-[16/9] border border-slate-700 relative flex items-center justify-center">
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
                                {/* Floating Cards simulating UI */}
                                <div className="absolute top-10 left-10 w-48 h-32 bg-slate-700 rounded-lg border border-slate-600 shadow-xl opacity-80" />
                                <div className="absolute bottom-10 right-10 w-64 h-40 bg-blue-600/20 rounded-lg border border-blue-500/30 backdrop-blur-sm shadow-xl flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-blue-400 mb-1">85%</div>
                                        <div className="text-xs text-blue-200">Progress Minggu Ini</div>
                                    </div>
                                </div>
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-slate-400">
                                    <Building2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    <p>Dashboard Preview</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES GRID */}
            <section id="features" className="py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Fitur Lengkap untuk Kontraktor Modern</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto">Semua yang Anda butuhkan untuk mengelola proyek dari nol hingga serah terima kunci.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <BarChart3 className="w-8 h-8 text-blue-600" />,
                                title: "Monitoring Progress Real-time",
                                desc: "Pantau persentase penyelesaian proyek (Kurva S) secara otomatis berdasarkan input harian dari lapangan."
                            },
                            {
                                icon: <Wallet className="w-8 h-8 text-green-600" />,
                                title: "Manajemen Keuangan & RAB",
                                desc: "Catat setiap pemasukan dan pengeluaran. Bandingkan realisasi vs RAB agar budget tidak boncos."
                            },
                            {
                                icon: <FileCheck className="w-8 h-8 text-purple-600" />,
                                title: "Laporan Harian Otomatis",
                                desc: "Generate laporan harian lengkap dengan foto, absensi tukang, dan cuaca langsung kirim ke Owner via WhatsApp."
                            },
                            {
                                icon: <ShieldCheck className="w-8 h-8 text-orange-600" />,
                                title: "Aman & Terenkripsi",
                                desc: "Data proyek Anda tersimpan aman di cloud. Akses kapan saja dari HP atau Laptop tanpa takut data hilang."
                            },
                            {
                                icon: <Users className="w-8 h-8 text-indigo-600" />,
                                title: "Kelola Tukang & Upah",
                                desc: "Sistem absensi harian dan perhitungan gaji otomatis. Kelola mandor dan tukang lebih transparan."
                            },
                            {
                                icon: <Smartphone className="w-8 h-8 text-rose-600" />,
                                title: "Akses Mobile Friendly",
                                desc: "Aplikasi ringan yang didesain khusus untuk penggunaan mudah di lapangan maupun di kantor."
                            }
                        ].map((feature, i) => (
                            <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
                                <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center mb-6">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                                <p className="text-slate-500 leading-relaxed text-sm">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SOCIAL PROOF */}
            <section className="py-20 bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-10">Dipercaya oleh Kontraktor di Seluruh Indonesia</p>
                    <div className="flex flex-wrap items-center justify-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Logos styled simply with text for now as placeholders */}
                        <div className="text-2xl font-black text-slate-800">WIJAYA KARYA</div>
                        <div className="text-2xl font-black text-slate-800">ADHI KARYA</div>
                        <div className="text-2xl font-black text-slate-800">WASKITA</div>
                        <div className="text-2xl font-black text-slate-800">PP PROPERTI</div>
                    </div>
                </div>
            </section>

            {/* CTA SECTION */}
            <section className="py-24 bg-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-600/10" />
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Siap Mengubah Cara Anda Bekerja?</h2>
                    <p className="text-xl text-slate-300 mb-10">Bergabunglah dengan ribuan kontraktor cerdas lainnya. Tingkatkan profitabilitas proyek Anda sekarang juga.</p>
                    <button
                        onClick={onLogin}
                        className="px-10 py-5 rounded-xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/30"
                    >
                        Mulai Gratis (Login Google)
                    </button>
                    <p className="mt-6 text-sm text-slate-400">Tidak perlu kartu kredit. Setup dalam 2 menit.</p>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-slate-50 py-12 border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-slate-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} Guna Karya. All rights reserved.</p>
                    <div className="flex items-center gap-6">
                        <a href="#" className="hover:text-slate-900">Privacy Policy</a>
                        <a href="#" className="hover:text-slate-900">Terms of Service</a>
                        <a href="#" className="hover:text-slate-900">Contact Support</a>
                    </div>
                </div>
            </footer>

        </div>
    );
};

export default LandingPage;
