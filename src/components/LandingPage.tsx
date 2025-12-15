import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    Wallet,
    FileCheck,
    Users,
    ShieldCheck,
    Menu,
    X,
    Smartphone,
    Hammer,
    Instagram,
    Phone,
    MapPin,
    MessageCircle,
    ChevronRight,
    Star,
    CheckCircle2,
    ArrowRight,
    Building2
} from 'lucide-react';
import type { LandingPageConfig, LandingTheme } from '../types';

interface LandingPageProps {
    onLogin: () => void;
    config: LandingPageConfig;
}

// Theme configurations
const themeConfigs: Record<LandingTheme, {
    bg: string;
    bgSecondary: string;
    text: string;
    textSecondary: string;
    accent: string;
    accentGradient: string;
    accentHover: string;
    navBg: string;
    navText: string;
    cardBg: string;
    ctaBg: string;
    ctaText: string;
    glowColor: string;
    isDark: boolean;
}> = {
    'dark-orange': {
        bg: 'bg-slate-950',
        bgSecondary: 'bg-slate-900',
        text: 'text-white',
        textSecondary: 'text-slate-400',
        accent: 'text-orange-400',
        accentGradient: 'from-orange-500 to-amber-500',
        accentHover: 'hover:text-orange-400',
        navBg: 'bg-slate-950/80',
        navText: 'text-slate-300',
        cardBg: 'bg-slate-900/50',
        ctaBg: 'bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-600',
        ctaText: 'text-white',
        glowColor: 'bg-orange-500/20',
        isDark: true
    },
    'light-blue': {
        bg: 'bg-white',
        bgSecondary: 'bg-slate-50',
        text: 'text-slate-900',
        textSecondary: 'text-slate-500',
        accent: 'text-blue-600',
        accentGradient: 'from-blue-500 to-cyan-500',
        accentHover: 'hover:text-blue-600',
        navBg: 'bg-white/90',
        navText: 'text-slate-600',
        cardBg: 'bg-white',
        ctaBg: 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700',
        ctaText: 'text-white',
        glowColor: 'bg-blue-500/10',
        isDark: false
    },
    'dark-green': {
        bg: 'bg-slate-950',
        bgSecondary: 'bg-slate-900',
        text: 'text-white',
        textSecondary: 'text-slate-400',
        accent: 'text-emerald-400',
        accentGradient: 'from-emerald-500 to-green-500',
        accentHover: 'hover:text-emerald-400',
        navBg: 'bg-slate-950/80',
        navText: 'text-slate-300',
        cardBg: 'bg-slate-900/50',
        ctaBg: 'bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600',
        ctaText: 'text-white',
        glowColor: 'bg-emerald-500/20',
        isDark: true
    },
    'light-elegant': {
        bg: 'bg-stone-50',
        bgSecondary: 'bg-white',
        text: 'text-stone-900',
        textSecondary: 'text-stone-500',
        accent: 'text-stone-800',
        accentGradient: 'from-stone-700 to-stone-900',
        accentHover: 'hover:text-stone-900',
        navBg: 'bg-stone-50/90',
        navText: 'text-stone-600',
        cardBg: 'bg-white',
        ctaBg: 'bg-gradient-to-br from-stone-800 via-stone-900 to-black',
        ctaText: 'text-white',
        glowColor: 'bg-stone-500/10',
        isDark: false
    }
};

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

    const companyName = config?.companyName || 'Guna Karya';
    const tagline = config?.tagline || 'Wujudkan Hunian Impian Anda';
    const subtitle = config?.subtitle || 'Layanan konstruksi profesional untuk rumah tinggal, renovasi, dan pembangunan baru. Kualitas terjamin dengan harga transparan.';
    const whatsappNumber = config?.whatsappNumber || '6281234567890';
    const instagramHandle = config?.instagramHandle || 'guna.karya';
    const theme = config?.theme || 'dark-orange';
    const t = themeConfigs[theme];

    const portfolioItems = config?.portfolioItems && config.portfolioItems.length > 0
        ? config.portfolioItems.map(item => ({
            image: item.imageUrl,
            title: item.title,
            status: item.status,
            location: item.location
        }))
        : [
            { image: '', title: 'Rumah Modern Minimalis', status: 'Selesai' as const, location: 'Jakarta Selatan' },
            { image: '', title: 'Pembangunan Rumah 2 Lantai', status: 'Sedang Berjalan' as const, location: 'Bekasi' },
            { image: '', title: 'Hunian Tropis Elegan', status: 'Selesai' as const, location: 'Tangerang' },
            { image: '', title: 'Renovasi Atap & Struktur', status: 'Sedang Berjalan' as const, location: 'Depok' }
        ];

    return (
        <div className={`min-h-screen ${t.bg} font-sans ${t.text} overflow-x-hidden`}>

            {/* NAVBAR */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? `${t.navBg} backdrop-blur-xl border-b ${t.isDark ? 'border-white/10' : 'border-slate-200'} py-4` : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt={companyName} className="w-10 h-10 rounded-xl object-contain" />
                        <span className={`text-2xl font-bold tracking-tight ${t.text}`}>{companyName}</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#portfolio" className={`text-sm font-medium ${t.navText} ${t.accentHover} transition-colors`}>Portofolio</a>
                        <a href="#features" className={`text-sm font-medium ${t.navText} ${t.accentHover} transition-colors`}>Layanan</a>
                        <a href="#contact" className={`text-sm font-medium ${t.navText} ${t.accentHover} transition-colors`}>Kontak</a>
                        <button
                            onClick={onLogin}
                            className={`px-6 py-2.5 rounded-xl ${t.isDark ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20' : 'bg-slate-900 text-white hover:bg-slate-800'} font-semibold text-sm transition-all backdrop-blur`}
                        >
                            Masuk
                        </button>
                    </div>

                    <button className={`md:hidden p-2 ${t.text}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {mobileMenuOpen && (
                    <div className={`absolute top-full left-0 right-0 ${t.isDark ? 'bg-slate-900/95' : 'bg-white/95'} backdrop-blur-xl border-b ${t.isDark ? 'border-white/10' : 'border-slate-200'} p-6 flex flex-col gap-4 md:hidden`}>
                        <a href="#portfolio" className={`text-lg font-medium ${t.navText}`}>Portofolio</a>
                        <a href="#features" className={`text-lg font-medium ${t.navText}`}>Layanan</a>
                        <a href="#contact" className={`text-lg font-medium ${t.navText}`}>Kontak</a>
                        <button onClick={onLogin} className={`w-full py-3 rounded-xl bg-gradient-to-r ${t.accentGradient} text-white font-bold`}>
                            Masuk
                        </button>
                    </div>
                )}
            </nav>

            {/* HERO SECTION */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Background */}
                <div className={`absolute inset-0 ${t.bg}`} />
                <div className={`absolute top-0 right-0 w-[800px] h-[800px] ${t.glowColor} rounded-full blur-[150px] animate-pulse`} />
                <div className={`absolute bottom-0 left-0 w-[600px] h-[600px] ${t.glowColor} rounded-full blur-[120px] opacity-50`} />

                {/* Grid Pattern */}
                <div className={`absolute inset-0 ${t.isDark ? 'opacity-[0.03]' : 'opacity-[0.02]'}`} style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='${t.isDark ? '%23ffffff' : '%23000000'}' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />

                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center pt-20">
                    {/* Badge */}
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${t.isDark ? 'bg-white/10 border border-white/20' : 'bg-slate-100 border border-slate-200'} ${t.accent} text-sm font-bold uppercase tracking-wider mb-8`}>
                        <Star className={`w-4 h-4 ${t.accent} fill-current`} />
                        Kontraktor Terpercaya
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.95] mb-8 tracking-tight">
                        <span className={t.text}>{tagline.split(' ').slice(0, 2).join(' ')}</span>
                        <br />
                        <span className={`text-transparent bg-clip-text bg-gradient-to-r ${t.accentGradient}`}>
                            {tagline.split(' ').slice(2).join(' ') || 'Impian Anda'}
                        </span>
                    </h1>

                    <p className={`text-lg md:text-xl ${t.textSecondary} mb-12 max-w-2xl mx-auto leading-relaxed`}>
                        {subtitle}
                    </p>

                    {/* CTA */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <a
                            href={`https://wa.me/${whatsappNumber}?text=Halo%20${encodeURIComponent(companyName)},%20saya%20ingin%20konsultasi%20tentang%20proyek%20konstruksi`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`group w-full sm:w-auto px-8 py-5 rounded-2xl bg-gradient-to-r ${t.accentGradient} text-white font-bold text-lg transition-all shadow-2xl flex items-center justify-center gap-3`}
                        >
                            <MessageCircle className="w-6 h-6" />
                            Konsultasi Gratis
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </a>
                        <a
                            href="#portfolio"
                            className={`w-full sm:w-auto px-8 py-5 rounded-2xl ${t.isDark ? 'bg-white/5 border border-white/20 text-white hover:bg-white/10' : 'bg-slate-100 border border-slate-200 text-slate-800 hover:bg-slate-200'} font-bold text-lg transition-all flex items-center justify-center gap-2`}
                        >
                            Lihat Portfolio
                        </a>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
                        {[
                            { value: '50+', label: 'Proyek Selesai' },
                            { value: '8+', label: 'Tahun Pengalaman' },
                            { value: '100%', label: 'Klien Puas' }
                        ].map((stat, i) => (
                            <div key={i} className={`text-center p-4 rounded-2xl ${t.isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200 shadow-sm'}`}>
                                <div className={`text-3xl md:text-4xl font-black ${t.accent}`}>{stat.value}</div>
                                <div className={`text-xs md:text-sm ${t.textSecondary} mt-1`}>{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                    <div className={`w-6 h-10 rounded-full border-2 ${t.isDark ? 'border-white/30' : 'border-slate-300'} flex items-start justify-center p-2`}>
                        <div className={`w-1.5 h-3 ${t.isDark ? 'bg-white/50' : 'bg-slate-400'} rounded-full animate-pulse`}></div>
                    </div>
                </div>
            </section>

            {/* PORTFOLIO SECTION */}
            <section id="portfolio" className={`py-24 ${t.bgSecondary} relative`}>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-16">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 border ${t.isDark ? 'border-white/10' : 'border-slate-200'} ${t.text} text-sm font-bold uppercase tracking-wider mb-4`}>
                            <Instagram className="w-4 h-4" />
                            @{instagramHandle}
                        </div>
                        <h2 className={`text-4xl md:text-5xl font-black ${t.text} mb-4`}>Portofolio Proyek</h2>
                        <p className={`${t.textSecondary} max-w-2xl mx-auto`}>Hasil karya terbaik kami. Setiap proyek dikerjakan dengan standar kualitas tinggi.</p>
                    </div>

                    {/* Portfolio Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {portfolioItems.map((item, i) => (
                            <div key={i} className={`group relative aspect-square rounded-2xl overflow-hidden ${t.isDark ? 'bg-slate-800' : 'bg-slate-200'} cursor-pointer`}>
                                <div className="absolute inset-0">
                                    {item.image ? (
                                        <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className={`w-full h-full flex items-center justify-center ${t.isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                                            <Building2 className={`w-12 h-12 ${t.isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                                        </div>
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold w-fit mb-2 ${item.status === 'Selesai' ? 'bg-green-500/30 text-green-400' : 'bg-orange-500/30 text-orange-400'}`}>
                                        {item.status === 'Selesai' ? <CheckCircle2 className="w-3 h-3" /> : <Hammer className="w-3 h-3" />}
                                        {item.status}
                                    </div>
                                    <h3 className="text-sm font-bold text-white">{item.title}</h3>
                                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                        <MapPin className="w-3 h-3" /> {item.location}
                                    </p>
                                </div>
                                <div className="absolute top-3 right-3 group-hover:opacity-0 transition-opacity">
                                    <div className={`w-3 h-3 rounded-full ${item.status === 'Selesai' ? 'bg-green-500' : 'bg-orange-500'} ring-2 ${t.isDark ? 'ring-slate-900' : 'ring-white'}`}></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 text-center">
                        <a
                            href={`https://instagram.com/${instagramHandle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-2 ${t.textSecondary} hover:${t.accent} font-medium transition-colors`}
                        >
                            <Instagram className="w-5 h-5" />
                            Lihat lebih banyak di Instagram
                            <ChevronRight className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </section>

            {/* FEATURES SECTION */}
            <section id="features" className={`py-24 ${t.bg} relative`}>
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] ${t.glowColor} rounded-full blur-[150px]`} />

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className={`text-4xl md:text-5xl font-black ${t.text} mb-4`}>Kenapa Pilih <span className={t.accent}>{companyName}</span>?</h2>
                        <p className={`${t.textSecondary} max-w-2xl mx-auto`}>Komitmen kami untuk memberikan yang terbaik di setiap proyek.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: <BarChart3 className="w-7 h-7" />, title: "Progress Transparan", desc: "Pantau perkembangan proyek real-time dengan laporan harian lengkap foto.", color: "from-blue-500 to-cyan-500" },
                            { icon: <Wallet className="w-7 h-7" />, title: "Harga Jujur", desc: "RAB detail dan transparan. Tidak ada biaya tersembunyi.", color: "from-green-500 to-emerald-500" },
                            { icon: <FileCheck className="w-7 h-7" />, title: "Kualitas Terjamin", desc: "Material berkualitas tinggi dengan pengerjaan standar tinggi.", color: "from-purple-500 to-violet-500" },
                            { icon: <ShieldCheck className="w-7 h-7" />, title: "Garansi Pekerjaan", desc: "Garansi untuk setiap pekerjaan. Kepuasan Anda prioritas kami.", color: t.accentGradient },
                            { icon: <Users className="w-7 h-7" />, title: "Tim Profesional", desc: "Mandor dan tukang berpengalaman dengan track record terbaik.", color: "from-pink-500 to-rose-500" },
                            { icon: <Smartphone className="w-7 h-7" />, title: "Komunikasi Mudah", desc: "Konsultasi gratis via WhatsApp. Respon cepat 24 jam.", color: "from-indigo-500 to-blue-500" }
                        ].map((feature, i) => (
                            <div key={i} className={`group p-8 rounded-3xl ${t.cardBg} border ${t.isDark ? 'border-white/5 hover:border-white/20' : 'border-slate-200 hover:border-slate-300 hover:shadow-lg'} transition-all duration-300 hover:-translate-y-2`}>
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                    {feature.icon}
                                </div>
                                <h3 className={`text-xl font-bold ${t.text} mb-3`}>{feature.title}</h3>
                                <p className={`${t.textSecondary} text-sm leading-relaxed`}>{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA SECTION */}
            <section id="contact" className="py-24 relative overflow-hidden">
                <div className={`absolute inset-0 ${t.ctaBg}`} />
                <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />

                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-6">Siap Mulai Proyek Anda?</h2>
                    <p className="text-xl text-white/80 mb-10">Konsultasikan kebutuhan konstruksi Anda dengan tim kami. <strong>GRATIS!</strong></p>

                    <a
                        href={`https://wa.me/${whatsappNumber}?text=Halo%20${encodeURIComponent(companyName)},%20saya%20ingin%20konsultasi%20tentang%20proyek%20konstruksi`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group inline-flex items-center gap-3 px-12 py-6 rounded-2xl ${t.isDark ? 'bg-white text-slate-900' : 'bg-slate-950 text-white'} font-bold text-xl hover:scale-105 transition-all shadow-2xl`}
                    >
                        <MessageCircle className="w-7 h-7" />
                        Chat WhatsApp Sekarang
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                    </a>

                    <p className="text-sm text-white/60 mt-6">⚡ Respon dalam 5 menit di jam kerja</p>
                </div>
            </section>

            {/* FOOTER */}
            <footer className={`py-12 ${t.bg} border-t ${t.isDark ? 'border-white/10' : 'border-slate-200'}`}>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt={companyName} className="w-8 h-8 rounded-lg object-contain" />
                            <span className={`font-bold ${t.text}`}>{companyName}</span>
                        </div>

                        <p className={`${t.textSecondary} text-sm`}>&copy; {new Date().getFullYear()} {companyName}. All rights reserved.</p>

                        <div className="flex items-center gap-3">
                            <a
                                href={`https://instagram.com/${instagramHandle}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white hover:scale-110 transition-transform"
                            >
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a
                                href={`https://wa.me/${whatsappNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-white hover:scale-110 transition-transform"
                            >
                                <Phone className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* FLOATING WHATSAPP */}
            <a
                href={`https://wa.me/${whatsappNumber}?text=Halo%20${encodeURIComponent(companyName)},%20saya%20ingin%20konsultasi`}
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 z-50 bg-green-500 text-white p-4 rounded-2xl shadow-lg shadow-green-500/40 hover:bg-green-600 hover:scale-110 transition-all"
            >
                <MessageCircle className="w-7 h-7" />
            </a>

        </div>
    );
};

export default LandingPage;
