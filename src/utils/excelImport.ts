import * as XLSX from 'xlsx';
import type { RABItem } from '../types';

export const getExcelSheets = (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                resolve(workbook.SheetNames);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
};

export const parseRABExcel = (file: File, sheetName?: string): Promise<RABItem[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });

                // STRATEGY: Use selected sheet OR Find the best sheet
                let selectedSheet = sheetName;
                if (!selectedSheet) {
                    selectedSheet = workbook.SheetNames.find(s =>
                        s.toUpperCase().includes('RAB') ||
                        s.toUpperCase().includes('BOQ') ||
                        s.toUpperCase().includes('BUDGET')
                    );
                    if (!selectedSheet) selectedSheet = workbook.SheetNames[0];
                }

                console.log(`[Import] Using sheet: ${selectedSheet}`);
                const sheet = workbook.Sheets[selectedSheet];

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
                    const row = rows[i].map(c => String(c).toUpperCase().trim());

                    const no = row.findIndex(c => c === 'NO' || c === 'NOMOR' || c === 'NO.');
                    const n = row.findIndex(c => c.includes('URAIAN') || c.includes('PEKERJAAN') || c.includes('ITEM') || c === 'NAME' || c === 'NAMA');
                    const v = row.findIndex(c => c === 'VOL' || c.includes('VOLUME') || c.includes('QTY') || c.includes('JUMLAH') || c === 'V' || c === 'VOL.');

                    // Priority for Unit: 'SAT' or 'UNIT'
                    // Avoid matching "HARGA SATUAN" as Unit
                    const u = row.findIndex(c => (c.includes('SAT') || c.includes('UNIT')) && !c.includes('HARGA') && !c.includes('TOTAL'));

                    // Priority for Price: 'HARGA' or 'PRICE' or 'UPAH'
                    // Look for "HARGA SATUAN" specifically if possible, otherwise just "HARGA"
                    // But avoid "TOTAL HARGA" if we can find "HARGA SATUAN"
                    let p = row.findIndex(c => (c.includes('HARGA') && c.includes('SAT')) || c.includes('UNIT PRICE') || c === 'PRICE');
                    if (p === -1) {
                        p = row.findIndex(c => (c.includes('HARGA') || c.includes('UPAH') || c === 'PRICE') && !c.includes('TOTAL') && !c.includes('JASA'));
                    }

                    if (n !== -1 && v !== -1) {
                        noIdx = no !== -1 ? no : 0;
                        nameIdx = n;
                        volIdx = v;
                        unitIdx = u !== -1 ? u : -1;
                        priceIdx = p !== -1 ? p : -1;
                        startRow = i + 1;
                        console.log(`[Import] Header found at row ${i + 1}: No=${noIdx}, Name=${nameIdx}, Vol=${volIdx}, Unit=${unitIdx}, Price=${priceIdx}`);
                        break;
                    }
                }

                // 2. FALLBACK (Only if header detection failed completely)
                if (nameIdx === -1) {
                    console.warn("[Import] Header not found, using fallback columns.");
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
                let isRomanContext = false; // Flag to track if we are inside a Roman numeral parent (I, II, III)

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
                    // Header detected if no volume/price OR explicitly looks like a header (Roman numeral only row)
                    const isHeader = (volume === 0 || !volRaw) && price === 0;

                    if (isHeader) {
                        // Check labeling style
                        const isRoman = /^[IVX]+$/.test(noRaw);
                        const isAlpha = /^[A-Z]$/.test(noRaw);
                        const isNumeric = /^\d+$/.test(noRaw);

                        if (isRoman) {
                            // LEVEL 1: Roman Numeral (I, II, III)
                            isRomanContext = true;
                            if (name.startsWith(`${noRaw}.`)) {
                                mainCategory = name;
                            } else {
                                mainCategory = `${noRaw}. ${name}`;
                            }
                            // Normalize dot spacing: "I.PEKERJAAN" -> "I. PEKERJAAN"
                            mainCategory = mainCategory.replace(/^([IVX]+\.)(?!\s)/, '$1 ');
                            subCategory = ''; // Reset sibling subcategory
                        }
                        else if (isAlpha && isRomanContext) {
                            // LEVEL 2: Alpha under Roman (A, B, C under I, II)
                            if (name.startsWith(`${noRaw}.`)) {
                                subCategory = name;
                            } else {
                                subCategory = `${noRaw}. ${name}`;
                            }
                            // Normalize: "A.PEKERJAAN" -> "A. PEKERJAAN"
                            subCategory = subCategory.replace(/^([A-Z]+\.)(?!\s)/, '$1 ');
                        }
                        else if (isAlpha && !isRomanContext && mainCategory === 'Info Umum') {
                            // LEVEL 1 (Fallback): Alpha as main if no Roman context yet (A, B, C)
                            if (name.startsWith(`${noRaw}.`)) {
                                mainCategory = name;
                            } else {
                                mainCategory = `${noRaw}. ${name}`;
                            }
                            mainCategory = mainCategory.replace(/^([A-Z]+\.)(?!\s)/, '$1 ');
                            subCategory = '';
                        }
                        else if (isNumeric && name.length > 5) {
                            // NEW: Numeric subcategory (1, 2, 3) - treat as subcategory if name is substantial
                            // This handles cases like "2. Pekerjaan Pasang Granit Lantai"
                            if (name.startsWith(`${noRaw}.`)) {
                                subCategory = name;
                            } else {
                                subCategory = `${noRaw}. ${name}`;
                            }
                            // Normalize: "2.PEKERJAAN" -> "2. PEKERJAAN"
                            subCategory = subCategory.replace(/^(\d+\.)(?!\s)/, '$1 ');
                            console.log(`[Import] Numeric subcategory detected: ${subCategory}`);
                        }
                        else if (mainCategory === 'Info Umum' && name.length > 3 && !isNumeric) {
                            // Fallback for unlabeled headers
                            mainCategory = name;
                        }
                        // Note: If isNumeric (1, 2, 3), usually it's just an item list header or noise, ignore as category unless very specific
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
