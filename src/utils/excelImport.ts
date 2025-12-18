import * as XLSX from 'xlsx';
import type { RABItem } from '../types';

export const parseRABExcel = (file: File): Promise<RABItem[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });

                // STRATEGY: Find the best sheet
                let sheetName = workbook.SheetNames.find(s =>
                    s.toUpperCase().includes('RAB') ||
                    s.toUpperCase().includes('BOQ') ||
                    s.toUpperCase().includes('BUDGET')
                );

                if (!sheetName) sheetName = workbook.SheetNames[0];
                console.log(`[Import] Using sheet: ${sheetName}`);
                const sheet = workbook.Sheets[sheetName];

                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];

                if (!rows || rows.length === 0) {
                    throw new Error("Sheet kosong atau format Excel tidak didukung.");
                }

                const items: RABItem[] = [];

                // Column Mapping Detection Rules
                let noIdx = 0; // Default NO column
                let nameIdx = -1;
                let unitIdx = -1;
                let volIdx = -1;
                let priceIdx = -1;
                let startRow = 0;

                // 1. Try to find header by keywords
                for (let i = 0; i < Math.min(rows.length, 25); i++) {
                    const row = rows[i].map(c => String(c).toUpperCase());

                    const no = row.findIndex(c => c === 'NO' || c === 'NOMOR');
                    const n = row.findIndex(c => c.includes('URAIAN') || c.includes('PEKERJAAN') || c.includes('ITEM'));
                    const v = row.findIndex(c => c === 'VOL' || c.includes('VOLUME') || c.includes('QTY') || c.includes('JUMLAH'));
                    const u = row.findIndex(c => c.includes('SAT') || c.includes('UNIT'));
                    const p = row.findIndex(c => c.includes('HARGA') || c.includes('UPAH'));

                    if (n !== -1 && v !== -1) {
                        noIdx = no !== -1 ? no : 0;
                        nameIdx = n;
                        volIdx = v;
                        unitIdx = u !== -1 ? u : -1;
                        priceIdx = p !== -1 ? p : -1;
                        startRow = i + 1;
                        console.log(`Header found: No=${noIdx}, Name=${n}, Vol=${v}`);
                        break;
                    }
                }

                // 2. FALLBACK
                if (nameIdx === -1) {
                    noIdx = 0; // Col A
                    nameIdx = 1; // Col B
                    unitIdx = 4; // Col E
                    volIdx = 5;  // Col F
                    priceIdx = 6; // Col G
                    startRow = 6;
                }

                const parseNumber = (val: any): number => {
                    if (typeof val === 'number') return val;
                    if (!val) return 0;
                    let str = String(val).trim();
                    if (str === '-' || str === '') return 0;
                    str = str.replace(/Rp\.?\s?/gi, '').replace(/IDR\s?/gi, '');
                    const hasDot = str.includes('.');
                    const hasComma = str.includes(',');
                    if (hasDot && hasComma) {
                        str = str.replace(/\./g, '').replace(/,/g, '.');
                    } else if (hasDot && !hasComma) {
                        if (/^\d{1,3}(\.\d{3})+$/.test(str)) str = str.replace(/\./g, '');
                    } else if (!hasDot && hasComma) {
                        str = str.replace(/,/g, '.');
                    }
                    const res = parseFloat(str);
                    return isNaN(res) ? 0 : res;
                };

                let idCounter = 1;
                let mainCategory = 'Info Umum';
                let subCategory = '';

                for (let i = startRow; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row || row.length === 0) continue;

                    let noRaw = row[noIdx] ? String(row[noIdx]).trim() : '';
                    if (noRaw.endsWith('.')) noRaw = noRaw.slice(0, -1); // "A." -> "A"

                    const nameRaw = row[nameIdx];
                    if (!nameRaw || String(nameRaw).trim().length < 2) continue;

                    let name = String(nameRaw).trim();
                    const nameUp = name.toUpperCase();
                    if (nameUp.startsWith('SUB TOTAL') || nameUp.startsWith('TOTAL') || nameUp.startsWith('GRAND') || nameUp.includes('PPN')) continue;
                    if (nameUp.startsWith('DIBUAT') || nameUp.startsWith('DISETUJUI')) continue;

                    const volRaw = row[volIdx];
                    const priceRaw = priceIdx !== -1 ? row[priceIdx] : 0;
                    const unitRaw = unitIdx !== -1 ? row[unitIdx] : 'ls';

                    const volume = parseNumber(volRaw);
                    const price = parseNumber(priceRaw);

                    // LOGIC: Hierarki Kategori
                    // Header detected if no volume/price
                    const isHeader = (volume === 0 || !volRaw) && price === 0;

                    if (isHeader) {
                        // Check if Main Category (A, B, C or I, II, III)
                        const hasMainNumbering = /^[A-Z]$/.test(noRaw) || /^[IVX]+$/.test(noRaw);

                        if (hasMainNumbering) {
                            // Combine Number + Name -> "A. PEKERJAAN PERSIAPAN"
                            if (name.startsWith(`${noRaw}.`)) {
                                mainCategory = name;
                            } else {
                                mainCategory = `${noRaw}. ${name}`;
                            }
                            // Normalize dot spacing: "A.PEKERJAAN" -> "A. PEKERJAAN"
                            mainCategory = mainCategory.replace(/^([A-Z0-9IVX]+\.)(?!\s)/, '$1 ');

                            subCategory = ''; // Reset sub
                        }
                        else if (mainCategory === 'Info Umum' && name.length > 3) {
                            mainCategory = name;
                        }
                        else {
                            if (name.length > 2) {
                                // SUB CATEGORY DETECTED
                                // Strategy: Add invisible sorting prefix using Row Index to preserve Excel order
                                // Format: "000ROW||RealName"
                                // This ensures sorting works but we can strip it in UI
                                const sortPrefix = String(i).padStart(5, '0');
                                subCategory = `${sortPrefix}||${name}`;
                            }
                        }
                        continue;
                    }

                    // Item Processing
                    if (volume > 0) {
                        const finalCategory = subCategory
                            ? `${mainCategory} - ${subCategory}`
                            : mainCategory;

                        // CLEAN NAME: Remove numbering (1. Item -> Item)
                        // But carefully, don't remove if it looks like specification (e.g. "Diameter 12")
                        let cleanName = name;
                        // Regex matches "1. " or "1 " at start
                        if (/^\d+[\.\)]\s+/.test(cleanName)) {
                            cleanName = cleanName.replace(/^\d+[\.\)]\s+/, '');
                        }

                        items.push({
                            id: idCounter++,
                            category: finalCategory,
                            name: cleanName,
                            unit: String(unitRaw || 'ls').trim(),
                            volume: volume,
                            unitPrice: price,
                            progress: 0,
                            isAddendum: false
                        });
                    }
                }

                if (items.length === 0) {
                    throw new Error("Tidak ada item pekerjaan yang terdeteksi.");
                }

                resolve(items);
            } catch (error) {
                console.error("[ExcelImport] Error:", error);
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
};
