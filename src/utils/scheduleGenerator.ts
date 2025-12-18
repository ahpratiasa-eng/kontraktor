
import type { Project, RABItem } from '../types';

// Standard construction phases order and approximate relative duration weight
// Higher weight = longer duration
const CATEGORY_LOGIC: Record<string, { order: number, minDurationWeight: number }> = {
    'persiapan': { order: 1, minDurationWeight: 0.05 },
    'tanah': { order: 2, minDurationWeight: 0.1 },
    'pondasi': { order: 3, minDurationWeight: 0.1 },
    'struktur': { order: 4, minDurationWeight: 0.25 },
    'atap': { order: 5, minDurationWeight: 0.1 }, // Atap naik dulu biar aman hujan
    'dinding': { order: 6, minDurationWeight: 0.15 },
    'kusen': { order: 7, minDurationWeight: 0.05 },
    'pintu': { order: 7, minDurationWeight: 0.05 },
    'jendela': { order: 7, minDurationWeight: 0.05 },
    'mekanikal': { order: 8, minDurationWeight: 0.05 }, // MEP Rough-in
    'elektrikal': { order: 8, minDurationWeight: 0.05 },
    'sanitair': { order: 8, minDurationWeight: 0.05 },
    'plafon': { order: 9, minDurationWeight: 0.05 }, // Plafon with 'd' dropped or matched
    'plafond': { order: 9, minDurationWeight: 0.05 },
    'lantai': { order: 10, minDurationWeight: 0.1 },
    'finishing': { order: 11, minDurationWeight: 0.1 },
    'pengecatan': { order: 11, minDurationWeight: 0.1 },
    'cat': { order: 11, minDurationWeight: 0.1 },
    'luar': { order: 12, minDurationWeight: 0.05 },
    'landscape': { order: 12, minDurationWeight: 0.05 },
    'lainnya': { order: 99, minDurationWeight: 0.05 },
};

const normalizeCategory = (cat: string): string => {
    return cat.toLowerCase().replace(/[^a-z]/g, '');
};

const findCategoryLogic = (categoryName: string) => {
    const normalized = normalizeCategory(categoryName);

    // Try exact match first
    for (const key in CATEGORY_LOGIC) {
        if (normalized.includes(key)) return CATEGORY_LOGIC[key];
    }

    return { order: 999, minDurationWeight: 0.05 }; // Default
};

// Productivity Standards based on "Realita (Target Mandor)"
// Unit: Daily Output per Team (1 Tukang + 1 Kenek)
// NOTE: These are Internal Targets (Optimistic). For Client Schedule, we apply a safety factor.
const MANDOR_TARGETS: Record<string, number> = {
    // A. PERSIAPAN
    'pembersihan': 45, 'lahan': 45,
    'bouwplank': 17,
    'bedeng': 5, 'gudang': 5,
    'pagar': 11,

    // B. TANAH
    'galian': 3.5, // Standard <= 1m
    'galian cadas': 1.7,
    'urugan pasir': 9,
    'urugan tanah': 7,
    'pemadatan': 45,

    // C. STRUKTUR
    'batu kali': 2.2,
    'aanstamping': 3.5, 'batu kosong': 3.5,
    'besi': 175, 'pembesian': 175, 'rakitan': 175,
    'bekisting sloof': 7, 'bekisting kolom': 7,
    'bekisting dak': 9, 'bekisting balok': 9,
    'cor': 4, 'beton': 4,
    'bongkar bekisting': 17,
    'wiremesh': 55,

    // D. DINDING
    'bata merah': 11,
    'hebel': 21, 'bata ringan': 21,
    'plester': 14, // Avg of Hebel(16.5) & Bata(13)
    'acian': 22,
    'keramik dinding': 7,
    'batu alam': 5,

    // E. LANTAI
    'rabat': 25, 'lantai kerja': 25,
    'keramik': 13, // 40x40, 50x50
    'granit': 13,
    'plint': 45,
    'step nosing': 12,

    // F. KUSEN
    'kusen': 7, // Aluminium/Wood avg
    'pintu': 3,
    'jendela': 4,
    'sealant': 45,
    'kunci': 9, 'handle': 9,

    // G. PLAFON
    'hollow': 17, 'rangka plafon': 17,
    'gypsum': 17, 'grc': 17,
    'kompon': 35,
    'list profil': 35,

    // H. PENGECATAN
    'cat dinding': 45, // Interior avg
    'cat eksterior': 30,
    'cat plafon': 35,
    'cat minyak': 13,
    'waterproofing': 35,

    // I. ATAP
    'baja ringan': 22,
    'genteng metal': 35,
    'genteng keramik': 13,
    'nok': 9, 'bubungan': 9,
    'lisplang': 17,

    // J. MEP
    'bobokan': 17,
    'pipa air': 20, 'pvc': 20,
    'kloset': 3, 'closet': 3,
    'wastafel': 3.5,
    'kran': 17, 'shower': 17,
    'lampu': 17, 'titik': 17,
    'saklar': 22, 'stopkontak': 22,

    // K. LAINNYA
    'railing': 5,
    'pagar besi': 3
};

const CLIENT_SAFETY_FACTOR = 0.85; // 85% of Mandor Speed for client safety

const GENERIC_UNIT_RATES: Record<string, number> = {
    'm2': 10,    // Conservative
    'm3': 3,
    'm': 12,
    'm\'': 12,
    'kg': 50,
    'ton': 0.1,
    'bh': 2,
    'unit': 2,
    'titik': 4,
    'ls': 0.2,
    'set': 1
};

export const getEstimatedTeamDays = (item: RABItem): number => {
    let rate = 0;
    const name = item.name.toLowerCase();
    const unit = item.unit?.toLowerCase().trim() || 'ls';

    // 1. Try Specific Keyword Matching first
    for (const key in MANDOR_TARGETS) {
        if (name.includes(key)) {
            rate = MANDOR_TARGETS[key] * CLIENT_SAFETY_FACTOR;
            break;
        }
    }

    // 2. Fallback to Generic Unit Rate
    if (rate === 0) {
        if (GENERIC_UNIT_RATES[unit]) {
            rate = GENERIC_UNIT_RATES[unit];
        } else if (unit.includes('m2') || unit.includes('m^2')) rate = 10;
        else if (unit.includes('m3')) rate = 3;
        else if (unit.includes('kg')) rate = 50;
        else rate = 4; // Fallback unknown
    }

    // Safety: prevent div by zero
    if (rate <= 0) rate = 1;

    // Duration = Volume / Rate
    return Math.max(1, Math.ceil(item.volume / rate));
};

interface ScheduleOptions {
    keepExisting?: boolean;
}

export const generateSmartSchedule = (project: Project, options: ScheduleOptions = {}): RABItem[] => {
    if (!project.rabItems || project.rabItems.length === 0) return [];

    const pStart = new Date(project.startDate).getTime();
    const pEnd = new Date(project.endDate).getTime();
    const totalDurationMs = pEnd - pStart;

    if (totalDurationMs <= 0) return project.rabItems;

    // 1. Group items by Category & Calculate Ideal Duration
    const groups: Record<string, RABItem[]> = {};
    const categoryIdealDays: Record<string, number> = {};
    let totalProjectIdealDays = 0;

    project.rabItems.forEach(item => {
        const cat = item.category || 'Tanpa Kategori';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(item);

        const itemDays = getEstimatedTeamDays(item);
        categoryIdealDays[cat] = (categoryIdealDays[cat] || 0) + itemDays;
        totalProjectIdealDays += itemDays;
    });

    // 2. Sort categories based on Sequence Logic (Standard Logic)
    // We still need the defined Sequence Order (Structure first, then Finishing), 
    // BUT the DURATION is now based on Volume, not arbitrary weight.
    const sortedCategories = Object.keys(groups).sort((a, b) => {
        const logicA = findCategoryLogic(a);
        const logicB = findCategoryLogic(b);
        if (logicA.order !== logicB.order) {
            return logicA.order - logicB.order;
        }
        return a.localeCompare(b);
    });

    // 3. Allocate Time Slots (Proportional to Ideal Days)
    // If calculated ideal < project duration, we stretch (float).
    // If calculated ideal > project duration, we compress (add resources/crash).

    let currentStartMs = pStart;
    const categorySlots: Record<string, { start: string, end: string }> = {};

    sortedCategories.forEach((cat, index) => {
        const idealDays = categoryIdealDays[cat] || 1;

        // Ratio based on TECHNICAL WORKLOAD (Volume), not Cost.
        const ratio = idealDays / totalProjectIdealDays;

        const durationMs = totalDurationMs * ratio;

        // Ensure at least 1 day if possible, but fit within total
        let startMs = currentStartMs;
        let endMs = startMs + durationMs;

        if (index === sortedCategories.length - 1) endMs = pEnd; // Snap last item to end

        categorySlots[cat] = {
            start: new Date(startMs).toISOString().split('T')[0],
            end: new Date(endMs).toISOString().split('T')[0]
        };

        currentStartMs = endMs;
    });

    // 4. Assign Dates
    const updatedItems: RABItem[] = [];

    project.rabItems.forEach(item => {
        if (options.keepExisting && item.startDate && item.endDate) {
            updatedItems.push(item);
            return;
        }

        const cat = item.category || 'Tanpa Kategori';
        const slot = categorySlots[cat];

        if (slot) {
            updatedItems.push({
                ...item,
                startDate: slot.start,
                endDate: slot.end
            });
        } else {
            updatedItems.push(item);
        }
    });

    updatedItems.sort((a, b) => a.id - b.id);
    return updatedItems;
};

export const getSchedulePreview = (project: Project): string[] => {
    if (!project.rabItems || project.rabItems.length === 0) return ["Tidak ada item RAB."];

    const pStart = new Date(project.startDate).getTime();
    const pEnd = new Date(project.endDate).getTime();
    const totalDurationMs = pEnd - pStart;
    const totalDaysProject = totalDurationMs / (1000 * 60 * 60 * 24);
    const totalWeeksProject = totalDaysProject / 7;

    if (totalDurationMs <= 0) return ["Durasi proyek tidak valid."];

    // Groups & Calc Logic
    const groups: Record<string, RABItem[]> = {};
    const categoryIdealDays: Record<string, number> = {};
    let totalProjectTeamDays = 0;

    project.rabItems.forEach(item => {
        const cat = item.category || 'Tanpa Kategori';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(item);
        const d = getEstimatedTeamDays(item);
        categoryIdealDays[cat] = (categoryIdealDays[cat] || 0) + d;
        totalProjectTeamDays += d;
    });

    const sortedCategories = Object.keys(groups).sort((a, b) => {
        const logicA = findCategoryLogic(a);
        const logicB = findCategoryLogic(b);
        return logicA.order - logicB.order;
    });

    // Worker Calculation
    // Total Man-Days = Total Team-Days * 2 (Assuming 1 Team = 2 People: Tukang + Kenek)
    // Avg Daily Teams = Total Team-Days / Total Project Duration
    const totalManDays = totalProjectTeamDays * 2;
    const avgDailyTeams = totalProjectTeamDays / totalDaysProject;
    const recommendedWorkers = Math.ceil(avgDailyTeams * 2);

    const report: string[] = [];

    report.push(`Total Durasi Proyek: ${Math.ceil(totalWeeksProject)} Minggu (${Math.ceil(totalDaysProject)} Hari)`);
    report.push(`Total Beban Kerja: ${totalProjectTeamDays} Hari-Tim (${totalManDays} Hari-Orang)`);
    report.push(`REKOMENDASI TENAGA KERJA: ± ${recommendedWorkers} Orang / Hari (Rata-rata)\n`);
    report.push("Rincian Alokasi & Kebutuhan (Per Kategori Pekerjaan):");

    sortedCategories.forEach(cat => {
        const idealDays = categoryIdealDays[cat];
        const ratio = idealDays / totalProjectTeamDays;

        // Convert ratio to Actual Project Weeks & Days
        const allocatedWeeks = totalWeeksProject * ratio;
        const allocatedDays = allocatedWeeks * 7;

        // Calculate Teams Needed to finish 'idealDays' of work within 'allocatedDays'
        // Teams = idealDays / allocatedDays
        // Example: 7 days work / 2.8 days duration = 2.5 teams
        const teamsNeeded = idealDays / (allocatedDays || 1);

        // Format the output
        let teamInfo = "";
        if (teamsNeeded < 1) {
            // Part time or small team
            teamInfo = `Cukup 1 Tim (Kerja Santai / Part-time)`;
        } else {
            const teamCount = Math.round(teamsNeeded * 10) / 10; // Round to 1 decimal
            const personCount = Math.ceil(teamsNeeded * 2);
            teamInfo = `Butuh ± ${teamCount} Tim (${personCount} Orang)`;
        }

        report.push(`- ${cat}: ±${allocatedWeeks.toFixed(1)} Minggu (Load: ${idealDays} Hari-Tim) -> ${teamInfo}`);
    });

    report.push("\nCatatan:\n1. Estimasi tenaga kerja mengasumsikan produktivitas standar (1 Tim = 2 Orang).\n2. Jika durasi proyek dipercepat, jumlah tukang harus ditambah.");

    return report;
};
