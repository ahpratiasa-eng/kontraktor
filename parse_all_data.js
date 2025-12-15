import XLSX from 'xlsx';
import fs from 'fs';

// Load Excel
console.log("Loading AHSP.xlsx...");
const wb = XLSX.readFile('AHSP.xlsx');

// --- PART 1: PARSE SUMBER DAYA DASAR ---
// Cari sheet yang namanya mengandung Upah/Bahan
const resourceSheets = wb.SheetNames.filter(name => {
    const n = name.toLowerCase();
    return n.includes('bahan') || n.includes('material') || n.includes('upah') || n.includes('tenaga') || n.includes('alat');
});

console.log(`Found Resource Sheets: ${resourceSheets.join(', ')}`);
const resources = [];

resourceSheets.forEach(sheetName => {
    console.log(`Processing Sheet: ${sheetName}`);
    const ws = wb.Sheets[sheetName];
    // header: 1 means getting array of arrays
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

    // Step 1: Find Header Row (Look for 'Satuan' and 'Harga', must be multi-column)
    let headerIdx = -1;
    for (let i = 0; i < 20; i++) {
        const row = data[i];
        if (row && row.length > 2 && row.some(c => String(c).toLowerCase().includes('satuan')) && row.some(c => String(c).toLowerCase().includes('harga'))) {
            headerIdx = i;
            break;
        }
    }

    if (headerIdx === -1) {
        console.log(`Header not found in sheet ${sheetName}`);
        return;
    }

    // Step 2: Map Columns
    const headerRow = data[headerIdx].map(x => String(x).toLowerCase());
    const idxUnit = headerRow.findIndex(h => h.includes('satuan'));
    const idxPrice = headerRow.findIndex(h => h.includes('harga'));
    // Infer Name column relative to Unit (usually 1 column before, or find 'uraian')
    let idxName = headerRow.findIndex(h => h.includes('uraian') || h.includes('nama'));
    if (idxName === -1) idxName = idxUnit - 1; // Fallback

    console.log(`Header found at row ${headerIdx}. Indices -> Name: ${idxName}, Unit: ${idxUnit}, Price: ${idxPrice}`);

    if (idxName === -1 || idxPrice === -1) {
        console.log("Critical columns missing (Name/Price)");
        return;
    }

    let currentCategory = 'UMUM';
    // Default type based on sheet name
    let defaultType = 'bahan';
    const sn = sheetName.toLowerCase();
    if (sn.includes('upah')) defaultType = 'upah';
    else if (sn.includes('alat')) defaultType = 'alat';

    for (let i = headerIdx + 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;

        // Clean values
        const valName = row[idxName];
        const valUnit = row[idxUnit];
        const valPrice = row[idxPrice];

        // LOGIC: CATEGORY ROW
        // Category rows usually have a value in Name column (or Name-1 column in some merges), but NO Price and NO Unit (or Unit is very short empty)
        // Example: ["I.", "UPAH"] -> idxName might be 1 ("UPAH"). idxPrice is 3 (undefined).

        // Normalize
        const nameStr = String(valName || '').trim();
        const unitStr = String(valUnit || '').trim();

        let priceNum = 0;
        if (typeof valPrice === 'number') priceNum = valPrice;
        else if (valPrice) priceNum = parseFloat(String(valPrice).replace(/[^0-9.]/g, ''));

        if (!nameStr) continue;

        // Is Category?
        // Criteria: Valid Name, No Unit (or very short), No Price
        if ((!priceNum || isNaN(priceNum)) && unitStr.length < 2) {
            // Check if it looks like Roman numeral or "A. "
            // Or just take it as category
            if (nameStr.length > 2) {
                // Remove leading numbering like "I. ", "A. "
                currentCategory = nameStr.replace(/^[IVX0-9A-Z]+\.\s*/, '').trim().toUpperCase();
                // console.log(`   > New Category: ${currentCategory}`);
            }
            continue;
        }

        // Is Item?
        if (priceNum > 0) {
            let type = defaultType;
            // Refine type based on Category keywords
            const cat = currentCategory.toLowerCase();
            const u = unitStr.toLowerCase();

            if (cat.includes('upah') || u === 'oh' || u === 'jam') type = 'upah';
            else if (cat.includes('alat') || u.includes('sewa')) type = 'alat';
            else if (cat.includes('bahan') || cat.includes('material')) type = 'bahan';

            // Push
            // Safe ID generation
            const cleanName = nameStr.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().slice(0, 40);
            if (cleanName.length < 2) continue;

            if (!resources.some(r => r.name === nameStr)) {
                resources.push({
                    id: `res_${cleanName}_${i}`,
                    name: nameStr,
                    unit: unitStr || 'ls',
                    price: priceNum,
                    type: type,
                    category: currentCategory,
                    source: sheetName
                });
            }
        }
    }
});

console.log(`Parsed ${resources.length} base resources.`);
fs.writeFileSync('src/data/defaultResources.json', JSON.stringify(resources, null, 2));


// --- PART 2: PARSE AHS ---
console.log("Parsing AHS...");
const allAHS = [];
const categoryLetters = 'ABCDEFGHIJKLMNOPQRSTUVW';

// Helper to detect work item (AHS Header)
const isAHSHeader = (str) => {
    if (!str || str.length < 15) return false;
    const s = str.toLowerCase();
    return (
        /pembuatan\s+\d/.test(s) || /pemasangan\s+\d/.test(s) || /penggalian\s+\d/.test(s) ||
        /pengurugan\s+\d/.test(s) || /pembongkaran\s+\d/.test(s) || /pengecatan\s+\d/.test(s) ||
        /pembersihan\s+/.test(s) || /\d\s*m[23']/.test(s)
    );
};

// Skip known non-AHS sheets
// We know "Upah Bahan" ... sheets are Resources.
// We exclude resource sheets from AHS parsing
const ahsSheets = wb.SheetNames.filter(n => !resourceSheets.includes(n));

ahsSheets.forEach((sheetName, sIdx) => {
    if (sheetName.toLowerCase().includes('sheet')) return;

    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

    const itemIndices = [];
    data.forEach((row, idx) => {
        if (row && row[0] && isAHSHeader(String(row[0]))) {
            itemIndices.push(idx);
        }
    });

    const catLetter = categoryLetters[sIdx] || 'Z';
    const catName = `${catLetter}. ${sheetName.toUpperCase()}`;

    itemIndices.forEach((startIdx, i) => {
        const nextIdx = itemIndices[i + 1] || data.length;
        const rows = data.slice(startIdx, nextIdx);

        const nameRaw = String(rows[0][0]).trim();
        const name = nameRaw.replace(/\r?\n|\r/g, ' ');

        let unit = 'ls';
        if (name.includes(' m2') || name.includes(' m²')) unit = 'm²';
        else if (name.includes(' m3') || name.includes(' m³')) unit = 'm³';
        else if (name.includes(" m'")) unit = "m'";
        else if (name.includes(' kg')) unit = 'kg';
        else if (name.includes(' buah') || name.includes(' bh')) unit = 'bh';
        else if (name.includes(' titik')) unit = 'ttk';

        const components = [];
        let section = 'unknown'; // upah, bahan, alat
        let compId = 1;

        for (let r = 1; r < rows.length; r++) {
            const row = rows[r];
            if (!row || row.length < 3) continue;

            const col0 = String(row[0]).trim().toUpperCase();
            const col1 = String(row[1]).trim().toUpperCase();

            if (col0.includes('TENAGA') || col1.includes('TENAGA')) { section = 'upah'; continue; }
            if (col0.includes('BAHAN') || col1.includes('BAHAN')) { section = 'bahan'; continue; }
            if (col0.includes('PERALATAN') || col1.includes('PERALATAN')) { section = 'alat'; continue; }
            if (col0.includes('JUMLAH') || col1.includes('JUMLAH')) break;

            // In AHS, Col 3 is usually Coef, Col 4 is Price
            // Data array is 0-indexed.
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
