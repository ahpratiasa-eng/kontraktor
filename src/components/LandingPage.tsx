import React, { useState, useEffect } from 'react';
import {
    Building2,
    BarChart3,
    Wallet,
    FileCheck,
    Users,
    ShieldCheck,
    Menu,
    X,
    Smartphone,
    Hammer,
    Home,
    Instagram,
    ExternalLink,
    Phone,
    MapPin,
    Loader2
} from 'lucide-react';
import type { LandingPageConfig } from '../types';

interface LandingPageProps {
    onLogin: () => void;
    config: LandingPageConfig | null;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, config }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Default values if config is not loaded
    const companyName = config?.companyName || 'Guna Karya';
    const tagline = config?.tagline || 'Wujudkan Hunian Impian Anda';
    const subtitle = config?.subtitle || 'Layanan konstruksi profesional untuk rumah tinggal, renovasi, dan pembangunan baru. Kualitas terjamin dengan harga transparan.';
    const whatsappNumber = config?.whatsappNumber || '6281234567890';
    const instagramHandle = config?.instagramHandle || 'guna.karya';

    // Use config portfolio items if available, otherwise use default
    const portfolioItems = config?.portfolioItems && config.portfolioItems.length > 0
        ? config.portfolioItems.map(item => ({
            image: item.imageUrl,
            title: item.title,
            status: item.status,
            location: item.location
        }))
        : [
            {
                image: '/portfolio_house_1.png',
                title: 'Rumah Modern Minimalis',
                status: 'Selesai' as const,
                location: 'Jakarta Selatan'
            },
            {
                image: '/portfolio_construction_1.png',
                title: 'Pembangunan Rumah 2 Lantai',
                status: 'Sedang Berjalan' as const,
                location: 'Bekasi'
            },
            {
                image: '/portfolio_house_2.png',
                title: 'Hunian Tropis Elegan',
                status: 'Selesai' as const,
                location: 'Tangerang'
            },
            {
                image: '/portfolio_construction_2.png',
                title: 'Renovasi Atap & Struktur',
                status: 'Sedang Berjalan' as const,
                location: 'Depok'
            }
        ];

    // Show loading if config is still loading
    if (!config) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-slate-500">Memuat halaman...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden">

            {/* NAVBAR */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Building2 className="text-white w-6 h-6" />
                        </div>
                        <span className={`text-2xl font-bold tracking-tight ${isScrolled ? 'text-slate-900' : 'text-slate-900'}`}>{companyName}</span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#portfolio" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Portofolio</a>
                        <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Fitur</a>
                        <a href="#contact" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Kontak</a>
                        <button
                            onClick={onLogin}
                            className="px-6 py-2.5 rounded-full bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-slate-900/20"
                        >
                            Masuk
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
                        <a href="#portfolio" className="text-lg font-medium text-slate-600">Portofolio</a>
                        <a href="#features" className="text-lg font-medium text-slate-600">Fitur</a>
                        <a href="#contact" className="text-lg font-medium text-slate-600">Kontak</a>
                        <button
                            onClick={onLogin}
                            className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold"
                        >
                            Masuk
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
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wide mb-6">
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                        Jasa Konstruksi & Renovasi Terpercaya
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-8 tracking-tight">
                        {tagline.split(' ').slice(0, 2).join(' ')} <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                            {tagline.split(' ').slice(2).join(' ') || 'Impian Anda'}
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                        {subtitle}
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                        <a
                            href={`https://wa.me/${whatsappNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full md:w-auto px-8 py-4 rounded-xl bg-green-600 text-white font-bold text-lg hover:bg-green-700 transition-all hover:-translate-y-1 shadow-xl shadow-green-600/30 flex items-center justify-center gap-2"
                        >
                            <Phone className="w-5 h-5" />
                            Hubungi Kami
                        </a>
                        <a
                            href={`https://instagram.com/${instagramHandle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full md:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
                        >
                            <Instagram className="w-5 h-5" />
                            Lihat Instagram
                        </a>
                    </div>
                </div>
            </section>

            {/* PORTFOLIO SECTION */}
            <section id="portfolio" className="py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-xs font-bold uppercase tracking-wide mb-4">
                            <Hammer className="w-4 h-4" />
                            Portofolio Proyek
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Hasil Karya Kami</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto">Lihat berbagai proyek yang telah dan sedang kami kerjakan dengan kualitas terbaik.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {portfolioItems.map((item, i) => (
                            <div key={i} className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                                <div className="aspect-[4/3] overflow-hidden bg-slate-200">
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                            <Building2 className="w-16 h-16 opacity-30" />
                                        </div>
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-6">
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3 ${item.status === 'Selesai' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                        }`}>
                                        {item.status === 'Selesai' ? <Home className="w-3 h-3" /> : <Hammer className="w-3 h-3" />}
                                        {item.status}
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
                                    <p className="text-sm text-slate-300 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {item.location}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Instagram CTA */}
                    <div className="mt-12 text-center">
                        <a
                            href={`https://instagram.com/${instagramHandle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white font-bold text-lg hover:opacity-90 transition-all shadow-lg"
                        >
                            <Instagram className="w-6 h-6" />
                            Lihat Lebih Banyak di Instagram
                            <ExternalLink className="w-5 h-5" />
                        </a>
                        <p className="text-slate-500 mt-4 text-sm">@{instagramHandle} • Update proyek terbaru setiap hari</p>
                    </div>
                </div>
            </section>

            {/* FEATURES GRID */}
            <section id="features" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Kenapa Pilih {companyName}?</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto">Kami berkomitmen memberikan hasil terbaik untuk setiap proyek.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <BarChart3 className="w-8 h-8 text-blue-600" />,
                                title: "Progress Transparan",
                                desc: "Pantau perkembangan proyek Anda secara real-time. Kami kirimkan laporan harian lengkap dengan foto."
                            },
                            {
                                icon: <Wallet className="w-8 h-8 text-green-600" />,
                                title: "Harga Jujur",
                                desc: "RAB detail dan transparan. Tidak ada biaya tersembunyi, semua dibahas di awal sebelum proyek dimulai."
                            },
                            {
                                icon: <FileCheck className="w-8 h-8 text-purple-600" />,
                                title: "Kualitas Terjamin",
                                desc: "Material berkualitas tinggi dan pengerjaan oleh tukang berpengalaman dengan standar tinggi."
                            },
                            {
                                icon: <ShieldCheck className="w-8 h-8 text-orange-600" />,
                                title: "Garansi Pekerjaan",
                                desc: "Garansi untuk setiap pekerjaan yang kami lakukan. Kepuasan Anda adalah prioritas utama kami."
                            },
                            {
                                icon: <Users className="w-8 h-8 text-indigo-600" />,
                                title: "Tim Profesional",
                                desc: "Mandor dan tukang terlatih yang sudah berpengalaman menangani berbagai jenis proyek konstruksi."
                            },
                            {
                                icon: <Smartphone className="w-8 h-8 text-rose-600" />,
                                title: "Komunikasi Mudah",
                                desc: "Konsultasi gratis via WhatsApp. Respon cepat untuk setiap pertanyaan dan kebutuhan Anda."
                            }
                        ].map((feature, i) => (
                            <div key={i} className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-all hover:-translate-y-1">
                                <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center mb-6 shadow-sm">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                                <p className="text-slate-500 leading-relaxed text-sm">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CONTACT SECTION */}
            <section id="contact" className="py-24 bg-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-600/10" />
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Siap Mulai Proyek Anda?</h2>
                    <p className="text-xl text-slate-300 mb-10">Konsultasikan kebutuhan konstruksi atau renovasi Anda dengan tim kami. Gratis!</p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
                        <a
                            href={`https://wa.me/${whatsappNumber}?text=Halo%20${encodeURIComponent(companyName)},%20saya%20ingin%20konsultasi%20tentang%20proyek%20konstruksi`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full md:w-auto px-10 py-5 rounded-xl bg-green-600 text-white font-bold text-lg hover:bg-green-500 transition-all shadow-xl shadow-green-500/30 flex items-center justify-center gap-2"
                        >
                            <Phone className="w-5 h-5" />
                            Chat WhatsApp
                        </a>
                        <a
                            href={`https://instagram.com/${instagramHandle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full md:w-auto px-10 py-5 rounded-xl bg-white/10 backdrop-blur text-white border border-white/20 font-bold text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                        >
                            <Instagram className="w-5 h-5" />
                            @{instagramHandle}
                        </a>
                    </div>

                    <p className="text-sm text-slate-400">Respon cepat dalam 1x24 jam</p>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-slate-50 py-12 border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-slate-500 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-600 p-1.5 rounded-lg">
                                <Building2 className="text-white w-4 h-4" />
                            </div>
                            <span className="font-bold text-slate-800">{companyName}</span>
                        </div>
                        <p>&copy; {new Date().getFullYear()} {companyName}. All rights reserved.</p>
                        <div className="flex items-center gap-4">
                            <a
                                href={`https://instagram.com/${instagramHandle}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-pink-600 transition-colors"
                            >
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a
                                href={`https://wa.me/${whatsappNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-green-600 transition-colors"
                            >
                                <Phone className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* FLOATING WHATSAPP BUTTON */}
            <a
                href={`https://wa.me/${whatsappNumber}?text=Halo%20${encodeURIComponent(companyName)},%20saya%20ingin%20konsultasi`}
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 z-50 bg-green-500 text-white p-4 rounded-full shadow-lg shadow-green-500/40 hover:bg-green-600 hover:scale-110 transition-all animate-bounce"
                title="Chat WhatsApp"
            >
                <Phone className="w-6 h-6" />
            </a>

        </div>
    );
};

export default LandingPage;
