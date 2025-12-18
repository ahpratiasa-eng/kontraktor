import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const path = require('path');

try {
    const filePath = path.join(process.cwd(), 'RAB.xlsx');
    console.log(`Scanning file: ${filePath}`);

    // Read slightly bigger output
    const wb = XLSX.readFile(filePath);

    console.log(`\nFound ${wb.SheetNames.length} sheets: ${wb.SheetNames.join(', ')}`);
    console.log('================================================================');

    wb.SheetNames.forEach(sheetName => {
        console.log(`\n📄 SHEET: "${sheetName}"`);
        console.log('----------------------------------------------------------------');

        const worksheet = wb.Sheets[sheetName];

        // Get dimensions
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
        console.log(`Dimensions: ${range.e.r + 1} rows x ${range.e.c + 1} columns`);

        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        // Print first 15 non-empty rows to understand structure
        let count = 0;
        json.forEach((row, i) => {
            if (count < 15 && row.length > 0 && row.some(cell => cell !== '' && cell !== null)) {
                console.log(`[Row ${i}]`, JSON.stringify(row));
                count++;
            }
        });
        console.log('...');
    });

} catch (error) {
    console.error('Error reading file:', error);
}
