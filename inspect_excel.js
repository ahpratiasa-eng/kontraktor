
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = 'C:\\Users\\Nakise\\kontraktor-pro\\rab\\Book1.xlsx';

try {
    if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        process.exit(1);
    }

    const workbook = XLSX.readFile(filePath);
    console.log('Sheet Names:', workbook.SheetNames);

    workbook.SheetNames.forEach(sheetName => {
        console.log(`\n--- SHEET: ${sheetName} ---`);
        const sheet = workbook.Sheets[sheetName];
        // Get dimensions
        const range = XLSX.utils.decode_range(sheet['!ref']);
        console.log(`Range: ${sheet['!ref']} (Rows: ${range.e.r + 1}, Cols: ${range.e.c + 1})`);

        // Print first 50 rows as JSON to see structure
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', range: 0 });

        // Print first 50 rows
        rows.slice(0, 50).forEach((row, index) => {
            // Filter empty columns for cleaner output
            const r = row.map(c => String(c).trim()).filter(c => c.length > 0);
            if (r.length > 0) {
                console.log(`Row ${index + 1}:`, JSON.stringify(row));
            }
        });
    });

} catch (err) {
    console.error('Error reading file:', err);
}
