import { firebaseConfig, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { RABItem, Project } from '../types';
import { getEstimatedTeamDays } from './scheduleGenerator';

const API_KEY = firebaseConfig.apiKey;
const MODEL = "gemini-3-flash-preview";

interface AIResponseItem {
    id: number;
    startDate: string;
    endDate: string;
    reasoning: string;
}

// Cache for Firestore API keys to avoid repeated reads
let cachedFirestoreKeys: string[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60000; // 1 minute cache

// Helper: Get API Keys from Firestore
export const getFirestoreApiKeys = async (): Promise<string[]> => {
    // Use cache if fresh
    if (cachedFirestoreKeys && Date.now() - cacheTimestamp < CACHE_DURATION) {
        return cachedFirestoreKeys;
    }

    try {
        const docRef = doc(db, 'settings', 'apiKeys');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            cachedFirestoreKeys = data.keys || [];
            cacheTimestamp = Date.now();
            return cachedFirestoreKeys || [];
        }
    } catch (error) {
        console.warn('Failed to fetch API keys from Firestore:', error);
    }
    return [];
};

// Helper: Save API Keys to Firestore
export const saveApiKeysToFirestore = async (keys: string[]): Promise<void> => {
    try {
        const docRef = doc(db, 'settings', 'apiKeys');
        await setDoc(docRef, { keys, updatedAt: new Date().toISOString() });
        cachedFirestoreKeys = keys;
        cacheTimestamp = Date.now();
    } catch (error) {
        console.error('Failed to save API keys to Firestore:', error);
        throw error;
    }
};

// Helper: Add single API Key to Firestore
export const addApiKeyToFirestore = async (key: string): Promise<void> => {
    const existingKeys = await getFirestoreApiKeys();
    if (existingKeys.length >= 3) {
        throw new Error('Maksimal 3 API Keys');
    }
    if (existingKeys.includes(key)) {
        throw new Error('API Key sudah ada');
    }
    await saveApiKeysToFirestore([...existingKeys, key]);
};

// Helper: Clear all API Keys from Firestore
export const clearApiKeysFromFirestore = async (): Promise<void> => {
    await saveApiKeysToFirestore([]);
};

// Legacy localStorage functions (kept for backward compatibility)
const getLocalStorageKeys = (): string[] => {
    const stored = localStorage.getItem('GEMINI_API_KEYS');
    if (stored) {
        try {
            return JSON.parse(stored).filter((k: string) => k && k.trim());
        } catch { return []; }
    }
    return [];
};

// Helper: Get current key index
const getCurrentKeyIndex = (): number => {
    return parseInt(localStorage.getItem('GEMINI_KEY_INDEX') || '0', 10);
};

// Helper: Rotate to next key
const rotateToNextKey = (keysCount: number): number => {
    let nextIndex = (getCurrentKeyIndex() + 1) % keysCount;
    localStorage.setItem('GEMINI_KEY_INDEX', nextIndex.toString());
    console.log(`🔄 Rotating to API Key #${nextIndex + 1}`);
    return nextIndex;
};

// Helper: Get current API Key (Firestore first, then localStorage, then env)
const getApiKey = async (): Promise<string> => {
    // 1. Priority: Firestore keys
    const firestoreKeys = await getFirestoreApiKeys();
    if (firestoreKeys.length > 0) {
        const idx = getCurrentKeyIndex() % firestoreKeys.length;
        return firestoreKeys[idx];
    }

    // 2. Fallback: localStorage keys
    const localKeys = getLocalStorageKeys();
    if (localKeys.length > 0) {
        const idx = getCurrentKeyIndex() % localKeys.length;
        return localKeys[idx];
    }

    // 3. Fallback: Env Var
    if (import.meta.env.VITE_GEMINI_API_KEY) {
        return import.meta.env.VITE_GEMINI_API_KEY;
    }

    // 4. Last resort: Firebase Config
    return API_KEY;
};

// Exported functions for UI (backward compatible)
export const addApiKey = async (key: string): Promise<void> => {
    await addApiKeyToFirestore(key);
};

export const getStoredApiKeys = async (): Promise<string[]> => {
    return await getFirestoreApiKeys();
};

export const clearApiKeys = async (): Promise<void> => {
    await clearApiKeysFromFirestore();
};

// Helper: Call Gemini API with Auto-Rotation on Quota Exceeded
const callGemini = async (prompt: string, expectJson: boolean = true, retryCount: number = 0): Promise<string> => {
    const key = await getApiKey();
    if (!key) throw new Error("API Key not found. Tambahkan API Key di Settings.");

    const generationConfig: any = {
        temperature: 0.2,
        maxOutputTokens: 8192,
    };

    if (expectJson) {
        generationConfig.responseMimeType = "application/json";
    }

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: generationConfig
            })
        }
    );

    const data = await response.json();

    // Handle Quota Exceeded - Auto Rotate
    if (data.error) {
        const errMsg = data.error.message || '';
        const isQuotaError = errMsg.includes('quota') || errMsg.includes('rate') || data.error.code === 429;
        const allKeys = await getFirestoreApiKeys();

        if (isQuotaError && retryCount < allKeys.length) {
            console.warn(`⚠️ Key #${getCurrentKeyIndex() + 1} quota exceeded. Trying next key...`);
            rotateToNextKey(allKeys.length);
            return callGemini(prompt, expectJson, retryCount + 1); // Retry with next key
        }

        if (data.error.message.includes('blocked') || data.error.message.includes('API key not valid') || data.error.code === 403) {
            throw new Error("API_BLOCKED");
        }
        throw new Error(data.error.message || "Unknown API Error");
    }

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error("No AI Data");
    }
    return data.candidates[0].content.parts[0].text;
};







// 1. Generate Schedule
export const generateScheduleWithGemini = async (
    project: Project,
    items: RABItem[]
): Promise<RABItem[]> => {
    if (!items || items.length === 0) return [];

    const simpleItems = items.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        volume: item.volume,
        unit: item.unit
    }));

    const prompt = `
SYSTEM ROLE: Senior Construction Project Manager & Data Architect.
OUTPUT FORMAT: Pure JSON Array only. No markdown. No explanations.

CONTEXT:
Project: "${project.name}" (${project.startDate} - ${project.endDate})
Items: ${JSON.stringify(simpleItems)}

TASK:
Generate a construction timeline for the items above.

STRICT RULES:
1. Return ONLY a valid JSON Array.
2. Dates must be YYYY-MM-DD.
3. Total duration must be within project start/end dates.
4. Logic: Foundation -> Structure -> Roof -> MEP -> Finishing.

EXAMPLE RESPONSE:
[
  { "id": 123, "startDate": "2024-01-01", "endDate": "2024-01-05" },
  { "id": 124, "startDate": "2024-01-06", "endDate": "2024-01-10" }
]
    `;

    try {
        const textOutput = await callGemini(prompt);
        console.log("🤖 AI Raw Output:", textOutput); // DEBUGGING

        // Robust JSON Parsing
        const jsonStart = textOutput.indexOf('[');
        const jsonEnd = textOutput.lastIndexOf(']');

        if (jsonStart === -1 || jsonEnd === -1) {
            console.error("AI Response invalid:", textOutput);
            throw new Error("Invalid AI Format (No JSON array found in response)");
        }

        const jsonStr = textOutput.substring(jsonStart, jsonEnd + 1);
        const scheduleData: AIResponseItem[] = JSON.parse(jsonStr);

        const updatedItems = items.map(item => {
            const aiData = scheduleData.find(d => d.id === item.id);
            return aiData ? { ...item, startDate: aiData.startDate, endDate: aiData.endDate } : item;
        });

        updatedItems.sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());
        return updatedItems;
    } catch (e) {
        console.error("Gemini Schedule Error:", e);
        throw e;
    }
};

// 2. Generate Manpower & Timeline Analysis
export const generateAnalysisWithGemini = async (project: Project, items: RABItem[], context: string = ''): Promise<string> => {
    // 1. Calculate System Estimates (Group by Category) to give Context to AI
    const categories: Record<string, RABItem[]> = {};
    items.forEach(i => {
        const cat = i.category || 'Uncategorized';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(i);
    });

    let manpowerSummary = "";
    Object.entries(categories).forEach(([cat, catItems]) => {
        // Calculate Total Man-Days required (Assuming 1 Team = 2 People standard)
        const totalManDays = catItems.reduce((sum, item) => {
            const idealDays = getEstimatedTeamDays(item); // Days for 1 team
            return sum + (idealDays * 2);
        }, 0);

        // Calculate Scheduled Duration for this Category
        const startTimes = catItems.map(i => i.startDate ? new Date(i.startDate).getTime() : 0).filter(t => t > 0);
        const endTimes = catItems.map(i => i.endDate ? new Date(i.endDate).getTime() : 0).filter(t => t > 0);

        let estPeople = 0;
        if (startTimes.length > 0 && endTimes.length > 0) {
            const minStart = Math.min(...startTimes);
            const maxEnd = Math.max(...endTimes);
            const durationDays = Math.max(1, (maxEnd - minStart) / (1000 * 60 * 60 * 24));
            estPeople = Math.ceil(totalManDays / durationDays);
        } else {
            // Fallback if no dates: Assume 1 week per item avg?
            estPeople = 2;
        }

        manpowerSummary += `- ${cat}: Estimasi rata-rata ${estPeople} Orang (Berdasarkan jadwal user)\n`;
    });

    const prompt = `
    PERAN: Anda adalah Mandor Senior yang MENDUKUNG dan MENJELASKAN keputusan penjadwalan yang sudah dibuat.
    TUGAS: Jelaskan ALASAN TEKNIS kenapa jumlah tenaga kerja per kategori sudah TEPAT dan EFISIEN.
    
    KONTEKS PROYEK:
    - Nama: ${project.name}
    - Lokasi: ${project.location || "Indonesia"}
    
    KEBUTUHAN TENAGA KERJA (SUDAH DIHITUNG SISTEM):
    ${manpowerSummary}

    ${context ? `CATATAN LAPANGAN: "${context}"` : ''}

    ATURAN PENTING:
    - JANGAN mengkritik atau menyalahkan angka di atas. Angka tersebut SUDAH BENAR.
    - Tugas Anda adalah MENJELASKAN kenapa angka tersebut masuk akal dari sisi teknis konstruksi.
    - Berikan penjelasan yang meyakinkan kepada klien/pemilik proyek.

    OUTPUT (Bahasa Indonesia, Nada POSITIF dan PROFESIONAL):
    Untuk setiap kategori, jelaskan secara singkat:
    - Komposisi tim (misal: 1 Tukang Batu + 1 Kenek + 1 Laden).
    - Kenapa jumlah tersebut optimal untuk jenis pekerjaan itu.
    - Keuntungan menggunakan tim dengan ukuran tersebut (efisiensi, koordinasi, dll).

    Format output: Poin-poin ringkas per kategori. Maksimal 2-3 kalimat per kategori.
    `;

    return await callGemini(prompt, false);
};

// 3. Generate Risk Assessment
export const generateRiskReportWithGemini = async (project: Project, items: RABItem[], context: string = ''): Promise<string> => {
    const prompt = `
    PERAN: Ahli Manajemen Risiko Konstruksi.
    PROYEK: ${project.name}
    LOKASI: ${project.location || "Indonesia"} (Perhatikan iklim/cuaca)
    DATA: ${JSON.stringify(items.map(i => i.name).slice(0, 50))}... (Sampel item)

    ${context ? `INFO KONDISI LAPANGAN DARI USER: "${context}"` : ''}

    OUTPUT (Bahasa Indonesia, Plain Text, Poin-poin):
    1. 🌩️ RISIKO CUACA & LOKASI: Apa dampak hujan/panas/akses ke proyek ini?
    2. 🛠️ RISIKO TEKNIS: Item pekerjaan mana yang paling rawan salah kerja/bongkar ulang?
    3. 🛡️ MITIGASI: Langkah pencegahan konkret.

    Langsung ke poin utama.
    `;

    return await callGemini(prompt, false);
};

// 4. Generate General Executive Summary (Header)
export const generateExecutiveSummary = async (project: Project, items: RABItem[], context: string = ''): Promise<string> => {
    const simpleItems = items.map(item => ({
        name: item.name,
        category: item.category,
        start: item.startDate,
        end: item.endDate,
        progress: item.progress
    }));

    const prompt = `
    PERAN: Konsultan Manajemen Proyek Senior.
    TUGAS: Berikan Ringkasan Eksekutif (Executive Summary) status proyek saat ini.
    
    DATA PROYEK:
    - Nama: ${project.name}
    - Lokasi: ${project.location || "Indonesia"}
    - Progress: ${simpleItems.filter(i => (i.progress || 0) === 100).length} / ${simpleItems.length} Item Selesai.
    - Timeline: ${project.startDate} s/d ${project.endDate}

    ${context ? `CATATAN PENTING USER: "${context}"` : ''}

    OUTPUT (Format Narasi Bisnis Ringkas, Bahasa Indonesia):
    1. 📌 STATUS KESEHATAN PROYEK:
       - Apakah jadwal realistis secara umum?
       - Apa risiko utama timeline saat ini?
    
    2. 🚀 STRATEGI EKSEKUTIF (High Level):
       - Saran manajemen global untuk menjaga ritme.
    
    3. 🏁 SIMPULAN:
       - Kalimat penutup yang memberi kepercayaan diri pada klien/pemilik.
    
    Gunakan nada optimis namun waspada (Professional Advisory). Hindari membahas detail jumlah tukang per item (karena itu ada di menu terpisah).
    `;

    return await callGemini(prompt, false);
};
