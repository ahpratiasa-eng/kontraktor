import XLSX from 'xlsx';
import fs from 'fs';

// Load Excel
console.log("Loading AHSP.xlsx...");
const wb = XLSX.readFile('AHSP.xlsx');

// --- PART 1: PARSE SUMBER DAYA DASAR (SHEET 0) ---
console.log("Parsing Sumber Daya Dasar...");
const resources = [];
const shdSheet = wb.Sheets[wb.SheetNames[0]];
const shdData = XLSX.utils.sheet_to_json(shdSheet, { header: 1 });

// Cari header row dulu (biasanya ada 'No', 'Uraian', 'Satuan', 'Harga')
let headerRowIdx = -1;
for (let i = 0; i < 20; i++) {
    const row = shdData[i];
    if (row && row.some(cell => String(cell).toLowerCase().includes('uraian'))) {
        headerRowIdx = i;
        break;
    }
}

if (headerRowIdx !== -1) {
    let currentCategory = 'UMUM';
    // Mapping kolom: [No, Uraian, Kode, Satuan, Harga, Ket] 
    // Format bisa beda2 dikit, kita cari index kolomnya
    const header = shdData[headerRowIdx].map(x => String(x).toLowerCase());
    const idxName = header.findIndex(h => h.includes('uraian'));
    const idxUnit = header.findIndex(h => h.includes('satuan'));
    const idxPrice = header.findIndex(h => h.includes('harga'));
    const idxCode = header.findIndex(h => h.includes('kode'));

    for (let i = headerRowIdx + 1; i < shdData.length; i++) {
        const row = shdData[i];
        if (!row || row.length === 0) continue;

        const name = row[idxName];
        if (!name) continue;

        // Detect Sub-Header (kategori) - usually bold or only name filled
        // Simplifikasi: Kalau kolom harga kosong tapi nama ada, anggap kategori
        const price = parseFloat(row[idxPrice]);
        if (!price && !row[idxUnit] && String(name).length > 3) {
            currentCategory = String(name).replace(/^\d+[\.\)]\s*/, '').trim().toUpperCase();
            continue;
        }

        if (price > 0) {
            let type = 'bahan';
            // Guess type from category or unit
            const catLower = currentCategory.toLowerCase();
            const unitLower = String(row[idxUnit] || '').toLowerCase();

            if (catLower.includes('upah') || catLower.includes('tenaga') || unitLower === 'oh' || unitLower === 'jam') {
                type = 'upah';
            } else if (catLower.includes('alat') || catLower.includes('sewa')) {
                type = 'alat';
            }

            resources.push({
                id: `res_${i}`,
                name: String(name).trim(),
                unit: String(row[idxUnit] || 'ls').trim(),
                price: price,
                type: type,
                category: currentCategory,
                source: 'AHSP 2024'
            });
        }
    }
}
console.log(`Parsed ${resources.length} base resources.`);
fs.writeFileSync('src/data/defaultResources.json', JSON.stringify(resources, null, 2));


// --- PART 2: PARSE AHS (SHEET 2 onwards) ---
console.log("Parsing AHS...");
const allAHS = [];
const categoryLetters = 'ABCDEFGHIJKLMNOPQRSTUVW';

// Helper to detect work item (AHS Header)
// Improved regex to catch "1 m2", "1m2", "1 m'", "1 buah", "1 titik", etc.
const isAHSHeader = (str) => {
    if (!str || str.length < 15) return false;
    const s = str.toLowerCase();
    return (
        /pembuatan\s+\d/.test(s) ||
        /pemasangan\s+\d/.test(s) ||
        /penggalian\s+\d/.test(s) ||
        /pengurugan\s+\d/.test(s) ||
        /pembongkaran\s+\d/.test(s) ||
        /pengecatan\s+\d/.test(s) ||
        /pembersihan\s+/.test(s) ||
        /\d\s*m[23']/.test(s) // catches "1 m2", "1m3"
    );
};

// Skip sheet 0 (SHD) and 1 (Analysis intro usually)
// But we check content to be sure. Usually AHS sheets start from index 2 ("Pekerjaan Persiapan")
const ahsSheets = wb.SheetNames.slice(2);

ahsSheets.forEach((sheetName, sIdx) => {
    // Filter sheet name if needed
    if (sheetName.toLowerCase().includes('sheet')) return;

    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

    // Find Headers
    const itemIndices = [];
    data.forEach((row, idx) => {
        if (row && row[0] && isAHSHeader(String(row[0]))) {
            itemIndices.push(idx);
        }
    });

    // If no explicit headers found but lots of rows, maybe it's one big items list without typical headers
    // But usually SNI format is strictly followed.

    const catLetter = categoryLetters[sIdx] || 'Z';
    const catName = `${catLetter}. ${sheetName.toUpperCase()}`;

    itemIndices.forEach((startIdx, i) => {
        const nextIdx = itemIndices[i + 1] || data.length;
        const rows = data.slice(startIdx, nextIdx);

        // Header info
        const nameRaw = String(rows[0][0]).trim();
        // Clean name (remove newlines)
        const name = nameRaw.replace(/\r?\n|\r/g, ' ');

        // Guess unit
        let unit = 'ls';
        if (name.includes(' m2') || name.includes(' m²')) unit = 'm²';
        else if (name.includes(' m3') || name.includes(' m³')) unit = 'm³';
        else if (name.includes(" m'")) unit = "m'";
        else if (name.includes(' kg')) unit = 'kg';
        else if (name.includes(' buah') || name.includes(' bh')) unit = 'bh';
        else if (name.includes(' titik')) unit = 'ttk';
        else if (name.includes(' unit')) unit = 'unit';

        const components = [];
        let section = 'unknown'; // upah, bahan, alat
        let compId = 1;

        // Start checking rows below header
        for (let r = 1; r < rows.length; r++) {
            const row = rows[r];
            if (!row || row.length < 3) continue;

            const col0 = String(row[0]).trim().toUpperCase();
            const col1 = String(row[1]).trim().toUpperCase();

            // Section detection
            if (col0.includes('TENAGA') || col1.includes('TENAGA')) { section = 'upah'; continue; }
            if (col0.includes('BAHAN') || col1.includes('BAHAN')) { section = 'bahan'; continue; }
            if (col0.includes('PERALATAN') || col1.includes('PERALATAN')) { section = 'alat'; continue; }
            if (col0.includes('JUMLAH') || col1.includes('JUMLAH')) break; // End of item

            // Valid component row? Needs Name (col1), Unit (col2), Coef (col3), Price (col4)
            // Sometimes: Col 1=Name, Col 2=Unit, Col 3=Coef, Col 4=Price
            // Just check if Col 3 is number (coef)
            const coef = parseFloat(row[3]);
            const price = parseFloat(row[4]);

            if (section !== 'unknown' && coef > 0 && price > 0) {
                components.push({
                    id: compId++,
                    type: section,
                    name: String(row[1] || row[0]).trim(),
                    unit: String(row[2]).trim(),
                    coefficient: coef,
                    unitPrice: price
                });
            }
        }

        if (components.length > 0) {
            allAHS.push({
                id: `ahs_${sheetName.substring(0, 5).replace(/\s/g, '')}_${startIdx}`,
                code: `${catLetter}.${i + 1}`,
                category: catName,
                name: name,
                unit: unit,
                components: components,
                isCustom: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
    });
});

console.log(`Parsed ${allAHS.length} AHS items.`);
fs.writeFileSync('src/data/defaultAHS.json', JSON.stringify(allAHS, null, 2));

console.log("Done! Files saved to src/data/");
