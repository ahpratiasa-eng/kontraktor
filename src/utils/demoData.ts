import { collection, addDoc } from 'firebase/firestore';
import { db, appId } from '../lib/firebase';

/**
 * Generate demo project data for testing/demo purposes
 */
/**
 * Generate demo project data for testing/demo purposes
 */
export const generateDemoProject = () => {
    // Project dates: Started 2 months ago, ends in 4 months (ongoing project)
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - 2);
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 4);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    // Get a date based on percentage through the project
    const getDateBetween = (progressPercent: number) => {
        const start = startDate.getTime();
        const end = endDate.getTime();
        const targetTime = start + (end - start) * (progressPercent / 100);
        return formatDate(new Date(targetTime));
    };

    // Workers
    const workers = [
        { id: 1, name: 'Pak Joko', role: 'Mandor', wageUnit: 'Harian', realRate: 250000, mandorRate: 300000 },
        { id: 2, name: 'Udin', role: 'Tukang', wageUnit: 'Harian', realRate: 180000, mandorRate: 200000 },
        { id: 3, name: 'Budi', role: 'Tukang', wageUnit: 'Harian', realRate: 180000, mandorRate: 200000 },
        { id: 4, name: 'Slamet', role: 'Tukang', wageUnit: 'Harian', realRate: 180000, mandorRate: 200000 },
        { id: 5, name: 'Agus', role: 'Kenek', wageUnit: 'Harian', realRate: 120000, mandorRate: 150000 },
        { id: 6, name: 'Dedi', role: 'Kenek', wageUnit: 'Harian', realRate: 120000, mandorRate: 150000 },
    ];

    // RAB Items - Total ~2 Milyar
    // Progress varied to show different deviation scenarios:
    // - A. PERSIAPAN: 100% done (on schedule) ✅
    // - B. STRUKTUR BAWAH: 100% done (completed) ✅
    // - C. STRUKTUR ATAS: 80% (slightly behind) 🟠
    // - D. DINDING: 60% (significantly behind - should be 75%) 🔴
    // - E. ATAP: 40% (on schedule) ✅
    // - F. LANTAI: 10% (just started) ✅
    // - G. KUSEN: 0% (not started yet, on schedule) ✅
    // - H. PLAFON: 0% (not started yet) ✅
    // - I. SANITAIR: 50% (ahead of schedule!) 🚀
    // - J. ELEKTRIKAL: 30% (slightly behind) 🟠
    // - K. FINISHING: 0% (not started yet) ✅

    const rabItems = [
        // A. PERSIAPAN - Completed (100%) - Plan: 100%
        { id: 1, category: 'A. PERSIAPAN', name: 'Pembersihan Lahan & Bongkaran', unit: 'ls', volume: 1, unitPrice: 25000000, progress: 100, isAddendum: false, startDate: getDateBetween(0), endDate: getDateBetween(5) },
        { id: 2, category: 'A. PERSIAPAN', name: 'Pengukuran & Bouwplank', unit: 'ls', volume: 1, unitPrice: 15000000, progress: 100, isAddendum: false, startDate: getDateBetween(3), endDate: getDateBetween(8) },
        { id: 3, category: 'A. PERSIAPAN', name: 'Mobilisasi Alat & Material', unit: 'ls', volume: 1, unitPrice: 20000000, progress: 100, isAddendum: false, startDate: getDateBetween(5), endDate: getDateBetween(10) },

        // B. STRUKTUR BAWAH - Completed (100%) - Plan: 100%
        { id: 4, category: 'B. STRUKTUR BAWAH', name: 'Galian Tanah Pondasi', unit: 'm3', volume: 120, unitPrice: 150000, progress: 100, isAddendum: false, startDate: getDateBetween(8), endDate: getDateBetween(15) },
        { id: 5, category: 'B. STRUKTUR BAWAH', name: 'Urugan Pasir Bawah Pondasi', unit: 'm3', volume: 30, unitPrice: 350000, progress: 100, isAddendum: false, startDate: getDateBetween(12), endDate: getDateBetween(18) },
        { id: 6, category: 'B. STRUKTUR BAWAH', name: 'Pondasi Batu Kali', unit: 'm3', volume: 45, unitPrice: 1500000, progress: 100, isAddendum: false, startDate: getDateBetween(15), endDate: getDateBetween(22) },
        { id: 7, category: 'B. STRUKTUR BAWAH', name: 'Sloof Beton 20x30', unit: 'm3', volume: 12, unitPrice: 4500000, progress: 100, isAddendum: false, startDate: getDateBetween(20), endDate: getDateBetween(28) },
        { id: 8, category: 'B. STRUKTUR BAWAH', name: 'Pile Cap & Tie Beam', unit: 'm3', volume: 8, unitPrice: 5000000, progress: 100, isAddendum: false, startDate: getDateBetween(25), endDate: getDateBetween(32) },

        // C. STRUKTUR ATAS - (Plan ~95%, Actual 80%) - Slightly behind 🟠
        { id: 9, category: 'C. STRUKTUR ATAS', name: 'Kolom Beton 40x40 Lt.1', unit: 'm3', volume: 15, unitPrice: 5500000, progress: 100, isAddendum: false, startDate: getDateBetween(28), endDate: getDateBetween(35) },
        { id: 10, category: 'C. STRUKTUR ATAS', name: 'Balok Beton Lt.1', unit: 'm3', volume: 18, unitPrice: 5200000, progress: 100, isAddendum: false, startDate: getDateBetween(32), endDate: getDateBetween(38) },
        { id: 11, category: 'C. STRUKTUR ATAS', name: 'Plat Lantai 2 t=12cm', unit: 'm2', volume: 180, unitPrice: 450000, progress: 85, isAddendum: false, startDate: getDateBetween(35), endDate: getDateBetween(42) },
        { id: 12, category: 'C. STRUKTUR ATAS', name: 'Kolom Beton 40x40 Lt.2', unit: 'm3', volume: 12, unitPrice: 5500000, progress: 70, isAddendum: false, startDate: getDateBetween(38), endDate: getDateBetween(45) },
        { id: 13, category: 'C. STRUKTUR ATAS', name: 'Balok & Ring Balk Lt.2', unit: 'm3', volume: 14, unitPrice: 5200000, progress: 50, isAddendum: false, startDate: getDateBetween(42), endDate: getDateBetween(50) },
        { id: 14, category: 'C. STRUKTUR ATAS', name: 'Tangga Beton', unit: 'unit', volume: 1, unitPrice: 35000000, progress: 60, isAddendum: false, startDate: getDateBetween(40), endDate: getDateBetween(48) },

        // D. DINDING - Significantly behind (Plan ~70%, Actual 35%) 🔴
        { id: 15, category: 'D. DINDING & PASANGAN', name: 'Pasangan Bata Ringan Lt.1', unit: 'm2', volume: 280, unitPrice: 180000, progress: 65, isAddendum: false, startDate: getDateBetween(32), endDate: getDateBetween(45) },
        { id: 16, category: 'D. DINDING & PASANGAN', name: 'Pasangan Bata Ringan Lt.2', unit: 'm2', volume: 220, unitPrice: 180000, progress: 25, isAddendum: false, startDate: getDateBetween(42), endDate: getDateBetween(55) },
        { id: 17, category: 'D. DINDING & PASANGAN', name: 'Plesteran & Acian Lt.1', unit: 'm2', volume: 560, unitPrice: 85000, progress: 30, isAddendum: false, startDate: getDateBetween(40), endDate: getDateBetween(55) },
        { id: 18, category: 'D. DINDING & PASANGAN', name: 'Plesteran & Acian Lt.2', unit: 'm2', volume: 440, unitPrice: 85000, progress: 10, isAddendum: false, startDate: getDateBetween(50), endDate: getDateBetween(65) },

        // E. ATAP - On schedule (Plan ~30%, Actual 35%) ✅
        { id: 19, category: 'E. ATAP', name: 'Rangka Atap Baja Ringan', unit: 'm2', volume: 200, unitPrice: 350000, progress: 60, isAddendum: false, startDate: getDateBetween(45), endDate: getDateBetween(55) },
        { id: 20, category: 'E. ATAP', name: 'Penutup Atap Genteng Metal', unit: 'm2', volume: 200, unitPrice: 180000, progress: 20, isAddendum: false, startDate: getDateBetween(50), endDate: getDateBetween(60) },
        { id: 21, category: 'E. ATAP', name: 'Lisplang & Talang', unit: 'm', volume: 80, unitPrice: 250000, progress: 0, isAddendum: false, startDate: getDateBetween(55), endDate: getDateBetween(65) },

        // F. LANTAI - Just started (Plan ~10%, Actual 10%) ✅
        { id: 22, category: 'F. LANTAI', name: 'Lantai Granit 60x60 Lt.1', unit: 'm2', volume: 150, unitPrice: 450000, progress: 15, isAddendum: false, startDate: getDateBetween(55), endDate: getDateBetween(70) },
        { id: 23, category: 'F. LANTAI', name: 'Lantai Granit 60x60 Lt.2', unit: 'm2', volume: 130, unitPrice: 450000, progress: 5, isAddendum: false, startDate: getDateBetween(60), endDate: getDateBetween(75) },
        { id: 24, category: 'F. LANTAI', name: 'Lantai Kamar Mandi', unit: 'm2', volume: 24, unitPrice: 350000, progress: 0, isAddendum: false, startDate: getDateBetween(58), endDate: getDateBetween(70) },

        // G. KUSEN - Not started (Plan 0%, Actual 0%) ✅
        { id: 25, category: 'G. KUSEN, PINTU & JENDELA', name: 'Kusen Aluminium', unit: 'ls', volume: 1, unitPrice: 45000000, progress: 0, isAddendum: false, startDate: getDateBetween(55), endDate: getDateBetween(70) },
        { id: 26, category: 'G. KUSEN, PINTU & JENDELA', name: 'Pintu Panel + Kaca', unit: 'unit', volume: 12, unitPrice: 3500000, progress: 0, isAddendum: false, startDate: getDateBetween(65), endDate: getDateBetween(80) },
        { id: 27, category: 'G. KUSEN, PINTU & JENDELA', name: 'Jendela Aluminium + Kaca', unit: 'unit', volume: 15, unitPrice: 2800000, progress: 0, isAddendum: false, startDate: getDateBetween(65), endDate: getDateBetween(80) },

        // H. PLAFON - Not started (Plan 0%, Actual 0%) ✅
        { id: 28, category: 'H. PLAFON', name: 'Rangka Plafon Metal Furing', unit: 'm2', volume: 280, unitPrice: 120000, progress: 0, isAddendum: false, startDate: getDateBetween(65), endDate: getDateBetween(80) },
        { id: 29, category: 'H. PLAFON', name: 'Plafon Gypsum 9mm', unit: 'm2', volume: 280, unitPrice: 95000, progress: 0, isAddendum: false, startDate: getDateBetween(75), endDate: getDateBetween(88) },

        // I. SANITAIR - Ahead of schedule! (Plan ~20%, Actual 50%) 🚀
        { id: 30, category: 'I. SANITAIR & PLUMBING', name: 'Instalasi Air Bersih', unit: 'ls', volume: 1, unitPrice: 25000000, progress: 70, isAddendum: false, startDate: getDateBetween(25), endDate: getDateBetween(75) },
        { id: 31, category: 'I. SANITAIR & PLUMBING', name: 'Instalasi Air Kotor & Septictank', unit: 'ls', volume: 1, unitPrice: 35000000, progress: 100, isAddendum: false, startDate: getDateBetween(20), endDate: getDateBetween(35) },
        { id: 32, category: 'I. SANITAIR & PLUMBING', name: 'Sanitary Ware (Closet, Wastafel)', unit: 'set', volume: 4, unitPrice: 8500000, progress: 0, isAddendum: false, startDate: getDateBetween(75), endDate: getDateBetween(90) },

        // J. ELEKTRIKAL - Slightly behind (Plan ~40%, Actual 30%) 🟠
        { id: 33, category: 'J. ELEKTRIKAL', name: 'Instalasi Listrik', unit: 'ttk', volume: 80, unitPrice: 450000, progress: 45, isAddendum: false, startDate: getDateBetween(35), endDate: getDateBetween(80) },
        { id: 34, category: 'J. ELEKTRIKAL', name: 'Panel Listrik & MCB', unit: 'ls', volume: 1, unitPrice: 15000000, progress: 0, isAddendum: false, startDate: getDateBetween(75), endDate: getDateBetween(90) },
        { id: 35, category: 'J. ELEKTRIKAL', name: 'Lampu & Saklar', unit: 'ls', volume: 1, unitPrice: 25000000, progress: 0, isAddendum: false, startDate: getDateBetween(85), endDate: getDateBetween(95) },

        // K. FINISHING - Not started (Plan 0%, Actual 0%) ✅
        { id: 36, category: 'K. FINISHING', name: 'Cat Dinding Interior', unit: 'm2', volume: 1000, unitPrice: 45000, progress: 0, isAddendum: false, startDate: getDateBetween(80), endDate: getDateBetween(95) },
        { id: 37, category: 'K. FINISHING', name: 'Cat Dinding Eksterior', unit: 'm2', volume: 400, unitPrice: 55000, progress: 0, isAddendum: false, startDate: getDateBetween(78), endDate: getDateBetween(92) },
        { id: 38, category: 'K. FINISHING', name: 'Railing Tangga Stainless', unit: 'm', volume: 12, unitPrice: 1500000, progress: 0, isAddendum: false, startDate: getDateBetween(85), endDate: getDateBetween(95) },
        { id: 39, category: 'K. FINISHING', name: 'Pagar & Gerbang', unit: 'ls', volume: 1, unitPrice: 45000000, progress: 0, isAddendum: false, startDate: getDateBetween(80), endDate: getDateBetween(95) },
        { id: 40, category: 'K. FINISHING', name: 'Carport & Taman', unit: 'ls', volume: 1, unitPrice: 35000000, progress: 0, isAddendum: false, startDate: getDateBetween(90), endDate: getDateBetween(100) },
    ];

    // Materials
    const materials = [
        { id: 1, name: 'Semen Tiga Roda 50kg', unit: 'sak', stock: 0, minStock: 20 },
        { id: 2, name: 'Pasir Cor', unit: 'm3', stock: 0, minStock: 5 },
        { id: 3, name: 'Split/Kerikil', unit: 'm3', stock: 0, minStock: 5 },
        { id: 4, name: 'Besi Beton 10mm', unit: 'btg', stock: 0, minStock: 50 },
        { id: 5, name: 'Besi Beton 12mm', unit: 'btg', stock: 0, minStock: 50 },
        { id: 6, name: 'Bata Ringan 10cm', unit: 'bh', stock: 0, minStock: 200 },
        { id: 7, name: 'Semen Mortar', unit: 'sak', stock: 0, minStock: 30 },
        { id: 8, name: 'Cat Dulux Interior', unit: 'pail', stock: 0, minStock: 5 },
    ];

    // Material Logs
    const materialLogs: any[] = [];
    const materialUsage = [
        { id: 1, totalIn: 850, totalOut: 850 },
        { id: 2, totalIn: 45, totalOut: 45 },
        { id: 3, totalIn: 35, totalOut: 35 },
        { id: 4, totalIn: 280, totalOut: 280 },
        { id: 5, totalIn: 180, totalOut: 180 },
        { id: 6, totalIn: 4500, totalOut: 4500 },
        { id: 7, totalIn: 120, totalOut: 120 },
        { id: 8, totalIn: 25, totalOut: 25 },
    ];

    materialUsage.forEach((m, idx) => {
        materialLogs.push({ id: Date.now() + idx * 2, materialId: m.id, date: getDateBetween(10 + idx * 5), type: 'in', quantity: m.totalIn, notes: 'Pembelian awal', actor: 'Pak Joko' });
        materialLogs.push({ id: Date.now() + idx * 2 + 1, materialId: m.id, date: getDateBetween(90 + idx), type: 'out', quantity: m.totalOut, notes: 'Pemakaian proyek', actor: 'Udin' });
    });

    // Attendance Logs
    const attendanceLogs: any[] = [];
    let currentDate = new Date(startDate);
    let logId = 1;

    while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0) {
            workers.forEach(w => {
                const rand = Math.random();
                let status = 'Hadir';
                if (rand > 0.95) status = 'Izin';
                else if (rand > 0.90) status = 'Sakit';
                else if (rand > 0.85) status = 'Lembur';

                attendanceLogs.push({
                    id: logId++,
                    date: formatDate(currentDate),
                    workerId: w.id,
                    status: status,
                    note: ''
                });
            });
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Task Logs
    const taskLogs: any[] = [];
    rabItems.forEach((item, idx) => {
        [25, 50, 75, 100].forEach((prog, pIdx) => {
            const progressDate = new Date(startDate);
            const itemDuration = (idx + 1) * 3 + pIdx * 2;
            progressDate.setDate(progressDate.getDate() + itemDuration);

            if (progressDate <= endDate) {
                taskLogs.push({
                    id: Date.now() + idx * 100 + pIdx,
                    date: formatDate(progressDate),
                    taskId: item.id,
                    previousProgress: prog - 25,
                    newProgress: prog,
                    note: prog === 100 ? 'Pekerjaan selesai' : `Update progress ${prog}%`
                });
            }
        });
    });

    // Transactions
    const transactions: any[] = [];
    let txId = 1;
    const totalRAB = rabItems.reduce((sum, item) => sum + (item.volume * item.unitPrice), 0);

    // Income
    const terminSchedule = [
        { percent: 30, date: getDateBetween(10), desc: 'Termin 1 - DP 30%' },
        { percent: 25, date: getDateBetween(40), desc: 'Termin 2 - Progress 25%' },
        { percent: 25, date: getDateBetween(70), desc: 'Termin 3 - Progress 25%' },
        { percent: 20, date: getDateBetween(100), desc: 'Termin 4 - Pelunasan 20%' },
    ];

    terminSchedule.forEach(t => {
        transactions.push({
            id: txId++,
            date: t.date,
            category: 'Termin/DP',
            description: t.desc,
            amount: Math.round(totalRAB * t.percent / 100),
            type: 'income'
        });
    });

    // Expenses
    for (let week = 0; week < 22; week++) {
        const weekDate = new Date(startDate);
        weekDate.setDate(weekDate.getDate() + week * 7);

        if (weekDate <= endDate) {
            const totalWeeklyWage = workers.reduce((sum, w) => sum + (w.realRate * 6), 0);
            transactions.push({
                id: txId++,
                date: formatDate(weekDate),
                category: 'Upah Tukang',
                description: `Gaji Minggu ke-${week + 1}`,
                amount: totalWeeklyWage,
                type: 'expense'
            });

            if (week < 16) {
                const materialCost = Math.round(30000000 + Math.random() * 50000000);
                transactions.push({
                    id: txId++,
                    date: formatDate(weekDate),
                    category: 'Material',
                    description: `Material Minggu ke-${week + 1}`,
                    amount: materialCost,
                    type: 'expense'
                });
            }

            if (week % 2 === 0) {
                transactions.push({
                    id: txId++,
                    date: formatDate(weekDate),
                    category: 'Operasional',
                    description: 'Transport & Operasional',
                    amount: Math.round(1500000 + Math.random() * 1000000),
                    type: 'expense'
                });
            }
        }
    }

    // Gallery Items - Updated for ongoing project
    const galleryItems = [
        { id: 1, imageUrl: '', caption: 'Pembersihan lahan awal', uploadedAt: getDateBetween(2), uploadedBy: 'Pak Joko', progress: 0 },
        { id: 2, imageUrl: '', caption: 'Pengukuran & bouwplank selesai', uploadedAt: getDateBetween(8), uploadedBy: 'Pak Joko', progress: 5 },
        { id: 3, imageUrl: '', caption: 'Galian pondasi', uploadedAt: getDateBetween(12), uploadedBy: 'Udin', progress: 10 },
        { id: 4, imageUrl: '', caption: 'Cor pondasi batu kali', uploadedAt: getDateBetween(20), uploadedBy: 'Pak Joko', progress: 18 },
        { id: 5, imageUrl: '', caption: 'Sloof dan kolom Lt.1 terpasang', uploadedAt: getDateBetween(28), uploadedBy: 'Budi', progress: 25 },
        { id: 6, imageUrl: '', caption: 'Struktur Lt.1 selesai', uploadedAt: getDateBetween(32), uploadedBy: 'Pak Joko', progress: 30 },
        { id: 7, imageUrl: '', caption: 'Progress dinding Lt.1', uploadedAt: getDateBetween(35), uploadedBy: 'Udin', progress: 33 },
    ];

    // Attendance Evidences
    const attendanceEvidences = [
        { id: 1, date: getDateBetween(5), photoUrl: '', location: '-6.1234,106.5678', uploader: 'Pak Joko', timestamp: getDateBetween(5) + 'T08:00:00' },
        { id: 2, date: getDateBetween(25), photoUrl: '', location: '-6.1234,106.5678', uploader: 'Pak Joko', timestamp: getDateBetween(25) + 'T08:00:00' },
        { id: 3, date: getDateBetween(33), photoUrl: '', location: '-6.1234,106.5678', uploader: 'Udin', timestamp: getDateBetween(33) + 'T08:00:00' },
    ];

    return {
        name: 'Rumah Mewah 2 Lantai - Villa Indah',
        client: 'Bpk. Ahmad Wijaya',
        location: 'Pondok Indah, Jakarta Selatan',
        ownerPhone: '6281234567890',
        status: 'Aktif',
        budgetLimit: 2200000000,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        rabItems,
        transactions,
        workers,
        materials,
        materialLogs,
        taskLogs,
        attendanceLogs,
        attendanceEvidences,
        galleryItems,
        isDeleted: false
    };
};

/**
 * Load demo data into Firestore
 */
export const loadDemoData = async (user: any, setIsSyncing: (v: boolean) => void) => {
    if (!user) return;
    setIsSyncing(true);

    try {
        const demo = generateDemoProject();
        await addDoc(collection(db, 'app_data', appId, 'projects'), demo);
        alert('Demo proyek lengkap berhasil dibuat! 🎉');
    } catch (e) {
        console.error('Failed to create demo project:', e);
        alert('Gagal membuat demo project');
    } finally {
        setIsSyncing(false);
    }
};
